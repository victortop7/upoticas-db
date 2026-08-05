import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import InstallAppButton from '../components/InstallAppButton';
import { homeLab } from '../lib/labPerms';

// Página de login exclusiva do Connect LAB (tema retrô), separada da de Óticas.
export default function LoginLab() {
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
      navigate(data.tenant?.tipo === 'lab' ? homeLab(data.usuario?.perfil) : '/dashboard');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#c8c4b0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

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

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <InstallAppButton alwaysShow label="Instalar aplicativo no computador"
              style={{ fontSize: '11px', fontWeight: 700, color: '#006600', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Courier New', monospace", padding: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: '#666', fontFamily: "'Courier New', monospace" }}>
          Connect LAB v1.0 — Sistema para Laboratórios Ópticos
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/login" style={{ fontSize: '11px', color: '#555', fontFamily: "'Courier New', monospace", textDecoration: 'none' }}>É uma ótica? Acessar o Connect Óticas →</Link>
        </div>
      </div>
    </div>
  );
}
