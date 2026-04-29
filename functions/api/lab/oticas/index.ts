import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const result = await env.DB.prepare(
      'SELECT * FROM lab_oticas WHERE tenant_id = ? ORDER BY nome ASC'
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

    const body = await request.json() as Record<string, string>;
    if (!body.nome) return json({ error: 'Nome é obrigatório' }, 400);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO lab_oticas (id, tenant_id, nome, cnpj, telefone, email, endereco, cidade, uf, cep, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, body.nome, body.cnpj ?? null, body.telefone ?? null, body.email ?? null, body.endereco ?? null, body.cidade ?? null, body.uf ?? null, body.cep ?? null, body.observacao ?? null).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
