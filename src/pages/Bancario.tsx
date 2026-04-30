import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

interface Conta {
  id: string; nome: string; banco?: string; agencia?: string;
  conta?: string; tipo: string; saldo_inicial: number; saldo_atual: number;
}
interface Lancamento {
  id: string; conta_id: string; conta_nome: string; tipo: string;
  valor: number; historico: string; documento?: string;
  data_lancamento: string; conciliado: number;
}

const TIPOS_CONTA = ['corrente', 'poupanca', 'caixa', 'investimento'];
const TIPO_LABEL: Record<string, string> = { corrente: 'Conta Corrente', poupanca: 'Poupança', caixa: 'Caixa', investimento: 'Investimento' };

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const [y, m, d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
function today() { return new Date().toISOString().split('T')[0]; }

export default function Bancario() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contaSel, setContaSel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [modalConta, setModalConta] = useState(false);
  const [contaForm, setContaForm] = useState({ nome: '', banco: '', agencia: '', conta: '', tipo: 'corrente', saldo_inicial: '' });
  const [savingConta, setSavingConta] = useState(false);
  const [erroConta, setErroConta] = useState('');

  const [modalLanc, setModalLanc] = useState(false);
  const [lancForm, setLancForm] = useState({ conta_id: '', tipo: 'credito' as 'credito' | 'debito', valor: '', historico: '', documento: '', data_lancamento: today() });
  const [savingLanc, setSavingLanc] = useState(false);
  const [erroLanc, setErroLanc] = useState('');

  const loadContas = useCallback(() => {
    api.get<Conta[]>('/bancario/contas').then(setContas).catch(() => setContas([]));
  }, []);

  const loadLancamentos = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (contaSel) p.set('conta_id', contaSel);
    api.get<Lancamento[]>(`/bancario/lancamentos?${p}`)
      .then(setLancamentos).catch(() => setLancamentos([]))
      .finally(() => setLoading(false));
  }, [contaSel]);

  useEffect(() => { loadContas(); }, [loadContas]);
  useEffect(() => { loadLancamentos(); }, [loadLancamentos]);

  async function salvarConta(e: React.FormEvent) {
    e.preventDefault(); setSavingConta(true); setErroConta('');
    try {
      await api.post('/bancario/contas', { ...contaForm, saldo_inicial: parseFloat(contaForm.saldo_inicial.replace(',', '.')) || 0 });
      setModalConta(false);
      setContaForm({ nome: '', banco: '', agencia: '', conta: '', tipo: 'corrente', saldo_inicial: '' });
      loadContas();
    } catch (err: unknown) { setErroConta(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSavingConta(false);
  }

  async function salvarLancamento(e: React.FormEvent) {
    e.preventDefault(); setSavingLanc(true); setErroLanc('');
    try {
      await api.post('/bancario/lancamentos', { ...lancForm, valor: parseFloat(lancForm.valor.replace(',', '.')) || 0 });
      setModalLanc(false);
      setLancForm({ conta_id: contaSel || '', tipo: 'credito', valor: '', historico: '', documento: '', data_lancamento: today() });
      loadContas(); loadLancamentos();
    } catch (err: unknown) { setErroLanc(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSavingLanc(false);
  }

  async function excluirLanc(id: string) {
    if (!confirm('Excluir este lançamento?')) return;
    await api.delete(`/bancario/lancamentos?id=${id}`);
    loadContas(); loadLancamentos();
  }

  const saldoTotal = contas.reduce((s, c) => s + c.saldo_atual, 0);
  const contaAtual = contas.find(c => c.id === contaSel);

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl = (t: string) => <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{t}</label>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Controle Bancário</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Contas bancárias e lançamentos</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setModalConta(true)} style={{ padding: '9px 16px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nova Conta
          </button>
          <button onClick={() => { setLancForm(f => ({ ...f, conta_id: contaSel || (contas[0]?.id ?? '') })); setErroLanc(''); setModalLanc(true); }}
            style={{ padding: '9px 16px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Lançamento
          </button>
        </div>
      </div>

      {/* Contas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div
          onClick={() => setContaSel('')}
          style={{ background: contaSel === '' ? 'var(--primary-dim)' : 'var(--surface)', border: `1px solid ${contaSel === '' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Todas as Contas</div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--mono)', color: saldoTotal >= 0 ? 'var(--green)' : 'var(--red)' }}>{brl(saldoTotal)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{contas.length} conta(s)</div>
        </div>
        {contas.map(c => (
          <div key={c.id} onClick={() => setContaSel(c.id)}
            style={{ background: contaSel === c.id ? 'var(--primary-dim)' : 'var(--surface)', border: `1px solid ${contaSel === c.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{c.nome}</div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: '4px' }}>{TIPO_LABEL[c.tipo]?.split(' ')[0]}</span>
            </div>
            {c.banco && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{c.banco}{c.agencia ? ` · Ag ${c.agencia}` : ''}</div>}
            <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--mono)', color: c.saldo_atual >= 0 ? 'var(--green)' : 'var(--red)' }}>{brl(c.saldo_atual)}</div>
          </div>
        ))}
      </div>

      {/* Extrato */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
            {contaAtual ? `Extrato — ${contaAtual.nome}` : 'Extrato — Todas as Contas'}
          </span>
          {contaAtual && (
            <span style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: contaAtual.saldo_atual >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: '700' }}>
              Saldo: {brl(contaAtual.saldo_atual)}
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : lancamentos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhum lançamento registrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Data', 'Conta', 'Histórico', 'Documento', 'Débito', 'Crédito', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lancamentos.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmtDate(l.data_lancamento)}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{l.conta_nome}</td>
                  <td style={{ padding: '11px 14px', fontSize: '13px', color: 'var(--text)' }}>{l.historico}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{l.documento || '—'}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--red)' }}>
                    {l.tipo === 'debito' ? brl(l.valor) : ''}
                  </td>
                  <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--green)' }}>
                    {l.tipo === 'credito' ? brl(l.valor) : ''}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => excluirLanc(l.id)} style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nova Conta */}
      {modalConta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Nova Conta Bancária</h2>
              <button onClick={() => setModalConta(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erroConta && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erroConta}</div>}
            <form onSubmit={salvarConta} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>{lbl('Nome da Conta *')}<input required value={contaForm.nome} onChange={e => setContaForm(f => ({ ...f, nome: e.target.value }))} style={inp} placeholder="Ex: Bradesco Corrente, Caixa Loja..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>{lbl('Tipo')}<select value={contaForm.tipo} onChange={e => setContaForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>{TIPOS_CONTA.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}</select></div>
                <div>{lbl('Banco')}<input value={contaForm.banco} onChange={e => setContaForm(f => ({ ...f, banco: e.target.value }))} style={inp} placeholder="Ex: Bradesco, Nubank..." /></div>
                <div>{lbl('Agência')}<input value={contaForm.agencia} onChange={e => setContaForm(f => ({ ...f, agencia: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} /></div>
                <div>{lbl('Conta')}<input value={contaForm.conta} onChange={e => setContaForm(f => ({ ...f, conta: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} /></div>
              </div>
              <div>{lbl('Saldo Inicial')}<input value={contaForm.saldo_inicial} onChange={e => setContaForm(f => ({ ...f, saldo_inicial: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0,00" /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalConta(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={savingConta} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {savingConta ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lançamento */}
      {modalLanc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Novo Lançamento</h2>
              <button onClick={() => setModalLanc(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erroLanc && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erroLanc}</div>}
            <form onSubmit={salvarLancamento} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>{lbl('Conta *')}<select required value={lancForm.conta_id} onChange={e => setLancForm(f => ({ ...f, conta_id: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}><option value="">Selecionar...</option>{contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              <div>
                {lbl('Tipo')}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['credito', 'debito'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setLancForm(f => ({ ...f, tipo: t }))}
                      style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', background: lancForm.tipo === t ? (t === 'credito' ? 'var(--green-dim)' : 'var(--red-dim)') : 'transparent', color: lancForm.tipo === t ? (t === 'credito' ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)', border: `1px solid ${lancForm.tipo === t ? (t === 'credito' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}` }}>
                      {t === 'credito' ? '+ Crédito' : '− Débito'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>{lbl('Valor *')}<input required value={lancForm.valor} onChange={e => setLancForm(f => ({ ...f, valor: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0,00" /></div>
                <div>{lbl('Data *')}<input required type="date" value={lancForm.data_lancamento} onChange={e => setLancForm(f => ({ ...f, data_lancamento: e.target.value }))} style={inp} /></div>
              </div>
              <div>{lbl('Histórico *')}<input required value={lancForm.historico} onChange={e => setLancForm(f => ({ ...f, historico: e.target.value }))} style={inp} placeholder="Ex: Pagamento fornecedor, Recebimento cliente..." /></div>
              <div>{lbl('Documento')}<input value={lancForm.documento} onChange={e => setLancForm(f => ({ ...f, documento: e.target.value }))} style={inp} placeholder="NF, Cheque, Transferência..." /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalLanc(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={savingLanc} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: lancForm.tipo === 'credito' ? 'var(--green)' : 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {savingLanc ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
