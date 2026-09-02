import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Resumo {
  periodo: { inicio: string; fim: string };
  vendas: { total: number; valor: number; descontos: number; recebido: number; a_receber: number };
  a_receber_geral: { total: number; qtd: number };
  os: { total: number; valor_total: number; recebido: number; pendente: number; por_situacao: { situacao: string; n: number }[] };
  top_clientes: { nome: string; compras: number; total: number; a_receber: number }[];
  vendas_por_dia: { dia: string; vendas: number; valor: number }[];
  por_vendedor: { funcionario_id: string; vendedor: string; perfil: string; total_vendas: number; valor_total: number; ticket_medio: number; total_desconto: number; a_receber: number }[];
}

interface VendaVendedor {
  id: string; numero: number; created_at: string; valor_final: number; desconto: number;
  valor_entrada: number; saldo_restante: number; situacao: string; forma_pagamento?: string; cliente_nome?: string;
}
interface VendedorDetalhe {
  vendedor: { id: string; nome: string; perfil: string };
  periodo: { inicio: string; fim: string };
  vendas: VendaVendedor[];
  totais: { qtd: number; total_vendido: number; descontos: number; a_receber: number; recebido: number };
  regras: Record<string, number>;
}

const FORMAS_PAG = [
  { key: 'dinheiro', label: 'Dinheiro' },
  { key: 'pix', label: 'Pix' },
  { key: 'credito', label: 'Crédito' },
  { key: 'debito', label: 'Débito' },
  { key: 'boleto', label: 'Boleto' },
  { key: 'outro', label: 'Outro' },
];
const FORMA_LABEL: Record<string, string> = Object.fromEntries(FORMAS_PAG.map(f => [f.key, f.label]));

const SITUACAO_LABEL: Record<string, string> = {
  orcamento: 'Orçamento', aprovado: 'Aprovado', em_producao: 'Em Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; }

function getPeriodo(tipo: string): { inicio: string; fim: string } {
  const hoje = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  if (tipo === 'hoje') return { inicio: fmt(hoje), fim: fmt(hoje) };
  if (tipo === '7d') { const d = new Date(hoje); d.setDate(d.getDate()-6); return { inicio: fmt(d), fim: fmt(hoje) }; }
  if (tipo === '30d') { const d = new Date(hoje); d.setDate(d.getDate()-29); return { inicio: fmt(d), fim: fmt(hoje) }; }
  if (tipo === 'mes') return { inicio: `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-01`, fim: fmt(hoje) };
  if (tipo === 'mes_ant') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return { inicio: fmt(d), fim: fmt(fim) };
  }
  return { inicio: `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-01`, fim: fmt(hoje) };
}

const SIT_COR: Record<string, { bg: string; cor: string; label: string }> = {
  ativa: { bg: 'rgba(34,197,94,0.12)', cor: '#16a34a', label: 'Ativa' },
  pendente: { bg: 'rgba(245,158,11,0.14)', cor: '#d97706', label: 'Pendente' },
  cancelada: { bg: 'rgba(239,68,68,0.12)', cor: '#dc2626', label: 'Cancelada' },
};

