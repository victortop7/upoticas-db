import type { Env } from '../../../../lib/types';
import { requireAuth, json } from '../../../../lib/auth-middleware';
import { ensureClienteExtra, registrarHistorico, atualizarUltimaReceita, lerReceita, CAMPOS_RECEITA } from '../../../../lib/clienteExtra';

type Ctx = { request: Request; env: Env; params: { id: string; rid: string } };

// PUT /api/clientes/:id/receitas/:rid: corrige uma receita
export const onRequestPut = async ({ request, env, params }: Ctx) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureClienteExtra(env.DB);
    const r = lerReceita(await request.json() as Record<string, unknown>);
    const res = await env.DB.prepare(
      `UPDATE cliente_receitas SET data = ?, ${CAMPOS_RECEITA.map(c => `${c} = ?`).join(', ')}, medico = ?, observacao = ?, updated_at = datetime('now')
       WHERE id = ? AND cliente_id = ? AND tenant_id = ?`
    ).bind(r.data, ...r.campos, r.medico, r.observacao, params.rid, params.id, auth.tenant_id).run();
    if (!res.meta.changes) return json({ error: 'Receita não encontrada' }, 404);
    await atualizarUltimaReceita(env.DB, auth.tenant_id, params.id);
    await registrarHistorico(env.DB, { tenant: auth.tenant_id, clienteId: params.id, tipo: 'receita', descricao: `Receita de ${r.data.split('-').reverse().join('/')} editada`, refId: params.rid, usuarioId: auth.usuario_id });
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// DELETE /api/clientes/:id/receitas/:rid
export const onRequestDelete = async ({ request, env, params }: Ctx) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureClienteExtra(env.DB);
  const r = await env.DB.prepare('SELECT data FROM cliente_receitas WHERE id = ? AND cliente_id = ? AND tenant_id = ?').bind(params.rid, params.id, auth.tenant_id).first<{ data: string }>();
  if (!r) return json({ error: 'Receita não encontrada' }, 404);
  await env.DB.prepare('DELETE FROM cliente_receitas WHERE id = ? AND tenant_id = ?').bind(params.rid, auth.tenant_id).run();
  await atualizarUltimaReceita(env.DB, auth.tenant_id, params.id);
  await registrarHistorico(env.DB, { tenant: auth.tenant_id, clienteId: params.id, tipo: 'receita', descricao: `Receita de ${r.data.split('-').reverse().join('/')} excluída`, refId: params.rid, usuarioId: auth.usuario_id });
  return json({ ok: true });
};
