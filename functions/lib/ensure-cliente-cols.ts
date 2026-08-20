import type { D1Database } from '@cloudflare/workers-types';

// Adiciona colunas novas na tabela clientes de forma idempotente (migração leve).
export async function ensureClienteCols(db: D1Database) {
  // data_compra = data personalizada em que o cliente comprou (usada para prospecção/reativação)
  try { await db.prepare('ALTER TABLE clientes ADD COLUMN data_compra TEXT').run(); } catch {}
}
