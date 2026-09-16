import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCarneTables } from './index';

// POST /api/carnes/parcela  { parcela_id, status: 'pago' | 'pendente' }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCarneTables(env.DB);

  try {
    const body = await request.json() as { parcela_id?: string; status?: string };
    if (!body.parcela_id) return json({ error: 'parcela_id requerido' }, 400);
    const status = body.status === 'pago' ? 'pago' : 'pendente';
    const pagoEm = status === 'pago' ? new Date().toISOString() : null;

    const res = await env.DB.prepare(
      'UPDATE carne_parcelas SET status = ?, pago_em = ? WHERE id = ? AND tenant_id = ?'
    ).bind(status, pagoEm, body.parcela_id, auth.tenant_id).run();
    if (!res.success) return json({ error: 'Parcela não encontrada' }, 404);

    return json({ ok: true, status });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
