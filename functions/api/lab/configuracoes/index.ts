import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(db: Env['DB']) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lab_configuracoes (
      tenant_id TEXT NOT NULL,
      chave     TEXT NOT NULL,
      valor     TEXT,
      PRIMARY KEY (tenant_id, chave)
    )
  `).run();
}

const DEFAULTS: Record<string, string> = {
  num_proximo_pedido:       '1',
  num_proximo_os_padrao:    '1',
  num_proximo_os_garantia:  '1',
  num_proximo_encomenda:    '1',
  num_proximo_prevenda:     '1',
  num_proximo_preservico:   '1',
  num_ultima_data_pedidos:  '',
  obs_pedidos:              '',
  num_proximo_fechamento:   '1',
  num_proximo_nf:           '1',
  num_proximo_fatura:       '1',
  num_proximo_outro:        '1',
};

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    await ensureTable(env.DB);
    const rows = await env.DB.prepare(
      'SELECT chave, valor FROM lab_configuracoes WHERE tenant_id = ?'
    ).bind(auth.tenant_id).all<{ chave: string; valor: string }>();

    const config: Record<string, string> = { ...DEFAULTS };
    for (const row of rows.results) {
      config[row.chave] = row.valor ?? '';
    }

    return json(config);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPut = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json() as Record<string, string>;

    await ensureTable(env.DB);

    const stmts = Object.entries(body).map(([chave, valor]) =>
      env.DB.prepare(
        'INSERT INTO lab_configuracoes (tenant_id, chave, valor) VALUES (?, ?, ?) ON CONFLICT(tenant_id, chave) DO UPDATE SET valor = excluded.valor'
      ).bind(auth.tenant_id, chave, valor ?? '')
    );

    if (stmts.length > 0) {
      for (let i = 0; i < stmts.length; i += 100) {
        await env.DB.batch(stmts.slice(i, i + 100));
      }
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
