import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';

interface Conta {
  id: string; numero: number; otica_id: string; otica_nome: string;
  descricao: string; valor: number; data_emissao: string;
  data_vencimento: string; data_pagamento: string | null;
  status: 'aberto' | 'pago' | 'vencido'; forma_pgto: string | null;
  observacoes: string | null; ordem_id: string | null; ordem_numero: number | null;
}

const STATUS_COLOR = { aberto: 'var(--amber)', pago: 'var(--green)', vencido: 'var(--red)' };
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

const INP: React.CSSProperties = {
  padding: '7px 10px', fontSize: '13px', background: 'var(--surface-alt)',
  border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)',
  outline: 'none', fontFamily: 'var(--mono)', width: '100%', boxSizing: 'border-box',
};
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };

interface Otica { id: string; nome: string; }

export default function LabContasReceber() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [oticaFiltro, setOticaFiltro] = useState('');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [busca, setBusca] = useState('');

  // Modal de baixa
  const [baixando, setBaixando] = useState<Conta | null>(null);
  const [dataPgto, setDataPgto] = useState('');
  const [formaPgto, setFormaPgto] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Nova conta
  const [novaModal, setNovaModal] = useState(false);
  const [novaForm, setNovaForm] = useState({ otica_id: '', descricao: '', valor: '', data_emissao: new Date().toISOString().split('T')[0], data_vencimento: '', forma_pgto: '', observacoes: '' });

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (statusFiltro) p.set('status', statusFiltro);
    if (oticaFiltro) p.set('otica_id', oticaFiltro);
    if (dataIni) p.set('data_ini', dataIni);
    if (dataFim) p.set('data_fim', dataFim);
    api.get<Conta[]>(`/lab/contas-receber?${p}`)
      .then(list => setContas(list.map(c => ({ ...c, status: isVencido(c.data_vencimento, c.status) ? 'vencido' : c.status }))))
      .catch(() => setContas([]))
      .finally(() => setLoading(false));
  }, [statusFiltro, oticaFiltro, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => {}); }, []);

  async function darBaixa() {
    if (!baixando || !dataPgto) return;
    setSalvando(true);
    try {
      await api.patch(`/lab/contas-receber/${baixando.id}`, { status: 'pago', data_pagamento: dataPgto, forma_pgto: formaPgto || null });
      setBaixando(null); load();
    } catch {} finally { setSalvando(false); }
  }

  async function criarConta() {
    if (!novaForm.otica_id || !novaForm.descricao || !novaForm.valor || !novaForm.data_vencimento) return;
    setSalvando(true);
    try {
      await api.post('/lab/contas-receber', { ...novaForm, valor: parseFloat(novaForm.valor) });
      setNovaModal(false); setNovaForm({ otica_id: '', descricao: '', valor: '', data_emissao: new Date().toISOString().split('T')[0], data_vencimento: '', forma_pgto: '', observacoes: '' });
      load();
    } catch {} finally { setSalvando(false); }
  }

  const filtradas = contas.filter(c =>
    !busca || c.otica_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    String(c.numero).includes(busca)
  );

  const totais = {
    aberto: filtradas.filter(c => c.status === 'aberto').reduce((a, c) => a + c.valor, 0),
    vencido: filtradas.filter(c => c.status === 'vencido').reduce((a, c) => a + c.valor, 0),
    pago: filtradas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)', marginRight: '8px' }}>Contas a Receber</h2>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...INP, width: '180px' }} />
        <select value={oticaFiltro} onChange={e => setOticaFiltro(e.target.value)} style={{ ...INP, width: '180px', fontFamily: 'var(--sans)' }}>
          <option value="">Todas as óticas</option>
          {oticas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...INP, width: '135px' }} />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...INP, width: '135px' }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setNovaModal(true)} style={{ padding: '7px 16px', fontSize: '12px', fontWeight: '600', background: '#005500', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Lançar</button>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[['', 'Todos'], ['aberto', 'Em Aberto'], ['vencido', 'Vencidos'], ['pago', 'Pagos']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFiltro(v)}
            style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${statusFiltro === v ? 'var(--border-light)' : 'var(--border)'}`, background: statusFiltro === v ? 'var(--surface-alt)' : 'transparent', color: statusFiltro === v ? 'var(--text)' : 'var(--text-muted)' }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'var(--mono)' }}>
          <span style={{ color: 'var(--amber)' }}>Aberto: <b>{brl(totais.aberto)}</b></span>
          <span style={{ color: 'var(--red)' }}>Vencido: <b>{brl(totais.vencido)}</b></span>
          <span style={{ color: 'var(--green)' }}>Pago: <b>{brl(totais.pago)}</b></span>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          : filtradas.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum lançamento encontrado.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {['Nº', 'Ótica', 'Descrição', 'OS', 'Emissão', 'Vencimento', 'Pgto', 'Valor', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>#{String(c.numero).padStart(4, '0')}</td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--text)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.otica_nome}</td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--text-dim)' }}>{c.descricao}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{c.ordem_numero ? `#${String(c.ordem_numero).padStart(4,'0')}` : '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmtDate(c.data_emissao)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', color: c.status === 'vencido' ? 'var(--red)' : 'var(--text-dim)', fontWeight: c.status === 'vencido' ? '700' : '400' }}>{fmtDate(c.data_vencimento)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--green)', whiteSpace: 'nowrap' }}>{fmtDate(c.data_pagamento)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '13px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--text)', textAlign: 'right' }}>{brl(c.valor)}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '600', color: STATUS_COLOR[c.status], background: `${STATUS_COLOR[c.status]}18`, padding: '2px 7px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {c.status !== 'pago' && (
                        <button onClick={() => { setBaixando(c); setDataPgto(new Date().toISOString().split('T')[0]); setFormaPgto(''); }}
                          style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '5px', border: '1px solid var(--green)', background: 'var(--green-dim)', color: 'var(--green)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          Dar Baixa
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
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', width: '380px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Dar Baixa — #{String(baixando.numero).padStart(4,'0')}</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '14px' }}>
              <b style={{ color: 'var(--text)' }}>{baixando.otica_nome}</b> — {brl(baixando.valor)}
            </div>
            <div style={{ marginBottom: '10px' }}><label style={LBL}>Data de Pagamento *</label><input type="date" value={dataPgto} onChange={e => setDataPgto(e.target.value)} style={INP} /></div>
            <div style={{ marginBottom: '16px' }}>
              <label style={LBL}>Forma de Pagamento</label>
              <select value={formaPgto} onChange={e => setFormaPgto(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">— Selecionar</option>
                {['Dinheiro','PIX','Transferência','Boleto','Cheque','Cartão Crédito','Cartão Débito','Depósito'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setBaixando(null)} style={{ padding: '8px 18px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={darBaixa} disabled={salvando || !dataPgto} style={{ padding: '8px 22px', fontSize: '13px', fontWeight: '600', background: !dataPgto || salvando ? 'var(--text-muted)' : 'var(--green)', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>{salvando ? '...' : '✓ Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Conta */}
      {novaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', width: '440px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Novo Lançamento — Contas a Receber</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={LBL}>Ótica *</label>
                <select value={novaForm.otica_id} onChange={e => setNovaForm(f => ({ ...f, otica_id: e.target.value }))} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                  <option value="">Selecionar ótica...</option>
                  {oticas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
              <div><label style={LBL}>Descrição *</label><input value={novaForm.descricao} onChange={e => setNovaForm(f => ({ ...f, descricao: e.target.value }))} style={INP} placeholder="Ex: Parcela 1/3 OS #0042" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div><label style={LBL}>Valor *</label><input type="number" step="0.01" value={novaForm.valor} onChange={e => setNovaForm(f => ({ ...f, valor: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Emissão</label><input type="date" value={novaForm.data_emissao} onChange={e => setNovaForm(f => ({ ...f, data_emissao: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Vencimento *</label><input type="date" value={novaForm.data_vencimento} onChange={e => setNovaForm(f => ({ ...f, data_vencimento: e.target.value }))} style={INP} /></div>
              </div>
              <div><label style={LBL}>Observações</label><input value={novaForm.observacoes} onChange={e => setNovaForm(f => ({ ...f, observacoes: e.target.value }))} style={INP} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setNovaModal(false)} style={{ padding: '8px 18px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={criarConta} disabled={salvando} style={{ padding: '8px 22px', fontSize: '13px', fontWeight: '600', background: salvando ? 'var(--text-muted)' : '#005500', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>{salvando ? '...' : 'Lançar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
