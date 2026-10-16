import type { Env } from '../../lib/types';
import { json } from '../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth.replace(/^Bearer\s+/i, '').trim() === env.ADMIN_SECRET.trim();
}

// GET /api/admin/usuarios?tenant_id=xxx — usuários de uma conta (sem senha)
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  const tenantId = new URL(request.url).searchParams.get('tenant_id');
  if (!tenantId) return json({ error: 'tenant_id obrigatório' }, 400);
  try {
    const r = await env.DB.prepare(
      'SELECT id, nome, email, perfil, ativo FROM usuarios WHERE tenant_id = ? ORDER BY perfil = \'admin\' DESC, nome ASC'
    ).bind(tenantId).all();
    return json(r.results || []);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
