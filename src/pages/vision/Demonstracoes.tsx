import { useState, useRef } from 'react';

type Tab = 'superficie' | 'visao' | 'fotossensivel';

const TRATAMENTOS = [
  { id: 'ar', label: 'Anti-Reflexo' },
  { id: 'az', label: 'Luz Azul' },
  { id: 'ab', label: 'Anti-Abrasivo' },
  { id: 'hf', label: 'Hidro-fóbico' },
  { id: 'uv', label: 'Proteção UV' },
  { id: 'ft', label: 'Fotossensível' },
];

const AMBIENTES = [
  { id: 'noite', label: 'Noite', emoji: '🌙' },
  { id: 'chuva', label: 'Chuva', emoji: '🌧️' },
  { id: 'sol', label: 'Sol', emoji: '☀️' },
  { id: 'tela', label: 'Tela', emoji: '💻' },
  { id: 'leitura', label: 'Leitura', emoji: '📖' },
];

// Descrições por tratamento + ambiente (simplificado)
const DESCRICOES: Record<string, string> = {
  ar: 'Elimina até 99% dos reflexos, aumentando nitidez e reduzindo fadiga visual.',
  az: 'Filtra a luz azul nociva emitida por telas, protegendo os olhos e melhorando o sono.',
  ab: 'Superfície endurecida que resiste a riscos do dia a dia, aumentando durabilidade.',
  hf: 'Repele água e gordura, tornando a limpeza fácil e mantendo a lente impecável.',
  uv: 'Bloqueia 100% dos raios UVA e UVB, prevenindo danos à retina.',
  ft: 'Escurece automaticamente ao sol e clarea em ambientes fechados.',
};

// SVGs das superfícies (representação simplificada)
function SuperficieConvencional() {
  return (
    <svg viewBox="0 0 260 200" width="260" height="200">
      <defs>
        <radialGradient id="gconv" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0a0c12" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="260" height="200" rx="16" fill="#0a0c12" stroke="#1a1f2e" strokeWidth="1" />
      {[20, 35, 50, 65, 80, 95, 110].map((r, i) => (
        <ellipse key={i} cx="130" cy="100" rx={r * 1.4} ry={r} fill="none"
          stroke="#3b82f6" strokeWidth={i === 0 ? 1.5 : 0.8} strokeOpacity={0.4 - i * 0.04} />
      ))}
      <ellipse cx="130" cy="100" rx="18" ry="13" fill="#3b82f629" stroke="#3b82f6" strokeWidth="2" />
      <text x="130" y="175" textAnchor="middle" fill="#4a5568" fontSize="12" fontFamily="var(--mono)">CONVENCIONAL</text>
    </svg>
  );
}

function SuperficieDigital() {
  return (
    <svg viewBox="0 0 260 200" width="260" height="200">
      <defs>
        <linearGradient id="gdig" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
          <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="260" height="200" rx="16" fill="#0a0c12" stroke="#1a1f2e" strokeWidth="1" />
      {/* Superfície lisa com highlight */}
      <ellipse cx="130" cy="100" rx="110" ry="75" fill="url(#gdig)" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
      <ellipse cx="105" cy="80" rx="28" ry="14" fill="#3b82f6" fillOpacity="0.18" />
      {/* Linhas de grade suave */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1={50 + i * 40} y1="40" x2={50 + i * 40} y2="160"
          stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.2" />
      ))}
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1="20" y1={55 + i * 30} x2="240" y2={55 + i * 30}
          stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.2" />
      ))}
      <text x="130" y="175" textAnchor="middle" fill="#3b82f6" fontSize="12" fontFamily="var(--mono)">DIGITAL</text>
    </svg>
  );
}

// Placeholder ambiente (cor de fundo muda por ambiente)
const AMBIENTE_CORES: Record<string, { bg: string; overlay: string }> = {
  noite: { bg: '#050810', overlay: '#00000090' },
  chuva: { bg: '#0d1520', overlay: '#1e3a5f60' },
  sol: { bg: '#1a1200', overlay: '#ffd70030' },
  tela: { bg: '#080f1a', overlay: '#3b82f620' },
  leitura: { bg: '#120e08', overlay: '#f5e6c820' },
};

