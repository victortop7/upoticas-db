import type { D1Database } from '@cloudflare/workers-types';

const ESTAGIOS_PADRAO = [
  { key: 'novo',             label: 'Cliente Cadastrado', icon: '📋', color: '#16a34a', ordem: 0,  sistema: 1 },
  { key: 'contato',          label: 'Em andamento',     icon: '📞', color: '#2563eb', ordem: 1,  sistema: 1 },
  { key: 'oculos_pendente',  label: 'Óculos Pendente',  icon: '👓', color: '#f59e0b', ordem: 2,  sistema: 1 },
  { key: 'oculos_pronto',    label: 'Óculos Pronto',    icon: '✅', color: '#16a34a', ordem: 3,  sistema: 1 },
  { key: 'pos_venda',        label: 'Pós-venda',        icon: '🏅', color: '#0891b2', ordem: 4,  sistema: 1 },
  { key: 'a_receber',        label: 'A Receber',        icon: '💳', color: '#dc2626', ordem: 5,  sistema: 1 },
  { key: 'aniversario',      label: 'Aniversário',      icon: '🎂', color: '#d97706', ordem: 6,  sistema: 1 },
  { key: 'indicacao',        label: 'Indicação',        icon: '👥', color: '#7c3aed', ordem: 7,  sistema: 1 },
  { key: 'reativacao',       label: 'Reativação',       icon: '🔄', color: '#ea580c', ordem: 8,  sistema: 1 },
  { key: 'vip',              label: 'VIP',              icon: '⭐', color: '#b45309', ordem: 9,  sistema: 1 },
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
  // Renomeia os estágios padrão para o fluxo atual, também em óticas já existentes.
  // Só troca se ainda estiver com o nome antigo (não sobrescreve customização do usuário).
  const renomear = [
    { key: 'novo',    de: 'Novos',   label: 'Cliente Cadastrado', icon: '📋', color: '#16a34a' },
    { key: 'contato', de: 'Contato', label: 'Em andamento',       icon: '📞', color: '#2563eb' },
  ];
  for (const r of renomear) {
    try {
      await db.prepare('UPDATE crm_estagios SET label = ?, icon = ?, color = ? WHERE tenant_id = ? AND key = ? AND label = ?')
        .bind(r.label, r.icon, r.color, tenant_id, r.key, r.de).run();
    } catch { /* coluna/tabela ainda não existe */ }
  }

  // Garante estágios do sistema mesmo em tenants já criados
  // 'novo' (Cliente Cadastrado) é garantido aqui: é onde todo cliente novo entra.
  const sistemicos = [
    { key: 'novo',            label: 'Cliente Cadastrado', icon: '📋', color: '#16a34a', ordem: 0 },
    { key: 'oculos_pendente', label: 'Óculos Pendente', icon: '👓', color: '#f59e0b', ordem: 2 },
    { key: 'oculos_pronto',   label: 'Óculos Pronto',   icon: '✅', color: '#16a34a', ordem: 3 },
  ];
  for (const s of sistemicos) {
    try {
      await db.prepare(
        'INSERT OR IGNORE INTO crm_estagios (id, tenant_id, key, label, icon, color, ordem, sistema) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), tenant_id, s.key, s.label, s.icon, s.color, s.ordem, 1).run();
    } catch {}
  }

  const existing = await db.prepare(
    'SELECT COUNT(*) as n FROM crm_estagios WHERE tenant_id = ?'
  ).bind(tenant_id).first<{ n: number }>();
  if ((existing?.n || 0) > 1) return;

  const now = new Date().toISOString();
  for (const e of ESTAGIOS_PADRAO) {
    try {
      await db.prepare(
        'INSERT OR IGNORE INTO crm_estagios (id, tenant_id, key, label, icon, color, ordem, sistema, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), tenant_id, e.key, e.label, e.icon, e.color, e.ordem, e.sistema, now).run();
    } catch {}
  }
}
