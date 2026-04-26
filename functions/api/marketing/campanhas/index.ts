import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureMarketingTables } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureMarketingTables(env.DB);

  const result = await env.DB.prepare(
    'SELECT * FROM marketing_campanhas WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(auth.tenant_id).all();
  return json(result.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureMarketingTables(env.DB);

  const body = await request.json() as Record<string, any>;
  if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
  if (!body.mensagem?.trim()) return json({ error: 'Mensagem é obrigatória' }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO marketing_campanhas (id, tenant_id, nome, modelo_id, mensagem, filtro_json, situacao, total_clientes, enviados, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'rascunho', ?, 0, ?, ?)
  `).bind(id, auth.tenant_id, body.nome.trim(), body.modelo_id || null, body.mensagem.trim(),
    body.filtro_json ? JSON.stringify(body.filtro_json) : null,
    body.total_clientes || 0, now, now).run();

  return json({ id }, 201);
};
