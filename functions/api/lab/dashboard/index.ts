import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// Fuso de São Paulo (UTC-3) para "hoje" bater com o dia do laboratório
const TZ = '-3 hours';

type Row = Record<string, unknown>;

const isData = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// GET /api/lab/dashboard?de=AAAA-MM-DD&ate=AAAA-MM-DD — métricas do painel principal
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    // garante a coluna de data de entrega
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN entregue_em TEXT').run(); } catch {}

    // ── período (opcional). Sem parâmetros = todo o histórico ──
    const url = new URL(request.url);
    const deQ = url.searchParams.get('de');
    const ateQ = url.searchParams.get('ate');
    const de = isData(deQ) ? deQ : null;
    const ate = isData(ateQ) ? ateQ : null;

    // filtro por data de abertura da OS, aplicado às métricas do período
    const per = (col = 'created_at', alias = '') => {
      const c = `date(${alias}${col}, '${TZ}')`;
      if (de && ate) return { sql: ` AND ${c} BETWEEN ? AND ?`, args: [de, ate] };
      if (de)        return { sql: ` AND ${c} >= ?`,            args: [de] };
      if (ate)       return { sql: ` AND ${c} <= ?`,            args: [ate] };
      return { sql: '', args: [] as string[] };
    };

    const f = per();                 // sem alias (consultas de tabela única)
    const fo = per('created_at', 'o.'); // com alias o.

    const ativos = `tenant_id = ? AND status != 'cancelado'`;
    const ativosO = `o.tenant_id = ? AND o.status != 'cancelado'`;

    const [totais, hoje, ultimoCli, ultimaEnt, lentes, serieRows, prazosRows] = await env.DB.batch([
      // contadores do período
      env.DB.prepare(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'entregue'    THEN 1 ELSE 0 END) as entregues,
                SUM(CASE WHEN status = 'em_producao' THEN 1 ELSE 0 END) as em_producao,
                SUM(CASE WHEN status = 'aguardando'  THEN 1 ELSE 0 END) as aguardando,
                SUM(CASE WHEN status = 'pronto'      THEN 1 ELSE 0 END) as pronto,
                SUM(COALESCE(total,0)) as faturamento,
                SUM(CASE WHEN status = 'entregue' THEN COALESCE(total,0) ELSE 0 END) as fat_entregue,
                SUM(CASE WHEN status != 'entregue' THEN COALESCE(total,0) ELSE 0 END) as fat_aberto
         FROM lab_ordens WHERE ${ativos}${f.sql}`
      ).bind(tenant_id, ...f.args),

      // "hoje" é sempre o dia atual (não depende do filtro)
      env.DB.prepare(
        `SELECT
           SUM(CASE WHEN date(created_at, '${TZ}')  = date('now','${TZ}') THEN 1 ELSE 0 END) as abertas_hoje,
           SUM(CASE WHEN date(entregue_em, '${TZ}') = date('now','${TZ}') THEN 1 ELSE 0 END) as entregues_hoje
         FROM lab_ordens WHERE ${ativos}`
      ).bind(tenant_id),

      // último cliente atendido no período
      env.DB.prepare(
        `SELECT o.numero, o.created_at, ot.nome as otica_nome
         FROM lab_ordens o LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         WHERE ${ativosO}${fo.sql}
         ORDER BY o.created_at DESC LIMIT 1`
      ).bind(tenant_id, ...fo.args),

      // última entrega do período (usa entregue_em; cai para created_at nos registros antigos)
      env.DB.prepare(
        `SELECT o.numero, COALESCE(o.entregue_em, o.created_at) as data, ot.nome as otica_nome
         FROM lab_ordens o LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         WHERE o.tenant_id = ? AND o.status = 'entregue'${fo.sql}
         ORDER BY COALESCE(o.entregue_em, o.created_at) DESC LIMIT 1`
      ).bind(tenant_id, ...fo.args),

      // visão simples x progressiva no período
      env.DB.prepare(
        `SELECT
           SUM(CASE WHEN UPPER(COALESCE(a.tipo_lente,'')) LIKE '%PROGRESS%'
                      OR TRIM(COALESCE(a.tipo_lente,'')) = '02' THEN 1 ELSE 0 END) as progressiva,
           SUM(CASE WHEN a.tipo_lente IS NOT NULL AND TRIM(a.tipo_lente) != ''
                     AND NOT (UPPER(a.tipo_lente) LIKE '%PROGRESS%' OR TRIM(a.tipo_lente) = '02') THEN 1 ELSE 0 END) as simples,
           SUM(CASE WHEN a.tipo_lente IS NULL OR TRIM(a.tipo_lente) = '' THEN 1 ELSE 0 END) as sem_tipo
         FROM lab_ordens o LEFT JOIN lab_armacao a ON a.ordem_id = o.id
         WHERE ${ativosO}${fo.sql}`
      ).bind(tenant_id, ...fo.args),

      // série por dia dentro do período
      env.DB.prepare(
        `SELECT date(created_at, '${TZ}') as dia, COUNT(*) as qtd
         FROM lab_ordens WHERE ${ativos}${f.sql}
         GROUP BY dia ORDER BY dia ASC`
      ).bind(tenant_id, ...f.args),

      // prazos: sempre relativos a hoje (não dependem do filtro)
      env.DB.prepare(
        `SELECT o.id, o.numero, o.previsao_entrega, o.status, o.setor_atual,
                ot.nome as otica_nome, a.tipo_lente
         FROM lab_ordens o
         LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         LEFT JOIN lab_armacao a ON a.ordem_id = o.id
         WHERE o.tenant_id = ? AND o.status NOT IN ('entregue','cancelado')
           AND o.previsao_entrega IS NOT NULL AND TRIM(o.previsao_entrega) != ''
           AND date(o.previsao_entrega) <= date('now','${TZ}','+1 day')
         ORDER BY o.previsao_entrega ASC LIMIT 150`
      ).bind(tenant_id),
    ]);

    const t = (totais.results?.[0] ?? {}) as Row;
    const h = (hoje.results?.[0] ?? {}) as Row;
    const l = (lentes.results?.[0] ?? {}) as Row;
    const num = (v: unknown) => Number(v ?? 0);

    // hoje (em SP) como referência de datas
    const base = new Date();
    base.setHours(base.getHours() - 3);
    const hojeStr = base.toISOString().slice(0, 10);

    // ── série do gráfico ──
    // Sem filtro usa os últimos 14 dias. Com filtro, cobre o intervalo:
    // até 31 dias mostra por dia; acima disso agrupa por mês.
    const bruto = new Map<string, number>();
    for (const r of (serieRows.results ?? []) as Row[]) bruto.set(String(r.dia), num(r.qtd));

    const diaMs = 86400000;
    let ini: Date, fim: Date;
    if (de || ate) {
      ini = new Date((de ?? [...bruto.keys()].sort()[0] ?? hojeStr) + 'T00:00:00Z');
      fim = new Date((ate ?? hojeStr) + 'T00:00:00Z');
    } else {
      fim = new Date(hojeStr + 'T00:00:00Z');
      ini = new Date(fim.getTime() - 13 * diaMs);
    }
    if (fim < ini) fim = ini;

    const totalDias = Math.round((fim.getTime() - ini.getTime()) / diaMs) + 1;
    const serie: { dia: string; qtd: number; rotulo: string }[] = [];

    if (totalDias <= 31) {
      for (let i = 0; i < totalDias; i++) {
        const d = new Date(ini.getTime() + i * diaMs);
        const key = d.toISOString().slice(0, 10);
        serie.push({ dia: key, qtd: bruto.get(key) ?? 0, rotulo: key.slice(8, 10) + '/' + key.slice(5, 7) });
      }
    } else {
      // agrupa por mês
      const meses = new Map<string, number>();
      for (const [k, v] of bruto) meses.set(k.slice(0, 7), (meses.get(k.slice(0, 7)) ?? 0) + v);
      const cur = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth(), 1));
      const lim = new Date(Date.UTC(fim.getUTCFullYear(), fim.getUTCMonth(), 1));
      while (cur <= lim) {
        const key = cur.toISOString().slice(0, 7);
        serie.push({ dia: key, qtd: meses.get(key) ?? 0, rotulo: key.slice(5, 7) + '/' + key.slice(2, 4) });
        cur.setUTCMonth(cur.getUTCMonth() + 1);
      }
    }

    // ── prazos (sempre relativos a hoje) ──
    const amanha = new Date(base); amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().slice(0, 10);
    const prazos = { atrasados: [] as Row[], hoje: [] as Row[], amanha: [] as Row[] };
    for (const r of (prazosRows.results ?? []) as Row[]) {
      const p = String(r.previsao_entrega ?? '').slice(0, 10);
      if (p < hojeStr) prazos.atrasados.push(r);
      else if (p === hojeStr) prazos.hoje.push(r);
      else if (p === amanhaStr) prazos.amanha.push(r);
    }

    return json({
      periodo: { de, ate, agrupamento: totalDias <= 31 ? 'dia' : 'mes' },
      prazos,
      total: num(t.total),
      entregues: num(t.entregues),
      emProducao: num(t.em_producao),
      aguardando: num(t.aguardando),
      pronto: num(t.pronto),
      abertasHoje: num(h.abertas_hoje),
      entreguesHoje: num(h.entregues_hoje),
      faturamento: num(t.faturamento),
      faturamentoEntregue: num(t.fat_entregue),
      faturamentoAberto: num(t.fat_aberto),
      ticketMedio: num(t.total) > 0 ? num(t.faturamento) / num(t.total) : 0,
      ultimoCliente: (ultimoCli.results?.[0] ?? null) as Row | null,
      ultimaEntrega: (ultimaEnt.results?.[0] ?? null) as Row | null,
      lentes: { simples: num(l.simples), progressiva: num(l.progressiva), semTipo: num(l.sem_tipo) },
      serie,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
