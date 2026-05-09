import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_fluxo (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        ordem_id TEXT NOT NULL,
        setor TEXT NOT NULL,
        setor_num INTEGER,
        maquina TEXT,
        operador TEXT,
        inicio_data TEXT,
        inicio_hora TEXT,
        termino_data TEXT,
        termino_hora TEXT,
        tempo_prev INTEGER,
        tempo_real INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch {}

  // Ensure setor_atual on lab_ordens
  try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN setor_atual TEXT').run(); } catch {}
}

// GET /api/lab/fluxo — fila de produção (OSes ativas)
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    await ensureTable(env);

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'em_producao';

    const query = status
      ? `SELECT o.id, o.numero, o.status, o.tipo, o.ref_otica, o.cont_interno, o.caixa,
                o.previsao_entrega, o.created_at, o.vendedor, o.setor_atual,
                ot.nome as otica_nome,
                a.tipo_lente, a.marca_material
         FROM lab_ordens o
         LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         LEFT JOIN lab_armacao a ON a.ordem_id = o.id
         WHERE o.tenant_id = ? AND o.status = ?
         ORDER BY o.previsao_entrega ASC, o.created_at ASC
         LIMIT 300`
      : `SELECT o.id, o.numero, o.status, o.tipo, o.ref_otica, o.cont_interno, o.caixa,
                o.previsao_entrega, o.created_at, o.vendedor, o.setor_atual,
                ot.nome as otica_nome,
                a.tipo_lente, a.marca_material
         FROM lab_ordens o
         LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
         LEFT JOIN lab_armacao a ON a.ordem_id = o.id
         WHERE o.tenant_id = ? AND o.status NOT IN ('entregue','cancelado')
         ORDER BY o.previsao_entrega ASC, o.created_at ASC
         LIMIT 300`;

    const params = status ? [tenant_id, status] : [tenant_id];
    const result = await env.DB.prepare(query).bind(...params).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST /api/lab/fluxo — lançar entrada/saída de setor
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    await ensureTable(env);

    const body = await request.json() as {
      ordem_id: string; setor: string; setor_num?: number;
      maquina?: string; operador?: string;
      inicio_data?: string; inicio_hora?: string;
      termino_data?: string; termino_hora?: string;
      tempo_prev?: number;
    };

    if (!body.ordem_id || !body.setor) {
      return json({ error: 'ordem_id e setor são obrigatórios' }, 400);
    }

    // Calc tempo_real if termino provided
    let tempo_real: number | null = null;
    if (body.inicio_data && body.inicio_hora && body.termino_data && body.termino_hora) {
      const ini = new Date(`${body.inicio_data}T${body.inicio_hora}`);
      const fim = new Date(`${body.termino_data}T${body.termino_hora}`);
      tempo_real = Math.round((fim.getTime() - ini.getTime()) / 60000);
    }

    const id = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO lab_fluxo (id, tenant_id, ordem_id, setor, setor_num, maquina, operador,
          inicio_data, inicio_hora, termino_data, termino_hora, tempo_prev, tempo_real)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tenant_id, body.ordem_id, body.setor, body.setor_num ?? null,
        body.maquina ?? null, body.operador ?? null,
        body.inicio_data ?? null, body.inicio_hora ?? null,
        body.termino_data ?? null, body.termino_hora ?? null,
        body.tempo_prev ?? null, tempo_real,
      ),
      // Update setor_atual on the order
      env.DB.prepare(
        `UPDATE lab_ordens SET setor_atual = ?, status = CASE WHEN status = 'aguardando' THEN 'em_producao' ELSE status END WHERE id = ? AND tenant_id = ?`
      ).bind(body.setor, body.ordem_id, tenant_id),
    ]);

    return json({ id, ok: true }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
