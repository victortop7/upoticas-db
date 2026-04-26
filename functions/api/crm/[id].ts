import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, string>;
  const now = new Date().toISOString();

  await env.DB.prepare(
    'UPDATE crm_cards SET estagio = ?, prioridade = ?, notas = ?, updated_at = ? WHERE id = ? AND tenant_id = ?'
  ).bind(
    body.estagio || 'novo',
    body.prioridade || 'normal',
    body.notas || null,
    now,
    params.id,
    auth.tenant_id
  ).run();

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare('DELETE FROM crm_cards WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
