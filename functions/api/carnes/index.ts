import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { montarPixBRCode } from '../../lib/pix';

export async function ensureCarneTables(db: Env['DB']) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS carnes (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cliente_id TEXT,
      descricao TEXT, valor_total REAL NOT NULL DEFAULT 0, num_parcelas INTEGER NOT NULL DEFAULT 1,
      forma_pagamento TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* ok */ }
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS carne_parcelas (
      id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, carne_id TEXT NOT NULL,
      numero INTEGER NOT NULL, valor REAL NOT NULL DEFAULT 0, vencimento TEXT,
      status TEXT NOT NULL DEFAULT 'pendente', pix_copia_cola TEXT, txid TEXT, pago_em TEXT
    )`).run();
  } catch { /* ok */ }
  // chave Pix da loja (para gerar os QR)
  for (const c of ['pix_chave TEXT', 'pix_beneficiario TEXT', 'pix_cidade TEXT']) {
    try { await db.prepare(`ALTER TABLE tenants ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_carne_parc ON carne_parcelas(tenant_id, carne_id)').run(); } catch {}
}

function addMonths(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m - 1) + n, d));
  // clamp de dia (ex: 31 -> fim do mês menor)
  if (dt.getUTCDate() !== d) dt.setUTCDate(0);
  return dt.toISOString().split('T')[0];
}

// GET /api/carnes — lista os carnês com resumo
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCarneTables(env.DB);

  const r = await env.DB.prepare(`
    SELECT c.id, c.descricao, c.valor_total, c.num_parcelas, c.forma_pagamento, c.created_at,
           cl.nome as cliente_nome,
           (SELECT COUNT(*) FROM carne_parcelas p WHERE p.carne_id = c.id AND p.status = 'pago') as parcelas_pagas,
           (SELECT COALESCE(SUM(p.valor),0) FROM carne_parcelas p WHERE p.carne_id = c.id AND p.status != 'pago') as saldo
    FROM carnes c LEFT JOIN clientes cl ON cl.id = c.cliente_id
    WHERE c.tenant_id = ? ORDER BY c.created_at DESC LIMIT 300
  `).bind(auth.tenant_id).all();

  return json(r.results);
};

// POST /api/carnes — cria um carnê e gera as parcelas com Pix
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCarneTables(env.DB);

  try {
    const body = await request.json() as {
      cliente_id?: string; descricao?: string; valor_total?: number | string;
      num_parcelas?: number | string; primeiro_vencimento?: string; forma_pagamento?: string;
    };

    const total = Math.round((parseFloat(String(body.valor_total)) || 0) * 100);
    const num = Math.max(1, Math.min(48, parseInt(String(body.num_parcelas)) || 1));
    if (total <= 0) return json({ error: 'Informe o valor total' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.primeiro_vencimento || '')) return json({ error: 'Informe a data do 1º vencimento' }, 400);

    const tenant = await env.DB.prepare(
      'SELECT nome, cidade, pix_chave, pix_beneficiario, pix_cidade FROM tenants WHERE id = ?'
    ).bind(auth.tenant_id).first<Record<string, string | null>>();
    const chave = (tenant?.pix_chave || '').trim();
    if (!chave) return json({ error: 'Configure a chave Pix da loja em Configurações antes de gerar o carnê.' }, 400);
    const benef = tenant?.pix_beneficiario || tenant?.nome || 'RECEBEDOR';
    const cidade = tenant?.pix_cidade || tenant?.cidade || 'CIDADE';

    const carneId = crypto.randomUUID();
    const shortId = carneId.replace(/-/g, '').slice(0, 10);
    const descricao = (body.descricao || 'Carnê').slice(0, 80);
    const now = new Date().toISOString();

    // Divide o valor em centavos (as primeiras parcelas absorvem o resto)
    const base = Math.floor(total / num);
    const resto = total - base * num;

    const stmts = [
      env.DB.prepare('INSERT INTO carnes (id, tenant_id, cliente_id, descricao, valor_total, num_parcelas, forma_pagamento, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(carneId, auth.tenant_id, body.cliente_id || null, descricao, total / 100, num, body.forma_pagamento || 'boleto', now),
    ];

    for (let i = 0; i < num; i++) {
      const cents = base + (i < resto ? 1 : 0);
      const valor = cents / 100;
      const numero = i + 1;
      const vencimento = addMonths(body.primeiro_vencimento!, i);
      const txid = `C${shortId}P${numero}`.slice(0, 25);
      const pix = montarPixBRCode({
        chave, nome: benef, cidade, valor, txid,
        descricao: `${descricao} ${numero}/${num}`,
      });
      stmts.push(env.DB.prepare(
        'INSERT INTO carne_parcelas (id, tenant_id, carne_id, numero, valor, vencimento, status, pix_copia_cola, txid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), auth.tenant_id, carneId, numero, valor, vencimento, 'pendente', pix, txid));
    }

    await env.DB.batch(stmts);
    return json({ id: carneId }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
