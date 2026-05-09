import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const b = await request.json() as Record<string, unknown>;
    await env.DB.prepare(`UPDATE lab_vendedores SET nome=?,cpf_cnpj=?,rg_insc=?,endereco=?,complemento=?,bairro=?,cidade=?,estado=?,cep=?,pct_comissao=?,observacoes=?,telefone=?,celular=?,email=? WHERE id=? AND tenant_id=?`)
      .bind(b.nome,b.cpf_cnpj??null,b.rg_insc??null,b.endereco??null,b.complemento??null,b.bairro??null,b.cidade??null,b.estado??null,b.cep??null,b.pct_comissao??null,b.observacoes??null,b.telefone??null,b.celular??null,b.email??null,params.id,tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await env.DB.prepare('DELETE FROM lab_vendedores WHERE id=? AND tenant_id=?').bind(params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};
