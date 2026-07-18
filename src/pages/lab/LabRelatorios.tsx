import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface OticaRow {
  otica_id: string; otica_nome: string; otica_codigo: string;
  total_os: number; entregues: number; canceladas: number; em_aberto: number;
  valor_total: number;
}
interface Totais { total_os: number; valor_total: number; }
interface Ordem {
  id: string; numero: number; status: string; tipo: string; total: number;
  ref_otica: string | null; cont_interno: string | null;
  previsao_entrega: string | null; created_at: string; vendedor: string | null;
  otica_nome: string;
}

function brl(v: number) { return Number(v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }
function fmtDate(s: string | null) {
  if (!s) return '—';
  return s.slice(0,10).split('-').reverse().join('/');
}
function today() { return new Date().toISOString().slice(0,10); }
function diasAtras(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0,10);
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  aguardando: { bg:'#fff8cc', color:'#886600', label:'AGUARDANDO' },
  em_producao:{ bg:'#cce0ff', color:'#003388', label:'EM PRODUÇÃO' },
  pronto:     { bg:'#ccffcc', color:'#005500', label:'PRONTO' },
  entregue:   { bg:'#e0e0e0', color:'#555555',    label:'ENTREGUE' },
  cancelado:  { bg:'#ccffcc', color:'#005500', label:'CANCELADO' },
};

const TIPOS: Record<string, string> = {
  O:'OS Normal', F:'Freeform', G:'Garantia', U:'Venda/Pedido',
  E:'Encomenda', Z:'Recibo',   N:'Orçamento', M:'Mostruário',
};

