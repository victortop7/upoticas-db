import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureIndexes } from '../../lib/ensure-indexes';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureIndexes(env.DB);
    const url = new URL(request.url);
    const inicio = url.searchParams.get('inicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fim = url.searchParams.get('fim') || new Date().toISOString().split('T')[0];

    // Garante colunas de saldo (bases antigas)
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch {}
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN saldo_restante REAL NOT NULL DEFAULT 0').run(); } catch {}

    const [
      vendasResumo,
      osResumo,
      osSituacoes,
      topClientes,
      vendasPorDia,
      porVendedor,
      aReceberGeral,
    ] = await Promise.all([
      env.DB.prepare(`
        SELECT COUNT(*) as total, COALESCE(SUM(valor_final), 0) as valor,
               COALESCE(SUM(desconto), 0) as descontos,
               COALESCE(SUM(valor_entrada), 0) as recebido,
               COALESCE(SUM(saldo_restante), 0) as a_receber
        FROM vendas WHERE tenant_id = ? AND situacao != 'cancelada'
        AND date(created_at) BETWEEN ? AND ?
      `).bind(auth.tenant_id, inicio, fim).first<{ total: number; valor: number; descontos: number; recebido: number; a_receber: number }>(),

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
        SELECT c.nome, COUNT(v.id) as compras, COALESCE(SUM(v.valor_final), 0) as total,
               COALESCE(SUM(v.saldo_restante), 0) as a_receber
        FROM vendas v JOIN clientes c ON c.id = v.cliente_id
        WHERE v.tenant_id = ? AND v.situacao != 'cancelada'
        AND date(v.created_at) BETWEEN ? AND ?
        GROUP BY v.cliente_id ORDER BY total DESC LIMIT 50
      `).bind(auth.tenant_id, inicio, fim).all<{ nome: string; compras: number; total: number; a_receber: number }>(),

      env.DB.prepare(`
        SELECT date(created_at) as dia, COUNT(*) as vendas, COALESCE(SUM(valor_final), 0) as valor
        FROM vendas WHERE tenant_id = ? AND situacao != 'cancelada'
        AND date(created_at) BETWEEN ? AND ?
        GROUP BY date(created_at) ORDER BY dia ASC
      `).bind(auth.tenant_id, inicio, fim).all<{ dia: string; vendas: number; valor: number }>(),

      env.DB.prepare(`
        SELECT u.nome as vendedor, u.perfil,
               COUNT(v.id) as total_vendas,
               COALESCE(SUM(v.valor_final), 0) as valor_total,
               COALESCE(AVG(v.valor_final), 0) as ticket_medio,
               COALESCE(SUM(v.desconto), 0) as total_desconto,
               COALESCE(SUM(v.saldo_restante), 0) as a_receber
        FROM vendas v
        JOIN usuarios u ON u.id = v.funcionario_id
        WHERE v.tenant_id = ? AND v.situacao != 'cancelada'
        AND date(v.created_at) BETWEEN ? AND ?
        GROUP BY v.funcionario_id ORDER BY valor_total DESC
      `).bind(auth.tenant_id, inicio, fim).all<{ vendedor: string; perfil: string; total_vendas: number; valor_total: number; ticket_medio: number; total_desconto: number; a_receber: number }>(),

      // A receber GERAL (todas as vendas em aberto, independente do período)
      env.DB.prepare(`
        SELECT COALESCE(SUM(saldo_restante), 0) as total, COUNT(*) as n
        FROM vendas WHERE tenant_id = ? AND saldo_restante > 0
      `).bind(auth.tenant_id).first<{ total: number; n: number }>(),
    ]);

    return json({
      periodo: { inicio, fim },
      vendas: {
        total: vendasResumo?.total || 0,
        valor: vendasResumo?.valor || 0,
        descontos: vendasResumo?.descontos || 0,
        recebido: vendasResumo?.recebido || 0,
        a_receber: vendasResumo?.a_receber || 0,
      },
      a_receber_geral: { total: aReceberGeral?.total || 0, qtd: aReceberGeral?.n || 0 },
      os: {
        total: osResumo?.total || 0,
        valor_total: osResumo?.valor_total || 0,
        recebido: osResumo?.recebido || 0,
        pendente: osResumo?.pendente || 0,
        por_situacao: osSituacoes.results,
      },
      top_clientes: topClientes.results,
      vendas_por_dia: vendasPorDia.results,
      por_vendedor: porVendedor.results,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
