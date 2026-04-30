import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    let query = 'SELECT * FROM fornecedores WHERE tenant_id = ? AND ativo = 1';
    const params: unknown[] = [tenant_id];

    if (q) {
      query += ' AND (nome LIKE ? OR fantasia LIKE ? OR cnpj LIKE ?)';
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
      'INSERT INTO fornecedores (id, tenant_id, nome, fantasia, cnpj, ie, telefone, celular, email, contato, endereco, bairro, cidade, uf, cep, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, tenant_id, body.nome.trim(),
      body.fantasia || null, body.cnpj || null, body.ie || null,
      body.telefone || null, body.celular || null, body.email || null,
      body.contato || null, body.endereco || null, body.bairro || null,
      body.cidade || null, body.uf || null, body.cep || null, body.observacao || null,
    ).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
