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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Seletor de aba */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', background: 'var(--surface)', borderRadius: '18px', padding: '6px', border: '1px solid var(--border)', boxShadow: '0 16px 36px rgba(15, 23, 42, 0.06)' }}>
          <button onClick={() => { setAba('oticas'); setErro(''); }}
            style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '14px', border: 'none', cursor: 'pointer', background: '#16a34a', color: 'white', transition: 'all 0.18s' }}>
            🏪 Connect Óticas
          </button>
          <button onClick={() => { setAba('lab'); setErro(''); }}
            style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', transition: 'all 0.18s' }}>
            🔬 Connect LAB
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #16a34a, #0f8a3a)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 38px rgba(22, 163, 74, 0.18)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
              </svg>
            </div>
            <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.6px' }}>
              Connect <span style={{ color: 'var(--accent)' }}>Óticas</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '15px', margin: 0 }}>Sistema moderno para gestão de óticas</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '36px', boxShadow: '0 24px 68px rgba(15,0,50,0.06)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Entrar na sua conta</h2>
          <p style={{ margin: '0 0 26px', fontSize: '15px', color: 'var(--text-dim)' }}>Acesse o painel com o mesmo padrão visual do app.</p>

          {erro && (
            <div style={{ background: 'rgba(248, 113, 113, 0.14)', border: '1px solid rgba(220, 38, 38, 0.18)', borderRadius: '16px', padding: '14px 16px', marginBottom: '18px', fontSize: '14px', color: 'var(--red)' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>E-mail</label>
              <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                style={{ width: '100%', padding: '14px 16px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#007aff'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>Senha</label>
              <input type="password" name="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = '#007aff'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', background: loading ? 'rgba(22, 163, 74, 0.5)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.18s ease' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Criar conta grátis</Link>
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
            🏪 Connect Óticas
          </button>
          <button onClick={() => { setAba('lab'); setErro(''); }}
            style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', border: '2px inset #b0aca4', cursor: 'pointer', background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔬 Connect LAB
          </button>
        </div>

        {/* Header retro */}
        <div style={{ background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', padding: '10px 16px', fontWeight: '700', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', border: '2px outset #007700', marginBottom: '0', textAlign: 'center' }}>
          🔬 Connect LAB
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

          <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>E-mail</label>
              <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #999', background: '#fff', color: '#000', outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Senha</label>
              <input type="password" name="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #999', background: '#fff', color: '#000', outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: '700', background: loading ? '#888' : 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', border: '2px outset #007700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              {loading ? 'AGUARDE...' : 'ENTRAR NO SISTEMA'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: '#666', fontFamily: "'Courier New', monospace" }}>
          Connect LAB v1.0 — Sistema para Laboratórios Ópticos
        </div>
      </div>
    </div>
  );
}
