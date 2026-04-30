import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const result = await env.DB.prepare(`
      SELECT cb.*,
        cb.saldo_inicial +
        COALESCE((SELECT SUM(CASE WHEN tipo='credito' THEN valor ELSE -valor END)
                  FROM lancamentos_bancarios WHERE conta_id = cb.id AND tenant_id = cb.tenant_id), 0)
        AS saldo_atual
      FROM contas_bancarias cb
      WHERE cb.tenant_id = ? AND cb.ativo = 1
      ORDER BY cb.nome ASC
    `).bind(tenant_id).all();

    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as Record<string, string | number>;
    if (!String(body.nome || '').trim()) return json({ error: 'Nome é obrigatório' }, 400);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO contas_bancarias (id, tenant_id, nome, banco, agencia, conta, tipo, saldo_inicial) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, tenant_id, String(body.nome).trim(),
      body.banco || null, body.agencia || null, body.conta || null,
      body.tipo || 'corrente', Number(body.saldo_inicial) || 0,
    ).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
