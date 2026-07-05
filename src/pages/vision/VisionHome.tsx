import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ─── Submenus ─────────────────────────────────────────────────────────────
// Ordem de exibição no submenu (AR na frente)
const DEMO_ORDER = ['ar', 'campos', 'adicao', 'digital', 'photo', 'pol', 'espessura'];

const DEMO_ITEMS = [
  {
    id: 'digital',
    label: 'Digital',
    tab: 'superficie',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="6.5" stroke="white" strokeWidth="1.4" />
        <ellipse cx="12" cy="12" rx="4" ry="3" stroke="white" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="1.2" fill="white" />
      </svg>
    ),
  },
  {
    id: 'campos',
    label: 'Campos',
    tab: 'superficie',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <path d="M12 4c-4 3-7 5.5-7 9a7 7 0 0 0 14 0c0-3.5-3-6-7-9z" stroke="white" strokeWidth="1.4" />
        <line x1="12" y1="13" x2="12" y2="18" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="15" x2="15" y2="15" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'adicao',
    label: 'Adição',
    tab: 'superficie',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h4v7H5z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M10 8h4v11h-4z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M15 5h4v14h-4z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'photo',
    label: 'Photo',
    tab: 'fotossensivel',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.4" />
        {[0,60,120,180,240,300].map((deg, i) => {
          const r = deg * Math.PI / 180;
          return <line key={i}
            x1={12 + 7 * Math.cos(r)} y1={12 + 7 * Math.sin(r)}
            x2={12 + 9.5 * Math.cos(r)} y2={12 + 9.5 * Math.sin(r)}
            stroke="white" strokeWidth="1.4" strokeLinecap="round" />;
        })}
      </svg>
    ),
  },
  {
    id: 'ar',
    label: 'AR',
    tab: 'visao',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="white" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.4" />
        <path d="M17 7l2-2M7 7L5 5M17 17l2 2M7 17l-2 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'pol',
    label: 'Polarizado',
    tab: 'visao',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="18" height="8" rx="4" stroke="white" strokeWidth="1.4" />
        <line x1="8" y1="8" x2="8" y2="16" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="16" y1="8" x2="16" y2="16" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'espessura',
    label: 'Espessura',
    tab: 'superficie',
    icon: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <path d="M6 7c0 0 2.5 2.5 6 2.5S18 7 18 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M6 17c0 0 2.5-2.5 6-2.5S18 17 18 17" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="6" y1="7" x2="6" y2="17" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="18" y1="7" x2="18" y2="17" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
];

