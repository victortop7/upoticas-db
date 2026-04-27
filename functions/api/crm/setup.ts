import type { D1Database } from '@cloudflare/workers-types';

const ESTAGIOS_PADRAO = [
  { key: 'novo',        label: 'Novos',       icon: '🆕', color: '#64748b', ordem: 0,  sistema: 1 },
  { key: 'contato',     label: 'Contato',     icon: '📞', color: '#2563eb', ordem: 1,  sistema: 1 },
  { key: 'pos_venda',   label: 'Pós-venda',   icon: '💰', color: '#16a34a', ordem: 2,  sistema: 1 },
  { key: 'a_receber',   label: 'A Receber',   icon: '💳', color: '#dc2626', ordem: 3,  sistema: 1 },
  { key: 'aniversario', label: 'Aniversário', icon: '🎂', color: '#d97706', ordem: 4,  sistema: 1 },
  { key: 'indicacao',   label: 'Indicação',   icon: '👥', color: '#7c3aed', ordem: 5,  sistema: 1 },
  { key: 'reativacao',  label: 'Reativação',  icon: '🔄', color: '#ea580c', ordem: 6,  sistema: 1 },
  { key: 'vip',         label: 'VIP',         icon: '⭐', color: '#b45309', ordem: 7,  sistema: 1 },
];

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

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS crm_estagios (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '📌',
        color TEXT NOT NULL DEFAULT '#64748b',
        ordem INTEGER NOT NULL DEFAULT 0,
        sistema INTEGER NOT NULL DEFAULT 0,
        ativo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(tenant_id, key)
      )
    `).run();
  } catch {}
}

export async function ensureEstagiosPadrao(db: D1Database, tenant_id: string) {
  const existing = await db.prepare(
    'SELECT COUNT(*) as n FROM crm_estagios WHERE tenant_id = ?'
  ).bind(tenant_id).first<{ n: number }>();
  if ((existing?.n || 0) > 0) return;

  const now = new Date().toISOString();
  for (const e of ESTAGIOS_PADRAO) {
    try {
      await db.prepare(
        'INSERT OR IGNORE INTO crm_estagios (id, tenant_id, key, label, icon, color, ordem, sistema, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), tenant_id, e.key, e.label, e.icon, e.color, e.ordem, e.sistema, now).run();
    } catch {}
  }
}
