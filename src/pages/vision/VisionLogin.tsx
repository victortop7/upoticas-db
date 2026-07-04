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
      padding: 20, position: 'relative', overflow: 'hidden',
      background: '#060a16',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Fundo futurista */}
      <div style={{ position: 'absolute', inset: 0, background: '#060a16', zIndex: 0 }} />
      {/* Glows radiais */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background:
        'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(0,122,255,0.28), transparent 60%),' +
        'radial-gradient(ellipse 55% 45% at 85% 100%, rgba(59,166,255,0.22), transparent 60%),' +
        'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(30,80,200,0.14), transparent 70%)',
      }} />
      {/* Grade tech */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5,
        backgroundImage: 'linear-gradient(rgba(120,170,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,170,255,0.06) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 40%, transparent 100%)',
      }} />
      {/* Orbes de brilho animados */}
      <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,122,255,0.35), transparent 65%)', filter: 'blur(30px)', zIndex: 0,
        animation: 'orb1 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-12%', right: '-6%', width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,166,255,0.3), transparent 65%)', filter: 'blur(34px)', zIndex: 0,
        animation: 'orb2 15s ease-in-out infinite' }} />
      {/* Linha de luz varrendo */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, width: 220, zIndex: 0,
        background: 'linear-gradient(100deg, transparent, rgba(120,180,255,0.10), transparent)',
        transform: 'skewX(-14deg)', animation: 'sweepLogin 9s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src="/vision-icon.png" alt="Connect Vision" style={{
            width: 76, height: 76, borderRadius: 19, margin: '0 auto 14px',
            objectFit: 'cover', display: 'block',
            boxShadow: '0 12px 40px rgba(0,122,255,0.5), 0 0 0 1px rgba(120,170,255,0.2)',
          }} />
          <div style={{ fontSize: 25, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.5px' }}>
            Connect <span style={{ color: '#3ba6ff' }}>Vision</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(180,205,255,0.6)', marginTop: 3, letterSpacing: '0.02em' }}>Simulador para óticas</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,20,60,0.5), 0 0 0 1px rgba(120,170,255,0.18), 0 0 40px rgba(0,122,255,0.15)', backdropFilter: 'blur(10px)' }}>
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

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'rgba(160,190,255,0.5)' }}>
          Conexão Óticas · Connect Vision
        </div>
      </div>

      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: .8; }
          50% { transform: translate(40px, 30px) scale(1.15); opacity: 1; }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: .7; }
          50% { transform: translate(-36px, -28px) scale(1.12); opacity: 1; }
        }
        @keyframes sweepLogin {
          0% { left: -25%; opacity: 0; }
          15% { opacity: 1; }
          45% { left: 115%; opacity: 0; }
          100% { left: 115%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
