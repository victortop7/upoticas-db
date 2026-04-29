import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const result = await env.DB.prepare(
      'SELECT * FROM lab_servicos_catalogo WHERE tenant_id = ? ORDER BY nome ASC'
    ).bind(tenant_id).all();

    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as { nome: string; valor_padrao?: number };
    if (!body.nome) return json({ error: 'Nome é obrigatório' }, 400);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO lab_servicos_catalogo (id, tenant_id, nome, valor_padrao) VALUES (?, ?, ?, ?)'
    ).bind(id, tenant_id, body.nome, body.valor_padrao ?? 0).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
