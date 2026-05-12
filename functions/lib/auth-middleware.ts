import { verifyJWT } from './jwt';
import type { Env } from './types';

export interface AuthData {
  usuario_id: string;
  tenant_id: string;
  email: string;
  perfil: string;
}

function licenseBlock(error: string, blocked = false, expired = false): Response {
  return new Response(JSON.stringify({ error, blocked, expired }), {
    status: blocked ? 403 : 402,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function requireAuth(request: Request, env: Env): Promise<AuthData | Response> {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/up_token=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = payload as unknown as AuthData;

  // Check tenant license
  try {
    const tenant = await env.DB.prepare(
      `SELECT ativo,
              COALESCE(bloqueado, 0)   AS bloqueado,
              plano,
              trial_expira,
              licenca_expira
       FROM tenants WHERE id = ?`
    ).bind(auth.tenant_id)
      .first<{ ativo: number; bloqueado: number; plano: string; trial_expira: string | null; licenca_expira: string | null }>();

    if (!tenant || !tenant.ativo) {
      return licenseBlock('Conta desativada. Entre em contato para regularizar.', true);
    }

    if (tenant.bloqueado) {
      return licenseBlock('Acesso bloqueado. Entre em contato para regularizar.', true);
    }

    const now = new Date().toISOString();

    if (tenant.plano === 'trial' && tenant.trial_expira && tenant.trial_expira < now) {
      return licenseBlock('Período de teste expirado. Adquira uma licença para continuar.', false, true);
    }

    if (tenant.plano !== 'trial' && tenant.licenca_expira && tenant.licenca_expira < now) {
      return licenseBlock('Licença expirada. Renove para continuar usando o sistema.', false, true);
    }
  } catch {
    // Colunas novas ainda não existem — permite acesso (migração pendente)
  }

  return auth;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
