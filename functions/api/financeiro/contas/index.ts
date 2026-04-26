import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureFinanceiroTables, ensureContasPadrao } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);
  await ensureContasPadrao(env.DB, auth.tenant_id);

  const contas = await env.DB.prepare(
    'SELECT * FROM contas_financeiras WHERE tenant_id = ? AND ativo = 1 ORDER BY nome ASC'
  ).bind(auth.tenant_id).all();

  // Calcula saldo de cada conta
  const result = await Promise.all((contas.results as any[]).map(async (conta) => {
    const mov = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas
      FROM movimentacoes_caixa WHERE conta_id = ? AND tenant_id = ?
    `).bind(conta.id, auth.tenant_id).first<{ entradas: number; saidas: number }>();
    return {
      ...conta,
      saldo: (conta.saldo_inicial || 0) + (mov?.entradas || 0) - (mov?.saidas || 0),
    };
  }));

  return json(result);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);

  const body = await request.json() as Record<string, string>;
  if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO contas_financeiras (id, tenant_id, nome, tipo, saldo_inicial, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.nome.trim(), body.tipo || 'caixa', parseFloat(body.saldo_inicial) || 0, new Date().toISOString()).run();

  const conta = await env.DB.prepare('SELECT * FROM contas_financeiras WHERE id = ?').bind(id).first();
  return json(conta, 201);
};
