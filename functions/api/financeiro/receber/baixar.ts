import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { baixarParcela, ensureReceber, hojeSP } from '../../../lib/receber';
import { onRequestPost as receberVenda } from '../../crm/receber';

// POST /api/financeiro/receber/baixar
//   { origem: 'carne'|'venda'|'manual', id, valor?, forma?, data?, conta_id?, desfazer? }
// Dá baixa no título vindo de qualquer origem e, se informar a conta, lança a entrada no caixa.
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureReceber(env.DB);
    const b = await request.json() as { origem?: string; id?: string; valor?: number | string; forma?: string; data?: string; conta_id?: string; desfazer?: boolean };
    if (!b.id) return json({ error: 'id obrigatório' }, 400);
    const data = /^\d{4}-\d{2}-\d{2}$/.test(b.data || '') ? b.data! : hojeSP();
    const now = new Date().toISOString();
    let valor = parseFloat(String(b.valor ?? '')) || 0;
    let descricao = '';

    if (b.origem === 'carne') {
      const r = await baixarParcela(env.DB, auth.tenant_id, b.id, !b.desfazer, data);
      if (!r.ok) return json({ error: r.erro }, 404);
      if (b.desfazer) return json({ ok: true });
      valor = r.valor; descricao = r.descricao;
    } else if (b.origem === 'venda') {
      if (valor <= 0) return json({ error: 'Informe o valor recebido' }, 400);
      // reaproveita o recebimento do CRM (acerta entrada/saldo, linha de pagamento e etapa do funil)
      const req = new Request(new URL('/api/crm/receber', request.url).toString(), {
        method: 'POST', headers: { cookie: request.headers.get('cookie') || '', 'content-type': 'application/json' },
        body: JSON.stringify({ venda_id: b.id, valor_recebido: valor, forma_pagamento: b.forma || null }),
      });
      const res = await receberVenda({ ...ctx, request: req } as never);
      if (!res.ok) return res;
      const v = await env.DB.prepare('SELECT numero FROM vendas WHERE id = ?').bind(b.id).first<{ numero: number }>();
      descricao = `Recebimento venda #${v?.numero ?? ''}`;
    } else if (b.origem === 'manual') {
      const cr = await env.DB.prepare('SELECT descricao, valor FROM contas_receber WHERE id = ? AND tenant_id = ?').bind(b.id, auth.tenant_id).first<{ descricao: string; valor: number }>();
      if (!cr) return json({ error: 'Conta não encontrada' }, 404);
      if (b.desfazer) {
        await env.DB.prepare(`UPDATE contas_receber SET situacao = 'pendente', data_recebimento = NULL, updated_at = ? WHERE id = ? AND tenant_id = ?`).bind(now, b.id, auth.tenant_id).run();
        return json({ ok: true });
      }
      await env.DB.prepare(`UPDATE contas_receber SET situacao = 'recebido', data_recebimento = ?, forma_recebimento = ?, conta_id = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`)
        .bind(data, b.forma || null, b.conta_id || null, now, b.id, auth.tenant_id).run();
      valor = cr.valor; descricao = cr.descricao;
    } else {
      return json({ error: 'origem inválida' }, 400);
    }

    if (b.conta_id && valor > 0) {
      await env.DB.prepare(
        'INSERT INTO movimentacoes_caixa (id, tenant_id, conta_id, tipo, descricao, valor, data, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), auth.tenant_id, b.conta_id, 'entrada', descricao, valor, data, 'conta_receber', now).run();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
