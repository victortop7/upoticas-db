import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { MENU_GRUPOS, menusDo } from '../lib/permissoes';
import Icone from './Icone';

// Menu lateral recolhível (igual ao Connect LAB): faixa só com ícones que abre ao encostar o mouse.
// O botão de alfinete deixa o menu sempre aberto (fica salvo neste computador).
const LARGO = 240;
const ESTREITO = 52;
const CHAVE_FIXO = 'menu_fixo';

function lerFixo() {
  try { return localStorage.getItem(CHAVE_FIXO) === '1'; } catch { return false; }
}

export default function Sidebar() {
  const { tenant, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const liberados = menusDo(usuario);
  const [fixo, setFixo] = useState(lerFixo);
  const [hover, setHover] = useState(false);
  const aberto = fixo || hover;

  // igual ao Connect LAB: ao abrir, o menu empurra a página pro lado (não fica por cima)
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', `${aberto ? LARGO : ESTREITO}px`);
  }, [aberto]);
  useEffect(() => {
    try { localStorage.setItem(CHAVE_FIXO, fixo ? '1' : '0'); } catch { /* sem storage */ }
  }, [fixo]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const grupos = MENU_GRUPOS
    .map(g => ({ label: g.label, items: g.items.filter(i => liberados.includes(i.to)).map(i => (i.to === '/vendedores' && usuario?.perfil !== 'admin') ? { ...i, label: 'Ranking' } : i) }))
    .filter(g => g.items.length > 0);

  const texto: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: aberto ? 1 : 0, transition: 'opacity .15s' };
  const linhaBtn: React.CSSProperties = {
    width: '100%', height: 34, padding: '0 0 0 17px', fontSize: '13px', color: 'var(--text-dim)', background: 'transparent',
    border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px',
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: aberto ? LARGO : ESTREITO,
        height: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0,
        zIndex: 100,
        overflow: 'hidden',
        transition: 'width .18s ease, box-shadow .18s ease',
      }}>
      {/* Logo + loja */}
      <div style={{ padding: '10px 8px 10px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/brand-192.png" alt="Conexão Óticas" width="32" height="32" onClick={() => navigate('/dashboard')} title="Painel"
            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0, cursor: 'pointer' }} />
          <span style={{ ...texto, flex: 1, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            Connect <span style={{ color: 'var(--primary)' }}>Óticas</span>
          </span>
          <button onClick={() => setFixo(f => !f)} title={fixo ? 'Soltar menu (recolher)' : 'Fixar menu aberto'}
            style={{ ...texto, width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fixo ? 'var(--primary-dim)' : 'transparent', color: fixo ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
            <Icone nome="pin" size={14} />
          </button>
        </div>
        <div style={{ ...texto, maxHeight: aberto ? 60 : 0, marginTop: aberto ? 10 : 0, transition: 'opacity .15s, max-height .18s, margin .18s', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '6px', padding: aberto ? '7px 10px' : '0 10px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant?.nome}</p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario?.nome}</p>
        </div>
      </div>

      {/* Itens */}
      <nav className="menu-sem-barra" style={{ flex: 1, padding: '6px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          title="Buscar (Ctrl+K)"
          style={{ ...linhaBtn, marginBottom: 4, color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <Icone nome="busca" size={16} />
          <span style={{ ...texto, flex: 1 }}>Buscar...</span>
          <kbd style={{ ...texto, fontSize: '10px', padding: '1px 5px', marginRight: 8, borderRadius: '3px', background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}>Ctrl K</kbd>
        </button>
        {grupos.map(({ label, items }, gi) => (
          <div key={label}>
            <div style={{ height: aberto ? 24 : (gi > 0 ? 8 : 0), display: 'flex', alignItems: 'flex-end', transition: 'height .18s', overflow: 'hidden' }}>
              <span style={{ ...texto, fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 0 3px 17px' }}>{label}</span>
            </div>
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px', height: 34,
                  padding: '0 0 0 17px', borderRadius: 0,
                  fontSize: '13px', fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--text-dim)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  textDecoration: 'none', transition: 'background .12s',
                })}
              >
                <Icone nome={item.icon} size={17} />
                <span style={texto}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé */}
      <div style={{ padding: '4px 0', borderTop: '1px solid var(--border)' }}>
        <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo escuro'} style={linhaBtn}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <Icone nome={dark ? 'sol' : 'lua'} size={17} />
          <span style={texto}>{dark ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
        <button onClick={handleLogout} title={`Sair · ${usuario?.nome ?? ''}`} style={linhaBtn}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <Icone nome="sair" size={17} />
          <span style={texto}>Sair</span>
        </button>
      </div>
    </div>
  );
}
