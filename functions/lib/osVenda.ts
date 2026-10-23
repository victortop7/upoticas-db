import type { D1Database } from '@cloudflare/workers-types';

// OS criada junto com a venda (tela unificada Venda + OS).
// O financeiro fica na VENDA: a OS nasce quitada (restante 0) pra não contar a dívida duas vezes
// em A Receber / Funil.

const TIPOS = ['oculos_grau', 'oculos_sol', 'lente_contato', 'conserto', 'outro'];
const RECEITA = [
  'longe_od_esf', 'longe_od_cil', 'longe_od_eixo', 'longe_oe_esf', 'longe_oe_cil', 'longe_oe_eixo',
  'perto_od_esf', 'perto_od_cil', 'perto_od_eixo', 'perto_oe_esf', 'perto_oe_cil', 'perto_oe_eixo',
  'dp', 'altura', 'adicao',
] as const;

const num = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const txt = (v: unknown, max = 300) => { const s = String(v ?? '').trim(); return s ? s.slice(0, max) : null; };

export async function criarOSDaVenda(db: D1Database, p: {
  tenant: string; usuarioId: string; lojaId: string | null; clienteId: string;
  vendaNumero: number; valorFinal: number; prazo: string | null; os: Record<string, unknown>;
}): Promise<{ id: string; numero: number }> {
  const last = await db.prepare('SELECT MAX(numero) as max_num FROM ordens_servico WHERE tenant_id = ?')
    .bind(p.tenant).first<{ max_num: number | null }>();
  const numero = (last?.max_num || 0) + 1;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const tipo = TIPOS.includes(String(p.os.tipo)) ? String(p.os.tipo) : 'oculos_grau';
  const obs = [`Gerada na venda #${String(p.vendaNumero).padStart(4, '0')} (pagamento na venda)`, txt(p.os.observacao, 500)].filter(Boolean).join('\n');

  await db.prepare(`
    INSERT INTO ordens_servico (
      id, tenant_id, numero, cliente_id, tipo, situacao,
      ${RECEITA.join(', ')},
      armacao_desc, lente_desc,
      valor_total, valor_entrada, valor_restante,
      data_entrega, medico, observacao, funcionario_id, loja_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'aprovado', ${RECEITA.map(() => '?').join(', ')}, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, p.tenant, numero, p.clienteId, tipo,
    ...RECEITA.map(k => num(p.os[k])),
    txt(p.os.armacao_desc), txt(p.os.lente_desc),
    p.valorFinal, p.valorFinal,
    p.prazo || null, txt(p.os.medico, 120), obs, p.usuarioId, p.lojaId,
    now, now,
  ).run();
  return { id, numero };
}
