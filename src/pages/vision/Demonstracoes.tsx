import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Tab = 'superficie' | 'visao' | 'fotossensivel';

const TRATAMENTOS = [
  { id: 'ar', label: 'Anti-Reflexo', cor: '#3b82f6' },
  { id: 'az', label: 'Luz Azul', cor: '#8b5cf6' },
  { id: 'ft', label: 'Fotossensível', cor: '#f59e0b' },
  { id: 'ab', label: 'Anti-Abrasivo', cor: '#22c55e' },
  { id: 'hf', label: 'Hidro-fóbico', cor: '#06b6d4' },
  { id: 'uv', label: 'Proteção UV', cor: '#ef4444' },
];

const AMBIENTES = [
  { id: 'noite', label: 'Noite', emoji: '🌙' },
  { id: 'chuva', label: 'Chuva', emoji: '🌧️' },
  { id: 'sol', label: 'Sol', emoji: '☀️' },
  { id: 'tela', label: 'Tela', emoji: '💻' },
  { id: 'leitura', label: 'Leitura', emoji: '📖' },
];

const DESCRICOES: Record<string, string> = {
  ar: 'Elimina até 99,9% dos reflexos luminosos. Aumenta a transmissão de luz, reduz o cansaço visual e melhora o contraste em todas as situações de iluminação.',
  az: 'Filtra a faixa de luz azul nociva emitida por monitores, smartphones e lâmpadas LED. Reduz a fadiga digital e melhora a qualidade do sono.',
  ft: 'Tecnologia fotocromática que escurece automaticamente ao detectar raios UV. Volta ao estado claro em ambientes fechados em poucos segundos.',
  ab: 'Camada de endurecimento que protege a lente contra riscos e arranhões do dia a dia, aumentando a vida útil e mantendo a clareza óptica.',
  hf: 'Superfície que repele água, gordura e partículas de poeira. Facilita a limpeza e mantém a lente impecável por mais tempo.',
  uv: 'Bloqueio total dos raios UVA e UVB, prevenindo danos à córnea, ao cristalino e à retina causados pela exposição solar.',
};

const AMBIENTE_OVERLAY: Record<string, { sem: string; com: string }> = {
  noite: { sem: '#050810', com: '#0a1a3a' },
  chuva: { sem: '#060c12', com: '#0d2040' },
  sol: { sem: '#0a0800', com: '#1a1200' },
  tela: { sem: '#050810', com: '#060f1c' },
  leitura: { sem: '#080604', com: '#100e08' },
};

