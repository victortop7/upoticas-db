import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    let query = 'SELECT * FROM medicos WHERE tenant_id = ? AND ativo = 1';
    const params: unknown[] = [tenant_id];

    if (q) {
      query += ' AND (nome LIKE ? OR crm LIKE ? OR clinica LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    query += ' ORDER BY nome ASC';
    const result = await env.DB.prepare(query).bind(...params).all();
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
    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO medicos (id, tenant_id, nome, crm, especialidade, telefone, celular, email, clinica, endereco, cidade, uf, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, tenant_id, body.nome.trim(),
      body.crm || null, body.especialidade || 'Oftalmologia',
      body.telefone || null, body.celular || null, body.email || null,
      body.clinica || null, body.endereco || null, body.cidade || null,
      body.uf || null, body.observacao || null,
    ).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
