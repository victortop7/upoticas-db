import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function VisionLayout() {
  const { usuario, loading } = useAuth();

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

  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <div style={{
      height: '100dvh',
      minHeight: '100dvh',
      background: '#050508',
      backgroundImage: 'radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 16%), radial-gradient(circle at 25% 18%, rgba(16,185,129,0.12), transparent 12%), radial-gradient(circle at bottom right, rgba(79,70,229,0.14), transparent 20%), linear-gradient(180deg, #05070d 0%, #08101d 45%, #070b17 100%)',
      color: '#f8fafc',
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
