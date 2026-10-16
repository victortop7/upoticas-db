import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { gerarRecorrentes, hojeSP } from '../../../lib/recorrentes';

// GET /api/financeiro/contas-pagar/resumo — para o Painel: vencidas + vencendo nos próximos 7 dias
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    try { await gerarRecorrentes(env.DB, auth.tenant_id); } catch { /* segue */ }
    const hoje = hojeSP();
    const lim = new Date(`${hoje}T12:00:00Z`); lim.setUTCDate(lim.getUTCDate() + 7);
    const ate = lim.toISOString().slice(0, 10);
    const r = await env.DB.prepare(
      `SELECT cp.id, cp.descricao, cp.fornecedor, cp.valor, cp.data_vencimento, cp.recorrente_id, cr.fixa AS rec_fixa
       FROM contas_pagar cp LEFT JOIN contas_recorrentes cr ON cr.id = cp.recorrente_id
       WHERE cp.tenant_id = ? AND cp.situacao IN ('pendente','vencido') AND cp.data_vencimento <= ?
       ORDER BY cp.data_vencimento ASC LIMIT 50`
    ).bind(auth.tenant_id, ate).all<Record<string, unknown>>();
    const lista = r.results || [];
    const vencidas = lista.filter(c => String(c.data_vencimento) < hoje);
    const proximas = lista.filter(c => String(c.data_vencimento) >= hoje);
    const soma = (l: Record<string, unknown>[]) => l.reduce((s, c) => s + Number(c.valor || 0), 0);
    return json({
      hoje,
      vencidas: { qtd: vencidas.length, total: soma(vencidas) },
      proximas: { qtd: proximas.length, total: soma(proximas) },
      contas: lista.slice(0, 8),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
