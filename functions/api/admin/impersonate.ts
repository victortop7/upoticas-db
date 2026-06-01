import type { Env } from '../../lib/types';
import { signJWT } from '../../lib/jwt';
import { json } from '../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

// POST /api/admin/impersonate — entra no sistema como um tenant
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json() as { tenant_id: string };
    if (!body.tenant_id) return json({ error: 'tenant_id obrigatório' }, 400);

    // Busca o usuário admin do tenant
    const usuario = await env.DB.prepare(
      `SELECT u.*, t.nome as tenant_nome, t.tipo as tenant_tipo
       FROM usuarios u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.tenant_id = ? AND u.ativo = 1
       ORDER BY CASE u.perfil WHEN 'admin' THEN 0 ELSE 1 END
       LIMIT 1`
    ).bind(body.tenant_id).first<Record<string, unknown>>();

    if (!usuario) return json({ error: 'Nenhum usuário ativo encontrado para este tenant' }, 404);

    const token = await signJWT({
      usuario_id: usuario.id,
      tenant_id: usuario.tenant_id,
      email: usuario.email,
      perfil: usuario.perfil,
    }, env.JWT_SECRET);

    const response = json({ ok: true, tipo: usuario.tenant_tipo });
    const headers = new Headers(response.headers);
    headers.set('Set-Cookie', `up_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${86400 * 7}`);

    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
