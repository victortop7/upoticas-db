import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const b = await request.json() as Record<string, unknown>;
    try { await env.DB.prepare('ALTER TABLE lab_servicos_catalogo ADD COLUMN brinde INTEGER DEFAULT 0').run(); } catch {}
    await env.DB.prepare(
      `UPDATE lab_servicos_catalogo
       SET codigo=?, nome=?, unidade=?, valor_padrao=?, valor_lista2=?, valor_lista3=?, valor_lista4=?, valor_lista5=?, brinde=?
       WHERE id=? AND tenant_id=?`
    ).bind(
      b.codigo ?? null, b.nome, b.unidade ?? null,
      b.valor_padrao ?? 0, b.valor_lista2 ?? null,
      b.valor_lista3 ?? null, b.valor_lista4 ?? null, b.valor_lista5 ?? null,
      b.brinde ? 1 : 0,
      params.id, tenant_id
    ).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await env.DB.prepare('DELETE FROM lab_servicos_catalogo WHERE id=? AND tenant_id=?').bind(params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};
