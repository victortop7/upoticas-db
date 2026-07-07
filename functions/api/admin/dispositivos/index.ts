import type { Env } from '../../../lib/types';
import { json } from '../../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

// GET /api/admin/dispositivos?tenant_id=xxx — lista os tablets registrados de uma conta
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  const tenantId = new URL(request.url).searchParams.get('tenant_id');
  if (!tenantId) return json({ error: 'tenant_id requerido' }, 400);
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, device_id, nome, ultimo_acesso, criado_em FROM dispositivos WHERE tenant_id = ? ORDER BY criado_em ASC'
    ).bind(tenantId).all();
    return json(results || []);
  } catch {
    return json([]); // tabela pode ainda não existir
  }
};

// DELETE /api/admin/dispositivos?id=xxx — remove um tablet (libera vaga)
// DELETE /api/admin/dispositivos?tenant_id=xxx&all=1 — remove todos os tablets da conta
export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const tenantId = url.searchParams.get('tenant_id');
  try {
    if (id) {
      await env.DB.prepare('DELETE FROM dispositivos WHERE id = ?').bind(id).run();
    } else if (tenantId) {
      await env.DB.prepare('DELETE FROM dispositivos WHERE tenant_id = ?').bind(tenantId).run();
    } else {
      return json({ error: 'id ou tenant_id requerido' }, 400);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro ao remover', detail: String(err) }, 500);
  }
};
