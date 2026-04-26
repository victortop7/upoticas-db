import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureFinanceiroTables, ensureContasPadrao } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);
  await ensureContasPadrao(env.DB, auth.tenant_id);

  const url = new URL(request.url);
  const data = url.searchParams.get('data') || new Date().toISOString().split('T')[0];
  const conta_id = url.searchParams.get('conta_id') || '';

  let where = 'WHERE tenant_id = ? AND data = ?';
  const params: unknown[] = [auth.tenant_id, data];
  if (conta_id) { where += ' AND conta_id = ?'; params.push(conta_id); }

  const [movs, totais] = await Promise.all([
    env.DB.prepare(`SELECT m.*, cf.nome as conta_nome FROM movimentacoes_caixa m LEFT JOIN contas_financeiras cf ON cf.id = m.conta_id ${where} ORDER BY m.created_at DESC`)
      .bind(...params).all(),
    env.DB.prepare(`SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas
      FROM movimentacoes_caixa ${where}`)
      .bind(...params).first<{ entradas: number; saidas: number }>(),
  ]);

  return json({
    data,
    movimentacoes: movs.results,
    totais: {
      entradas: totais?.entradas || 0,
      saidas: totais?.saidas || 0,
      saldo: (totais?.entradas || 0) - (totais?.saidas || 0),
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);

  try {
    const body = await request.json() as Record<string, string>;
    if (!body.conta_id) return json({ error: 'Conta é obrigatória' }, 400);
    if (!body.descricao?.trim()) return json({ error: 'Descrição é obrigatória' }, 400);
    if (!body.valor || parseFloat(body.valor) <= 0) return json({ error: 'Valor deve ser maior que zero' }, 400);
    if (!['entrada', 'saida'].includes(body.tipo)) return json({ error: 'Tipo inválido' }, 400);

    const id = crypto.randomUUID();
    const data = body.data || new Date().toISOString().split('T')[0];
    await env.DB.prepare(
      'INSERT INTO movimentacoes_caixa (id, tenant_id, conta_id, tipo, descricao, valor, data, categoria, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, auth.tenant_id, body.conta_id, body.tipo, body.descricao.trim(), parseFloat(body.valor), data, body.categoria || null, new Date().toISOString()).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
