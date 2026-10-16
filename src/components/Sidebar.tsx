import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { MENU_GRUPOS, menusDo } from '../lib/permissoes';

export default function Sidebar() {
  const { tenant, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const liberados = menusDo(usuario);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{
      width: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <img src="/brand-192.png" alt="Conexão Óticas" width="32" height="32" style={{
            width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover',
            border: '1px solid var(--border)', flexShrink: 0
          }} />
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
            Connect <span style={{ color: 'var(--primary)' }}>Óticas</span>
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
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {(
          /* Menu conforme as permissões do usuário */
          <>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              style={{
                width: '100%', padding: '8px 10px', marginBottom: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface-alt)', border: '1px solid var(--border)',
                borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔍</span> Buscar...
              </span>
              <kbd style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}>⌃K</kbd>
            </button>
            {MENU_GRUPOS.map(g => ({ label: g.label, items: g.items.filter(i => liberados.includes(i.to)).map(i => (i.to === '/vendedores' && usuario?.perfil !== 'admin') ? { ...i, label: 'Ranking' } : i) }))
              .filter(g => g.items.length > 0).map(({ label, items }) => (
              <div key={label}>
                <p style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', margin: '8px 0 4px' }}>
                  {label}
                </p>
                {items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px', marginBottom: '2px',
                      fontSize: '13px', fontWeight: isActive ? '600' : '400',
                      color: isActive ? 'var(--primary)' : 'var(--text-dim)',
                      background: isActive ? 'var(--primary-dim)' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.15s',
                    })}
                  >
                    <span style={{ fontSize: '15px' }}>{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggle}
          style={{
            width: '100%', padding: '9px 10px', fontSize: '14px',
            color: 'var(--text-dim)', background: 'transparent',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.15s', marginBottom: '2px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span>{dark ? '☀️' : '🌙'}</span>
          {dark ? 'Modo claro' : 'Modo escuro'}
        </button>
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
