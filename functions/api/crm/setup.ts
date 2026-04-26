import type { D1Database } from '@cloudflare/workers-types';

export async function ensureCrmTable(db: D1Database) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS crm_cards (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        cliente_id TEXT NOT NULL,
        estagio TEXT NOT NULL DEFAULT 'novo',
        prioridade TEXT NOT NULL DEFAULT 'normal',
        notas TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
  } catch {}
}
