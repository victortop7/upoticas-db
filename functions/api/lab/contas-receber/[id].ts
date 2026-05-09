import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const b = await request.json() as Record<string, unknown>;
    await env.DB.prepare(
      `UPDATE lab_contas_receber SET status=?, data_pagamento=?, forma_pgto=? WHERE id=? AND tenant_id=?`
    ).bind(b.status ?? 'pago', b.data_pagamento ?? null, b.forma_pgto ?? null, params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await env.DB.prepare('DELETE FROM lab_contas_receber WHERE id=? AND tenant_id=?').bind(params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};
