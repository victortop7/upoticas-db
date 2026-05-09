import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const body = await request.json() as Record<string, unknown>;
    await env.DB.prepare(`
      UPDATE lab_transportadoras SET nome=?,nome_reduzido=?,endereco=?,complemento=?,bairro=?,cidade=?,estado=?,cep=?,cnpj=?,insc=?,observacoes=?,telefone=?,celular=?,email=?
      WHERE id=? AND tenant_id=?
    `).bind(body.nome,body.nome_reduzido??null,body.endereco??null,body.complemento??null,body.bairro??null,body.cidade??null,body.estado??null,body.cep??null,body.cnpj??null,body.insc??null,body.observacoes??null,body.telefone??null,body.celular??null,body.email??null,params.id,tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: 'Erro interno', detail: String(err) }, 500); }
};

export const onRequestDelete = async ({ env, params, request }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await env.DB.prepare('DELETE FROM lab_transportadoras WHERE id=? AND tenant_id=?').bind(params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: 'Erro interno', detail: String(err) }, 500); }
};
