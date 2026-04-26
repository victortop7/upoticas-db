import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const body = await request.json() as Record<string, string>;
  if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
  if (!body.corpo?.trim()) return json({ error: 'Mensagem é obrigatória' }, 400);

  await env.DB.prepare(
    'UPDATE marketing_modelos SET nome = ?, categoria = ?, corpo = ? WHERE id = ? AND tenant_id = ?'
  ).bind(body.nome.trim(), body.categoria || 'promocao', body.corpo.trim(), params.id, auth.tenant_id).run();

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await env.DB.prepare('UPDATE marketing_modelos SET ativo = 0 WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
