import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureRecorrentes, gerarRecorrentes, proximoMes, ajustarFds } from '../../../lib/recorrentes';

// GET /api/financeiro/recorrentes — moldes das contas recorrentes/fixas (com o próximo vencimento)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureRecorrentes(env.DB);
    const r = await env.DB.prepare(
      'SELECT * FROM contas_recorrentes WHERE tenant_id = ? ORDER BY ativo DESC, dia ASC, descricao ASC'
    ).bind(auth.tenant_id).all<Record<string, unknown>>();
    const lista = (r.results || []).map(m => ({
      ...m,
      proximo_vencimento: m.ativo ? ajustarFds(proximoMes(String(m.ultima_base), Number(m.dia)), String(m.ajuste_fds)) : null,
    }));
    return json(lista);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST — cria o molde e já lança a primeira conta (no vencimento informado)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureRecorrentes(env.DB);
    const b = await request.json() as Record<string, string | number | boolean | null>;
    const descricao = String(b.descricao || '').trim();
    const valor = Number(b.valor);
    const primeiro = String(b.data_vencimento || '');
    if (!descricao) return json({ error: 'Descrição é obrigatória' }, 400);
    if (!(valor > 0)) return json({ error: 'Valor deve ser maior que zero' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(primeiro)) return json({ error: 'Informe o primeiro vencimento' }, 400);
    const dia = Number(primeiro.slice(8, 10));
    const ajuste = ['antes', 'depois'].includes(String(b.ajuste_fds)) ? String(b.ajuste_fds) : 'manter';
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO contas_recorrentes (id, tenant_id, descricao, fornecedor, fornecedor_id, categoria, valor, dia, fixa, ajuste_fds, ultima_base, ativo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).bind(id, auth.tenant_id, descricao, b.fornecedor || null, b.fornecedor_id || null, b.categoria || null, valor, dia, b.fixa ? 1 : 0, ajuste, primeiro, now),
      env.DB.prepare(
        `INSERT INTO contas_pagar (id, tenant_id, descricao, fornecedor, fornecedor_id, categoria, valor, data_vencimento, situacao, recorrente_id, observacao, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), auth.tenant_id, descricao, b.fornecedor || null, b.fornecedor_id || null, b.categoria || null, valor, ajustarFds(primeiro, ajuste), id, b.observacao || null, now, now),
    ]);
    // se o 1º vencimento for antigo, já lança os meses seguintes que estão dentro do prazo
    await gerarRecorrentes(env.DB, auth.tenant_id);
    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
