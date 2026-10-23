import type { D1Database } from '@cloudflare/workers-types';
import { ensureReceber, hojeSP } from './receber';

// Linha do tempo do cliente no Funil depois de comprar:
//   deve algo          -> A Receber
//   quitou             -> sai de A Receber (Óculos Pendente se a OS ainda está em produção, senão Óculos Pronto)
//   20 dias depois     -> Pós-venda
//   2 meses depois     -> Indicação
export const DIAS_POS_VENDA = 20;
export const DIAS_INDICACAO = 60;

let jaGarantiu = false;
export async function ensureCrmFluxo(db: D1Database) {
  if (jaGarantiu) return;
  await ensureReceber(db);
  try { await db.prepare('ALTER TABLE crm_cards ADD COLUMN quitado_em TEXT').run(); } catch { /* já existe */ }
  // OS copiadas do Connect Vision nasciam com o valor total "em aberto" sem nunca ter cobrança.
  // Zera o restante das que nunca tiveram pagamento lançado (não mexe nas que receberam algo).
  try {
    await db.prepare(`UPDATE ordens_servico SET valor_restante = 0
      WHERE valor_restante > 0 AND COALESCE(valor_entrada, 0) = 0 AND observacao LIKE 'Connect Vision%'`).run();
  } catch { /* ok */ }
  jaGarantiu = true;
}

function menosDias(ymd: string, n: number) {
  const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10);
}

// Quem deve de verdade (3 parâmetros: tenant, hoje, tenant, tenant)
//  - saldo de venda que NÃO virou carnê
//  - parcela de carnê vencida e não paga
//  - OS com restante que não está ligada a nenhuma venda (se tem venda, a venda é quem manda)
const DEVEDORES = `
  SELECT v.cliente_id FROM vendas v
   WHERE v.tenant_id = ? AND v.situacao != 'cancelada' AND v.cliente_id IS NOT NULL
     AND COALESCE(v.saldo_restante, 0) - COALESCE((SELECT SUM(p.valor) FROM carne_parcelas p JOIN carnes c ON c.id = p.carne_id WHERE c.venda_id = v.id), 0) > 0.009
  UNION
  SELECT c.cliente_id FROM carne_parcelas p JOIN carnes c ON c.id = p.carne_id
   WHERE p.tenant_id = ? AND p.status != 'pago' AND p.vencimento < ? AND c.cliente_id IS NOT NULL
  UNION
  SELECT os.cliente_id FROM ordens_servico os
   WHERE os.tenant_id = ? AND COALESCE(os.valor_restante, 0) > 0.009 AND os.situacao NOT IN ('cancelado', 'orcamento')
     AND NOT EXISTS (SELECT 1 FROM vendas v WHERE v.tenant_id = os.tenant_id AND (v.os_id = os.id
       OR (v.cliente_id = os.cliente_id AND v.situacao != 'cancelada' AND date(v.created_at) >= date(os.created_at, '-2 days'))))`;

