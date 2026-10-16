import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCarneTables } from './index';
import { baixarParcela } from '../../lib/receber';

// POST /api/carnes/parcela  { parcela_id, status: 'pago' | 'pendente' }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCarneTables(env.DB);

  try {
    const body = await request.json() as { parcela_id?: string; status?: string };
    if (!body.parcela_id) return json({ error: 'parcela_id requerido' }, 400);
    const status = body.status === 'pago' ? 'pago' : 'pendente';
    const r = await baixarParcela(env.DB, auth.tenant_id, body.parcela_id, status === 'pago');
    if (!r.ok) return json({ error: r.erro }, 404);

    return json({ ok: true, status });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
