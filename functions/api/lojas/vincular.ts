import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols } from '../../lib/lojas';

// POST /api/lojas/vincular  { funcionario_id, loja_id, desde? (YYYY-MM-DD) }
// Vincula as vendas (e OS) de um vendedor a uma loja. Opcionalmente só a partir de uma data.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin' }, 403);
  await ensureLojaCols(env.DB);

  try {
    const body = await request.json() as { funcionario_id?: string; loja_id?: string; desde?: string };
    if (!body.funcionario_id) return json({ error: 'funcionario_id requerido' }, 400);
    if (!body.loja_id) return json({ error: 'Selecione a loja' }, 400);

    // Confere que a loja é do tenant
    const loja = await env.DB.prepare('SELECT id FROM lojas WHERE id = ? AND tenant_id = ?')
      .bind(body.loja_id, auth.tenant_id).first();
    if (!loja) return json({ error: 'Loja não encontrada' }, 404);

    const temData = body.desde && /^\d{4}-\d{2}-\d{2}$/.test(body.desde);

    const vendasRes = await env.DB.prepare(
      `UPDATE vendas SET loja_id = ? WHERE tenant_id = ? AND funcionario_id = ?` + (temData ? ` AND date(created_at) >= ?` : '')
    ).bind(...(temData
      ? [body.loja_id, auth.tenant_id, body.funcionario_id, body.desde]
      : [body.loja_id, auth.tenant_id, body.funcionario_id])).run();

    let osCount = 0;
    try {
      const osRes = await env.DB.prepare(
        `UPDATE ordens_servico SET loja_id = ? WHERE tenant_id = ? AND funcionario_id = ?` + (temData ? ` AND date(created_at) >= ?` : '')
      ).bind(...(temData
        ? [body.loja_id, auth.tenant_id, body.funcionario_id, body.desde]
        : [body.loja_id, auth.tenant_id, body.funcionario_id])).run();
      osCount = (osRes.meta && (osRes.meta as { changes?: number }).changes) || 0;
    } catch { /* ordens pode não ter funcionario_id em alguns casos */ }

    const vendasCount = (vendasRes.meta && (vendasRes.meta as { changes?: number }).changes) || 0;
    return json({ ok: true, vendas: vendasCount, os: osCount });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
