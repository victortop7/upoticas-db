import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Resumo {
  periodo: { inicio: string; fim: string };
  vendas: { total: number; valor: number; descontos: number };
  os: { total: number; valor_total: number; recebido: number; pendente: number; por_situacao: { situacao: string; n: number }[] };
  top_clientes: { nome: string; compras: number; total: number }[];
  vendas_por_dia: { dia: string; vendas: number; valor: number }[];
  por_vendedor: { vendedor: string; perfil: string; total_vendas: number; valor_total: number; ticket_medio: number; total_desconto: number }[];
}

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

export default function Relatorios() {
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
              { label: 'Faturamento (Vendas)', value: brl(data.vendas.valor), color: '#2563eb', sub: `${data.vendas.total} vendas` },
              { label: 'Descontos', value: brl(data.vendas.descontos), color: '#d97706', sub: 'Total concedido' },
              { label: 'OS — Total', value: brl(data.os.valor_total), color: '#7c3aed', sub: `${data.os.total} ordens` },
              { label: 'OS — Recebido', value: brl(data.os.recebido), color: '#16a34a', sub: `Pendente: ${brl(data.os.pendente)}` },
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

          {/* Por Vendedor */}
          {data.por_vendedor.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Desempenho por Vendedor</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Vendedor', 'Perfil', 'Qtd Vendas', 'Total Vendido', 'Ticket Médio', 'Descontos'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Vendedor' || h === 'Perfil' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.por_vendedor.map((v, i) => (
                    <tr key={i} style={{ borderBottom: i < data.por_vendedor.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)', fontWeight: '600' }}>{v.vendedor}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          background: v.perfil === 'admin' ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)',
                          color: v.perfil === 'admin' ? '#7c3aed' : '#2563eb',
                        }}>
                          {v.perfil === 'admin' ? 'Admin' : v.perfil === 'vendedor' ? 'Vendedor' : 'Caixa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)', textAlign: 'right' }}>{v.total_vendas}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: '#16a34a', textAlign: 'right' }}>{brl(v.valor_total)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: '#2563eb', textAlign: 'right' }}>{brl(v.ticket_medio)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: '#d97706', textAlign: 'right' }}>{brl(v.total_desconto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top clientes */}
          {data.top_clientes.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Top Clientes no Período</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Cliente', 'Compras', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.top_clientes.map((c, i) => (
                    <tr key={i} style={{ borderBottom: i < data.top_clientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-muted)' }}>#{i + 1}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)', fontWeight: '500' }}>{c.nome}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>{c.compras}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>{brl(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
