import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_contas_pagar (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, numero INTEGER NOT NULL,
        fornecedor TEXT, descricao TEXT NOT NULL, categoria TEXT,
        valor REAL NOT NULL, data_emissao TEXT NOT NULL,
        data_vencimento TEXT NOT NULL, data_pagamento TEXT,
        status TEXT DEFAULT 'aberto', forma_pgto TEXT, observacoes TEXT,
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
    const status  = url.searchParams.get('status');
    const dataIni = url.searchParams.get('data_ini');
    const dataFim = url.searchParams.get('data_fim');
    let query = 'SELECT * FROM lab_contas_pagar WHERE tenant_id = ?';
    const params: unknown[] = [tenant_id];
    if (status === 'vencido') {
      query += ` AND status = 'aberto' AND date(data_vencimento) < date('now')`;
    } else if (status) { query += ' AND status = ?'; params.push(status); }
    if (dataIni) { query += ' AND date(data_vencimento) >= ?'; params.push(dataIni); }
    if (dataFim) { query += ' AND date(data_vencimento) <= ?'; params.push(dataFim); }
    query += ' ORDER BY data_vencimento ASC LIMIT 500';
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
    if (!b.descricao || !b.valor || !b.data_vencimento) return json({ error: 'Campos obrigatórios ausentes' }, 400);
    const numRow = await env.DB.prepare('SELECT COALESCE(MAX(numero),0)+1 as next FROM lab_contas_pagar WHERE tenant_id=?').bind(tenant_id).first<{ next: number }>();
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO lab_contas_pagar (id,tenant_id,numero,fornecedor,descricao,categoria,valor,data_emissao,data_vencimento,observacoes) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,tenant_id,numRow?.next??1,b.fornecedor??null,b.descricao,b.categoria??null,b.valor,b.data_emissao??new Date().toISOString().split('T')[0],b.data_vencimento,b.observacoes??null).run();
    return json({ id }, 201);
  } catch (err) { return json({ error: String(err) }, 500); }
};
