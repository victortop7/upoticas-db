import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const TILES = [
  {
    id: 'mapa-visual',
    label: 'Mapa Visual',
    desc: 'Simulador de prescrição',
    path: '/vision/mapa-visual',
    color: '#3b82f6',
    bg: 'linear-gradient(145deg, #0c1829 0%, #050f1f 100%)',
    border: '#1e3a5f',
    icon: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="12" cy="12" r="5" stroke="#3b82f6" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" fill="#3b82f6" />
        <line x1="12" y1="3" x2="12" y2="6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="18" x2="12" y2="21" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="12" x2="6" y2="12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="12" x2="21" y2="12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'demonstracoes',
    label: 'Demonstrações',
    desc: 'Superfície · Tratamentos · Foto',
    path: '/vision/demonstracoes',
    color: '#22c55e',
    bg: 'linear-gradient(145deg, #0b1e13 0%, #050f0a 100%)',
    border: '#14532d',
    icon: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#22c55e" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" stroke="#22c55e" strokeWidth="1.5" />
        <path d="M12 9v-2M12 17v-2M9 12H7M17 12h-2" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'os',
    label: 'Ordem de Serviço',
    desc: 'Receita · Lab · Fechamento',
    path: '/vision/os',
    color: '#a855f7',
    bg: 'linear-gradient(145deg, #150d22 0%, #0c050f 100%)',
    border: '#3b0764',
    icon: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="#a855f7" strokeWidth="1.5" />
        <line x1="8" y1="7" x2="16" y2="7" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="11" x2="16" y2="11" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="15" x2="13" y2="15" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    desc: 'Histórico · Estatísticas',
    path: '/vision/atendimentos',
    color: '#f59e0b',
    bg: 'linear-gradient(145deg, #1a1205 0%, #0f0a02 100%)',
    border: '#451a03',
    icon: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="8" y1="17" x2="8" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="17" x2="16" y2="10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
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
      background: '#050508',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 52,
        background: '#07080e',
        borderBottom: '1px solid #12141c',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
          }}>V</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.3px' }}>
            Conect Vision
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
            {tenant?.nome ?? 'Ótica'}
          </span>
        </div>
      </div>

      {/* Tiles grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 2,
        padding: 2,
      }}>
        {TILES.map((tile) => (
          <button
            key={tile.id}
            onClick={() => navigate(tile.path)}
            style={{
              background: tile.bg,
              border: `1px solid ${tile.border}`,
              borderRadius: 16,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              padding: '28px 32px',
              gap: 0,
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.12s, filter 0.12s',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.985)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {/* Glow top-right */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 160, height: 160, borderRadius: '50%',
              background: `radial-gradient(circle, ${tile.color}28 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Icon */}
            <div style={{ marginBottom: 20 }}>
              {tile.icon}
            </div>

            <div style={{
              fontSize: 20, fontWeight: 700, color: '#f0f0f5',
              letterSpacing: '-0.3px', lineHeight: 1.1,
            }}>
              {tile.label}
            </div>
            <div style={{
              fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 1.4,
            }}>
              {tile.desc}
            </div>

            {/* Arrow */}
            <div style={{
              position: 'absolute', top: 24, right: 24,
              color: tile.color, opacity: 0.5,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
