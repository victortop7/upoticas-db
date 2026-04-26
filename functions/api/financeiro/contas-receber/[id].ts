import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;
    const now = new Date().toISOString();

    if (body.acao === 'receber') {
      await env.DB.prepare(`
        UPDATE contas_receber SET situacao = 'recebido', data_recebimento = ?, forma_recebimento = ?, conta_id = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(body.data_recebimento || now.split('T')[0], body.forma_recebimento || null, body.conta_id || null, now, params.id, auth.tenant_id).run();

      if (body.conta_id) {
        const cr = await env.DB.prepare('SELECT descricao, valor FROM contas_receber WHERE id = ?').bind(params.id).first<{ descricao: string; valor: number }>();
        if (cr) {
          await env.DB.prepare(
            'INSERT INTO movimentacoes_caixa (id, tenant_id, conta_id, tipo, descricao, valor, data, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), auth.tenant_id, body.conta_id, 'entrada', cr.descricao, cr.valor, body.data_recebimento || now.split('T')[0], 'conta_receber', now).run();
        }
      }
      return json({ success: true });
    }

    if (!body.descricao?.trim()) return json({ error: 'Descrição é obrigatória' }, 400);
    await env.DB.prepare(`
      UPDATE contas_receber SET descricao = ?, cliente_id = ?, categoria = ?, valor = ?, data_vencimento = ?, forma_recebimento = ?, conta_id = ?, observacao = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(body.descricao.trim(), body.cliente_id || null, body.categoria || null, parseFloat(body.valor) || 0,
      body.data_vencimento, body.forma_recebimento || null, body.conta_id || null, body.observacao || null, now,
      params.id, auth.tenant_id).run();

    return json({ success: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare('DELETE FROM contas_receber WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).run();
  return json({ success: true });
};
