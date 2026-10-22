import type { D1Database } from '@cloudflare/workers-types';
import { ensureCarneTables } from '../api/carnes/index';
import { ensureFinanceiroTables } from '../api/financeiro/setup';
import { ensureLojaCols } from './lojas';

// Contas a Receber integrado: junta numa lista só
//   • parcelas de carnê/boleto (ligadas à venda)
//   • saldo em aberto das vendas ("Falta") que não virou carnê
//   • lançamentos manuais (contas_receber)

// Saldo de venda sem carnê conta como atrasado depois de N dias da venda
export const DIAS_SALDO_VENCE = 30;

let jaGarantiu = false;
export async function ensureReceber(db: D1Database) {
  if (jaGarantiu) return;
  await ensureCarneTables(db);
  await ensureFinanceiroTables(db);
  await ensureLojaCols(db);
  for (const c of ['venda_id TEXT']) {
    try { await db.prepare(`ALTER TABLE carnes ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  for (const c of ['valor_entrada REAL NOT NULL DEFAULT 0', 'saldo_restante REAL NOT NULL DEFAULT 0']) {
    try { await db.prepare(`ALTER TABLE vendas ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  for (const c of ['foto TEXT', 'referencia TEXT']) {
    try { await db.prepare(`ALTER TABLE clientes ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_carnes_venda ON carnes(tenant_id, venda_id)').run(); } catch { /* ok */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_carnes_cliente ON carnes(tenant_id, cliente_id)').run(); } catch { /* ok */ }
  // Carnês antigos: liga à venda pela descrição "Venda #0123: boleto"
  try {
    await db.prepare(`
      UPDATE carnes SET venda_id = (
        SELECT v.id FROM vendas v
        WHERE v.tenant_id = carnes.tenant_id
          AND v.numero = CAST(substr(carnes.descricao, 8, instr(substr(carnes.descricao, 8) || ' ', ' ') - 1) AS INTEGER)
        LIMIT 1)
      WHERE venda_id IS NULL AND descricao LIKE 'Venda #%'`).run();
  } catch { /* ok */ }
  jaGarantiu = true;
}

export function hojeSP(): string {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}
function menosDias(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10);
}

export interface FiltroTitulos {
  situacao?: string;     // aberto (padrão) | vencido | pendente | recebido | todos
  inicio?: string; fim?: string;   // vencimento
  q?: string;            // nome / apelido / CPF / nº venda
  bairro?: string; cidade?: string; endereco?: string;
  origem?: string;       // carne | venda | manual
  cliente_id?: string;
  loja_id?: string | null;         // restringe à loja (vendedor de loja)
}

export interface Titulo {
  origem: 'carne' | 'venda' | 'manual';
  id: string;
  cliente_id: string | null; cliente_nome: string | null; apelido: string | null; cpf: string | null;
  celular: string | null; telefone: string | null; endereco: string | null; bairro: string | null; cidade: string | null; uf: string | null; referencia: string | null;
  venda_id: string | null; venda_numero: number | null; carne_id: string | null;
  descricao: string; parcela: string | null; vencimento: string; valor: number;
  situacao: 'pendente' | 'vencido' | 'recebido'; recebido_em: string | null; dias_atraso: number;
}

const CLI = `cl.nome AS cliente_nome, cl.apelido, cl.cpf, cl.celular, cl.telefone, cl.endereco, cl.bairro, cl.cidade, cl.uf, cl.referencia`;

export async function listarTitulos(db: D1Database, tenant: string, f: FiltroTitulos, limite = 3000): Promise<Titulo[]> {
  await ensureReceber(db);
  const hoje = hojeSP();
  const limiteSaldo = menosDias(hoje, DIAS_SALDO_VENCE);
  const lojaA = f.loja_id ? ' AND COALESCE(c.loja_id, v.loja_id, cl.loja_id) = ?' : '';
  const lojaB = f.loja_id ? ' AND v.loja_id = ?' : '';

  const sqlCarne = `
    SELECT 'carne' AS origem, p.id, c.cliente_id, ${CLI},
      c.venda_id, v.numero AS venda_numero, c.id AS carne_id,
      COALESCE(c.descricao, 'Carnê') AS descricao, (p.numero || '/' || c.num_parcelas) AS parcela,
      p.vencimento, p.valor,
      CASE WHEN p.status = 'pago' THEN 'recebido' WHEN p.vencimento < ? THEN 'vencido' ELSE 'pendente' END AS situacao,
      p.pago_em AS recebido_em
    FROM carne_parcelas p JOIN carnes c ON c.id = p.carne_id
    LEFT JOIN clientes cl ON cl.id = c.cliente_id
    LEFT JOIN vendas v ON v.id = c.venda_id
    WHERE p.tenant_id = ?${lojaA}`;

  const sqlVenda = `
    SELECT 'venda' AS origem, x.id, x.cliente_id, ${CLI},
      x.id AS venda_id, x.numero AS venda_numero, NULL AS carne_id,
      'Saldo da venda' AS descricao, NULL AS parcela, x.dia AS vencimento, x.aberto AS valor,
      CASE WHEN x.dia < ? THEN 'vencido' ELSE 'pendente' END AS situacao, NULL AS recebido_em
    FROM (
      SELECT v.id, v.cliente_id, v.numero, date(v.created_at) AS dia,
        -- a parte em carnê/boleto já aparece nas parcelas: tira o carnê inteiro do saldo
        ROUND(v.saldo_restante - COALESCE((SELECT SUM(p.valor) FROM carne_parcelas p JOIN carnes c ON c.id = p.carne_id
          WHERE c.venda_id = v.id), 0), 2) AS aberto
      FROM vendas v
      WHERE v.tenant_id = ? AND v.situacao != 'cancelada' AND v.saldo_restante > 0.009${lojaB}
    ) x LEFT JOIN clientes cl ON cl.id = x.cliente_id
    WHERE x.aberto > 0.009`;

  const sqlManual = `
    SELECT 'manual' AS origem, cr.id, cr.cliente_id, ${CLI},
      NULL AS venda_id, NULL AS venda_numero, NULL AS carne_id,
      cr.descricao, NULL AS parcela, cr.data_vencimento AS vencimento, cr.valor,
      CASE WHEN cr.situacao = 'recebido' THEN 'recebido' WHEN cr.data_vencimento < ? THEN 'vencido' ELSE 'pendente' END AS situacao,
      cr.data_recebimento AS recebido_em
    FROM contas_receber cr LEFT JOIN clientes cl ON cl.id = cr.cliente_id
    WHERE cr.tenant_id = ? AND cr.situacao != 'cancelado'`;

  const partes: string[] = [];
  const params: unknown[] = [];
  const quer = (o: string) => !f.origem || f.origem === o;
  if (quer('carne')) { partes.push(sqlCarne); params.push(hoje, tenant); if (f.loja_id) params.push(f.loja_id); }
  if (quer('venda')) { partes.push(sqlVenda); params.push(limiteSaldo, tenant); if (f.loja_id) params.push(f.loja_id); }
  // lançamentos manuais não têm loja: só aparecem pra quem vê todas as lojas
  if (quer('manual') && !f.loja_id) { partes.push(sqlManual); params.push(hoje, tenant); }
  if (!partes.length) return [];

  let where = ' WHERE 1=1';
  const sit = f.situacao || 'aberto';
  if (sit === 'aberto') where += ` AND t.situacao IN ('pendente','vencido')`;
  else if (sit !== 'todos') { where += ' AND t.situacao = ?'; params.push(sit); }
  if (f.inicio) { where += ' AND t.vencimento >= ?'; params.push(f.inicio); }
  if (f.fim) { where += ' AND t.vencimento <= ?'; params.push(f.fim); }
  if (f.cliente_id) { where += ' AND t.cliente_id = ?'; params.push(f.cliente_id); }
  if (f.bairro) { where += ' AND t.bairro LIKE ?'; params.push(`%${f.bairro.trim()}%`); }
  if (f.cidade) { where += ' AND t.cidade LIKE ?'; params.push(`%${f.cidade.trim()}%`); }
  if (f.endereco) { where += ' AND t.endereco LIKE ?'; params.push(`%${f.endereco.trim()}%`); }
  if (f.q) {
    const q = f.q.trim();
    const num = q.replace(/^#/, '');
    where += ' AND (t.cliente_nome LIKE ? OR t.apelido LIKE ? OR t.cpf LIKE ? OR t.descricao LIKE ?' + (/^\d+$/.test(num) ? ' OR t.venda_numero = ?' : '') + ')';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    if (/^\d+$/.test(num)) params.push(Number(num));
  }

  const sql = `SELECT * FROM (${partes.join(' UNION ALL ')}) t${where} ORDER BY t.vencimento ASC, t.cliente_nome ASC LIMIT ${Math.max(1, Math.min(limite, 5000))}`;
  const r = await db.prepare(sql).bind(...params).all<Omit<Titulo, 'dias_atraso'>>();
  const hojeMs = new Date(`${hoje}T12:00:00Z`).getTime();
  return (r.results || []).map(t => ({
    ...t,
    valor: Number(t.valor) || 0,
    dias_atraso: t.situacao === 'vencido' ? Math.max(0, Math.round((hojeMs - new Date(`${t.vencimento}T12:00:00Z`).getTime()) / 86_400_000)) : 0,
  }));
}

// Marca/desmarca parcela de carnê como paga
export async function baixarParcela(db: D1Database, tenant: string, parcelaId: string, pago: boolean, data?: string | null) {
  await ensureReceber(db);
  const p = await db.prepare(
    `SELECT p.id, p.valor, p.status, c.venda_id, c.descricao, p.numero, c.num_parcelas FROM carne_parcelas p JOIN carnes c ON c.id = p.carne_id WHERE p.id = ? AND p.tenant_id = ?`
  ).bind(parcelaId, tenant).first<{ id: string; valor: number; status: string; venda_id: string | null; descricao: string | null; numero: number; num_parcelas: number }>();
  if (!p) return { ok: false as const, erro: 'Parcela não encontrada' };
  const quando = pago ? (data ? `${data}T12:00:00.000Z` : new Date().toISOString()) : null;
  await db.prepare('UPDATE carne_parcelas SET status = ?, pago_em = ? WHERE id = ? AND tenant_id = ?').bind(pago ? 'pago' : 'pendente', quando, parcelaId, tenant).run();
  return { ok: true as const, mudou: (p.status === 'pago') !== pago, valor: p.valor, descricao: `${p.descricao || 'Carnê'} · parcela ${p.numero}/${p.num_parcelas}` };
}
