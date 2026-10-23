import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureEstoque } from '../../lib/estoque';

// Modo "por quantidade": cada material da categoria (ex.: Armação Conceito › Metal) é um
// produto genérico só com quantidade. É ele que a vendedora escolhe na venda (baixa automática)
// e que vai na nota do Bling como "ARMAÇÃO CONCEITO METAL".

async function produtoGenerico(env: Env, tenant: string, categoriaId: string, subId: string | null, precos?: { venda?: number; custo?: number }) {
  const cat = await env.DB.prepare('SELECT id, nome FROM estoque_categorias WHERE id = ? AND tenant_id = ? AND parent_id IS NULL').bind(categoriaId, tenant).first<{ id: string; nome: string }>();
  if (!cat) return null;
  let subNome = '';
  if (subId) {
    const s = await env.DB.prepare('SELECT nome FROM estoque_categorias WHERE id = ? AND tenant_id = ? AND parent_id = ?').bind(subId, tenant, categoriaId).first<{ nome: string }>();
    if (!s) return null;
    subNome = s.nome;
  }
  const achado = await env.DB.prepare(
    `SELECT id, descricao FROM produtos WHERE tenant_id = ? AND ativo = 1 AND generico = 1 AND categoria_id = ? AND COALESCE(subcategoria_id, '') = ? LIMIT 1`
  ).bind(tenant, categoriaId, subId || '').first<{ id: string; descricao: string }>();
  if (achado) return achado;
  const id = crypto.randomUUID();
  const descricao = `${cat.nome} ${subNome}`.trim();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO produtos (id, tenant_id, codigo, descricao, grupo, unidade, preco_custo, preco_venda, categoria_id, subcategoria_id, generico)
       VALUES (?, ?, NULL, ?, ?, 'UN', ?, ?, ?, ?, 1)`
    ).bind(id, tenant, descricao, cat.nome, precos?.custo || 0, precos?.venda || 0, categoriaId, subId),
    env.DB.prepare('INSERT INTO estoque (id, tenant_id, produto_id, quantidade, quantidade_minima) VALUES (?, ?, ?, 0, 0)').bind(crypto.randomUUID(), tenant, id),
  ]);
  return { id, descricao };
}

// POST /api/estoque/quantidade
//   { categoria_id, subcategoria_id?, tipo: 'entrada'|'saida'|'ajuste', quantidade, preco_venda?, preco_custo?, quantidade_minima?, motivo?, documento? }
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureEstoque(env.DB);
    const b = await request.json() as {
      categoria_id?: string; subcategoria_id?: string | null; tipo?: string; quantidade?: number;
      preco_venda?: number; preco_custo?: number; quantidade_minima?: number; motivo?: string; documento?: string;
    };
    if (!b.categoria_id) return json({ error: 'categoria_id obrigatório' }, 400);
    const tipo = b.tipo === 'saida' ? 'saida' : b.tipo === 'ajuste' ? 'ajuste' : 'entrada';
    const qtd = Math.round(Number(b.quantidade) || 0);
    if (tipo !== 'ajuste' && qtd <= 0) return json({ error: 'Informe a quantidade' }, 400);
    if (tipo === 'ajuste' && qtd < 0) return json({ error: 'Quantidade inválida' }, 400);

    const p = await produtoGenerico(env, auth.tenant_id, b.categoria_id, b.subcategoria_id || null, { venda: Number(b.preco_venda) || 0, custo: Number(b.preco_custo) || 0 });
    if (!p) return json({ error: 'Categoria ou material não encontrado' }, 404);

    // preço padrão / mínimo (opcionais)
    if (b.preco_venda !== undefined || b.preco_custo !== undefined) {
      await env.DB.prepare('UPDATE produtos SET preco_venda = COALESCE(?, preco_venda), preco_custo = COALESCE(?, preco_custo) WHERE id = ? AND tenant_id = ?')
        .bind(b.preco_venda !== undefined ? Number(b.preco_venda) || 0 : null, b.preco_custo !== undefined ? Number(b.preco_custo) || 0 : null, p.id, auth.tenant_id).run();
    }
    if (b.quantidade_minima !== undefined) {
      await env.DB.prepare('UPDATE estoque SET quantidade_minima = ? WHERE produto_id = ? AND tenant_id = ?').bind(Math.max(0, Number(b.quantidade_minima) || 0), p.id, auth.tenant_id).run();
    }
    if (!qtd && tipo !== 'ajuste') return json({ ok: true, produto: p });

    const atual = await env.DB.prepare('SELECT quantidade FROM estoque WHERE produto_id = ? AND tenant_id = ?').bind(p.id, auth.tenant_id).first<{ quantidade: number }>();
    const antes = Number(atual?.quantidade ?? 0);
    const depois = tipo === 'entrada' ? antes + qtd : tipo === 'saida' ? antes - qtd : qtd;
    await env.DB.batch([
      env.DB.prepare("UPDATE estoque SET quantidade = ?, updated_at = datetime('now') WHERE produto_id = ? AND tenant_id = ?").bind(depois, p.id, auth.tenant_id),
      env.DB.prepare(
        `INSERT INTO estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, quantidade_anterior, quantidade_nova, motivo, documento, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), auth.tenant_id, p.id, tipo, tipo === 'ajuste' ? qtd : qtd, antes, depois,
        (b.motivo || '').trim() || (tipo === 'entrada' ? 'Entrada' : tipo === 'saida' ? 'Saída manual' : 'Contagem / ajuste'), (b.documento || '').trim() || null, auth.usuario_id),
    ]);
    return json({ ok: true, produto: p, antes, depois });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// GET /api/estoque/quantidade?categoria_id=&subcategoria_id=
// Usado na venda: devolve o produto genérico do material (cria se ainda não existir) e quanto tem.
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureEstoque(env.DB);
    const url = new URL(request.url);
    const cat = url.searchParams.get('categoria_id') || '';
    if (!cat) return json({ error: 'categoria_id obrigatório' }, 400);
    const p = await produtoGenerico(env, auth.tenant_id, cat, url.searchParams.get('subcategoria_id') || null);
    if (!p) return json({ error: 'Categoria ou material não encontrado' }, 404);
    const r = await env.DB.prepare(
      `SELECT p.id, p.descricao, p.preco_venda, COALESCE(e.quantidade, 0) AS quantidade
       FROM produtos p LEFT JOIN estoque e ON e.produto_id = p.id AND e.tenant_id = p.tenant_id
       WHERE p.id = ? AND p.tenant_id = ?`
    ).bind(p.id, auth.tenant_id).first<{ id: string; descricao: string; preco_venda: number; quantidade: number }>();
    return json({ produto: r });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
