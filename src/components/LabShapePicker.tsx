// Shapes de lentes ópticas — viewBox "0 0 90 65", centro (45,33)
// Todos orgânicos via bezier, igual ao padrão WOTICA/labs reais

// Oval simétrica: M lx,cy  C lx,topY rx,topY rx,cy  C rx,botY lx,botY lx,cy Z
function o(lx: number, rx: number, topY: number, botY: number, cy = 33): string {
  return `M ${lx},${cy} C ${lx},${topY} ${rx},${topY} ${rx},${cy} C ${rx},${botY} ${lx},${botY} ${lx},${cy} Z`;
}

// Oval assimétrica: lado temporal (direito) ligeiramente elevado
function oa(lx: number, rx: number, topY: number, botY: number, rShift: number, cy = 33): string {
  const rcy = cy + rShift; // right Y point (negative = elevated)
  return `M ${lx},${cy} C ${lx},${topY} ${rx},${topY + rShift * 0.6} ${rx},${rcy} C ${rx},${botY + rShift * 0.4} ${lx},${botY} ${lx},${cy} Z`;
}

// Retângulo arredondado orgânico
function rr(lx: number, rx: number, ty: number, by: number, r: number): string {
  return [
    `M ${lx + r},${ty}`,
    `H ${rx - r} Q ${rx},${ty} ${rx},${ty + r}`,
    `V ${by - r} Q ${rx},${by} ${rx - r},${by}`,
    `H ${lx + r} Q ${lx},${by} ${lx},${by - r}`,
    `V ${ty + r} Q ${lx},${ty} ${lx + r},${ty} Z`,
  ].join(' ');
}

// Gota/Aviador suave: topo largo, base estreita arredondada
function gota(lx: number, rx: number, topY: number, botY: number, cy = 33): string {
  const cx = (lx + rx) / 2;
  return `M ${lx},${cy} C ${lx},${topY} ${rx},${topY} ${rx},${cy} C ${rx},${botY} ${cx + 9},${botY + 4} ${cx},${botY + 4} C ${cx - 9},${botY + 4} ${lx},${botY} ${lx},${cy} Z`;
}

