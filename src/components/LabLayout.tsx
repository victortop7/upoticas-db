import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LabLayout() {
  const { usuario, tenant, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#c8c4b0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
        <div style={{ color: '#005500', fontWeight: 'bold' }}>AGUARDE...</div>
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

  const hdrBg     = dark
    ? 'linear-gradient(90deg, #002200, #003300)'
    : 'linear-gradient(90deg, #005500, #007700)';
  const hdrBorder = dark ? '#1a4a1a' : '#2a8a2a';
  const hdrTxt    = dark ? '#88ff88' : '#ccffcc';
  const sideBg    = dark
    ? 'linear-gradient(180deg, #001a00, #002600)'
    : 'linear-gradient(180deg, #005500, #003300)';
  const sideBorder = dark ? '#1a3a1a' : '#2a5a2a';
  const mainBg    = dark ? '#111111' : '#c8c4b0';
  const navBg     = dark ? '#1c1c1c' : '#d4d0c8';
  const navBorder = dark ? '#333333' : '#a0a098';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Courier New', Courier, monospace", background: mainBg, transition: 'background 0.2s' }}>

      {/* ===== HEADER ===== */}
      <div style={{
        background: hdrBg,
        color: hdrTxt,
        padding: '4px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `2px solid ${hdrBorder}`,
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        <span>UpÓticas Lab — {tenant?.nome || 'Laboratório'}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: dark ? '#66cc66' : '#a0d0a0' }}>{usuario?.nome}</span>
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

        {/* ===== SIDEBAR ===== */}
        <div style={{
          background: sideBg,
          width: '52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderRight: `2px solid ${sideBorder}`,
          flexShrink: 0,
        }}>
          <div style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: dark ? '#66cc66' : '#ccffcc',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
            UPOTICAS
          </div>
          <div style={{ color: dark ? '#44cc44' : '#88ff88', fontSize: '20px', textAlign: 'center' }}>🔬</div>
          <div style={{
            writingMode: 'vertical-rl',
            color: dark ? '#44cc44' : '#88ff88',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            LAB
          </div>
        </div>

        {/* ===== CONTEÚDO PRINCIPAL ===== */}
        <div style={{ flex: 1, background: mainBg, overflow: 'auto', position: 'relative', transition: 'background 0.2s' }}>
          {!isHome && (
            <div style={{
              background: navBg,
              borderBottom: `1px solid ${navBorder}`,
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <button
                onClick={() => navigate('/lab/dashboard')}
                style={{
                  padding: '2px 14px', fontSize: '11px', fontWeight: 'bold',
                  background: dark ? '#003300' : '#005500',
                  color: dark ? '#88ff88' : '#ccffcc',
                  border: `1px outset ${hdrBorder}`, borderRadius: '2px',
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ◀ Menu Principal
              </button>
              <span style={{ fontSize: '11px', color: dark ? '#888888' : '#404040', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {location.pathname.replace('/lab/', '').replace('/', ' › ').toUpperCase()}
              </span>
            </div>
          )}
          <Outlet />
        </div>
      </div>

      {/* ===== STATUS BAR ===== */}
      <div style={{
        background: hdrBg,
        color: hdrTxt,
        padding: '3px 16px',
        fontSize: '11px',
        borderTop: `2px solid ${hdrBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}>
        <span>▶ SELECIONE A OPÇÃO DESEJADA</span>
        <span style={{ color: dark ? '#44cc44' : '#88cc88' }}>UpÓticas Lab v1.0</span>
      </div>
    </div>
  );
}
