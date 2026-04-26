import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface Conta { id: string; nome: string; tipo: string; saldo_inicial: number; saldo: number; ativo: boolean; }

const TIPO_ICON: Record<string, string> = { caixa: '🏪', banco: '🏦', cofre: '🔒' };
const TIPO_LABEL: Record<string, string> = { caixa: 'Caixa', banco: 'Banco', cofre: 'Cofre' };

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function ContaModal({ conta, onClose, onSaved }: { conta: Conta | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ nome: '', tipo: 'caixa', saldo_inicial: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (conta) setForm({ nome: conta.nome, tipo: conta.tipo, saldo_inicial: String(conta.saldo_inicial || 0) });
    else setForm({ nome: '', tipo: 'caixa', saldo_inicial: '0' });
  }, [conta]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSaving(true); setErro('');
    try {
      if (conta) await api.put(`/financeiro/contas/${conta.id}`, form);
      else await api.post('/financeiro/contas', form);
      onSaved();
    } catch (err: any) { setErro(err.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{conta ? 'Editar Conta' : 'Nova Conta'}</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Nome *</label><input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Tipo</label>
              <select style={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="caixa">Caixa</option><option value="banco">Banco</option><option value="cofre">Cofre</option>
              </select>
            </div>
            <div><label style={lbl}>Saldo Inicial (R$)</label>
              <input type="number" step="0.01" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.saldo_inicial} onChange={e => setForm(f => ({ ...f, saldo_inicial: e.target.value }))} />
            </div>
          </div>
          {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Contas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Conta | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setContas(await api.get<Conta[]>('/financeiro/contas')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSaldo = contas.reduce((s, c) => s + c.saldo, 0);

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Contas</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Caixa, banco e cofre</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Nova Conta</button>
      </div>

      {/* Saldo total */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo Total</p>
        <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', fontFamily: 'var(--mono)', color: totalSaldo >= 0 ? '#16a34a' : 'var(--red)' }}>{brl(totalSaldo)}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</p> :
          contas.map(c => (
            <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '22px' }}>{TIPO_ICON[c.tipo] || '💰'}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{c.nome}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{TIPO_LABEL[c.tipo]}</p>
                </div>
                <button onClick={() => { setEditando(c); setModalOpen(true); }} style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
              </div>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--mono)', color: c.saldo >= 0 ? '#16a34a' : 'var(--red)' }}>{brl(c.saldo)}</p>
            </div>
          ))
        }
      </div>

      {modalOpen && <ContaModal conta={editando} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
