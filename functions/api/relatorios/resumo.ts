import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const inicio = url.searchParams.get('inicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fim = url.searchParams.get('fim') || new Date().toISOString().split('T')[0];

    const [
      vendasResumo,
      osResumo,
      osSituacoes,
      topClientes,
      vendasPorDia,
    ] = await Promise.all([
      env.DB.prepare(`
        SELECT COUNT(*) as total, COALESCE(SUM(valor_final), 0) as valor,
               COALESCE(SUM(desconto), 0) as descontos
        FROM vendas WHERE tenant_id = ? AND situacao = 'ativa'
        AND date(created_at) BETWEEN ? AND ?
      `).bind(auth.tenant_id, inicio, fim).first<{ total: number; valor: number; descontos: number }>(),

      env.DB.prepare(`
        SELECT COUNT(*) as total, COALESCE(SUM(valor_total), 0) as valor_total,
               COALESCE(SUM(valor_entrada), 0) as recebido,
               COALESCE(SUM(valor_restante), 0) as pendente
        FROM ordens_servico WHERE tenant_id = ?
        AND date(created_at) BETWEEN ? AND ?
      `).bind(auth.tenant_id, inicio, fim).first<{ total: number; valor_total: number; recebido: number; pendente: number }>(),

      env.DB.prepare(`
        SELECT situacao, COUNT(*) as n FROM ordens_servico
        WHERE tenant_id = ? AND date(created_at) BETWEEN ? AND ?
        GROUP BY situacao ORDER BY n DESC
      `).bind(auth.tenant_id, inicio, fim).all<{ situacao: string; n: number }>(),

      env.DB.prepare(`
        SELECT c.nome, COUNT(v.id) as compras, COALESCE(SUM(v.valor_final), 0) as total
        FROM vendas v JOIN clientes c ON c.id = v.cliente_id
        WHERE v.tenant_id = ? AND v.situacao = 'ativa'
        AND date(v.created_at) BETWEEN ? AND ?
        GROUP BY v.cliente_id ORDER BY total DESC LIMIT 5
      `).bind(auth.tenant_id, inicio, fim).all<{ nome: string; compras: number; total: number }>(),

      env.DB.prepare(`
        SELECT date(created_at) as dia, COUNT(*) as vendas, COALESCE(SUM(valor_final), 0) as valor
        FROM vendas WHERE tenant_id = ? AND situacao = 'ativa'
        AND date(created_at) BETWEEN ? AND ?
        GROUP BY date(created_at) ORDER BY dia ASC
      `).bind(auth.tenant_id, inicio, fim).all<{ dia: string; vendas: number; valor: number }>(),
    ]);

    return json({
      periodo: { inicio, fim },
      vendas: {
        total: vendasResumo?.total || 0,
        valor: vendasResumo?.valor || 0,
        descontos: vendasResumo?.descontos || 0,
      },
      os: {
        total: osResumo?.total || 0,
        valor_total: osResumo?.valor_total || 0,
        recebido: osResumo?.recebido || 0,
        pendente: osResumo?.pendente || 0,
        por_situacao: osSituacoes.results,
      },
      top_clientes: topClientes.results,
      vendas_por_dia: vendasPorDia.results,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
