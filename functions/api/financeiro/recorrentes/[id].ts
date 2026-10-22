import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureRecorrentes } from '../../../lib/recorrentes';

// PUT: altera o molde (vale para as próximas contas; as já lançadas se editam na lista)
//   { descricao, fornecedor, fornecedor_id, categoria, valor, dia, ajuste_fds, fixa, ativo }
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureRecorrentes(env.DB);
    const b = await request.json() as Record<string, string | number | boolean | null>;
    const sets: string[] = [];
    const vals: unknown[] = [];
    const campo = (k: string, v: unknown) => { sets.push(`${k} = ?`); vals.push(v); };
    if (b.descricao !== undefined) { const d = String(b.descricao).trim(); if (!d) return json({ error: 'Descrição é obrigatória' }, 400); campo('descricao', d); }
    if (b.fornecedor !== undefined) campo('fornecedor', b.fornecedor || null);
    if (b.fornecedor_id !== undefined) campo('fornecedor_id', b.fornecedor_id || null);
    if (b.categoria !== undefined) campo('categoria', b.categoria || null);
    if (b.valor !== undefined) { const v = Number(b.valor); if (!(v > 0)) return json({ error: 'Valor inválido' }, 400); campo('valor', v); }
    if (b.dia !== undefined) { const d = Math.round(Number(b.dia)); if (!(d >= 1 && d <= 31)) return json({ error: 'Dia inválido' }, 400); campo('dia', d); }
    if (b.ajuste_fds !== undefined) campo('ajuste_fds', ['antes', 'depois'].includes(String(b.ajuste_fds)) ? String(b.ajuste_fds) : 'manter');
    if (b.fixa !== undefined) campo('fixa', b.fixa ? 1 : 0);
    if (b.ativo !== undefined) campo('ativo', b.ativo ? 1 : 0);
    if (!sets.length) return json({ error: 'Nada para atualizar' }, 400);
    vals.push(params.id, auth.tenant_id);
    await env.DB.prepare(`UPDATE contas_recorrentes SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`).bind(...vals).run();
    return json({ success: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// DELETE: encerra a recorrência (as contas já lançadas continuam na lista)
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureRecorrentes(env.DB);
  await env.DB.batch([
    env.DB.prepare('UPDATE contas_pagar SET recorrente_id = NULL WHERE recorrente_id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id),
    env.DB.prepare('DELETE FROM contas_recorrentes WHERE id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id),
  ]);
  return json({ success: true });
};
