import type { PagesFunction, D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCrmTable, ensureEstagiosPadrao } from './setup';

async function aplicarRegras(db: D1Database, tenant_id: string) {
  // 1. VIP: total gasto >= R$2.000 (não sobrescreve a_receber nem aniversario)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'vip', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio NOT IN ('vip','a_receber','aniversario')
    AND cliente_id IN (
      SELECT cliente_id FROM vendas
      WHERE tenant_id = ? AND situacao = 'ativa'
      GROUP BY cliente_id HAVING SUM(valor_final) >= 2000
    )
  `).bind(tenant_id, tenant_id).run();

  // 2. Pós-venda: OS marcada como entregue nos últimos 3 dias (janela de segurança)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'pos_venda', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio NOT IN ('vip','a_receber','aniversario','indicacao','reativacao')
    AND cliente_id IN (
      SELECT DISTINCT cliente_id FROM ordens_servico
      WHERE tenant_id = ? AND situacao = 'entregue'
      AND julianday('now') - julianday(updated_at) <= 3
    )
  `).bind(tenant_id, tenant_id).run();

  // 3. Indicação: 90 dias (3 meses) após última entrega, se ainda em pos_venda
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'indicacao', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio = 'pos_venda'
    AND cliente_id IN (
      SELECT cliente_id FROM ordens_servico
      WHERE tenant_id = ? AND situacao = 'entregue'
      GROUP BY cliente_id
      HAVING julianday('now') - julianday(MAX(updated_at)) >= 90
    )
  `).bind(tenant_id, tenant_id).run();

  // 4. Reativação: 1 ano (365 dias) após última entrega, exceto vip/a_receber/aniversario
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'reativacao', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio NOT IN ('vip','a_receber','aniversario','reativacao')
    AND cliente_id IN (
      SELECT cliente_id FROM ordens_servico
      WHERE tenant_id = ? AND situacao = 'entregue'
      GROUP BY cliente_id
      HAVING julianday('now') - julianday(MAX(updated_at)) >= 365
    )
  `).bind(tenant_id, tenant_id).run();

  // 5. A Receber: OS com valor restante > 0 (sobrescreve tudo exceto aniversario)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'a_receber', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio != 'aniversario'
    AND cliente_id IN (
      SELECT DISTINCT cliente_id FROM ordens_servico
      WHERE tenant_id = ? AND valor_restante > 0
    )
  `).bind(tenant_id, tenant_id).run();

  // 6. Aniversário hoje: prioridade máxima, sobrescreve tudo
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'aniversario', updated_at = datetime('now')
    WHERE tenant_id = ?
    AND cliente_id IN (
      SELECT id FROM clientes
      WHERE tenant_id = ? AND ativo = 1
      AND data_nascimento IS NOT NULL
      AND strftime('%m-%d', data_nascimento) = strftime('%m-%d', 'now')
    )
  `).bind(tenant_id, tenant_id).run();
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);
  await ensureEstagiosPadrao(env.DB, auth.tenant_id);

  // Cria cards para clientes sem card
  await env.DB.prepare(`
    INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at)
    SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
      c.tenant_id, c.id, 'novo', datetime('now'), datetime('now')
    FROM clientes c
    WHERE c.tenant_id = ? AND c.ativo = 1
    AND NOT EXISTS (SELECT 1 FROM crm_cards cc WHERE cc.cliente_id = c.id AND cc.tenant_id = c.tenant_id)
  `).bind(auth.tenant_id).run();

  // Aplica regras automáticas
  await aplicarRegras(env.DB, auth.tenant_id);

  const cards = await env.DB.prepare(`
    SELECT
      cc.id, cc.estagio, cc.prioridade, cc.notas, cc.created_at, cc.updated_at,
      c.id as cliente_id, c.nome, c.celular, c.telefone, c.email,
      c.cidade, c.uf, c.data_nascimento,
      (SELECT MAX(os.updated_at) FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id AND os.situacao = 'entregue') as ultima_entrega,
      (SELECT MAX(v.created_at) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id) as ultima_venda,
      (SELECT COUNT(*) FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id) as total_os,
      (SELECT COALESCE(SUM(os.valor_restante),0) FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id AND os.valor_restante > 0) as valor_pendente,
      (SELECT COALESCE(SUM(v.valor_final),0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao='ativa') as total_gasto
    FROM crm_cards cc
    JOIN clientes c ON c.id = cc.cliente_id
    WHERE cc.tenant_id = ? AND c.ativo = 1
    ORDER BY cc.updated_at DESC
  `).bind(auth.tenant_id).all();

  return json(cards.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);

  const body = await request.json() as { cliente_id: string };
  if (!body.cliente_id) return json({ error: 'cliente_id obrigatório' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id FROM crm_cards WHERE cliente_id = ? AND tenant_id = ?'
  ).bind(body.cliente_id, auth.tenant_id).first();
  if (existing) return json(existing);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.cliente_id, 'novo', now, now).run();

  return json({ id }, 201);
};
