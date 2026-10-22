import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

interface Venda { numero: number; data: string; cliente: string; forma: string; valor: number; situacao: string; saldo: number; }
interface Vendedor { funcionario_id: string; vendedor: string; perfil: string; vendas: Venda[]; qtd: number; total: number; descontos: number; a_receber: number; ticket_medio: number; }
interface Dados {
  periodo: { inicio: string; fim: string }; loja: string | null; empresa: string;
  por_vendedor: Vendedor[]; geral: { total: number; qtd: number; ticket_medio: number };
}

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (s?: string) => { if (!s) return '-'; const d = s.split('T')[0].split('-'); return `${d[2]}/${d[1]}/${d[0]}`; };
const FORMA: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', boleto: 'Boleto', outro: 'Outro' };

const CSS = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rel { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1d23; font-size: 11px; }
  .num { font-variant-numeric: tabular-nums; font-family: 'Segoe UI', system-ui, sans-serif; }
  .hdr { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; border-bottom: 3px solid #16a34a; margin-bottom: 14px; }
  .hdr h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
  .hdr .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .hdr .per { text-align: right; font-size: 11px; color: #374151; }
  .hdr .per b { display: block; font-size: 13px; color: #111; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; background: #f9fafb; }
  .kpi .l { font-size: 9px; text-transform: uppercase; letter-spacing: .6px; color: #6b7280; font-weight: 600; }
  .kpi .v { font-size: 16px; font-weight: 800; margin-top: 2px; }
  .kpi.main { background: #f0fdf4; border-color: #bbf7d0; }
  .kpi.main .v { color: #15803d; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: #374151; margin: 0 0 6px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; font-weight: 700; padding: 5px 6px; border-bottom: 1.5px solid #d1d5db; background: #f3f4f6; }
  td { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  tbody tr:nth-child(even) td { background: #fafafa; }
  .r { text-align: right; }
  .resumo td { padding: 6px; font-size: 11.5px; }
  .bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; width: 80px; display: inline-block; vertical-align: middle; margin-right: 6px; }
  .bar i { display: block; height: 100%; background: #16a34a; }
  .vsec { margin-top: 16px; }
  .vhead { display: flex; justify-content: space-between; align-items: center; background: #1f2937; color: #fff; padding: 6px 10px; border-radius: 5px 5px 0 0; break-after: avoid; page-break-after: avoid; }
  .vhead .n { font-size: 12.5px; font-weight: 700; }
  .vhead .s { font-size: 10.5px; opacity: .9; }
  .vhead .s b { color: #86efac; }
  .pill { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 9.5px; font-weight: 600; white-space: nowrap; }
  .p-ok { background: #dcfce7; color: #166534; }
  .p-pen { background: #fef3c7; color: #92400e; }
  .sub td { background: #f3f4f6 !important; font-weight: 700; border-top: 1.5px solid #d1d5db; }
  .foot { margin-top: 14px; font-size: 9px; color: #9ca3af; text-align: right; }
  @media print { .no-print { display: none !important; } body { background: #fff; } }
`;

export default function RelatorioImprimir() {
  const [sp] = useSearchParams();
  const [d, setD] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Dados>(`/relatorios/export?inicio=${sp.get('inicio') || ''}&fim=${sp.get('fim') || ''}`)
      .then(setD).catch(() => setD(null)).finally(() => setLoading(false));
  }, [sp]);

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Gerando relatório…</div>;
  if (!d) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Não foi possível carregar.</div>;

  const maxTotal = Math.max(...d.por_vendedor.map(v => v.total), 1);

  return (
    <div style={{ background: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS}</style>

      <div className="no-print" style={{ position: 'sticky', top: 0, background: '#111827', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'system-ui', fontSize: 14 }}>Relatório de Vendas por Vendedor</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: 11.5, fontFamily: 'system-ui' }}>Dica: na impressão, desmarque “Cabeçalhos e rodapés”</span>
          <button onClick={() => window.print()} style={{ padding: '8px 18px', fontSize: 13.5, fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Imprimir / Salvar PDF</button>
        </div>
      </div>

      {/* Folha A4 */}
      <div className="rel" style={{ background: '#fff', maxWidth: 794, margin: '20px auto', padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}>
        <div className="hdr">
          <div>
            <h1>{d.empresa}</h1>
            <div className="sub">Relatório de Vendas por Vendedor{d.loja ? ` · Loja ${d.loja}` : ''}</div>
          </div>
          <div className="per">
            Período
            <b>{fmtData(d.periodo.inicio)} a {fmtData(d.periodo.fim)}</b>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi main"><div className="l">Total vendido</div><div className="v num">{brl(d.geral.total)}</div></div>
          <div className="kpi"><div className="l">Nº de vendas</div><div className="v num">{d.geral.qtd}</div></div>
          <div className="kpi"><div className="l">Ticket médio</div><div className="v num">{brl(d.geral.ticket_medio)}</div></div>
          <div className="kpi"><div className="l">Vendedores</div><div className="v num">{d.por_vendedor.length}</div></div>
        </div>

        {/* Resumo por vendedor · ocupa a página 1 com o que importa */}
        <h2>Resumo por vendedor</h2>
        <table className="resumo">
          <thead><tr>
            <th>Vendedor</th><th className="r">Vendas</th><th className="r">Total</th>
            <th className="r">Ticket médio</th><th className="r">A receber</th><th>Participação</th>
          </tr></thead>
          <tbody>
            {d.por_vendedor.map(v => {
              const pct = d.geral.total ? (v.total / d.geral.total) * 100 : 0;
              return (
                <tr key={v.funcionario_id}>
                  <td style={{ fontWeight: 600 }}>{v.vendedor}</td>
                  <td className="r num">{v.qtd}</td>
                  <td className="r num" style={{ fontWeight: 700 }}>{brl(v.total)}</td>
                  <td className="r num">{brl(v.ticket_medio)}</td>
                  <td className="r num" style={{ color: v.a_receber > 0 ? '#b45309' : '#9ca3af' }}>{v.a_receber > 0 ? brl(v.a_receber) : '-'}</td>
                  <td className="num"><span className="bar"><i style={{ width: `${(v.total / maxTotal) * 100}%` }} /></span>{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Detalhamento · flui entre as páginas sem deixar buraco */}
        <h2 style={{ marginTop: 20 }}>Detalhamento das vendas</h2>
        {d.por_vendedor.length === 0 && <div style={{ color: '#6b7280', padding: 12 }}>Nenhuma venda no período.</div>}
        {d.por_vendedor.map(v => (
          <div key={v.funcionario_id} className="vsec">
            <div className="vhead">
              <span className="n">{v.vendedor}</span>
              <span className="s num">{v.qtd} vendas · Total <b>{brl(v.total)}</b> · Ticket médio <b>{brl(v.ticket_medio)}</b></span>
            </div>
            <table>
              <thead><tr>
                <th style={{ width: 52 }}>Nº</th><th style={{ width: 72 }}>Data</th><th>Cliente</th>
                <th style={{ width: 70 }}>Pagamento</th><th className="r" style={{ width: 90 }}>Valor</th><th style={{ width: 110 }}>Situação</th>
              </tr></thead>
              <tbody>
                {v.vendas.map((s, i) => (
                  <tr key={i}>
                    <td className="num" style={{ fontWeight: 600, color: '#374151' }}>#{String(s.numero).padStart(4, '0')}</td>
                    <td className="num">{fmtData(s.data)}</td>
                    <td>{s.cliente}</td>
                    <td>{FORMA[s.forma] || s.forma}</td>
                    <td className="r num" style={{ fontWeight: 600 }}>{brl(s.valor)}</td>
                    <td>{s.saldo > 0
                      ? <span className="pill p-pen">Falta {brl(s.saldo)}</span>
                      : <span className="pill p-ok">Paga</span>}</td>
                  </tr>
                ))}
                <tr className="sub">
                  <td colSpan={4}>Subtotal {v.vendedor}{v.descontos > 0 ? ` · descontos ${brl(v.descontos)}` : ''}</td>
                  <td className="r num">{brl(v.total)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <div className="foot">Gerado em {new Date().toLocaleString('pt-BR')} · Connect Óticas</div>
      </div>
    </div>
  );
}
