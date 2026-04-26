import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface Movimentacao { id: string; tipo: string; descricao: string; valor: number; data: string; categoria?: string; conta_nome?: string; }
interface Conta { id: string; nome: string; tipo: string; }
interface CaixaResp { data: string; movimentacoes: Movimentacao[]; totais: { entradas: number; saidas: number; saldo: number }; }

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function hoje() { return new Date().toISOString().split('T')[0]; }
function fmtDateBR(s: string) { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; }

function MovModal({ contas, data, onClose, onSaved }: { contas: Conta[]; data: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ tipo: 'entrada', descricao: '', valor: '', conta_id: contas[0]?.id || '', categoria: '', data });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro('Descrição é obrigatória'); return; }
    if (!form.conta_id) { setErro('Selecione uma conta'); return; }
    setSaving(true); setErro('');
    try { await api.post('/financeiro/caixa', form); onSaved(); }
    catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>Nova Movimentação</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[['entrada', '↑ Entrada', '#16a34a'], ['saida', '↓ Saída', '#dc2626']].map(([val, label, color]) => (
              <button key={val} type="button" onClick={() => setForm(f => ({ ...f, tipo: val }))} style={{
                padding: '10px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${form.tipo === val ? color : 'var(--border)'}`,
                background: form.tipo === val ? `${color}18` : 'transparent', color: form.tipo === val ? color : 'var(--text-dim)',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Descrição *</label><input style={inp} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Pagamento de cliente" autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Valor (R$) *</label><input type="number" step="0.01" min="0" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
            <div><label style={lbl}>Data</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Conta *</label>
              <select style={inp} value={form.conta_id} onChange={e => setForm(f => ({ ...f, conta_id: e.target.value }))}>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Categoria</label><input style={inp} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ex: Venda" /></div>
          </div>
          {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Salvando...' : 'Lançar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Caixa() {
  const [dataSel, setDataSel] = useState(hoje());
  const [contaSel, setContaSel] = useState('');
  const [caixa, setCaixa] = useState<CaixaResp | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ data: dataSel });
      if (contaSel) params.set('conta_id', contaSel);
      const [res, cf] = await Promise.all([
        api.get<CaixaResp>(`/financeiro/caixa?${params}`),
        api.get<Conta[]>('/financeiro/contas'),
      ]);
      setCaixa(res); setContas(cf);
    } finally { setLoading(false); }
  }, [dataSel, contaSel]);

  useEffect(() => { load(); }, [load]);

  function navData(delta: number) {
    const d = new Date(dataSel + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setDataSel(d.toISOString().split('T')[0]);
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta movimentação?')) return;
    await api.delete(`/financeiro/caixa/${id}`);
    load();
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Caixa</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Movimentações do dia</p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Lançamento</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 8px' }}>
          <button onClick={() => navData(-1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-dim)' }}>‹</button>
          <input type="date" value={dataSel} onChange={e => setDataSel(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'var(--mono)', background: 'transparent', color: 'var(--text)' }} />
          <button onClick={() => navData(1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-dim)' }}>›</button>
        </div>
        <select value={contaSel} onChange={e => setContaSel(e.target.value)} style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}>
          <option value="">Todas as contas</option>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <button onClick={() => setDataSel(hoje())} style={{ padding: '8px 14px', fontSize: '13px', background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Hoje</button>
      </div>

      {/* KPIs */}
      {caixa && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Entradas', value: brl(caixa.totais.entradas), color: '#16a34a' },
            { label: 'Saídas', value: brl(caixa.totais.saidas), color: '#dc2626' },
            { label: 'Saldo do dia', value: brl(caixa.totais.saldo), color: caixa.totais.saldo >= 0 ? '#16a34a' : '#dc2626' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--mono)', color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Tipo', 'Descrição', 'Conta', 'Categoria', 'Valor', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !caixa?.movimentacoes.length ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                Nenhuma movimentação em {fmtDateBR(dataSel)}.
              </td></tr>
            ) : caixa.movimentacoes.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: i < caixa.movimentacoes.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                    {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)' }}>{m.descricao}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{(m as any).conta_nome || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{m.categoria || '—'}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                  {m.tipo === 'saida' ? '-' : ''}{brl(m.valor)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => excluir(m.id)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <MovModal contas={contas} data={dataSel} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
