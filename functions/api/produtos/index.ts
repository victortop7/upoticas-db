import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const grupo = url.searchParams.get('grupo');

    let query = `
      SELECT p.*, f.nome as fornecedor_nome
      FROM produtos p
      LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
      WHERE p.tenant_id = ? AND p.ativo = 1
    `;
    const params: unknown[] = [tenant_id];

    if (q) {
      query += ' AND (p.descricao LIKE ? OR p.codigo LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (grupo) {
      query += ' AND p.grupo = ?';
      params.push(grupo);
    }

    query += ' ORDER BY p.descricao ASC';
    const result = await env.DB.prepare(query).bind(...params).all();

    // Buscar grupos distintos para filtro
    const grupos = await env.DB.prepare(
      'SELECT DISTINCT grupo FROM produtos WHERE tenant_id = ? AND ativo = 1 AND grupo IS NOT NULL ORDER BY grupo ASC'
    ).bind(tenant_id).all<{ grupo: string }>();

    return json({ produtos: result.results, grupos: grupos.results.map(g => g.grupo) });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as Record<string, string | number>;
    if (!String(body.descricao || '').trim()) return json({ error: 'Descrição é obrigatória' }, 400);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO produtos (id, tenant_id, codigo, descricao, grupo, unidade, preco_custo, preco_venda, fornecedor_id, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, tenant_id,
      body.codigo || null,
      String(body.descricao).trim(),
      body.grupo || null,
      body.unidade || 'UN',
      Number(body.preco_custo) || 0,
      Number(body.preco_venda) || 0,
      body.fornecedor_id || null,
      body.observacao || null,
    ).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
