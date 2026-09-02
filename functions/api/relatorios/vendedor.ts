import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

async function ensureCol(env: Env) {
  try { await env.DB.prepare('ALTER TABLE usuarios ADD COLUMN comissao_pct REAL').run(); } catch { /* já existe */ }
}

// GET /api/relatorios/vendedor?funcionario_id=&inicio=&fim=
// Lista todas as vendas do vendedor no período (p/ conferência) + base e % de comissão.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureCol(env);
    const url = new URL(request.url);
    const fid = url.searchParams.get('funcionario_id');
    const inicio = url.searchParams.get('inicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fim = url.searchParams.get('fim') || new Date().toISOString().split('T')[0];
    if (!fid) return json({ error: 'funcionario_id requerido' }, 400);

    const vendedor = await env.DB.prepare(
      'SELECT id, nome, perfil, COALESCE(comissao_pct, 0) as comissao_pct FROM usuarios WHERE id = ? AND tenant_id = ?'
    ).bind(fid, auth.tenant_id).first<{ id: string; nome: string; perfil: string; comissao_pct: number }>();
    if (!vendedor) return json({ error: 'Vendedor não encontrado' }, 404);

    const r = await env.DB.prepare(`
      SELECT v.id, v.numero, v.created_at, v.valor_final, v.desconto, v.valor_entrada, v.saldo_restante, v.situacao,
             v.forma_pagamento, c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ? AND v.funcionario_id = ? AND v.situacao != 'cancelada'
      AND date(v.created_at) BETWEEN ? AND ?
      ORDER BY v.created_at DESC
    `).bind(auth.tenant_id, fid, inicio, fim).all<Record<string, unknown>>();

    const vendas = r.results || [];
    const totalVendido = vendas.reduce((a, v) => a + (Number(v.valor_final) || 0), 0);
    const descontos = vendas.reduce((a, v) => a + (Number(v.desconto) || 0), 0);
    const aReceber = vendas.reduce((a, v) => a + (Number(v.saldo_restante) || 0), 0);
    const recebido = vendas.reduce((a, v) => a + (Number(v.valor_entrada) || 0), 0);

    return json({
      vendedor,
      periodo: { inicio, fim },
      vendas,
      totais: { qtd: vendas.length, total_vendido: totalVendido, descontos, a_receber: aReceber, recebido },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST /api/relatorios/vendedor  { funcionario_id, comissao_pct }  — salva o % de comissão do vendedor (admin)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admin pode alterar comissão' }, 403);

  try {
    await ensureCol(env);
    const body = await request.json() as { funcionario_id?: string; comissao_pct?: number | string };
    if (!body.funcionario_id) return json({ error: 'funcionario_id requerido' }, 400);
    const pct = Math.max(0, Number(body.comissao_pct) || 0);
    await env.DB.prepare('UPDATE usuarios SET comissao_pct = ? WHERE id = ? AND tenant_id = ?')
      .bind(pct, body.funcionario_id, auth.tenant_id).run();
    return json({ ok: true, comissao_pct: pct });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
