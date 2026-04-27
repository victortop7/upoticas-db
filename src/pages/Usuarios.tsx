import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'vendedor' | 'caixa';
  ativo: boolean;
}

interface ModalProps {
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}

const PERFIL_LABEL: Record<string, string> = { admin: 'Admin', vendedor: 'Vendedor', caixa: 'Caixa', marketing: 'Marketing' };
const PERFIL_COLOR: Record<string, { bg: string; color: string }> = {
  admin:     { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
  vendedor:  { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' },
  caixa:     { bg: 'rgba(34,197,94,0.1)', color: '#16a34a' },
  marketing: { bg: 'rgba(236,72,153,0.1)', color: '#db2777' },
};

function UsuarioModal({ usuario, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'vendedor', senha: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (usuario) setForm({ nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, senha: '' });
    else setForm({ nome: '', email: '', perfil: 'vendedor', senha: '' });
  }, [usuario]);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErro('');
    try {
      if (usuario) {
        await api.put(`/usuarios/${usuario.id}`, form);
      } else {
        await api.post('/usuarios', form);
      }
      onSaved();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Nome *</label>
            <input style={inputStyle} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" autoFocus />
          </div>
          {!usuario && (
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>E-mail *</label>
              <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Perfil</label>
              <select style={inputStyle} value={form.perfil} onChange={e => set('perfil', e.target.value)}>
                <option value="admin">Admin</option>
                <option value="vendedor">Vendedor</option>
                <option value="caixa">Caixa</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{usuario ? 'Nova Senha (opcional)' : 'Senha *'}</label>
              <input type="password" style={inputStyle} value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            {erro && <span style={{ fontSize: '13px', color: 'var(--red)', flex: 1, display: 'flex', alignItems: 'center' }}>{erro}</span>}
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Salvando...' : usuario ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Usuarios() {
  const { usuario: meUsuario } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ usuarios: Usuario[] }>('/usuarios');
      setUsuarios(res.usuarios);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function desativar(id: string, nome: string) {
    if (!confirm(`Desativar usuário "${nome}"?`)) return;
    await api.delete(`/usuarios/${id}`);
    load();
  }

  const isAdmin = meUsuario?.perfil === 'admin';

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Usuários</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-dim)' }}>
            {usuarios.filter(u => u.ativo).length} usuários ativos
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditando(null); setModalOpen(true); }} style={{
            padding: '9px 18px', fontSize: '14px', fontWeight: '600',
            background: 'var(--primary)', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
          }}>+ Novo Usuário</button>
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'E-mail', 'Perfil', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !usuarios.length ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhum usuário encontrado.</td></tr>
            ) : usuarios.map((u, i) => {
              const pc = PERFIL_COLOR[u.perfil] || PERFIL_COLOR.vendedor;
              const isMe = u.id === meUsuario?.id;
              return (
                <tr key={u.id} style={{ borderBottom: i < usuarios.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {u.nome}
                      {isMe && <span style={{ fontSize: '11px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>Você</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: pc.bg, color: pc.color }}>
                      {PERFIL_LABEL[u.perfil]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: u.ativo ? '#16a34a' : '#dc2626' }}>
                      {u.ativo ? '● Ativo' : '● Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditando(u); setModalOpen(true); }} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '6px', background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
                        {!isMe && u.ativo && (
                          <button onClick={() => desativar(u.id, u.nome)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Desativar</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <UsuarioModal
          usuario={editando}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
