import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function VisionLayout() {
  const { usuario, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080a0f',
      }}>
        <div style={{ color: '#4a5568', fontSize: 14, fontFamily: 'var(--sans)' }}>Carregando...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  const isHome = location.pathname === '/vision' || location.pathname === '/vision/';
  const showBack = !isHome;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080a0f',
      color: '#e8eaf0',
      fontFamily: 'var(--sans)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        background: '#0d1018',
        borderBottom: '1px solid #1a1f2e',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {showBack && (
            <button
              onClick={() => navigate('/vision')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: '8px 12px 8px 0',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 14, fontFamily: 'var(--sans)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Menu
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>V</div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#e8eaf0' }}>
              Conect Vision
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#3d4a5c', fontFamily: 'var(--mono)' }}>
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
