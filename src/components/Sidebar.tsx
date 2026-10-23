import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { MENU_GRUPOS, menusDo } from '../lib/permissoes';
import { api } from '../lib/api';
import { getMe } from '../lib/auth';
import Icone from './Icone';

// Menu lateral recolhível (igual ao Connect LAB): faixa só com ícones que abre ao encostar o mouse.
// Fundo no azul da marca Connect Óticas. O alfinete deixa o menu sempre aberto (salvo neste computador).
const LARGO = 240;
const ESTREITO = 52;
const CHAVE_FIXO = 'menu_fixo';

// cores do menu (azul da logo)
const AZ = {
  fundo: 'linear-gradient(165deg, #0a2a6b 0%, #0f3f9e 45%, #1f6fe5 100%)',
  borda: 'rgba(255,255,255,0.12)',
  texto: '#eaf2ff',
  suave: 'rgba(234,242,255,0.62)',
  hover: 'rgba(255,255,255,0.12)',
  ativo: 'rgba(255,255,255,0.95)',
  ativoTexto: '#0b3487',
};

// Grupos do menu sanfona: nome mostrado e ícone
const GRUPO_INFO: Record<string, { nome: string; icone: string }> = {
  Menu: { nome: 'Principal', icone: 'painel' },
  Financeiro: { nome: 'Financeiro', icone: 'dinheiro' },
  Marketing: { nome: 'Marketing', icone: 'campanhas' },
  Cadastros: { nome: 'Cadastros', icone: 'lista' },
  Sistema: { nome: 'Sistema', icone: 'config' },
};

function lerFixo() {
  try { return localStorage.getItem(CHAVE_FIXO) === '1'; } catch { return false; }
}

// Foto: corta em quadrado e reduz para 160px antes de enviar
function prepararFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const c = document.createElement('canvas'); c.width = 160; c.height = 160;
      c.getContext('2d')!.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 160, 160);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

