import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
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
      navigate('/dashboard');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '40px', height: '40px', background: 'var(--primary)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
              </svg>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Up<span style={{ color: 'var(--primary)' }}>Óticas</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>
            Sistema de Gestão para Óticas
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '600', color: 'var(--text)' }}>
            Entrar na sua conta
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-dim)' }}>
            Bem-vindo de volta!
          </p>

          {erro && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
              fontSize: '14px', color: 'var(--red)'
            }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'var(--surface-alt)', color: 'var(--text)',
                  outline: 'none', transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'var(--surface-alt)', color: 'var(--text)',
                  outline: 'none', transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px', fontSize: '14px', fontWeight: '600',
                background: loading ? 'var(--text-muted)' : 'var(--primary)',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                marginTop: '4px'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
