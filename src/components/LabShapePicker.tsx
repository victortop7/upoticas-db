// Shapes de armações ópticas — viewBox 0 0 90 65, centro (45,33)

// Oval orgânica via bezier cúbico
function lens(
  cx: number, cy: number,
  rx: number, ry: number,
  tc = 0.85, bc = 0.85,          // controle top/bot (0=flat, 1=full curve)
  tl = 0, tr = 0,                // skew top left/right
  bl = 0, br = 0                 // skew bot left/right
): string {
  const [l, r] = [cx - rx, cx + rx];
  const tcy = cy - ry * tc;
  const bcy = cy + ry * bc;
  return [
    `M ${l},${cy}`,
    `C ${l},${tcy + tl} ${r},${tcy + tr} ${r},${cy}`,
    `C ${r},${bcy + br} ${l},${bcy + bl} ${l},${cy} Z`,
  ].join(' ');
}

// Retângulo arredondado
function rrect(cx: number, cy: number, w: number, h: number, r: number): string {
  const [x, y, x2, y2] = [cx - w, cy - h, cx + w, cy + h];
  return [
    `M ${x + r},${y}`,
    `H ${x2 - r} A ${r},${r} 0 0,1 ${x2},${y + r}`,
    `V ${y2 - r} A ${r},${r} 0 0,1 ${x2 - r},${y2}`,
    `H ${x + r} A ${r},${r} 0 0,1 ${x},${y2 - r}`,
    `V ${y + r} A ${r},${r} 0 0,1 ${x + r},${y} Z`,
  ].join(' ');
}

// Cat-eye: lado temporal (direita) mais alto
function cateye(cx: number, cy: number, rx: number, ry: number, lift: number): string {
  const [l, r] = [cx - rx, cx + rx];
  const topL = cy - ry, topR = cy - ry - lift, bot = cy + ry;
  return [
    `M ${l},${cy}`,
    `C ${l},${topL} ${r},${topR - ry * 0.3} ${r},${topR}`,
    `C ${r + 4},${topR + ry * 0.5} ${r},${bot} ${cx},${bot}`,
    `C ${cx - 5},${bot + 2} ${l},${bot} ${l},${cy} Z`,
  ].join(' ');
}

// D-shape: lado nasal (esquerda) mais reto
function dshape(cx: number, cy: number, rx: number, ry: number, flatness: number): string {
  const [l, r] = [cx - rx + flatness, cx + rx];
  const [t, b] = [cy - ry, cy + ry];
  return [
    `M ${l},${t}`,
    `H ${r - 5} C ${r + 8},${t} ${r + 8},${b} ${r - 5},${b}`,
    `H ${l} C ${l - flatness * 0.3},${b} ${l - flatness * 0.3},${t} ${l},${t} Z`,
  ].join(' ');
}

