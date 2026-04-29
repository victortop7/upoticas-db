import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const [otica, ordens, stats] = await Promise.all([
      env.DB.prepare(
        'SELECT * FROM lab_oticas WHERE id = ? AND tenant_id = ?'
      ).bind(id, tenant_id).first<Record<string, unknown>>(),

      env.DB.prepare(`
        SELECT o.id, o.numero, o.status, o.ref_otica, o.previsao_entrega, o.total, o.created_at,
               (SELECT COUNT(*) FROM lab_servicos_os WHERE ordem_id = o.id) as servicos_count
        FROM lab_ordens o
        WHERE o.otica_id = ? AND o.tenant_id = ?
        ORDER BY o.created_at DESC
        LIMIT 50
      `).bind(id, tenant_id).all<Record<string, unknown>>(),

      env.DB.prepare(`
        SELECT
          COUNT(*) as total_ordens,
          SUM(CASE WHEN status NOT IN ('entregue','cancelado') THEN 1 ELSE 0 END) as em_aberto,
          SUM(CASE WHEN status = 'pronto' THEN 1 ELSE 0 END) as prontos,
          SUM(total) as valor_total
        FROM lab_ordens
        WHERE otica_id = ? AND tenant_id = ?
      `).bind(id, tenant_id).first<Record<string, number>>(),
    ]);

    if (!otica) return json({ error: 'Ótica não encontrada' }, 404);

    return json({ otica, ordens: ordens.results, stats });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as Record<string, string>;
    if (!body.nome) return json({ error: 'Nome é obrigatório' }, 400);

    await env.DB.prepare(
      "UPDATE lab_oticas SET nome=?, cnpj=?, telefone=?, email=?, endereco=?, cidade=?, uf=?, cep=?, observacao=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(
      body.nome, body.cnpj ?? null, body.telefone ?? null, body.email ?? null,
      body.endereco ?? null, body.cidade ?? null, body.uf ?? null,
      body.cep ?? null, body.observacao ?? null,
      params.id, tenant_id,
    ).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
