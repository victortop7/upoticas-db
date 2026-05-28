import { requireAuth, json } from '../../../lib/auth-middleware';
import type { Env } from '../../../lib/types';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const rows = await env.DB.prepare(
    `SELECT * FROM vision_tratamentos
     WHERE (tenant_id IS NULL OR tenant_id = ?) AND ativo = 1
     ORDER BY nome`
  ).bind(auth.tenant_id).all();

  return json(rows.results);
};