const SHAPES: Array<{ name: string; d: string }> = [
  // ── Ovaladas largas (clássicas) ──
  { name: 'SHAPE_1',  d: lens(45, 33, 32, 19, 0.85, 0.85) },                // oval larga padrão
  { name: 'SHAPE_2',  d: lens(45, 33, 28, 20, 0.82, 0.88) },                // oval média
  { name: 'SHAPE_3',  d: lens(45, 33, 30, 21, 0.90, 0.80) },                // oval arredondada topo
  { name: 'SHAPE_4',  d: lens(45, 33, 34, 17, 0.70, 0.90) },                // oval bem larga e baixa
  { name: 'SHAPE_5',  d: lens(45, 33, 26, 22, 0.88, 0.88) },                // oval média alta

  // ── Cat-eye / assimétrica ──
  { name: 'SHAPE_6',  d: cateye(45, 33, 31, 19, 7) },                       // cat-eye médio
  { name: 'SHAPE_7',  d: cateye(45, 33, 28, 18, 5) },                       // cat-eye suave
  { name: 'SHAPE_8',  d: cateye(45, 33, 33, 20, 9) },                       // cat-eye pronunciado
  { name: 'SHAPE_9',  d: lens(45, 33, 30, 19, 0.60, 0.95, 3, -3) },        // topo achatado
  { name: 'SHAPE_10', d: lens(45, 33, 34, 16, 0.75, 0.85, 2, -4) },        // aviador leve

  // ── Retangulares arredondadas ──
  { name: 'SHAPE_11', d: rrect(45, 33, 28, 17, 9) },                        // ret. arredondado padrão
  { name: 'SHAPE_12', d: rrect(45, 33, 32, 16, 8) },                        // ret. largo
  { name: 'SHAPE_13', d: rrect(45, 33, 25, 15, 11) },                       // ret. mais quadrado
  { name: 'SHAPE_14', d: rrect(45, 33, 30, 14, 7) },                        // ret. baixo e largo
  { name: 'SHAPE_15', d: rrect(45, 33, 22, 18, 13) },                       // quasi-quadrado

  // ── Ovaladas médias ──
  { name: 'SHAPE_16', d: lens(45, 33, 24, 21, 0.90, 0.90) },                // oval quase circular
  { name: 'SHAPE_17', d: lens(45, 33, 26, 19, 0.78, 0.92) },                // oval com fundo arredondado
  { name: 'SHAPE_18', d: lens(45, 33, 22, 23, 0.88, 0.88) },                // oval alta e estreita
  { name: 'SHAPE_19', d: lens(45, 33, 29, 18, 0.80, 0.80) },                // oval achatada
  { name: 'SHAPE_20', d: lens(45, 33, 32, 22, 0.88, 0.82) },                // oval grande

  // ── D-shapes ──
  { name: 'SHAPE_21', d: dshape(45, 33, 29, 20, 8) },                       // D-shape clássico
  { name: 'SHAPE_22', d: dshape(45, 33, 25, 18, 6) },                       // D-shape médio
  { name: 'SHAPE_23', d: lens(45, 33, 27, 20, 0.50, 0.92, 4, -4) },        // topo quase reto
  { name: 'SHAPE_24', d: lens(45, 33, 31, 18, 0.82, 0.70, 0, -2, 3, 0) }, // fundo achatado
  { name: 'SHAPE_25', d: cateye(45, 33, 26, 17, 6) },                       // cat-eye pequeno

  // ── Retangulares finas ──
  { name: 'SHAPE_26', d: rrect(45, 33, 29, 13, 7) },                        // ret. bem baixo
  { name: 'SHAPE_27', d: rrect(45, 33, 24, 14, 10) },                       // ret. médio
  { name: 'SHAPE_28', d: rrect(45, 33, 20, 17, 14) },                       // ret. quadrado arredondado
  { name: 'SHAPE_29', d: lens(45, 33, 23, 18, 0.85, 0.85) },                // oval pequena
  { name: 'SHAPE_30', d: lens(45, 33, 27, 16, 0.75, 0.85) },                // oval baixa

  // ── Pequenas ──
  { name: 'SHAPE_31', d: lens(45, 33, 19, 19, 0.88, 0.88) },                // circular pequena
  { name: 'SHAPE_32', d: lens(45, 33, 22, 17, 0.82, 0.82) },                // oval pequena clássica
  { name: 'SHAPE_33', d: lens(45, 33, 17, 21, 0.88, 0.88) },                // oval estreita e alta
  { name: 'SHAPE_34', d: cateye(45, 33, 22, 16, 5) },                       // cat-eye pequeno
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export default function LabShapePicker({ value, onChange, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#f0eeee', border: '2px solid #888', borderRadius: '4px', width: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ background: '#005500', color: '#fff', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', letterSpacing: '2px', fontFamily: "'Courier New', monospace" }}>SHAPES</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #99ffaa', color: '#ccffcc', padding: '1px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', borderRadius: '2px' }}>✕</button>
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', background: '#e8e4e0' }}>
          {SHAPES.map(s => {
            const selected = value === s.name;
            return (
              <div
                key={s.name}
                onClick={() => { onChange(s.name); onClose(); }}
                style={{
                  background: selected ? '#eeffee' : '#fff',
                  border: selected ? '2px solid #005500' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: selected ? '0 0 0 2px #005500' : '0 1px 3px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'; }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <svg viewBox="0 0 90 65" width="100%" style={{ maxHeight: '70px' }}>
                  {/* Crosshair WOTICA-style */}
                  <line x1="45" y1="2"  x2="45" y2="63" stroke="#ddd" strokeWidth="0.6" />
                  <line x1="2"  y1="33" x2="88" y2="33" stroke="#ddd" strokeWidth="0.6" />
                  {/* Shape */}
                  <path d={s.d} fill="none" stroke={selected ? '#005500' : '#222'} strokeWidth={selected ? '1.8' : '1.4'} />
                  {/* Seta indicadora (nasal→temporal) */}
                  <polygon points="72,10 79,14 72,18" fill={selected ? '#005500' : '#444'} />
                </svg>
                <div style={{ fontSize: '9px', fontWeight: selected ? '700' : '400', color: selected ? '#005500' : '#444', fontFamily: "'Courier New', monospace", letterSpacing: '0.3px', marginTop: '2px' }}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 12px', background: '#d4d0c8', borderTop: '1px solid #bbb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#555', fontFamily: "'Courier New', monospace" }}>
            {value ? `Selecionado: ${value}` : 'Clique em um shape para selecionar'}
          </span>
          <button onClick={onClose} style={{ padding: '3px 14px', fontSize: '11px', background: '#005500', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
