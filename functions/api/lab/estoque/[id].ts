import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as {
      marca: string; tratamento: string; indice: string; tipo: string;
      descricao?: string; quantidade_minima?: number;
    };

    await env.DB.prepare(
      "UPDATE lab_estoque SET marca=?, tratamento=?, indice=?, tipo=?, descricao=?, quantidade_minima=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(
      body.marca, body.tratamento, body.indice, body.tipo,
      body.descricao ?? null, body.quantidade_minima ?? 5,
      params.id, tenant_id,
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
    const { tenant_id } = auth;

    await env.DB.prepare(
      "UPDATE lab_estoque SET ativo=0, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(params.id, tenant_id).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST /:id/movimentacao — registrar entrada ou saída
export const onRequestPost = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as { tipo: 'entrada' | 'saida'; quantidade: number; motivo?: string };

    if (!body.tipo || !body.quantidade || body.quantidade <= 0) {
      return json({ error: 'Tipo e quantidade são obrigatórios' }, 400);
    }

    const produto = await env.DB.prepare(
      'SELECT quantidade FROM lab_estoque WHERE id=? AND tenant_id=?'
    ).bind(params.id, tenant_id).first<{ quantidade: number }>();

    if (!produto) return json({ error: 'Produto não encontrado' }, 404);

    const novaQtd = body.tipo === 'entrada'
      ? produto.quantidade + body.quantidade
      : Math.max(0, produto.quantidade - body.quantidade);

    const movId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE lab_estoque SET quantidade=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
      ).bind(novaQtd, params.id, tenant_id),
      env.DB.prepare(
        'INSERT INTO lab_estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, motivo) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(movId, tenant_id, params.id, body.tipo, body.quantidade, body.motivo ?? null),
    ]);

    return json({ ok: true, quantidade: novaQtd });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
