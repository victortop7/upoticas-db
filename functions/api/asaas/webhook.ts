import type { Env } from '../../lib/types';

// POST /api/asaas/webhook — o Asaas chama esta URL quando um pagamento acontece.
// Renova a licença no servidor, independente do app estar aberto ou não.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  // 1) Segurança: se um token estiver configurado, exige que o Asaas envie o mesmo
  if (env.ASAAS_WEBHOOK_TOKEN) {
    const enviado = request.headers.get('asaas-access-token') || '';
    if (enviado !== env.ASAAS_WEBHOOK_TOKEN) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  }

  try {
    const body = await request.json().catch(() => ({})) as {
      event?: string;
      payment?: { id?: string; customer?: string; status?: string };
    };

    const pay = body.payment;
    const status = pay?.status || '';
    const pago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status);

    // Só age em pagamento efetivado; qualquer outro evento é ignorado (retorna 200)
    if (pago && pay?.customer && pay?.id) {
      try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN asaas_last_paid TEXT').run(); } catch { /* já existe */ }

      const tenant = await env.DB.prepare('SELECT id, asaas_last_paid FROM tenants WHERE asaas_customer_id = ?')
        .bind(pay.customer).first<Record<string, unknown>>();

      // Estende +30 dias uma única vez por pagamento (idempotente)
      if (tenant && tenant.asaas_last_paid !== pay.id) {
        await env.DB.prepare(
          `UPDATE tenants SET
             licenca_expira = date(CASE WHEN licenca_expira IS NOT NULL AND licenca_expira > date('now') THEN licenca_expira ELSE date('now') END, '+30 days'),
             plano = CASE WHEN plano = 'trial' THEN 'basico' ELSE plano END,
             bloqueado = 0,
             asaas_last_paid = ?
           WHERE id = ?`
        ).bind(pay.id, tenant.id).run();
      }
    }

    // Sempre responde 200 pro Asaas não reenviar em loop
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    // Mesmo em erro interno, responde 200 pra não travar a fila do Asaas; loga o detalhe
    return new Response(JSON.stringify({ received: true, warn: String(err) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
