import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const row = await env.DB.prepare('SELECT * FROM fornecedores WHERE id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id).first();
    if (!row) return json({ error: 'Não encontrado' }, 404);
    return json(row);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json() as Record<string, string>;
    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

    await env.DB.prepare(
      "UPDATE fornecedores SET nome=?, fantasia=?, cnpj=?, ie=?, telefone=?, celular=?, email=?, contato=?, endereco=?, bairro=?, cidade=?, uf=?, cep=?, observacao=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(
      body.nome.trim(), body.fantasia || null, body.cnpj || null, body.ie || null,
      body.telefone || null, body.celular || null, body.email || null, body.contato || null,
      body.endereco || null, body.bairro || null, body.cidade || null, body.uf || null,
      body.cep || null, body.observacao || null,
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
    await env.DB.prepare("UPDATE fornecedores SET ativo=0, updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(params.id, auth.tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
