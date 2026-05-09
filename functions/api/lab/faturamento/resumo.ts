import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// GET /api/lab/faturamento/resumo?data_ini=&data_fim=&otica_id=
// Returns OS totals grouped by ótica for a period (only pronto/entregue status)
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const data_ini = url.searchParams.get('data_ini');
    const data_fim = url.searchParams.get('data_fim');
    const otica_id = url.searchParams.get('otica_id');

    if (!data_ini || !data_fim) return json({ error: 'data_ini e data_fim são obrigatórios' }, 400);

    let q = `
      SELECT
        o.id            AS otica_id,
        o.nome          AS otica_nome,
        COUNT(os.id)    AS qtd_os,
        COALESCE(SUM(os.total), 0) AS valor_total
      FROM lab_ordens os
      JOIN lab_oticas o ON o.id = os.otica_id AND o.tenant_id = os.tenant_id
      WHERE os.tenant_id = ?
        AND date(os.created_at) >= ?
        AND date(os.created_at) <= ?
        AND os.status IN ('pronto', 'entregue')
    `;
    const params: unknown[] = [tenant_id, data_ini, data_fim];

    if (otica_id) { q += ' AND os.otica_id = ?'; params.push(otica_id); }

    q += ' GROUP BY o.id, o.nome ORDER BY o.nome ASC';

    const rows = await env.DB.prepare(q).bind(...params).all<{ otica_id: string; otica_nome: string; qtd_os: number; valor_total: number }>();
    return json(rows.results.filter(r => r.qtd_os > 0));
  } catch (err) { return json({ error: String(err) }, 500); }
};