import { R } from '../../lib/labTheme';
const INP: React.CSSProperties = { padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', fontFamily:"'Courier New', monospace", boxSizing:'border-box' };

export default function LabRelatorios() {
  const navigate = useNavigate();
  const [dataIni, setDataIni] = useState(diasAtras(30));
  const [dataFim, setDataFim]  = useState(today());
  const [loading, setLoading]  = useState(false);
  const [oticas, setOticas]    = useState<OticaRow[]>([]);
  const [totais, setTotais]    = useState<Totais | null>(null);
  const [buscado, setBuscado]  = useState(false);

  // Drill-down
  const [oticaSel, setOticaSel] = useState<{id:string; nome:string; codigo?:string} | null>(null);
  const [ordens, setOrdens]     = useState<Ordem[]>([]);
  const [servicosPorOS, setServicosPorOS] = useState<Record<string, any[]>>({});
  const [loadingOS, setLoadingOS] = useState(false);

  // Busca por número de OS
  const [buscaOS, setBuscaOS]     = useState('');
  const [buscandoOS, setBuscandoOS] = useState(false);
  const [erroBuscaOS, setErroBuscaOS] = useState('');

  async function buscarPorNumero() {
    const num = buscaOS.trim().replace(/^#+/, '');
    if (!num) return;
    setBuscandoOS(true); setErroBuscaOS('');
    try {
      const r = await api.get<Ordem[]>(`/lab/ordens?q=${encodeURIComponent(num)}`);
      const found = r.find(o => String(o.numero) === num || String(o.numero).padStart(4,'0') === num.padStart(4,'0'));
      if (found) {
        navigate(`/lab/ordens/${found.id}`);
      } else if (r.length === 1) {
        navigate(`/lab/ordens/${r[0].id}`);
      } else if (r.length > 0) {
        // Múltiplos resultados — mostra drill-down da primeira ótica encontrada
        setErroBuscaOS(`${r.length} OS encontradas. Refine o número.`);
      } else {
        setErroBuscaOS(`OS #${num.padStart(4,'0')} não encontrada`);
      }
    } catch { setErroBuscaOS('Erro ao buscar'); }
    setBuscandoOS(false);
  }

  const buscarResumo = useCallback(async () => {
    setLoading(true); setOticaSel(null); setOrdens([]);
    try {
      const p = new URLSearchParams({ data_ini: dataIni, data_fim: dataFim });
      const r = await api.get<{ oticas: OticaRow[]; totais: Totais }>(`/lab/relatorios/periodo?${p}`);
      setOticas(r.oticas || []);
      setTotais(r.totais || null);
      setBuscado(true);
    } catch {}
    setLoading(false);
  }, [dataIni, dataFim]);

  async function verOtica(o: OticaRow) {
    setOticaSel({ id: o.otica_id, nome: o.otica_nome, codigo: o.otica_codigo });
    setLoadingOS(true);
    try {
      const p = new URLSearchParams({ data_ini: dataIni, data_fim: dataFim, otica_id: o.otica_id });
      const r = await api.get<{ ordens: Ordem[]; servicos: any[] }>(`/lab/relatorios/periodo?${p}`);
      setOrdens(r.ordens || []);
      // Agrupa serviços por ordem_id
      const agrupado: Record<string, any[]> = {};
      for (const s of (r.servicos || [])) {
        const key = s.ordem_id as string;
        if (!agrupado[key]) agrupado[key] = [];
        agrupado[key].push(s);
      }
      setServicosPorOS(agrupado);
    } catch {}
    setLoadingOS(false);
  }

  function imprimirRelatorio(ordens: Ordem[], svcMap: Record<string, any[]>, otica: {nome:string; codigo?:string}, periodo: string) {
    const brlFmt = (v: number) => Number(v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
    const total = ordens.reduce((a, o) => a + (o.total||0), 0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Relatório ${otica.nome}</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; margin: 0; padding: 16px; }
      h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }
      .os-block { margin-bottom: 14px; border: 1px solid #999; page-break-inside: avoid; }
      .os-header { background: #222; color: #fff; padding: 5px 10px; display: flex; justify-content: space-between; font-weight: 700; font-size: 12px; }
      .os-info { padding: 4px 10px; background: #f5f5f5; font-size: 10px; display: flex; gap: 20px; flex-wrap: wrap; border-bottom: 1px solid #ccc; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #ddd; border: 1px solid #999; padding: 3px 6px; font-size: 10px; text-align: left; }
      td { border: 1px solid #ddd; padding: 3px 6px; font-size: 10px; }
      .num { text-align: right; }
      .total-row { background: #eee; font-weight: 700; }
      .resumo { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; display: flex; justify-content: flex-end; gap: 40px; }
      .resumo div { text-align: right; }
      .resumo .label { font-size: 10px; color: #555; }
      .resumo .valor { font-size: 15px; font-weight: 900; }
      @media print { body { padding: 8px; } }
    </style></head><body>
    <h1>CONNECT LAB — RELATÓRIO DE FATURAMENTO</h1>
    <div class="sub">
      Ótica: <strong>${otica.codigo ? otica.codigo + ' — ' : ''}${otica.nome}</strong><br>
      Período: ${periodo} &nbsp;|&nbsp; Total de OS: ${ordens.length}
    </div>
    ${ordens.map(o => {
      const svcs = svcMap[o.id] || [];
      const status = { aguardando:'AGUARDANDO', em_producao:'EM PRODUÇÃO', pronto:'PRONTO', entregue:'ENTREGUE', cancelado:'CANCELADO' }[o.status] || o.status;
      const data = o.created_at ? o.created_at.slice(0,10).split('-').reverse().join('/') : '—';
      const prev = o.previsao_entrega ? o.previsao_entrega.slice(0,10).split('-').reverse().join('/') : '—';
      return `
      <div class="os-block">
        <div class="os-header">
          <span>#${String(o.numero).padStart(4,'0')} — ${o.tipo || ''}</span>
          <span>${status}</span>
          <span>${brlFmt(o.total||0)}</span>
        </div>
        <div class="os-info">
          <span>Data: <strong>${data}</strong></span>
          ${o.ref_otica ? `<span>Ref. Ótica: <strong>${o.ref_otica}</strong></span>` : ''}
          ${o.cont_interno ? `<span>Cont. Interno: <strong>${o.cont_interno}</strong></span>` : ''}
          ${o.vendedor ? `<span>Vendedor: <strong>${o.vendedor}</strong></span>` : ''}
          <span>Previsão: <strong>${prev}</strong></span>
        </div>
        ${svcs.length > 0 ? `
        <table>
          <thead><tr><th>Cód.</th><th>Descrição</th><th class="num">Qtd</th><th class="num">Unit.</th><th class="num">Desc%</th><th class="num">Total</th></tr></thead>
          <tbody>
            ${svcs.map(s => `<tr>
              <td>${s.codigo||'—'}</td>
              <td>${s.descricao||''}</td>
              <td class="num">${s.qtd||1}</td>
              <td class="num">${brlFmt(s.pv_unit||0)}</td>
              <td class="num">${s.perc_desc||0}%</td>
              <td class="num">${brlFmt(s.total_liq||0)}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr class="total-row"><td colspan="5" style="text-align:right;padding:3px 6px">TOTAL DA OS</td><td class="num">${brlFmt(o.total||0)}</td></tr></tfoot>
        </table>` : '<div style="padding:6px 10px;color:#666;font-size:10px">Sem serviços cadastrados</div>'}
      </div>`;
    }).join('')}
    <div class="resumo">
      <div><div class="label">TOTAL GERAL</div><div class="valor">${brlFmt(total)}</div></div>
    </div>
    <script>window.onload = () => { window.print(); }</script>
    </body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); }
  }

  const PRESETS = [
    { label:'Hoje', ini: today(), fim: today() },
    { label:'7 dias', ini: diasAtras(7), fim: today() },
    { label:'15 dias', ini: diasAtras(15), fim: today() },
    { label:'30 dias', ini: diasAtras(30), fim: today() },
    { label:'Este mês', ini: new Date().toISOString().slice(0,7)+'-01', fim: today() },
  ];

  const maiorValor = oticas.reduce((m, o) => Math.max(m, o.valor_total), 1);

  // ─── DRILL-DOWN: OS da ótica ───────────────────────────────────────────────
  if (oticaSel) {
    return (
      <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:R.bg, fontFamily:"'Montserrat', sans-serif" }}>
        <style>{`@media print{.no-print{display:none!important}body{background:#fff!important}}`}</style>

        {/* Header */}
        <div className="no-print" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', gap:'6px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={() => setOticaSel(null)}
              style={{ padding:'5px 12px', fontSize:'11px', fontWeight:'700', background:R.alt, color:R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
              ← VOLTAR
            </button>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}` }}>
              {oticaSel.nome} — {ordens.length} OS
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <div style={{ fontSize:'11px', color:R.dim, fontFamily:"'Courier New', monospace" }}>
              {fmtDate(dataIni)} até {fmtDate(dataFim)}
            </div>
            <button onClick={() => imprimirRelatorio(ordens, servicosPorOS, oticaSel!, `${fmtDate(dataIni)} até ${fmtDate(dataFim)}`)}
              style={{ padding:'5px 14px', fontSize:'11px', fontWeight:'700', background:R.accent2, color:'#fff', border:'1px outset #003388', cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
              🖨️ IMPRIMIR RELATÓRIO
            </button>
          </div>
        </div>

        {/* Título de impressão */}
        <div style={{ display:'none' }} className="print-only">
          <div style={{ textAlign:'center', marginBottom:'8px', fontFamily:"'Courier New', monospace" }}>
            <div style={{ fontSize:'16px', fontWeight:'900' }}>RELATÓRIO DE OS — {oticaSel.nome}</div>
            <div style={{ fontSize:'12px' }}>Período: {fmtDate(dataIni)} até {fmtDate(dataFim)} &nbsp;|&nbsp; Total: {ordens.length} OS</div>
          </div>
        </div>

        {/* Totalizador rápido */}
        {ordens.length > 0 && (
          <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, padding:'8px 16px', marginBottom:'8px', display:'flex', gap:'24px', flexWrap:'wrap' }}>
            {[
              { label:'TOTAL OS', val: ordens.length, mono: true },
              { label:'ENTREGUES', val: ordens.filter(o=>o.status==='entregue').length, mono: true },
              { label:'EM ABERTO', val: ordens.filter(o=>!['entregue','cancelado'].includes(o.status)).length, mono: true },
              { label:'VALOR TOTAL', val: brl(ordens.reduce((a,o)=>a+o.total,0)), mono: false },
            ].map(({ label, val, mono }) => (
              <div key={label}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:R.dim, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                <div style={{ fontSize:'18px', fontWeight:'900', color:R.accent, fontFamily: mono ? "'Courier New', monospace" : 'inherit' }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabela de OS */}
        <div style={{ flex:1, overflowY:'auto', border:`2px inset ${R.bdr}` }}>
          {loadingOS ? (
            <div style={{ padding:'40px', textAlign:'center', color:R.txt, fontFamily:"'Courier New', monospace" }}>Carregando...</div>
          ) : ordens.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center', color:R.txt }}>Nenhuma OS no período.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ position:'sticky', top:0 }}>
                <tr style={{ background:R.hdr }}>
                  {['Nº OS','DATA','TIPO','STATUS','REF. ÓTICA','CONT. INT.','VENDEDOR','TOTAL','PREVISÃO',''].map(h => (
                    <th key={h} style={{ padding:'6px 10px', textAlign: h==='TOTAL' ? 'right' : 'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, border:`1px solid ${R.hdrBdr}`, whiteSpace:'nowrap', letterSpacing:'0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordens.map((o, i) => {
                  const st = STATUS_STYLE[o.status] || { bg:'#eee', color:R.dim, label: o.status };
                  return (
                    <tr key={o.id} style={{ background: i%2===0 ? R.panel : R.alt, borderBottom:`1px solid ${R.bdr}`, cursor:'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background=R.accent)}
                      onMouseLeave={e => (e.currentTarget.style.background= i%2===0 ? R.panel : R.alt)}>
                      <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'900', color:R.accent }}
                        onClick={() => navigate(`/lab/ordens/${o.id}`)}>
                        #{String(o.numero).padStart(4,'0')}
                      </td>
                      <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt }}>{fmtDate(o.created_at)}</td>
                      <td style={{ padding:'6px 10px', fontSize:'11px', color:R.txt }}>{TIPOS[o.tipo] || o.tipo}</td>
                      <td style={{ padding:'6px 10px' }}>
                        <span style={{ fontSize:'10px', fontWeight:'700', color:st.color, background:st.bg, padding:'2px 6px', border:`1px solid ${st.color}`, whiteSpace:'nowrap' }}>{st.label}</span>
                      </td>
                      <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt }}>{o.ref_otica||'—'}</td>
                      <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt }}>{o.cont_interno||'—'}</td>
                      <td style={{ padding:'6px 10px', fontSize:'11px', color:R.txt }}>{o.vendedor||'—'}</td>
                      <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'700', color:R.txt, textAlign:'right', whiteSpace:'nowrap' }}>
                        {o.total > 0 ? brl(o.total) : '—'}
                      </td>
                      <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt, whiteSpace:'nowrap' }}>{fmtDate(o.previsao_entrega)}</td>
                      <td style={{ padding:'6px 10px' }}>
                        <button onClick={() => navigate(`/lab/ordens/${o.id}`)}
                          style={{ padding:'2px 8px', fontSize:'11px', fontWeight:'700', background:R.accent, color:'#fff', border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                          VER OS →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:R.hdr }}>
                  <td colSpan={7} style={{ padding:'7px 10px', fontSize:'12px', fontWeight:'700', color:R.hdrTxt }}>TOTAL</td>
                  <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'13px', fontWeight:'900', color:R.hdrTxt, textAlign:'right' }}>
                    {brl(ordens.reduce((a,o)=>a+o.total,0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ─── RESUMO GERAL ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:R.bg, fontFamily:"'Montserrat', sans-serif" }}>
      <style>{`@media print{.no-print{display:none!important}.print-only{display:block!important}body{background:#fff!important}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', gap:'8px', flexWrap:'wrap' }}>
        <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}` }}>
          RELATÓRIO DE ORDENS DE SERVIÇO
        </div>
        {buscado && (
          <button onClick={() => window.print()} className="no-print"
            style={{ padding:'5px 14px', fontSize:'11px', fontWeight:'700', background:R.accent2, color:'#fff', border:'1px outset #003388', cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
            🖨️ IMPRIMIR RELATÓRIO
          </button>
        )}
      </div>

      {/* Busca rápida por número de OS */}
      <div className="no-print" style={{ background:R.panel, border:`2px outset ${R.bdr}`, padding:'8px 14px', marginBottom:'8px', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ fontSize:'10px', fontWeight:'700', color:R.txt, textTransform:'uppercase', whiteSpace:'nowrap' }}>Busca rápida por OS:</div>
        <input
          value={buscaOS}
          onChange={e => { setBuscaOS(e.target.value); setErroBuscaOS(''); }}
          onKeyDown={e => e.key === 'Enter' && buscarPorNumero()}
          placeholder="Nº da OS (ex: 42 ou 0042)..."
          style={{ ...INP, width:'180px' }}
        />
        <button onClick={buscarPorNumero} disabled={buscandoOS}
          style={{ padding:'5px 14px', fontSize:'11px', fontWeight:'700', background:R.accent, color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
          {buscandoOS ? 'BUSCANDO...' : '🔍 IR PARA OS'}
        </button>
        {erroBuscaOS && (
          <span style={{ fontSize:'11px', color:R.accent, fontWeight:'700', fontFamily:"'Courier New', monospace" }}>
            ✕ {erroBuscaOS}
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="no-print" style={{ background:R.panel, border:`2px outset ${R.bdr}`, padding:'10px 14px', marginBottom:'8px' }}>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:'700', color:R.txt, textTransform:'uppercase', marginBottom:'3px' }}>Período</div>
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...INP, width:'130px' }} />
              <span style={{ fontSize:'11px', color:R.dim }}>até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...INP, width:'130px' }} />
            </div>
          </div>

          <button onClick={buscarResumo} disabled={loading}
            style={{ padding:'5px 18px', fontSize:'12px', fontWeight:'700', background:R.accent, color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', textTransform:'uppercase', alignSelf:'flex-end' }}>
            {loading ? 'BUSCANDO...' : '🔍 GERAR RELATÓRIO'}
          </button>
        </div>

        {/* Atalhos de período */}
        <div style={{ display:'flex', gap:'4px', marginTop:'8px', flexWrap:'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setDataIni(p.ini); setDataFim(p.fim); }}
              style={{ padding:'3px 10px', fontSize:'11px', fontWeight:'700', background: dataIni===p.ini && dataFim===p.fim ? R.accent : R.alt, color: dataIni===p.ini && dataFim===p.fim ? R.hdrTxt : R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Título apenas na impressão */}
      {buscado && (
        <div className="print-only" style={{ display:'none', textAlign:'center', marginBottom:'10px', fontFamily:"'Courier New', monospace" }}>
          <div style={{ fontSize:'16px', fontWeight:'900' }}>RELATÓRIO DE ORDENS DE SERVIÇO</div>
          <div style={{ fontSize:'12px' }}>Período: {fmtDate(dataIni)} até {fmtDate(dataFim)}</div>
        </div>
      )}

      {/* Totais gerais */}
      {buscado && totais && (
        <div style={{ display:'flex', gap:'10px', marginBottom:'8px', flexWrap:'wrap' }}>
          {[
            { label:'TOTAL DE OS', val: String(totais.total_os), sub: `de ${fmtDate(dataIni)} a ${fmtDate(dataFim)}` },
            { label:'ÓTICAS ATENDIDAS', val: String(oticas.length), sub: 'no período' },
            { label:'VALOR TOTAL', val: brl(totais.valor_total), sub: 'soma de todas as OS' },
            { label:'TICKET MÉDIO', val: totais.total_os > 0 ? brl(totais.valor_total / totais.total_os) : '—', sub: 'por OS' },
          ].map(({ label, val, sub }) => (
            <div key={label} style={{ background:R.panel, border:`2px outset ${R.bdr}`, padding:'8px 16px', flexShrink:0 }}>
              <div style={{ fontSize:'10px', fontWeight:'700', color:R.dim, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              <div style={{ fontSize:'20px', fontWeight:'900', color:R.accent, fontFamily:"'Courier New', monospace", lineHeight:'1.2' }}>{val}</div>
              <div style={{ fontSize:'10px', color:R.dim, marginTop:'2px' }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela por ótica */}
      <div style={{ flex:1, overflowY:'auto', border:`2px inset ${R.bdr}` }}>
        {!buscado ? (
          <div style={{ padding:'60px', textAlign:'center', color:R.dim, fontSize:'12px', fontFamily:"'Courier New', monospace" }}>
            SELECIONE O PERÍODO E CLIQUE EM "GERAR RELATÓRIO"
          </div>
        ) : loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:R.txt, fontFamily:"'Courier New', monospace" }}>Carregando...</div>
        ) : oticas.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:R.txt }}>Nenhuma OS no período selecionado.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0 }}>
              <tr style={{ background:R.hdr }}>
                {['CÓD','ÓTICA CLIENTE','TOTAL OS','ENTREGUES','EM ABERTO','CANCELADAS','VALOR TOTAL',''].map(h => (
                  <th key={h} style={{ padding:'6px 10px', textAlign: h==='VALOR TOTAL' ? 'right' : 'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, border:`1px solid ${R.hdrBdr}`, whiteSpace:'nowrap', letterSpacing:'0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oticas.map((o, i) => {
                const pct = Math.round((o.valor_total / maiorValor) * 100);
                return (
                  <tr key={o.otica_id} style={{ background: i%2===0 ? R.panel : R.alt, borderBottom:`1px solid ${R.bdr}`, cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background=R.accent)}
                    onMouseLeave={e => (e.currentTarget.style.background= i%2===0 ? R.panel : R.alt)}>
                    <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.dim }}>{o.otica_codigo||'—'}</td>
                    <td style={{ padding:'7px 10px', fontSize:'13px', fontWeight:'700', color:R.txt }}>{o.otica_nome}</td>
                    <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'14px', fontWeight:'900', color:R.txt }}>{o.total_os}</td>
                    <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'700', color:R.accent }}>{o.entregues}</td>
                    <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'700', color:R.accent2 }}>{o.em_aberto}</td>
                    <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', color:R.accent }}>{o.canceladas}</td>
                    <td style={{ padding:'7px 10px', textAlign:'right' }}>
                      <div style={{ fontFamily:"'Courier New', monospace", fontSize:'13px', fontWeight:'700', color:R.txt, marginBottom:'3px' }}>{brl(o.valor_total)}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end' }}>
                        <div style={{ width:'60px', height:'5px', background:'#b0aca4', borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:R.accent }} />
                        </div>
                        <span style={{ fontSize:'10px', color:R.dim, fontFamily:"'Courier New', monospace" }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'7px 10px' }}>
                      <button onClick={() => verOtica(o)}
                        style={{ padding:'3px 10px', fontSize:'11px', fontWeight:'700', background:R.accent, color:'#fff', border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                        VER OS →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:R.hdr }}>
                <td colSpan={2} style={{ padding:'7px 10px', fontSize:'12px', fontWeight:'700', color:R.hdrTxt }}>TOTAL GERAL</td>
                <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'14px', fontWeight:'900', color:R.hdrTxt }}>{totais?.total_os}</td>
                <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'13px', fontWeight:'700', color:'#ccffcc' }}>{oticas.reduce((a,o)=>a+o.entregues,0)}</td>
                <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'13px', color:'#cce0ff' }}>{oticas.reduce((a,o)=>a+o.em_aberto,0)}</td>
                <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'13px', color:'#ccffcc' }}>{oticas.reduce((a,o)=>a+o.canceladas,0)}</td>
                <td style={{ padding:'7px 10px', fontFamily:"'Courier New', monospace", fontSize:'14px', fontWeight:'900', color:R.hdrTxt, textAlign:'right' }}>{brl(totais?.valor_total||0)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
