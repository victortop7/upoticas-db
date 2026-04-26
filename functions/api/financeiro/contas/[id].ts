import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const body = await request.json() as Record<string, string>;
  if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

  await env.DB.prepare(
    'UPDATE contas_financeiras SET nome = ?, tipo = ?, saldo_inicial = ? WHERE id = ? AND tenant_id = ?'
  ).bind(body.nome.trim(), body.tipo || 'caixa', parseFloat(body.saldo_inicial) || 0, params.id, auth.tenant_id).run();

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare(
    'UPDATE contas_financeiras SET ativo = 0 WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).run();

  return json({ success: true });
};
