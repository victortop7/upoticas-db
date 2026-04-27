import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const busca = url.searchParams.get('busca') || '';
    const situacao = url.searchParams.get('situacao') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ?
    `;
    let countQuery = `
      SELECT COUNT(*) as total FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ?
    `;
    const params: unknown[] = [auth.tenant_id];

    if (busca) {
      const cond = ' AND (c.nome LIKE ? OR CAST(v.numero AS TEXT) LIKE ? OR v.forma_pagamento LIKE ?)';
      query += cond;
      countQuery += cond;
      const like = `%${busca}%`;
      params.push(like, like, like);
    }
    if (situacao) {
      query += ' AND v.situacao = ?';
      countQuery += ' AND v.situacao = ?';
      params.push(situacao);
    }

    query += ' ORDER BY v.numero DESC LIMIT ? OFFSET ?';

    // inclui nome do vendedor no retorno
    query = query.replace(
      'SELECT v.*',
      'SELECT v.*, u.nome as vendedor_nome, u.perfil as vendedor_perfil'
    ).replace(
      'FROM vendas v',
      'FROM vendas v LEFT JOIN usuarios u ON u.id = v.funcionario_id'
    );

    const [results, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params, limit, offset).all(),
      env.DB.prepare(countQuery).bind(...params).first<{ total: number }>(),
    ]);

    return json({
      vendas: results.results,
      total: countResult?.total || 0,
      page,
      pages: Math.ceil((countResult?.total || 0) / limit),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    const last = await env.DB.prepare(
      'SELECT MAX(numero) as max_num FROM vendas WHERE tenant_id = ?'
    ).bind(auth.tenant_id).first<{ max_num: number | null }>();
    const numero = (last?.max_num || 0) + 1;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const valorTotal = parseFloat(body.valor_total) || 0;
    const desconto = parseFloat(body.desconto) || 0;
    const valorFinal = valorTotal - desconto;

    await env.DB.prepare(`
      INSERT INTO vendas (id, tenant_id, numero, cliente_id, os_id, situacao,
        valor_total, desconto, valor_final, forma_pagamento, observacao, funcionario_id,
        created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, auth.tenant_id, numero,
      body.cliente_id || null,
      body.os_id || null,
      body.situacao || 'ativa',
      valorTotal, desconto, valorFinal,
      body.forma_pagamento || null,
      body.observacao || null,
      // admin pode atribuir a outro vendedor
      (auth.perfil === 'admin' && body.funcionario_id) ? body.funcionario_id : auth.usuario_id,
      now, now
    ).run();

    const venda = await env.DB.prepare(`
      SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?
    `).bind(id).first();
    return json(venda, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
