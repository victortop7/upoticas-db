import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;
    const now = new Date().toISOString();

    // Ação: pagar
    if (body.acao === 'pagar') {
      await env.DB.prepare(`
        UPDATE contas_pagar SET situacao = 'pago', data_pagamento = ?, forma_pagamento = ?, conta_id = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(body.data_pagamento || now.split('T')[0], body.forma_pagamento || null, body.conta_id || null, now, params.id, auth.tenant_id).run();

      // Registra saída no caixa se conta informada
      if (body.conta_id) {
        const cp = await env.DB.prepare('SELECT descricao, valor FROM contas_pagar WHERE id = ?').bind(params.id).first<{ descricao: string; valor: number }>();
        if (cp) {
          await env.DB.prepare(
            'INSERT INTO movimentacoes_caixa (id, tenant_id, conta_id, tipo, descricao, valor, data, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), auth.tenant_id, body.conta_id, 'saida', cp.descricao, cp.valor, body.data_pagamento || now.split('T')[0], 'conta_pagar', now).run();
        }
      }
      return json({ success: true });
    }

    // Edição normal
    if (!body.descricao?.trim()) return json({ error: 'Descrição é obrigatória' }, 400);
    await env.DB.prepare(`
      UPDATE contas_pagar SET descricao = ?, fornecedor = ?, categoria = ?, valor = ?, data_vencimento = ?, forma_pagamento = ?, conta_id = ?, observacao = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(body.descricao.trim(), body.fornecedor || null, body.categoria || null, parseFloat(body.valor) || 0,
      body.data_vencimento, body.forma_pagamento || null, body.conta_id || null, body.observacao || null, now,
      params.id, auth.tenant_id).run();

    return json({ success: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare('DELETE FROM contas_pagar WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
