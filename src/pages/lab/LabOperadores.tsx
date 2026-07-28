import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';
import { PERFIS_LAB, perfilLabel, perfilCor, normPerfil } from '../../lib/labPerms';
import { useAuth } from '../../hooks/useAuth';

interface Operador { id: string; nome: string; email: string; perfil: string; ativo: number; }

const INP: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '13px',
  background: R.alt, border: '1px solid var(--lab-bdr)',
  borderRadius: '8px', color: R.txt, outline: 'none',
  boxSizing: 'border-box', fontFamily: "'Montserrat', sans-serif",
};

export default function LabOperadores() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const { usuario } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('digitador');
  const [editId, setEditId] = useState<string | null>(null);   // id do operador em edição (null = novo)

  function resetForm() { setNome(''); setEmail(''); setSenha(''); setPerfil('digitador'); setEditId(null); setErro(''); }
  function abrirNovo() { resetForm(); setSucesso(''); setShowForm(true); }
  function abrirEdicao(op: Operador) {
    setEditId(op.id); setNome(op.nome); setEmail(op.email); setSenha(''); setPerfil(normPerfil(op.perfil));
    setErro(''); setSucesso(''); setShowForm(true);
  }
  async function toggleAtivo(op: Operador) {
    try {
      await api.put(`/usuarios/${op.id}`, { nome: op.nome, perfil: op.perfil, ativo: op.ativo ? 0 : 1 });
      load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao alterar situação'); }
  }

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
    // Na criação a senha é obrigatória; na edição, em branco = manter a atual
    if (!editId && senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return; }
    if (editId && senha && senha.length < 6) { setErro('A nova senha deve ter pelo menos 6 caracteres'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/usuarios/${editId}`, { nome, perfil, ...(senha ? { senha } : {}) });
        setSucesso(`Operador "${nome}" atualizado (${perfilLabel(perfil)}).`);
      } else {
        await api.post('/usuarios', { nome, email, senha, perfil });
        setSucesso(`Operador "${nome}" criado como ${perfilLabel(perfil)}.`);
      }
      resetForm();
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1040px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: R.txt }}>Operadores do Sistema</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: R.dim }}>Usuários com acesso ao Connect LAB</p>
        </div>
        <button
          onClick={() => { if (showForm) { setShowForm(false); resetForm(); } else { abrirNovo(); } }}
          style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: R.accent, color: 'var(--lab-on-accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {showForm ? 'Cancelar' : '+ Novo Operador'}
        </button>
      </div>

      {sucesso && (
        <div style={{ background: 'rgba(0,102,0,0.15)', border: '1px solid #006600', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: R.accent }}>
          {sucesso}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSalvar} style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: R.txt, marginBottom: '16px' }}>{editId ? `Editar Operador — ${email}` : 'Novo Operador'}</div>

          {erro && (
            <div style={{ background: 'rgba(200,0,0,0.12)', border: '1px solid #cc0000', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#cc0000' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: R.dim, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} required style={INP} placeholder="Nome completo" />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: R.dim, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-mail {editId ? '(login — não editável)' : '*'}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required={!editId} disabled={!!editId} style={{ ...INP, opacity: editId ? 0.6 : 1, cursor: editId ? 'not-allowed' : 'text' }} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: R.dim, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{editId ? 'Nova senha (opcional)' : 'Senha *'}</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required={!editId} style={INP} placeholder={editId ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'} />
          </div>

          {/* Perfil / permissões */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: R.dim, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Perfil / Permissões *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {PERFIS_LAB.map(p => {
                const on = perfil === p.valor;
                return (
                  <button type="button" key={p.valor} onClick={() => setPerfil(p.valor)}
                    style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                      background: on ? `${p.cor}18` : R.alt, border: `1.5px solid ${on ? p.cor : 'var(--lab-bdr)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: on ? p.cor : R.dim }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: on ? p.cor : R.txt }}>{p.label}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: R.dim, lineHeight: 1.4 }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ padding: '9px 24px', fontSize: '13px', fontWeight: '600', background: saving ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Criar Operador')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: R.dim, fontSize: '13px' }}>Carregando...</div>
      ) : (
        <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lab-bdr)', background: R.alt }}>
                {['Nome', 'E-mail', 'Perfil', 'Situação', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operadores.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: R.dim }}>
                    Nenhum operador cadastrado
                  </td>
                </tr>
              ) : operadores.map((op, i) => (
                <tr key={op.id} style={{ borderBottom: i < operadores.length - 1 ? '1px solid var(--lab-bdr)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: R.txt, fontWeight: '600', whiteSpace: 'nowrap' }}>{op.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: R.dim, fontFamily: "'Courier New', monospace" }}>{op.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '20px', background: `${perfilCor(op.perfil)}1e`, color: perfilCor(op.perfil), border: `1px solid ${perfilCor(op.perfil)}55` }}>
                      {perfilLabel(op.perfil)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: op.ativo ? 'rgba(0,102,0,0.15)' : 'rgba(200,0,0,0.12)',
                      color: op.ativo ? R.accent : '#cc0000',
                    }}>
                      {op.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => abrirEdicao(op)}
                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', background: R.alt, color: R.accent2, border: '1px solid var(--lab-bdr)', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Editar
                      </button>
                      {usuario?.id !== op.id && (
                        <button onClick={() => toggleAtivo(op)}
                          style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', background: 'transparent', color: op.ativo ? '#cc0000' : R.accent, border: `1px solid ${op.ativo ? '#cc0000' : R.accent}55`, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {op.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </div>
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
