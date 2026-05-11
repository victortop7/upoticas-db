import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const b = await request.json() as Record<string, unknown>;
    await env.DB.prepare(
      "UPDATE lab_servicos_catalogo SET codigo=?, nome=?, unidade=?, valor_padrao=?, valor_lista2=? WHERE id=? AND tenant_id=?"
    ).bind(b.codigo ?? null, b.nome, b.unidade ?? null, b.valor_padrao ?? 0, b.valor_lista2 ?? null, params.id, tenant_id).run();
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
