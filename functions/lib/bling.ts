import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from './types';

// Base da API v3 do Bling
export const BLING_BASE = 'https://www.bling.com.br/Api/v3';

// Garante as colunas de token do Bling na tabela tenants (por loja).
export async function ensureBlingCols(db: D1Database) {
  for (const c of ['bling_access_token TEXT', 'bling_refresh_token TEXT', 'bling_token_expira TEXT']) {
    try { await db.prepare(`ALTER TABLE tenants ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
}

function basicAuth(env: Env): string {
  return 'Basic ' + btoa(`${env.BLING_CLIENT_ID || ''}:${env.BLING_CLIENT_SECRET || ''}`);
}

// URL de autorização (o usuário aprova o app no Bling e volta com ?code=)
export function blingAuthorizeUrl(env: Env, state: string, redirectUri: string): string {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: env.BLING_CLIENT_ID || '',
    state,
    redirect_uri: redirectUri,
  });
  return `${BLING_BASE}/oauth/authorize?${p.toString()}`;
}

// Troca o authorization_code por access_token + refresh_token
export async function blingExchangeCode(env: Env, code: string, redirectUri: string): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  const r = await fetch(`${BLING_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': basicAuth(env),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });
  return r.json() as Promise<Record<string, unknown>>;
}

// Renova o access_token usando o refresh_token
export async function blingRefresh(env: Env, refreshToken: string): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
  const r = await fetch(`${BLING_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': basicAuth(env),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });
  return r.json() as Promise<Record<string, unknown>>;
}

// Retorna um access_token válido para o tenant (renova sozinho se estiver perto de expirar).
// null = loja ainda não conectou o Bling.
export async function blingGetToken(env: Env, tenantId: string): Promise<string | null> {
  await ensureBlingCols(env.DB);
  const t = await env.DB.prepare(
    'SELECT bling_access_token, bling_refresh_token, bling_token_expira FROM tenants WHERE id = ?'
  ).bind(tenantId).first<{ bling_access_token: string | null; bling_refresh_token: string | null; bling_token_expira: string | null }>();
  if (!t || !t.bling_refresh_token) return null;

  const agora = Date.now();
  const exp = t.bling_token_expira ? Date.parse(t.bling_token_expira) : 0;
  // Reaproveita o token atual se faltar mais de 60s pra expirar
  if (t.bling_access_token && exp - 60_000 > agora) return t.bling_access_token;

  const data = await blingRefresh(env, t.bling_refresh_token);
  const access = data.access_token as string | undefined;
  if (!access) return null;
  const novoExp = new Date(agora + (Number(data.expires_in) || 3600) * 1000).toISOString();
  await env.DB.prepare(
    'UPDATE tenants SET bling_access_token = ?, bling_refresh_token = ?, bling_token_expira = ? WHERE id = ?'
  ).bind(access, (data.refresh_token as string) || t.bling_refresh_token, novoExp, tenantId).run();
  return access;
}

// Chamada autenticada à API do Bling para um tenant. Lança se a loja não estiver conectada.
export async function blingFetch(env: Env, tenantId: string, path: string, init: RequestInit = {}): Promise<Response> {
  const token = await blingGetToken(env, tenantId);
  if (!token) throw new Error('BLING_NAO_CONECTADO');
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return fetch(`${BLING_BASE}${path}`, { ...init, headers });
}
