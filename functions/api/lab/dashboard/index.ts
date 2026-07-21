import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// Fuso de São Paulo (UTC-3) para "hoje" bater com o dia do laboratório
const TZ = '-3 hours';

type Row = Record<string, unknown>;

// GET /api/lab/dashboard — métricas do painel principal
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    // garante a coluna de data de entrega
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN entregue_em TEXT').run(); } catch {}

    const ativos = `tenant_id = ? AND status != 'cancelado'`;

    const [totais, hoje, ultimoCli, ultimaEnt, lentes, serie] = await env.DB.batch([
      // contadores gerais
      env.DB.prepare(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'entregue'    THEN 1 ELSE 0 END) as entregues,
                SUM(CASE WHEN status = 'em_producao' THEN 1 ELSE 0 END) as em_producao,
                SUM(CASE WHEN status = 'aguardando'  THEN 1 ELSE 0 END) as aguardando,
                SUM(CASE WHEN status = 'pronto'      THEN 1 ELSE 0 END) as pronto
         FROM lab_ordens WHERE ${ativos}`
      ).bind(tenant_id),

      // atendidos hoje (OS abertas hoje) e entregues hoje
      env.DB.prepare(
        `SELECT
           SUM(CASE WHEN date(created_at, '${TZ}')  = date('now','${TZ}') THEN 1 ELSE 0 END) as abertas_hoje,
           SUM(CASE WHEN date(entregue_em, '${TZ}') = date('now','${TZ}') THEN 1 ELSE 0 END) as entregues_hoje
         FROM lab_ordens WHERE ${ativos}`
      ).bind(tenant_id),

      // último cliente atendido (OS mais recente)
      env.DB.prepare(
        `SELECT o.numero, o.created_at, ot.nome as otica_nome
         FROM lab_ordens o LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         WHERE o.tenant_id = ? AND o.status != 'cancelado'
         ORDER BY o.created_at DESC LIMIT 1`
      ).bind(tenant_id),

      // última entrega (usa entregue_em; cai para created_at em registros antigos)
      env.DB.prepare(
        `SELECT o.numero, COALESCE(o.entregue_em, o.created_at) as data, ot.nome as otica_nome
         FROM lab_ordens o LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         WHERE o.tenant_id = ? AND o.status = 'entregue'
         ORDER BY COALESCE(o.entregue_em, o.created_at) DESC LIMIT 1`
      ).bind(tenant_id),

      // visão simples x progressiva (tipo_lente '02'/PROGRESSIVA = progressiva)
      env.DB.prepare(
        `SELECT
           SUM(CASE WHEN UPPER(COALESCE(a.tipo_lente,'')) LIKE '%PROGRESS%'
                      OR TRIM(COALESCE(a.tipo_lente,'')) = '02' THEN 1 ELSE 0 END) as progressiva,
           SUM(CASE WHEN a.tipo_lente IS NOT NULL AND TRIM(a.tipo_lente) != ''
                     AND NOT (UPPER(a.tipo_lente) LIKE '%PROGRESS%' OR TRIM(a.tipo_lente) = '02') THEN 1 ELSE 0 END) as simples,
           SUM(CASE WHEN a.tipo_lente IS NULL OR TRIM(a.tipo_lente) = '' THEN 1 ELSE 0 END) as sem_tipo
         FROM lab_ordens o LEFT JOIN lab_armacao a ON a.ordem_id = o.id
         WHERE o.tenant_id = ? AND o.status != 'cancelado'`
      ).bind(tenant_id),

      // série dos últimos 14 dias
      env.DB.prepare(
        `SELECT date(created_at, '${TZ}') as dia, COUNT(*) as qtd
         FROM lab_ordens
         WHERE ${ativos} AND date(created_at, '${TZ}') >= date('now','${TZ}','-13 days')
         GROUP BY dia ORDER BY dia ASC`
      ).bind(tenant_id),
    ]);

    const t = (totais.results?.[0] ?? {}) as Row;
    const h = (hoje.results?.[0] ?? {}) as Row;
    const l = (lentes.results?.[0] ?? {}) as Row;
    const num = (v: unknown) => Number(v ?? 0);

    // preenche os 14 dias (inclusive os sem OS) para o gráfico não ficar com buracos
    const mapa = new Map<string, number>();
    for (const r of (serie.results ?? []) as Row[]) mapa.set(String(r.dia), num(r.qtd));
    const dias: { dia: string; qtd: number }[] = [];
    const base = new Date();
    base.setHours(base.getHours() - 3);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dias.push({ dia: key, qtd: mapa.get(key) ?? 0 });
    }

    return json({
      total: num(t.total),
      entregues: num(t.entregues),
      emProducao: num(t.em_producao),
      aguardando: num(t.aguardando),
      pronto: num(t.pronto),
      abertasHoje: num(h.abertas_hoje),
      entreguesHoje: num(h.entregues_hoje),
      ultimoCliente: (ultimoCli.results?.[0] ?? null) as Row | null,
      ultimaEntrega: (ultimaEnt.results?.[0] ?? null) as Row | null,
      lentes: { simples: num(l.simples), progressiva: num(l.progressiva), semTipo: num(l.sem_tipo) },
      serie: dias,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
