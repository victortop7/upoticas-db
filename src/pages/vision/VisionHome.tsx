import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const MODULES = [
  {
    id: 'mapa-visual',
    label: 'Tabela Dinâmica',
    path: '/vision/mapa-visual',
    active: true,
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
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="#2563eb" strokeWidth="1.4" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const r = deg * Math.PI / 180;
          const x1 = 12 + 6 * Math.cos(r), y1 = 12 + 6 * Math.sin(r);
          const x2 = 12 + 9 * Math.cos(r), y2 = 12 + 9 * Math.sin(r);
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
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="#2563eb" strokeWidth="1.4" />
        <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M15 9c1.1 0.8 2 2.1 2 3" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'teste-visao',
    label: 'Teste de Visão',
    path: '/vision/atendimentos',
    active: true,
    comingSoon: false,
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
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#2563eb" strokeWidth="1.4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9 8c0-1.7 1.3-3 3-3" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'medidas',
    label: 'Medidas',
    path: '/vision',
    active: false,
    comingSoon: true,
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#2563eb" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="1.4" />
        <line x1="12" y1="2" x2="12" y2="4" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="22" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="21" y1="12" x2="19" y2="12" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="3" y1="12" x2="5" y2="12" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function VisionHome() {
  const navigate = useNavigate();
  const { tenant } = useAuth();

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f4f8',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Hero — fundo com gradiente + decoração óptica */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f7ff 40%, #dbeafe 100%)',
      }}>
        {/* Decoração óptica direita */}
        <svg
          style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', opacity: 0.18 }}
          width="600" height="600" viewBox="0 0 400 400" fill="none"
        >
          {[180, 150, 120, 90, 60, 30].map((r, i) => (
            <circle key={i} cx="200" cy="200" r={r} stroke="#1d4ed8" strokeWidth={i === 0 ? 1.5 : 0.8} />
          ))}
          <circle cx="200" cy="200" r="18" fill="#1d4ed8" fillOpacity="0.3" />
          <circle cx="200" cy="200" r="8" fill="#1d4ed8" fillOpacity="0.6" />
          <line x1="200" y1="20" x2="200" y2="60" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="200" y1="340" x2="200" y2="380" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="200" x2="60" y2="200" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="340" y1="200" x2="380" y2="200" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Logo + info */}
        <div style={{ position: 'absolute', top: 32, left: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
            }}>V</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Conect<span style={{ color: '#1d4ed8' }}>Vision</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.04em' }}>
                Sistema para Óticas
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 16,
            padding: '18px 24px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            maxWidth: 300,
          }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Ótica conectada</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              {tenant?.nome ?? 'Sua Ótica'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Sistema ativo</span>
            </div>
          </div>
        </div>

        {/* Tagline central */}
        <div style={{
          position: 'absolute',
          bottom: 32, left: 36,
        }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Selecione um módulo abaixo para começar
          </div>
        </div>
      </div>

      {/* Faixa de módulos */}
      <div style={{
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        padding: '16px 20px',
        flexShrink: 0,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 4,
        }}>
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => mod.active && navigate(mod.path)}
              style={{
                flexShrink: 0,
                width: 110,
                minHeight: 130,
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                cursor: mod.active ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '16px 8px',
                position: 'relative',
                overflow: 'hidden',
                opacity: mod.comingSoon ? 0.7 : 1,
                transition: 'transform 0.1s, box-shadow 0.1s, border-color 0.1s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onPointerDown={e => {
                if (!mod.active) return;
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb';
              }}
              onPointerUp={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
              }}
              onPointerLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
              }}
            >
              {mod.icon}
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: '#1e293b',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.3,
              }}>
                {mod.label}
              </span>

              {/* EM BREVE ribbon */}
              {mod.comingSoon && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: '#dc2626',
                  padding: '3px 0',
                  fontSize: 8.5,
                  fontWeight: 800,
                  color: '#fff',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  EM BREVE
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
