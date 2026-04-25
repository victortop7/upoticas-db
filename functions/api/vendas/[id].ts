import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const venda = await env.DB.prepare(`
    SELECT v.*, c.nome as cliente_nome FROM vendas v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    WHERE v.id = ? AND v.tenant_id = ?
  `).bind(params.id, auth.tenant_id).first();

  if (!venda) return json({ error: 'Venda não encontrada' }, 404);
  return json(venda);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    const existing = await env.DB.prepare(
      'SELECT id FROM vendas WHERE id = ? AND tenant_id = ?'
    ).bind(params.id, auth.tenant_id).first();
    if (!existing) return json({ error: 'Venda não encontrada' }, 404);

    const now = new Date().toISOString();
    const valorTotal = parseFloat(body.valor_total) || 0;
    const desconto = parseFloat(body.desconto) || 0;
    const valorFinal = valorTotal - desconto;

    await env.DB.prepare(`
      UPDATE vendas SET
        cliente_id = ?, os_id = ?, situacao = ?,
        valor_total = ?, desconto = ?, valor_final = ?,
        forma_pagamento = ?, observacao = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.cliente_id || null,
      body.os_id || null,
      body.situacao || 'ativa',
      valorTotal, desconto, valorFinal,
      body.forma_pagamento || null,
      body.observacao || null,
      now,
      params.id, auth.tenant_id
    ).run();

    const venda = await env.DB.prepare(`
      SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?
    `).bind(params.id).first();
    return json(venda);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const existing = await env.DB.prepare(
    'SELECT id FROM vendas WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first();
  if (!existing) return json({ error: 'Venda não encontrada' }, 404);

  await env.DB.prepare(
    'DELETE FROM vendas WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).run();

  return json({ success: true });
};
