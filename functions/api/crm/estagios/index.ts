import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureCrmTable, ensureEstagiosPadrao } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);
  await ensureEstagiosPadrao(env.DB, auth.tenant_id);

  const result = await env.DB.prepare(
    'SELECT * FROM crm_estagios WHERE tenant_id = ? AND ativo = 1 ORDER BY ordem ASC, created_at ASC'
  ).bind(auth.tenant_id).all();

  return json(result.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);

  const body = await request.json() as Record<string, string>;
  if (!body.label?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

  // Gera key única para estágios customizados
  const key = `custom_${Date.now()}`;
  const ultimo = await env.DB.prepare(
    'SELECT MAX(ordem) as max_ordem FROM crm_estagios WHERE tenant_id = ?'
  ).bind(auth.tenant_id).first<{ max_ordem: number }>();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO crm_estagios (id, tenant_id, key, label, icon, color, ordem, sistema, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
  ).bind(id, auth.tenant_id, key, body.label.trim(), body.icon || '📌', body.color || '#64748b', (ultimo?.max_ordem || 0) + 1, now).run();

  return json({ id, key, label: body.label.trim(), icon: body.icon || '📌', color: body.color || '#64748b', sistema: 0 }, 201);
};
