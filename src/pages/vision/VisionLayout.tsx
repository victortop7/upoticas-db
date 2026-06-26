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