function VisaoComSem({ tratamento, ambiente }: { tratamento: string; ambiente: string }) {
  const [dividerX, setDividerX] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const cores = AMBIENTE_CORES[ambiente] ?? AMBIENTE_CORES.noite;

  function handleMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setDividerX(Math.min(90, Math.max(10, pct)));
  }

  function handleTouchMove(e: React.TouchEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const pct = ((touch.clientX - rect.left) / rect.width) * 100;
    setDividerX(Math.min(90, Math.max(10, pct)));
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        position: 'relative', width: '100%', height: 320,
        borderRadius: 20, overflow: 'hidden', cursor: 'col-resize',
        background: cores.bg, border: '1px solid #1a1f2e',
        userSelect: 'none',
      }}
    >
      {/* Lado SEM tratamento (esquerda) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: cores.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 11, color: '#3d4a5c', fontFamily: 'var(--mono)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          SEM TRATAMENTO
        </div>
      </div>

      {/* Lado COM tratamento (direita) */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `inset(0 ${100 - dividerX}% 0 0)`,
        background: `linear-gradient(135deg, ${cores.bg}, ${cores.overlay.replace('60', 'ff')})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'clip-path 0s',
      }}>
        <div style={{
          fontSize: 11, color: '#e8eaf0', fontFamily: 'var(--mono)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          opacity: dividerX > 20 ? 1 : 0,
        }}>
          COM {TRATAMENTOS.find(t => t.id === tratamento)?.label?.toUpperCase()}
        </div>
      </div>

      {/* Linha divisória */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${dividerX}%`, transform: 'translateX(-50%)',
        width: 2, background: '#fff',
        boxShadow: '0 0 8px rgba(255,255,255,0.6)',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 28, height: 28, borderRadius: '50%',
          background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1f2e" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1f2e" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: -6 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Labels COM/SEM */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        fontSize: 10, color: '#4a5568', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', background: '#00000060', padding: '3px 8px', borderRadius: 6,
      }}>SEM</div>
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        fontSize: 10, color: '#e8eaf0', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', background: '#00000060', padding: '3px 8px', borderRadius: 6,
      }}>COM</div>
    </div>
  );
}

function Fotossensivel() {
  const [valor, setValor] = useState(0);

  const opacity = valor / 100;
  const bgColor = `rgba(${Math.round(20 - opacity * 20)}, ${Math.round(20 - opacity * 15)}, ${Math.round(10 - opacity * 10)}, 1)`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      {/* Preview da lente */}
      <div style={{
        position: 'relative', width: 280, height: 200,
        borderRadius: 20, overflow: 'hidden',
        background: '#0a0c12', border: '1px solid #1a1f2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Lente com escurecimento */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(${Math.round(opacity * 30)}, ${Math.round(opacity * 20)}, ${Math.round(opacity * 5)}, ${opacity * 0.85})`,
          transition: 'background 0.4s ease',
        }} />
        <svg viewBox="0 0 160 120" width="160" height="120" style={{ position: 'relative', zIndex: 1 }}>
          <ellipse cx="80" cy="60" rx="70" ry="50"
            fill={`rgba(${Math.round(opacity * 180)}, ${Math.round(opacity * 120)}, ${Math.round(opacity * 30)}, ${0.15 + opacity * 0.5})`}
            stroke={`rgba(${Math.round(opacity * 200)}, ${Math.round(opacity * 140)}, ${Math.round(opacity * 40)}, ${0.3 + opacity * 0.5})`}
            strokeWidth="2" />
          {opacity > 0.3 && (
            <text x="80" y="65" textAnchor="middle" fill={`rgba(255,220,80,${opacity})`}
              fontSize="11" fontFamily="var(--mono)">
              {Math.round(opacity * 100)}% escura
            </text>
          )}
          {opacity < 0.2 && (
            <text x="80" y="65" textAnchor="middle" fill="rgba(100,116,139,0.8)"
              fontSize="11" fontFamily="var(--mono)">
              Clara
            </text>
          )}
        </svg>

        {/* Ícone ambiente */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: 20, filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
        }}>
          {valor < 30 ? '🏠' : valor < 70 ? '⛅' : '☀️'}
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 12,
        }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{
            fontSize: 11, color: '#3d4a5c', fontFamily: 'var(--mono)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Intensidade da Luz Solar</span>
          <span style={{ fontSize: 20 }}>☀️</span>
        </div>
        <input
          type="range" min={0} max={100} value={valor}
          onChange={e => setValor(Number(e.target.value))}
          style={{
            width: '100%', height: 6, appearance: 'none',
            background: `linear-gradient(to right, #1a2a4a ${valor}%, #1a1f2e ${valor}%)`,
            borderRadius: 4, outline: 'none', cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 8, fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
        }}>
          <span>Ambiente fechado</span>
          <span>Luz solar direta</span>
        </div>
      </div>

      <p style={{
        fontSize: 13, color: '#64748b', textAlign: 'center',
        maxWidth: 360, lineHeight: 1.6, fontFamily: 'var(--sans)',
        margin: 0,
      }}>
        A lente fotossensível escurece automaticamente ao detectar raios UV, voltando ao estado claro em ambientes fechados em poucos segundos.
      </p>
    </div>
  );
}

