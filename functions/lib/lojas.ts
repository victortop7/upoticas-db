import type { D1Database } from '@cloudflare/workers-types';
import type { AuthData } from './auth-middleware';

let jaGarantiu = false;

// Garante a estrutura de multi-loja: tabela `lojas` + coluna `loja_id` nas tabelas operacionais.
export async function ensureLojaCols(db: D1Database) {
  if (jaGarantiu) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS lojas (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, nome TEXT NOT NULL,
      endereco TEXT, ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  for (const t of ['usuarios', 'clientes', 'vendas', 'ordens_servico', 'carnes', 'caixa']) {
    try { await db.prepare(`ALTER TABLE ${t} ADD COLUMN loja_id TEXT`).run(); } catch { /* já existe */ }
  }
  jaGarantiu = true;
}

// Vendedor (não-admin) com loja definida só enxerga a própria loja.
// Admin (ou usuário sem loja) vê tudo. Retorna o SQL + params pra concatenar no WHERE.
export function filtroLoja(auth: AuthData, coluna = 'loja_id'): { sql: string; params: string[] } {
  if (auth.perfil !== 'admin' && auth.loja_id) {
    return { sql: ` AND ${coluna} = ?`, params: [auth.loja_id] };
  }
  return { sql: '', params: [] };
}

// Mesma regra, mas deixa registros antigos (loja_id NULL) visíveis — usado em clientes
// pra não quebrar a base importada (compartilhada) enquanto as novas já nascem separadas.
export function filtroLojaComLegado(auth: AuthData, coluna = 'loja_id'): { sql: string; params: string[] } {
  if (auth.perfil !== 'admin' && auth.loja_id) {
    return { sql: ` AND (${coluna} = ? OR ${coluna} IS NULL)`, params: [auth.loja_id] };
  }
  return { sql: '', params: [] };
}

// loja_id a gravar ao criar um registro: a loja do vendedor; admin pode escolher via body.
export function lojaParaGravar(auth: AuthData, bodyLojaId?: string | null): string | null {
  if (auth.perfil === 'admin') return bodyLojaId || null;
  return auth.loja_id || null;
}
