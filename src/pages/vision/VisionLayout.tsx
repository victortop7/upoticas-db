import { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PixModal from '../../components/PixModal';

const INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos
const AVISO_DIAS = 3; // aviso sutil a partir de 3 dias antes de vencer

// Dias até a data YYYY-MM-DD (fim do dia, fuso SP). null se sem data.
function diasAte(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T23:59:59-03:00`);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export default function VisionLayout() {
  const { usuario, tenant, loading, logout } = useAuth();
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [pixPago, setPixPago] = useState(false);
  const [avisoFechado, setAvisoFechado] = useState(false);

  // Auto-logout após 30 min de inatividade
  useEffect(() => {
    if (!usuario) return;
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await logout();
        navigate('/vision/login', { replace: true });
      }, INATIVIDADE_MS);
    };
    const eventos = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove', 'scroll', 'click'];
    eventos.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      eventos.forEach(e => window.removeEventListener(e, reset));
    };
  }, [usuario, logout, navigate]);

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1e2030', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/vision/login" replace />;

  // Status da licença
  const venc = tenant?.plano === 'trial' ? tenant?.trial_expira : tenant?.licenca_expira;
  const dias = diasAte(venc);
  const bloqueado = Boolean(tenant?.bloqueado) || (dias != null && dias < 0);
  const perto = !bloqueado && dias != null && dias >= 0 && dias <= AVISO_DIAS;

  function fecharPix() { setShowPix(false); if (pixPago) window.location.reload(); }

  const textoDias = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;

  return (
    <div style={{
      height: '100dvh', background: '#050508', color: '#f0f0f5',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none',
    }}>
      <Outlet />

      {/* Aviso sutil — perto de vencer */}
      {perto && !avisoFechado && (
        <div style={{
          position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 250,
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(20,16,10,0.92)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 999, padding: '8px 10px 8px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', maxWidth: '92vw',
          animation: 'avisoIn .3s ease',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, boxShadow: '0 0 8px #f59e0b' }} />
          <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>
            Sua assinatura vence <b style={{ color: '#f59e0b' }}>{textoDias}</b>
          </span>
          <button onClick={() => setShowPix(true)} style={{
            background: '#1faf4a', color: '#fff', border: 'none', borderRadius: 999,
            padding: '7px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Pagar com Pix</button>
          <button onClick={() => setAvisoFechado(true)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}

      {/* Overlay de bloqueio — vencida */}
      {bloqueado && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 260,
          background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            width: 400, maxWidth: '92vw', background: '#101018', border: '1px solid #23232e',
            borderRadius: 22, padding: '34px 30px', textAlign: 'center', boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
          }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(245,158,11,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#f1f5f9' }}>Assinatura vencida</div>
            <div style={{ fontSize: 14.5, color: '#9aa4b8', marginTop: 8, lineHeight: 1.6 }}>
              Para continuar usando o Connect Vision, renove sua assinatura mensal via Pix. Seus dados estão salvos.
            </div>
            <button onClick={() => setShowPix(true)} style={{
              marginTop: 22, background: '#1faf4a', color: '#fff', border: 'none', borderRadius: 14,
              padding: '15px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 28px rgba(31,175,74,0.4)',
            }}>Pagar com Pix · R$ 97,00</button>
            <button onClick={async () => { await logout(); navigate('/vision/login', { replace: true }); }} style={{
              display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer',
            }}>Sair</button>
          </div>
        </div>
      )}

      {showPix && <PixModal onClose={fecharPix} onPago={() => setPixPago(true)} />}

      <style>{`@keyframes avisoIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}
