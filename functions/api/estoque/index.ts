import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { garantirCategorias, sqlBaixo } from '../../lib/estoque';
import { ensureEstoqueLojas, fonteEstoque, paramsFonte, movimentarEstoque, lojaDoMovimento, SQL_POR_LOJA } from '../../lib/estoqueLojas';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await garantirCategorias(env.DB, tenant_id);

    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const grupo = url.searchParams.get('grupo');
    const alerta = url.searchParams.get('alerta'); // só abaixo do mínimo
    const categoria = url.searchParams.get('categoria_id'); // 'sem' = sem categoria
    const sub = url.searchParams.get('subcategoria_id');
    const lojaQ = auth.perfil !== 'admin' && auth.loja_id ? auth.loja_id : (url.searchParams.get('loja_id') || '');
    await ensureEstoqueLojas(env.DB);

    let query = `
      SELECT
        e.id, e.produto_id, e.quantidade, e.quantidade_minima, e.quantidade_maxima,
        e.localizacao, e.updated_at,
        p.codigo, p.codigo_barras, p.descricao, p.grupo, p.unidade, p.preco_venda, p.preco_custo,
        p.categoria_id, p.subcategoria_id, sc.nome AS subcategoria_nome, COALESCE(p.generico, 0) AS generico,
        f.nome as fornecedor_nome,
        CASE WHEN ${sqlBaixo()} THEN 1 ELSE 0 END as abaixo_minimo,
        ${SQL_POR_LOJA} AS por_loja
      FROM ${fonteEstoque(lojaQ)} e
      JOIN produtos p ON p.id = e.produto_id
      LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
      LEFT JOIN estoque_categorias sc ON sc.id = p.subcategoria_id
      WHERE e.tenant_id = ? AND p.ativo = 1
    `;
    const params: unknown[] = [...paramsFonte(lojaQ), tenant_id];

    if (q) { query += ' AND (p.descricao LIKE ? OR p.codigo LIKE ? OR p.codigo_barras = ?)'; params.push(`%${q}%`, `%${q}%`, q); }
    let filtroCat = '';
    const paramsCat: unknown[] = [];
    if (categoria === 'sem') filtroCat = ' AND p.categoria_id IS NULL';
    else if (categoria) { filtroCat = ' AND p.categoria_id = ?'; paramsCat.push(categoria); }
    if (sub) { filtroCat += ' AND p.subcategoria_id = ?'; paramsCat.push(sub); }
    query += filtroCat; params.push(...paramsCat);
    if (grupo) { query += ' AND p.grupo = ?'; params.push(grupo); }
    if (alerta === '1') { query += ` AND ${sqlBaixo()}`; }

    query += ' ORDER BY abaixo_minimo DESC, p.descricao ASC';

    const result = await env.DB.prepare(query).bind(...params).all();

    const resumo = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_itens,
        SUM(CASE WHEN ${sqlBaixo()} THEN 1 ELSE 0 END) as abaixo_minimo,
        SUM(e.quantidade * p.preco_venda) as valor_total,
        SUM(e.quantidade) as pecas,
        SUM(e.quantidade * p.preco_custo) as custo_total
      FROM ${fonteEstoque(lojaQ)} e
      JOIN produtos p ON p.id = e.produto_id
      WHERE e.tenant_id = ? AND p.ativo = 1${filtroCat}
    `).bind(...paramsFonte(lojaQ), tenant_id, ...paramsCat).first<Record<string, number>>();

    return json({ itens: result.results, resumo });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST: registrar movimentação (entrada, saída, ajuste)
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
      loja_id?: string;
    };

    if (!body.produto_id || !body.tipo || body.quantidade == null) {
      return json({ error: 'produto_id, tipo e quantidade são obrigatórios' }, 400);
    }

    const r = await movimentarEstoque(env.DB, tenant_id, {
      produtoId: body.produto_id, lojaId: lojaDoMovimento(auth, body.loja_id), tipo: body.tipo, quantidade: Number(body.quantidade) || 0,
      motivo: body.motivo ?? null, documento: body.documento ?? null, fornecedorId: body.fornecedor_id ?? null, precoUnitario: body.preco_unitario ?? null,
      usuarioId: usuario_id, quantidadeMinima: body.quantidade_minima ?? null, localizacao: body.localizacao ?? null,
    });
    return json({ ok: true, quantidade_anterior: r.antes, quantidade_nova: r.depois });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
