import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/auth';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import ForcarPaisagem from '../../components/ForcarPaisagem';

// Credenciais salvas no tablet (login de 1 toque). Chave local.
const CRED_KEY = 'cv_creds';
// WhatsApp do especialista (Victor) para solicitar código de teste grátis
const ESPECIALISTA_WA = '5585991507887';

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

  // Teste grátis por código
  const [modoTeste, setModoTeste] = useState(false);
  const [tCodigo, setTCodigo] = useState('');
  const [tOtica, setTOtica] = useState('');
  const [tNome, setTNome] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tSenha, setTSenha] = useState('');
  const [tErro, setTErro] = useState('');
  const [tLoading, setTLoading] = useState(false);

  useEffect(() => { document.title = 'Connect Vision — Entrar'; }, []);

  // Tela compacta (celular): login menor e à esquerda. Tablet fica igual.
  const isCompact = () => typeof window !== 'undefined' && (window.innerHeight < 500 || window.innerWidth < 640);
  const [compact, setCompact] = useState(isCompact);
  useEffect(() => {
    const onR = () => setCompact(isCompact());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  async function ativarTeste(e?: React.FormEvent) {
    e?.preventDefault();
    setTErro(''); setTLoading(true);
    try {
      const data = await api.post('/promo/resgatar', {
        codigo: tCodigo, nome_otica: tOtica, nome: tNome, email: tEmail, senha: tSenha,
      });
      setAuth(data as never);
      navigate('/vision', { replace: true });
    } catch (err: unknown) {
      setTErro(err instanceof Error ? err.message : 'Não foi possível ativar o código');
    } finally { setTLoading(false); }
  }

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
    width: '100%', padding: compact ? '8px 12px' : '13px 15px', fontSize: compact ? 13.5 : 15,
    borderRadius: compact ? 9 : 12,
    border: '1px solid #d1d1d6', background: '#fff', color: '#1c1c1e',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: compact ? 'flex-start' : 'center',
      padding: compact ? '12px 5%' : 20, position: 'relative', overflow: 'hidden',
      background: '#060a16',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <ForcarPaisagem />
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

      <div style={{ width: '100%', maxWidth: compact ? 300 : 380, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: compact ? 'left' : 'center', marginBottom: compact ? 12 : 26 }}>
          <img src="/vision-icon.png" alt="Connect Vision" style={{
            width: compact ? 46 : 76, height: compact ? 46 : 76, borderRadius: compact ? 12 : 19,
            margin: compact ? '0 0 8px' : '0 auto 14px',
            objectFit: 'cover', display: 'block',
            boxShadow: '0 12px 40px rgba(0,122,255,0.5), 0 0 0 1px rgba(120,170,255,0.2)',
          }} />
          <div style={{ fontSize: compact ? 19 : 25, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.5px' }}>
            Connect <span style={{ color: '#3ba6ff' }}>Vision</span>
          </div>
          <div style={{ display: compact ? 'none' : 'block', fontSize: 13, color: 'rgba(180,205,255,0.6)', marginTop: 3, letterSpacing: '0.02em' }}>Simulador para óticas</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: compact ? 14 : 20, padding: compact ? 16 : 24, boxShadow: '0 20px 60px rgba(0,20,60,0.5), 0 0 0 1px rgba(120,170,255,0.18), 0 0 40px rgba(0,122,255,0.15)', backdropFilter: 'blur(10px)' }}>
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
            <form onSubmit={entrar} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: compact ? 11.5 : 13, fontWeight: 500, color: '#3a3a3c', marginBottom: compact ? 3 : 6 }}>E-mail</label>
                <input type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                  style={inp} onFocus={e => e.target.style.borderColor = '#007aff'} onBlur={e => e.target.style.borderColor = '#d1d1d6'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: compact ? 11.5 : 13, fontWeight: 500, color: '#3a3a3c', marginBottom: compact ? 3 : 6 }}>Senha</label>
                <input type="password" name="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="••••••••"
                  style={inp} onFocus={e => e.target.style.borderColor = '#007aff'} onBlur={e => e.target.style.borderColor = '#d1d1d6'} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: compact ? 12 : 14, color: '#3a3a3c', cursor: 'pointer' }}>
                <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} style={{ width: compact ? 15 : 18, height: compact ? 15 : 18, accentColor: '#007aff', cursor: 'pointer' }} />
                Salvar login neste dispositivo
              </label>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: compact ? '10px' : '14px', fontSize: compact ? 14 : 16, fontWeight: 600, borderRadius: compact ? 9 : 12, border: 'none',
                background: loading ? '#9dc7ff' : '#007aff', color: '#fff', cursor: loading ? 'default' : 'pointer', marginTop: 2,
                WebkitTapHighlightColor: 'transparent',
              }}>{loading ? 'Entrando…' : 'Entrar'}</button>
            </form>
          )}
        </div>

        <button onClick={() => { setModoTeste(true); setTErro(''); }} style={{
          display: 'block', margin: compact ? '9px auto 0' : '16px auto 0', background: 'rgba(120,180,255,0.12)',
          border: '1px solid rgba(120,180,255,0.3)', borderRadius: 999, padding: compact ? '7px 14px' : '9px 18px',
          color: '#bcd6ff', fontSize: compact ? 12 : 13, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}>🎁 Tenho um código de teste grátis</button>

        <div style={{ display: compact ? 'none' : 'block', textAlign: 'center', marginTop: 18, fontSize: 12, color: 'rgba(160,190,255,0.5)' }}>
          Conexão Óticas · Connect Vision
        </div>
      </div>

      {/* Modal — Teste grátis por código */}
      {modoTeste && (
        <div onClick={() => setModoTeste(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(4,9,22,0.8)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        }}>
          <form onClick={e => e.stopPropagation()} onSubmit={ativarTeste} style={{
            width: 380, maxWidth: '94vw', background: '#fff', borderRadius: 20, padding: 24,
            boxShadow: '0 24px 70px rgba(0,0,0,0.5)', maxHeight: '92vh', overflowY: 'auto',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 30 }}>🎁</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1c1e' }}>15 dias grátis</div>
              <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>Digite o código que você recebeu do especialista.</div>
            </div>

            {tErro && (
              <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#d70015', fontWeight: 500 }}>{tErro}</div>
            )}

            <input value={tCodigo} onChange={e => setTCodigo(e.target.value.toUpperCase())} placeholder="Código (ex: VISION-XXXX)" required
              style={{ ...inp, textAlign: 'center', fontWeight: 700, letterSpacing: '1px', marginBottom: 12 }} />

            <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '4px 0 8px' }}>Seus dados</div>
            <input value={tOtica} onChange={e => setTOtica(e.target.value)} placeholder="Nome da ótica" style={{ ...inp, marginBottom: 10 }} />
            <input value={tNome} onChange={e => setTNome(e.target.value)} placeholder="Seu nome" style={{ ...inp, marginBottom: 10 }} />
            <input type="email" value={tEmail} onChange={e => setTEmail(e.target.value)} placeholder="E-mail" required autoComplete="email" style={{ ...inp, marginBottom: 10 }} />
            <input type="password" value={tSenha} onChange={e => setTSenha(e.target.value)} placeholder="Crie uma senha (mín. 6)" required autoComplete="new-password" style={{ ...inp, marginBottom: 16 }} />

            <button type="submit" disabled={tLoading} style={{
              width: '100%', padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none',
              background: tLoading ? '#9dc7ff' : '#1faf4a', color: '#fff', cursor: tLoading ? 'default' : 'pointer',
            }}>{tLoading ? 'Ativando…' : 'Ativar 15 dias grátis'}</button>

            <a href={`https://wa.me/${ESPECIALISTA_WA}?text=${encodeURIComponent('Olá! Quero testar o Connect Vision grátis por 15 dias. Pode me passar um código?')}`}
              target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none',
                marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid #25D366', color: '#128a3a', fontSize: 14, fontWeight: 700,
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.34A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.8.83-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>
              Não tenho código — falar com especialista
            </a>

            <button type="button" onClick={() => setModoTeste(false)} style={{
              display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#8e8e93', fontSize: 13, cursor: 'pointer',
            }}>Voltar ao login</button>
          </form>
        </div>
      )}

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
