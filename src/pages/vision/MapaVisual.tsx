import { useState, useEffect } from 'react';
import DrumPicker from './components/DrumPicker';
import { api } from '../../lib/api';

interface Lente {
  id: string;
  marca: string;
  nome: string;
  tipo: string;
  indice: number;
  cor: string;
  grau_max: number | null;
  cil_max: number | null;
  adicao_max: number | null;
}

// Gera array de valores com step
function range(min: number, max: number, step: number): string[] {
  const result: string[] = [];
  for (let v = min; v <= max + 0.001; v += step) {
    const fixed = Math.round(v * 100) / 100;
    const s = fixed >= 0 ? `+${fixed.toFixed(2)}` : fixed.toFixed(2);
    result.push(s);
  }
  return result;
}

const ESF_VALUES = range(-20, 10, 0.25);
const CIL_VALUES = range(-6, 0, 0.25);
const ADD_VALUES = ['0.00', ...range(0.75, 3.5, 0.25).filter(v => v !== '+0.00')];
const DNP_VALUES = Array.from({ length: 37 }, (_, i) => (28 + i * 0.5).toFixed(1));

// Gera os dados do radar com base na prescrição selecionada
function calcRadar(esf: string, cil: string, add: string, lente: Lente | null) {
  const esfV = Math.abs(parseFloat(esf) || 0);
  const cilV = Math.abs(parseFloat(cil) || 0);
  const addV = parseFloat(add) || 0;

  const maxEsf = lente?.grau_max ?? 8;
  const maxCil = lente?.cil_max ?? 4;
  const maxAdd = lente?.adicao_max ?? 3.5;

  return [
    { subject: 'GRAU', value: Math.min((esfV / maxEsf) * 100, 100) },
    { subject: 'CILÍNDRICO', value: Math.min((cilV / maxCil) * 100, 100) },
    { subject: 'ADIÇÃO', value: addV > 0 ? Math.min((addV / maxAdd) * 100, 100) : 0 },
    { subject: 'LONGE', value: esfV < 3 ? 90 : esfV < 6 ? 70 : 50 },
    { subject: 'INTERM.', value: addV > 0 ? 75 : 50 },
    { subject: 'PERTO', value: addV > 0 ? Math.min((addV / 3.5) * 100, 100) : 40 },
    { subject: 'SOL', value: 0 },
  ];
}

const RECOMENDACOES = [
  'Lente indicada para sua prescrição',
  'Alta definição visual em todas as distâncias',
  'Tecnologia de ponta para reduzir fadiga',
  'Compatível com tratamento anti-reflexo',
  'Índice de refração ideal para seu grau',
  'Conforto visual garantido no dia a dia',
];

function SvgRadar({ data, color }: { data: { subject: string; value: number }[]; color: string }) {
  const cx = 140, cy = 130, r = 90;
  const n = data.length;
  const angles = data.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  function point(radius: number, i: number) {
    return {
      x: cx + radius * Math.cos(angles[i]),
      y: cy + radius * Math.sin(angles[i]),
    };
  }

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = data.map((d, i) => point((d.value / 100) * r, i));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width="280" height="260" viewBox="0 0 280 260">
      {/* Anéis de fundo */}
      {rings.map(ring => {
        const pts = data.map((_, i) => point(r * ring, i));
        return (
          <polygon key={ring}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="#1a1f2e" strokeWidth="1"
          />
        );
      })}
      {/* Eixos */}
      {data.map((_, i) => {
        const outer = point(r, i);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#1a1f2e" strokeWidth="1" />;
      })}
      {/* Área dos dados */}
      <polygon points={polyPoints} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {/* Pontos */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const labelR = r + 18;
        const lp = point(labelR, i);
        const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
        return (
          <text key={i} x={lp.x} y={lp.y + 4} textAnchor={anchor}
            fill="#4a5568" fontSize="9" fontFamily="var(--mono)">
            {d.subject}
          </text>
        );
      })}
    </svg>
  );
}

const MARCAS_LABELS: Record<string, string[]> = {
  'Varilux': ['#3b82f6'],
  'Hoya': ['#22c55e'],
  'Rodenstock': ['#a855f7'],
  'Zeiss': ['#f59e0b'],
  'Shamir': ['#06b6d4'],
  'Indo': ['#64748b'],
  'Optifog': ['#ef4444'],
};