const SHAPES: Array<{ name: string; d: string }> = [
  // ── OVALS LARGAS (formas mais comuns em labs) ──────────────────────────────
  { name: 'SHAPE_1',  d: o(13, 77, 14, 52) },          // oval larga padrão
  { name: 'SHAPE_2',  d: o(15, 75, 13, 53) },          // oval larga variante
  { name: 'SHAPE_3',  d: o(9,  81, 19, 47) },          // oval extra larga e baixa
  { name: 'SHAPE_4',  d: o(18, 72, 10, 56) },          // oval larga e alta
  { name: 'SHAPE_5',  d: o(11, 79, 11, 55) },          // oval grande

  // ── OVALS MÉDIAS ─────────────────────────────────────────────────────────
  { name: 'SHAPE_6',  d: o(13, 77, 21, 52) },          // oval topo levemente achatado
  { name: 'SHAPE_7',  d: o(17, 73, 14, 52) },          // oval média padrão
  { name: 'SHAPE_8',  d: o(19, 71, 11, 55) },          // oval média alta
  { name: 'SHAPE_9',  d: o(16, 74, 16, 50) },          // oval média equilibrada
  { name: 'SHAPE_10', d: o(12, 78, 18, 50) },          // oval média larga

  // ── RETANGULARES ARREDONDADAS ─────────────────────────────────────────────
  { name: 'SHAPE_11', d: rr(13, 77, 17, 49, 9) },      // retang. padrão
  { name: 'SHAPE_12', d: rr(10, 80, 18, 48, 8) },      // retang. largo
  { name: 'SHAPE_13', d: rr(15, 75, 20, 46, 7) },      // retang. slim
  { name: 'SHAPE_14', d: rr(14, 76, 16, 50, 12) },     // retang. arredondado
  { name: 'SHAPE_15', d: rr(16, 74, 21, 45, 6) },      // retang. estreito

  // ── REDONDAS ─────────────────────────────────────────────────────────────
  { name: 'SHAPE_16', d: o(21, 69, 9,  57) },          // redonda grande
  { name: 'SHAPE_17', d: o(23, 67, 11, 55) },          // redonda média
  { name: 'SHAPE_18', d: o(25, 65, 13, 53) },          // redonda menor
  { name: 'SHAPE_19', d: o(20, 70, 10, 56) },          // redonda larga

  // ── ASSIMÉTRICA (cat-eye suave — temporal levemente elevado) ──────────────
  { name: 'SHAPE_20', d: oa(14, 76, 14, 52, -7) },     // assimétrica suave
  { name: 'SHAPE_21', d: oa(13, 77, 13, 52, -10) },    // assimétrica média
  { name: 'SHAPE_22', d: oa(15, 75, 15, 51, -5) },     // assimétrica leve
  { name: 'SHAPE_23', d: oa(17, 73, 14, 52, -8) },     // assimétrica variante

  // ── GOTA / AVIADOR SUAVE ──────────────────────────────────────────────────
  { name: 'SHAPE_24', d: gota(12, 78, 15, 46) },       // gota larga
  { name: 'SHAPE_25', d: gota(14, 76, 16, 45) },       // gota média

  // ── SLIM / FINAS ──────────────────────────────────────────────────────────
  { name: 'SHAPE_26', d: o(12, 78, 23, 43) },          // slim oval larga
  { name: 'SHAPE_27', d: o(14, 76, 24, 42) },          // slim oval média
  { name: 'SHAPE_28', d: rr(13, 77, 24, 42, 7) },      // slim retangular

  // ── PEQUENAS ──────────────────────────────────────────────────────────────
  { name: 'SHAPE_29', d: o(22, 68, 14, 52) },          // pequena oval
  { name: 'SHAPE_30', d: o(24, 66, 13, 53) },          // pequena oval redonda
  { name: 'SHAPE_31', d: o(26, 64, 15, 51) },          // pequena oval estreita
  { name: 'SHAPE_32', d: o(22, 68, 20, 46) },          // pequena oval baixa
  { name: 'SHAPE_33', d: rr(20, 70, 18, 48, 10) },     // pequena retangular
  { name: 'SHAPE_34', d: o(25, 65, 11, 55) },          // pequena redonda
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export default function LabShapePicker({ value, onChange, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#f0eeee', border: '2px solid #888', borderRadius: '4px', width: '700px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>

        <div style={{ background: '#005500', color: '#fff', padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: '700', fontSize: '12px', letterSpacing: '2px', fontFamily: "'Courier New', monospace" }}>SHAPES</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #99ffaa', color: '#ccffcc', padding: '1px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '7px', background: '#e0ddd8' }}>
          {SHAPES.map(s => {
            const sel = value === s.name;
            return (
              <div key={s.name} onClick={() => { onChange(s.name); onClose(); }}
                style={{ background: sel ? '#eeffee' : '#fff', border: sel ? '2px solid #005500' : '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: sel ? '0 0 0 2px #005500' : '0 1px 2px rgba(0,0,0,0.12)' }}
                onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = '#f4f4f4'; }}
                onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <svg viewBox="0 0 90 65" width="100%" style={{ maxHeight: '66px' }}>
                  <line x1="45" y1="1" x2="45" y2="64" stroke="#e0e0e0" strokeWidth="0.7" />
                  <line x1="1"  y1="33" x2="89" y2="33" stroke="#e0e0e0" strokeWidth="0.7" />
                  <path d={s.d} fill="none" stroke={sel ? '#005500' : '#222'} strokeWidth={sel ? '2' : '1.5'} />
                  <polygon points="72,9 80,13 72,17" fill={sel ? '#005500' : '#555'} />
                </svg>
                <div style={{ fontSize: '9px', fontWeight: sel ? '700' : '400', color: sel ? '#005500' : '#555', fontFamily: "'Courier New', monospace", marginTop: '1px' }}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '6px 12px', background: '#d4d0c8', borderTop: '1px solid #bbb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: '#555', fontFamily: "'Courier New', monospace" }}>
            {value ? `Selecionado: ${value}` : 'Clique em um shape para selecionar'}
          </span>
          <button onClick={onClose} style={{ padding: '3px 16px', fontSize: '11px', background: '#005500', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
