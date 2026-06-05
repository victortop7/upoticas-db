import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ─── Submenus ─────────────────────────────────────────────────────────────
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
    id: 'polarizado',
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

// ─── Módulos ──────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'mapa-visual',
    label: 'Tabela\nDinâmica',
    path: '/vision/mapa-visual',
    active: true,
    submenu: null,
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#2563eb" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="5" stroke="#2563eb" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2" fill="#2563eb" />
        <line x1="12" y1="3" x2="12" y2="7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="21" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="3" y1="12" x2="7" y2="12" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="17" y1="12" x2="21" y2="12" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'demonstracoes',
    label: 'Demonstrações',
    path: '/vision/demonstracoes',
    active: true,
    submenu: 'demo',
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="#2563eb" strokeWidth="1.4" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const r2 = deg * Math.PI / 180;
          const x1 = 12 + 6 * Math.cos(r2), y1 = 12 + 6 * Math.sin(r2);
          const x2 = 12 + 9 * Math.cos(r2), y2 = 12 + 9 * Math.sin(r2);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />;
        })}
      </svg>
    ),
  },
  {
    id: 'lentes',
    label: 'Lentes',
    path: '/vision/mapa-visual',
    active: true,
    submenu: null,
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="#2563eb" strokeWidth="1.4" />
        <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M15 9c1.1.8 2 2.1 2 3" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'teste-visao',
    label: 'Teste de\nVisão',
    path: '/vision/atendimentos',
    active: true,
    submenu: null,
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="#2563eb" strokeWidth="1.4" />
        <text x="12" y="10" textAnchor="middle" fill="#2563eb" fontSize="4" fontFamily="monospace" fontWeight="700">F P</text>
        <text x="12" y="14" textAnchor="middle" fill="#2563eb" fontSize="3.5" fontFamily="monospace">T O Z</text>
        <text x="12" y="17.5" textAnchor="middle" fill="#2563eb" fontSize="3" fontFamily="monospace">L P E D</text>
        <circle cx="17" cy="16" r="3" fill="#2563eb" fillOpacity="0.1" stroke="#2563eb" strokeWidth="1" />
        <circle cx="17" cy="16" r="1.2" fill="#2563eb" />
      </svg>
    ),
  },
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    path: '/vision/atendimentos',
    active: true,
    submenu: null,
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#2563eb" strokeWidth="1.4" />
        <line x1="7" y1="17" x2="7" y2="12" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        <line x1="17" y1="17" x2="17" y2="10" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'os',
    label: 'O.S.',
    path: '/vision/os',
    active: true,
    submenu: null,
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="#2563eb" strokeWidth="1.4" />
        <line x1="8" y1="7" x2="16" y2="7" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="11" x2="16" y2="11" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="15" x2="13" y2="15" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
        <polyline points="13 16 15 18 19 14" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#2563eb" strokeWidth="1.4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
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
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#2563eb" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="1.4" />
        <line x1="12" y1="2" x2="12" y2="4" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="22" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
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
        backgroundImage: 'url(/portrait-young-business-woman-office.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
      }}>
        {/* Overlay claro sobre a foto para manter identidade visual */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(232,240,254,0.78) 0%, rgba(219,234,254,0.55) 50%, rgba(219,234,254,0.35) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Logo + card ótica */}
        <div style={{ position: 'absolute', top: 28, left: 32, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: '#fff',
            }}>V</div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
                Conect<span style={{ color: '#1d4ed8' }}>Vision</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b', letterSpacing: '0.06em' }}>SISTEMA PARA ÓTICAS</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '14px 20px',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            minWidth: 220,
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Ótica conectada</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{tenant?.nome ?? 'Sua Ótica'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Sistema ativo</span>
            </div>
          </div>
        </div>

        {/* Overlay escuro + faixa de submenu — cobre o hero inteiro */}
        {openSubmenu === 'demo' && (
          <>
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5, 10, 30, 0.72)',
                zIndex: 9,
                animation: 'fadeIn 0.18s ease',
              }}
            />
            <div
              data-submenu="true"
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '50%', left: 0, right: 0,
                transform: 'translateY(-50%)',
                background: 'rgba(12, 22, 58, 0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '24px 0 28px',
                zIndex: 10,
                animation: 'slideIn 0.22s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)',
                textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 22,
                textAlign: 'center', fontWeight: 700,
              }}>
                Demonstrações de Lentes
              </div>
              <div style={{
                display: 'flex', gap: 12,
                justifyContent: 'center', alignItems: 'center',
                paddingInline: 24,
              }}>
                {DEMO_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleDemoItem(item)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 16,
                      padding: '20px 16px',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 12,
                      minWidth: 88, flex: '0 0 auto',
                      transition: 'background 0.12s, transform 0.1s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onPointerDown={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)';
                    }}
                    onPointerUp={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                    onPointerLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    {item.icon}
                    <span style={{
                      fontSize: 10.5, color: 'rgba(255,255,255,0.88)',
                      fontWeight: 600, letterSpacing: '0.05em',
                      textTransform: 'uppercase',
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
            position: 'absolute', bottom: 18, left: 0, right: 0,
            textAlign: 'center', fontSize: 11, color: '#94a3b8',
            fontFamily: 'var(--sans)', letterSpacing: '0.03em',
            pointerEvents: 'none',
          }}>
            Selecione um módulo abaixo para começar
          </div>
        )}
      </div>

      {/* Faixa de módulos */}
      <div style={{
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        padding: '14px 18px',
        flexShrink: 0,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex', gap: 10,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 2,
        }}>
          {MODULES.map(mod => {
            const isOpen = openSubmenu === mod.submenu && mod.submenu !== null;
            return (
              <button
                key={mod.id}
                data-submenu={mod.submenu ? 'true' : undefined}
                onClick={e => { e.stopPropagation(); handleModule(mod); }}
                style={{
                  flexShrink: 0,
                  width: 110, minHeight: 128,
                  background: isOpen ? '#eff6ff' : '#fff',
                  border: `1.5px solid ${isOpen ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: 14,
                  cursor: mod.active ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, padding: '14px 8px',
                  position: 'relative', overflow: 'hidden',
                  opacity: mod.comingSoon ? 0.65 : 1,
                  transition: 'transform 0.1s, border-color 0.15s, background 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onPointerDown={e => {
                  if (!mod.active) return;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onPointerUp={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onPointerLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                {mod.icon}
                <span style={{
                  fontSize: 10.5, fontWeight: 700, color: isOpen ? '#1d4ed8' : '#1e293b',
                  textAlign: 'center', textTransform: 'uppercase',
                  letterSpacing: '0.05em', lineHeight: 1.3,
                  whiteSpace: 'pre-line',
                }}>{mod.label}</span>

                {mod.comingSoon && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: '#dc2626', padding: '3px 0',
                    fontSize: 8, fontWeight: 800, color: '#fff',
                    textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>EM BREVE</div>
                )}
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
      `}</style>
    </div>
  );
}
