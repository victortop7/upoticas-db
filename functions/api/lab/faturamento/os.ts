import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// GET /api/lab/faturamento/os?data_ini=&data_fim=&otica_id=
// Lista as OS do período para seleção no fechamento — inclui OS ainda em produção
// (permite cobrar adiantado). Apenas OS canceladas ficam de fora.
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
      SELECT os.id, os.numero, os.ref_otica, os.cont_interno, os.total, os.created_at, os.status,
             os.otica_id, o.nome AS otica_nome, o.codigo AS otica_codigo
      FROM lab_ordens os
      JOIN lab_oticas o ON o.id = os.otica_id AND o.tenant_id = os.tenant_id
      WHERE os.tenant_id = ?
        AND date(os.created_at) >= ? AND date(os.created_at) <= ?
        AND os.status != 'cancelado'
    `;
    const params: unknown[] = [tenant_id, data_ini, data_fim];
    if (otica_id) { q += ' AND os.otica_id = ?'; params.push(otica_id); }
    q += ' ORDER BY o.nome ASC, os.numero ASC LIMIT 1000';

    const rows = await env.DB.prepare(q).bind(...params).all();
    return json(rows.results);
  } catch (err) { return json({ error: String(err) }, 500); }
};
