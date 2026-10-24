import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { moverManual } from '../../lib/crmFluxo';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, string>;
  const now = new Date().toISOString();
  const atual = await env.DB.prepare('SELECT estagio FROM crm_cards WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).first<{ estagio: string }>();
  if (!atual) return json({ error: 'Card não encontrado' }, 404);

  await env.DB.prepare(
    'UPDATE crm_cards SET prioridade = ?, notas = ?, updated_at = ? WHERE id = ? AND tenant_id = ?'
  ).bind(body.prioridade || 'normal', body.notas || null, now, params.id, auth.tenant_id).run();
  // trocou de etapa: fica lá mesmo depois de atualizar a tela
  if (body.estagio && body.estagio !== atual.estagio) await moverManual(env.DB, auth.tenant_id, String(params.id), body.estagio, auth.usuario_id);

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare('DELETE FROM crm_cards WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
