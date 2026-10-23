import { nomeOrigem } from './origens';
// Definições do relatório personalizado: colunas, seções, resumos e exportação (CSV/XLSX).

export interface VendaRow {
  id: string; numero: number; data: string; situacao: string;
  cliente_id: string; cliente: string; cpf: string;
  vendedor_id: string; vendedor: string; origem?: string;
  os_id: string; os_numero: number | null; grupo_venda_id: string;
  forma: string; valor_bruto: number; desconto: number; valor_final: number;
  recebido: number; saldo: number; doc_original: string;
}
export interface PagRow {
  venda_id: string; numero: number; data_venda: string; cliente: string; vendedor: string;
  forma: string; valor: number; bandeira: string; parcelas: number | string;
  data_recebimento: string; conta: string; origem: string;
}
export interface ItemRow {
  venda_id: string; numero: number | null; produto_id: string; codigo: string; grupo: string; descricao: string;
  qtd: number; unitario: number; desconto: number; total: number;
  custo_unit: number; custo_total: number; margem: number; margem_pct: number | null;
}
export interface DadosRel {
  periodo: { inicio: string; fim: string }; empresa: string; loja: string | null;
  canceladas: { qtd: number; total: number; numeros: number[] };
  vendas: VendaRow[]; pagamentos: PagRow[]; itens: ItemRow[];
}

export type Fmt = 'brl' | 'num' | 'int' | 'data' | 'datahora' | 'pct' | 'text';
export interface Coluna<T> { key: string; label: string; fmt: Fmt; get: (r: T) => string | number | null; padrao?: boolean }

export const FORMA_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', boleto: 'Boleto/carnê',
  outro: 'Outro', misto: 'Misto', a_receber: 'A receber',
};
export const SIT_LABEL: Record<string, string> = { ativa: 'Paga', pendente: 'Pendente', cancelada: 'Cancelada' };
const forma = (f: string) => FORMA_LABEL[f] || f || '';

export const COLS_VENDAS: Coluna<VendaRow>[] = [
  { key: 'numero', label: 'Nº venda', fmt: 'int', get: r => r.numero, padrao: true },
  { key: 'data', label: 'Data/hora', fmt: 'datahora', get: r => r.data, padrao: true },
  { key: 'cliente', label: 'Cliente', fmt: 'text', get: r => r.cliente, padrao: true },
  { key: 'cpf', label: 'CPF cliente', fmt: 'text', get: r => r.cpf },
  { key: 'cliente_id', label: 'ID cliente', fmt: 'text', get: r => r.cliente_id },
  { key: 'vendedor', label: 'Vendedor / usuário', fmt: 'text', get: r => r.vendedor, padrao: true },
  { key: 'vendedor_id', label: 'ID vendedor', fmt: 'text', get: r => r.vendedor_id },
  { key: 'origem', label: 'Origem do cliente', fmt: 'text', get: r => nomeOrigem(r.origem), padrao: true },
  { key: 'forma', label: 'Pagamento', fmt: 'text', get: r => forma(r.forma), padrao: true },
  { key: 'valor_bruto', label: 'Valor bruto', fmt: 'brl', get: r => r.valor_bruto },
  { key: 'desconto', label: 'Desconto', fmt: 'brl', get: r => r.desconto, padrao: true },
  { key: 'valor_final', label: 'Valor final', fmt: 'brl', get: r => r.valor_final, padrao: true },
  { key: 'recebido', label: 'Recebido', fmt: 'brl', get: r => r.recebido },
  { key: 'saldo', label: 'A receber', fmt: 'brl', get: r => r.saldo, padrao: true },
  { key: 'situacao', label: 'Situação', fmt: 'text', get: r => SIT_LABEL[r.situacao] || r.situacao, padrao: true },
  { key: 'os', label: 'OS vinculada', fmt: 'text', get: r => r.os_numero != null ? String(r.os_numero) : '' },
  { key: 'doc_original', label: 'Doc. original (Arcanjo)', fmt: 'text', get: r => r.doc_original },
  { key: 'id', label: 'ID venda', fmt: 'text', get: r => r.id },
];

