import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// PATCH /api/lab/faturamento/:id — atualiza status/data_pagamento/observacoes
export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const b = await request.json() as Record<string, unknown>;
    const sets: string[] = [];
    const vals: unknown[] = [];

    if (b.status !== undefined)          { sets.push('status = ?');           vals.push(b.status); }
    if (b.data_pagamento !== undefined)  { sets.push('data_pagamento = ?');   vals.push(b.data_pagamento); }
    if (b.data_vencimento !== undefined) { sets.push('data_vencimento = ?');  vals.push(b.data_vencimento); }
    if (b.observacoes !== undefined)     { sets.push('observacoes = ?');      vals.push(b.observacoes); }
    if (b.desconto !== undefined) {
      sets.push('desconto = ?');         vals.push(b.desconto);
      sets.push('valor_liquido = ?');    vals.push(b.valor_liquido ?? 0);
    }

    if (sets.length === 0) return json({ error: 'Nada para atualizar' }, 400);

    vals.push(params.id, tenant_id);
    await env.DB.prepare(`UPDATE lab_faturamento SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`)
      .bind(...vals).run();

    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};

// DELETE /api/lab/faturamento/:id
export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await env.DB.prepare('DELETE FROM lab_faturamento WHERE id = ? AND tenant_id = ?').bind(params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};
