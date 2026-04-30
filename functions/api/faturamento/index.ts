import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const situacao = url.searchParams.get('situacao');
    const cliente_id = url.searchParams.get('cliente_id');

    let query = `
      SELECT f.*, c.nome as cliente_nome,
        (SELECT COUNT(*) FROM fatura_itens fi WHERE fi.fatura_id = f.id) as total_itens
      FROM faturas f
      JOIN clientes c ON c.id = f.cliente_id
      WHERE f.tenant_id = ?
    `;
    const params: unknown[] = [tenant_id];

    if (situacao) { query += ' AND f.situacao = ?'; params.push(situacao); }
    if (cliente_id) { query += ' AND f.cliente_id = ?'; params.push(cliente_id); }

    query += ' ORDER BY f.created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();

    // Resumo financeiro
    const resumo = await env.DB.prepare(`
      SELECT
        SUM(CASE WHEN situacao = 'aberta' THEN valor_total ELSE 0 END) as a_receber,
        SUM(CASE WHEN situacao = 'paga' THEN valor_total ELSE 0 END) as recebido,
        SUM(CASE WHEN situacao = 'vencida' THEN valor_total ELSE 0 END) as vencido,
        COUNT(CASE WHEN situacao = 'aberta' THEN 1 END) as qtd_abertas,
        COUNT(CASE WHEN situacao = 'vencida' THEN 1 END) as qtd_vencidas
      FROM faturas WHERE tenant_id = ?
    `).bind(tenant_id).first<Record<string, number>>();

    return json({ faturas: result.results, resumo });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as {
      cliente_id: string;
      data_vencimento?: string;
      forma_pagamento?: string;
      observacao?: string;
      itens: { venda_id?: string; os_id?: string; descricao: string; valor: number }[];
    };

    if (!body.cliente_id) return json({ error: 'Cliente é obrigatório' }, 400);
    if (!body.itens?.length) return json({ error: 'Informe ao menos um item' }, 400);

    const numRow = await env.DB.prepare(
      'SELECT COALESCE(MAX(numero), 0) + 1 as next FROM faturas WHERE tenant_id = ?'
    ).bind(tenant_id).first<{ next: number }>();

    const id = crypto.randomUUID();
    const numero = numRow?.next ?? 1;
    const valor_total = body.itens.reduce((sum, i) => sum + i.valor, 0);

    const stmts = [
      env.DB.prepare(
        'INSERT INTO faturas (id, tenant_id, numero, cliente_id, valor_total, data_vencimento, forma_pagamento, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, tenant_id, numero, body.cliente_id, valor_total, body.data_vencimento ?? null, body.forma_pagamento ?? null, body.observacao ?? null),
      ...body.itens.map(item =>
        env.DB.prepare(
          'INSERT INTO fatura_itens (id, tenant_id, fatura_id, venda_id, os_id, descricao, valor) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), tenant_id, id, item.venda_id ?? null, item.os_id ?? null, item.descricao, item.valor)
      ),
    ];

    await env.DB.batch(stmts);
    return json({ id, numero }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
