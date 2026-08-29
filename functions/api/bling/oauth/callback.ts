import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { verifyJWT } from '../../../lib/jwt';
import { blingExchangeCode, ensureBlingCols } from '../../../lib/bling';

function redir(origin: string, status: string): Response {
  return new Response(null, { status: 302, headers: { Location: `${origin}/configuracoes?bling=${status}` } });
}

// GET /api/bling/oauth/callback — o Bling redireciona aqui com ?code=&state=
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (url.searchParams.get('error') || !code || !state) return redir(origin, 'erro');

  const payload = await verifyJWT(state, env.JWT_SECRET);
  const tenantId = payload?.tid as string | undefined;
  if (!tenantId || payload?.k !== 'bling') return redir(origin, 'erro');

  try {
    const redirectUri = `${origin}/api/bling/oauth/callback`;
    const data = await blingExchangeCode(env, code, redirectUri);
    const access = data.access_token as string | undefined;
    const refresh = data.refresh_token as string | undefined;
    if (!access || !refresh) return redir(origin, 'erro');

    await ensureBlingCols(env.DB);
    const exp = new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000).toISOString();
    await env.DB.prepare(
      'UPDATE tenants SET bling_access_token = ?, bling_refresh_token = ?, bling_token_expira = ? WHERE id = ?'
    ).bind(access, refresh, exp, tenantId).run();

    return redir(origin, 'ok');
  } catch {
    return redir(origin, 'erro');
  }
};
