import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Fornecedor {
  id: string; nome: string; fantasia?: string; cnpj?: string; ie?: string;
  telefone?: string; celular?: string; email?: string; contato?: string;
  endereco?: string; bairro?: string; cidade?: string; uf?: string; cep?: string; observacao?: string;
}

const FORM_VAZIO: Omit<Fornecedor, 'id'> = {
  nome: '', fantasia: '', cnpj: '', ie: '', telefone: '', celular: '',
  email: '', contato: '', endereco: '', bairro: '', cidade: '', uf: '', cep: '', observacao: '',
};

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Fornecedores() {
  const [lista, setLista] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (busca) p.set('q', busca);
    api.get<Fornecedor[]>(`/fornecedores?${p}`)
      .then(setLista).catch(() => setLista([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [busca]);

  function abrirNovo() { setEditando(null); setForm({ ...FORM_VAZIO }); setErro(''); setModal(true); }
  function abrirEditar(f: Fornecedor) {
    setEditando(f);
    setForm({ nome: f.nome, fantasia: f.fantasia || '', cnpj: f.cnpj || '', ie: f.ie || '', telefone: f.telefone || '', celular: f.celular || '', email: f.email || '', contato: f.contato || '', endereco: f.endereco || '', bairro: f.bairro || '', cidade: f.cidade || '', uf: f.uf || '', cep: f.cep || '', observacao: f.observacao || '' });
    setErro(''); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      if (editando) await api.put(`/fornecedores/${editando.id}`, form);
      else await api.post('/fornecedores', form);
      setModal(false); load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir fornecedor "${nome}"?`)) return;
    await api.delete(`/fornecedores/${id}`); load();
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl = (t: string) => <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{t}</label>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Fornecedores</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Fornecedores de lentes, armações e acessórios</p>
        </div>
        <button onClick={abrirNovo} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Novo Fornecedor
        </button>
      </div>

      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, fantasia ou CNPJ..."
        style={{ ...inp, marginBottom: '16px', maxWidth: '400px' }} />

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : lista.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhum fornecedor cadastrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nome / Fantasia', 'CNPJ', 'Telefone', 'E-mail', 'Cidade/UF', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{f.nome}</div>
                    {f.fantasia && <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{f.fantasia}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{f.cnpj || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{f.telefone || f.celular || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{f.email || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{f.cidade && f.uf ? `${f.cidade}/${f.uf}` : f.cidade || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => abrirEditar(f)} style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', background: 'var(--primary-dim)', color: 'var(--primary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => excluir(f.id, f.nome)} style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ gridColumn: '1 / -1' }}>{lbl('Razão Social *')}<input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inp} /></div>
                <div>{lbl('Nome Fantasia')}<input value={form.fantasia} onChange={e => setForm(f => ({ ...f, fantasia: e.target.value }))} style={inp} /></div>
                <div>{lbl('Contato')}<input value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} style={inp} /></div>
                <div>{lbl('CNPJ')}<input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" style={{ ...inp, fontFamily: 'var(--mono)' }} /></div>
                <div>{lbl('IE')}<input value={form.ie} onChange={e => setForm(f => ({ ...f, ie: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} /></div>
                <div>{lbl('Telefone')}<input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} style={inp} /></div>
                <div>{lbl('Celular')}<input value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} style={inp} /></div>
                <div style={{ gridColumn: '1 / -1' }}>{lbl('E-mail')}<input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} /></div>
                <div style={{ gridColumn: '1 / -1' }}>{lbl('Endereço')}<input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} style={inp} /></div>
                <div>{lbl('Bairro')}<input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} style={inp} /></div>
                <div>{lbl('CEP')}<input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} /></div>
                <div>{lbl('Cidade')}<input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} style={inp} /></div>
                <div>{lbl('UF')}<select value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}><option value="">—</option>{UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                <div style={{ gridColumn: '1 / -1' }}>{lbl('Observação')}<input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} style={inp} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
