import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureClienteExtra, registrarHistorico, atualizarUltimaReceita, lerReceita, CAMPOS_RECEITA } from '../../../lib/clienteExtra';

type Ctx = { request: Request; env: Env; params: { id: string } };
// GET /api/clientes/:id/receitas: receitas lançadas (mais recente primeiro)
export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureClienteExtra(env.DB);
  const r = await env.DB.prepare(
    `SELECT r.*, u.nome AS usuario_nome FROM cliente_receitas r LEFT JOIN usuarios u ON u.id = r.usuario_id
     WHERE r.tenant_id = ? AND r.cliente_id = ? ORDER BY r.data DESC, r.created_at DESC`
  ).bind(auth.tenant_id, params.id).all();
  return json(r.results || []);
};

// POST /api/clientes/:id/receitas: nova receita
export const onRequestPost = async ({ request, env, params }: Ctx) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureClienteExtra(env.DB);
    const cli = await env.DB.prepare('SELECT id FROM clientes WHERE id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id).first();
    if (!cli) return json({ error: 'Cliente não encontrado' }, 404);
    const r = lerReceita(await request.json() as Record<string, unknown>);
    if (!r.campos.some(Boolean)) return json({ error: 'Preencha pelo menos um grau' }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO cliente_receitas (id, tenant_id, cliente_id, data, ${CAMPOS_RECEITA.join(', ')}, medico, observacao, usuario_id)
       VALUES (?, ?, ?, ?, ${CAMPOS_RECEITA.map(() => '?').join(', ')}, ?, ?, ?)`
    ).bind(id, auth.tenant_id, params.id, r.data, ...r.campos, r.medico, r.observacao, auth.usuario_id).run();
    await atualizarUltimaReceita(env.DB, auth.tenant_id, params.id);
    await registrarHistorico(env.DB, { tenant: auth.tenant_id, clienteId: params.id, tipo: 'receita', descricao: `Receita nova de ${r.data.split('-').reverse().join('/')}${r.medico ? ` · ${r.medico}` : ''}`, refId: id, usuarioId: auth.usuario_id });
    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