// ─── Superfície ──────────────────────────────────────────────────────────────
function Superficie({ initialDemo }: { initialDemo?: string }) {
  const [tipo, setTipo] = useState<'convencional' | 'digital'>(
    initialDemo === 'digital' ? 'digital' : 'convencional'
  );

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 32, padding: '24px 40px',
    }}>
      <div style={{ display: 'flex', gap: 0, background: '#07080e', borderRadius: 10, padding: 3, border: '1px solid #1e2030' }}>
        {(['convencional', 'digital'] as const).map(t => (
          <button key={t} onClick={() => setTipo(t)} style={{
            padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tipo === t ? '#1e2030' : 'transparent',
            color: tipo === t ? '#f0f0f5' : '#4b5563',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            transition: 'all 0.15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* SVG da superfície */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: '#07080e', border: '1px solid #1e2030',
            borderRadius: 20, padding: 32,
          }}>
            {tipo === 'convencional' ? (
              <svg viewBox="0 0 220 180" width="220" height="180">
                {[10, 22, 36, 52, 70, 88, 105].map((r, i) => (
                  <ellipse key={i} cx="110" cy="90" rx={r * 1.5} ry={r}
                    fill="none" stroke="#3b82f6"
                    strokeWidth={i === 0 ? 1.8 : 0.7}
                    strokeOpacity={0.5 - i * 0.05} />
                ))}
                <ellipse cx="110" cy="90" rx="14" ry="10" fill="#3b82f630" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 220 180" width="220" height="180">
                <defs>
                  <linearGradient id="gdig2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.04" />
                    <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                <ellipse cx="110" cy="90" rx="100" ry="70" fill="url(#gdig2)" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
                <ellipse cx="88" cy="72" rx="28" ry="14" fill="#3b82f6" fillOpacity="0.15" />
                {[0, 1, 2, 3].map(i => (
                  <line key={i} x1={30 + i * 53} y1="25" x2={30 + i * 53} y2="155" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.15" />
                ))}
                {[0, 1, 2].map(i => (
                  <line key={i} x1="10" y1={50 + i * 40} x2="210" y2={50 + i * 40} stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.15" />
                ))}
              </svg>
            )}
          </div>
          <div style={{
            fontSize: 11, color: tipo === 'convencional' ? '#6b7280' : '#3b82f6',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
          }}>{tipo}</div>
        </div>

        {/* Descrição */}
        <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.3px' }}>
            {tipo === 'convencional' ? 'Lente Convencional' : 'Lente Digital'}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
            {tipo === 'convencional'
              ? 'Produzida com geração esférica e anéis concêntricos. Apresenta aberrações ópticas nas regiões periféricas, podendo gerar distorções e menor nitidez fora do eixo visual.'
              : 'Fresada ponto a ponto por computador com precisão de 0,01 mm. Superfície perfeitamente suave, sem anéis. Maior nitidez, menor distorção e mais conforto visual em toda a lente.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(tipo === 'convencional'
              ? ['Processo de fabricação tradicional', 'Aberrações periféricas presentes', 'Custo mais acessível']
              : ['Fresagem CNC ponto a ponto', 'Sem aberrações periféricas', 'Máxima nitidez e conforto']
            ).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: tipo === 'digital' ? '#3b82f6' : '#374151', flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: '#4b5563' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visão COM/SEM ───────────────────────────────────────────────────────────
function Visao({ initialDemo }: { initialDemo?: string }) {
  const [tratamento, setTratamento] = useState(
    TRATAMENTOS.some(t => t.id === initialDemo) ? initialDemo! : 'ar'
  );
  const [ambiente, setAmbiente] = useState('noite');
  const [divX, setDivX] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const trObj = TRATAMENTOS.find(t => t.id === tratamento)!;
  const cores = AMBIENTE_OVERLAY[ambiente];

  function move(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setDivX(Math.min(92, Math.max(8, pct)));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 24, padding: '14px 28px',
        borderBottom: '1px solid #12141c', flexShrink: 0, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TRATAMENTOS.map(t => (
            <button key={t.id} onClick={() => setTratamento(t.id)} style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: tratamento === t.id ? t.cor : '#07080e',
              border: `1px solid ${tratamento === t.id ? t.cor : '#1e2030'}`,
              color: tratamento === t.id ? '#fff' : '#4b5563',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)',
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {AMBIENTES.map(a => (
            <button key={a.id} onClick={() => setAmbiente(a.id)} style={{
              padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
              background: ambiente === a.id ? '#1e2030' : 'transparent',
              border: `1px solid ${ambiente === a.id ? '#2a2d3e' : '#1e2030'}`,
              color: ambiente === a.id ? '#f0f0f5' : '#4b5563',
              fontSize: 12, fontFamily: 'var(--sans)',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 14 }}>{a.emoji}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comparador */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        <div
          ref={containerRef}
          onMouseDown={() => { dragging.current = true; }}
          onMouseMove={e => { if (dragging.current) move(e.clientX); }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
          onTouchMove={e => move(e.touches[0].clientX)}
          style={{
            flex: 1, position: 'relative', cursor: 'col-resize',
            background: cores.sem, userSelect: 'none',
          }}
        >
          {/* COM tratamento (esquerda do divider) */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${cores.com} 0%, ${cores.sem} 100%)`,
            clipPath: `inset(0 ${100 - divX}% 0 0)`,
          }} />

          {/* Linha divisória */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${divX}%`, transform: 'translateX(-50%)',
            width: 2, background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 0 12px rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e2030" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e2030" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: -8 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 11, color: '#374151', fontFamily: 'var(--mono)', background: '#00000070', padding: '4px 10px', borderRadius: 6, letterSpacing: '0.08em' }}>SEM</div>
          <div style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 11, color: '#f0f0f5', fontFamily: 'var(--mono)', background: '#00000070', padding: '4px 10px', borderRadius: 6, letterSpacing: '0.08em' }}>COM {trObj.label.toUpperCase()}</div>

          {/* Descrição no centro */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: '#00000090', borderRadius: 12, padding: '10px 18px',
            maxWidth: 300, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: trObj.cor, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4, letterSpacing: '0.06em' }}>
              {trObj.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
              {DESCRICOES[tratamento]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fotossensível ───────────────────────────────────────────────────────────
function Fotossensivel() {
  const [valor, setValor] = useState(0);
  const opacity = valor / 100;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 40px', gap: 32,
    }}>
      {/* Preview da lente */}
      <div style={{
        position: 'relative', width: 320, height: 220,
        borderRadius: 24, overflow: 'hidden',
        background: '#07080e', border: '1px solid #1e2030',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(${Math.round(opacity * 30)}, ${Math.round(opacity * 20)}, ${Math.round(opacity * 5)}, ${opacity * 0.88})`,
          transition: 'background 0.3s ease',
        }} />
        <svg viewBox="0 0 200 140" width="200" height="140" style={{ position: 'relative', zIndex: 1 }}>
          <ellipse cx="100" cy="70" rx="88" ry="60"
            fill={`rgba(${Math.round(opacity * 160)}, ${Math.round(opacity * 100)}, ${Math.round(opacity * 20)}, ${0.1 + opacity * 0.45})`}
            stroke={`rgba(${Math.round(opacity * 180)}, ${Math.round(opacity * 120)}, ${Math.round(opacity * 30)}, ${0.2 + opacity * 0.55})`}
            strokeWidth="1.5" />
          <text x="100" y="75" textAnchor="middle"
            fill={opacity > 0.1 ? `rgba(255,210,60,${opacity})` : 'rgba(75,85,99,0.8)'}
            fontSize="13" fontFamily="var(--mono)" fontWeight="600">
            {opacity < 0.1 ? 'CLARA' : `${Math.round(opacity * 100)}% ESCURA`}
          </text>
        </svg>
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 26 }}>
          {valor < 25 ? '🏠' : valor < 60 ? '⛅' : '☀️'}
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Intensidade da Luz Solar
          </span>
          <span style={{ fontSize: 22 }}>☀️</span>
        </div>
        <div style={{ position: 'relative', height: 8, background: '#1e2030', borderRadius: 4 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${valor}%`, borderRadius: 4,
            background: `linear-gradient(to right, #1e3a5f, #f59e0b)`,
            transition: 'width 0s',
          }} />
          <input
            type="range" min={0} max={100} value={valor}
            onChange={e => setValor(Number(e.target.value))}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer', margin: 0,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#374151', fontFamily: 'var(--mono)' }}>
          <span>Ambiente interno</span>
          <span>Luz solar direta</span>
        </div>
      </div>

      <p style={{
        margin: 0, fontSize: 13, color: '#6b7280', textAlign: 'center',
        maxWidth: 400, lineHeight: 1.7,
        background: '#07080e', borderRadius: 14, padding: '14px 20px',
        border: '1px solid #1e2030',
      }}>
        {DESCRICOES['ft']}
      </p>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Demonstracoes() {
  const [params] = useSearchParams();
  const rawTab = params.get('tab') ?? 'superficie';
  const demo = params.get('demo') ?? '';
  const validTabs: Tab[] = ['superficie', 'visao', 'fotossensivel'];
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : 'superficie';

  const [tab, setTab] = useState<Tab>(initialTab);
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#050508', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 48,
        background: '#07080e', borderBottom: '1px solid #12141c', flexShrink: 0,
      }}>
        <button onClick={() => navigate('/vision')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280',
          fontSize: 13, fontFamily: 'var(--sans)', padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          Voltar
        </button>

        {/* Tabs centralizadas */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            ['superficie', 'SUPERFÍCIE'],
            ['visao', 'VISÃO'],
            ['fotossensivel', 'SIMULAÇÃO'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 20px', height: 48,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              color: tab === t ? '#f0f0f5' : '#374151',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
              fontFamily: 'var(--mono)', transition: 'color 0.15s',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ width: 80 }} />
      </div>

      {tab === 'superficie' && <Superficie initialDemo={demo} />}
      {tab === 'visao' && <Visao initialDemo={demo} />}
      {tab === 'fotossensivel' && <Fotossensivel />}
    </div>
  );
}
