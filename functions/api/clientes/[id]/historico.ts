import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const cliente = await env.DB.prepare(
    'SELECT id, nome FROM clientes WHERE id = ? AND tenant_id = ? AND ativo = 1'
  ).bind(params.id, auth.tenant_id).first<{ id: string; nome: string }>();

  if (!cliente) return json({ error: 'Cliente não encontrado' }, 404);

  const [os, vendas] = await Promise.all([
    env.DB.prepare(`
      SELECT id, numero, tipo, situacao, valor_total, valor_entrada, valor_restante,
             data_entrega, armacao_desc, lente_desc, created_at
      FROM ordens_servico
      WHERE cliente_id = ? AND tenant_id = ?
      ORDER BY numero DESC
    `).bind(params.id, auth.tenant_id).all(),

    env.DB.prepare(`
      SELECT id, numero, situacao, valor_total, desconto, valor_final,
             forma_pagamento, created_at
      FROM vendas
      WHERE cliente_id = ? AND tenant_id = ?
      ORDER BY numero DESC
    `).bind(params.id, auth.tenant_id).all(),
  ]);

  return json({
    cliente,
    os: os.results,
    vendas: vendas.results,
    totais: {
      os: os.results.length,
      vendas: vendas.results.length,
      gasto: (vendas.results as any[]).filter(v => v.situacao === 'ativa').reduce((s: number, v: any) => s + v.valor_final, 0),
    },
  });
};
