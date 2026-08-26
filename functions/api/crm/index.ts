import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCrmTable, ensureEstagiosPadrao } from './setup';
import { ensureClienteCols } from '../../lib/ensure-cliente-cols';

async function aplicarRegras(db: D1Database, tenant_id: string) {
  // 0. "Cliente Cadastrado" (novo) é só para quem AINDA NÃO comprou.
  //    Quem já tem venda ou OS sai de 'novo' e vai para Pós-venda (as regras abaixo refinam por recência).
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'pos_venda', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio = 'novo'
    AND cliente_id IN (
      SELECT cliente_id FROM vendas WHERE tenant_id = ?
      UNION
      SELECT cliente_id FROM ordens_servico WHERE tenant_id = ?
    )
  `).bind(tenant_id, tenant_id, tenant_id).run();

  // 1. VIP: total gasto >= R$2.000 (não sobrescreve a_receber, aniversario, oculos_pendente, oculos_pronto)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'vip', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio NOT IN ('vip','a_receber','aniversario','oculos_pendente','oculos_pronto')
    AND cliente_id IN (
      SELECT cliente_id FROM vendas
      WHERE tenant_id = ? AND situacao = 'ativa'
      GROUP BY cliente_id HAVING SUM(valor_final) >= 2000
    )
  `).bind(tenant_id, tenant_id).run();

  // 2. Pós-venda: OS marcada como entregue nos últimos 3 dias (janela de segurança)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'pos_venda', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio NOT IN ('vip','a_receber','aniversario','indicacao','reativacao','oculos_pendente','oculos_pronto')
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

  // 4b. Reativação por DATA DE COMPRA (base importada sem OS): >= 365 dias desde a última compra.
  //     Pega clientes antigos que não têm OS/venda registrada mas têm data_compra preenchida.
  try {
    await db.prepare(`
      UPDATE crm_cards SET estagio = 'reativacao', updated_at = datetime('now')
      WHERE tenant_id = ? AND estagio NOT IN ('vip','a_receber','aniversario','reativacao','oculos_pendente','oculos_pronto')
      AND cliente_id IN (
        SELECT id FROM clientes
        WHERE tenant_id = ? AND ativo = 1
        AND data_compra IS NOT NULL AND data_compra != ''
        AND julianday('now') - julianday(data_compra) >= 365
      )
    `).bind(tenant_id, tenant_id).run();
  } catch { /* coluna data_compra ainda não existe */ }

  // 5. A Receber: OS com valor restante > 0 OU venda com saldo pendente (sobrescreve tudo exceto aniversario)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'a_receber', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio != 'aniversario'
    AND cliente_id IN (
      SELECT DISTINCT cliente_id FROM ordens_servico WHERE tenant_id = ? AND valor_restante > 0
      UNION
      SELECT DISTINCT cliente_id FROM vendas WHERE tenant_id = ? AND saldo_restante > 0
    )
  `).bind(tenant_id, tenant_id, tenant_id).run();

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

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);
  await ensureEstagiosPadrao(env.DB, auth.tenant_id);
  await ensureClienteCols(env.DB);

  // Cria cards para clientes sem card
  await env.DB.prepare(`
    INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at)
    SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
      c.tenant_id, c.id,
      CASE WHEN EXISTS (SELECT 1 FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id)
             OR EXISTS (SELECT 1 FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = c.tenant_id)
           THEN 'pos_venda' ELSE 'novo' END,
      datetime('now'), datetime('now')
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
      (SELECT COALESCE(SUM(v.valor_final),0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao='ativa') as total_gasto,
      (SELECT COALESCE(SUM(v.saldo_restante),0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao='pendente') as saldo_venda_pendente,
      (SELECT v.id FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao='pendente' ORDER BY v.created_at DESC LIMIT 1) as venda_pendente_id,
      (SELECT os.id FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id AND os.valor_restante > 0 ORDER BY os.created_at DESC LIMIT 1) as os_pendente_id
    FROM crm_cards cc
    JOIN clientes c ON c.id = cc.cliente_id
    WHERE cc.tenant_id = ? AND c.ativo = 1
    ORDER BY cc.updated_at DESC
  `).bind(auth.tenant_id).all();

  return json(cards.results);
};

// POST /api/crm — coloca (ou recoloca) um cliente no funil, no início ("Cliente Cadastrado")
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);
  await ensureEstagiosPadrao(env.DB, auth.tenant_id); // garante que a coluna "Cliente Cadastrado" exista

  const body = await request.json() as { cliente_id: string; estagio?: string };
  if (!body.cliente_id) return json({ error: 'cliente_id obrigatório' }, 400);

  // Etapa escolhida (default: "Cliente Cadastrado"). Valida que ela existe no funil da ótica.
  let estagio = (body.estagio || 'novo').trim() || 'novo';
  const valido = await env.DB.prepare(
    'SELECT 1 FROM crm_estagios WHERE tenant_id = ? AND key = ? AND ativo = 1'
  ).bind(auth.tenant_id, estagio).first();
  if (!valido) estagio = 'novo';

  const now = new Date().toISOString();
  const existing = await env.DB.prepare(
    'SELECT id FROM crm_cards WHERE cliente_id = ? AND tenant_id = ?'
  ).bind(body.cliente_id, auth.tenant_id).first<{ id: string }>();

  if (existing) {
    // Já está no funil → move para a etapa escolhida
    await env.DB.prepare(
      'UPDATE crm_cards SET estagio = ?, updated_at = ? WHERE id = ?'
    ).bind(estagio, now, existing.id).run();
    return json({ id: existing.id, estagio, recolocado: true });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.cliente_id, estagio, now, now).run();

  return json({ id, estagio }, 201);
};
