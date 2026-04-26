import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureFinanceiroTables } from '../setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);

  const url = new URL(request.url);
  const situacao = url.searchParams.get('situacao') || '';
  const inicio = url.searchParams.get('inicio') || '';
  const fim = url.searchParams.get('fim') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Auto-atualizar vencidas
  await env.DB.prepare(`
    UPDATE contas_pagar SET situacao = 'vencido'
    WHERE tenant_id = ? AND situacao = 'pendente' AND data_vencimento < date('now')
  `).bind(auth.tenant_id).run();

  let where = 'WHERE tenant_id = ?';
  const params: unknown[] = [auth.tenant_id];

  if (situacao) { where += ' AND situacao = ?'; params.push(situacao); }
  if (inicio) { where += ' AND data_vencimento >= ?'; params.push(inicio); }
  if (fim) { where += ' AND data_vencimento <= ?'; params.push(fim); }

  const [rows, count, totais] = await Promise.all([
    env.DB.prepare(`SELECT * FROM contas_pagar ${where} ORDER BY data_vencimento ASC LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) as n FROM contas_pagar ${where}`)
      .bind(...params).first<{ n: number }>(),
    env.DB.prepare(`SELECT
        COALESCE(SUM(CASE WHEN situacao IN ('pendente','vencido') THEN valor ELSE 0 END), 0) as pendente,
        COALESCE(SUM(CASE WHEN situacao = 'pago' THEN valor ELSE 0 END), 0) as pago
      FROM contas_pagar ${where}`)
      .bind(...params).first<{ pendente: number; pago: number }>(),
  ]);

  return json({
    contas: rows.results,
    total: count?.n || 0,
    pages: Math.ceil((count?.n || 0) / limit),
    totais: { pendente: totais?.pendente || 0, pago: totais?.pago || 0 },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureFinanceiroTables(env.DB);

  try {
    const body = await request.json() as Record<string, string>;
    if (!body.descricao?.trim()) return json({ error: 'Descrição é obrigatória' }, 400);
    if (!body.data_vencimento) return json({ error: 'Data de vencimento é obrigatória' }, 400);
    if (!body.valor || parseFloat(body.valor) <= 0) return json({ error: 'Valor deve ser maior que zero' }, 400);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO contas_pagar (id, tenant_id, descricao, fornecedor, categoria, valor, data_vencimento, situacao, forma_pagamento, conta_id, observacao, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?)
    `).bind(id, auth.tenant_id, body.descricao.trim(), body.fornecedor || null, body.categoria || null,
      parseFloat(body.valor), body.data_vencimento, body.forma_pagamento || null,
      body.conta_id || null, body.observacao || null, now, now).run();

    const conta = await env.DB.prepare('SELECT * FROM contas_pagar WHERE id = ?').bind(id).first();
    return json(conta, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
