import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';

interface Fechamento {
  id: string; numero: number; otica_id: string; otica_nome: string;
  tipo: 'mensal' | 'especial' | 'avulso'; periodo_ini: string; periodo_fim: string;
  valor_bruto: number; desconto: number; valor_liquido: number;
  status: 'aberto' | 'emitido' | 'pago'; data_emissao: string;
  data_vencimento: string | null; data_pagamento: string | null;
  observacoes: string | null; qtd_os: number;
}

interface Otica { id: string; nome: string; }
interface ResumoOS { otica_id: string; otica_nome: string; qtd_os: number; valor_total: number; }

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const INP: React.CSSProperties = { padding: '7px 10px', fontSize: '13px', background: R.inp, border: '1px solid #b0aca4', borderRadius:  0, color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace", width: '100%', boxSizing: 'border-box' };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };
const STATUS_COLOR: Record<string, string> = { aberto: '#886600', emitido: R.accent2, pago: R.accent };

export default function LabFaturamento() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<'fechamentos' | 'gerar'>('fechamentos');
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');

  // Gerar fechamento
  const [mes, setMes] = useState(mesAtual());
  const [oticaFiltro, setOticaFiltro] = useState('');
  const [resumo, setResumo] = useState<ResumoOS[]>([]);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [desconto, setDesconto] = useState('0');
  const [vencimento, setVencimento] = useState('');
  const [gerandoId, setGerandoId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (statusFiltro) p.set('status', statusFiltro);
    api.get<Fechamento[]>(`/lab/faturamento?${p}`)
      .then(setFechamentos).catch(() => setFechamentos([]))
      .finally(() => setLoading(false));
  }, [statusFiltro]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => {}); }, []);

  async function carregarResumo() {
    setLoadingResumo(true);
    try {
      const [y, m] = mes.split('-');
      const ini = `${y}-${m}-01`;
      const fim = new Date(parseInt(y), parseInt(m), 0).toISOString().split('T')[0];
      const data = await api.get<ResumoOS[]>(`/lab/faturamento/resumo?data_ini=${ini}&data_fim=${fim}${oticaFiltro ? `&otica_id=${oticaFiltro}` : ''}`);
      setResumo(data);
    } catch { setResumo([]); }
    setLoadingResumo(false);
  }

  async function gerarFechamento(oticaId: string, qtd: number, valor: number) {
    setGerandoId(oticaId);
    const [y, m] = mes.split('-');
    const ini = `${y}-${m}-01`;
    const fim = new Date(parseInt(y), parseInt(m), 0).toISOString().split('T')[0];
    const desc = parseFloat(desconto) || 0;
    try {
      await api.post('/lab/faturamento', {
        otica_id: oticaId, tipo: 'mensal',
        periodo_ini: ini, periodo_fim: fim,
        valor_bruto: valor, desconto: desc,
        valor_liquido: Math.max(0, valor - desc),
        data_vencimento: vencimento || null,
        qtd_os: qtd,
      });
      setResumo(r => r.filter(x => x.otica_id !== oticaId));
      load();
    } catch {} finally { setGerandoId(null); }
  }

  async function marcarPago(id: string) {
    const data = prompt('Data de pagamento (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!data) return;
    try {
      await api.patch(`/lab/faturamento/${id}`, { status: 'pago', data_pagamento: data });
      load();
    } catch {}
  }

  const totalAberto = fechamentos.filter(f => f.status !== 'pago').reduce((a, f) => a + f.valor_liquido, 0);
  const totalPago   = fechamentos.filter(f => f.status === 'pago').reduce((a, f) => a + f.valor_liquido, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #b0aca4', background: R.panel, display: 'flex', gap: '12px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: R.txt }}>Faturamento</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[['fechamentos', 'Fechamentos'], ['gerar', 'Gerar Fechamento']].map(([v, l]) => (
            <button key={v} onClick={() => setAba(v as 'fechamentos' | 'gerar')}
              style={{ padding: '5px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${aba === v ? R.accent : '#b0aca4'}`, background: aba === v ? R.accent : 'transparent', color: aba === v ? '#fff' : R.dim }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px', fontFamily: "'Courier New', monospace" }}>
          <span style={{ color: '#886600' }}>A receber: <b>{brl(totalAberto)}</b></span>
          <span style={{ color: R.accent }}>Recebido: <b>{brl(totalPago)}</b></span>
        </div>
      </div>

      {/* ABA: FECHAMENTOS */}
      {aba === 'fechamentos' && (
        <>
          <div style={{ padding: '8px 20px', borderBottom: '1px solid #b0aca4', display: 'flex', gap: '8px' }}>
            {[['', 'Todos'], ['aberto', 'Em Aberto'], ['emitido', 'Emitidos'], ['pago', 'Pagos']].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFiltro(v)} style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${statusFiltro === v ? '#b8b4ac' : '#b0aca4'}`, background: statusFiltro === v ? R.alt : 'transparent', color: statusFiltro === v ? R.txt : R.dim }}>{l}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <div style={{ padding: '60px', textAlign: 'center', color: R.dim }}>Carregando...</div>
              : fechamentos.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: R.dim }}>Nenhum fechamento. Use "Gerar Fechamento" para criar.</div>
              : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr style={{ background: R.alt, borderBottom: '1px solid #b0aca4' }}>
                      {['Nº', 'Ótica', 'Período', 'OS', 'Bruto', 'Desconto', 'Líquido', 'Vencimento', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fechamentos.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid #b0aca4' }}
                        onMouseEnter={e => (e.currentTarget.style.background = R.alt)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '9px 12px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: R.dim }}>#{String(f.numero).padStart(4,'0')}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', color: R.txt, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.otica_nome}</td>
                        <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim, whiteSpace: 'nowrap' }}>{fmtDate(f.periodo_ini)} – {fmtDate(f.periodo_fim)}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim, textAlign: 'center' }}>{f.qtd_os}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim, textAlign: 'right' }}>{brl(f.valor_bruto)}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: '#cc0000', textAlign: 'right' }}>{f.desconto > 0 ? brl(f.desconto) : '—'}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: '700', color: R.txt, textAlign: 'right' }}>{brl(f.valor_liquido)}</td>
                        <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim, whiteSpace: 'nowrap' }}>{fmtDate(f.data_vencimento)}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '600', color: STATUS_COLOR[f.status], background: `${STATUS_COLOR[f.status]}18`, padding: '2px 7px', borderRadius: '20px' }}>
                            {f.status === 'aberto' ? 'Em Aberto' : f.status === 'emitido' ? 'Emitido' : 'Pago'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {f.status !== 'pago' && <button onClick={() => marcarPago(f.id)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #006600', background: 'rgba(0,102,0,0.15)', color: R.accent, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Pago</button>}
                            <button onClick={() => navigate(`/lab/ordens?otica_id=${f.otica_id}`)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #b0aca4', background: 'transparent', color: R.dim, cursor: 'pointer', fontFamily: 'inherit' }}>OS →</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
          </div>
        </>
      )}

      {/* ABA: GERAR */}
      {aba === 'gerar' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={LBL}>Mês de Referência</label>
              <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ ...INP, width: '160px' }} />
            </div>
            <div>
              <label style={LBL}>Ótica (opcional)</label>
              <select value={oticaFiltro} onChange={e => setOticaFiltro(e.target.value)} style={{ ...INP, width: '200px', fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">Todas as óticas</option>
                {oticas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Desconto (R$)</label>
              <input type="number" step="0.01" value={desconto} onChange={e => setDesconto(e.target.value)} style={{ ...INP, width: '100px' }} />
            </div>
            <div>
              <label style={LBL}>Vencimento</label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} style={{ ...INP, width: '140px' }} />
            </div>
            <button onClick={carregarResumo} disabled={loadingResumo} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: '600', background: R.accent, color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loadingResumo ? 'Carregando...' : 'Calcular'}
            </button>
          </div>

          {resumo.length > 0 && (
            <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #b0aca4', fontSize: '12px', fontWeight: '700', color: R.txt }}>
                OSes do período — {mes} ({resumo.reduce((a, r) => a + r.qtd_os, 0)} OS, {brl(resumo.reduce((a, r) => a + r.valor_total, 0))})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: R.alt, borderBottom: '1px solid #b0aca4' }}>
                    {['Ótica', 'Qtd OS', 'Valor Total', 'Líquido (c/ desconto)', ''].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumo.map(r => {
                    const desc = parseFloat(desconto) || 0;
                    const liq = Math.max(0, r.valor_total - desc);
                    return (
                      <tr key={r.otica_id} style={{ borderBottom: '1px solid #b0aca4' }}>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: R.txt }}>{r.otica_nome}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontFamily: "'Courier New', monospace", color: R.dim, textAlign: 'center' }}>{r.qtd_os}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontFamily: "'Courier New', monospace", color: R.txt }}>{brl(r.valor_total)}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: '700', color: R.accent }}>{brl(liq)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => gerarFechamento(r.otica_id, r.qtd_os, r.valor_total)}
                            disabled={gerandoId === r.otica_id}
                            style={{ padding: '6px 16px', fontSize: '12px', fontWeight: '600', background: gerandoId === r.otica_id ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {gerandoId === r.otica_id ? 'Gerando...' : 'Gerar Fechamento'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
