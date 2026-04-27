import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, any>;

  // Atualiza label, icon, color e/ou ordem
  await env.DB.prepare(
    'UPDATE crm_estagios SET label = ?, icon = ?, color = ?, ordem = ? WHERE id = ? AND tenant_id = ?'
  ).bind(
    body.label, body.icon, body.color, body.ordem ?? 0,
    params.id, auth.tenant_id
  ).run();

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  // Verifica se é estágio do sistema
  const estagio = await env.DB.prepare(
    'SELECT sistema, key FROM crm_estagios WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first<{ sistema: number; key: string }>();

  if (!estagio) return json({ error: 'Estágio não encontrado' }, 404);
  if (estagio.sistema) return json({ error: 'Estágios do sistema não podem ser excluídos' }, 400);

  // Move cards deste estágio para 'novo'
  await env.DB.prepare(
    "UPDATE crm_cards SET estagio = 'novo' WHERE estagio = ? AND tenant_id = ?"
  ).bind(estagio.key, auth.tenant_id).run();

  await env.DB.prepare('DELETE FROM crm_estagios WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();

  return json({ success: true });
};
