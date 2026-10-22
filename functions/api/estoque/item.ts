import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureEstoque } from '../../lib/estoque';

async function nomeCategoria(env: Env, tenant: string, id?: string | null) {
  if (!id) return null;
  const c = await env.DB.prepare('SELECT nome FROM estoque_categorias WHERE id = ? AND tenant_id = ?').bind(id, tenant).first<{ nome: string }>();
  return c?.nome ?? null;
}

// POST /api/estoque/item: cadastra o produto já dentro da categoria/subcategoria e com a quantidade inicial
//   { descricao, codigo?, codigo_barras?, categoria_id, subcategoria_id?, preco_custo?, preco_venda?, quantidade?, quantidade_minima?, localizacao? }
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureEstoque(env.DB);
    const b = await request.json() as Record<string, string | number | null>;
    const descricao = String(b.descricao || '').trim();
    if (!descricao) return json({ error: 'Informe a descrição' }, 400);
    const cb = String(b.codigo_barras || '').trim() || null;
    if (cb) {
      const dup = await env.DB.prepare('SELECT descricao FROM produtos WHERE tenant_id = ? AND ativo = 1 AND codigo_barras = ?').bind(auth.tenant_id, cb).first<{ descricao: string }>();
      if (dup) return json({ error: `Esse código de barras já é do produto "${dup.descricao}"` }, 409);
    }
    const grupo = await nomeCategoria(env, auth.tenant_id, b.categoria_id as string);
    const pid = crypto.randomUUID();
    const qtd = Number(b.quantidade) || 0;
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO produtos (id, tenant_id, codigo, codigo_barras, descricao, grupo, unidade, preco_custo, preco_venda, categoria_id, subcategoria_id)
         VALUES (?, ?, ?, ?, ?, ?, 'UN', ?, ?, ?, ?)`
      ).bind(pid, auth.tenant_id, String(b.codigo || '').trim() || null, cb, descricao, grupo,
        Number(b.preco_custo) || 0, Number(b.preco_venda) || 0, b.categoria_id || null, b.subcategoria_id || null),
      env.DB.prepare('INSERT INTO estoque (id, tenant_id, produto_id, quantidade, quantidade_minima, localizacao) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), auth.tenant_id, pid, qtd, Number(b.quantidade_minima) || 0, String(b.localizacao || '').trim() || null),
      env.DB.prepare(
        `INSERT INTO estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, quantidade_anterior, quantidade_nova, motivo, usuario_id)
         VALUES (?, ?, ?, 'entrada', ?, 0, ?, 'Cadastro inicial', ?)`
      ).bind(crypto.randomUUID(), auth.tenant_id, pid, qtd, qtd, auth.usuario_id),
    ]);
    return json({ id: pid }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PATCH /api/estoque/item: muda o produto de categoria/subcategoria (e opcionalmente mínimo/localização)
//   { produto_id, categoria_id, subcategoria_id?, quantidade_minima?, localizacao? }
export const onRequestPatch = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureEstoque(env.DB);
    const b = await request.json() as { produto_id?: string; categoria_id?: string | null; subcategoria_id?: string | null; quantidade_minima?: number; localizacao?: string };
    if (!b.produto_id) return json({ error: 'produto_id obrigatório' }, 400);
    const grupo = await nomeCategoria(env, auth.tenant_id, b.categoria_id);
    const stmts = [
      env.DB.prepare('UPDATE produtos SET categoria_id = ?, subcategoria_id = ?, grupo = COALESCE(?, grupo), updated_at = datetime(\'now\') WHERE id = ? AND tenant_id = ?')
        .bind(b.categoria_id || null, b.categoria_id ? (b.subcategoria_id || null) : null, grupo, b.produto_id, auth.tenant_id),
    ];
    if (b.quantidade_minima !== undefined || b.localizacao !== undefined) {
      stmts.push(env.DB.prepare('UPDATE estoque SET quantidade_minima = COALESCE(?, quantidade_minima), localizacao = COALESCE(?, localizacao) WHERE produto_id = ? AND tenant_id = ?')
        .bind(b.quantidade_minima ?? null, b.localizacao ?? null, b.produto_id, auth.tenant_id));
    }
    await env.DB.batch(stmts);
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
