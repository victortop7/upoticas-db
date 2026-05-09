import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const mes = url.searchParams.get('mes'); // formato YYYY-MM

    let where = 'WHERE o.tenant_id = ?';
    const params: unknown[] = [auth.tenant_id];

    if (mes) {
      where += ` AND strftime('%Y-%m', o.created_at) = ?`;
      params.push(mes);
    }

    // Por ótica
    const porOtica = await env.DB.prepare(`
      SELECT
        ot.nome        AS otica_nome,
        ot.id          AS otica_id,
        COUNT(o.id)    AS total_pedidos,
        SUM(o.total)   AS valor_total
      FROM lab_ordens o
      JOIN lab_oticas ot ON ot.id = o.otica_id
      ${where}
      GROUP BY ot.id
      ORDER BY valor_total DESC
    `).bind(...params).all();

    // Totais gerais
    const totais = await env.DB.prepare(`
      SELECT
        COUNT(o.id)  AS total_pedidos,
        SUM(o.total) AS valor_total
      FROM lab_ordens o
      ${where}
    `).bind(...params).first<{ total_pedidos: number; valor_total: number }>();

    // Meses disponíveis para o filtro
    const meses = await env.DB.prepare(`
      SELECT DISTINCT strftime('%Y-%m', created_at) AS mes
      FROM lab_ordens
      WHERE tenant_id = ?
      ORDER BY mes DESC
      LIMIT 24
    `).bind(auth.tenant_id).all<{ mes: string }>();

    return json({
      oticas: porOtica.results,
      totais,
      meses: meses.results.map(m => m.mes),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
