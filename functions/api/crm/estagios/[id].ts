import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, any>;

  await env.DB.prepare(
    'UPDATE crm_estagios SET label = ?, icon = ?, color = ?, ordem = ? WHERE id = ? AND tenant_id = ?'
  ).bind(
    body.label, body.icon, body.color, body.ordem ?? 0,
    params.id, auth.tenant_id
  ).run();

  return json({ success: true });
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const estagio = await env.DB.prepare(
    'SELECT key FROM crm_estagios WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first<{ key: string }>();

  if (!estagio) return json({ error: 'Estágio não encontrado' }, 404);

  // Move cards deste estágio para 'novo'
  await env.DB.prepare(
    "UPDATE crm_cards SET estagio = 'novo' WHERE estagio = ? AND tenant_id = ?"
  ).bind(estagio.key, auth.tenant_id).run();

  await env.DB.prepare('DELETE FROM crm_estagios WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();

  return json({ success: true });
};
