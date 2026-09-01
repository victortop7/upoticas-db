import type { D1Database } from '@cloudflare/workers-types';

// Índices para as consultas quentes (CRM, painel, relatórios, vendas).
// Sem eles, as sub-consultas por cliente varrem a tabela inteira a cada leitura,
// estourando o limite de linhas lidas do D1. IF NOT EXISTS = idempotente e barato.
let jaCriou = false;

export async function ensureIndexes(db: D1Database): Promise<void> {
  if (jaCriou) return; // por isolate: cria uma vez só
  const idx = [
    'CREATE INDEX IF NOT EXISTS idx_vendas_tenant_cliente ON vendas(tenant_id, cliente_id)',
    'CREATE INDEX IF NOT EXISTS idx_vendas_tenant_situacao ON vendas(tenant_id, situacao)',
    'CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id)',
    'CREATE INDEX IF NOT EXISTS idx_os_tenant_cliente ON ordens_servico(tenant_id, cliente_id)',
    'CREATE INDEX IF NOT EXISTS idx_os_tenant_situacao ON ordens_servico(tenant_id, situacao)',
    'CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id)',
    'CREATE INDEX IF NOT EXISTS idx_crmcards_tenant_cliente ON crm_cards(tenant_id, cliente_id)',
    'CREATE INDEX IF NOT EXISTS idx_clientes_tenant_ativo ON clientes(tenant_id, ativo)',
    'CREATE INDEX IF NOT EXISTS idx_venda_itens_venda ON venda_itens(venda_id)',
  ];
  for (const sql of idx) {
    try { await db.prepare(sql).run(); } catch { /* tabela pode não existir ainda */ }
  }
  jaCriou = true;
}