export async function aplicarFluxoReceber(db: D1Database, tenant: string, naoCustom = '') {
  await ensureCrmFluxo(db);
  const hoje = hojeSP();
  const pDev = [tenant, tenant, hoje, tenant];
  const temCustom = naoCustom ? [tenant] : [];

  // 1. Quem deve entra (ou fica) em A Receber; aniversário do dia tem prioridade
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'a_receber', quitado_em = NULL, updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio NOT IN ('aniversario', 'a_receber') ${naoCustom}
      AND cliente_id IN (${DEVEDORES})
  `).bind(tenant, ...temCustom, ...pDev).run();

  // 2. Quem estava em A Receber e não deve mais: sai, e marca a data da quitação
  await db.prepare(`
    UPDATE crm_cards SET
      estagio = CASE
        WHEN EXISTS (SELECT 1 FROM ordens_servico os WHERE os.tenant_id = crm_cards.tenant_id AND os.cliente_id = crm_cards.cliente_id
                     AND os.situacao IN ('aprovado', 'em_producao', 'aberta')) THEN 'oculos_pendente'
        WHEN (EXISTS (SELECT 1 FROM vendas v WHERE v.tenant_id = crm_cards.tenant_id AND v.cliente_id = crm_cards.cliente_id AND v.situacao != 'cancelada')
                  OR EXISTS (SELECT 1 FROM ordens_servico os WHERE os.tenant_id = crm_cards.tenant_id AND os.cliente_id = crm_cards.cliente_id AND os.situacao NOT IN ('orcamento', 'cancelado'))) THEN 'oculos_pronto'
        ELSE 'contato' END,  -- só tinha orçamento: volta pra Em andamento
      quitado_em = CASE WHEN (EXISTS (SELECT 1 FROM vendas v WHERE v.tenant_id = crm_cards.tenant_id AND v.cliente_id = crm_cards.cliente_id AND v.situacao != 'cancelada')
                  OR EXISTS (SELECT 1 FROM ordens_servico os WHERE os.tenant_id = crm_cards.tenant_id AND os.cliente_id = crm_cards.cliente_id AND os.situacao NOT IN ('orcamento', 'cancelado'))) THEN ? ELSE NULL END, updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio = 'a_receber'
      AND cliente_id NOT IN (${DEVEDORES})
  `).bind(hoje, tenant, ...pDev).run();

  // 3. 20 dias depois de quitar: Pós-venda
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'pos_venda', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio IN ('oculos_pendente', 'oculos_pronto')
      AND quitado_em IS NOT NULL AND quitado_em <= ?
  `).bind(tenant, menosDias(hoje, DIAS_POS_VENDA)).run();

  // 4. 2 meses depois: Indicação (base: quitação; sem ela, última entrega de OS ou última compra)
  await db.prepare(`
    UPDATE crm_cards SET estagio = 'indicacao', updated_at = datetime('now')
    WHERE tenant_id = ? AND estagio = 'pos_venda'
      AND COALESCE(quitado_em,
            (SELECT date(MAX(os.updated_at)) FROM ordens_servico os WHERE os.tenant_id = crm_cards.tenant_id AND os.cliente_id = crm_cards.cliente_id AND os.situacao = 'entregue'),
            (SELECT date(MAX(v.created_at)) FROM vendas v WHERE v.tenant_id = crm_cards.tenant_id AND v.cliente_id = crm_cards.cliente_id AND v.situacao != 'cancelada')
          ) <= ?
  `).bind(tenant, menosDias(hoje, DIAS_INDICACAO)).run();
}

// Valores que aparecem no card de A Receber (mesma regra de quem deve)
export const SQL_CARD_PENDENTES = {
  // OS sem venda ligada
  os: `(SELECT COALESCE(SUM(os.valor_restante),0) FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id AND os.valor_restante > 0.009 AND os.situacao NOT IN ('cancelado', 'orcamento')
        AND NOT EXISTS (SELECT 1 FROM vendas v2 WHERE v2.tenant_id = os.tenant_id AND (v2.os_id = os.id OR (v2.cliente_id = os.cliente_id AND v2.situacao != 'cancelada' AND date(v2.created_at) >= date(os.created_at, '-2 days')))))`,
  osId: `(SELECT os.id FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id AND os.valor_restante > 0.009 AND os.situacao NOT IN ('cancelado', 'orcamento')
        AND NOT EXISTS (SELECT 1 FROM vendas v2 WHERE v2.tenant_id = os.tenant_id AND (v2.os_id = os.id OR (v2.cliente_id = os.cliente_id AND v2.situacao != 'cancelada' AND date(v2.created_at) >= date(os.created_at, '-2 days')))) ORDER BY os.created_at DESC LIMIT 1)`,
  // saldo de venda fora do carnê
  venda: `(SELECT COALESCE(SUM(MAX(0, v.saldo_restante - COALESCE((SELECT SUM(p.valor) FROM carne_parcelas p JOIN carnes k ON k.id = p.carne_id WHERE k.venda_id = v.id), 0))), 0)
        FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao != 'cancelada' AND v.saldo_restante > 0.009)`,
  vendaId: `(SELECT v.id FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao != 'cancelada'
        AND v.saldo_restante - COALESCE((SELECT SUM(p.valor) FROM carne_parcelas p JOIN carnes k ON k.id = p.carne_id WHERE k.venda_id = v.id), 0) > 0.009
        ORDER BY v.created_at DESC LIMIT 1)`,
};
