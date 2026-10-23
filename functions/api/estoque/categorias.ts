import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { garantirCategorias, MATERIAIS_PADRAO, sqlBaixo } from '../../lib/estoque';

// GET /api/estoque/categorias: categorias (abas) com subcategorias e totais
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await garantirCategorias(env.DB, auth.tenant_id);
    const cats = await env.DB.prepare("SELECT id, nome, parent_id, icone, ordem, COALESCE(modo, 'modelo') AS modo, ncm FROM estoque_categorias WHERE tenant_id = ? ORDER BY ordem, nome")
      .bind(auth.tenant_id).all<{ id: string; nome: string; parent_id: string | null; icone: string | null; ordem: number; modo: string; ncm: string | null }>();
    const tot = await env.DB.prepare(
      `SELECT p.categoria_id, p.subcategoria_id, COUNT(*) AS itens, SUM(e.quantidade) AS pecas,
              SUM(CASE WHEN ${sqlBaixo()} THEN 1 ELSE 0 END) AS baixo
       FROM estoque e JOIN produtos p ON p.id = e.produto_id
       WHERE e.tenant_id = ? AND p.ativo = 1 GROUP BY p.categoria_id, p.subcategoria_id`
    ).bind(auth.tenant_id).all<{ categoria_id: string | null; subcategoria_id: string | null; itens: number; pecas: number; baixo: number }>();
    const somar = (f: (t: { categoria_id: string | null; subcategoria_id: string | null }) => boolean) =>
      (tot.results || []).filter(f).reduce((a, t) => ({ itens: a.itens + t.itens, pecas: a.pecas + (t.pecas || 0), baixo: a.baixo + (t.baixo || 0) }), { itens: 0, pecas: 0, baixo: 0 });
    const todas = cats.results || [];
    const lista = todas.filter(c => !c.parent_id).map(c => ({
      ...c,
      ...somar(t => t.categoria_id === c.id),
      subs: todas.filter(s => s.parent_id === c.id).map(s => ({ ...s, ...somar(t => t.subcategoria_id === s.id) })),
    }));
    return json({ categorias: lista, sem_categoria: somar(t => !t.categoria_id) });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST { nome, parent_id?, icone? }: nova categoria (aba) ou subcategoria
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await garantirCategorias(env.DB, auth.tenant_id);
    const b = await request.json() as { nome?: string; parent_id?: string | null; icone?: string; materiais_padrao?: boolean; modo?: string; ncm?: string };
    const nome = (b.nome || '').trim();
    if (!nome) return json({ error: 'Informe o nome' }, 400);
    if (b.parent_id) {
      const pai = await env.DB.prepare('SELECT id FROM estoque_categorias WHERE id = ? AND tenant_id = ? AND parent_id IS NULL').bind(b.parent_id, auth.tenant_id).first();
      if (!pai) return json({ error: 'Categoria não encontrada' }, 404);
    }
    const dup = await env.DB.prepare(`SELECT id FROM estoque_categorias WHERE tenant_id = ? AND lower(nome) = lower(?) AND COALESCE(parent_id, '') = ?`)
      .bind(auth.tenant_id, nome, b.parent_id || '').first();
    if (dup) return json({ error: 'Já existe com esse nome' }, 409);
    const ord = await env.DB.prepare(`SELECT COALESCE(MAX(ordem), -1) + 1 AS o FROM estoque_categorias WHERE tenant_id = ? AND COALESCE(parent_id, '') = ?`)
      .bind(auth.tenant_id, b.parent_id || '').first<{ o: number }>();
    const id = crypto.randomUUID();
    const modo = b.modo === 'quantidade' ? 'quantidade' : 'modelo';
    const stmts = [env.DB.prepare('INSERT INTO estoque_categorias (id, tenant_id, nome, parent_id, icone, ordem, modo, ncm) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, auth.tenant_id, nome, b.parent_id || null, b.icone || null, ord?.o ?? 0, modo, (b.ncm || '').replace(/\D/g, '') || null)];
    // grife/linha nova de armação: já cria Metal, Acetato, TR90… dentro
    if (!b.parent_id && b.materiais_padrao) {
      MATERIAIS_PADRAO.forEach((m, i) => stmts.push(env.DB.prepare('INSERT INTO estoque_categorias (id, tenant_id, nome, parent_id, ordem) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), auth.tenant_id, m, id, i)));
    }
    await env.DB.batch(stmts);
    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
