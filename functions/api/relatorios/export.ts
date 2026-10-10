import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols, filtroLoja } from '../../lib/lojas';

// GET /api/relatorios/export?inicio=&fim=
// Vendas do período agrupadas por vendedor (p/ exportar em PDF).
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureLojaCols(env.DB);
    const url = new URL(request.url);
    const inicio = url.searchParams.get('inicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fim = url.searchParams.get('fim') || new Date().toISOString().split('T')[0];

    const fl = filtroLoja(auth, 'v.loja_id');

    const [rows, tenant, loja] = await Promise.all([
      env.DB.prepare(`
        SELECT v.numero, v.created_at, v.valor_final, v.desconto, v.saldo_restante,
               v.forma_pagamento, v.situacao, v.funcionario_id,
               COALESCE(u.nome, '(sem vendedor)') as vendedor, u.perfil,
               c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN usuarios u ON u.id = v.funcionario_id
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.tenant_id = ? AND v.situacao != 'cancelada'
        AND date(v.created_at) BETWEEN ? AND ?${fl.sql}
        ORDER BY vendedor ASC, v.created_at ASC
      `).bind(auth.tenant_id, inicio, fim, ...fl.params).all<Record<string, any>>(),
      env.DB.prepare('SELECT nome FROM tenants WHERE id = ?').bind(auth.tenant_id).first<{ nome: string }>(),
      auth.loja_id
        ? env.DB.prepare('SELECT nome FROM lojas WHERE id = ?').bind(auth.loja_id).first<{ nome: string }>()
        : Promise.resolve(null),
    ]);

    // Agrupa por vendedor
    const mapa = new Map<string, any>();
    for (const r of (rows.results || [])) {
      const key = String(r.funcionario_id || 'sem');
      if (!mapa.has(key)) mapa.set(key, { funcionario_id: r.funcionario_id, vendedor: r.vendedor, perfil: r.perfil, vendas: [], total: 0, descontos: 0, a_receber: 0 });
      const g = mapa.get(key);
      const valor = Number(r.valor_final) || 0;
      g.vendas.push({
        numero: r.numero, data: r.created_at, cliente: r.cliente_nome || '—',
        forma: r.forma_pagamento || '—', valor, situacao: r.situacao,
        saldo: Number(r.saldo_restante) || 0,
      });
      g.total += valor;
      g.descontos += Number(r.desconto) || 0;
      g.a_receber += Number(r.saldo_restante) || 0;
    }

    const por_vendedor = Array.from(mapa.values()).map(g => ({
      ...g,
      qtd: g.vendas.length,
      ticket_medio: g.vendas.length ? g.total / g.vendas.length : 0,
    })).sort((a, b) => b.total - a.total);

    const totalGeral = por_vendedor.reduce((s, g) => s + g.total, 0);
    const qtdGeral = por_vendedor.reduce((s, g) => s + g.qtd, 0);

    return json({
      periodo: { inicio, fim },
      loja: loja?.nome || null,
      empresa: tenant?.nome || 'Relatório de Vendas',
      por_vendedor,
      geral: { total: totalGeral, qtd: qtdGeral, ticket_medio: qtdGeral ? totalGeral / qtdGeral : 0 },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
