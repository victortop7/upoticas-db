import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const produto_id = url.searchParams.get('produto_id');
    const tipo = url.searchParams.get('tipo');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let query = `
      SELECT
        m.*, p.descricao as produto_desc, p.codigo as produto_codigo,
        u.nome as usuario_nome, f.nome as fornecedor_nome
      FROM estoque_movimentacoes m
      JOIN produtos p ON p.id = m.produto_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      LEFT JOIN fornecedores f ON f.id = m.fornecedor_id
      WHERE m.tenant_id = ?
    `;
    const params: unknown[] = [tenant_id];

    if (produto_id) { query += ' AND m.produto_id = ?'; params.push(produto_id); }
    if (tipo) { query += ' AND m.tipo = ?'; params.push(tipo); }

    query += ` ORDER BY m.created_at DESC LIMIT ${limit}`;

    const result = await env.DB.prepare(query).bind(...params).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
