import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare('DELETE FROM movimentacoes_caixa WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
