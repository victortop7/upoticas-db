import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols } from '../../lib/lojas';

// Clientes e vendas importados do sistema antigo (ids "cc-cli-" / "cc-vnd-").
// GET  → quantos importados ainda estão sem loja (e por loja)
// POST { loja_id } → vincula os importados SEM loja à loja escolhida
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin' }, 403);
  await ensureLojaCols(env.DB);
  try {
    const c = await env.DB.prepare(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN loja_id IS NULL THEN 1 ELSE 0 END) AS sem_loja
       FROM clientes WHERE tenant_id = ? AND id LIKE 'cc-cli-%'`
    ).bind(auth.tenant_id).first<{ total: number; sem_loja: number }>();
    const v = await env.DB.prepare(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN loja_id IS NULL THEN 1 ELSE 0 END) AS sem_loja
       FROM vendas WHERE tenant_id = ? AND id LIKE 'cc-vnd-%'`
    ).bind(auth.tenant_id).first<{ total: number; sem_loja: number }>();
    return json({
      clientes: { total: c?.total || 0, sem_loja: c?.sem_loja || 0 },
      vendas: { total: v?.total || 0, sem_loja: v?.sem_loja || 0 },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin' }, 403);
  await ensureLojaCols(env.DB);
  try {
    const body = await request.json() as { loja_id?: string };
    if (!body.loja_id) return json({ error: 'Selecione a loja' }, 400);
    const loja = await env.DB.prepare('SELECT id FROM lojas WHERE id = ? AND tenant_id = ?')
      .bind(body.loja_id, auth.tenant_id).first();
    if (!loja) return json({ error: 'Loja não encontrada' }, 404);

    const [rc, rv] = await env.DB.batch([
      env.DB.prepare(`UPDATE clientes SET loja_id = ? WHERE tenant_id = ? AND id LIKE 'cc-cli-%' AND loja_id IS NULL`)
        .bind(body.loja_id, auth.tenant_id),
      env.DB.prepare(`UPDATE vendas SET loja_id = ? WHERE tenant_id = ? AND id LIKE 'cc-vnd-%' AND loja_id IS NULL`)
        .bind(body.loja_id, auth.tenant_id),
    ]);
    const ch = (r: { meta?: unknown }) => ((r.meta as { changes?: number } | undefined)?.changes) || 0;
    return json({ ok: true, clientes: ch(rc), vendas: ch(rv) });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