export default function Demonstracoes() {
  const [tab, setTab] = useState<Tab>('superficie');
  const [tratamento, setTratamento] = useState('ar');
  const [ambiente, setAmbiente] = useState('noite');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      background: '#080a0f',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        background: '#0a0c12',
        borderBottom: '1px solid #1a1f2e',
        padding: '0 24px',
      }}>
        {([
          ['superficie', 'Superfície'],
          ['visao', 'Visão'],
          ['fotossensivel', 'Fotossensível'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 20px',
              fontSize: 13, fontWeight: 600,
              color: tab === t ? '#3b82f6' : '#4a5568',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
              fontFamily: 'var(--sans)',
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, gap: 32,
      }}>

        {/* Superfície */}
        {tab === 'superficie' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', width: '100%' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#e8eaf0' }}>
              Tecnologia de Superfície
            </h2>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <SuperficieConvencional />
                <p style={{ margin: 0, fontSize: 12, color: '#4a5568', maxWidth: 240, textAlign: 'center', lineHeight: 1.5 }}>
                  Lentes convencionais utilizam processos de geração esférica com anéis concêntricos, gerando aberrações periféricas.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <SuperficieDigital />
                <p style={{ margin: 0, fontSize: 12, color: '#4a5568', maxWidth: 240, textAlign: 'center', lineHeight: 1.5 }}>
                  Lentes digitais são produzidas ponto a ponto com fresagem computadorizada, garantindo superfície perfeitamente suave e maior nitidez.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Visão COM/SEM */}
        {tab === 'visao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 680 }}>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{
                  fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
                  textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em',
                }}>Tratamento</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TRATAMENTOS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTratamento(t.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12, fontFamily: 'var(--sans)',
                        background: tratamento === t.id ? '#3b82f6' : '#0f1218',
                        border: `1px solid ${tratamento === t.id ? '#3b82f6' : '#1a1f2e'}`,
                        color: tratamento === t.id ? '#fff' : '#4a5568',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
                  textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em',
                }}>Ambiente</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {AMBIENTES.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAmbiente(a.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 12, fontFamily: 'var(--sans)',
                        background: ambiente === a.id ? '#1a1f2e' : 'transparent',
                        border: `1px solid ${ambiente === a.id ? '#2a2f3e' : '#1a1f2e'}`,
                        color: ambiente === a.id ? '#e8eaf0' : '#4a5568',
                        display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{a.emoji}</span>
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <VisaoComSem tratamento={tratamento} ambiente={ambiente} />

            <p style={{
              margin: 0, fontSize: 13, color: '#64748b',
              lineHeight: 1.6, fontFamily: 'var(--sans)',
              background: '#0a0c12', borderRadius: 12, padding: '12px 16px',
              border: '1px solid #1a1f2e',
            }}>
              {DESCRICOES[tratamento]}
            </p>
          </div>
        )}

        {/* Fotossensível */}
        {tab === 'fotossensivel' && <Fotossensivel />}
      </div>
    </div>
  );
}
