import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const periodo = new URL(request.url).searchParams.get('periodo') || 'mes';

  let cond = '';
  if (periodo === 'hoje') {
    cond = `AND strftime('%m-%d', data_nascimento) = strftime('%m-%d', 'now')`;
  } else if (periodo === '7d') {
    cond = `AND strftime('%m-%d', data_nascimento) BETWEEN strftime('%m-%d', 'now') AND strftime('%m-%d', 'now', '+6 days')`;
  } else {
    // mês atual
    cond = `AND strftime('%m', data_nascimento) = strftime('%m', 'now')`;
  }

  const result = await env.DB.prepare(`
    SELECT id, nome, celular, telefone, data_nascimento, cidade, uf
    FROM clientes
    WHERE tenant_id = ? AND ativo = 1 AND data_nascimento IS NOT NULL ${cond}
    ORDER BY strftime('%m-%d', data_nascimento) ASC
  `).bind(auth.tenant_id).all();

  return json(result.results);
};
