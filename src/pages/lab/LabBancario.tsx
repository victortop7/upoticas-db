import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';

interface Lancamento {
  id: string; numero: number; conta_codigo: string; conta_nome: string;
  tipo: 'C' | 'D'; descricao: string; valor: number;
  data_movimento: string; data_emissao: string;
  forma_pgto: string | null; observacoes: string | null;
  saldo_parcial: number;
}

interface ContaBancaria { codigo: string; nome: string; }

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const INP: React.CSSProperties = { padding: '7px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)', width: '100%', boxSizing: 'border-box' };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };

export default function LabBancario() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [contaSel, setContaSel] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [dataIni, setDataIni] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [novaModal, setNovaModal] = useState(false);
  const [novaForm, setNovaForm] = useState({ conta_codigo: '', tipo: 'C', descricao: '', valor: '', data_movimento: new Date().toISOString().split('T')[0], data_emissao: new Date().toISOString().split('T')[0], forma_pgto: '', observacoes: '' });
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (contaSel) p.set('conta', contaSel);
    if (tipoFiltro) p.set('tipo', tipoFiltro);
    if (dataIni) p.set('data_ini', dataIni);
    if (dataFim) p.set('data_fim', dataFim);
    api.get<Lancamento[]>(`/lab/bancario?${p}`)
      .then(setLancamentos).catch(() => setLancamentos([]))
      .finally(() => setLoading(false));
  }, [contaSel, tipoFiltro, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get<ContaBancaria[]>('/lab/bancario/contas').then(setContas).catch(() => {});
  }, []);

  async function lancar() {
    if (!novaForm.conta_codigo || !novaForm.descricao || !novaForm.valor || !novaForm.data_movimento) return;
    setSalvando(true);
    try {
      await api.post('/lab/bancario', { ...novaForm, valor: parseFloat(novaForm.valor) });
      setNovaModal(false);
      setNovaForm({ conta_codigo: '', tipo: 'C', descricao: '', valor: '', data_movimento: new Date().toISOString().split('T')[0], data_emissao: new Date().toISOString().split('T')[0], forma_pgto: '', observacoes: '' });
      load();
    } catch {} finally { setSalvando(false); }
  }

  // Calc saldo
  const entradas = lancamentos.filter(l => l.tipo === 'C').reduce((a, l) => a + l.valor, 0);
  const saidas   = lancamentos.filter(l => l.tipo === 'D').reduce((a, l) => a + l.valor, 0);
  const saldo    = entradas - saidas;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)', marginRight: '8px' }}>Controle Bancário</h2>
        <select value={contaSel} onChange={e => setContaSel(e.target.value)} style={{ ...INP, width: '200px', fontFamily: 'var(--sans)' }}>
          <option value="">Todas as contas</option>
          {contas.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
        </select>
        <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...INP, width: '135px' }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>até</span>
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...INP, width: '135px' }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setNovaModal(true)} style={{ padding: '7px 16px', fontSize: '12px', fontWeight: '600', background: '#005500', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Lançamento</button>
        </div>
      </div>

      {/* Filtros tipo + saldo */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[['', 'Todos'], ['C', 'Créditos'], ['D', 'Débitos']].map(([v, l]) => (
          <button key={v} onClick={() => setTipoFiltro(v)} style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${tipoFiltro === v ? 'var(--border-light)' : 'var(--border)'}`, background: tipoFiltro === v ? 'var(--surface-alt)' : 'transparent', color: tipoFiltro === v ? 'var(--text)' : 'var(--text-muted)' }}>{l}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', fontSize: '12px', fontFamily: 'var(--mono)' }}>
          <span style={{ color: 'var(--green)' }}>Entradas: <b>{brl(entradas)}</b></span>
          <span style={{ color: 'var(--red)' }}>Saídas: <b>{brl(saidas)}</b></span>
          <span style={{ color: saldo >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: '700' }}>Saldo: <b>{brl(saldo)}</b></span>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          : lancamentos.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum lançamento no período.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {['Nº', 'Data Mov.', 'Conta', 'Descrição', 'Tipo', 'Valor', 'Saldo Parcial'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lancamentos.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>#{String(l.numero).padStart(4,'0')}</td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmtDate(l.data_movimento)}</td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--text-dim)' }}>{l.conta_codigo} — {l.conta_nome}</td>
                    <td style={{ padding: '9px 12px', fontSize: '13px', color: 'var(--text)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.descricao}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: l.tipo === 'C' ? 'var(--green)' : 'var(--red)', background: l.tipo === 'C' ? 'var(--green-dim)' : 'var(--red-dim)', padding: '2px 8px', borderRadius: '20px' }}>
                        {l.tipo === 'C' ? '▲ Crédito' : '▼ Débito'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: '13px', fontFamily: 'var(--mono)', fontWeight: '700', color: l.tipo === 'C' ? 'var(--green)' : 'var(--red)', textAlign: 'right' }}>
                      {l.tipo === 'C' ? '+' : '-'}{brl(l.valor)}
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: 'var(--mono)', color: l.saldo_parcial >= 0 ? 'var(--text)' : 'var(--red)', textAlign: 'right' }}>{brl(l.saldo_parcial)}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>

      {/* Modal Lançamento */}
      {novaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', width: '460px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Novo Lançamento Bancário</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LBL}>Conta *</label>
                  <select value={novaForm.conta_codigo} onChange={e => setNovaForm(f => ({ ...f, conta_codigo: e.target.value }))} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                    <option value="">Selecionar conta...</option>
                    {contas.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Tipo *</label>
                  <select value={novaForm.tipo} onChange={e => setNovaForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                    <option value="C">▲ Crédito (Entrada)</option>
                    <option value="D">▼ Débito (Saída)</option>
                  </select>
                </div>
              </div>
              <div><label style={LBL}>Descrição *</label><input value={novaForm.descricao} onChange={e => setNovaForm(f => ({ ...f, descricao: e.target.value }))} style={INP} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div><label style={LBL}>Valor *</label><input type="number" step="0.01" value={novaForm.valor} onChange={e => setNovaForm(f => ({ ...f, valor: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Data Movimento *</label><input type="date" value={novaForm.data_movimento} onChange={e => setNovaForm(f => ({ ...f, data_movimento: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Forma Pgto</label>
                  <select value={novaForm.forma_pgto} onChange={e => setNovaForm(f => ({ ...f, forma_pgto: e.target.value }))} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                    <option value="">—</option>
                    {['Dinheiro','PIX','Transferência','Boleto','Cheque','Cartão','Depósito'].map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={LBL}>Observações</label><input value={novaForm.observacoes} onChange={e => setNovaForm(f => ({ ...f, observacoes: e.target.value }))} style={INP} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setNovaModal(false)} style={{ padding: '8px 18px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={lancar} disabled={salvando} style={{ padding: '8px 22px', fontSize: '13px', fontWeight: '600', background: salvando ? 'var(--text-muted)' : '#005500', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>{salvando ? '...' : 'Lançar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
