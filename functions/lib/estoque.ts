import type { D1Database } from '@cloudflare/workers-types';

// Categorias do estoque (abas) e subcategorias (ex.: Armações → Metal, Acetato, TR90…)
// + baixa automática do estoque pelas vendas.

// Vendas criadas a partir desta data dão baixa automática. As antigas só mexem no
// estoque se já tiverem movimentação ligada (evita baixar estoque ao editar venda antiga).
export const BAIXA_AUTO_DESDE = '2026-10-21';

// Materiais que toda linha/grife de armação costuma ter
export const MATERIAIS_PADRAO = ['Metal', 'Acetato', 'TR90', 'Parafusada', 'Clip On', 'Nylon', '360'];

const PADRAO: { nome: string; icone: string; subs: string[] }[] = [
  { nome: 'Armações', icone: '👓', subs: MATERIAIS_PADRAO },
  { nome: 'Óculos de Sol', icone: '🕶️', subs: [] },
  { nome: 'Limpeza', icone: '🧴', subs: [] },
  { nome: 'Acessórios', icone: '🎒', subs: [] },
];

let jaGarantiu = false;
export async function ensureEstoque(db: D1Database) {
  if (jaGarantiu) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS estoque_categorias (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, nome TEXT NOT NULL, parent_id TEXT,
      icone TEXT, ordem INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_estcat_tenant ON estoque_categorias(tenant_id, parent_id)').run(); } catch { /* ok */ }
  for (const c of ['categoria_id TEXT', 'subcategoria_id TEXT', 'codigo_barras TEXT']) {
    try { await db.prepare(`ALTER TABLE produtos ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  try { await db.prepare('ALTER TABLE estoque_movimentacoes ADD COLUMN venda_id TEXT').run(); } catch { /* já existe */ }
  // modo da categoria: 'modelo' (cada peça com código/preço) ou 'quantidade' (só conta por material)
  for (const c of ["modo TEXT NOT NULL DEFAULT 'modelo'", 'ncm TEXT']) {
    try { await db.prepare(`ALTER TABLE estoque_categorias ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  // produto "genérico" que representa um material inteiro no modo quantidade
  try { await db.prepare('ALTER TABLE produtos ADD COLUMN generico INTEGER NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_estmov_venda ON estoque_movimentacoes(tenant_id, venda_id)').run(); } catch { /* ok */ }
  jaGarantiu = true;
}

// Cria as categorias padrão na 1ª vez e encaixa os produtos antigos pelo "grupo"
export async function garantirCategorias(db: D1Database, tenant: string) {
  await ensureEstoque(db);
  const tem = await db.prepare('SELECT id FROM estoque_categorias WHERE tenant_id = ? LIMIT 1').bind(tenant).first();
  if (tem) return;
  const stmts = [];
  let ordem = 0;
  for (const c of PADRAO) {
    const id = crypto.randomUUID();
    stmts.push(db.prepare('INSERT INTO estoque_categorias (id, tenant_id, nome, parent_id, icone, ordem) VALUES (?, ?, ?, NULL, ?, ?)').bind(id, tenant, c.nome, c.icone, ordem++));
    c.subs.forEach((s, i) => stmts.push(db.prepare('INSERT INTO estoque_categorias (id, tenant_id, nome, parent_id, ordem) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), tenant, s, id, i)));
  }
  await db.batch(stmts);
  // produtos antigos: "grupo" parecido com o nome da categoria
  const regras: [string, string][] = [['Armações', 'arma%'], ['Óculos de Sol', '%sol%'], ['Limpeza', 'limp%'], ['Acessórios', 'aces%']];
  for (const [nome, like] of regras) {
    try {
      await db.prepare(`UPDATE produtos SET categoria_id = (SELECT id FROM estoque_categorias WHERE tenant_id = ? AND parent_id IS NULL AND nome = ?)
        WHERE tenant_id = ? AND categoria_id IS NULL AND lower(trim(COALESCE(grupo, ''))) LIKE ?`).bind(tenant, nome, tenant, like).run();
    } catch { /* ok */ }
  }
}

type LinhaQtd = { produto_id: string; qtd: number };

// Deixa o estoque coerente com a venda: soma o que já foi baixado por ela e lança só a diferença.
// Venda cancelada/excluída → devolve tudo. Pode chamar quantas vezes quiser (idempotente).
export async function sincronizarEstoqueVenda(db: D1Database, tenant: string, vendaId: string, usuarioId?: string | null, opts?: { excluindo?: boolean }) {
  await ensureEstoque(db);
  const venda = await db.prepare('SELECT id, numero, situacao, created_at FROM vendas WHERE id = ? AND tenant_id = ?')
    .bind(vendaId, tenant).first<{ id: string; numero: number; situacao: string; created_at: string }>();

  const jaMexeu = await db.prepare(
    `SELECT produto_id, SUM(CASE WHEN tipo = 'saida' THEN quantidade WHEN tipo = 'entrada' THEN -quantidade ELSE 0 END) AS qtd
     FROM estoque_movimentacoes WHERE tenant_id = ? AND venda_id = ? GROUP BY produto_id`
  ).bind(tenant, vendaId).all<LinhaQtd>();
  const aplicado = new Map((jaMexeu.results || []).map(r => [r.produto_id, Number(r.qtd) || 0]));

  // venda antiga sem movimentação ligada: não mexe
  if (!aplicado.size && (!venda || String(venda.created_at).slice(0, 10) < BAIXA_AUTO_DESDE)) return { mudou: 0 };

  const desejado = new Map<string, number>();
  if (venda && !opts?.excluindo && venda.situacao !== 'cancelada') {
    // só produtos que têm controle de estoque (estão na tabela estoque)
    const itens = await db.prepare(
      `SELECT i.produto_id, SUM(i.quantidade) AS qtd FROM venda_itens i
       JOIN estoque e ON e.produto_id = i.produto_id AND e.tenant_id = i.tenant_id
       WHERE i.venda_id = ? AND i.tenant_id = ? AND i.produto_id IS NOT NULL GROUP BY i.produto_id`
    ).bind(vendaId, tenant).all<LinhaQtd>();
    for (const r of itens.results || []) desejado.set(r.produto_id, Number(r.qtd) || 0);
  }

  const produtos = new Set([...aplicado.keys(), ...desejado.keys()]);
  const numero = venda?.numero ?? '';
  let mudou = 0;
  for (const pid of produtos) {
    const delta = Math.round(((desejado.get(pid) || 0) - (aplicado.get(pid) || 0)) * 1000) / 1000;
    if (!delta) continue;
    const atual = await db.prepare('SELECT quantidade FROM estoque WHERE tenant_id = ? AND produto_id = ?').bind(tenant, pid).first<{ quantidade: number }>();
    const antes = Number(atual?.quantidade ?? 0);
    const depois = antes - delta; // pode ficar negativo: mostra que faltou dar entrada
    const tipo = delta > 0 ? 'saida' : 'entrada';
    const motivo = delta > 0 ? `Venda #${numero}` : (opts?.excluindo || venda?.situacao === 'cancelada' ? `Estorno — venda #${numero} cancelada` : `Ajuste da venda #${numero}`);
    await db.batch([
      atual
        ? db.prepare("UPDATE estoque SET quantidade = ?, updated_at = datetime('now') WHERE tenant_id = ? AND produto_id = ?").bind(depois, tenant, pid)
        : db.prepare('INSERT INTO estoque (id, tenant_id, produto_id, quantidade, quantidade_minima) VALUES (?, ?, ?, ?, 0)').bind(crypto.randomUUID(), tenant, pid, depois),
      db.prepare(
        `INSERT INTO estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, quantidade_anterior, quantidade_nova, motivo, documento, usuario_id, venda_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), tenant, pid, tipo, Math.abs(delta), antes, depois, motivo, `Venda #${numero}`, usuarioId || null, vendaId),
    ]);
    mudou++;
  }
  return { mudou };
}