export const COLS_PAGTOS: Coluna<PagRow>[] = [
  { key: 'numero', label: 'Nº venda', fmt: 'int', get: r => r.numero, padrao: true },
  { key: 'data_venda', label: 'Data venda', fmt: 'data', get: r => r.data_venda, padrao: true },
  { key: 'cliente', label: 'Cliente', fmt: 'text', get: r => r.cliente, padrao: true },
  { key: 'vendedor', label: 'Vendedor', fmt: 'text', get: r => r.vendedor },
  { key: 'forma', label: 'Forma', fmt: 'text', get: r => forma(r.forma), padrao: true },
  { key: 'valor', label: 'Valor', fmt: 'brl', get: r => r.valor, padrao: true },
  { key: 'bandeira', label: 'Bandeira', fmt: 'text', get: r => r.bandeira, padrao: true },
  { key: 'parcelas', label: 'Parcelas', fmt: 'text', get: r => r.parcelas ? String(r.parcelas) : '', padrao: true },
  { key: 'data_recebimento', label: 'Data recebimento', fmt: 'data', get: r => r.data_recebimento, padrao: true },
  { key: 'conta', label: 'Maquininha / conta', fmt: 'text', get: r => r.conta, padrao: true },
  { key: 'origem', label: 'Origem', fmt: 'text', get: r => r.origem },
  { key: 'venda_id', label: 'ID venda', fmt: 'text', get: r => r.venda_id },
];

export const COLS_ITENS: Coluna<ItemRow>[] = [
  { key: 'numero', label: 'Nº venda', fmt: 'int', get: r => r.numero, padrao: true },
  { key: 'codigo', label: 'Código', fmt: 'text', get: r => r.codigo, padrao: true },
  { key: 'grupo', label: 'Grupo', fmt: 'text', get: r => r.grupo, padrao: true },
  { key: 'descricao', label: 'Descrição', fmt: 'text', get: r => r.descricao, padrao: true },
  { key: 'qtd', label: 'Qtd', fmt: 'num', get: r => r.qtd, padrao: true },
  { key: 'unitario', label: 'Unitário', fmt: 'brl', get: r => r.unitario, padrao: true },
  { key: 'desconto', label: 'Desconto', fmt: 'brl', get: r => r.desconto, padrao: true },
  { key: 'total', label: 'Total', fmt: 'brl', get: r => r.total, padrao: true },
  { key: 'custo_unit', label: 'Custo unit.', fmt: 'brl', get: r => r.custo_unit },
  { key: 'custo_total', label: 'Custo total', fmt: 'brl', get: r => r.custo_total, padrao: true },
  { key: 'margem', label: 'Margem R$', fmt: 'brl', get: r => r.margem, padrao: true },
  { key: 'margem_pct', label: 'Margem %', fmt: 'pct', get: r => r.margem_pct, padrao: true },
  { key: 'produto_id', label: 'ID produto', fmt: 'text', get: r => r.produto_id },
  { key: 'venda_id', label: 'ID venda', fmt: 'text', get: r => r.venda_id },
];

export const SECOES = [
  { key: 'resumo_geral', label: 'Resumo geral (totais do período)' },
  { key: 'por_vendedor', label: 'Resumo por vendedor (ticket médio)' },
  { key: 'por_forma', label: 'Resumo por forma de pagamento' },
  { key: 'por_dia', label: 'Resumo por dia' },
  { key: 'vendas', label: 'Lista de vendas' },
  { key: 'pagamentos', label: 'Pagamentos (uma linha por pagamento)' },
  { key: 'itens', label: 'Itens das vendas (item a item, com custo e margem)' },
] as const;
export type SecaoKey = typeof SECOES[number]['key'];

export interface ConfigRel {
  inicio: string; fim: string; vendedor: string; canceladas: boolean;
  secoes: SecaoKey[];
  colsVendas: string[]; colsPagtos: string[]; colsItens: string[];
}

