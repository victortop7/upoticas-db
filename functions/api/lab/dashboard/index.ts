import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const [statsRow, recentes] = await Promise.all([
      env.DB.prepare(`
        SELECT
          COUNT(*) as total_ordens,
          SUM(CASE WHEN status = 'aguardando' THEN 1 ELSE 0 END) as aguardando,
          SUM(CASE WHEN status = 'em_producao' THEN 1 ELSE 0 END) as em_producao,
          SUM(CASE WHEN status = 'pronto' THEN 1 ELSE 0 END) as prontos,
          SUM(CASE WHEN status = 'entregue' AND date(updated_at) = date('now') THEN 1 ELSE 0 END) as entregues_hoje,
          (SELECT COUNT(*) FROM lab_oticas WHERE tenant_id = ? AND ativo = 1) as total_oticas
        FROM lab_ordens WHERE tenant_id = ?
      `).bind(tenant_id, tenant_id).first<Record<string, number>>(),

      env.DB.prepare(`
        SELECT o.id, o.numero, o.status, o.previsao_entrega, o.total,
               ot.nome as otica_nome,
               (SELECT COUNT(*) FROM lab_servicos_os WHERE ordem_id = o.id) as servicos_count
        FROM lab_ordens o
        LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
        WHERE o.tenant_id = ?
        ORDER BY o.created_at DESC
        LIMIT 10
      `).bind(tenant_id).all<Record<string, unknown>>(),
    ]);

    return json({
      stats: {
        total_ordens: statsRow?.total_ordens ?? 0,
        aguardando: statsRow?.aguardando ?? 0,
        em_producao: statsRow?.em_producao ?? 0,
        prontos: statsRow?.prontos ?? 0,
        entregues_hoje: statsRow?.entregues_hoje ?? 0,
        total_oticas: statsRow?.total_oticas ?? 0,
      },
      recentes: recentes.results,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
