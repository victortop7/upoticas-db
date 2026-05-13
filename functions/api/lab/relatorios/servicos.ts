import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const oticaId  = url.searchParams.get('otica_id');
    const dataIni  = url.searchParams.get('data_ini');
    const dataFim  = url.searchParams.get('data_fim');

    if (!oticaId) return json({ error: 'otica_id obrigatório' }, 400);

    const params: unknown[] = [tenant_id, oticaId];
    let where = 'WHERE o.tenant_id = ? AND o.otica_id = ?';
    if (dataIni) { where += ' AND date(o.created_at) >= ?'; params.push(dataIni); }
    if (dataFim) { where += ' AND date(o.created_at) <= ?'; params.push(dataFim); }

    const [ordensRes, servicosRes] = await Promise.all([
      env.DB.prepare(`
        SELECT o.id, o.numero, o.status, o.tipo, o.total,
               o.ref_otica, o.cont_interno, o.created_at, o.previsao_entrega
        FROM lab_ordens o
        ${where}
        ORDER BY o.numero DESC
      `).bind(...params).all(),

      env.DB.prepare(`
        SELECT s.ordem_id,
               COALESCE(s.codigo, sc.codigo, '')               AS codigo,
               COALESCE(s.descricao, sc.nome, 'Serviço')       AS descricao,
               COALESCE(s.qtd, 1)                              AS qtd,
               COALESCE(s.valor_unit, s.valor_padrao, sc.valor_padrao, 0) AS valor_unit,
               COALESCE(s.perc_desc, 0)                        AS perc_desc,
               COALESCE(s.total_liq, s.total, 0)               AS total
        FROM lab_servicos_os s
        LEFT JOIN lab_servicos_catalogo sc ON sc.id = s.produto_id AND sc.tenant_id = ?
        JOIN lab_ordens o ON o.id = s.ordem_id
        ${where}
        ORDER BY o.numero DESC, s.rowid
      `).bind(tenant_id, ...params).all(),
    ]);

    return json({
      ordens:   ordensRes.results,
      servicos: servicosRes.results,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