function VendedorModal({ funcionarioId, nome, inicio, fim, isAdmin, onClose }: {
  funcionarioId: string; nome: string; inicio: string; fim: string; isAdmin: boolean; onClose: () => void;
}) {
  const [det, setDet] = useState<VendedorDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [regras, setRegras] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<VendedorDetalhe>(`/relatorios/vendedor?funcionario_id=${funcionarioId}&inicio=${inicio}&fim=${fim}`)
      .then(r => {
        setDet(r);
        // Se ainda não tem tabela salva, sugere: à vista 5% / cartão 2,5%
        const temRegras = r.regras && Object.keys(r.regras).length > 0;
        setRegras(temRegras ? r.regras : { dinheiro: 5, pix: 5, credito: 2.5, debito: 2.5, boleto: 5 });
      })
      .catch(() => setDet(null))
      .finally(() => setLoading(false));
  }, [funcionarioId, inicio, fim]);

  // Base por forma de pagamento (formas desconhecidas caem em "outro")
  const baseByForma: Record<string, number> = {};
  (det?.vendas || []).forEach(v => {
    const k = FORMA_LABEL[v.forma_pagamento || ''] ? (v.forma_pagamento as string) : 'outro';
    baseByForma[k] = (baseByForma[k] || 0) + (v.valor_final || 0);
  });
  const linhas = FORMAS_PAG.map(f => {
    const base = baseByForma[f.key] || 0;
    const pctF = Number(regras[f.key]) || 0;
    return { ...f, base, pct: pctF, comissao: base * pctF / 100 };
  });
  const comissaoTotal = linhas.reduce((a, l) => a + l.comissao, 0);
  const totalBase = det?.totais.total_vendido || 0;

  function setPctForma(k: string, val: string) {
    setRegras(r => ({ ...r, [k]: parseFloat(val) || 0 }));
  }
  async function salvarRegras() {
    setSalvando(true); setSalvo(false);
    try {
      await api.post('/relatorios/vendedor', { regras });
      setSalvo(true); setTimeout(() => setSalvo(false), 2500);
    } catch {}
    setSalvando(false);
  }

  const th: React.CSSProperties = { padding: '9px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)', position: 'sticky', top: 0 };
  const td: React.CSSProperties = { padding: '10px 14px', fontSize: '13px', color: 'var(--text)' };
  const tdMono: React.CSSProperties = { ...td, fontFamily: 'var(--mono)', textAlign: 'right' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{nome}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Vendas de {fmtDate(inicio)} a {fmtDate(fim)}</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</div>
        ) : !det ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Não foi possível carregar.</div>
        ) : (
          <>
            {/* Comissão por forma de pagamento (tabela da loja) */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Comissão por forma de pagamento {isAdmin && <span style={{ textTransform: 'none', color: 'var(--text-dim)', fontWeight: 400 }}>· % vale pra loja toda</span>}
                </div>
                {isAdmin && (
                  <button onClick={salvarRegras} disabled={salvando} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: salvo ? 'var(--green)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer' }}>
                    {salvando ? '...' : salvo ? '✓ Salvo' : 'Salvar %'}
                  </button>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
                  <thead><tr>
                    <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, padding: '4px 8px' }}>Forma</th>
                    <th style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, padding: '4px 8px' }}>Vendido</th>
                    <th style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, padding: '4px 8px' }}>%</th>
                    <th style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, padding: '4px 8px' }}>Comissão</th>
                  </tr></thead>
                  <tbody>
                    {linhas.filter(l => l.base > 0 || isAdmin).map(l => (
                      <tr key={l.key}>
                        <td style={{ padding: '6px 8px', fontSize: '13px', color: 'var(--text)' }}>{l.label}</td>
                        <td style={{ padding: '6px 8px', fontSize: '13px', fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--text-dim)' }}>{brl(l.base)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input type="number" step="0.1" min="0" disabled={!isAdmin}
                            value={regras[l.key] ?? ''} onChange={e => setPctForma(l.key, e.target.value)}
                            style={{ width: '64px', padding: '5px 7px', fontSize: '13px', fontFamily: 'var(--mono)', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none' }}
                            placeholder="0" />
                        </td>
                        <td style={{ padding: '6px 8px', fontSize: '13px', fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', color: '#16a34a' }}>{brl(l.comissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td style={{ padding: '9px 8px', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Total ({det.totais.qtd} vendas)</td>
                      <td style={{ padding: '9px 8px', fontSize: '13px', fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{brl(totalBase)}</td>
                      <td></td>
                      <td style={{ padding: '9px 8px', fontSize: '16px', fontFamily: 'var(--mono)', fontWeight: 800, textAlign: 'right', color: 'var(--primary)' }}>{brl(comissaoTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Lista de vendas */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {det.vendas.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma venda neste período.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={{ ...th, textAlign: 'left' }}>Nº</th>
                    <th style={{ ...th, textAlign: 'left' }}>Cliente</th>
                    <th style={{ ...th, textAlign: 'left' }}>Data</th>
                    <th style={{ ...th, textAlign: 'right' }}>Valor</th>
                    <th style={{ ...th, textAlign: 'right' }}>A Receber</th>
                    <th style={{ ...th, textAlign: 'left' }}>Situação</th>
                  </tr></thead>
                  <tbody>
                    {det.vendas.map((v, i) => {
                      const sc = SIT_COR[v.situacao] || SIT_COR.ativa;
                      return (
                        <tr key={v.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ ...tdMono, textAlign: 'left', color: 'var(--primary)', fontWeight: 700 }}>#{String(v.numero).padStart(4, '0')}</td>
                          <td style={td}>{v.cliente_nome || '—'}</td>
                          <td style={{ ...tdMono, textAlign: 'left', color: 'var(--text-dim)' }}>{fmtDate(v.created_at.split('T')[0])}</td>
                          <td style={{ ...tdMono, fontWeight: 700 }}>{brl(v.valor_final)}</td>
                          <td style={{ ...tdMono, color: v.saldo_restante > 0 ? '#dc2626' : 'var(--text-muted)' }}>{v.saldo_restante > 0 ? brl(v.saldo_restante) : '—'}</td>
                          <td style={td}><span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.cor }}>{sc.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé — salvar tabela de comissão (bem visível) */}
            {isAdmin && (
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Comissão do período: <b style={{ color: 'var(--primary)', fontFamily: 'var(--mono)', fontSize: '15px' }}>{brl(comissaoTotal)}</b></span>
                <button onClick={salvarRegras} disabled={salvando} style={{ padding: '11px 26px', fontSize: '14px', fontWeight: 700, background: salvo ? 'var(--green)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  {salvando ? 'Salvando...' : salvo ? '✓ Comissão salva!' : '💾 Salvar tabela de comissão'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Relatorios() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'admin';
  const [vendedorSel, setVendedorSel] = useState<{ id: string; nome: string } | null>(null);
  const [tipoPeriodo, setTipoPeriodo] = useState('mes');
  const [custom, setCustom] = useState({ inicio: '', fim: '' });
  const [data, setData] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { buscar(); }, [tipoPeriodo]);

  async function buscar() {
    setLoading(true);
    try {
      const p = tipoPeriodo === 'custom' ? custom : getPeriodo(tipoPeriodo);
      if (!p.inicio || !p.fim) return;
      const res = await api.get<Resumo>(`/relatorios/resumo?inicio=${p.inicio}&fim=${p.fim}`);
      setData(res);
    } finally { setLoading(false); }
  }

  const PERIODOS = [
    { key: 'hoje', label: 'Hoje' },
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: 'mes', label: 'Este mês' },
    { key: 'mes_ant', label: 'Mês passado' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', fontSize: '13px', fontWeight: '500',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: '20px', cursor: 'pointer',
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? 'white' : 'var(--text-dim)',
  });

  const maxVenda = Math.max(...(data?.vendas_por_dia.map(d => d.valor) || [1]), 1);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Relatórios</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>
          {data ? `${fmtDate(data.periodo.inicio)} — ${fmtDate(data.periodo.fim)}` : 'Selecione um período'}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        {PERIODOS.map(p => (
          <button key={p.key} style={filterBtn(tipoPeriodo === p.key)} onClick={() => setTipoPeriodo(p.key)}>{p.label}</button>
        ))}
      </div>
      {tipoPeriodo === 'custom' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input type="date" value={custom.inicio} onChange={e => setCustom(c => ({ ...c, inicio: e.target.value }))}
            style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--mono)' }} />
          <span style={{ color: 'var(--text-muted)' }}>até</span>
          <input type="date" value={custom.fim} onChange={e => setCustom(c => ({ ...c, fim: e.target.value }))}
            style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--mono)' }} />
          <button onClick={buscar} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Buscar</button>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</p>}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Faturamento (Vendas)', value: brl(data.vendas.valor), color: '#2563eb', sub: `${data.vendas.total} vendas • já pago ${brl(data.vendas.recebido)}` },
              { label: 'A Receber (Vendas)', value: brl(data.a_receber_geral.total), color: '#dc2626', sub: `${data.a_receber_geral.qtd} venda(s) em aberto` },
              { label: 'Descontos', value: brl(data.vendas.descontos), color: '#d97706', sub: 'Total concedido' },
              { label: 'OS — Recebido', value: brl(data.os.recebido), color: '#16a34a', sub: `OS pendente: ${brl(data.os.pendente)}` },
            ].map((card, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
                <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: card.color, fontFamily: 'var(--mono)' }}>{card.value}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{card.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Gráfico de barras vendas por dia */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Vendas por Dia</h3>
              {data.vendas_por_dia.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sem vendas no período</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                  {data.vendas_por_dia.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <div title={`${fmtDate(d.dia)}: ${brl(d.valor)}`} style={{
                        width: '100%', background: 'var(--primary)',
                        borderRadius: '4px 4px 0 0',
                        height: `${Math.max(4, (d.valor / maxVenda) * 100)}px`,
                        opacity: 0.85, cursor: 'default', transition: 'opacity 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OS por situação */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>OS por Situação</h3>
              {data.os.por_situacao.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sem OS no período</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.os.por_situacao.map(s => {
                    const pct = data.os.total > 0 ? Math.round((s.n / data.os.total) * 100) : 0;
                    return (
                      <div key={s.situacao}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{SITUACAO_LABEL[s.situacao] || s.situacao}</span>
                          <span style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{s.n} ({pct}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--surface-alt)', borderRadius: '3px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Por Vendedor — separado por perfil */}
          {(() => {
            const vendedores = data.por_vendedor.filter(v => v.perfil !== 'marketing');
            const marketing  = data.por_vendedor.filter(v => v.perfil === 'marketing');

            const tabelaRows = (lista: typeof data.por_vendedor, colunas: string[]) => (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {colunas.map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Nome' || h === 'Perfil' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((v, i) => (
                    <tr key={i} style={{ borderBottom: i < lista.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onClick={() => v.funcionario_id && setVendedorSel({ id: v.funcionario_id, nome: v.vendedor })}
                      title="Ver vendas e comissão"
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)', fontWeight: '600' }}>{v.vendedor}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          background: v.perfil === 'admin' ? 'rgba(124,58,237,0.1)' : v.perfil === 'marketing' ? 'rgba(236,72,153,0.1)' : 'rgba(37,99,235,0.1)',
                          color: v.perfil === 'admin' ? '#7c3aed' : v.perfil === 'marketing' ? '#db2777' : '#2563eb',
                        }}>
                          {v.perfil === 'admin' ? 'Admin' : v.perfil === 'vendedor' ? 'Vendedor' : v.perfil === 'marketing' ? 'Marketing' : 'Caixa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)', textAlign: 'right' }}>{v.total_vendas}</td>
                      {v.perfil !== 'marketing' && <>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: '#16a34a', textAlign: 'right' }}>{brl(v.valor_total)}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: '#2563eb', textAlign: 'right' }}>{brl(v.ticket_medio)}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: '#d97706', textAlign: 'right' }}>{brl(v.total_desconto)}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: v.a_receber > 0 ? '#dc2626' : 'var(--text-muted)', textAlign: 'right' }}>{v.a_receber > 0 ? brl(v.a_receber) : '—'}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            );

            return (
              <>
                {vendedores.length > 0 && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>🛒</span>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Desempenho — Vendas</h3>
                    </div>
                    {tabelaRows(vendedores, ['Nome', 'Perfil', 'Qtd Vendas', 'Total Vendido', 'Ticket Médio', 'Descontos', 'A Receber'])}
                  </div>
                )}
                {marketing.length > 0 && (
                  <div style={{ background: 'var(--surface)', border: '1px solid rgba(236,72,153,0.25)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>📢</span>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Desempenho — Marketing</h3>
                      <span style={{ fontSize: '12px', color: '#db2777', marginLeft: '4px' }}>apenas contagem</span>
                    </div>
                    {tabelaRows(marketing, ['Nome', 'Perfil', 'Qtd Vendas Atribuídas'])}
                  </div>
                )}
              </>
            );
          })()}

          {/* Top clientes */}
          {data.top_clientes.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Clientes que compraram no período</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{data.top_clientes.length} cliente(s) • ordenado por total gasto</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Cliente', 'Compras', 'Total', 'A Receber'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Cliente' ? 'left' : h === '#' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.top_clientes.map((c, i) => (
                    <tr key={i} style={{ borderBottom: i < data.top_clientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-muted)' }}>#{i + 1}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{c.nome}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)', textAlign: 'right' }}>{c.compras}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: '#2563eb', textAlign: 'right' }}>{brl(c.total)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: c.a_receber > 0 ? '#dc2626' : 'var(--text-muted)', textAlign: 'right' }}>{c.a_receber > 0 ? brl(c.a_receber) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}

      {vendedorSel && data && (
        <VendedorModal
          funcionarioId={vendedorSel.id}
          nome={vendedorSel.nome}
          inicio={data.periodo.inicio}
          fim={data.periodo.fim}
          isAdmin={isAdmin}
          onClose={() => setVendedorSel(null)}
        />
      )}
    </div>
  );
}
