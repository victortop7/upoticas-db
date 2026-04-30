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
    const alerta = url.searchParams.get('alerta'); // só abaixo do mínimo

    let query = `
      SELECT
        e.id, e.produto_id, e.quantidade, e.quantidade_minima, e.quantidade_maxima,
        e.localizacao, e.updated_at,
        p.codigo, p.descricao, p.grupo, p.unidade, p.preco_venda,
        f.nome as fornecedor_nome,
        CASE WHEN e.quantidade <= e.quantidade_minima THEN 1 ELSE 0 END as abaixo_minimo
      FROM estoque e
      JOIN produtos p ON p.id = e.produto_id
      LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
      WHERE e.tenant_id = ? AND p.ativo = 1
    `;
    const params: unknown[] = [tenant_id];

    if (q) { query += ' AND (p.descricao LIKE ? OR p.codigo LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (grupo) { query += ' AND p.grupo = ?'; params.push(grupo); }
    if (alerta === '1') { query += ' AND e.quantidade <= e.quantidade_minima'; }

    query += ' ORDER BY abaixo_minimo DESC, p.descricao ASC';

    const result = await env.DB.prepare(query).bind(...params).all();

    const resumo = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_itens,
        SUM(CASE WHEN e.quantidade <= e.quantidade_minima THEN 1 ELSE 0 END) as abaixo_minimo,
        SUM(e.quantidade * p.preco_venda) as valor_total
      FROM estoque e
      JOIN produtos p ON p.id = e.produto_id
      WHERE e.tenant_id = ? AND p.ativo = 1
    `).bind(tenant_id).first<Record<string, number>>();

    return json({ itens: result.results, resumo });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST — registrar movimentação (entrada, saída, ajuste)
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id, usuario_id } = auth;

    const body = await request.json() as {
      produto_id: string;
      tipo: 'entrada' | 'saida' | 'ajuste';
      quantidade: number;
      motivo?: string;
      documento?: string;
      fornecedor_id?: string;
      preco_unitario?: number;
      quantidade_minima?: number;
      localizacao?: string;
    };

    if (!body.produto_id || !body.tipo || body.quantidade == null) {
      return json({ error: 'produto_id, tipo e quantidade são obrigatórios' }, 400);
    }

    // Buscar estoque atual (cria se não existir)
    let estoqueAtual = await env.DB.prepare(
      'SELECT * FROM estoque WHERE produto_id = ? AND tenant_id = ?'
    ).bind(body.produto_id, tenant_id).first<{ id: string; quantidade: number; quantidade_minima: number }>();

    const qtdAnterior = estoqueAtual?.quantidade ?? 0;
    let qtdNova: number;

    if (body.tipo === 'entrada') qtdNova = qtdAnterior + body.quantidade;
    else if (body.tipo === 'saida') qtdNova = Math.max(0, qtdAnterior - body.quantidade);
    else qtdNova = body.quantidade; // ajuste direto

    const movId = crypto.randomUUID();
    const stmts = [];

    if (!estoqueAtual) {
      const estoqueId = crypto.randomUUID();
      stmts.push(env.DB.prepare(
        "INSERT INTO estoque (id, tenant_id, produto_id, quantidade, quantidade_minima, localizacao) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(estoqueId, tenant_id, body.produto_id, qtdNova, body.quantidade_minima ?? 0, body.localizacao ?? null));
    } else {
      stmts.push(env.DB.prepare(
        "UPDATE estoque SET quantidade=?, quantidade_minima=COALESCE(?, quantidade_minima), localizacao=COALESCE(?, localizacao), updated_at=datetime('now') WHERE produto_id=? AND tenant_id=?"
      ).bind(qtdNova, body.quantidade_minima ?? null, body.localizacao ?? null, body.produto_id, tenant_id));
    }

    stmts.push(env.DB.prepare(
      'INSERT INTO estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, quantidade_anterior, quantidade_nova, motivo, documento, fornecedor_id, preco_unitario, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(movId, tenant_id, body.produto_id, body.tipo, body.quantidade, qtdAnterior, qtdNova, body.motivo ?? null, body.documento ?? null, body.fornecedor_id ?? null, body.preco_unitario ?? null, usuario_id));

    await env.DB.batch(stmts);

    return json({ ok: true, quantidade_anterior: qtdAnterior, quantidade_nova: qtdNova });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
