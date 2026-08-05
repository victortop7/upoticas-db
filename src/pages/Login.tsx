import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { login } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import InstallAppButton from '../components/InstallAppButton';
import { homeLab } from '../lib/labPerms';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  // App instalado antigo abria em /login?sistema=lab — manda pro login do LAB
  const sistemaInicial = new URLSearchParams(window.location.search).get('sistema');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const data = await login(email, senha);
      setAuth(data);
      navigate(data.tenant?.tipo === 'lab' ? homeLab(data.usuario?.perfil) : '/dashboard');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  if (sistemaInicial === 'lab') return <Navigate to="/lab/login" replace />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <img src="/brand-192.png" alt="Conexão Óticas" width="40" height="40" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border)' }} />
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Connect <span style={{ color: '#16a34a' }}>Óticas</span>
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

          <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>E-mail</label>
              <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>Senha</label>
              <input type="password" name="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
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

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <InstallAppButton alwaysShow label="Instalar aplicativo no computador"
            style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '6px' }} />
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <Link to="/lab/login" style={{ fontSize: '12.5px', color: 'var(--text-muted)', textDecoration: 'none' }}>É um laboratório? Acessar o Connect LAB →</Link>
        </div>
      </div>
    </div>
  );
}
