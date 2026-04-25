import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const os = await env.DB.prepare(`
    SELECT os.*, c.nome as cliente_nome FROM ordens_servico os
    LEFT JOIN clientes c ON c.id = os.cliente_id
    WHERE os.id = ? AND os.tenant_id = ?
  `).bind(params.id, auth.tenant_id).first();

  if (!os) return json({ error: 'OS não encontrada' }, 404);
  return json(os);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    if (!body.cliente_id) return json({ error: 'Cliente é obrigatório' }, 400);

    const existing = await env.DB.prepare(
      'SELECT id FROM ordens_servico WHERE id = ? AND tenant_id = ?'
    ).bind(params.id, auth.tenant_id).first();
    if (!existing) return json({ error: 'OS não encontrada' }, 404);

    const now = new Date().toISOString();
    const valorTotal = parseFloat(body.valor_total) || 0;
    const valorEntrada = parseFloat(body.valor_entrada) || 0;
    const valorRestante = valorTotal - valorEntrada;

    await env.DB.prepare(`
      UPDATE ordens_servico SET
        cliente_id = ?, tipo = ?, situacao = ?,
        longe_od_esf = ?, longe_od_cil = ?, longe_od_eixo = ?,
        longe_oe_esf = ?, longe_oe_cil = ?, longe_oe_eixo = ?,
        perto_od_esf = ?, perto_od_cil = ?, perto_od_eixo = ?,
        perto_oe_esf = ?, perto_oe_cil = ?, perto_oe_eixo = ?,
        dp = ?, altura = ?, adicao = ?,
        armacao_desc = ?, lente_desc = ?,
        valor_total = ?, valor_entrada = ?, valor_restante = ?,
        data_entrega = ?, medico = ?, observacao = ?,
        updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.cliente_id, body.tipo || 'oculos_grau', body.situacao || 'orcamento',
      parseFloat(body.longe_od_esf) || null, parseFloat(body.longe_od_cil) || null, parseFloat(body.longe_od_eixo) || null,
      parseFloat(body.longe_oe_esf) || null, parseFloat(body.longe_oe_cil) || null, parseFloat(body.longe_oe_eixo) || null,
      parseFloat(body.perto_od_esf) || null, parseFloat(body.perto_od_cil) || null, parseFloat(body.perto_od_eixo) || null,
      parseFloat(body.perto_oe_esf) || null, parseFloat(body.perto_oe_cil) || null, parseFloat(body.perto_oe_eixo) || null,
      parseFloat(body.dp) || null, parseFloat(body.altura) || null, parseFloat(body.adicao) || null,
      body.armacao_desc || null, body.lente_desc || null,
      valorTotal, valorEntrada, valorRestante,
      body.data_entrega || null, body.medico || null, body.observacao || null,
      now,
      params.id, auth.tenant_id
    ).run();

    const os = await env.DB.prepare(`
      SELECT os.*, c.nome as cliente_nome FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id WHERE os.id = ?
    `).bind(params.id).first();
    return json(os);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const existing = await env.DB.prepare(
    'SELECT id FROM ordens_servico WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first();
  if (!existing) return json({ error: 'OS não encontrada' }, 404);

  await env.DB.prepare(
    'DELETE FROM ordens_servico WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).run();

  return json({ success: true });
};
