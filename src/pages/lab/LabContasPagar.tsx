import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';

interface Conta {
  id: string; numero: number; fornecedor: string; descricao: string;
  valor: number; data_emissao: string; data_vencimento: string;
  data_pagamento: string | null; status: 'aberto' | 'pago' | 'vencido';
  forma_pgto: string | null; categoria: string | null; observacoes: string | null;
}

const STATUS_COLOR = { aberto: '#886600', pago: R.accent, vencido: '#cc0000' };
const STATUS_LABEL = { aberto: 'Em Aberto', pago: 'Pago', vencido: 'Vencido' };

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function isVencido(venc: string, status: string) {
  return status === 'aberto' && new Date(venc) < new Date();
}

const INP: React.CSSProperties = { padding: '7px 10px', fontSize: '13px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius:  0, color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace", width: '100%', boxSizing: 'border-box' };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };

const CATEGORIAS = ['Fornecedor','Lentes','Insumos','Aluguel','Salário','INSS/FGTS','Energia','Internet','Manutenção','Transporte','Imposto','Outros'];

export default function LabContasPagar() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [baixando, setBaixando] = useState<Conta | null>(null);
  const [dataPgto, setDataPgto] = useState('');
  const [formaPgto, setFormaPgto] = useState('');
  const [novaModal, setNovaModal] = useState(false);
  const [novaForm, setNovaForm] = useState({ fornecedor: '', descricao: '', categoria: '', valor: '', data_emissao: new Date().toISOString().split('T')[0], data_vencimento: '', observacoes: '' });
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (statusFiltro) p.set('status', statusFiltro);
    if (dataIni) p.set('data_ini', dataIni);
    if (dataFim) p.set('data_fim', dataFim);
    api.get<Conta[]>(`/lab/contas-pagar?${p}`)
      .then(list => setContas(list.map(c => ({ ...c, status: isVencido(c.data_vencimento, c.status) ? 'vencido' : c.status }))))
      .catch(() => setContas([]))
      .finally(() => setLoading(false));
  }, [statusFiltro, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);

  async function darBaixa() {
    if (!baixando || !dataPgto) return;
    setSalvando(true);
    try {
      await api.patch(`/lab/contas-pagar/${baixando.id}`, { status: 'pago', data_pagamento: dataPgto, forma_pgto: formaPgto || null });
      setBaixando(null); load();
    } catch {} finally { setSalvando(false); }
  }

  async function criarConta() {
    if (!novaForm.descricao || !novaForm.valor || !novaForm.data_vencimento) return;
    setSalvando(true);
    try {
      await api.post('/lab/contas-pagar', { ...novaForm, valor: parseFloat(novaForm.valor) });
      setNovaModal(false); setNovaForm({ fornecedor: '', descricao: '', categoria: '', valor: '', data_emissao: new Date().toISOString().split('T')[0], data_vencimento: '', observacoes: '' });
      load();
    } catch {} finally { setSalvando(false); }
  }

  const filtradas = contas.filter(c =>
    !busca || c.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    c.fornecedor?.toLowerCase().includes(busca.toLowerCase())
  );

  const totais = {
    aberto: filtradas.filter(c => c.status === 'aberto').reduce((a, c) => a + c.valor, 0),
    vencido: filtradas.filter(c => c.status === 'vencido').reduce((a, c) => a + c.valor, 0),
    pago: filtradas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--lab-bdr)', background: R.panel, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: R.txt, marginRight: '8px' }}>Contas a Pagar</h2>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...INP, width: '180px' }} />
        <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...INP, width: '135px' }} />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...INP, width: '135px' }} />
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setNovaModal(true)} style={{ padding: '7px 16px', fontSize: '12px', fontWeight: '600', background: R.accent, color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Lançar</button>
        </div>
      </div>

      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--lab-bdr)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[['', 'Todos'], ['aberto', 'Em Aberto'], ['vencido', 'Vencidos'], ['pago', 'Pagos']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFiltro(v)} style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${statusFiltro === v ? '#b8b4ac' : 'var(--lab-bdr)'}`, background: statusFiltro === v ? R.alt : 'transparent', color: statusFiltro === v ? R.txt : R.dim }}>{l}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px', fontFamily: "'Courier New', monospace" }}>
          <span style={{ color: '#886600' }}>Aberto: <b>{brl(totais.aberto)}</b></span>
          <span style={{ color: '#cc0000' }}>Vencido: <b>{brl(totais.vencido)}</b></span>
          <span style={{ color: R.accent }}>Pago: <b>{brl(totais.pago)}</b></span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? <div style={{ padding: '60px', textAlign: 'center', color: R.dim }}>Carregando...</div>
          : filtradas.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: R.dim }}>Nenhum lançamento.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: R.alt, borderBottom: '1px solid var(--lab-bdr)' }}>
                  {['Nº', 'Fornecedor', 'Descrição', 'Categoria', 'Emissão', 'Vencimento', 'Pgto', 'Valor', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--lab-bdr)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = R.alt)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 12px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: R.dim }}>#{String(c.numero).padStart(4,'0')}</td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', color: R.txt, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fornecedor || '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', color: R.dim, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.descricao}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', color: R.dim }}>{c.categoria ?? '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim, whiteSpace: 'nowrap' }}>{fmtDate(c.data_emissao)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', color: c.status === 'vencido' ? '#cc0000' : R.dim, fontWeight: c.status === 'vencido' ? '700' : '400' }}>{fmtDate(c.data_vencimento)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.accent, whiteSpace: 'nowrap' }}>{fmtDate(c.data_pagamento)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: '700', color: R.txt, textAlign: 'right' }}>{brl(c.valor)}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '600', color: STATUS_COLOR[c.status], background: `${STATUS_COLOR[c.status]}18`, padding: '2px 7px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {c.status !== 'pago' && (
                        <button onClick={() => { setBaixando(c); setDataPgto(new Date().toISOString().split('T')[0]); setFormaPgto(''); }}
                          style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '5px', border: '1px solid #006600', background: 'rgba(0,102,0,0.15)', color: R.accent, cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>

      {/* Modal Baixa */}
      {baixando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '12px', padding: '24px', width: '380px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: R.txt }}>Pagar — #{String(baixando.numero).padStart(4,'0')}</h3>
            <div style={{ fontSize: '13px', color: R.dim, marginBottom: '14px' }}>{baixando.descricao} — <b style={{ color: R.txt }}>{brl(baixando.valor)}</b></div>
            <div style={{ marginBottom: '10px' }}><label style={LBL}>Data do Pagamento *</label><input type="date" value={dataPgto} onChange={e => setDataPgto(e.target.value)} style={INP} /></div>
            <div style={{ marginBottom: '16px' }}>
              <label style={LBL}>Forma de Pagamento</label>
              <select value={formaPgto} onChange={e => setFormaPgto(e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">— Selecionar</option>
                {['Dinheiro','PIX','Transferência','Boleto','Cheque','Cartão','Depósito'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setBaixando(null)} style={{ padding: '8px 18px', fontSize: '13px', background: 'transparent', color: R.dim, border: '1px solid var(--lab-bdr)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={darBaixa} disabled={salvando || !dataPgto} style={{ padding: '8px 22px', fontSize: '13px', fontWeight: '600', background: salvando || !dataPgto ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>{salvando ? '...' : '✓ Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova */}
      {novaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '12px', padding: '24px', width: '440px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: R.txt }}>Novo Lançamento — Contas a Pagar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={LBL}>Fornecedor</label><input value={novaForm.fornecedor} onChange={e => setNovaForm(f => ({ ...f, fornecedor: e.target.value }))} style={INP} /></div>
                <div>
                  <label style={LBL}>Categoria</label>
                  <select value={novaForm.categoria} onChange={e => setNovaForm(f => ({ ...f, categoria: e.target.value }))} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                    <option value="">— Selecionar</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={LBL}>Descrição *</label><input value={novaForm.descricao} onChange={e => setNovaForm(f => ({ ...f, descricao: e.target.value }))} style={INP} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div><label style={LBL}>Valor *</label><input type="number" step="0.01" value={novaForm.valor} onChange={e => setNovaForm(f => ({ ...f, valor: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Emissão</label><input type="date" value={novaForm.data_emissao} onChange={e => setNovaForm(f => ({ ...f, data_emissao: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Vencimento *</label><input type="date" value={novaForm.data_vencimento} onChange={e => setNovaForm(f => ({ ...f, data_vencimento: e.target.value }))} style={INP} /></div>
              </div>
              <div><label style={LBL}>Observações</label><input value={novaForm.observacoes} onChange={e => setNovaForm(f => ({ ...f, observacoes: e.target.value }))} style={INP} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setNovaModal(false)} style={{ padding: '8px 18px', fontSize: '13px', background: 'transparent', color: R.dim, border: '1px solid var(--lab-bdr)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={criarConta} disabled={salvando} style={{ padding: '8px 22px', fontSize: '13px', fontWeight: '600', background: salvando ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>{salvando ? '...' : 'Lançar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
