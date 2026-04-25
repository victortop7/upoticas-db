import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const hoje = now.toISOString().split('T')[0];

    const [
      totalClientes,
      osAberto,
      osPronta,
      osHoje,
      vendasMes,
      osParaEntregar,
      aniversariantes,
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
    ]);

    return json({
      totalClientes: totalClientes?.n || 0,
      osAberto: osAberto?.n || 0,
      osPronta: osPronta?.n || 0,
      osHoje: osHoje?.n || 0,
      vendasMes: vendasMes?.total || 0,
      osParaEntregar: osParaEntregar.results,
      aniversariantes: aniversariantes.results,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
