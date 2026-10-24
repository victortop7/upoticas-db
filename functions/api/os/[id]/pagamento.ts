import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { recalcularFunil } from '../../../lib/crmFluxo';
import { registrarHistorico } from '../../../lib/clienteExtra';

// PUT /api/os/:id/pagamento { valor_pago }: corrige quanto o cliente já pagou desta OS (só ela muda)
const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    const os = await env.DB.prepare('SELECT id, numero, cliente_id, valor_total, COALESCE(valor_entrada, 0) AS valor_entrada, loja_id FROM ordens_servico WHERE id = ? AND tenant_id = ?')
      .bind(params.id, auth.tenant_id).first<{ id: string; numero: number; cliente_id: string | null; valor_total: number; valor_entrada: number; loja_id: string | null }>();
    if (!os) return json({ error: 'OS não encontrada' }, 404);
    if (auth.perfil !== 'admin' && auth.loja_id && os.loja_id && os.loja_id !== auth.loja_id) return json({ error: 'OS de outra loja' }, 403);
    const b = await request.json() as { valor_pago?: number | string };
    const pago = Math.round((parseFloat(String(b.valor_pago ?? '').replace(',', '.')) || 0) * 100) / 100;
    if (pago < 0) return json({ error: 'Valor inválido' }, 400);
    if (pago > (os.valor_total || 0) + 0.009) return json({ error: `O valor pago (${brl(pago)}) passa do total da OS (${brl(os.valor_total)}).` }, 400);
    const restante = Math.max(0, Math.round(((os.valor_total || 0) - pago) * 100) / 100);
    await env.DB.prepare(`UPDATE ordens_servico SET valor_entrada = ?, valor_restante = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`)
      .bind(pago, restante, os.id, auth.tenant_id).run();
    if (os.cliente_id) {
      try { await recalcularFunil(env.DB, auth.tenant_id, os.cliente_id); } catch { /* ok */ }
      await registrarHistorico(env.DB, {
        tenant: auth.tenant_id, clienteId: os.cliente_id, tipo: 'pagamento_editado', valor: pago, refId: os.id, usuarioId: auth.usuario_id,
        descricao: `Pagamento da OS ${os.numero} editado: pago ${brl(pago)} (antes ${brl(os.valor_entrada)}), falta ${brl(restante)}`,
      });
    }
    return json({ ok: true, pago, restante });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
