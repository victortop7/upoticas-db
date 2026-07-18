import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; nome: string; codigo?: string; }
interface Ordem {
  id: string; numero: number; status: string; tipo: string;
  ref_otica: string | null; cont_interno: string | null;
  previsao_entrega: string | null; total: number;
  created_at: string; otica_nome: string;
  vendedor: string | null; caixa: string | null;
}

const STATUS_FLOW = [
  { value: '', label: 'Todos' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

const TIPOS_OS = [
  { value: '', label: 'Todos' },
  { value: 'O', label: 'OS Normal' }, { value: 'F', label: 'OS Freeform' },
  { value: 'G', label: 'OS Garantia' }, { value: 'U', label: 'Venda/Pedido' },
  { value: 'E', label: 'Encomenda' }, { value: 'Z', label: 'Recibo' },
  { value: 'N', label: 'Orçamento' }, { value: 'M', label: 'Mostruário' },
];

function statusLabel(s: string) { return STATUS_FLOW.find(x => x.value === s)?.label ?? s; }
function brl(v: number) { return v > 0 ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—'; }
function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function tipoLabel(t: string) { return TIPOS_OS.find(x => x.value === t)?.label ?? t ?? 'OS'; }

import { R } from '../../lib/labTheme';
const INP: React.CSSProperties = { padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', boxSizing:'border-box', fontFamily:"'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize:'10px', fontWeight:'700', color:R.txt, textTransform:'uppercase', letterSpacing:'0.5px' };

export default function LabOrdens() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [oticaId, setOticaId] = useState('');
  const [nomeOtica, setNomeOtica] = useState('');
  const [codOtica, setCodOtica] = useState('');
  const [refOtica, setRefOtica] = useState('');
  const [numOS, setNumOS] = useState('');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status)    p.set('status', status);
    if (tipo)      p.set('tipo', tipo);
    if (busca)     p.set('q', busca);
    if (oticaId)   p.set('otica_id', oticaId);
    if (nomeOtica) p.set('nome_otica', nomeOtica);
    if (codOtica)  p.set('cod_otica', codOtica);
    if (refOtica)  p.set('ref_otica', refOtica);
    if (numOS)     p.set('num_os', numOS);
    if (dataIni)   p.set('data_ini', dataIni);
    if (dataFim)   p.set('data_fim', dataFim);
    api.get<Ordem[]>(`/lab/ordens?${p}`)
      .then(setOrdens).catch(() => setOrdens([]))
      .finally(() => setLoading(false));
  }, [status, tipo, busca, oticaId, nomeOtica, codOtica, refOtica, numOS, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => {}); }, []);

  const statusBadge = (s: string) => {
    const colors: Record<string, { bg: string; color: string; border: string }> = {
      aguardando: { bg: '#fff8cc', color: '#886600', border: '#886600' },
      em_producao: { bg: '#cce0ff', color: '#003388', border: '#003388' },
      pronto: { bg: '#ccffcc', color: '#006600', border: '#006600' },
      entregue: { bg: '#e0e0e0', color: R.txt, border: '#888' },
      cancelado: { bg: '#ccffcc', color: '#005500', border: '#005500' },
    };
    const c = colors[s] ?? { bg: '#ddd', color: R.txt, border: '#888' };
    return (
      <span style={{ fontSize:'10px', fontWeight:'700', color:c.color, background:c.bg, padding:'2px 7px', border:`1px solid ${c.border}` }}>
        {statusLabel(s).toUpperCase()}
      </span>
    );
  };

  return (
    <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:R.bg, fontFamily:"'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', flexWrap:'wrap', gap:'6px' }}>
        <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}` }}>
          ORDENS DE SERVIÇO — {ordens.length} registro(s)
        </div>
        <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar OS#, ref., cont. interno..." style={{ ...INP, width:'220px' }} />
          <button onClick={() => navigate('/lab/ordens/nova')}
            style={{ padding:'5px 16px', fontSize:'12px', fontWeight:'700', background:'#005500', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
            + NOVA OS
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, padding:'8px 12px', marginBottom:'8px', display:'flex', gap:'12px', alignItems:'flex-end', flexWrap:'wrap' }}>

        <div>
          <div style={LBL}>Status</div>
          <div style={{ display:'flex', gap:'3px' }}>
            {STATUS_FLOW.map(s => (
              <button key={s.value} onClick={() => setStatus(s.value)}
                style={{ padding:'3px 9px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
                  background: status === s.value ? '#005500' : R.alt,
                  color: status === s.value ? R.hdrTxt : R.txt,
                  border: status === s.value ? `1px inset ${R.hdrBdr}` : `1px outset ${R.bdr}` }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={LBL}>Tipo</div>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...INP, width:'120px' }}>
            {TIPOS_OS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <div style={LBL}>Nº OS</div>
          <input value={numOS} onChange={e => setNumOS(e.target.value)} placeholder="Ex: 17" style={{ ...INP, width:'70px' }} />
        </div>

        <div>
          <div style={LBL}>Nome da Ótica</div>
          <input value={nomeOtica} onChange={e => setNomeOtica(e.target.value)} placeholder="Digite o nome..." style={{ ...INP, width:'160px' }} />
        </div>

        <div>
          <div style={LBL}>Cód. Ótica</div>
          <input value={codOtica} onChange={e => setCodOtica(e.target.value)} placeholder="Ex: 001" style={{ ...INP, width:'80px' }} />
        </div>

        <div>
          <div style={LBL}>Ref. Ótica</div>
          <input value={refOtica} onChange={e => setRefOtica(e.target.value)} placeholder="Referência..." style={{ ...INP, width:'110px' }} />
        </div>

        <div>
          <div style={LBL}>Ótica (lista)</div>
          <select value={oticaId} onChange={e => setOticaId(e.target.value)} style={{ ...INP, width:'150px' }}>
            <option value="">Todas</option>
            {oticas.map(o => <option key={o.id} value={o.id}>{o.codigo ? `${o.codigo} - ` : ''}{o.nome}</option>)}
          </select>
        </div>

        <div>
          <div style={LBL}>Período</div>
          <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
            <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...INP, width:'120px' }} />
            <span style={{ fontSize:'11px', color:R.dim }}>até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...INP, width:'120px' }} />
          </div>
        </div>

        {(busca || oticaId || nomeOtica || codOtica || refOtica || numOS || dataIni || dataFim || tipo || status) && (
          <button onClick={() => { setBusca(''); setOticaId(''); setNomeOtica(''); setCodOtica(''); setRefOtica(''); setNumOS(''); setDataIni(''); setDataFim(''); setTipo(''); setStatus(''); }}
            style={{ padding:'3px 10px', fontSize:'11px', fontWeight:'700', background:'#ffcccc', color:'#880000', border:`1px outset #cc0000`, cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-end' }}>
            ✕ LIMPAR
          </button>
        )}
      </div>

      {/* Tabela */}
      <div style={{ flex:1, overflowY:'auto', border:`2px inset ${R.bdr}` }}>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:R.txt, fontFamily:"'Courier New', monospace" }}>Carregando...</div>
        ) : ordens.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:R.txt }}>
            Nenhuma ordem encontrada.{' '}
            <button onClick={() => navigate('/lab/ordens/nova')}
              style={{ color:'#005500', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:'700' }}>
              Criar OS →
            </button>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0 }}>
              <tr style={{ background:R.hdr }}>
                {['Nº OS','Tipo','Data','Ótica','Ref. Ótica','Cont. Int.','Operador','Total','Previsão','Status'].map(h => (
                  <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, letterSpacing:'0.5px', border:`1px solid ${R.hdrBdr}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordens.map((o, i) => (
                <tr key={o.id} onClick={() => navigate(`/lab/ordens/${o.id}`)}
                  style={{ background: i % 2 === 0 ? R.panel : R.alt, cursor:'pointer', borderBottom:`1px solid ${R.bdr}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#005500')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? R.panel : R.alt)}>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'700', color:R.txt, whiteSpace:'nowrap' }}>
                    #{String(o.numero).padStart(4, '0')}
                  </td>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt }}>
                    {tipoLabel(o.tipo)}
                  </td>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt, whiteSpace:'nowrap' }}>
                    {fmtDate(o.created_at)}
                  </td>
                  <td style={{ padding:'6px 10px', fontSize:'12px', fontWeight:'700', color:R.txt, maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {o.otica_nome}
                  </td>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt }}>
                    {o.ref_otica ?? '—'}
                  </td>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt }}>
                    {o.cont_interno ?? '—'}
                  </td>
                  <td style={{ padding:'6px 10px', fontSize:'11px', color:R.txt }}>
                    {o.vendedor ?? '—'}
                  </td>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', color:R.txt, fontWeight:'700', textAlign:'right', whiteSpace:'nowrap' }}>
                    {brl(o.total)}
                  </td>
                  <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.txt, whiteSpace:'nowrap' }}>
                    {fmtDate(o.previsao_entrega)}
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    {statusBadge(o.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
