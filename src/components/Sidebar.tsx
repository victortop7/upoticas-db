import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const NAV_GERAL = [
  { to: '/dashboard', label: 'Painel', icon: '◉' },
  { to: '/clientes', label: 'Clientes', icon: '👤' },
  { to: '/os', label: 'Ordens de Serviço', icon: '🔧' },
  { to: '/vendas', label: 'Vendas', icon: '🛒' },
  { to: '/crm', label: 'Funil CRM', icon: '🎯' },
  { to: '/relatorios', label: 'Relatórios', icon: '📊' },
];

const NAV_FINANCEIRO = [
  { to: '/financeiro/caixa', label: 'Caixa', icon: '💵' },
  { to: '/faturamento', label: 'Faturamento', icon: '🧾' },
  { to: '/financeiro/contas-pagar', label: 'Contas a Pagar', icon: '📤' },
  { to: '/financeiro/contas-receber', label: 'Contas a Receber', icon: '📥' },
  { to: '/financeiro/fluxo', label: 'Fluxo Financeiro', icon: '📈' },
  { to: '/financeiro/contas', label: 'Contas', icon: '🏦' },
  { to: '/bancario', label: 'Controle Bancário', icon: '🏛️' },
];

const NAV_MARKETING = [
  { to: '/marketing/campanhas', label: 'Campanhas', icon: '📢' },
  { to: '/marketing/aniversariantes', label: 'Aniversariantes', icon: '🎂' },
  { to: '/marketing/modelos', label: 'Modelos', icon: '💬' },
  { to: '/marketing/historico', label: 'Histórico', icon: '📋' },
];

const NAV_CADASTROS = [
  { to: '/fornecedores', label: 'Fornecedores', icon: '🏭' },
  { to: '/medicos', label: 'Médicos / Oftalmos', icon: '👨‍⚕️' },
  { to: '/produtos', label: 'Produtos / Serviços', icon: '📦' },
  { to: '/estoque', label: 'Estoque', icon: '🗂️' },
];

const NAV_CONFIG = [
  { to: '/vendedores', label: 'Vendedores', icon: '🏆' },
  { to: '/usuarios', label: 'Usuários', icon: '👥' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function Sidebar() {
  const { tenant, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

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
      boxShadow: '6px 0 28px rgba(15, 23, 42, 0.08)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 18px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.86)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '38px', height: '38px', background: 'linear-gradient(135deg, var(--accent), #0051d0)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 12px 24px rgba(0, 122, 255, 0.15)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>
              Connect <span style={{ color: 'var(--accent)' }}>Óticas</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.07em', fontWeight: 600 }}>
              Sistema para Óticas
            </div>
          </div>
        </div>
        <div style={{
          background: 'var(--surface-alt)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '12px 14px', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.05)',
        }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tenant?.nome}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
            {usuario?.nome}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {usuario?.perfil === 'marketing' ? (
          <div>
            <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 8px', margin: '8px 0 8px' }}>
              Menu
            </p>
            {[
              { to: '/vendas', label: 'Vendas', icon: '🛒' },
              { to: '/crm', label: 'Funil CRM', icon: '🎯' },
            ].map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '16px', marginBottom: '8px',
                  fontSize: '13px', fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.18s',
                })}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ) : (
          <>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              style={{
                width: '100%', padding: '12px 14px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface-alt)', border: '1px solid var(--border)',
                borderRadius: '16px', cursor: 'pointer', color: 'var(--text-dim)',
                fontSize: '13px', fontWeight: 700,
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔍</span> Buscar
              </span>
              <kbd style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}>⌃K</kbd>
            </button>
            {([
              { label: 'Menu', items: [...NAV_GERAL, ...(usuario?.perfil !== 'admin' ? [{ to: '/vendedores', label: 'Ranking', icon: '🏆' }] : [])] },
              ...(usuario?.perfil === 'admin' ? [{ label: 'Financeiro', items: NAV_FINANCEIRO }] : []),
              { label: 'Marketing', items: NAV_MARKETING },
              { label: 'Cadastros', items: usuario?.perfil === 'admin' ? NAV_CADASTROS : [] },
              { label: 'Sistema', items: usuario?.perfil === 'admin' ? NAV_CONFIG : [] },
            ]).filter(g => g.items.length > 0).map(({ label, items }) => (
              <div key={label}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 8px', margin: '14px 0 8px' }}>
                  {label}
                </p>
                {items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '16px', marginBottom: '8px',
                      fontSize: '13px', fontWeight: isActive ? '700' : '500',
                      color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                      background: isActive ? 'var(--accent-dim)' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.18s',
                    })}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)' }}>
        <button
          onClick={toggle}
          style={{
            width: '100%', padding: '12px 14px', fontSize: '14px',
            color: 'var(--text-dim)', background: 'var(--surface-alt)',
            border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.18s', marginBottom: '9px',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
          }}
        >
          <span>{dark ? '☀️' : '🌙'}</span>
          {dark ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px 14px', fontSize: '14px',
            color: 'var(--text-dim)', background: 'var(--surface-alt)',
            border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.18s', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
          }}
        >
          <span>↩</span> Sair
        </button>
      </div>
    </div>
  );
}
