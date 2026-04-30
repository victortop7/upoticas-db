import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LabLayout() {
  const { usuario, tenant, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#c8c4b0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
        <div style={{ color: '#000080', fontWeight: 'bold' }}>AGUARDE...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (tenant?.tipo !== 'lab') return <Navigate to="/dashboard" replace />;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isHome = location.pathname === '/lab/dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Courier New', Courier, monospace", background: '#c8c4b0' }}>

      {/* ===== HEADER AZUL ===== */}
      <div style={{
        background: 'linear-gradient(90deg, #000080, #0000cc)',
        color: '#ffff00',
        padding: '4px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #6060ff',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        <span>UpÓticas Lab — {tenant?.nome || 'Laboratório'}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#c0c0ff' }}>{usuario?.nome}</span>
          <button
            onClick={handleLogout}
            style={{ padding: '2px 10px', fontSize: '11px', background: '#cc0000', color: '#ffffff', border: '1px solid #ff4040', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}
          >
            SAIR
          </button>
        </div>
      </div>

      {/* ===== CORPO ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ===== SIDEBAR VERMELHA ===== */}
        <div style={{
          background: 'linear-gradient(180deg, #cc0000, #990000)',
          width: '52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderRight: '2px solid #880000',
          flexShrink: 0,
        }}>
          {/* Logo vertical */}
          <div style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
            UPOTICAS
          </div>

          {/* Ícone central */}
          <div style={{ color: '#ffcc00', fontSize: '20px', textAlign: 'center' }}>🔬</div>

          {/* Lab vertical */}
          <div style={{
            writingMode: 'vertical-rl',
            color: '#ffcc00',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            LAB
          </div>
        </div>

        {/* ===== CONTEÚDO PRINCIPAL ===== */}
        <div style={{ flex: 1, background: '#c8c4b0', overflow: 'auto', position: 'relative' }}>
          {/* Botão voltar para o menu (quando não está no dashboard) */}
          {!isHome && (
            <div style={{
              background: '#d4d0c8',
              borderBottom: '1px solid #a0a098',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <button
                onClick={() => navigate('/lab/dashboard')}
                style={{
                  padding: '2px 14px', fontSize: '11px', fontWeight: 'bold',
                  background: '#000080', color: '#ffffff',
                  border: '1px outset #8080ff', borderRadius: '2px',
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ◀ Menu Principal
              </button>
              <span style={{ fontSize: '11px', color: '#404040', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {location.pathname.replace('/lab/', '').replace('/', ' › ').toUpperCase()}
              </span>
            </div>
          )}
          <Outlet />
        </div>
      </div>

      {/* ===== STATUS BAR AZUL ===== */}
      <div style={{
        background: 'linear-gradient(90deg, #000080, #0000cc)',
        color: '#ffffff',
        padding: '3px 16px',
        fontSize: '11px',
        borderTop: '2px solid #6060ff',
        display: 'flex',
        justifyContent: 'space-between',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}>
        <span>▶ SELECIONE A OPÇÃO DESEJADA</span>
        <span style={{ color: '#c0c0ff' }}>UpÓticas Lab v1.0</span>
      </div>
    </div>
  );
}
