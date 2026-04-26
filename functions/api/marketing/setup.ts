import type { D1Database } from '@cloudflare/workers-types';

export async function ensureMarketingTables(db: D1Database) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS marketing_modelos (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'promocao',
      corpo TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS marketing_campanhas (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      modelo_id TEXT,
      mensagem TEXT NOT NULL,
      filtro_json TEXT,
      situacao TEXT NOT NULL DEFAULT 'rascunho',
      total_clientes INTEGER DEFAULT 0,
      enviados INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS marketing_historico (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      campanha_id TEXT,
      cliente_id TEXT,
      cliente_nome TEXT,
      celular TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'avulso',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];
  for (const sql of tables) {
    try { await db.prepare(sql).run(); } catch {}
  }
}
