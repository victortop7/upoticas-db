import type { D1Database } from '@cloudflare/workers-types';
import { ensureReceber, hojeSP } from './receber';
import { ensurePagamentos } from './pagamentos';

// ─────────────────────────────────────────────────────────────────────────────
// Funil do CRM (automático). Cada cliente fica em UMA etapa, pela ordem de prioridade:
//   A Receber        deve algo (saldo fora do carnê, parcela vencida, OS sem venda com restante)
//   Em andamento     comprou e o óculos ainda está dentro do prazo de entrega
//   Óculos Pronto    chegou o prazo; fica 2 dias esperando o cliente buscar
//   Óculos Pendente  passou 2 dias do prazo e não foi entregue (sai com o botão Entregue)
//   Aniversário      7 dias antes do aniversário até o dia
//   Pós-venda        20 dias depois da entrega, por 3 dias
//   Indicação        2 meses depois da entrega, por 4 dias
//   Reativação       última compra há 1 ano ou mais
//   VIP              comprou mais de R$ 2.000 no total
//   (fora do funil)  ninguém precisa de ação agora
// Etapas criadas pela ótica (sistema = 0) são manuais: o automático não tira ninguém delas.
// ─────────────────────────────────────────────────────────────────────────────
export const PRAZO_PADRAO_DIAS = 7;      // prazo de entrega quando a venda não informou
export const DIAS_PRONTO = 2;            // Óculos Pronto -> Óculos Pendente
export const DIAS_POS_VENDA = 20;        // depois da entrega
export const DURACAO_POS_VENDA = 3;
export const DIAS_INDICACAO = 60;        // 2 meses depois da entrega
export const DURACAO_INDICACAO = 4;
export const DIAS_ANIVERSARIO = 7;       // aparece 7 dias antes
export const DIAS_REATIVACAO = 365;
export const VALOR_VIP = 2000;
export const FORA_DO_FUNIL = 'arquivo';

