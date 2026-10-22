import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureEstoque } from '../../../lib/estoque';

// PUT { nome?, icone? }: renomeia
export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureEstoque(env.DB);
    const b = await request.json() as { nome?: string; icone?: string; modo?: string; ncm?: string | null };
    if (b.modo !== undefined || b.ncm !== undefined) {
      await env.DB.prepare('UPDATE estoque_categorias SET modo = COALESCE(?, modo), ncm = CASE WHEN ? = 1 THEN ? ELSE ncm END WHERE id = ? AND tenant_id = ?')
        .bind(b.modo === 'quantidade' || b.modo === 'modelo' ? b.modo : null, b.ncm !== undefined ? 1 : 0, String(b.ncm || '').replace(/\D/g, '') || null, params.id, auth.tenant_id).run();
    }
    if (b.nome !== undefined) {
      const nome = (b.nome || '').trim();
      if (!nome) return json({ error: 'Informe o nome' }, 400);
      await env.DB.prepare('UPDATE estoque_categorias SET nome = ?, icone = COALESCE(?, icone) WHERE id = ? AND tenant_id = ?')
        .bind(nome, b.icone || null, params.id, auth.tenant_id).run();
      // mantém o "grupo" dos produtos igual ao nome da categoria
      await env.DB.prepare('UPDATE produtos SET grupo = ? WHERE tenant_id = ? AND categoria_id = ?').bind(nome, auth.tenant_id, params.id).run();
      // e o nome dos produtos genéricos (modo quantidade): "<categoria> <material>"
      await env.DB.prepare(`UPDATE produtos SET descricao = trim(? || ' ' || COALESCE((SELECT s.nome FROM estoque_categorias s WHERE s.id = produtos.subcategoria_id), ''))
        WHERE tenant_id = ? AND generico = 1 AND categoria_id = ?`).bind(nome, auth.tenant_id, params.id).run();
      await env.DB.prepare(`UPDATE produtos SET descricao = trim(COALESCE((SELECT c.nome FROM estoque_categorias c WHERE c.id = produtos.categoria_id), '') || ' ' || ?)
        WHERE tenant_id = ? AND generico = 1 AND subcategoria_id = ?`).bind(nome, auth.tenant_id, params.id).run();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// DELETE: só se não tiver produto nela
export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureEstoque(env.DB);
    const em = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM produtos WHERE tenant_id = ? AND ativo = 1 AND (categoria_id = ? OR subcategoria_id = ?)`
    ).bind(auth.tenant_id, params.id, params.id).first<{ n: number }>();
    if (em && em.n > 0) return json({ error: `Tem ${em.n} produto(s) nela. Mova os produtos antes de excluir.` }, 409);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM estoque_categorias WHERE tenant_id = ? AND parent_id = ?').bind(auth.tenant_id, params.id),
      env.DB.prepare('DELETE FROM estoque_categorias WHERE tenant_id = ? AND id = ?').bind(auth.tenant_id, params.id),
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
