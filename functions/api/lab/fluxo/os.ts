import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// GET /api/lab/fluxo/os?q=... — busca OS para lançar fluxo individual
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const q = new URL(request.url).searchParams.get('q') ?? '';

    const ordem = await env.DB.prepare(`
      SELECT o.id, o.numero, o.status, o.tipo, o.ref_otica, o.cont_interno, o.caixa,
             o.previsao_entrega, o.created_at, o.vendedor, o.setor_atual,
             ot.nome as otica_nome,
             a.tipo_lente, a.marca_material
      FROM lab_ordens o
      LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
      LEFT JOIN lab_armacao a ON a.ordem_id = o.id
      WHERE o.tenant_id = ?
        AND (
          CAST(o.numero AS TEXT) = ? OR
          o.cont_interno LIKE ? OR
          o.ref_otica LIKE ?
        )
      ORDER BY o.created_at DESC
      LIMIT 1
    `).bind(tenant_id, q, `%${q}%`, `%${q}%`).first<Record<string, unknown>>();

    if (!ordem) return json({ error: 'OS não encontrada' }, 404);

    const fluxo = await env.DB.prepare(`
      SELECT * FROM lab_fluxo WHERE tenant_id = ? AND ordem_id = ?
      ORDER BY created_at ASC
    `).bind(tenant_id, ordem.id).all<Record<string, unknown>>();

    return json({ ordem, fluxo: fluxo.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
