import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface FluxoResp {
  periodo: { inicio: string; fim: string };
  resumo: { receitas: number; despesas: number; resultado: number };
  receitas_por_dia: { dia: string; valor: number }[];
  despesas_por_dia: { dia: string; valor: number }[];
}

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const [,m,d] = s.split('-'); return `${d}/${m}`; }

function getPeriodo(tipo: string) {
  const hoje = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
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

export default function FluxoFinanceiro() {
  const [tipo, setTipo] = useState('mes');
  const [custom, setCustom] = useState({ inicio: '', fim: '' });
  const [data, setData] = useState<FluxoResp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { buscar(); }, [tipo]);

  async function buscar() {
    setLoading(true);
    try {
      const p = tipo === 'custom' ? custom : getPeriodo(tipo);
      if (!p.inicio || !p.fim) return;
      const res = await api.get<FluxoResp>(`/financeiro/fluxo?inicio=${p.inicio}&fim=${p.fim}`);
      setData(res);
    } finally { setLoading(false); }
  }

  const PERIODOS = [
    { key: '7d', label: '7 dias' }, { key: '30d', label: '30 dias' },
    { key: 'mes', label: 'Este mês' }, { key: 'mes_ant', label: 'Mês passado' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '7px 14px', fontSize: '13px', fontWeight: '500', border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text-dim)' });

  // Merge dias
  const allDias = Array.from(new Set([
    ...(data?.receitas_por_dia.map(d => d.dia) || []),
    ...(data?.despesas_por_dia.map(d => d.dia) || []),
  ])).sort();

  const recMap = Object.fromEntries((data?.receitas_por_dia || []).map(d => [d.dia, d.valor]));
  const despMap = Object.fromEntries((data?.despesas_por_dia || []).map(d => [d.dia, d.valor]));
  const maxVal = Math.max(...allDias.map(d => Math.max(recMap[d] || 0, despMap[d] || 0)), 1);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Fluxo Financeiro</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Receitas x Despesas por período</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {PERIODOS.map(p => <button key={p.key} style={filterBtn(tipo === p.key)} onClick={() => setTipo(p.key)}>{p.label}</button>)}
      </div>

      {tipo === 'custom' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input type="date" value={custom.inicio} onChange={e => setCustom(c => ({ ...c, inicio: e.target.value }))} style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--mono)' }} />
          <span style={{ color: 'var(--text-muted)' }}>até</span>
          <input type="date" value={custom.fim} onChange={e => setCustom(c => ({ ...c, fim: e.target.value }))} style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--mono)' }} />
          <button onClick={buscar} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Buscar</button>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</p>}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Receitas', value: brl(data.resumo.receitas), color: '#16a34a' },
              { label: 'Despesas', value: brl(data.resumo.despesas), color: '#dc2626' },
              { label: 'Resultado', value: brl(data.resumo.resultado), color: data.resumo.resultado >= 0 ? '#16a34a' : '#dc2626' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', fontFamily: 'var(--mono)', color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          {allDias.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Evolução diária</h3>
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                  {[['#16a34a', 'Receitas'], ['#dc2626', 'Despesas']].map(([color, label]) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-dim)' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, display: 'inline-block' }} />{label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', overflowX: 'auto' }}>
                {allDias.map((dia, i) => (
                  <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: allDias.length > 20 ? '20px' : '32px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '130px' }}>
                      <div title={`Receita: ${brl(recMap[dia] || 0)}`} style={{ width: '10px', background: '#16a34a', borderRadius: '3px 3px 0 0', height: `${Math.max(2, ((recMap[dia] || 0) / maxVal) * 120)}px`, opacity: 0.85 }} />
                      <div title={`Despesa: ${brl(despMap[dia] || 0)}`} style={{ width: '10px', background: '#dc2626', borderRadius: '3px 3px 0 0', height: `${Math.max(2, ((despMap[dia] || 0) / maxVal) * 120)}px`, opacity: 0.85 }} />
                    </div>
                    {(i === 0 || i === allDias.length - 1 || i % Math.ceil(allDias.length / 6) === 0) && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{fmtDate(dia)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {allDias.length === 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nenhuma movimentação no período selecionado.
            </div>
          )}
        </>
      )}
    </div>
  );
}