export default function MapaVisual() {
  const [lentes, setLentes] = useState<Lente[]>([]);
  const [selectedLente, setSelectedLente] = useState<Lente | null>(null);
  const [esf, setEsf] = useState('+0.00');
  const [cil, setCil] = useState('0.00');
  const [add, setAdd] = useState('0.00');
  const [dnp, setDnp] = useState('32.0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Lente[]>('/vision/lentes').then(data => {
      setLentes(data);
      if (data.length > 0) setSelectedLente(data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const radarData = calcRadar(esf, cil, add, selectedLente);
  const marcas = [...new Set(lentes.map(l => l.marca))];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      background: '#080a0f',
    }}>
      {/* Área principal */}
      <div style={{
        flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0,
      }}>
        {/* Coluna esquerda — marcas */}
        <div style={{
          width: 200, background: '#0a0c12',
          borderRight: '1px solid #1a1f2e',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '14px 16px 8px',
            fontSize: 10, color: '#3d4a5c',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontFamily: 'var(--mono)', fontWeight: 600,
          }}>
            Lentes
          </div>

          {loading ? (
            <div style={{ padding: 16, color: '#3d4a5c', fontSize: 13 }}>Carregando...</div>
          ) : (
            marcas.map(marca => {
              const cor = MARCAS_LABELS[marca]?.[0] ?? '#3b82f6';
              const items = lentes.filter(l => l.marca === marca);
              return (
                <div key={marca}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px 4px',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: cor, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{marca}</span>
                  </div>
                  {items.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLente(l)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '8px 16px 8px 32px',
                        background: selectedLente?.id === l.id
                          ? `${cor}18` : 'transparent',
                        border: 'none', cursor: 'pointer',
                        borderLeft: selectedLente?.id === l.id
                          ? `2px solid ${cor}` : '2px solid transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{
                        fontSize: 12, color: selectedLente?.id === l.id
                          ? '#e8eaf0' : '#4a5568',
                        fontFamily: 'var(--sans)', lineHeight: 1.3,
                      }}>
                        {l.nome.replace(marca, '').trim()}
                      </div>
                      <div style={{
                        fontSize: 10, color: '#3d4a5c',
                        fontFamily: 'var(--mono)', marginTop: 2,
                      }}>
                        {l.indice ? `${l.indice}` : ''} {l.tipo}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Centro — radar + info lente */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
          gap: 16,
        }}>
          {/* Nome da lente selecionada */}
          {selectedLente && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 11, color: selectedLente.cor ?? '#3b82f6',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                fontFamily: 'var(--mono)', fontWeight: 700,
              }}>
                {selectedLente.marca}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eaf0', marginTop: 2 }}>
                {selectedLente.nome.replace(selectedLente.marca, '').trim()}
              </div>
              <div style={{
                fontSize: 12, color: '#3d4a5c', fontFamily: 'var(--mono)', marginTop: 4,
              }}>
                Índice {selectedLente.indice ?? '—'} · {selectedLente.tipo}
              </div>
            </div>
          )}

          {/* Radar chart — SVG puro */}
          <SvgRadar data={radarData} color={selectedLente?.cor ?? '#3b82f6'} />

          {/* Badges da lente */}
          {selectedLente && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {selectedLente.grau_max && (
                <span style={badgeStyle('#1a1f2e')}>
                  Grau até ±{selectedLente.grau_max.toFixed(1)}
                </span>
              )}
              {selectedLente.cil_max && (
                <span style={badgeStyle('#1a1f2e')}>
                  Cil até {selectedLente.cil_max.toFixed(1)}
                </span>
              )}
              {selectedLente.adicao_max && (
                <span style={badgeStyle('#1a1f2e')}>
                  Add até +{selectedLente.adicao_max.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Coluna direita — recomendações */}
        <div style={{
          width: 220, background: '#0a0c12',
          borderLeft: '1px solid #1a1f2e',
          display: 'flex', flexDirection: 'column',
          padding: '16px 0',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '0 16px 12px',
            fontSize: 10, color: '#3d4a5c',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontFamily: 'var(--mono)', fontWeight: 600,
          }}>
            Recomendações
          </div>
          {RECOMENDACOES.map((rec, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 16px',
                borderBottom: '1px solid #0f1218',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                background: `${selectedLente?.cor ?? '#3b82f6'}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                color: selectedLente?.cor ?? '#3b82f6',
                fontFamily: 'var(--mono)',
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <span style={{
                fontSize: 12, color: '#64748b', lineHeight: 1.5,
                fontFamily: 'var(--sans)',
              }}>
                {rec}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Drum pickers — prescrição */}
      <div style={{
        background: '#0a0c12',
        borderTop: '1px solid #1a1f2e',
        padding: '16px 24px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        overflowX: 'auto',
      }}>
        <div style={{
          fontSize: 11, color: '#3d4a5c', fontFamily: 'var(--mono)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          fontWeight: 600, marginRight: 8, whiteSpace: 'nowrap',
          alignSelf: 'center',
        }}>
          Prescrição
        </div>
        <DrumPicker
          label="Esférico"
          values={ESF_VALUES}
          selected={esf}
          onChange={setEsf}
          color={selectedLente?.cor ?? '#3b82f6'}
        />
        <DrumPicker
          label="Cilíndrico"
          values={CIL_VALUES}
          selected={cil}
          onChange={setCil}
          color={selectedLente?.cor ?? '#3b82f6'}
        />
        <DrumPicker
          label="Adição"
          values={ADD_VALUES}
          selected={add}
          onChange={setAdd}
          color={selectedLente?.cor ?? '#3b82f6'}
        />
        <div style={{ width: 1, background: '#1a1f2e', height: 80, alignSelf: 'center', flexShrink: 0, margin: '0 4px' }} />
        <DrumPicker
          label="DNP"
          values={DNP_VALUES}
          selected={dnp}
          onChange={setDnp}
          color="#64748b"
        />

        <div style={{ flex: 1 }} />

        {/* Prescrição selecionada resumida */}
        <div style={{
          background: '#0f1218', border: '1px solid #1a1f2e',
          borderRadius: 12, padding: '10px 16px',
          minWidth: 160, flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            Resumo
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '2px 16px',
          }}>
            {[
              ['Esf', esf],
              ['Cil', cil],
              ['Add', add !== '0.00' ? add : '—'],
              ['DNP', dnp],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)' }}>{k}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)',
                  color: selectedLente?.cor ?? '#3b82f6',
                }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function badgeStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    border: '1px solid #2a2f3e',
    borderRadius: 8,
    padding: '3px 10px',
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'var(--mono)',
  };
}
