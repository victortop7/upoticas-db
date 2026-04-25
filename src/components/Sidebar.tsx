import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/dashboard', label: 'Painel', icon: '◉' },
  { to: '/clientes', label: 'Clientes', icon: '👤' },
  { to: '/os', label: 'Ordens de Serviço', icon: '🔧' },
  { to: '/vendas', label: 'Vendas', icon: '🛒' },
  { to: '/usuarios', label: 'Usuários', icon: '👥' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function Sidebar() {
  const { tenant, usuario, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{
      width: 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--primary)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
            Up<span style={{ color: 'var(--primary)' }}>Óticas</span>
          </span>
        </div>
        <div style={{
          background: 'var(--surface-alt)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '8px 10px'
        }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tenant?.nome}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            {usuario?.nome}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', margin: '0 0 6px' }}>
          Menu
        </p>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
              fontSize: '14px', fontWeight: isActive ? '600' : '400',
              color: isActive ? 'var(--primary)' : 'var(--text-dim)',
              background: isActive ? 'var(--primary-dim)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '9px 10px', fontSize: '14px',
            color: 'var(--text-dim)', background: 'transparent',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span>↩</span> Sair
        </button>
      </div>
    </div>
  );
}
