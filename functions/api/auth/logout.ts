import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';

export const onRequestPost: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'up_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
    },
  });
};
