import type { D1Database } from '@cloudflare/workers-types';

// Sistemas que uma conta (tenant) pode usar com o mesmo login.
export const SISTEMAS = ['otica', 'lab', 'vision'] as const;
export type Sistema = typeof SISTEMAS[number];

let jaGarantiu = false;

export async function ensureSistemas(db: D1Database) {
  if (jaGarantiu) return;
  try { await db.prepare('ALTER TABLE tenants ADD COLUMN sistemas TEXT').run(); } catch { /* já existe */ }
  jaGarantiu = true;
}

// Coluna gravada como "otica,vision". NULL = ainda não configurado no admin → libera tudo (comportamento antigo).
export function parseSistemas(raw: unknown): Sistema[] | null {
  if (raw == null || raw === '') return null;
  const lista = String(raw).split(',').map(s => s.trim()).filter((s): s is Sistema => (SISTEMAS as readonly string[]).includes(s));
  return lista.length ? lista : null;
}

export function normalizarSistemas(lista: unknown): string | null {
  if (!Array.isArray(lista)) return null;
  const ok = SISTEMAS.filter(s => lista.includes(s));
  return ok.length ? ok.join(',') : null;
}

export function podeUsar(raw: unknown, sistema?: string | null): boolean {
  if (!sistema) return true;
  const lista = parseSistemas(raw);
  return !lista || lista.includes(sistema as Sistema);
}
