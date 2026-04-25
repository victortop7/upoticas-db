import { verifyJWT } from './jwt';
import type { Env } from './types';

export interface AuthData {
  usuario_id: string;
  tenant_id: string;
  email: string;
  perfil: string;
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

  return payload as unknown as AuthData;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
