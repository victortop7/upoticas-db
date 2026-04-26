import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureFinanceiroTables } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);

  const url = new URL(request.url);
  const now = new Date();
  const inicio = url.searchParams.get('inicio') || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const fim = url.searchParams.get('fim') || now.toISOString().split('T')[0];

  const [receitas, despesas, receitasDia, despesasDia] = await Promise.all([
    env.DB.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total, COUNT(*) as qtd
      FROM contas_receber
      WHERE tenant_id = ? AND situacao = 'recebido'
      AND data_recebimento BETWEEN ? AND ?
    `).bind(auth.tenant_id, inicio, fim).first<{ total: number; qtd: number }>(),

    env.DB.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total, COUNT(*) as qtd
      FROM contas_pagar
      WHERE tenant_id = ? AND situacao = 'pago'
      AND data_pagamento BETWEEN ? AND ?
    `).bind(auth.tenant_id, inicio, fim).first<{ total: number; qtd: number }>(),

    env.DB.prepare(`
      SELECT date(data_recebimento) as dia, COALESCE(SUM(valor), 0) as valor
      FROM contas_receber
      WHERE tenant_id = ? AND situacao = 'recebido'
      AND data_recebimento BETWEEN ? AND ?
      GROUP BY date(data_recebimento) ORDER BY dia ASC
    `).bind(auth.tenant_id, inicio, fim).all<{ dia: string; valor: number }>(),

    env.DB.prepare(`
      SELECT date(data_pagamento) as dia, COALESCE(SUM(valor), 0) as valor
      FROM contas_pagar
      WHERE tenant_id = ? AND situacao = 'pago'
      AND data_pagamento BETWEEN ? AND ?
      GROUP BY date(data_pagamento) ORDER BY dia ASC
    `).bind(auth.tenant_id, inicio, fim).all<{ dia: string; valor: number }>(),
  ]);

  const totalReceitas = receitas?.total || 0;
  const totalDespesas = despesas?.total || 0;

  return json({
    periodo: { inicio, fim },
    resumo: {
      receitas: totalReceitas,
      despesas: totalDespesas,
      resultado: totalReceitas - totalDespesas,
    },
    receitas_por_dia: receitasDia.results,
    despesas_por_dia: despesasDia.results,
  });
};
