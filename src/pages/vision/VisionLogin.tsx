import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/auth';
import { useAuth } from '../../hooks/useAuth';

// Credenciais salvas no tablet (login de 1 toque). Chave local.
const CRED_KEY = 'cv_creds';

function loadCreds(): { email: string; senha: string } | null {
  try { const r = localStorage.getItem(CRED_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function VisionLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const salvo = loadCreds();
  const [email, setEmail] = useState(salvo?.email || '');
  const [senha, setSenha] = useState(salvo?.senha || '');
  const [lembrar, setLembrar] = useState(!!salvo);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandir, setExpandir] = useState(!salvo); // se já tem login salvo, mostra o botão rápido primeiro

  useEffect(() => { document.title = 'Connect Vision — Entrar'; }, []);

  async function entrar(e?: React.FormEvent) {
    e?.preventDefault();
    setErro(''); setLoading(true);
    try {
      const data = await login(email, senha);
      setAuth(data);
      if (lembrar) localStorage.setItem(CRED_KEY, JSON.stringify({ email, senha }));
      else localStorage.removeItem(CRED_KEY);
      navigate('/vision', { replace: true });
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar');
      setExpandir(true);
    } finally { setLoading(false); }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 15px', fontSize: 15, borderRadius: 12,
    border: '1px solid #d1d1d6', background: '#fff', color: '#1c1c1e',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'linear-gradient(180deg, #eaf3ff 0%, #f2f2f7 60%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 14px',
            background: 'linear-gradient(180deg, #3ba6ff, #007aff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <circle cx="9" cy="11" r="2.2" /><circle cx="15" cy="11" r="2.2" />
              <path d="M11.2 11h1.6M2 8h2M20 8h2" />
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Connect <span style={{ color: '#007aff' }}>Vision</span>
          </div>
          <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 3 }}>Simulador para óticas</div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 20px rgba(15,23,42,0.08)' }}>
          {erro && (
            <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13.5, color: '#d70015', fontWeight: 500 }}>
              {erro}
            </div>
          )}

          {/* Login rápido (1 toque) quando há credenciais salvas */}
          {salvo && !expandir ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: '#8e8e93' }}>Conectar como</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1e' }}>{salvo.email}</div>
              </div>
              <button onClick={() => entrar()} disabled={loading} style={{
                width: '100%', padding: '14px', fontSize: 16, fontWeight: 600, borderRadius: 12, border: 'none',
                background: loading ? '#9dc7ff' : '#007aff', color: '#fff', cursor: loading ? 'default' : 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>{loading ? 'Conectando…' : 'Conectar'}</button>
              <button onClick={() => setExpandir(true)} style={{
                width: '100%', padding: '10px', fontSize: 14, fontWeight: 500, borderRadius: 12,
                border: 'none', background: 'transparent', color: '#007aff', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}>Entrar com outra conta</button>
            </div>
          ) : (
            <form onSubmit={entrar} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3a3a3c', marginBottom: 6 }}>E-mail</label>
                <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                  style={inp} onFocus={e => e.target.style.borderColor = '#007aff'} onBlur={e => e.target.style.borderColor = '#d1d1d6'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3a3a3c', marginBottom: 6 }}>Senha</label>
                <input type="password" name="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                  style={inp} onFocus={e => e.target.style.borderColor = '#007aff'} onBlur={e => e.target.style.borderColor = '#d1d1d6'} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#3a3a3c', cursor: 'pointer' }}>
                <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#007aff', cursor: 'pointer' }} />
                Salvar login neste dispositivo
              </label>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', fontSize: 16, fontWeight: 600, borderRadius: 12, border: 'none',
                background: loading ? '#9dc7ff' : '#007aff', color: '#fff', cursor: loading ? 'default' : 'pointer', marginTop: 2,
                WebkitTapHighlightColor: 'transparent',
              }}>{loading ? 'Entrando…' : 'Entrar'}</button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: '#aeaeb2' }}>
          Conexão Óticas · Connect Vision
        </div>
      </div>
    </div>
  );
}
