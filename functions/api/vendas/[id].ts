import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
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

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    const existing = await env.DB.prepare(
      'SELECT id, cliente_id, valor_total, desconto, valor_final, valor_entrada, saldo_restante, forma_pagamento, observacao, os_id, situacao FROM vendas WHERE id = ? AND tenant_id = ?'
    ).bind(params.id, auth.tenant_id).first<{ id: string; cliente_id: string | null; valor_total: number; desconto: number; valor_final: number; valor_entrada: number; saldo_restante: number; forma_pagamento: string | null; observacao: string | null; os_id: string | null; situacao: string }>();
    if (!existing) return json({ error: 'Venda não encontrada' }, 404);

    const now = new Date().toISOString();

    // Suporte a valor_entrada e saldo_restante
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch {}
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN saldo_restante REAL NOT NULL DEFAULT 0').run(); } catch {}

    // Usa valores existentes como fallback quando campo não enviado
    const valorTotal = body.valor_total !== undefined ? (parseFloat(body.valor_total) || 0) : existing.valor_total;
    const desconto = body.desconto !== undefined ? (parseFloat(body.desconto) || 0) : existing.desconto;
    const valorFinal = valorTotal - desconto;

    const valorEntrada = body.valor_entrada !== undefined && body.valor_entrada !== ''
      ? parseFloat(body.valor_entrada)
      : (body.saldo_restante === '0' ? valorFinal : existing.valor_entrada);
    const saldoRestante = Math.max(0, valorFinal - valorEntrada);
    const situacao = saldoRestante > 0 ? 'pendente' : (body.situacao || 'ativa');

    await env.DB.prepare(`
      UPDATE vendas SET
        cliente_id = ?, os_id = ?, situacao = ?,
        valor_total = ?, desconto = ?, valor_final = ?,
        valor_entrada = ?, saldo_restante = ?,
        forma_pagamento = ?, observacao = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.cliente_id !== undefined ? (body.cliente_id || null) : existing.cliente_id,
      body.os_id !== undefined ? (body.os_id || null) : existing.os_id,
      situacao,
      valorTotal, desconto, valorFinal,
      valorEntrada, saldoRestante,
      body.forma_pagamento !== undefined ? (body.forma_pagamento || null) : existing.forma_pagamento,
      body.observacao !== undefined ? (body.observacao || null) : existing.observacao,
      now,
      params.id, auth.tenant_id
    ).run();

    // Ao finalizar (saldo zerado), move card CRM para pos_venda
    const clienteId = body.cliente_id || existing.cliente_id;
    if (saldoRestante === 0 && clienteId) {
      try {
        const card = await env.DB.prepare(
          `SELECT id FROM crm_cards WHERE cliente_id = ? AND tenant_id = ? AND estagio = 'oculos_pendente'`
        ).bind(clienteId, auth.tenant_id).first<{ id: string }>();

        if (card) {
          await env.DB.prepare(
            `UPDATE crm_cards SET estagio = 'oculos_pronto', updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`
          ).bind(card.id, auth.tenant_id).run();
        }
      } catch {}
    }

    const venda = await env.DB.prepare(`
      SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?
    `).bind(params.id).first();
    return json(venda);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
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
