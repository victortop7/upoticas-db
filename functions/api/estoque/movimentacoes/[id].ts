import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { reverterNaLoja, ensureEstoqueLojas } from '../../../lib/estoqueLojas';

// DELETE /api/estoque/movimentacoes/:id: desfaz uma movimentação lançada à mão.
// A quantidade volta como estava antes dela. Movimento de venda não: esse acompanha a venda
// (cancelar ou editar a venda é que devolve ao estoque).
export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    const m = await env.DB.prepare('SELECT * FROM estoque_movimentacoes WHERE id = ? AND tenant_id = ?')
      .bind(params.id, auth.tenant_id).first<{ id: string; produto_id: string; tipo: string; quantidade: number; quantidade_anterior: number; quantidade_nova: number; venda_id?: string | null; usuario_id?: string | null; loja_id?: string | null }>();
    if (!m) return json({ error: 'Movimentação não encontrada' }, 404);
    if (m.venda_id) return json({ error: 'Essa saída é de uma venda. Para devolver, cancele ou edite a venda.' }, 409);
    if (auth.perfil !== 'admin' && m.usuario_id !== auth.usuario_id) return json({ error: 'Só o admin ou quem lançou pode desfazer' }, 403);

    // efeito que ela teve no estoque
    const efeito = m.tipo === 'entrada' ? Number(m.quantidade) : m.tipo === 'saida' ? -Number(m.quantidade) : Number(m.quantidade_nova) - Number(m.quantidade_anterior);
    await ensureEstoqueLojas(env.DB);
    const nova = await reverterNaLoja(env.DB, auth.tenant_id, m.produto_id, m.loja_id || null, efeito);
    await env.DB.prepare('DELETE FROM estoque_movimentacoes WHERE id = ? AND tenant_id = ?').bind(m.id, auth.tenant_id).run();
    return json({ ok: true, quantidade: nova });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
