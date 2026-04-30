import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_SECTIONS = [
  {
    label: 'Lab',
    items: [
      { to: '/lab/dashboard', icon: '◼', label: 'Dashboard' },
      { to: '/lab/ordens', icon: '📋', label: 'Ordens de Serviço' },
      { to: '/lab/oticas', icon: '🏪', label: 'Óticas Clientes' },
    ],
  },
  {
    label: 'Estoque',
    items: [
      { to: '/lab/estoque', icon: '📦', label: 'Estoque de Lentes' },
      { to: '/lab/servicos', icon: '⚙', label: 'Catálogo de Serviços' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/lab/fornecedores', icon: '🏭', label: 'Fornecedores' },
      { to: '/lab/produtos', icon: '🗂️', label: 'Produtos / Serviços' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/lab/faturamento', icon: '🧾', label: 'Faturamento' },
      { to: '/lab/bancario', icon: '🏛️', label: 'Controle Bancário' },
    ],
  },
];

export default function LabLayout() {
  const { usuario, tenant, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (tenant?.tipo !== 'lab') return <Navigate to="/dashboard" replace />;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', position: 'fixed', top: 0, left: 0, bottom: 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
              🔬
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>
              Up<span style={{ color: '#a855f7' }}>Óticas</span> Lab
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '38px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant?.nome}</div>
        </div>

        {/* Nav com seções */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', margin: '10px 0 4px' }}>
                {section.label}
              </p>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', textDecoration: 'none',
                    marginBottom: '2px',
                    fontSize: '13px', fontWeight: isActive ? '600' : '400',
                    color: isActive ? 'var(--text)' : 'var(--text-dim)',
                    background: isActive ? 'var(--surface-alt)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                  })}
                >
                  <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {usuario?.nome}
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '7px', fontSize: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: '220px', flex: 1, background: 'var(--bg)', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
