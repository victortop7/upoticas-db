import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureMarketingTables } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureMarketingTables(env.DB);

  const url = new URL(request.url);
  const tipo = url.searchParams.get('tipo') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 30;
  const offset = (page - 1) * limit;

  let where = 'WHERE tenant_id = ?';
  const params: unknown[] = [auth.tenant_id];
  if (tipo) { where += ' AND tipo = ?'; params.push(tipo); }

  const [rows, count] = await Promise.all([
    env.DB.prepare(`SELECT * FROM marketing_historico ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as n FROM marketing_historico ${where}`)
      .bind(...params).first<{ n: number }>(),
  ]);

  return json({ historico: rows.results, total: count?.n || 0, pages: Math.ceil((count?.n || 0) / limit) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureMarketingTables(env.DB);

  const body = await request.json() as Record<string, string>;
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO marketing_historico (id, tenant_id, campanha_id, cliente_id, cliente_nome, celular, mensagem, tipo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.campanha_id || null, body.cliente_id || null, body.cliente_nome || null,
    body.celular, body.mensagem, body.tipo || 'avulso', new Date().toISOString()).run();

  return json({ id }, 201);
};
