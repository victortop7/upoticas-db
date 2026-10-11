import type { D1Database } from '@cloudflare/workers-types';

// Uma linha por pagamento da venda (venda mista = várias linhas).
export interface LinhaPagamento {
  forma: string;
  valor: number;
  bandeira?: string | null;
  parcelas?: number | null;
  data_recebimento?: string | null; // YYYY-MM-DD
  conta?: string | null;            // conta / maquininha de destino
}

const FORMAS = ['dinheiro', 'pix', 'credito', 'debito', 'boleto', 'outro'];

let jaGarantiu = false;
export async function ensurePagamentos(db: D1Database) {
  if (jaGarantiu) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS venda_pagamentos (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, venda_id TEXT NOT NULL,
      forma TEXT NOT NULL, valor REAL NOT NULL DEFAULT 0,
      bandeira TEXT, parcelas INTEGER, data_recebimento TEXT, conta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_vpag_venda ON venda_pagamentos(tenant_id, venda_id)').run(); } catch {}
  jaGarantiu = true;
}

// Valida/limpa o array vindo do front. Retorna null se não veio nada (mantém comportamento antigo).
export function normalizarLinhas(raw: unknown): LinhaPagamento[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LinhaPagamento[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    const valor = Math.round((parseFloat(String(r.valor ?? '').replace(',', '.')) || 0) * 100) / 100;
    if (valor <= 0) continue;
    const forma = FORMAS.includes(String(r.forma)) ? String(r.forma) : 'outro';
    const parc = parseInt(String(r.parcelas ?? ''), 10);
    const data = String(r.data_recebimento ?? '');
    out.push({
      forma, valor,
      bandeira: r.bandeira ? String(r.bandeira).slice(0, 40) : null,
      parcelas: parc > 0 ? Math.min(parc, 48) : null,
      data_recebimento: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null,
      conta: r.conta ? String(r.conta).slice(0, 60) : null,
    });
  }
  return out;
}

// Quanto já entrou no caixa: tudo menos boleto/carnê (esse é recebido depois, nas parcelas).
export function recebidoDasLinhas(linhas: LinhaPagamento[]): number {
  return Math.round(linhas.filter(l => l.forma !== 'boleto').reduce((s, l) => s + l.valor, 0) * 100) / 100;
}

// Forma "resumo" gravada na venda: a única forma, ou "misto".
export function formaResumo(linhas: LinhaPagamento[], fallback: string | null): string | null {
  const formas = Array.from(new Set(linhas.map(l => l.forma)));
  if (formas.length === 0) return fallback;
  return formas.length === 1 ? formas[0] : 'misto';
}

// Substitui as linhas de pagamento da venda.
export async function salvarPagamentos(db: D1Database, tenantId: string, vendaId: string, linhas: LinhaPagamento[]) {
  await ensurePagamentos(db);
  const stmts = [db.prepare('DELETE FROM venda_pagamentos WHERE venda_id = ? AND tenant_id = ?').bind(vendaId, tenantId)];
  for (const l of linhas) {
    stmts.push(db.prepare(
      'INSERT INTO venda_pagamentos (id, tenant_id, venda_id, forma, valor, bandeira, parcelas, data_recebimento, conta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), tenantId, vendaId, l.forma, l.valor, l.bandeira ?? null, l.parcelas ?? null, l.data_recebimento ?? null, l.conta ?? null));
  }
  await db.batch(stmts);
}