let jaGarantiu = false;
export async function ensureCrmFluxo(db: D1Database) {
  if (jaGarantiu) return;
  await ensureReceber(db);
  await ensurePagamentos(db);
  try { await db.prepare('ALTER TABLE crm_cards ADD COLUMN quitado_em TEXT').run(); } catch { /* já existe */ }
  for (const c of ['prazo_entrega TEXT', 'entregue_em TEXT']) {
    try { await db.prepare(`ALTER TABLE vendas ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  // OS copiadas do Connect Vision nasciam com o valor total "em aberto" sem nunca ter cobrança.
  try {
    await db.prepare(`UPDATE ordens_servico SET valor_restante = 0
      WHERE valor_restante > 0 AND COALESCE(valor_entrada, 0) = 0 AND observacao LIKE 'Connect Vision%'`).run();
  } catch { /* ok */ }
  // Vendas antigas (antes do botão Entregue existir): considera entregues 7 dias após a compra.
  // As dos últimos 15 dias ficam em aberto pra loja marcar Entregue.
  try {
    await db.prepare(`UPDATE vendas SET entregue_em = date(created_at, '+7 days')
      WHERE entregue_em IS NULL AND situacao != 'cancelada' AND date(created_at) < date('now', '-15 days')`).run();
  } catch { /* ok */ }
  jaGarantiu = true;
}

// Etapas do sistema: nomes, ordem e "Cliente Cadastrado" desligado
export async function ajustarEstagios(db: D1Database, tenant: string) {
  const ordem: [string, string, string, number][] = [
    ['contato', 'Em andamento', '#2563eb', 1], ['oculos_pronto', 'Óculos Pronto', '#16a34a', 2], ['oculos_pendente', 'Óculos Pendente', '#f59e0b', 3],
    ['a_receber', 'A Receber', '#dc2626', 4], ['pos_venda', 'Pós-venda', '#0891b2', 5], ['aniversario', 'Aniversário', '#d97706', 6],
    ['indicacao', 'Indicação', '#7c3aed', 7], ['reativacao', 'Reativação', '#ea580c', 8], ['vip', 'VIP', '#b45309', 9],
  ];
  const stmts = [db.prepare(`UPDATE crm_estagios SET ativo = 0 WHERE tenant_id = ? AND key = 'novo'`).bind(tenant)];
  for (const [key, label, cor, n] of ordem) {
    stmts.push(db.prepare('UPDATE crm_estagios SET ordem = ?, ativo = 1 WHERE tenant_id = ? AND key = ? AND sistema = 1').bind(n, tenant, key));
    stmts.push(db.prepare(`INSERT OR IGNORE INTO crm_estagios (id, tenant_id, key, label, icon, color, ordem, sistema) VALUES (?, ?, ?, ?, '', ?, ?, 1)`)
      .bind(crypto.randomUUID(), tenant, key, label, cor, n));
  }
  try { await db.batch(stmts); } catch { /* ok */ }
}

function somaDias(ymd: string, n: number) {
  const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
function diasEntre(de: string, ate: string) {
  return Math.round((new Date(`${ate}T12:00:00Z`).getTime() - new Date(`${de}T12:00:00Z`).getTime()) / 86_400_000);
}
// dias até o próximo aniversário (0 = hoje)
export function diasAteAniversario(nasc: string | null | undefined, hoje: string): number | null {
  if (!nasc || !/^\d{4}-\d{2}-\d{2}/.test(nasc)) return null;
  const [, m, d] = nasc.slice(0, 10).split('-').map(Number);
  const ano = Number(hoje.slice(0, 4));
  const montar = (a: number) => {
    const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate(); // 29/02 em ano comum vira 28/02
    return `${a}-${String(m).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
  };
  let alvo = montar(ano);
  if (alvo < hoje) alvo = montar(ano + 1);
  return diasEntre(hoje, alvo);
}

export interface SituacaoCliente {
  deve: boolean;
  prazoPendente: string | null;   // prazo da compra mais antiga ainda não entregue
  ultimaEntrega: string | null;
  ultimaCompra: string | null;    // venda ou data_compra (base importada)
  totalGasto: number;
  nascimento: string | null;
}

// Regra única: devolve a etapa do cliente hoje
export function etapaDoCliente(s: SituacaoCliente, hoje: string): string {
  if (s.deve) return 'a_receber';
  if (s.prazoPendente) {
    if (hoje < s.prazoPendente) return 'contato';
    if (diasEntre(s.prazoPendente, hoje) < DIAS_PRONTO) return 'oculos_pronto';
    return 'oculos_pendente';
  }
  const aniv = diasAteAniversario(s.nascimento, hoje);
  if (aniv !== null && aniv <= DIAS_ANIVERSARIO) return 'aniversario';
  if (s.ultimaEntrega) {
    const d = diasEntre(s.ultimaEntrega, hoje);
    if (d >= DIAS_POS_VENDA && d < DIAS_POS_VENDA + DURACAO_POS_VENDA) return 'pos_venda';
    if (d >= DIAS_INDICACAO && d < DIAS_INDICACAO + DURACAO_INDICACAO) return 'indicacao';
  }
  if (s.ultimaCompra && diasEntre(s.ultimaCompra, hoje) >= DIAS_REATIVACAO) return 'reativacao';
  if (s.totalGasto > VALOR_VIP) return 'vip';
  return FORA_DO_FUNIL;
}

// Quem deve de verdade (parâmetros: tenant, tenant, hoje, tenant)
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

// prazo de entrega da venda: informado na venda, senão o da OS ligada, senão compra + 7 dias
export const SQL_PRAZO_VENDA = `COALESCE(v.prazo_entrega, (SELECT os.data_entrega FROM ordens_servico os WHERE os.id = v.os_id AND os.data_entrega IS NOT NULL), date(v.created_at, '+${PRAZO_PADRAO_DIAS} days'))`;

// Recalcula a etapa de todos os clientes da conta (ou de um só) e grava só o que mudou
export async function recalcularFunil(db: D1Database, tenant: string, clienteId?: string) {
  await ensureCrmFluxo(db);
  await ajustarEstagios(db, tenant);
  const hoje = hojeSP();
  const umSo = clienteId ? ' AND c.id = ?' : '';

  // garante card para todo cliente ativo (fica fora do funil até precisar de ação)
  await db.prepare(`
    INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at)
    SELECT lower(hex(randomblob(16))), c.tenant_id, c.id, '${FORA_DO_FUNIL}', datetime('now'), datetime('now')
    FROM clientes c WHERE c.tenant_id = ? AND c.ativo = 1${umSo}
      AND NOT EXISTS (SELECT 1 FROM crm_cards cc WHERE cc.cliente_id = c.id AND cc.tenant_id = c.tenant_id)
  `).bind(tenant, ...(clienteId ? [clienteId] : [])).run();

  const dev = await db.prepare(`SELECT DISTINCT cliente_id FROM (${DEVEDORES})`).bind(tenant, tenant, hoje, tenant).all<{ cliente_id: string }>();
  const devedores = new Set((dev.results || []).map(r => r.cliente_id));

  const linhas = await db.prepare(`
    SELECT cc.id AS card_id, cc.estagio, c.id, c.data_nascimento, c.data_compra,
      (SELECT MIN(${SQL_PRAZO_VENDA}) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id AND v.situacao != 'cancelada' AND v.entregue_em IS NULL) AS prazo_pend,
      (SELECT MAX(v.entregue_em) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id AND v.situacao != 'cancelada') AS ult_entrega,
      (SELECT MAX(date(v.created_at)) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id AND v.situacao != 'cancelada') AS ult_compra,
      (SELECT COALESCE(SUM(v.valor_final), 0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id AND v.situacao != 'cancelada') AS total,
      (SELECT e.sistema FROM crm_estagios e WHERE e.tenant_id = cc.tenant_id AND e.key = cc.estagio) AS sistema
    FROM clientes c JOIN crm_cards cc ON cc.cliente_id = c.id AND cc.tenant_id = c.tenant_id
    WHERE c.tenant_id = ? AND c.ativo = 1${umSo}
  `).bind(tenant, ...(clienteId ? [clienteId] : [])).all<{
    card_id: string; estagio: string; id: string; data_nascimento: string | null; data_compra: string | null;
    prazo_pend: string | null; ult_entrega: string | null; ult_compra: string | null; total: number; sistema: number | null;
  }>();

  const mudar: { id: string; etapa: string }[] = [];
  for (const l of linhas.results || []) {
    if (l.sistema === 0) continue; // etapa criada pela ótica: manual
    const etapa = etapaDoCliente({
      deve: devedores.has(l.id),
      prazoPendente: l.prazo_pend ? String(l.prazo_pend).slice(0, 10) : null,
      ultimaEntrega: l.ult_entrega ? String(l.ult_entrega).slice(0, 10) : null,
      ultimaCompra: l.ult_compra || (l.data_compra ? String(l.data_compra).slice(0, 10) : null),
      totalGasto: Number(l.total) || 0,
      nascimento: l.data_nascimento,
    }, hoje);
    if (etapa !== l.estagio) mudar.push({ id: l.card_id, etapa });
  }
  for (let i = 0; i < mudar.length; i += 90) {
    await db.batch(mudar.slice(i, i + 90).map(m =>
      db.prepare(`UPDATE crm_cards SET estagio = ?, updated_at = datetime('now') WHERE id = ?`).bind(m.etapa, m.id)));
  }
  return { mudaram: mudar.length };
}

// nomes antigos usados em outros arquivos
export async function aplicarFluxoReceber(db: D1Database, tenant: string) {
  await recalcularFunil(db, tenant);
}

// Botão "Entregue": marca as compras ainda não entregues do cliente (e as OS ligadas)
export async function marcarEntregue(db: D1Database, tenant: string, clienteId: string) {
  await ensureCrmFluxo(db);
  const hoje = hojeSP();
  await db.batch([
    db.prepare(`UPDATE ordens_servico SET situacao = 'entregue', updated_at = datetime('now')
      WHERE tenant_id = ? AND situacao NOT IN ('cancelado', 'entregue')
        AND id IN (SELECT os_id FROM vendas WHERE tenant_id = ? AND cliente_id = ? AND entregue_em IS NULL AND situacao != 'cancelada' AND os_id IS NOT NULL)`)
      .bind(tenant, tenant, clienteId),
    db.prepare(`UPDATE vendas SET entregue_em = ? WHERE tenant_id = ? AND cliente_id = ? AND entregue_em IS NULL AND situacao != 'cancelada'`)
      .bind(hoje, tenant, clienteId),
  ]);
  await recalcularFunil(db, tenant, clienteId);
}

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
