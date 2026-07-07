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
  const [carenciaOk, setCarenciaOk] = useState(false); // usuário optou por continuar durante a carência

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

  // Status da licença.
  // dias >= 0: dentro da validade (0 = vence hoje). dias === -1: 1º dia vencido = CARÊNCIA. dias <= -2: bloqueia.
  const venc = tenant?.plano === 'trial' ? tenant?.trial_expira : tenant?.licenca_expira;
  const dias = diasAte(venc);
  const adminBlock = Boolean(tenant?.bloqueado);
  const perto = !adminBlock && dias != null && dias >= 0 && dias <= AVISO_DIAS;          // aviso sutil (3 dias)
  const carencia = !adminBlock && dias === -1;                                            // 1 dia de carência
  const bloqueado = adminBlock || (dias != null && dias <= -2);                           // bloqueio total

  function fecharPix() { setShowPix(false); if (pixPago) window.location.reload(); }
  function fecharBloqueio() { if (pixPago) window.location.reload(); }

  const textoDias = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;

  const rodapeSair = (
    <button onClick={async () => { await logout(); navigate('/vision/login', { replace: true }); }} style={{
      display: 'block', margin: '0 auto', background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
    }}>Sair</button>
  );

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

      {/* Carência (1 dia após vencer) — QR na tela, mas dá pra continuar hoje */}
      {carencia && !carenciaOk && (
        <PixModal
          dismissible
          titulo="Acesso expirado"
          subtitulo="Último dia de carência — renove hoje"
          onClose={() => { if (pixPago) window.location.reload(); else setCarenciaOk(true); }}
          onPago={() => setPixPago(true)}
          footer={
            <button onClick={() => setCarenciaOk(true)} style={{
              width: '100%', background: 'transparent', border: '1px solid #cbd5e1', color: '#475569',
              borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Continuar hoje (1 dia de carência)</button>
          }
        />
      )}

      {/* Bloqueio total — QR + chave Pix direto na tela, sem escapatória */}
      {bloqueado && (
        <PixModal
          dismissible={false}
          titulo="Assinatura vencida"
          subtitulo="Renove via Pix para continuar. Seus dados estão salvos."
          onClose={fecharBloqueio}
          onPago={() => setPixPago(true)}
          footer={rodapeSair}
        />
      )}

      {/* Modal Pix acionado pelo aviso sutil */}
      {showPix && !carencia && !bloqueado && <PixModal onClose={fecharPix} onPago={() => setPixPago(true)} />}

      <style>{`@keyframes avisoIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}
