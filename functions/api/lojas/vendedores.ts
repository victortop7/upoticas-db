import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols } from '../../lib/lojas';

// GET /api/lojas/vendedores — vendedores que já têm vendas (pra vincular a uma loja)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin' }, 403);
  await ensureLojaCols(env.DB);

  const r = await env.DB.prepare(`
    SELECT v.funcionario_id,
           COALESCE(u.nome, '(sem vendedor)') as nome,
           COUNT(*) as qtd,
           SUM(CASE WHEN v.loja_id IS NOT NULL THEN 1 ELSE 0 END) as com_loja,
           MIN(date(v.created_at)) as primeira,
           MAX(date(v.created_at)) as ultima
    FROM vendas v
    LEFT JOIN usuarios u ON u.id = v.funcionario_id
    WHERE v.tenant_id = ?
    GROUP BY v.funcionario_id
    ORDER BY qtd DESC
  `).bind(auth.tenant_id).all();

  return json(r.results);
};
