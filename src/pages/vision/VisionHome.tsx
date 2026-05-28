import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const TILES = [
  {
    id: 'mapa-visual',
    label: 'Mapa Visual',
    desc: 'Simulador de lentes por prescrição',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.18)',
    path: '/vision/mapa-visual',
  },
  {
    id: 'demonstracoes',
    label: 'Demonstrações',
    desc: 'Superfície, tratamentos e fotossensível',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M20.188 10.934c.2.646.312 1.349.312 2.066 0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8c1.858 0 3.574.633 4.938 1.688"/>
        <path d="M22 12h-4"/>
        <path d="M12 2v4"/>
      </svg>
    ),
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.18)',
    path: '/vision/demonstracoes',
  },
  {
    id: 'os',
    label: 'Ordem de Serviço',
    desc: 'Receita, laboratório e fechamento',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.18)',
    path: '/vision/os',
  },
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    desc: 'Histórico de OS e estatísticas',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.18)',
    path: '/vision/atendimentos',
  },
];

export default function VisionHome() {
  const navigate = useNavigate();
  const { tenant } = useAuth();

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      gap: 32,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 13, color: '#3b82f6', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--mono)',
        }}>
          {tenant?.nome ?? 'Ótica'}
        </div>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 700, color: '#e8eaf0', lineHeight: 1.2,
        }}>
          Conect Vision
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#4a5568' }}>
          Selecione um módulo para começar
        </p>
      </div>

      {/* Grid de tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        width: '100%',
        maxWidth: 680,
      }}>
        {TILES.map((tile) => (
          <button
            key={tile.id}
            onClick={() => navigate(tile.path)}
            style={{
              background: '#0d1018',
              border: `1px solid ${tile.glow.replace('0.18', '0.3')}`,
              borderRadius: 20,
              padding: '32px 24px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 16,
              textAlign: 'left',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: `0 4px 24px ${tile.glow}`,
              minHeight: 160,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px ${tile.glow.replace('0.18', '0.32')}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 24px ${tile.glow}`;
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: tile.glow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: tile.color,
            }}>
              {tile.icon}
            </div>
            <div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: '#e8eaf0', marginBottom: 4,
              }}>
                {tile.label}
              </div>
              <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.4 }}>
                {tile.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
