import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const campanha = await env.DB.prepare(
    'SELECT * FROM marketing_campanhas WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first();
  if (!campanha) return json({ error: 'Campanha não encontrada' }, 404);

  // Busca clientes com celular cadastrado
  const clientes = await env.DB.prepare(`
    SELECT id, nome, celular, telefone, data_nascimento, cidade, uf
    FROM clientes WHERE tenant_id = ? AND ativo = 1
    AND (celular IS NOT NULL OR telefone IS NOT NULL)
    ORDER BY nome ASC
  `).bind(auth.tenant_id).all();

  return json({ campanha, clientes: clientes.results });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, any>;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    UPDATE marketing_campanhas SET nome = ?, mensagem = ?, situacao = ?, enviados = ?, total_clientes = ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `).bind(body.nome, body.mensagem, body.situacao || 'rascunho',
    body.enviados || 0, body.total_clientes || 0, now,
    params.id, auth.tenant_id).run();

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await env.DB.prepare('DELETE FROM marketing_campanhas WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
