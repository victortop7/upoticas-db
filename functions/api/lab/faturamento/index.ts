import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_faturamento (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, numero INTEGER NOT NULL,
        otica_id TEXT NOT NULL, otica_nome TEXT,
        tipo TEXT NOT NULL DEFAULT 'mensal',
        periodo_ini TEXT NOT NULL, periodo_fim TEXT NOT NULL,
        valor_bruto REAL NOT NULL DEFAULT 0,
        desconto REAL NOT NULL DEFAULT 0,
        valor_liquido REAL NOT NULL DEFAULT 0,
        qtd_os INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'aberto',
        data_emissao TEXT NOT NULL,
        data_vencimento TEXT, data_pagamento TEXT,
        observacoes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch {}
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);

    const url = new URL(request.url);
    const status   = url.searchParams.get('status');
    const otica_id = url.searchParams.get('otica_id');

    let q = 'SELECT * FROM lab_faturamento WHERE tenant_id = ?';
    const params: unknown[] = [tenant_id];
    if (status)   { q += ' AND status = ?'; params.push(status); }
    if (otica_id) { q += ' AND otica_id = ?'; params.push(otica_id); }
    q += ' ORDER BY data_emissao DESC, numero DESC LIMIT 500';

    const rows = await env.DB.prepare(q).bind(...params).all<Record<string, unknown>>();
    return json(rows.results);
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);

    const b = await request.json() as Record<string, unknown>;
    if (!b.otica_id || !b.periodo_ini || !b.periodo_fim) return json({ error: 'Campos obrigatórios ausentes' }, 400);

    // Get ótica name
    const oticaRow = await env.DB.prepare('SELECT nome FROM lab_oticas WHERE id = ? AND tenant_id = ?')
      .bind(b.otica_id, tenant_id).first<{ nome: string }>();
    const otica_nome = oticaRow?.nome || String(b.otica_id);

    const numRow = await env.DB.prepare('SELECT COALESCE(MAX(numero),0)+1 AS next FROM lab_faturamento WHERE tenant_id=?')
      .bind(tenant_id).first<{ next: number }>();

    const id = crypto.randomUUID();
    const hoje = new Date().toISOString().split('T')[0];

    await env.DB.prepare(`
      INSERT INTO lab_faturamento
        (id,tenant_id,numero,otica_id,otica_nome,tipo,periodo_ini,periodo_fim,valor_bruto,desconto,valor_liquido,qtd_os,status,data_emissao,data_vencimento,observacoes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id, tenant_id, numRow?.next ?? 1,
      b.otica_id, otica_nome, b.tipo ?? 'mensal',
      b.periodo_ini, b.periodo_fim,
      b.valor_bruto ?? 0, b.desconto ?? 0, b.valor_liquido ?? 0,
      b.qtd_os ?? 0, 'aberto', hoje,
      b.data_vencimento ?? null, b.observacoes ?? null
    ).run();

    return json({ id }, 201);
  } catch (err) { return json({ error: String(err) }, 500); }
};
