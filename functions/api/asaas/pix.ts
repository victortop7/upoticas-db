import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';

// Data de hoje no fuso de São Paulo (YYYY-MM-DD)
function hojeSP(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function baseUrl(env: Env) { return env.ASAAS_BASE_URL || 'https://api.asaas.com/v3'; }
function headers(env: Env) {
  return { 'access_token': env.ASAAS_API_KEY as string, 'Content-Type': 'application/json', 'User-Agent': 'ConnectVision' };
}

// ── POST /api/asaas/pix — gera cobrança Pix (QR + copia e cola) ──────────────
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  try {
    if (!env.ASAAS_API_KEY) return json({ error: 'Pagamento não configurado (Asaas).' }, 500);
    try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN asaas_customer_id TEXT').run(); } catch { /* já existe */ }

    const body = await request.json().catch(() => ({})) as { documento?: string };
    const tenant = await env.DB.prepare(
      'SELECT id, nome, email, cnpj, asaas_customer_id FROM tenants WHERE id = ?'
    ).bind(auth.tenant_id).first<Record<string, unknown>>();
    if (!tenant) return json({ error: 'Estabelecimento não encontrado' }, 404);

    const base = baseUrl(env);
    const H = headers(env);

    // 1) Garante um cliente no Asaas (reaproveita o salvo no tenant)
    let customerId = tenant.asaas_customer_id as string | null;
    const doc = String(body.documento || tenant.cnpj || '').replace(/\D/g, '');
    if (!customerId) {
      if (!doc) return json({ need_document: true, error: 'Informe o CPF ou CNPJ do responsável para gerar o Pix.' });
      const cRes = await fetch(`${base}/customers`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ name: tenant.nome, cpfCnpj: doc, email: tenant.email }),
      });
      const cData = await cRes.json() as any;
      if (!cRes.ok || !cData.id) {
        return json({ error: cData?.errors?.[0]?.description || 'Não foi possível registrar o cliente no Asaas.' }, 400);
      }
      customerId = cData.id;
      await env.DB.prepare('UPDATE tenants SET asaas_customer_id = ?, cnpj = COALESCE(cnpj, ?) WHERE id = ?')
        .bind(customerId, doc, tenant.id).run();
    }

    // 2) Cria a cobrança Pix
    const valor = Number(env.ASAAS_VALOR_VISION || 97);
    const due = hojeSP();
    const pRes = await fetch(`${base}/payments`, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        customer: customerId, billingType: 'PIX', value: valor, dueDate: due,
        description: 'Connect Vision — Mensalidade',
      }),
    });
    const pData = await pRes.json() as any;
    if (!pRes.ok || !pData.id) {
      return json({ error: pData?.errors?.[0]?.description || 'Não foi possível criar a cobrança.' }, 400);
    }

    // 3) Busca o QR Code Pix (imagem + copia e cola)
    const qRes = await fetch(`${base}/payments/${pData.id}/pixQrCode`, { headers: H });
    const qData = await qRes.json() as any;
    if (!qRes.ok || !qData.payload) {
      return json({ error: 'Não foi possível gerar o QR Code Pix.' }, 400);
    }

    return json({
      paymentId: pData.id,
      value: valor,
      dueDate: due,
      qrImage: `data:image/png;base64,${qData.encodedImage}`,
      copiaCola: qData.payload,
    });
  } catch (err) {
    return json({ error: 'Erro ao gerar o Pix', detail: String(err) }, 500);
  }
};

// ── GET /api/asaas/pix?paymentId=xxx — consulta status do pagamento ──────────
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  const paymentId = new URL(request.url).searchParams.get('paymentId');
  if (!paymentId) return json({ error: 'paymentId requerido' }, 400);
  if (!env.ASAAS_API_KEY) return json({ error: 'Pagamento não configurado (Asaas).' }, 500);

  try {
    const r = await fetch(`${baseUrl(env)}/payments/${paymentId}`, { headers: headers(env) });
    const d = await r.json() as any;
    const pago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(d.status);

    // Ao confirmar, estende a licença +30 dias (uma vez por pagamento) e desbloqueia
    if (pago) {
      try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN asaas_last_paid TEXT').run(); } catch { /* já existe */ }
      const t = await env.DB.prepare('SELECT asaas_last_paid FROM tenants WHERE id = ?')
        .bind(auth.tenant_id).first<Record<string, unknown>>();
      if (t && t.asaas_last_paid !== paymentId) {
        await env.DB.prepare(
          `UPDATE tenants SET
             licenca_expira = date(CASE WHEN licenca_expira IS NOT NULL AND licenca_expira > date('now') THEN licenca_expira ELSE date('now') END, '+30 days'),
             plano = CASE WHEN plano = 'trial' THEN 'basico' ELSE plano END,
             bloqueado = 0,
             asaas_last_paid = ?
           WHERE id = ?`
        ).bind(paymentId, auth.tenant_id).run();
      }
    }

    return json({ status: d.status, pago });
  } catch (err) {
    return json({ error: 'Erro ao consultar pagamento', detail: String(err) }, 500);
  }
};
