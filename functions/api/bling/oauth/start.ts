import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuthBasic, json } from '../../../lib/auth-middleware';
import { signJWT } from '../../../lib/jwt';
import { blingAuthorizeUrl } from '../../../lib/bling';

// GET /api/bling/oauth/start — devolve a URL de autorização do Bling (o front redireciona).
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  if (!env.BLING_CLIENT_ID || !env.BLING_CLIENT_SECRET) {
    return json({ error: 'Bling não configurado no servidor. Defina BLING_CLIENT_ID e BLING_CLIENT_SECRET no Cloudflare.' }, 500);
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/bling/oauth/callback`;
  // state assinado identifica o tenant no callback (10 min de validade)
  const state = await signJWT({ tid: auth.tenant_id, k: 'bling' }, env.JWT_SECRET, 600);
  const url = blingAuthorizeUrl(env, state, redirectUri);
  return json({ url });
};
