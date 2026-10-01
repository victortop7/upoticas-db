import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols } from '../../lib/lojas';

// GET /api/lojas — lista as lojas do tenant
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureLojaCols(env.DB);

  const r = await env.DB.prepare(
    'SELECT id, nome, endereco, ativo FROM lojas WHERE tenant_id = ? AND ativo = 1 ORDER BY nome ASC'
  ).bind(auth.tenant_id).all();
  return json(r.results);
};

// POST /api/lojas — cria uma loja (admin)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin pode criar lojas' }, 403);
  await ensureLojaCols(env.DB);

  try {
    const body = await request.json() as { nome?: string; endereco?: string };
    if (!body.nome?.trim()) return json({ error: 'Nome da loja é obrigatório' }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO lojas (id, tenant_id, nome, endereco) VALUES (?, ?, ?, ?)')
      .bind(id, auth.tenant_id, body.nome.trim(), body.endereco || null).run();
    return json({ id, nome: body.nome.trim() }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
