import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Otica {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  uf?: string;
  ativo: number;
}

export default function LabOticas() {
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', uf: '', cep: '', observacao: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  function load() {
    setLoading(true);
    api.get<Otica[]>('/lab/oticas')
      .then(setOticas)
      .catch(() => setOticas([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      await api.post('/lab/oticas', form);
      setModal(false);
      setForm({ nome: '', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', uf: '', cep: '', observacao: '' });
      load();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Óticas Clientes</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Óticas que enviam OS para seu laboratório</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Nova Ótica
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : oticas.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Nenhuma ótica cadastrada ainda.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nome', 'CNPJ', 'Telefone', 'E-mail', 'Cidade/UF', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oticas.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{o.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.cnpj ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{o.telefone ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{o.email ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{o.cidade && o.uf ? `${o.cidade}/${o.uf}` : o.cidade ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: o.ativo ? 'var(--green)' : 'var(--text-muted)', background: o.ativo ? 'var(--green-dim)' : 'var(--surface-alt)', padding: '3px 8px', borderRadius: '20px' }}>
                      {o.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nova Ótica */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Nova Ótica Cliente</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Nome *</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da ótica" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>CNPJ</label>
                  <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Telefone</label>
                  <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contato@otica.com" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Cidade</label>
                  <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>UF</label>
                  <input value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} maxLength={2} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>CEP</label>
                  <input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Observação</label>
                <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
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
