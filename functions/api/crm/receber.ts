import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

// POST /api/crm/receber
// Registra um recebimento (parcial ou total) contra uma VENDA ou uma OS.
// Body: { venda_id?, os_id?, valor_recebido, forma_pagamento? }
// - Soma o valor recebido à entrada e recalcula o saldo (não sobrescreve os demais dados).
// - Se o cliente quitar tudo (nenhuma OS/venda em aberto), avança o card A Receber → Pós-venda.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as {
      venda_id?: string; os_id?: string;
      valor_recebido?: string | number; forma_pagamento?: string;
    };

    const recebido = parseFloat(String(body.valor_recebido)) || 0;
    if (recebido <= 0) return json({ error: 'valor_recebido deve ser maior que zero' }, 400);
    const forma = body.forma_pagamento || null;
    const now = new Date().toISOString();

    let clienteId: string | null = null;
    let saldoRestante = 0;

    // Garante colunas de saldo em bases antigas
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN saldo_restante REAL NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE ordens_servico ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE ordens_servico ADD COLUMN valor_restante REAL NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }

    if (body.venda_id) {
      const v = await env.DB.prepare(
        'SELECT id, cliente_id, valor_final, valor_entrada FROM vendas WHERE id = ? AND tenant_id = ?'
      ).bind(body.venda_id, auth.tenant_id).first<{ id: string; cliente_id: string | null; valor_final: number; valor_entrada: number }>();
      if (!v) return json({ error: 'Venda não encontrada' }, 404);

      clienteId = v.cliente_id;
      const novaEntrada = (v.valor_entrada || 0) + recebido;
      saldoRestante = Math.max(0, (v.valor_final || 0) - novaEntrada);
      const situacao = saldoRestante > 0 ? 'pendente' : 'ativa';

      await env.DB.prepare(
        `UPDATE vendas SET valor_entrada = ?, saldo_restante = ?, situacao = ?,
           forma_pagamento = COALESCE(?, forma_pagamento), updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).bind(novaEntrada, saldoRestante, situacao, forma, now, body.venda_id, auth.tenant_id).run();

    } else if (body.os_id) {
      const os = await env.DB.prepare(
        'SELECT id, cliente_id, valor_total, valor_entrada FROM ordens_servico WHERE id = ? AND tenant_id = ?'
      ).bind(body.os_id, auth.tenant_id).first<{ id: string; cliente_id: string | null; valor_total: number; valor_entrada: number }>();
      if (!os) return json({ error: 'OS não encontrada' }, 404);

      clienteId = os.cliente_id;
      const novaEntrada = (os.valor_entrada || 0) + recebido;
      saldoRestante = Math.max(0, (os.valor_total || 0) - novaEntrada);

      // Atualiza SOMENTE o financeiro — não mexe em grau/produtos/situação da OS
      await env.DB.prepare(
        `UPDATE ordens_servico SET valor_entrada = ?, valor_restante = ?, updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).bind(novaEntrada, saldoRestante, now, body.os_id, auth.tenant_id).run();

    } else {
      return json({ error: 'Informe venda_id ou os_id' }, 400);
    }

    // Se o cliente não tem mais nada em aberto, conclui o card A Receber → Pós-venda
    if (clienteId) {
      try {
        const pend = await env.DB.prepare(`
          SELECT
            (SELECT COALESCE(SUM(valor_restante),0) FROM ordens_servico WHERE cliente_id = ? AND tenant_id = ? AND valor_restante > 0) as os_pend,
            (SELECT COALESCE(SUM(saldo_restante),0) FROM vendas WHERE cliente_id = ? AND tenant_id = ? AND saldo_restante > 0) as venda_pend
        `).bind(clienteId, auth.tenant_id, clienteId, auth.tenant_id)
          .first<{ os_pend: number; venda_pend: number }>();

        const totalPend = (pend?.os_pend || 0) + (pend?.venda_pend || 0);
        if (totalPend <= 0) {
          const card = await env.DB.prepare(
            'SELECT id, estagio FROM crm_cards WHERE cliente_id = ? AND tenant_id = ?'
          ).bind(clienteId, auth.tenant_id).first<{ id: string; estagio: string }>();
          if (card && card.estagio === 'a_receber') {
            await env.DB.prepare(
              `UPDATE crm_cards SET estagio = 'pos_venda', updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`
            ).bind(card.id, auth.tenant_id).run();
          }
        }
      } catch { /* card pode não existir */ }
    }

    return json({ ok: true, saldo_restante: saldoRestante });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
