import type { D1Database } from '@cloudflare/workers-types';
import type { AuthData } from './auth-middleware';

// Receitas (várias por cliente, com data) e histórico de movimentação do cliente.

export const PERM_HISTORICO = '/clientes/historico';

// admin sempre; outros só se o admin liberou "Histórico do cliente" nas permissões
export function podeVerHistorico(auth: AuthData): boolean {
  return auth.perfil === 'admin' || !!auth.menus?.includes(PERM_HISTORICO);
}

export const CAMPOS_RECEITA = ['od_esf', 'od_cil', 'od_eixo', 'oe_esf', 'oe_cil', 'oe_eixo', 'adicao', 'dp', 'altura'] as const;

let jaGarantiu = false;
export async function ensureClienteExtra(db: D1Database) {
  if (jaGarantiu) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS cliente_receitas (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cliente_id TEXT NOT NULL, data TEXT NOT NULL,
      ${CAMPOS_RECEITA.map(c => `${c} TEXT`).join(', ')},
      medico TEXT, observacao TEXT, usuario_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS cliente_historico (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cliente_id TEXT NOT NULL, tipo TEXT NOT NULL,
      descricao TEXT NOT NULL, valor REAL, ref_id TEXT, usuario_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  for (const sql of [
    'CREATE INDEX IF NOT EXISTS idx_clirec_cliente ON cliente_receitas(tenant_id, cliente_id, data)',
    'CREATE INDEX IF NOT EXISTS idx_clihist_cliente ON cliente_historico(tenant_id, cliente_id, created_at)',
  ]) { try { await db.prepare(sql).run(); } catch { /* ok */ } }
  jaGarantiu = true;
}

// Registra um acontecimento que não fica guardado em outro lugar (pagamento editado, receita, etapa, unificação...)
export async function registrarHistorico(db: D1Database, h: {
  tenant: string; clienteId: string | null | undefined; tipo: string; descricao: string; valor?: number | null; refId?: string | null; usuarioId?: string | null;
}) {
  if (!h.clienteId) return;
  try {
    await ensureClienteExtra(db);
    await db.prepare('INSERT INTO cliente_historico (id, tenant_id, cliente_id, tipo, descricao, valor, ref_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), h.tenant, h.clienteId, h.tipo, h.descricao.slice(0, 400), h.valor ?? null, h.refId ?? null, h.usuarioId ?? null).run();
  } catch { /* histórico nunca bloqueia a operação */ }
}

// A receita mais recente vira a "receita do cadastro" (rec_* em clientes), usada no resto do sistema
export async function atualizarUltimaReceita(db: D1Database, tenant: string, clienteId: string) {
  const r = await db.prepare(`SELECT * FROM cliente_receitas WHERE tenant_id = ? AND cliente_id = ? ORDER BY data DESC, created_at DESC LIMIT 1`)
    .bind(tenant, clienteId).first<Record<string, string | null>>();
  if (!r) return;
  try {
    await db.prepare(`UPDATE clientes SET rec_od_esf = ?, rec_od_cil = ?, rec_od_eixo = ?, rec_oe_esf = ?, rec_oe_cil = ?, rec_oe_eixo = ?,
      rec_adicao = ?, rec_dp = ?, rec_obs = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`)
      .bind(r.od_esf, r.od_cil, r.od_eixo, r.oe_esf, r.oe_cil, r.oe_eixo, r.adicao, r.dp, [r.medico, r.observacao].filter(Boolean).join(' · ') || null, clienteId, tenant).run();
  } catch { /* colunas antigas ausentes */ }
}

// Lê a receita do corpo da requisição (graus como texto: "-1.25", "+0.50", "180")
const txt = (v: unknown, max = 20) => { const s = String(v ?? '').trim().replace(',', '.'); return s ? s.slice(0, max) : null; };

export function lerReceita(b: Record<string, unknown>) {
  const data = /^\d{4}-\d{2}-\d{2}$/.test(String(b.data || '')) ? String(b.data) : new Date().toISOString().slice(0, 10);
  return {
    data,
    campos: CAMPOS_RECEITA.map(c => txt(b[c])),
    medico: String(b.medico ?? '').trim().slice(0, 120) || null,
    observacao: b.observacao ? String(b.observacao).trim().slice(0, 500) || null : null,
  };
}

