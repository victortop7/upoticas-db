import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { register } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';

export default function Cadastro() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') === 'lab' ? 'lab' : 'otica';
  const isLab = tipo === 'lab';

  const [form, setForm] = useState({
    nome_otica: '',
    nome: '',
    email: '',
    senha: '',
    confirmar_senha: '',
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (form.senha !== form.confirmar_senha) {
      setErro('As senhas não coincidem');
      return;
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        nome_otica: form.nome_otica,
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        tipo,
      });
      setAuth(data);
      navigate(isLab ? '/lab/dashboard' : '/dashboard');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface-alt)', color: 'var(--text)',
    outline: 'none', transition: 'border-color 0.15s'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
            {isLab ? 'UpÓticas Lab · ' : ''}Experimente grátis por 14 dias
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
            Criar sua conta
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-dim)' }}>
            Sem cartão de crédito. Cancele quando quiser.
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                {isLab ? 'Nome do Laboratório' : 'Nome da Ótica'}
              </label>
              <input
                name="nome_otica"
                value={form.nome_otica}
                onChange={handleChange}
                required
                placeholder={isLab ? 'Ex: Lab Óptico Central' : 'Ex: Ótica Visão Clara'}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                Seu nome
              </label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                placeholder="Seu nome completo"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                E-mail
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                Senha
              </label>
              <input
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                required
                placeholder="Mínimo 6 caracteres"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
                Confirmar senha
              </label>
              <input
                name="confirmar_senha"
                type="password"
                value={form.confirmar_senha}
                onChange={handleChange}
                required
                placeholder="Repita a senha"
                style={inputStyle}
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
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Ao criar sua conta você concorda com os{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Termos de Uso</span>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
