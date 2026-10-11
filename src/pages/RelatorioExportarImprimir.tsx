import { useState } from 'react';
import { type DadosRel, type ConfigRel, type TabelaRel, montarTabelas, fmtTela, fmtData } from '../lib/relatorioExport';

const CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rx { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1d23; font-size: 10.5px; }
  .rx .num { font-variant-numeric: tabular-nums; }
  .rx .hdr { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; border-bottom: 3px solid #16a34a; margin-bottom: 14px; }
  .rx .hdr h1 { margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.3px; }
  .rx .hdr .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .rx .hdr .per { text-align: right; font-size: 11px; color: #374151; }
  .rx .hdr .per b { display: block; font-size: 13px; color: #111; }
  .rx .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
  .rx .kpi { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 9px; background: #f9fafb; }
  .rx .kpi .l { font-size: 8.5px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; font-weight: 600; }
  .rx .kpi .v { font-size: 14px; font-weight: 800; margin-top: 2px; }
  .rx .kpi:first-child { background: #f0fdf4; border-color: #bbf7d0; }
  .rx .kpi:first-child .v { color: #15803d; }
  .rx .sec { margin-top: 16px; }
  .rx h2 { font-size: 11.5px; text-transform: uppercase; letter-spacing: .7px; color: #fff; background: #1f2937; margin: 0; padding: 6px 10px; border-radius: 5px 5px 0 0; font-weight: 700; break-after: avoid; page-break-after: avoid; }
  .rx table { width: 100%; border-collapse: collapse; }
  .rx thead { display: table-header-group; }
  .rx tr { page-break-inside: avoid; break-inside: avoid; }
  .rx th { font-size: 8.5px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; font-weight: 700; padding: 5px 5px; border-bottom: 1.5px solid #d1d5db; background: #f3f4f6; white-space: nowrap; }
  .rx td { padding: 3.5px 5px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .rx tbody tr:nth-child(even) td { background: #fafafa; }
  .rx .tot td { background: #f3f4f6 !important; font-weight: 700; border-top: 1.5px solid #d1d5db; }
  .rx .r { text-align: right; white-space: nowrap; }
  .rx .foot { margin-top: 14px; font-size: 8.5px; color: #9ca3af; text-align: right; }
  @media print { .no-print { display: none !important; } body { background: #fff; } .folha { box-shadow: none !important; margin: 0 !important; max-width: none !important; } }
`;

const direita = (f: string) => f === 'brl' || f === 'num' || f === 'int' || f === 'pct';

function Tabela({ t }: { t: TabelaRel }) {
  if (t.kpis) {
    return (
      <div className="kpis" style={{ marginTop: 6 }}>
        {t.kpis.map(k => (
          <div key={k.label} className="kpi"><div className="l">{k.label}</div><div className="v num">{fmtTela(k.valor, k.fmt)}</div></div>
        ))}
      </div>
    );
  }
  return (
    <table>
      <thead><tr>{t.cols.map(c => <th key={c.label} className={direita(c.fmt) ? 'r' : ''} style={{ textAlign: direita(c.fmt) ? 'right' : 'left' }}>{c.label}</th>)}</tr></thead>
      <tbody>
        {t.linhas.map((l, i) => (
          <tr key={i}>{l.map((v, j) => <td key={j} className={direita(t.cols[j].fmt) ? 'r num' : ''}>{fmtTela(v, t.cols[j].fmt)}</td>)}</tr>
        ))}
        {t.total && (
          <tr className="tot">{t.total.map((v, j) => <td key={j} className={direita(t.cols[j].fmt) ? 'r num' : ''}>{j === 0 ? String(v ?? '') : fmtTela(v, t.cols[j].fmt)}</td>)}</tr>
        )}
      </tbody>
    </table>
  );
}

export default function RelatorioExportarImprimir() {
  const [payload] = useState<{ cfg: ConfigRel; dados: DadosRel } | null>(() => {
    try { const s = localStorage.getItem('rel_export_payload'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const tabelas = payload ? montarTabelas(payload.dados, payload.cfg) : [];
  const muitasColunas = tabelas.some(t => t.cols.length > 8);
  const [paisagem, setPaisagem] = useState(muitasColunas);

  if (!payload) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Nada para imprimir. Gere o relatório em “Relatório personalizado” e clique em PDF.</div>;
  const { dados } = payload;

  return (
    <div style={{ background: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS + `@page { size: A4 ${paisagem ? 'landscape' : 'portrait'}; margin: 9mm; }`}</style>

      <div className="no-print" style={{ position: 'sticky', top: 0, background: '#111827', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, fontFamily: 'system-ui' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Relatório personalizado</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>Folha:</span>
          <button onClick={() => setPaisagem(false)} style={{ padding: '6px 12px', fontSize: 12.5, borderRadius: 6, border: '1px solid #374151', cursor: 'pointer', background: !paisagem ? '#374151' : 'transparent', color: '#fff' }}>Em pé</button>
          <button onClick={() => setPaisagem(true)} style={{ padding: '6px 12px', fontSize: 12.5, borderRadius: 6, border: '1px solid #374151', cursor: 'pointer', background: paisagem ? '#374151' : 'transparent', color: '#fff' }}>Deitada</button>
          <span style={{ color: '#9ca3af', fontSize: 11.5, marginLeft: 8 }}>Desmarque “Cabeçalhos e rodapés” na impressão</span>
          <button onClick={() => window.print()} style={{ padding: '8px 18px', fontSize: 13.5, fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>🖨️ Imprimir / Salvar PDF</button>
        </div>
      </div>

      <div className="rx folha" style={{ background: '#fff', maxWidth: paisagem ? 1123 : 794, margin: '20px auto', padding: '26px 30px', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}>
        <div className="hdr">
          <div>
            <h1>{dados.empresa || 'Relatório de Vendas'}</h1>
            <div className="sub">Relatório de vendas{dados.loja ? ` · Loja ${dados.loja}` : ''}{dados.canceladas.qtd ? ` · ${dados.canceladas.qtd} cancelada(s) no período: #${dados.canceladas.numeros.join(', #')}` : ''}</div>
          </div>
          <div className="per">Período<b>{fmtData(dados.periodo.inicio)} a {fmtData(dados.periodo.fim)}</b></div>
        </div>

        {tabelas.map(t => (
          <div key={t.key} className="sec">
            {t.kpis ? <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#374151' }}>{t.titulo}</div> : <h2>{t.titulo}</h2>}
            <Tabela t={t} />
          </div>
        ))}

        <div className="foot">Gerado em {new Date().toLocaleString('pt-BR')} · Connect Óticas</div>
      </div>
    </div>
  );
}
