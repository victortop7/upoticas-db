import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensurePagamentos, normalizarLinhas, recebidoDasLinhas, formaResumo, salvarPagamentos } from '../../../lib/pagamentos';
import { recalcularFunil } from '../../../lib/crmFluxo';
import { registrarHistorico } from '../../../lib/clienteExtra';

// Pagamentos de UMA venda (o que o cliente já pagou dela). Editar aqui não mexe nas outras compras do cliente.
type Ctx = { request: Request; env: Env; params: { id: string } };
interface VendaRow { id: string; numero: number; created_at: string; valor_final: number; valor_entrada: number; saldo_restante: number; situacao: string; cliente_id: string | null; cliente_nome: string | null; forma_pagamento: string | null; loja_id: string | null }
const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function carregar(env: Env, tenant: string, id: string) {
  return env.DB.prepare(
    `SELECT v.id, v.numero, v.created_at, v.valor_final, COALESCE(v.valor_entrada, 0) AS valor_entrada, COALESCE(v.saldo_restante, 0) AS saldo_restante,
            v.situacao, v.cliente_id, c.nome AS cliente_nome, v.forma_pagamento, v.loja_id
     FROM vendas v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ? AND v.tenant_id = ?`
  ).bind(id, tenant).first<VendaRow>();
}

export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensurePagamentos(env.DB);
  const v = await carregar(env, auth.tenant_id, params.id);
  if (!v) return json({ error: 'Venda não encontrada' }, 404);
  const r = await env.DB.prepare('SELECT id, forma, valor, bandeira, parcelas, data_recebimento, conta FROM venda_pagamentos WHERE venda_id = ? AND tenant_id = ? ORDER BY COALESCE(data_recebimento, created_at), rowid')
    .bind(v.id, auth.tenant_id).all<Record<string, unknown>>();
  let linhas = r.results || [];
  // venda antiga sem linhas: mostra a entrada como uma linha só
  if (!linhas.length && v.valor_entrada > 0) {
    linhas = [{ id: null, forma: v.forma_pagamento && v.forma_pagamento !== 'misto' ? v.forma_pagamento : 'outro', valor: v.valor_entrada, data_recebimento: String(v.created_at).slice(0, 10) }];
  }
  return json({ venda: v, linhas });
};

// PUT { linhas: [{ forma, valor, data_recebimento, bandeira?, parcelas?, conta? }] }
// Linhas de boleto/carnê continuam como estão (o carnê tem as parcelas dele).
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensurePagamentos(env.DB);
    const v = await carregar(env, auth.tenant_id, params.id);
    if (!v) return json({ error: 'Venda não encontrada' }, 404);
    if (auth.perfil !== 'admin' && auth.loja_id && v.loja_id && v.loja_id !== auth.loja_id) return json({ error: 'Venda de outra loja' }, 403);

    const body = await request.json() as { linhas?: unknown };
    const novas = (normalizarLinhas(body.linhas) || []).filter(l => l.forma !== 'boleto');
    const boletos = await env.DB.prepare("SELECT forma, valor, bandeira, parcelas, data_recebimento, conta FROM venda_pagamentos WHERE venda_id = ? AND tenant_id = ? AND forma = 'boleto'")
      .bind(v.id, auth.tenant_id).all<{ forma: string; valor: number; bandeira: string | null; parcelas: number | null; data_recebimento: string | null; conta: string | null }>();
    const todas = [...(boletos.results || []), ...novas];

    const pago = recebidoDasLinhas(novas);
    if (pago > v.valor_final + 0.009) return json({ error: `Os pagamentos (${brl(pago)}) passam do valor da venda (${brl(v.valor_final)}).` }, 400);
    const saldo = Math.max(0, Math.round((v.valor_final - pago) * 100) / 100);
    const situacao = v.situacao === 'cancelada' ? 'cancelada' : saldo > 0 ? 'pendente' : 'ativa';

    await salvarPagamentos(env.DB, auth.tenant_id, v.id, todas);
    await env.DB.prepare(`UPDATE vendas SET valor_entrada = ?, saldo_restante = ?, situacao = ?, forma_pagamento = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`)
      .bind(pago, saldo, situacao, formaResumo(todas, v.forma_pagamento), v.id, auth.tenant_id).run();

    if (v.cliente_id) {
      try { await recalcularFunil(env.DB, auth.tenant_id, v.cliente_id); } catch { /* ok */ }
      await registrarHistorico(env.DB, {
        tenant: auth.tenant_id, clienteId: v.cliente_id, tipo: 'pagamento_editado', valor: pago, refId: v.id, usuarioId: auth.usuario_id,
        descricao: `Pagamento da venda #${v.numero} editado: pago ${brl(pago)} (antes ${brl(v.valor_entrada)}), falta ${brl(saldo)}`,
      });
    }
    return json({ ok: true, pago, saldo, situacao });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
