import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

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

// ─── Drum Picker ────────────────────────────────────────────────────────────
const ITEM_H = 46;

function DrumPicker({ label, values, selected, onChange, color = '#3b82f6' }: {
  label: string; values: string[]; selected: string;
  onChange: (v: string) => void; color?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selectedIdx = Math.max(0, values.indexOf(selected));

  const scrollTo = useCallback((idx: number, smooth = true) => {
    listRef.current?.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => { scrollTo(selectedIdx, false); }, []);

  const onScroll = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, values.length - 1));
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      onChange(values[clamped]);
    }, 80);
  }, [values, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{
        fontSize: 10, color: '#8e8e93',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
      }}>{label}</div>

      <div style={{
        position: 'relative', height: ITEM_H * 5, overflow: 'hidden',
        borderRadius: 12, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', width: '100%',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2,
          background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0))',
          pointerEvents: 'none', zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', top: ITEM_H * 2, left: 4, right: 4, height: ITEM_H,
          background: 'rgba(118,118,128,0.12)',
          borderRadius: 9,
          pointerEvents: 'none', zIndex: 1,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2,
          background: 'linear-gradient(to top, #fff, rgba(255,255,255,0))',
          pointerEvents: 'none', zIndex: 2,
        }} />
        <div
          ref={listRef}
          onScroll={onScroll}
          style={{
            height: '100%', overflowY: 'scroll', scrollbarWidth: 'none',
            paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2,
          }}
        >
          {values.map((v, i) => {
            const isSel = i === selectedIdx;
            return (
              <div
                key={v}
                onClick={() => { onChange(v); scrollTo(i); }}
                style={{
                  height: ITEM_H,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isSel ? 17 : 14,
                  fontWeight: isSel ? 600 : 400,
                  color: isSel ? color : '#c7c7cc',
                  fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
                  transition: 'color 0.1s',
                }}
              >{v}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Radar SVG ──────────────────────────────────────────────────────────────
function RadarChart({ data, color }: { data: { subject: string; value: number }[]; color: string }) {
  const W = 300, H = 280, cx = W / 2, cy = H / 2 - 4, R = 100;
  const n = data.length;
  const angles = data.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  function pt(r: number, i: number) {
    return { x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) };
  }

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPolygon = data.map((d, i) => pt((d.value / 100) * R, i));
  const polyPts = dataPolygon.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {rings.map(ring => {
        const pts = data.map((_, i) => pt(R * ring, i));
        return (
          <polygon key={ring}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="#d8d8de" strokeWidth={ring === 1 ? 1.2 : 0.8}
          />
        );
      })}
      {data.map((_, i) => {
        const outer = pt(R, i);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#d8d8de" strokeWidth="0.8" />;
      })}
      <polygon points={polyPts} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {dataPolygon.map((p, i) => (
        data[i].value > 2 && <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
      {data.map((d, i) => {
        const lp = pt(R + 20, i);
        const anchor = lp.x < cx - 8 ? 'end' : lp.x > cx + 8 ? 'start' : 'middle';
        return (
          <text key={i} x={lp.x} y={lp.y + 4} textAnchor={anchor}
            fill="#8e8e93" fontSize="9.5" fontWeight="600" letterSpacing="0.04em">
            {d.subject}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function range(min: number, max: number, step: number): string[] {
  const out: string[] = [];
  for (let v = min; v <= max + 0.001; v += step) {
    const f = Math.round(v * 100) / 100;
    out.push(f >= 0 ? `+${f.toFixed(2)}` : f.toFixed(2));
  }
  return out;
}

const ESF = range(-20, 10, 0.25);
const CIL = range(-6, 0, 0.25);
const ADD = ['0.00', ...range(0.75, 3.5, 0.25).map(v => v.replace('+', ''))];
const DNP = Array.from({ length: 37 }, (_, i) => (28 + i * 0.5).toFixed(1));

function calcRadar(esf: string, cil: string, add: string, lente: Lente | null) {
  const ev = Math.abs(parseFloat(esf) || 0);
  const cv = Math.abs(parseFloat(cil) || 0);
  const av = parseFloat(add) || 0;
  const mE = lente?.grau_max ?? 8, mC = lente?.cil_max ?? 4, mA = lente?.adicao_max ?? 3.5;
  return [
    { subject: 'GRAU', value: Math.min((ev / mE) * 100, 100) },
    { subject: 'CILÍND.', value: Math.min((cv / mC) * 100, 100) },
    { subject: 'ADIÇÃO', value: av > 0 ? Math.min((av / mA) * 100, 100) : 0 },
    { subject: 'LONGE', value: ev < 2 ? 90 : ev < 5 ? 70 : 50 },
    { subject: 'INTERM.', value: av > 0 ? 75 : 45 },
    { subject: 'PERTO', value: av > 0 ? Math.min((av / 3.5) * 100, 100) : 35 },
    { subject: 'SOL', value: 0 },
  ];
}

const BRAND_COLORS: Record<string, string> = {
  'Varilux': '#3b82f6', 'Hoya': '#22c55e', 'Rodenstock': '#a855f7',
  'Zeiss': '#f59e0b', 'Shamir': '#06b6d4', 'Indo': '#64748b', 'Optifog': '#ef4444',
};

const RECS = [
  'Lente indicada para sua prescrição',
  'Alta definição em todas as distâncias',
  'Reduz fadiga visual em telas',
  'Compatível com anti-reflexo premium',
  'Índice ideal para o grau indicado',
  'Máximo conforto visual diário',
];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function MapaVisual() {
  const navigate = useNavigate();
  const [lentes, setLentes] = useState<Lente[]>([]);
  const [selected, setSelected] = useState<Lente | null>(null);
  const [esf, setEsf] = useState('+0.00');
  const [cil, setCil] = useState('0.00');
  const [add, setAdd] = useState('0.00');
  const [dnp, setDnp] = useState('32.0');
  const [filterMarca, setFilterMarca] = useState<string | null>(null);

  useEffect(() => {
    api.get<Lente[]>('/vision/lentes').then(data => {
      setLentes(data);
      if (data.length) setSelected(data[0]);
    });
  }, []);

  const marcas = [...new Set(lentes.map(l => l.marca))];
  const listaFiltrada = filterMarca ? lentes.filter(l => l.marca === filterMarca) : lentes;
  const radarData = calcRadar(esf, cil, add, selected);
  const cor = selected?.cor ?? '#3b82f6';

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#f2f2f7', overflow: 'hidden', color: '#1c1c1e',
    }}>
      {/* Nav bar estilo iOS */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 46,
        background: 'rgba(249,249,251,0.85)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        borderBottom: '0.5px solid rgba(60,60,67,0.22)', flexShrink: 0,
        zIndex: 5,
      }}>
        <button onClick={() => navigate('/vision')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 2, color: '#007aff',
          fontSize: 15, fontWeight: 500, padding: '4px 6px',
          WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Menu
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1e', letterSpacing: '-0.02em' }}>Mapa Visual</span>
        <div style={{ width: 70 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Brand dots column */}
        <div style={{
          width: 44, background: '#fff',
          borderRight: '0.5px solid rgba(60,60,67,0.18)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', paddingTop: 16, gap: 14, flexShrink: 0,
        }}>
          <button
            onClick={() => setFilterMarca(null)}
            title="Todas"
            style={{
              width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: filterMarca === null ? '#1c1c1e' : '#d1d1d6',
              transition: 'background 0.15s', flexShrink: 0,
            }}
          />
          {marcas.map(marca => (
            <button
              key={marca}
              onClick={() => setFilterMarca(prev => prev === marca ? null : marca)}
              title={marca}
              style={{
                width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: BRAND_COLORS[marca] ?? '#3b82f6',
                opacity: filterMarca === null || filterMarca === marca ? 1 : 0.25,
                transition: 'opacity 0.15s', flexShrink: 0,
                boxShadow: filterMarca === marca ? `0 0 8px ${BRAND_COLORS[marca]}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Left panel — lentes list */}
        <div style={{
          width: 190, background: '#fff',
          borderRight: '0.5px solid rgba(60,60,67,0.18)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', flexShrink: 0,
        }}>
          {/* Foto placeholder */}
          <div style={{
            margin: '12px 12px 8px',
            height: 80, borderRadius: 12,
            background: '#f2f2f7', border: '1.5px dashed #d1d1d6',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="1.5" strokeLinecap="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span style={{ fontSize: 9, color: '#aeaeb2', fontWeight: 600, letterSpacing: '0.05em' }}>IMAGEM CLIENTE</span>
          </div>

          {/* Lente selecionada info */}
          {selected && (
            <div style={{
              margin: '0 12px 12px',
              padding: '10px 12px',
              background: '#f2f2f7', borderRadius: 12,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: cor, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {selected.marca}
              </div>
              <div style={{ fontSize: 12.5, color: '#1c1c1e', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {selected.nome.replace(selected.marca, '').trim()}
              </div>
              <div style={{ fontSize: 10.5, color: '#8e8e93', marginTop: 4 }}>
                {selected.indice} · {selected.tipo}
              </div>
            </div>
          )}

          {/* Lista de lentes */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {listaFiltrada.map(l => {
              const lCor = BRAND_COLORS[l.marca] ?? l.cor;
              const isSel = selected?.id === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '9px 12px 9px 16px',
                    background: isSel ? 'rgba(0,122,255,0.08)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    borderBottom: '0.5px solid rgba(60,60,67,0.12)',
                    transition: 'background 0.1s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: lCor, flexShrink: 0,
                    }} />
                    <div style={{ fontSize: 11.5, color: isSel ? '#1c1c1e' : '#6e6e73', fontWeight: isSel ? 600 : 400, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                      {l.nome}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#aeaeb2', marginTop: 2, marginLeft: 14 }}>
                    {l.tipo} {l.indice}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center — radar */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '16px 8px',
          gap: 8, minWidth: 0,
        }}>
          {selected && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: cor, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {selected.marca}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#1c1c1e', marginTop: 2, letterSpacing: '-0.4px' }}>
                {selected.nome.replace(selected.marca, '').trim()}
              </div>
            </div>
          )}
          <RadarChart data={radarData} color={cor} />
          {/* Badges */}
          {selected && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {selected.grau_max && <Badge label={`Grau ±${selected.grau_max}`} />}
              {selected.cil_max && <Badge label={`Cil ${selected.cil_max}`} />}
              {selected.adicao_max && <Badge label={`Add +${selected.adicao_max}`} />}
            </div>
          )}
        </div>

        {/* Right — recommendations */}
        <div style={{
          width: 210, background: '#fff',
          borderLeft: '0.5px solid rgba(60,60,67,0.18)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', flexShrink: 0,
          paddingTop: 8,
        }}>
          <div style={{
            padding: '8px 16px 10px',
            fontSize: 11, color: '#8e8e93',
            textTransform: 'uppercase',
            letterSpacing: '0.06em', fontWeight: 600,
          }}>Recomendações</div>
          {RECS.map((rec, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '11px 16px',
              borderBottom: '0.5px solid rgba(60,60,67,0.12)',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: `${cor}16`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: cor,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <span style={{ fontSize: 12.5, color: '#3a3a3c', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                {rec}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — drum pickers (roleta iOS) */}
      <div style={{
        background: 'rgba(249,249,251,0.85)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        borderTop: '0.5px solid rgba(60,60,67,0.22)',
        padding: '10px 16px 10px',
        display: 'flex', gap: 8, alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10, color: '#8e8e93', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          alignSelf: 'center', marginRight: 4, flexShrink: 0,
        }}>RX</div>

        <DrumPicker label="ESF" values={ESF} selected={esf} onChange={setEsf} color={cor} />
        <DrumPicker label="CIL" values={CIL} selected={cil} onChange={setCil} color={cor} />
        <DrumPicker label="ADD" values={ADD} selected={add} onChange={setAdd} color={cor} />

        <div style={{ width: 0.5, background: 'rgba(60,60,67,0.2)', alignSelf: 'stretch', flexShrink: 0, margin: '0 4px' }} />

        <DrumPicker label="DNP" values={DNP} selected={dnp} onChange={setDnp} color="#8e8e93" />

        {/* Resumo */}
        <div style={{
          marginLeft: 'auto', background: '#fff',
          borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '10px 16px', flexShrink: 0, minWidth: 130,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px' }}>
            {[['ESF', esf], ['CIL', cil], ['ADD', add !== '0.00' ? add : '—'], ['DNP', dnp]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#8e8e93', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cor, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{
      background: 'rgba(118,118,128,0.12)',
      borderRadius: 999, padding: '3px 11px',
      fontSize: 10.5, color: '#6e6e73', fontWeight: 600, letterSpacing: '-0.01em',
    }}>{label}</span>
  );
}
