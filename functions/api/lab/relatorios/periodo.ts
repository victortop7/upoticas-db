import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const dataIni = url.searchParams.get('data_ini');
    const dataFim = url.searchParams.get('data_fim');
    const oticaId = url.searchParams.get('otica_id');

    const params: unknown[] = [tenant_id];
    let where = 'WHERE o.tenant_id = ?';

    if (dataIni) { where += ' AND date(o.created_at) >= ?'; params.push(dataIni); }
    if (dataFim) { where += ' AND date(o.created_at) <= ?'; params.push(dataFim); }

    // Se otica_id fornecido: retorna lista de OS dessa ótica com serviços
    if (oticaId) {
      where += ' AND o.otica_id = ?';
      params.push(oticaId);

      const result = await env.DB.prepare(`
        SELECT o.id, o.numero, o.status, o.tipo, o.total,
               o.ref_otica, o.cont_interno, o.previsao_entrega,
               o.created_at, o.vendedor,
               ot.nome AS otica_nome, ot.codigo AS otica_codigo
        FROM lab_ordens o
        LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
        ${where}
        ORDER BY o.numero DESC
        LIMIT 500
      `).bind(...params).all();

      const ordens = result.results as Record<string, unknown>[];

      // Busca serviços de todas as OS encontradas
      const ids = ordens.map(o => o.id as string);
      let servicos: Record<string, unknown>[] = [];
      if (ids.length > 0) {
        try {
          const placeholders = ids.map(() => '?').join(',');
          const svcResult = await env.DB.prepare(`
            SELECT ordem_id, codigo, descricao, qtd, valor_unit, perc_desc, total
            FROM lab_servicos_os
            WHERE ordem_id IN (${placeholders}) AND tenant_id = ?
            ORDER BY ordem_id, id
          `).bind(...ids, tenant_id).all();
          servicos = svcResult.results as Record<string, unknown>[];
        } catch { /* se falhar, retorna sem serviços */ }
      }

      return json({ ordens, servicos });
    }

    // Sem otica_id: retorna resumo por ótica + totais
    const [porOtica, totais] = await Promise.all([
      env.DB.prepare(`
        SELECT ot.id AS otica_id, ot.nome AS otica_nome, ot.codigo AS otica_codigo,
               COUNT(o.id)  AS total_os,
               SUM(CASE WHEN o.status = 'entregue' THEN 1 ELSE 0 END) AS entregues,
               SUM(CASE WHEN o.status = 'cancelado' THEN 1 ELSE 0 END) AS canceladas,
               SUM(CASE WHEN o.status NOT IN ('entregue','cancelado') THEN 1 ELSE 0 END) AS em_aberto,
               COALESCE(SUM(o.total), 0) AS valor_total
        FROM lab_ordens o
        JOIN lab_oticas ot ON ot.id = o.otica_id
        ${where}
        GROUP BY ot.id
        ORDER BY valor_total DESC
      `).bind(...params).all(),

      env.DB.prepare(`
        SELECT COUNT(o.id) AS total_os, COALESCE(SUM(o.total), 0) AS valor_total
        FROM lab_ordens o ${where}
      `).bind(...params).first<{ total_os: number; valor_total: number }>(),
    ]);

    return json({ oticas: porOtica.results, totais });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
