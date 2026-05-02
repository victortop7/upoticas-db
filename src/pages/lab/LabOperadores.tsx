import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Operador { id: string; nome: string; email: string; perfil: string; ativo: number; }

const INP: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '13px',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '8px', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'var(--sans)',
};

export default function LabOperadores() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function load() {
    setLoading(true);
    api.get<{ usuarios: Operador[] }>('/usuarios')
      .then(d => setOperadores(d.usuarios))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setSucesso('');
    if (senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return; }
    setSaving(true);
    try {
      await api.post('/usuarios', { nome, email, senha, perfil: 'vendedor' });
      setSucesso(`Operador "${nome}" criado com sucesso.`);
      setNome(''); setEmail(''); setSenha('');
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Operadores do Sistema</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-dim)' }}>Usuários com acesso ao UpÓticas Lab</p>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setErro(''); setSucesso(''); }}
          style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: '#880000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {showForm ? 'Cancelar' : '+ Novo Operador'}
        </button>
      </div>

      {sucesso && (
        <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--green)' }}>
          {sucesso}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSalvar} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>Novo Operador</div>

          {erro && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} required style={INP} placeholder="Nome completo" />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-mail *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={INP} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Senha *</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required style={INP} placeholder="Mínimo 6 caracteres" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ padding: '9px 24px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--text-muted)' : '#880000', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'Criar Operador'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                {['Nome', 'E-mail', 'Situação'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operadores.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Nenhum operador cadastrado
                  </td>
                </tr>
              ) : operadores.map((op, i) => (
                <tr key={op.id} style={{ borderBottom: i < operadores.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: '600' }}>{op.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{op.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: op.ativo ? 'var(--green-dim)' : 'var(--red-dim)',
                      color: op.ativo ? 'var(--green)' : 'var(--red)',
                    }}>
                      {op.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
