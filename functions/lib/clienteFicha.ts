import type { D1Database } from '@cloudflare/workers-types';
import { ensureClienteCols } from './ensure-cliente-cols';
import { ensureLojaCols } from './lojas';

// Ficha completa do cliente (formato de cadastro de ERP): campos extras + código sequencial.
export const CAMPOS_FICHA = [
  'pessoa', 'nome', 'apelido', 'data_nascimento', 'cpf', 'rg', 'telefone', 'tel_comercial', 'celular',
  'spc', 'sem_cobranca', 'nao_receber_msg', 'situacao_cad', 'cobranca', 'regiao', 'localidade',
  'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'observacao', 'email',
  'mae', 'pai', 'conjuge', 'referencia', 'data_compra',
] as const;

const NOVAS = [
  "pessoa TEXT NOT NULL DEFAULT 'F'", 'rg TEXT', 'tel_comercial TEXT', 'numero TEXT', 'complemento TEXT',
  'mae TEXT', 'pai TEXT', 'conjuge TEXT', 'regiao TEXT', 'localidade TEXT',
  'spc INTEGER NOT NULL DEFAULT 0', 'sem_cobranca INTEGER NOT NULL DEFAULT 0', 'nao_receber_msg INTEGER NOT NULL DEFAULT 0',
  "situacao_cad TEXT NOT NULL DEFAULT 'ativo'", "cobranca TEXT NOT NULL DEFAULT 'normal'",
  'codigo INTEGER', 'foto TEXT', 'referencia TEXT',
];

let jaGarantiu = false;
export async function ensureFicha(db: D1Database) {
  if (jaGarantiu) return;
  await ensureClienteCols(db);
  await ensureLojaCols(db);
  for (const c of NOVAS) {
    try { await db.prepare(`ALTER TABLE clientes ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
  }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(tenant_id, codigo)').run(); } catch { /* ok */ }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(tenant_id, nome)').run(); } catch { /* ok */ }
  // importados do sistema antigo mantêm o número original como código
  try {
    await db.prepare(`UPDATE clientes SET codigo = CAST(substr(id, 8) AS INTEGER)
      WHERE codigo IS NULL AND id LIKE 'cc-cli-%' AND CAST(substr(id, 8) AS INTEGER) > 0`).run();
  } catch { /* ok */ }
  jaGarantiu = true;
}

// Dá código aos clientes da conta que ainda não têm (ordem de cadastro), continuando do maior
export async function numerarClientes(db: D1Database, tenant: string) {
  const sem = await db.prepare('SELECT id FROM clientes WHERE tenant_id = ? AND codigo IS NULL ORDER BY created_at, id LIMIT 2000')
    .bind(tenant).all<{ id: string }>();
  const lista = sem.results || [];
  if (!lista.length) return;
  const max = await db.prepare('SELECT COALESCE(MAX(codigo), 0) AS m FROM clientes WHERE tenant_id = ?').bind(tenant).first<{ m: number }>();
  let n = Number(max?.m || 0);
  for (let i = 0; i < lista.length; i += 90) {
    await db.batch(lista.slice(i, i + 90).map(c => db.prepare('UPDATE clientes SET codigo = ? WHERE id = ? AND codigo IS NULL').bind(++n, c.id)));
  }
}

export async function proximoCodigo(db: D1Database, tenant: string) {
  const r = await db.prepare('SELECT COALESCE(MAX(codigo), 0) + 1 AS n FROM clientes WHERE tenant_id = ?').bind(tenant).first<{ n: number }>();
  return Number(r?.n || 1);
}

// Normaliza o corpo vindo da tela
export function valoresFicha(b: Record<string, unknown>) {
  const txt = (k: string) => { const v = String(b[k] ?? '').trim(); return v || null; };
  const flag = (k: string) => (b[k] === true || b[k] === 1 || b[k] === '1' ? 1 : 0);
  return {
    pessoa: b.pessoa === 'J' ? 'J' : 'F',
    nome: String(b.nome ?? '').trim(),
    apelido: txt('apelido'), data_nascimento: txt('data_nascimento'), cpf: txt('cpf'), rg: txt('rg'),
    telefone: txt('telefone'), tel_comercial: txt('tel_comercial'), celular: txt('celular'),
    spc: flag('spc'), sem_cobranca: flag('sem_cobranca'), nao_receber_msg: flag('nao_receber_msg'),
    situacao_cad: ['ativo', 'analise', 'bloqueado', 'inativo'].includes(String(b.situacao_cad)) ? String(b.situacao_cad) : 'ativo',
    cobranca: ['normal', 'externa', 'telemark'].includes(String(b.cobranca)) ? String(b.cobranca) : 'normal',
    regiao: txt('regiao'), localidade: txt('localidade'),
    cep: txt('cep'), endereco: txt('endereco'), numero: txt('numero'), complemento: txt('complemento'),
    bairro: txt('bairro'), cidade: txt('cidade'), uf: (txt('uf') || '')?.toUpperCase().slice(0, 2) || null,
    observacao: txt('observacao'), email: txt('email'), mae: txt('mae'), pai: txt('pai'), conjuge: txt('conjuge'),
    referencia: txt('referencia'), data_compra: txt('data_compra'),
  };
}
