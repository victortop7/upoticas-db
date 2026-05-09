import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_contas_receber (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, numero INTEGER NOT NULL,
        otica_id TEXT NOT NULL, descricao TEXT NOT NULL,
        valor REAL NOT NULL, data_emissao TEXT NOT NULL,
        data_vencimento TEXT NOT NULL, data_pagamento TEXT,
        status TEXT DEFAULT 'aberto', forma_pgto TEXT,
        observacoes TEXT, ordem_id TEXT, ordem_numero INTEGER,
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
    const oticaId  = url.searchParams.get('otica_id');
    const dataIni  = url.searchParams.get('data_ini');
    const dataFim  = url.searchParams.get('data_fim');

    let query = `
      SELECT cr.*, ot.nome as otica_nome
      FROM lab_contas_receber cr
      LEFT JOIN lab_oticas ot ON ot.id = cr.otica_id
      WHERE cr.tenant_id = ?
    `;
    const params: unknown[] = [tenant_id];

    if (status === 'vencido') {
      query += ` AND cr.status = 'aberto' AND date(cr.data_vencimento) < date('now')`;
    } else if (status) {
      query += ` AND cr.status = ?`; params.push(status);
    }
    if (oticaId) { query += ' AND cr.otica_id = ?'; params.push(oticaId); }
    if (dataIni) { query += ' AND date(cr.data_vencimento) >= ?'; params.push(dataIni); }
    if (dataFim) { query += ' AND date(cr.data_vencimento) <= ?'; params.push(dataFim); }
    query += ' ORDER BY cr.data_vencimento ASC LIMIT 500';

    const r = await env.DB.prepare(query).bind(...params).all();
    return json(r.results);
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);
    const b = await request.json() as Record<string, unknown>;
    if (!b.otica_id || !b.descricao || !b.valor || !b.data_vencimento) return json({ error: 'Campos obrigatórios ausentes' }, 400);
    const numRow = await env.DB.prepare('SELECT COALESCE(MAX(numero),0)+1 as next FROM lab_contas_receber WHERE tenant_id=?').bind(tenant_id).first<{ next: number }>();
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO lab_contas_receber (id,tenant_id,numero,otica_id,descricao,valor,data_emissao,data_vencimento,observacoes,ordem_id,ordem_numero)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).bind(id,tenant_id,numRow?.next??1,b.otica_id,b.descricao,b.valor,b.data_emissao??new Date().toISOString().split('T')[0],b.data_vencimento,b.observacoes??null,b.ordem_id??null,b.ordem_numero??null).run();
    return json({ id }, 201);
  } catch (err) { return json({ error: String(err) }, 500); }
};
