import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const cliente = await env.DB.prepare(
    'SELECT * FROM clientes WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first();

  if (!cliente) return json({ error: 'Cliente não encontrado' }, 404);
  return json(cliente);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

    const existing = await env.DB.prepare(
      'SELECT id FROM clientes WHERE id = ? AND tenant_id = ?'
    ).bind(params.id, auth.tenant_id).first();

    if (!existing) return json({ error: 'Cliente não encontrado' }, 404);

    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE clientes SET
        nome = ?, apelido = ?, cpf = ?, telefone = ?, celular = ?, email = ?,
        data_nascimento = ?, endereco = ?, bairro = ?, cidade = ?, uf = ?, cep = ?,
        observacao = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.nome.trim(),
      body.apelido || null,
      body.cpf || null,
      body.telefone || null,
      body.celular || null,
      body.email || null,
      body.data_nascimento || null,
      body.endereco || null,
      body.bairro || null,
      body.cidade || null,
      body.uf || null,
      body.cep || null,
      body.observacao || null,
      now,
      params.id, auth.tenant_id
    ).run();

    const cliente = await env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(params.id).first();
    return json(cliente);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const existing = await env.DB.prepare(
    'SELECT id FROM clientes WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first();

  if (!existing) return json({ error: 'Cliente não encontrado' }, 404);

  await env.DB.prepare(
    'UPDATE clientes SET ativo = 0, updated_at = ? WHERE id = ? AND tenant_id = ?'
  ).bind(new Date().toISOString(), params.id, auth.tenant_id).run();

  return json({ success: true });
};
