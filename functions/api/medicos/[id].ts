import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json() as Record<string, string>;
    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

    await env.DB.prepare(
      "UPDATE medicos SET nome=?, crm=?, especialidade=?, telefone=?, celular=?, email=?, clinica=?, endereco=?, cidade=?, uf=?, observacao=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(
      body.nome.trim(), body.crm || null, body.especialidade || 'Oftalmologia',
      body.telefone || null, body.celular || null, body.email || null,
      body.clinica || null, body.endereco || null, body.cidade || null,
      body.uf || null, body.observacao || null,
      params.id, auth.tenant_id,
    ).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    await env.DB.prepare("UPDATE medicos SET ativo=0, updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(params.id, auth.tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
