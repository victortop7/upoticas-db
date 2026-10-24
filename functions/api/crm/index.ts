import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCrmTable, ensureEstagiosPadrao } from './setup';
import { ensureClienteCols } from '../../lib/ensure-cliente-cols';
import { ensureIndexes } from '../../lib/ensure-indexes';
import { recalcularFunil, moverManual, SQL_CARD_PENDENTES, SQL_PRAZO_VENDA, FORA_DO_FUNIL } from '../../lib/crmFluxo';
import { hojeSP } from '../../lib/receber';

// Regras do funil: ver functions/lib/crmFluxo.ts (motor único)
async function aplicarRegras(db: D1Database, tenant_id: string) {
  await recalcularFunil(db, tenant_id);
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);
  await ensureEstagiosPadrao(env.DB, auth.tenant_id);
  await ensureClienteCols(env.DB);
  await ensureIndexes(env.DB);

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
      ${SQL_CARD_PENDENTES.os} as valor_pendente,
      (SELECT COALESCE(SUM(v.valor_final),0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao='ativa') as total_gasto,
      ${SQL_CARD_PENDENTES.venda} as saldo_venda_pendente,
      (SELECT COALESCE(SUM(p.valor),0) FROM carne_parcelas p JOIN carnes k ON k.id = p.carne_id WHERE k.cliente_id = c.id AND p.tenant_id = cc.tenant_id AND p.status != 'pago' AND p.vencimento < ?) as carne_vencido,
      cc.quitado_em,
      (SELECT MIN(${SQL_PRAZO_VENDA}) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao != 'cancelada' AND v.entregue_em IS NULL) as prazo_entrega,
      (SELECT MAX(v.entregue_em) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao != 'cancelada') as entregue_em,
      ${SQL_CARD_PENDENTES.vendaId} as venda_pendente_id,
      ${SQL_CARD_PENDENTES.osId} as os_pendente_id
    FROM crm_cards cc
    JOIN clientes c ON c.id = cc.cliente_id
    WHERE cc.tenant_id = ? AND c.ativo = 1 AND cc.estagio != '${FORA_DO_FUNIL}'
    ORDER BY cc.updated_at DESC
  `).bind(hojeSP(), auth.tenant_id).all();

  return json(cards.results);
};

// POST /api/crm: coloca (ou recoloca) um cliente no funil, no início ("Cliente Cadastrado")
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
    await moverManual(env.DB, auth.tenant_id, existing.id, estagio, auth.usuario_id);
    return json({ id: existing.id, estagio, recolocado: true });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.cliente_id, estagio, now, now).run();
  await moverManual(env.DB, auth.tenant_id, id, estagio, auth.usuario_id); // fica na etapa escolhida

  return json({ id, estagio }, 201);
};
