import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';
import { ensureBlingCols } from '../../lib/bling';

// GET /api/bling/status — a loja está conectada ao Bling?
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  await ensureBlingCols(env.DB);
  const t = await env.DB.prepare(
    'SELECT bling_refresh_token FROM tenants WHERE id = ?'
  ).bind(auth.tenant_id).first<{ bling_refresh_token: string | null }>();

  return json({
    configurado: !!(env.BLING_CLIENT_ID && env.BLING_CLIENT_SECRET),
    conectado: !!(t && t.bling_refresh_token),
  });
};
