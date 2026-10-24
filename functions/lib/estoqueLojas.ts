import type { D1Database } from '@cloudflare/workers-types';

// Estoque por loja. estoque.quantidade continua sendo o TOTAL (soma das lojas), assim o resto do
// sistema segue funcionando; a quantidade de cada loja fica em estoque_lojas.
// loja_id '' = peças lançadas antes de existir separação por loja ("sem loja").

let jaGarantiu = false;
export async function ensureEstoqueLojas(db: D1Database) {
  if (jaGarantiu) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS estoque_lojas (
      tenant_id TEXT NOT NULL, produto_id TEXT NOT NULL, loja_id TEXT NOT NULL DEFAULT '', quantidade REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (tenant_id, produto_id, loja_id)
    )`).run();
  } catch { /* ok */ }
  try { await db.prepare('ALTER TABLE estoque_movimentacoes ADD COLUMN loja_id TEXT').run(); } catch { /* já existe */ }
  // o que já existia vira "sem loja" (uma vez por produto)
  try {
    await db.prepare(`INSERT OR IGNORE INTO estoque_lojas (tenant_id, produto_id, loja_id, quantidade)
      SELECT e.tenant_id, e.produto_id, '', e.quantidade FROM estoque e
      WHERE e.quantidade != 0 AND NOT EXISTS (SELECT 1 FROM estoque_lojas el WHERE el.tenant_id = e.tenant_id AND el.produto_id = e.produto_id)`).run();
  } catch { /* ok */ }
  jaGarantiu = true;
}

// Fonte da quantidade nas consultas: total (tabela estoque) ou de uma loja só.
// Use no lugar de "estoque e": `FROM ${fonteEstoque(loja)} e`, com os params de paramsFonte(loja) antes dos outros.
export function fonteEstoque(lojaId: string | null | undefined): string {
  if (!lojaId) return 'estoque';
  return `(SELECT est.id, est.tenant_id, est.produto_id, est.quantidade_minima, est.quantidade_maxima, est.localizacao, est.updated_at,
      COALESCE((SELECT el.quantidade FROM estoque_lojas el WHERE el.tenant_id = est.tenant_id AND el.produto_id = est.produto_id AND el.loja_id = ?), 0) AS quantidade
    FROM estoque est)`;
}
export const paramsFonte = (lojaId: string | null | undefined): string[] => (lojaId ? [lojaId] : []);

export interface Movimento {
  produtoId: string; lojaId: string | null | undefined; tipo: 'entrada' | 'saida' | 'ajuste'; quantidade: number;
  motivo?: string | null; documento?: string | null; usuarioId?: string | null; vendaId?: string | null;
  fornecedorId?: string | null; precoUnitario?: number | null; quantidadeMinima?: number | null; localizacao?: string | null;
}

// Lança uma movimentação numa loja e recalcula o total do produto.
// ajuste = "contei X nesta loja". Pode ficar negativo (vendeu sem ter dado entrada).
export async function movimentarEstoque(db: D1Database, tenant: string, m: Movimento) {
  await ensureEstoqueLojas(db);
  const loja = m.lojaId || '';
  const atual = await db.prepare('SELECT quantidade FROM estoque_lojas WHERE tenant_id = ? AND produto_id = ? AND loja_id = ?')
    .bind(tenant, m.produtoId, loja).first<{ quantidade: number }>();
  const antes = Number(atual?.quantidade ?? 0);
  const q = Number(m.quantidade) || 0;
  const depois = m.tipo === 'entrada' ? antes + q : m.tipo === 'saida' ? antes - q : q;

  const est = await db.prepare('SELECT id FROM estoque WHERE tenant_id = ? AND produto_id = ?').bind(tenant, m.produtoId).first<{ id: string }>();
  await db.batch([
    db.prepare(`INSERT INTO estoque_lojas (tenant_id, produto_id, loja_id, quantidade, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(tenant_id, produto_id, loja_id) DO UPDATE SET quantidade = excluded.quantidade, updated_at = excluded.updated_at`)
      .bind(tenant, m.produtoId, loja, depois),
    est
      ? db.prepare(`UPDATE estoque SET quantidade = (SELECT COALESCE(SUM(quantidade), 0) FROM estoque_lojas WHERE tenant_id = ? AND produto_id = ?),
          quantidade_minima = COALESCE(?, quantidade_minima), localizacao = COALESCE(?, localizacao), updated_at = datetime('now')
          WHERE tenant_id = ? AND produto_id = ?`).bind(tenant, m.produtoId, m.quantidadeMinima ?? null, m.localizacao ?? null, tenant, m.produtoId)
      : db.prepare(`INSERT INTO estoque (id, tenant_id, produto_id, quantidade, quantidade_minima, localizacao)
          VALUES (?, ?, ?, (SELECT COALESCE(SUM(quantidade), 0) FROM estoque_lojas WHERE tenant_id = ? AND produto_id = ?), ?, ?)`)
          .bind(crypto.randomUUID(), tenant, m.produtoId, tenant, m.produtoId, m.quantidadeMinima ?? 0, m.localizacao ?? null),
    db.prepare(`INSERT INTO estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, quantidade_anterior, quantidade_nova, motivo, documento, fornecedor_id, preco_unitario, usuario_id, venda_id, loja_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), tenant, m.produtoId, m.tipo, m.tipo === 'ajuste' ? Math.abs(depois - antes) : Math.abs(q), antes, depois,
        m.motivo ?? null, m.documento ?? null, m.fornecedorId ?? null, m.precoUnitario ?? null, m.usuarioId ?? null, m.vendaId ?? null, loja || null),
  ]);
  return { antes, depois };
}

// Desfaz o efeito de uma movimentação na loja dela (usado pelo "Desfazer")
export async function reverterNaLoja(db: D1Database, tenant: string, produtoId: string, lojaId: string | null, efeito: number) {
  await ensureEstoqueLojas(db);
  const loja = lojaId || '';
  await db.batch([
    db.prepare(`INSERT INTO estoque_lojas (tenant_id, produto_id, loja_id, quantidade) VALUES (?, ?, ?, ?)
      ON CONFLICT(tenant_id, produto_id, loja_id) DO UPDATE SET quantidade = quantidade - ?, updated_at = datetime('now')`)
      .bind(tenant, produtoId, loja, -efeito, efeito),
    db.prepare(`UPDATE estoque SET quantidade = (SELECT COALESCE(SUM(quantidade), 0) FROM estoque_lojas WHERE tenant_id = ? AND produto_id = ?), updated_at = datetime('now')
      WHERE tenant_id = ? AND produto_id = ?`).bind(tenant, produtoId, tenant, produtoId),
  ]);
  const r = await db.prepare('SELECT quantidade FROM estoque WHERE tenant_id = ? AND produto_id = ?').bind(tenant, produtoId).first<{ quantidade: number }>();
  return Number(r?.quantidade ?? 0);
}

// Quanto tem em cada loja, por produto: "lojaId:qtd,lojaId:qtd" (pra mostrar no total)
export const SQL_POR_LOJA = `(SELECT GROUP_CONCAT(el.loja_id || ':' || el.quantidade) FROM estoque_lojas el WHERE el.tenant_id = e.tenant_id AND el.produto_id = e.produto_id AND el.quantidade != 0)`;

// loja da movimentação: o que veio na tela; vendedor preso numa loja usa a dele
export function lojaDoMovimento(auth: { perfil: string; loja_id?: string | null }, pedida: unknown): string | null {
  if (auth.perfil !== 'admin' && auth.loja_id) return auth.loja_id;
  const s = String(pedida ?? '').trim();
  return s || null;
}
