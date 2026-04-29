import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Servico {
  id: string;
  nome: string;
  valor_padrao: number;
  ativo: number;
}

export default function LabServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', valor_padrao: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  function load() {
    setLoading(true);
    api.get<Servico[]>('/lab/servicos')
      .then(setServicos)
      .catch(() => setServicos([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      await api.post('/lab/servicos', { nome: form.nome, valor_padrao: parseFloat(form.valor_padrao.replace(',', '.')) || 0 });
      setModal(false);
      setForm({ nome: '', valor_padrao: '' });
      load();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '32px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Catálogo de Serviços</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Serviços que aparecem ao criar uma OS (montagem, surfacagem, etc.)</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Novo Serviço
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : servicos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>Nenhum serviço cadastrado.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exemplos: Montagem Resina, Surfacagem, Antirreflexo...</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Serviço', 'Valor Padrão', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicos.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{s.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                    {s.valor_padrao > 0 ? `R$ ${Number(s.valor_padrao).toFixed(2).replace('.', ',')}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: s.ativo ? 'var(--green)' : 'var(--text-muted)', background: s.ativo ? 'var(--green-dim)' : 'var(--surface-alt)', padding: '3px 8px', borderRadius: '20px' }}>
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Novo Serviço</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Nome do Serviço *</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Montagem Resina" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Valor Padrão (R$)</label>
                <input value={form.valor_padrao} onChange={e => setForm(f => ({ ...f, valor_padrao: e.target.value }))} placeholder="0,00" style={inp} />
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
