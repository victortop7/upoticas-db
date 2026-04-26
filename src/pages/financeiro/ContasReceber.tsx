import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { Cliente } from '../../types';

interface ContaReceber { id: string; descricao: string; cliente_id?: string; cliente_nome?: string; categoria?: string; valor: number; data_vencimento: string; data_recebimento?: string; situacao: string; forma_recebimento?: string; observacao?: string; }
interface Conta { id: string; nome: string; }

const SIT_COLOR: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  vencido:   { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  recebido:  { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  cancelado: { bg: 'var(--surface-alt)', color: 'var(--text-muted)' },
};
const SIT_LABEL: Record<string, string> = { pendente: 'Pendente', vencido: 'Vencido', recebido: 'Recebido', cancelado: 'Cancelado' };
const FORMAS = ['Dinheiro','Pix','Crédito','Débito','Transferência','Boleto','Outro'];
const CATEGORIAS = ['Venda','OS','Serviço','Outros'];

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s?: string) { if (!s) return '—'; const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }

function Modal({ conta, onClose, onSaved }: { conta: ContaReceber | null; contas: Conta[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ descricao: '', cliente_id: '', categoria: 'Outros', valor: '', data_vencimento: '', observacao: '' });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<{ clientes: Cliente[] }>('/clientes?page=1').then(r => setClientes(r.clientes)).catch(() => {});
    if (conta) setForm({ descricao: conta.descricao, cliente_id: conta.cliente_id || '', categoria: conta.categoria || 'Outros', valor: String(conta.valor), data_vencimento: conta.data_vencimento, observacao: conta.observacao || '' });
    else setForm({ descricao: '', cliente_id: '', categoria: 'Outros', valor: '', data_vencimento: '', observacao: '' });
  }, [conta]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErro('');
    try {
      if (conta) await api.put(`/financeiro/contas-receber/${conta.id}`, form);
      else await api.post('/financeiro/contas-receber', form);
      onSaved();
    } catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{conta ? 'Editar' : 'Nova Conta a Receber'}</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Descrição *</label><input style={inp} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Cliente</label>
              <select style={inp} value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">— Nenhum —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Categoria</label>
              <select style={inp} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Valor (R$) *</label><input type="number" step="0.01" min="0" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
            <div><label style={lbl}>Vencimento *</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Observação</label><textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} /></div>
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

function ReceberModal({ conta, contas, onClose, onSaved }: { conta: ContaReceber; contas: Conta[]; onClose: () => void; onSaved: () => void }) {
  const hoje = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ data_recebimento: hoje, forma_recebimento: 'Pix', conta_id: contas[0]?.id || '' });
  const [saving, setSaving] = useState(false);
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await api.put(`/financeiro/contas-receber/${conta.id}`, { acao: 'receber', ...form }); onSaved(); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>Registrar Recebimento</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{conta.descricao} — <strong style={{ fontFamily: 'var(--mono)', color: '#16a34a' }}>{brl(conta.valor)}</strong></p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Data do Recebimento</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data_recebimento} onChange={e => setForm(f => ({ ...f, data_recebimento: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Forma</label>
              <select style={inp} value={form.forma_recebimento} onChange={e => setForm(f => ({ ...f, forma_recebimento: e.target.value }))}>
                {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Conta</label>
              <select style={inp} value={form.conta_id} onChange={e => setForm(f => ({ ...f, conta_id: e.target.value }))}>
                <option value="">— Nenhuma —</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? '...' : '✓ Confirmar Recebimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Resp { contas: ContaReceber[]; total: number; pages: number; totais: { pendente: number; recebido: number }; }

export default function ContasReceber() {
  const [data, setData] = useState<Resp | null>(null);
  const [contasFin, setContasFin] = useState<Conta[]>([]);
  const [situacao, setSituacao] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [receberModal, setReceberModal] = useState<ContaReceber | null>(null);
  const [editando, setEditando] = useState<ContaReceber | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (situacao) params.set('situacao', situacao);
      const [res, cf] = await Promise.all([
        api.get<Resp>(`/financeiro/contas-receber?${params}`),
        api.get<Conta[]>('/financeiro/contas'),
      ]);
      setData(res); setContasFin(cf);
    } finally { setLoading(false); }
  }, [situacao, page]);

  useEffect(() => { load(); }, [load]);

  async function excluir(id: string) {
    if (!confirm('Excluir esta conta?')) return;
    await api.delete(`/financeiro/contas-receber/${id}`);
    load();
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', fontSize: '12px', fontWeight: '500', border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text-dim)' });

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Contas a Receber</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>{data?.total ?? '...'} contas</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Nova Conta</button>
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {[{ label: 'Pendente / Vencido', value: brl(data.totais.pendente), color: '#d97706' }, { label: 'Recebido', value: brl(data.totais.recebido), color: '#16a34a' }].map((c, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--mono)', color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[['', 'Todas'], ['pendente', 'Pendentes'], ['vencido', 'Vencidas'], ['recebido', 'Recebidas']].map(([val, label]) => (
          <button key={val} style={filterBtn(situacao === val)} onClick={() => { setSituacao(val); setPage(1); }}>{label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Descrição', 'Cliente', 'Vencimento', 'Valor', 'Situação', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !data?.contas.length ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma conta encontrada.</td></tr>
            ) : data.contas.map((c, i) => {
              const sc = SIT_COLOR[c.situacao] || SIT_COLOR.pendente;
              return (
                <tr key={c.id} style={{ borderBottom: i < data.contas.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{c.descricao}</div>
                    {c.categoria && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.categoria}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{(c as any).cliente_nome || '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: c.situacao === 'vencido' ? '#dc2626' : 'var(--text-dim)' }}>
                    {fmtDate(c.data_vencimento)}
                    {c.data_recebimento && <div style={{ fontSize: '11px', color: '#16a34a' }}>Recebido: {fmtDate(c.data_recebimento)}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{brl(c.valor)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: sc.bg, color: sc.color }}>{SIT_LABEL[c.situacao]}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {c.situacao !== 'recebido' && (
                      <button onClick={() => setReceberModal(c)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '6px', background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Receber</button>
                    )}
                    <button onClick={() => { setEditando(c); setModalOpen(true); }} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '6px', background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => excluir(c.id)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', fontSize: '14px', background: p === page ? 'var(--primary)' : 'var(--surface)', color: p === page ? 'white' : 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}

      {modalOpen && <Modal conta={editando} contas={contasFin} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
      {receberModal && <ReceberModal conta={receberModal} contas={contasFin} onClose={() => setReceberModal(null)} onSaved={() => { setReceberModal(null); load(); }} />}
    </div>
  );
}