// ─── Módulos (estilo iOS — cada app com seu gradiente) ─────────────────────
const MODULES = [
  {
    id: 'mapa-visual',
    label: 'Tabela\nDinâmica',
    path: '/vision/mapa-visual',
    active: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #3ba6ff 0%, #0a6cff 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'demonstracoes',
    label: 'Demonstrações',
    path: '/vision/demonstracoes',
    active: true,
    submenu: 'demo',
    grad: 'linear-gradient(180deg, #c45cff 0%, #8e2de2 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const r2 = deg * Math.PI / 180;
          const x1 = 12 + 6 * Math.cos(r2), y1 = 12 + 6 * Math.sin(r2);
          const x2 = 12 + 9 * Math.cos(r2), y2 = 12 + 9 * Math.sin(r2);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />;
        })}
      </svg>
    ),
  },
  {
    id: 'venda-indicativa',
    label: 'Tabela\nDigital',
    path: '/vision/venda-indicativa',
    active: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #41d96b 0%, #1faf4a 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M5 4h14a1 1 0 0 1 1 1v3H4V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'lentes',
    label: 'Lentes',
    path: '/vision/mapa-visual',
    active: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #55d0f5 0%, #1f9ed8 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M15 9c1.1.8 2 2.1 2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'teste-visao',
    label: 'Teste de\nVisão',
    path: '/vision/atendimentos',
    active: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #ffb340 0%, #f08c00 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <text x="12" y="10" textAnchor="middle" fill="currentColor" fontSize="4" fontFamily="monospace" fontWeight="700">F P</text>
        <text x="12" y="14" textAnchor="middle" fill="currentColor" fontSize="3.5" fontFamily="monospace">T O Z</text>
        <text x="12" y="17.5" textAnchor="middle" fill="currentColor" fontSize="3" fontFamily="monospace">L P E D</text>
      </svg>
    ),
  },
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    path: '/vision/atendimentos',
    active: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #7d7aff 0%, #5352d4 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <line x1="7" y1="17" x2="7" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="17" y1="17" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'os',
    label: 'O.S.',
    path: '/vision/os',
    active: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #ff6482 0%, #e63057 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="15" x2="13" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <polyline points="13 16 15 18 19 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'visagismo',
    label: 'Visagismo',
    path: '/vision',
    active: false,
    comingSoon: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #ff5e9a 0%, #d63384 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'medidas',
    label: 'Medidas\niVision',
    path: '/vision',
    active: false,
    comingSoon: true,
    submenu: null,
    grad: 'linear-gradient(180deg, #6fd9e7 0%, #2bb3c7 100%)',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" />
        <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function VisionHome() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  function handleModule(mod: typeof MODULES[0]) {
    if (!mod.active) return;
    if (mod.submenu) {
      setOpenSubmenu(prev => prev === mod.submenu ? null : mod.submenu);
    } else {
      setOpenSubmenu(null);
      navigate(mod.path);
    }
  }

  function handleDemoItem(item: typeof DEMO_ITEMS[0]) {
    setOpenSubmenu(null);
    navigate(`/vision/demonstracoes?tab=${item.tab}&demo=${item.id}`);
  }

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0f4f8',
        overflow: 'hidden',
        position: 'relative',
      }}
      onClick={e => {
        if ((e.target as HTMLElement).closest('[data-submenu]')) return;
        setOpenSubmenu(null);
      }}
    >
      {/* Hero */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url(/home-hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
      }}>
        {/* Overlay com gradiente refinado */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(120deg, rgba(238,244,255,0.88) 0%, rgba(224,236,254,0.55) 45%, rgba(219,234,254,0.18) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Brilho azul difuso no canto */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '55%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.14) 0%, transparent 65%)',
          pointerEvents: 'none',
          animation: 'breathe 7s ease-in-out infinite',
        }} />
        {/* Linha de luz que varre o hero */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: 180,
          background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
          transform: 'skewX(-12deg)',
          animation: 'sweep 9s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* Fade inferior em direção à faixa de módulos */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 90,
          background: 'linear-gradient(to top, rgba(240,244,248,0.9), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Logo + card ótica */}
        <div style={{ position: 'absolute', top: 28, left: 32, pointerEvents: 'none', animation: 'riseIn .6s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(180deg, #3ba6ff 0%, #007aff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: '#fff',
              boxShadow: '0 6px 18px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}>V</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Connect <span style={{ color: '#007aff' }}>Vision</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.14em', fontWeight: 600 }}>SISTEMA PARA ÓTICAS</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 16,
            padding: '15px 22px',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 8px 32px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
            minWidth: 230,
          }}>
            <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Ótica conectada</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>{tenant?.nome ?? 'Sua Ótica'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: '#22c55e', animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
                }} />
                <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              </span>
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, letterSpacing: '0.03em' }}>Sistema ativo</span>
            </div>
          </div>
        </div>

        {/* Overlay escuro + faixa de submenu — cobre o hero inteiro */}
        {openSubmenu === 'demo' && (
          <>
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(4, 9, 28, 0.74)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                zIndex: 9,
                animation: 'fadeIn 0.2s ease',
              }}
            />
            <div
              data-submenu="true"
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '50%', left: 0, right: 0,
                transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, rgba(13, 24, 64, 0.92), rgba(20, 16, 58, 0.92))',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderTop: '1px solid rgba(120,160,255,0.22)',
                borderBottom: '1px solid rgba(120,160,255,0.22)',
                padding: '26px 0 30px',
                zIndex: 10,
                animation: 'slideIn 0.25s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <div style={{
                fontSize: 9, color: 'rgba(165,190,255,0.55)', fontFamily: 'var(--mono)',
                textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 22,
                textAlign: 'center', fontWeight: 700,
              }}>
                ◆ Demonstrações de Lentes ◆
              </div>
              <div style={{
                display: 'flex', gap: '14px 10px',
                flexWrap: 'wrap',
                justifyContent: 'center', alignItems: 'flex-start',
                paddingInline: 16, maxWidth: 760, margin: '0 auto',
              }}>
                {[...DEMO_ITEMS].sort((a, b) => DEMO_ORDER.indexOf(a.id) - DEMO_ORDER.indexOf(b.id)).map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => handleDemoItem(item)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 8,
                      width: 76, flex: '0 0 auto', padding: 0,
                      transition: 'transform 0.14s cubic-bezier(0.3,1.4,0.5,1)',
                      WebkitTapHighlightColor: 'transparent',
                      animation: `riseIn .4s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both`,
                    }}
                    onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                    onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {/* Squircle de vidro estilo iOS */}
                    <div style={{
                      width: 62, height: 62, borderRadius: 17,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                      border: '0.5px solid rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.25)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <img
                        src={`/icones-demo/${item.id}.png`}
                        alt={item.label}
                        draggable={false}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
                        pointerEvents: 'none',
                      }} />
                    </div>
                    <span style={{
                      fontSize: 11, color: 'rgba(245,248,255,0.95)',
                      fontWeight: 500, letterSpacing: '-0.01em',
                      textAlign: 'center', lineHeight: 1.1,
                    }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Hint na home normal */}
        {!openSubmenu && (
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            textAlign: 'center', fontSize: 11, color: '#7d8aa3',
            fontFamily: 'var(--sans)', letterSpacing: '0.08em',
            pointerEvents: 'none', fontWeight: 600, textTransform: 'uppercase',
          }}>
            Selecione um módulo para começar
          </div>
        )}
      </div>

      {/* Dock estilo iOS — ícones de app */}
      <div style={{
        background: 'rgba(248,250,253,0.78)',
        backdropFilter: 'blur(28px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
        borderTop: '0.5px solid rgba(60,60,67,0.18)',
        padding: '18px 20px 16px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 22,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 4, paddingTop: 4,
          justifyContent: 'flex-start',
        }}>
          {MODULES.map((mod, i) => {
            const isOpen = openSubmenu === mod.submenu && mod.submenu !== null;
            return (
              <button
                key={mod.id}
                data-submenu={mod.submenu ? 'true' : undefined}
                onClick={e => { e.stopPropagation(); handleModule(mod); }}
                style={{
                  flexShrink: 0,
                  width: 76,
                  background: 'none', border: 'none',
                  cursor: mod.active ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 7,
                  padding: 0,
                  position: 'relative',
                  opacity: mod.comingSoon ? 0.55 : 1,
                  transition: 'transform 0.14s cubic-bezier(0.3,1.4,0.5,1)',
                  WebkitTapHighlightColor: 'transparent',
                  animation: `riseIn .5s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.04}s both`,
                }}
                onPointerDown={e => {
                  if (!mod.active) return;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.88)';
                }}
                onPointerUp={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onPointerLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                {/* Ícone squircle estilo app iOS */}
                <div style={{
                  width: 62, height: 62, borderRadius: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(180deg, #3ba6ff 0%, #007aff 100%)',
                  color: '#fff',
                  boxShadow: isOpen
                    ? '0 8px 22px rgba(10,108,255,0.45), inset 0 1px 0 rgba(255,255,255,0.35)'
                    : '0 4px 14px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
                  outline: isOpen ? '2.5px solid rgba(0,122,255,0.85)' : 'none',
                  outlineOffset: 3,
                  position: 'relative',
                  transition: 'box-shadow 0.18s',
                }}>
                  {mod.icon}
                  {/* brilho superior do ícone (vidro) */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
                    borderRadius: '15px 15px 40% 40%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.28), rgba(255,255,255,0.02))',
                    pointerEvents: 'none',
                  }} />
                  {/* badge "em breve" estilo notificação iOS */}
                  {mod.comingSoon && (
                    <div style={{
                      position: 'absolute', top: -7, right: -7,
                      background: '#ff3b30', borderRadius: 999,
                      padding: '2.5px 7px',
                      fontSize: 7.5, fontWeight: 800, color: '#fff',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      boxShadow: '0 2px 8px rgba(255,59,48,0.5)',
                      border: '1.5px solid rgba(255,255,255,0.9)',
                      whiteSpace: 'nowrap',
                    }}>breve</div>
                  )}
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 500, color: isOpen ? '#007aff' : '#3a4255',
                  textAlign: 'center',
                  letterSpacing: '-0.01em', lineHeight: 1.2,
                  whiteSpace: 'pre-line',
                }}>{mod.label.replace('\n', ' ')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(calc(-50% + 24px)); }
          to   { opacity: 1; transform: translateY(-50%); }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: .8; }
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { opacity: .6; }
          50%      { opacity: 1; }
        }
        @keyframes sweep {
          0%       { left: -30%; opacity: 0; }
          12%      { opacity: 1; }
          38%      { left: 110%; opacity: 0; }
          100%     { left: 110%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
