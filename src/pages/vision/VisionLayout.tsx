import { useEffect, useRef } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos

export default function VisionLayout() {
  const { usuario, loading, logout } = useAuth();
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <div style={{
        height: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#050508',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid #1e2030', borderTopColor: '#3b82f6',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/vision/login" replace />;

  return (
    <div style={{
      height: '100dvh',
      background: '#050508',
      color: '#f0f0f5',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      <Outlet />
    </div>
  );
}
