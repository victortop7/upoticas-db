import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

const SITUACOES_VALIDAS = ['orcamento', 'aprovado', 'em_producao', 'pronto', 'entregue', 'cancelado'];

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as { id: string; situacao: string };
    if (!body.id) return json({ error: 'ID obrigatório' }, 400);
    if (!SITUACOES_VALIDAS.includes(body.situacao)) return json({ error: 'Situação inválida' }, 400);

    const existing = await env.DB.prepare(
      'SELECT id FROM ordens_servico WHERE id = ? AND tenant_id = ?'
    ).bind(body.id, auth.tenant_id).first();
    if (!existing) return json({ error: 'OS não encontrada' }, 404);

    await env.DB.prepare(
      'UPDATE ordens_servico SET situacao = ?, updated_at = ? WHERE id = ? AND tenant_id = ?'
    ).bind(body.situacao, new Date().toISOString(), body.id, auth.tenant_id).run();

    return json({ success: true, situacao: body.situacao });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
