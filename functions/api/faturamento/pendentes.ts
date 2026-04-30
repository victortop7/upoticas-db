import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const cliente_id = url.searchParams.get('cliente_id');

    // Vendas ativas que não estão em nenhuma fatura
    let query = `
      SELECT v.id, v.numero, v.valor_final, v.forma_pagamento, v.created_at,
             c.id as cliente_id, c.nome as cliente_nome
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ?
        AND v.situacao = 'ativa'
        AND v.id NOT IN (SELECT venda_id FROM fatura_itens WHERE venda_id IS NOT NULL AND tenant_id = ?)
    `;
    const params: unknown[] = [tenant_id, tenant_id];

    if (cliente_id) { query += ' AND v.cliente_id = ?'; params.push(cliente_id); }

    query += ' ORDER BY c.nome ASC, v.created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
