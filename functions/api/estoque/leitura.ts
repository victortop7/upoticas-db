import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureEstoque } from '../../lib/estoque';

let jaGarantiu = false;
export async function ensureCodigoBarras(db: Env['DB']) {
  if (jaGarantiu) return;
  try { await db.prepare('ALTER TABLE produtos ADD COLUMN codigo_barras TEXT').run(); } catch { /* já existe */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_produtos_cb ON produtos(tenant_id, codigo_barras)').run(); } catch { /* ok */ }
  jaGarantiu = true;
}

type Produto = { id: string; codigo: string | null; codigo_barras: string | null; descricao: string; grupo: string | null; preco_venda: number };

async function acharProduto(env: Env, tenant: string, codigo: string): Promise<Produto | null> {
  return await env.DB.prepare(
    `SELECT id, codigo, codigo_barras, descricao, grupo, preco_venda FROM produtos
     WHERE tenant_id = ? AND ativo = 1 AND (codigo_barras = ? OR codigo = ?)
     ORDER BY CASE WHEN codigo_barras = ? THEN 0 ELSE 1 END LIMIT 1`
  ).bind(tenant, codigo, codigo, codigo).first<Produto>();
}

// GET /api/estoque/leitura?codigo=789...: acha o produto pelo código de barras (ou código interno)
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCodigoBarras(env.DB);
  const codigo = (new URL(request.url).searchParams.get('codigo') || '').trim();
  if (!codigo) return json({ error: 'codigo obrigatório' }, 400);
  const p = await acharProduto(env, auth.tenant_id, codigo);
  if (!p) return json({ encontrado: false });
  const e = await env.DB.prepare('SELECT quantidade FROM estoque WHERE tenant_id = ? AND produto_id = ?').bind(auth.tenant_id, p.id).first<{ quantidade: number }>();
  return json({ encontrado: true, produto: p, quantidade: e?.quantidade ?? 0 });
};

// POST /api/estoque/leitura: bipou: dá entrada ou baixa
//   { codigo, tipo: 'entrada'|'saida', quantidade?: 1, motivo?, novo?: { descricao, grupo, preco_venda, preco_custo } }
// Se o código não existe e vier "novo", cadastra o produto com esse código de barras antes.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureCodigoBarras(env.DB);
    const body = await request.json() as {
      codigo?: string; tipo?: string; quantidade?: number; motivo?: string;
      novo?: { descricao?: string; grupo?: string; preco_venda?: number; preco_custo?: number; categoria_id?: string; subcategoria_id?: string };
    };
    const codigo = String(body.codigo || '').trim();
    const tipo = body.tipo === 'saida' ? 'saida' : 'entrada';
    const qtd = Math.max(1, Math.round(Number(body.quantidade) || 1));
    if (!codigo) return json({ error: 'Código vazio' }, 400);

    let p = await acharProduto(env, auth.tenant_id, codigo);
    if (!p) {
      if (!body.novo?.descricao?.trim()) return json({ encontrado: false, error: 'Produto não cadastrado' }, 404);
      const id = crypto.randomUUID();
      await ensureEstoque(env.DB);
      let grupo = body.novo.grupo?.trim() || 'Armações';
      if (body.novo.categoria_id) {
        const c = await env.DB.prepare('SELECT nome FROM estoque_categorias WHERE id = ? AND tenant_id = ?').bind(body.novo.categoria_id, auth.tenant_id).first<{ nome: string }>();
        if (c) grupo = c.nome;
      }
      await env.DB.prepare(
        `INSERT INTO produtos (id, tenant_id, codigo, codigo_barras, descricao, grupo, unidade, preco_custo, preco_venda, categoria_id, subcategoria_id)
         VALUES (?, ?, ?, ?, ?, ?, 'UN', ?, ?, ?, ?)`
      ).bind(id, auth.tenant_id, codigo, codigo, body.novo.descricao.trim(), grupo,
        Number(body.novo.preco_custo) || 0, Number(body.novo.preco_venda) || 0, body.novo.categoria_id || null, body.novo.subcategoria_id || null).run();
      p = { id, codigo, codigo_barras: codigo, descricao: body.novo.descricao.trim(), grupo: body.novo.grupo?.trim() || 'Armações', preco_venda: Number(body.novo.preco_venda) || 0 };
    }

    const atual = await env.DB.prepare('SELECT quantidade FROM estoque WHERE tenant_id = ? AND produto_id = ?')
      .bind(auth.tenant_id, p.id).first<{ quantidade: number }>();
    const antes = atual?.quantidade ?? 0;
    if (tipo === 'saida' && antes < qtd) {
      return json({ error: `Sem estoque suficiente de "${p.descricao}" (tem ${antes}).`, produto: p, quantidade: antes }, 409);
    }
    const depois = tipo === 'entrada' ? antes + qtd : antes - qtd;
    const stmts = [
      atual
        ? env.DB.prepare("UPDATE estoque SET quantidade = ?, updated_at = datetime('now') WHERE tenant_id = ? AND produto_id = ?").bind(depois, auth.tenant_id, p.id)
        : env.DB.prepare('INSERT INTO estoque (id, tenant_id, produto_id, quantidade, quantidade_minima) VALUES (?, ?, ?, ?, 0)').bind(crypto.randomUUID(), auth.tenant_id, p.id, depois),
      env.DB.prepare(
        `INSERT INTO estoque_movimentacoes (id, tenant_id, produto_id, tipo, quantidade, quantidade_anterior, quantidade_nova, motivo, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), auth.tenant_id, p.id, tipo, qtd, antes, depois,
        body.motivo?.trim() || (tipo === 'entrada' ? 'Entrada por leitor' : 'Baixa por leitor'), auth.usuario_id),
    ];
    await env.DB.batch(stmts);
    return json({ ok: true, produto: p, tipo, quantidade: qtd, antes, depois });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
