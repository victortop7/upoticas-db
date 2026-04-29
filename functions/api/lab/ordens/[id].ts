import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const [ordem, receita, armacao, servicos] = await Promise.all([
      env.DB.prepare(`
        SELECT o.*, ot.nome as otica_nome, ot.cnpj as otica_cnpj, ot.telefone as otica_telefone,
               ot.cidade as otica_cidade, ot.uf as otica_uf
        FROM lab_ordens o
        LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
        WHERE o.id = ? AND o.tenant_id = ?
      `).bind(id, tenant_id).first<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_receita WHERE ordem_id = ? ORDER BY olho ASC')
        .bind(id).all<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_armacao WHERE ordem_id = ?')
        .bind(id).first<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_servicos_os WHERE ordem_id = ? ORDER BY rowid ASC')
        .bind(id).all<Record<string, unknown>>(),
    ]);

    if (!ordem) return json({ error: 'Ordem não encontrada' }, 404);

    return json({ ordem, receita: receita.results, armacao, servicos: servicos.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const body = await request.json() as { status?: string };
    const VALID = ['aguardando', 'em_producao', 'pronto', 'entregue', 'cancelado'];

    if (!body.status || !VALID.includes(body.status)) {
      return json({ error: 'Status inválido' }, 400);
    }

    const result = await env.DB.prepare(
      "UPDATE lab_ordens SET status = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?"
    ).bind(body.status, id, tenant_id).run();

    if (!result.success) return json({ error: 'Ordem não encontrada' }, 404);

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
