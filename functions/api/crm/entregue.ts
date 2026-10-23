import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { marcarEntregue } from '../../lib/crmFluxo';

// POST /api/crm/entregue  { cliente_id }
// Botão "Entregue" do Funil: marca as compras do cliente como entregues (e as OS ligadas).
// O cliente sai de Óculos Pronto/Pendente; 20 dias depois aparece em Pós-venda.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    const b = await request.json() as { cliente_id?: string };
    if (!b.cliente_id) return json({ error: 'cliente_id obrigatório' }, 400);
    const c = await env.DB.prepare('SELECT id FROM clientes WHERE id = ? AND tenant_id = ?').bind(b.cliente_id, auth.tenant_id).first();
    if (!c) return json({ error: 'Cliente não encontrado' }, 404);
    await marcarEntregue(env.DB, auth.tenant_id, b.cliente_id);
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
