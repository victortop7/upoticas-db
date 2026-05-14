import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [aba, setAba] = useState<'oticas' | 'lab'>('oticas');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const isLab = aba === 'lab';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const data = await login(email, senha);
      setAuth(data);
      navigate(data.tenant?.tipo === 'lab' ? '/lab/dashboard' : '/dashboard');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  // ── TEMA ÓTICAS ──────────────────────────────────────
  if (!isLab) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Seletor de aba */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'var(--surface)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
          <button onClick={() => { setAba('oticas'); setErro(''); }}
            style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#16a34a', color: 'white', transition: 'all 0.15s' }}>
            🏪 Conexão Óticas
          </button>
          <button onClick={() => { setAba('lab'); setErro(''); }}
            style={{ flex: 1, padding: '9px', fontSize: '13px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', transition: 'all 0.15s' }}>
            🔬 Conexão Lab
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: '#16a34a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
              </svg>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Conexão <span style={{ color: '#16a34a' }}>Óticas</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>Sistema de Gestão para Óticas</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>Entrar na sua conta</h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-dim)' }}>Bem-vindo de volta!</p>

          {erro && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: '600', background: loading ? '#aaa' : '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" style={{ color: '#16a34a', fontWeight: '500', textDecoration: 'none' }}>Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );

  // ── TEMA LAB (retro) ──────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#c8c4b0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Seletor de aba */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#d4d0c8', border: '2px inset #b0aca4', padding: '4px' }}>
          <button onClick={() => { setAba('oticas'); setErro(''); }}
            style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', border: '2px outset #b0aca4', cursor: 'pointer', background: '#dedad2', color: '#444', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏪 Conexão Óticas
          </button>
          <button onClick={() => { setAba('lab'); setErro(''); }}
            style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', border: '2px inset #b0aca4', cursor: 'pointer', background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔬 Conexão Lab
          </button>
        </div>

        {/* Header retro */}
        <div style={{ background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', padding: '10px 16px', fontWeight: '700', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', border: '2px outset #007700', marginBottom: '0', textAlign: 'center' }}>
          🔬 Conexão Lab
        </div>
        <div style={{ background: '#d4d0c8', border: '2px inset #b0aca4', padding: '28px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sistema para Laboratórios Ópticos</div>
          </div>

          {erro && (
            <div style={{ background: '#ffdddd', border: '1px solid #880000', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#880000', fontWeight: '700', fontFamily: "'Courier New', monospace" }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #999', background: '#fff', color: '#000', outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #999', background: '#fff', color: '#000', outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: '700', background: loading ? '#888' : 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', border: '2px outset #007700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              {loading ? 'AGUARDE...' : 'ENTRAR NO SISTEMA'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: '#666', fontFamily: "'Courier New', monospace" }}>
          Conexão Lab v1.0 — Sistema para Laboratórios Ópticos
        </div>
      </div>
    </div>
  );
}
