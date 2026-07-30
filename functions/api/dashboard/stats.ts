import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnterior = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const hoje = now.toISOString().split('T')[0];

    const [
      totalClientes,
      osAberto,
      osPronta,
      osHoje,
      vendasMes,
      osParaEntregar,
      aniversariantes,
      numVendasMes,
      vendasMesAnterior,
      aReceber,
      faturamento6m,
      produtosMaisVendidos,
    ] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as n FROM clientes WHERE tenant_id = ? AND ativo = 1')
        .bind(auth.tenant_id).first<{ n: number }>(),

      env.DB.prepare(`SELECT COUNT(*) as n FROM ordens_servico WHERE tenant_id = ? AND situacao IN ('orcamento','aprovado','em_producao')`)
        .bind(auth.tenant_id).first<{ n: number }>(),

      env.DB.prepare(`SELECT COUNT(*) as n FROM ordens_servico WHERE tenant_id = ? AND situacao = 'pronto'`)
        .bind(auth.tenant_id).first<{ n: number }>(),

      env.DB.prepare(`SELECT COUNT(*) as n FROM ordens_servico WHERE tenant_id = ? AND date(created_at) = ?`)
        .bind(auth.tenant_id, hoje).first<{ n: number }>(),

      env.DB.prepare(`SELECT COALESCE(SUM(valor_final), 0) as total FROM vendas WHERE tenant_id = ? AND situacao = 'ativa' AND strftime('%Y-%m', created_at) = ?`)
        .bind(auth.tenant_id, mesAtual).first<{ total: number }>(),

      env.DB.prepare(`
        SELECT os.numero, os.data_entrega, os.situacao, c.nome as cliente_nome
        FROM ordens_servico os LEFT JOIN clientes c ON c.id = os.cliente_id
        WHERE os.tenant_id = ? AND os.situacao IN ('aprovado','em_producao','pronto')
          AND os.data_entrega IS NOT NULL AND os.data_entrega >= ?
        ORDER BY os.data_entrega ASC LIMIT 5
      `).bind(auth.tenant_id, hoje).all(),

      env.DB.prepare(`
        SELECT id, nome, data_nascimento, celular
        FROM clientes WHERE tenant_id = ? AND ativo = 1
          AND data_nascimento IS NOT NULL
          AND strftime('%m-%d', data_nascimento) BETWEEN strftime('%m-%d', 'now') AND strftime('%m-%d', 'now', '+7 days')
        ORDER BY strftime('%m-%d', data_nascimento) ASC LIMIT 5
      `).bind(auth.tenant_id).all(),

      // Nº de vendas do mês (ticket médio = vendasMes / numVendasMes)
      env.DB.prepare(`SELECT COUNT(*) as n FROM vendas WHERE tenant_id = ? AND situacao = 'ativa' AND strftime('%Y-%m', created_at) = ?`)
        .bind(auth.tenant_id, mesAtual).first<{ n: number }>(),

      // Faturamento do mês anterior (comparativo)
      env.DB.prepare(`SELECT COALESCE(SUM(valor_final), 0) as total FROM vendas WHERE tenant_id = ? AND situacao = 'ativa' AND strftime('%Y-%m', created_at) = ?`)
        .bind(auth.tenant_id, mesAnterior).first<{ total: number }>(),

      // A receber — saldo pendente de vendas parceladas
      env.DB.prepare(`SELECT COALESCE(SUM(saldo_restante), 0) as total, COUNT(*) as n FROM vendas WHERE tenant_id = ? AND saldo_restante > 0`)
        .bind(auth.tenant_id).first<{ total: number; n: number }>(),

      // Faturamento por mês (para o gráfico de tendência)
      env.DB.prepare(`
        SELECT strftime('%Y-%m', created_at) as ym, COALESCE(SUM(valor_final), 0) as total, COUNT(*) as n
        FROM vendas WHERE tenant_id = ? AND situacao = 'ativa'
          AND created_at >= date('now', 'start of month', '-5 months')
        GROUP BY ym ORDER BY ym ASC
      `).bind(auth.tenant_id).all(),

      // Produtos mais vendidos (geral) — a partir dos itens de venda
      env.DB.prepare(`
        SELECT descricao, SUM(quantidade) as qtd, COALESCE(SUM(valor_total), 0) as faturamento
        FROM venda_itens WHERE tenant_id = ?
        GROUP BY descricao ORDER BY qtd DESC LIMIT 8
      `).bind(auth.tenant_id).all().catch(() => ({ results: [] })),
    ]);

    const fatMes = vendasMes?.total || 0;
    const nVendas = numVendasMes?.n || 0;
    const fatAnterior = vendasMesAnterior?.total || 0;
    const ticketMedio = nVendas > 0 ? fatMes / nVendas : 0;
    const variacao = fatAnterior > 0 ? ((fatMes - fatAnterior) / fatAnterior) * 100 : null;

    return json({
      totalClientes: totalClientes?.n || 0,
      osAberto: osAberto?.n || 0,
      osPronta: osPronta?.n || 0,
      osHoje: osHoje?.n || 0,
      vendasMes: fatMes,
      osParaEntregar: osParaEntregar.results,
      aniversariantes: aniversariantes.results,
      numVendasMes: nVendas,
      ticketMedio,
      vendasMesAnterior: fatAnterior,
      variacaoMes: variacao,
      aReceber: aReceber?.total || 0,
      aReceberQtd: aReceber?.n || 0,
      faturamento6m: (faturamento6m.results || []) as { ym: string; total: number; n: number }[],
      produtosMaisVendidos: (produtosMaisVendidos.results || []) as { descricao: string; qtd: number; faturamento: number }[],
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
