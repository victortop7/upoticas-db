import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureMarketingTables } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureMarketingTables(env.DB);

  const categoria = new URL(request.url).searchParams.get('categoria') || '';
  let query = 'SELECT * FROM marketing_modelos WHERE tenant_id = ? AND ativo = 1';
  const params: unknown[] = [auth.tenant_id];
  if (categoria) { query += ' AND categoria = ?'; params.push(categoria); }
  query += ' ORDER BY categoria ASC, nome ASC';

  const result = await env.DB.prepare(query).bind(...params).all();
  return json(result.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureMarketingTables(env.DB);

  const body = await request.json() as Record<string, string>;
  if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
  if (!body.corpo?.trim()) return json({ error: 'Mensagem é obrigatória' }, 400);

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO marketing_modelos (id, tenant_id, nome, categoria, corpo, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.nome.trim(), body.categoria || 'promocao', body.corpo.trim(), new Date().toISOString()).run();

  const modelo = await env.DB.prepare('SELECT * FROM marketing_modelos WHERE id = ?').bind(id).first();
  return json(modelo, 201);
};
