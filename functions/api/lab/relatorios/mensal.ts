import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const mes = url.searchParams.get('mes');

    let where = 'WHERE o.tenant_id = ?';
    const params: unknown[] = [auth.tenant_id];

    if (mes) {
      where += ` AND strftime('%Y-%m', o.created_at) = ?`;
      params.push(mes);
    }

    const [porOtica, totais, porServico, meses] = await Promise.all([
      env.DB.prepare(`
        SELECT ot.nome AS otica_nome, ot.id AS otica_id,
               COUNT(o.id) AS total_pedidos, SUM(o.total) AS valor_total
        FROM lab_ordens o
        JOIN lab_oticas ot ON ot.id = o.otica_id
        ${where}
        GROUP BY ot.id ORDER BY valor_total DESC
      `).bind(...params).all(),

      env.DB.prepare(`
        SELECT COUNT(o.id) AS total_pedidos, SUM(o.total) AS valor_total
        FROM lab_ordens o ${where}
      `).bind(...params).first<{ total_pedidos: number; valor_total: number }>(),

      env.DB.prepare(`
        SELECT s.descricao,
               SUM(s.qtd)   AS qtd_total,
               SUM(s.total) AS valor_total
        FROM lab_servicos_os s
        JOIN lab_ordens o ON o.id = s.ordem_id
        ${where}
        GROUP BY s.descricao ORDER BY valor_total DESC
      `).bind(...params).all(),

      env.DB.prepare(`
        SELECT DISTINCT strftime('%Y-%m', created_at) AS mes
        FROM lab_ordens WHERE tenant_id = ?
        ORDER BY mes DESC LIMIT 24
      `).bind(auth.tenant_id).all<{ mes: string }>(),
    ]);

    return json({
      oticas:    porOtica.results,
      servicos:  porServico.results,
      totais,
      meses:     meses.results.map((r: { mes: string }) => r.mes),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
