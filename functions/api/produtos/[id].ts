import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const [produto, precos] = await Promise.all([
      env.DB.prepare('SELECT p.*, f.nome as fornecedor_nome FROM produtos p LEFT JOIN fornecedores f ON f.id = p.fornecedor_id WHERE p.id = ? AND p.tenant_id = ?')
        .bind(params.id, auth.tenant_id).first(),
      env.DB.prepare('SELECT pp.*, c.nome as cliente_nome FROM produtos_precos_especiais pp JOIN clientes c ON c.id = pp.cliente_id WHERE pp.produto_id = ? AND pp.tenant_id = ?')
        .bind(params.id, auth.tenant_id).all(),
    ]);

    if (!produto) return json({ error: 'Produto não encontrado' }, 404);
    return json({ produto, precos_especiais: precos.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json() as Record<string, string | number>;
    if (!String(body.descricao || '').trim()) return json({ error: 'Descrição é obrigatória' }, 400);

    await env.DB.prepare(
      "UPDATE produtos SET codigo=?, descricao=?, grupo=?, unidade=?, preco_custo=?, preco_venda=?, fornecedor_id=?, observacao=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(
      body.codigo || null, String(body.descricao).trim(),
      body.grupo || null, body.unidade || 'UN',
      Number(body.preco_custo) || 0, Number(body.preco_venda) || 0,
      body.fornecedor_id || null, body.observacao || null,
      params.id, auth.tenant_id,
    ).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    await env.DB.prepare("UPDATE produtos SET ativo=0, updated_at=datetime('now') WHERE id=? AND tenant_id=?")
      .bind(params.id, auth.tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PATCH /:id/preco-especial — adicionar/atualizar preço especial para um cliente
export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as { cliente_id: string; preco: number; remover?: boolean };

    if (body.remover) {
      await env.DB.prepare('DELETE FROM produtos_precos_especiais WHERE produto_id=? AND cliente_id=? AND tenant_id=?')
        .bind(params.id, body.cliente_id, tenant_id).run();
      return json({ ok: true });
    }

    if (!body.cliente_id || body.preco == null) return json({ error: 'cliente_id e preco são obrigatórios' }, 400);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO produtos_precos_especiais (id, tenant_id, produto_id, cliente_id, preco) VALUES (?, ?, ?, ?, ?) ON CONFLICT(produto_id, cliente_id) DO UPDATE SET preco=excluded.preco'
    ).bind(id, tenant_id, params.id, body.cliente_id, body.preco).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
