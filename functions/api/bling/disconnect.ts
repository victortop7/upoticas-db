import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';
import { ensureBlingCols } from '../../lib/bling';

// POST /api/bling/disconnect — remove os tokens do Bling da loja
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  await ensureBlingCols(env.DB);
  await env.DB.prepare(
    'UPDATE tenants SET bling_access_token = NULL, bling_refresh_token = NULL, bling_token_expira = NULL WHERE id = ?'
  ).bind(auth.tenant_id).run();

  return json({ ok: true });
};
