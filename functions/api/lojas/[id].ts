import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols } from '../../lib/lojas';

// PATCH /api/lojas/:id — renomeia/edita a loja (admin)
export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin' }, 403);
  await ensureLojaCols(env.DB);

  const body = await request.json() as { nome?: string; endereco?: string };
  await env.DB.prepare('UPDATE lojas SET nome = COALESCE(?, nome), endereco = COALESCE(?, endereco) WHERE id = ? AND tenant_id = ?')
    .bind(body.nome?.trim() || null, body.endereco ?? null, params.id, auth.tenant_id).run();
  return json({ ok: true });
};

// DELETE /api/lojas/:id — desativa a loja (admin). Não apaga dados; só some da lista.
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin' }, 403);
  await ensureLojaCols(env.DB);

  await env.DB.prepare('UPDATE lojas SET ativo = 0 WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ ok: true });
};