// ─── Resumos ─────────────────────────────────────────────────────────────────
export function calcResumos(d: DadosRel) {
  const ativas = d.vendas.filter(v => v.situacao !== 'cancelada');
  const total = ativas.reduce((s, v) => s + v.valor_final, 0);
  const geral = {
    qtd: ativas.length, total, ticket: ativas.length ? total / ativas.length : 0,
    descontos: ativas.reduce((s, v) => s + v.desconto, 0),
    recebido: ativas.reduce((s, v) => s + v.recebido, 0),
    saldo: ativas.reduce((s, v) => s + v.saldo, 0),
    canceladas: d.canceladas,
  };

  const mv = new Map<string, { vendedor: string; qtd: number; total: number; saldo: number; descontos: number }>();
  for (const v of ativas) {
    const k = v.vendedor_id || v.vendedor;
    if (!mv.has(k)) mv.set(k, { vendedor: v.vendedor || '(sem vendedor)', qtd: 0, total: 0, saldo: 0, descontos: 0 });
    const g = mv.get(k)!; g.qtd++; g.total += v.valor_final; g.saldo += v.saldo; g.descontos += v.desconto;
  }
  const porVendedor = Array.from(mv.values()).map(g => ({ ...g, ticket: g.qtd ? g.total / g.qtd : 0, pct: total ? g.total / total * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  const mf = new Map<string, { forma: string; qtd: number; valor: number }>();
  const idsAtivos = new Set(ativas.map(v => v.id));
  for (const p of d.pagamentos.filter(p => idsAtivos.has(p.venda_id))) {
    if (!mf.has(p.forma)) mf.set(p.forma, { forma: forma(p.forma), qtd: 0, valor: 0 });
    const g = mf.get(p.forma)!; g.qtd++; g.valor += p.valor;
  }
  const totPag = Array.from(mf.values()).reduce((s, g) => s + g.valor, 0);
  const porForma = Array.from(mf.values()).map(g => ({ ...g, pct: totPag ? g.valor / totPag * 100 : 0 })).sort((a, b) => b.valor - a.valor);

  const md = new Map<string, { dia: string; qtd: number; total: number }>();
  for (const v of ativas) {
    const dia = v.data.slice(0, 10);
    if (!md.has(dia)) md.set(dia, { dia, qtd: 0, total: 0 });
    const g = md.get(dia)!; g.qtd++; g.total += v.valor_final;
  }
  const porDia = Array.from(md.values()).sort((a, b) => a.dia.localeCompare(b.dia));

  return { geral, porVendedor, porForma, porDia };
}

// ─── Formatação ──────────────────────────────────────────────────────────────
export const brl = (n: number) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function fmtData(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : s;
}
function fmtDataHora(s: string): string {
  if (!s) return '';
  const dt = new Date(s.includes('T') || s.includes('Z') ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(dt.getTime())) return fmtData(s);
  return dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// Texto pra tela/PDF
export function fmtTela(v: string | number | null, f: Fmt): string {
  if (v === null || v === undefined || v === '') return '';
  switch (f) {
    case 'brl': return brl(Number(v));
    case 'num': return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
    case 'int': return String(v);
    case 'pct': return `${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    case 'data': return fmtData(String(v));
    case 'datahora': return fmtDataHora(String(v));
    default: return String(v);
  }
}

// ─── CSV (padrão Excel pt-BR: ";" e vírgula decimal) ─────────────────────────
function celCSV(v: string | number | null, f: Fmt): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (f === 'brl' || f === 'num' || f === 'pct') s = Number(v).toFixed(f === 'num' ? 3 : 2).replace('.', ',');
  else if (f === 'data') s = fmtData(String(v));
  else if (f === 'datahora') s = fmtDataHora(String(v));
  else s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function gerarCSV<T>(cols: Coluna<T>[], rows: T[]): string {
  const head = cols.map(c => celCSV(c.label, 'text')).join(';');
  const body = rows.map(r => cols.map(c => celCSV(c.get(r), c.fmt)).join(';'));
  return '﻿' + [head, ...body].join('\r\n');
}

export function baixar(conteudo: BlobPart, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── XLSX (uma aba por tabela; números como números) ─────────────────────────
export interface Aba { nome: string; cabecalho: string[]; linhas: (string | number | null)[][]; larguras?: number[] }

export function abaDe<T>(nome: string, cols: Coluna<T>[], rows: T[]): Aba {
  return {
    nome,
    cabecalho: cols.map(c => c.label),
    linhas: rows.map(r => cols.map(c => {
      const v = c.get(r);
      if (v === null || v === undefined || v === '') return null;
      if (c.fmt === 'brl' || c.fmt === 'num' || c.fmt === 'pct') return Number(v);
      if (c.fmt === 'int') return Number(v);
      if (c.fmt === 'data') return fmtData(String(v));
      if (c.fmt === 'datahora') return fmtDataHora(String(v));
      return String(v);
    })),
    larguras: cols.map(c => c.fmt === 'text' ? 22 : c.fmt === 'datahora' ? 17 : 13),
  };
}

export async function baixarXLSX(abas: Aba[], nomeArquivo: string) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const a of abas) {
    const ws = XLSX.utils.aoa_to_sheet([a.cabecalho, ...a.linhas]);
    if (a.larguras) ws['!cols'] = a.larguras.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, a.nome.slice(0, 31));
  }
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  baixar(buf, nomeArquivo, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// ─── Montagem das tabelas a partir da configuração (usada na prévia, PDF e XLSX) ─
export interface Kpi { label: string; valor: number; fmt: Fmt }
export interface TabelaRel {
  key: SecaoKey; titulo: string;
  kpis?: Kpi[];
  cols: { label: string; fmt: Fmt }[];
  linhas: (string | number | null)[][];
  total?: (string | number | null)[];
}

function somaCols(cols: { fmt: Fmt }[], linhas: (string | number | null)[][], rotulo: string): (string | number | null)[] {
  return cols.map((c, i) => {
    if (i === 0) return rotulo;
    if (c.fmt !== 'brl') return null;
    return linhas.reduce((s, l) => s + (Number(l[i]) || 0), 0);
  });
}

function detalhe<T>(key: SecaoKey, titulo: string, defs: Coluna<T>[], escolhidas: string[], rows: T[]): TabelaRel {
  const cols = defs.filter(c => escolhidas.includes(c.key));
  const linhas = rows.map(r => cols.map(c => c.get(r)));
  return { key, titulo, cols: cols.map(c => ({ label: c.label, fmt: c.fmt })), linhas, total: cols.length ? somaCols(cols, linhas, `Total (${rows.length})`) : undefined };
}

export function montarTabelas(d: DadosRel, cfg: ConfigRel): TabelaRel[] {
  const r = calcResumos(d);
  const out: TabelaRel[] = [];
  for (const s of SECOES) {
    if (!cfg.secoes.includes(s.key)) continue;
    if (s.key === 'resumo_geral') {
      out.push({
        key: s.key, titulo: 'Resumo geral', cols: [], linhas: [],
        kpis: [
          { label: 'Total vendido', valor: r.geral.total, fmt: 'brl' },
          { label: 'Nº de vendas', valor: r.geral.qtd, fmt: 'int' },
          { label: 'Ticket médio', valor: r.geral.ticket, fmt: 'brl' },
          { label: 'Descontos', valor: r.geral.descontos, fmt: 'brl' },
          { label: 'Recebido', valor: r.geral.recebido, fmt: 'brl' },
          { label: 'A receber (do período)', valor: r.geral.saldo, fmt: 'brl' },
          { label: 'Canceladas', valor: r.geral.canceladas.qtd, fmt: 'int' },
          { label: 'Valor cancelado', valor: r.geral.canceladas.total, fmt: 'brl' },
        ],
      });
    } else if (s.key === 'por_vendedor') {
      const cols = [
        { label: 'Vendedor', fmt: 'text' as Fmt }, { label: 'Vendas', fmt: 'int' as Fmt }, { label: 'Total', fmt: 'brl' as Fmt },
        { label: 'Ticket médio', fmt: 'brl' as Fmt }, { label: 'Descontos', fmt: 'brl' as Fmt }, { label: 'A receber', fmt: 'brl' as Fmt }, { label: '% do total', fmt: 'pct' as Fmt },
      ];
      const linhas = r.porVendedor.map(v => [v.vendedor, v.qtd, v.total, v.ticket, v.descontos, v.saldo, v.pct]);
      out.push({ key: s.key, titulo: 'Resumo por vendedor', cols, linhas, total: ['Total', r.geral.qtd, r.geral.total, r.geral.ticket, r.geral.descontos, r.geral.saldo, 100] });
    } else if (s.key === 'por_forma') {
      const cols = [{ label: 'Forma', fmt: 'text' as Fmt }, { label: 'Lançamentos', fmt: 'int' as Fmt }, { label: 'Valor', fmt: 'brl' as Fmt }, { label: '% do total', fmt: 'pct' as Fmt }];
      const linhas = r.porForma.map(f => [f.forma, f.qtd, f.valor, f.pct]);
      out.push({ key: s.key, titulo: 'Resumo por forma de pagamento', cols, linhas, total: somaCols(cols, linhas, 'Total') });
    } else if (s.key === 'por_dia') {
      const cols = [{ label: 'Dia', fmt: 'data' as Fmt }, { label: 'Vendas', fmt: 'int' as Fmt }, { label: 'Total', fmt: 'brl' as Fmt }];
      const linhas = r.porDia.map(x => [x.dia, x.qtd, x.total]);
      out.push({ key: s.key, titulo: 'Resumo por dia', cols, linhas, total: ['Total', r.geral.qtd, r.geral.total] });
    } else if (s.key === 'vendas') {
      out.push(detalhe(s.key, 'Vendas', COLS_VENDAS, cfg.colsVendas, d.vendas));
    } else if (s.key === 'pagamentos') {
      out.push(detalhe(s.key, 'Pagamentos (uma linha por pagamento)', COLS_PAGTOS, cfg.colsPagtos, d.pagamentos));
    } else if (s.key === 'itens') {
      out.push(detalhe(s.key, 'Itens das vendas', COLS_ITENS, cfg.colsItens, d.itens));
    }
  }
  return out;
}

// Converte as tabelas montadas em abas de planilha
export function abasDasTabelas(tabs: TabelaRel[]): Aba[] {
  return tabs.map(t => {
    if (t.kpis) return { nome: t.titulo, cabecalho: ['Indicador', 'Valor'], linhas: t.kpis.map(k => [k.label, k.valor]), larguras: [26, 16] };
    const conv = (row: (string | number | null)[]) => row.map((v, i) => {
      const f = t.cols[i]?.fmt;
      if (v === null || v === undefined || v === '') return null;
      if (f === 'brl' || f === 'num' || f === 'pct' || f === 'int') return typeof v === 'number' ? v : (Number(v) || v);
      if (f === 'data') return fmtData(String(v));
      if (f === 'datahora') return fmtTela(v, 'datahora');
      return String(v);
    });
    const linhas = t.linhas.map(conv);
    if (t.total) linhas.push(conv(t.total));
    return { nome: t.titulo.replace(/[\/?*[\]:]/g, '').slice(0, 31), cabecalho: t.cols.map(c => c.label), linhas, larguras: t.cols.map(c => c.fmt === 'text' ? 24 : c.fmt === 'datahora' ? 17 : 13) };
  });
}

export const CFG_PADRAO = (): ConfigRel => {
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth(), 1);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    inicio: iso(ini), fim: iso(h), vendedor: '', canceladas: false,
    secoes: ['resumo_geral', 'por_vendedor', 'por_forma', 'vendas', 'pagamentos'],
    colsVendas: COLS_VENDAS.filter(c => c.padrao).map(c => c.key),
    colsPagtos: COLS_PAGTOS.filter(c => c.padrao).map(c => c.key),
    colsItens: COLS_ITENS.filter(c => c.padrao).map(c => c.key),
  };
};
