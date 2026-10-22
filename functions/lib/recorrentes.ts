import type { D1Database } from '@cloudflare/workers-types';
import { ensureFinanceiroTables } from '../api/financeiro/setup';

// Contas a pagar recorrentes / fixas (água, luz, aluguel, internet...).
// O "molde" fica em contas_recorrentes; cada mês uma conta nova entra em contas_pagar
// automaticamente quando faltam DIAS_ANTES dias para o vencimento.
export const DIAS_ANTES = 5;

let jaGarantiu = false;
export async function ensureRecorrentes(db: D1Database) {
  if (jaGarantiu) return;
  await ensureFinanceiroTables(db);
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS contas_recorrentes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      descricao TEXT NOT NULL,
      fornecedor TEXT,
      fornecedor_id TEXT,
      categoria TEXT,
      valor REAL NOT NULL DEFAULT 0,
      dia INTEGER NOT NULL,
      fixa INTEGER NOT NULL DEFAULT 0,
      ajuste_fds TEXT NOT NULL DEFAULT 'manter',
      ultima_base TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_crec_tenant ON contas_recorrentes(tenant_id, ativo)').run(); } catch { /* ok */ }
  for (const c of ['recorrente_id TEXT', 'fornecedor_id TEXT']) {
    try { await db.prepare(`ALTER TABLE contas_pagar ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  jaGarantiu = true;
}

// Data de hoje em São Paulo (YYYY-MM-DD)
export function hojeSP(): string {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

function ymd(d: Date): string { return d.toISOString().slice(0, 10); }
function parse(s: string): Date { return new Date(`${s}T12:00:00Z`); }

// Mesmo dia no mês seguinte (dia 31 → último dia do mês quando não existe)
export function proximoMes(base: string, dia: number): string {
  const d = parse(base);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
  const ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return ymd(new Date(Date.UTC(y, m, Math.min(dia, ultimo), 12)));
}

// Sábado/domingo: mantém, antecipa pra sexta ou adia pra segunda
export function ajustarFds(data: string, ajuste: string): string {
  const d = parse(data);
  const dow = d.getUTCDay(); // 0 dom, 6 sáb
  if (ajuste === 'antes') { if (dow === 6) d.setUTCDate(d.getUTCDate() - 1); if (dow === 0) d.setUTCDate(d.getUTCDate() - 2); }
  if (ajuste === 'depois') { if (dow === 6) d.setUTCDate(d.getUTCDate() + 2); if (dow === 0) d.setUTCDate(d.getUTCDate() + 1); }
  return ymd(d);
}

function menosDias(data: string, n: number): string {
  const d = parse(data); d.setUTCDate(d.getUTCDate() - n); return ymd(d);
}

type Molde = { id: string; descricao: string; fornecedor: string | null; fornecedor_id: string | null; categoria: string | null; valor: number; dia: number; ajuste_fds: string; ultima_base: string };

// Lança as próximas contas dos moldes ativos (idempotente: pode chamar a cada abertura de tela)
export async function gerarRecorrentes(db: D1Database, tenantId: string): Promise<number> {
  await ensureRecorrentes(db);
  const hoje = hojeSP();
  const moldes = await db.prepare(
    'SELECT id, descricao, fornecedor, fornecedor_id, categoria, valor, dia, ajuste_fds, ultima_base FROM contas_recorrentes WHERE tenant_id = ? AND ativo = 1'
  ).bind(tenantId).all<Molde>();
  let criadas = 0;
  const now = new Date().toISOString();
  for (const m of moldes.results || []) {
    let base = m.ultima_base;
    const stmts = [];
    for (let i = 0; i < 24; i++) {
      const prox = proximoMes(base, m.dia);
      const venc = ajustarFds(prox, m.ajuste_fds);
      if (menosDias(venc, DIAS_ANTES) > hoje) break;
      // só insere se o molde ainda estiver na base lida (evita lançar em dobro com duas telas abertas)
      stmts.push(db.prepare(
        `INSERT INTO contas_pagar (id, tenant_id, descricao, fornecedor, fornecedor_id, categoria, valor, data_vencimento, situacao, recorrente_id, created_at, updated_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?
         WHERE EXISTS (SELECT 1 FROM contas_recorrentes WHERE id = ? AND ultima_base = ?)`
      ).bind(crypto.randomUUID(), tenantId, m.descricao, m.fornecedor, m.fornecedor_id, m.categoria, m.valor, venc, m.id, now, now, m.id, m.ultima_base));
      base = prox;
    }
    if (stmts.length) {
      stmts.push(db.prepare('UPDATE contas_recorrentes SET ultima_base = ? WHERE id = ? AND ultima_base = ?').bind(base, m.id, m.ultima_base));
      const res = await db.batch(stmts);
      for (const r of res.slice(0, -1)) criadas += ((r.meta as { changes?: number } | undefined)?.changes) || 0;
    }
  }
  return criadas;
}
