import type { D1Database } from '@cloudflare/workers-types';

export async function ensureFinanceiroTables(db: D1Database) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS contas_financeiras (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'caixa',
      saldo_inicial REAL NOT NULL DEFAULT 0,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS contas_pagar (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      descricao TEXT NOT NULL,
      fornecedor TEXT,
      categoria TEXT,
      valor REAL NOT NULL DEFAULT 0,
      data_vencimento TEXT NOT NULL,
      data_pagamento TEXT,
      situacao TEXT NOT NULL DEFAULT 'pendente',
      forma_pagamento TEXT,
      conta_id TEXT,
      observacao TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS contas_receber (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      descricao TEXT NOT NULL,
      cliente_id TEXT,
      categoria TEXT,
      valor REAL NOT NULL DEFAULT 0,
      data_vencimento TEXT NOT NULL,
      data_recebimento TEXT,
      situacao TEXT NOT NULL DEFAULT 'pendente',
      forma_recebimento TEXT,
      conta_id TEXT,
      os_id TEXT,
      observacao TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      conta_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      categoria TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];

  for (const sql of tables) {
    try { await db.prepare(sql).run(); } catch {}
  }
}

export async function ensureContasPadrao(db: D1Database, tenant_id: string) {
  const existing = await db.prepare(
    'SELECT id FROM contas_financeiras WHERE tenant_id = ? LIMIT 1'
  ).bind(tenant_id).first();
  if (existing) return;

  const now = new Date().toISOString();
  const contas = [
    { nome: 'Loja', tipo: 'caixa' },
    { nome: 'Banco', tipo: 'banco' },
    { nome: 'Cofre', tipo: 'cofre' },
  ];
  for (const c of contas) {
    await db.prepare(
      'INSERT INTO contas_financeiras (id, tenant_id, nome, tipo, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), tenant_id, c.nome, c.tipo, now).run();
  }
}