function iniciais(nome?: string) {
  const p = (nome || '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

export default function Sidebar() {
  const { tenant, usuario, logout, setAuth } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const liberados = menusDo(usuario);
  const [fixo, setFixo] = useState(lerFixo);
  const [hover, setHover] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  const aberto = fixo || hover;
  const { pathname } = useLocation();

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

  async function trocarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setEnviando(true);
    try {
      await api.put('/auth/foto', { foto: await prepararFoto(f) });
      const me = await getMe();
      if (me) setAuth(me);
    } catch (err) { alert(err instanceof Error ? err.message : 'Não foi possível enviar a foto'); }
    setEnviando(false);
  }

  const grupos = MENU_GRUPOS
    .map(g => ({ label: g.label, items: g.items.filter(i => liberados.includes(i.to)).map(i => (i.to === '/vendedores' && usuario?.perfil !== 'admin') ? { ...i, label: 'Ranking' } : i) }))
    .filter(g => g.items.length > 0);

  // grupo da tela atual abre sozinho; um grupo aberto por vez
  const grupoAtivo = grupos.find(g => g.items.some(i => pathname === i.to || pathname.startsWith(i.to + '/')))?.label || null;
  const [grupoAberto, setGrupoAberto] = useState<string | null>(grupoAtivo);
  useEffect(() => { if (grupoAtivo) setGrupoAberto(grupoAtivo); }, [grupoAtivo]);

  const texto: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: aberto ? 1 : 0, transition: 'opacity .15s' };
  const linhaBtn: React.CSSProperties = {
    width: '100%', height: 34, padding: '0 0 0 17px', fontSize: '13px', color: AZ.texto, background: 'transparent',
    border: 'none', borderRadius: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px',
  };
  const realce = (e: React.MouseEvent<HTMLElement>, on: boolean) => { e.currentTarget.style.background = on ? AZ.hover : 'transparent'; };
  const foto = usuario?.foto;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: aberto ? LARGO : ESTREITO,
        height: '100vh',
        background: AZ.fundo,
        borderRight: `1px solid ${AZ.borda}`,
        color: AZ.texto,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0,
        zIndex: 100,
        overflow: 'hidden',
        transition: 'width .18s ease',
      }}>
      {/* Logo + loja */}
      <div style={{ padding: '10px 8px 10px 10px', borderBottom: `1px solid ${AZ.borda}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/brand-192.png" alt="Conexão Óticas" width="32" height="32" onClick={() => navigate('/dashboard')} title="Painel"
            style={{ width: '32px', height: '32px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }} />
          <span style={{ ...texto, flex: 1, fontSize: '14px', fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase', color: '#fff' }}>
            Connect Óticas
          </span>
          <button onClick={() => setFixo(f => !f)} title={fixo ? 'Soltar menu (recolher)' : 'Fixar menu aberto'}
            style={{ ...texto, width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fixo ? AZ.ativo : 'transparent', color: fixo ? AZ.ativoTexto : AZ.suave, border: `1px solid ${AZ.borda}`, borderRadius: 6, cursor: 'pointer' }}>
            <Icone nome="pin" size={14} />
          </button>
        </div>
        <div style={{ ...texto, maxHeight: aberto ? 40 : 0, marginTop: aberto ? 8 : 0, transition: 'opacity .15s, max-height .18s, margin .18s', fontSize: 11.5, color: AZ.suave, paddingLeft: 2 }}>
          {tenant?.nome}
        </div>
      </div>

      {/* Itens */}
      <nav className="menu-sem-barra" style={{ flex: 1, padding: '6px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          title="Buscar (Ctrl+K)"
          style={{ ...linhaBtn, marginBottom: 4, color: AZ.suave }}
          onMouseEnter={e => realce(e, true)} onMouseLeave={e => realce(e, false)}>
          <Icone nome="busca" size={16} />
          <span style={{ ...texto, flex: 1 }}>Buscar...</span>
          <kbd style={{ ...texto, fontSize: '10px', padding: '1px 5px', marginRight: 8, borderRadius: '3px', background: 'rgba(255,255,255,0.1)', border: `1px solid ${AZ.borda}`, fontFamily: 'var(--mono)', color: AZ.suave }}>Ctrl K</kbd>
        </button>
        {grupos.map(({ label, items }) => {
          const info = GRUPO_INFO[label] || { nome: label, icone: 'lista' };
          const ativo = grupoAtivo === label;
          const expandido = aberto && grupoAberto === label;
          return (
            <div key={label}>
              {/* cabeçalho do grupo: clica e abre pra baixo */}
              <button
                onClick={() => setGrupoAberto(g => (g === label ? null : label))}
                title={info.nome}
                style={{
                  ...linhaBtn, height: 38, fontWeight: 600, fontSize: '13.5px',
                  color: ativo ? '#fff' : AZ.texto,
                  background: ativo ? 'rgba(255,255,255,0.10)' : 'transparent',
                  boxShadow: ativo ? 'inset 3px 0 0 #fff' : 'none',
                }}
                onMouseEnter={e => { if (!ativo) realce(e, true); }}
                onMouseLeave={e => { if (!ativo) realce(e, false); }}>
                <Icone nome={info.icone} size={17} />
                <span style={{ ...texto, flex: 1 }}>{info.nome}</span>
                <span style={{ ...texto, marginRight: 12, display: 'flex', transform: expandido ? 'rotate(90deg)' : 'none', transition: 'transform .15s, opacity .15s', color: AZ.suave }}>
                  <Icone nome="proximo" size={14} />
                </span>
              </button>

              {/* telas do grupo */}
              <div style={{ overflow: 'hidden', maxHeight: expandido ? items.length * 34 + 8 : 0, transition: 'max-height .2s ease', background: 'rgba(0,0,0,0.12)' }}>
                <div style={{ padding: '4px 0' }}>
                  {items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className="menu-azul-item"
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '10px', height: 34,
                        padding: '0 0 0 44px', borderRadius: 0,
                        fontSize: '13px', fontWeight: isActive ? 700 : 400,
                        color: isActive ? AZ.ativoTexto : AZ.texto,
                        background: isActive ? AZ.ativo : 'transparent',
                        textDecoration: 'none', transition: 'background .12s',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      })}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Rodapé: perfil, tema e sair */}
      <div style={{ padding: '4px 0', borderTop: `1px solid ${AZ.borda}` }}>
        <input ref={inputFoto} type="file" accept="image/*" onChange={trocarFoto} style={{ display: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 6px 11px', cursor: 'pointer' }}
          title={enviando ? 'Enviando foto...' : 'Trocar foto de perfil'}
          onClick={() => !enviando && inputFoto.current?.click()}
          onMouseEnter={e => realce(e, true)} onMouseLeave={e => realce(e, false)}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, color: '#fff', opacity: enviando ? 0.5 : 1 }}>
            {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciais(usuario?.nome)}
          </div>
          <div style={{ ...texto, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario?.nome}</div>
            <div style={{ fontSize: 10.5, color: AZ.suave }}>{enviando ? 'enviando foto...' : `${usuario?.perfil === 'admin' ? 'Administrador' : usuario?.perfil || ''} · trocar foto`}</div>
          </div>
        </div>
        <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo escuro'} style={linhaBtn}
          onMouseEnter={e => realce(e, true)} onMouseLeave={e => realce(e, false)}>
          <Icone nome={dark ? 'sol' : 'lua'} size={17} />
          <span style={texto}>{dark ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
        <button onClick={handleLogout} title={`Sair · ${usuario?.nome ?? ''}`} style={linhaBtn}
          onMouseEnter={e => realce(e, true)} onMouseLeave={e => realce(e, false)}>
          <Icone nome="sair" size={17} />
          <span style={texto}>Sair</span>
        </button>
      </div>
    </div>
  );
}
