// SVG paths for each shape (viewBox 0 0 90 65, center ~45,32)
// Each function returns a SVG path `d` string

function ep(cx: number, cy: number, rx: number, ry: number): string {
  // Ellipse as path
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx - 0.01},${cy} Z`;
}

function rp(cx: number, cy: number, w: number, h: number, r: number): string {
  // Rounded rectangle
  const [x, y, x2, y2] = [cx - w, cy - h, cx + w, cy + h];
  return `M ${x + r},${y} H ${x2 - r} A ${r},${r} 0 0,1 ${x2},${y + r} V ${y2 - r} A ${r},${r} 0 0,1 ${x2 - r},${y2} H ${x + r} A ${r},${r} 0 0,1 ${x},${y2 - r} V ${y + r} A ${r},${r} 0 0,1 ${x + r},${y} Z`;
}

// Asymmetric lens: top-left higher, using cubic bezier
function ap(cx: number, cy: number, rx: number, ry: number, topShift: number, botShift = 0): string {
  const l = cx - rx, r = cx + rx, t = cy - ry + topShift, b = cy + ry + botShift;
  return `M ${l},${cy} C ${l},${t} ${r},${t} ${r},${cy} C ${r},${b} ${l},${b} ${l},${cy} Z`;
}

// D-shape / half-round
function dp(cx: number, cy: number, rx: number, ry: number, flatLeft: number): string {
  const l = cx - rx + flatLeft, r2 = cx + rx, t = cy - ry, b = cy + ry;
  return `M ${l},${t} H ${r2 - 4} C ${r2 + 8},${t} ${r2 + 8},${b} ${r2 - 4},${b} H ${l} Z`;
}

const SHAPES: Array<{ name: string; d: string }> = [
  { name: 'SHAPE_1',  d: ap(45, 32, 32, 20, -4, 2) },
  { name: 'SHAPE_2',  d: ap(45, 32, 29, 21, -3, 2) },
  { name: 'SHAPE_3',  d: ap(45, 32, 27, 22, -2, 1) },
  { name: 'SHAPE_4',  d: ep(45, 32, 27, 22) },
  { name: 'SHAPE_5',  d: ep(45, 32, 34, 18) },
  { name: 'SHAPE_6',  d: ap(45, 32, 33, 22, -5, 3) },
  { name: 'SHAPE_7',  d: ep(45, 32, 26, 24) },
  { name: 'SHAPE_8',  d: ep(45, 32, 22, 26) },
  { name: 'SHAPE_9',  d: rp(45, 32, 26, 18, 9) },
  { name: 'SHAPE_10', d: rp(45, 32, 32, 17, 10) },
  { name: 'SHAPE_11', d: ap(45, 32, 34, 22, -6, 4) },
  { name: 'SHAPE_12', d: ap(45, 32, 28, 21, -4, 2) },
  { name: 'SHAPE_13', d: ep(45, 32, 23, 21) },
  { name: 'SHAPE_14', d: ep(45, 32, 25, 25) },
  { name: 'SHAPE_15', d: rp(45, 32, 33, 16, 11) },
  { name: 'SHAPE_16', d: ap(45, 33, 34, 23, -8, 5) },
  { name: 'SHAPE_17', d: ap(45, 32, 27, 22, -3, 2) },
  { name: 'SHAPE_18', d: ep(45, 32, 21, 23) },
  { name: 'SHAPE_19', d: ep(45, 32, 24, 24) },
  { name: 'SHAPE_20', d: rp(45, 32, 30, 17, 8) },
  { name: 'SHAPE_21', d: dp(45, 32, 30, 21, 6) },
  { name: 'SHAPE_22', d: ap(45, 32, 26, 20, -2, 1) },
  { name: 'SHAPE_23', d: ep(45, 32, 20, 24) },
  { name: 'SHAPE_24', d: ap(45, 32, 25, 23, -4, 2) },
  { name: 'SHAPE_25', d: ap(45, 32, 28, 20, -6, 0) },
  { name: 'SHAPE_26', d: ep(45, 32, 22, 19) },
  { name: 'SHAPE_27', d: ap(45, 32, 24, 20, -3, 2) },
  { name: 'SHAPE_28', d: ep(45, 32, 18, 19) },
  { name: 'SHAPE_29', d: ap(45, 32, 22, 21, -4, 2) },
  { name: 'SHAPE_30', d: ap(45, 32, 25, 19, -5, 0) },
  { name: 'SHAPE_31', d: ep(45, 32, 17, 16) },
  { name: 'SHAPE_32', d: ep(45, 32, 22, 18) },
  { name: 'SHAPE_33', d: ep(45, 32, 16, 20) },
  { name: 'SHAPE_34', d: ap(45, 32, 20, 18, -5, 0) },
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
                  background: selected ? '#ffeeee' : '#fff',
                  border: selected ? '2px solid #005500' : '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: selected ? '0 0 0 2px #005500' : '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'border 0.1s',
                }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'; }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <svg viewBox="0 0 90 65" width="100%" style={{ maxHeight: '70px' }}>
                  {/* Grid lines like wotica */}
                  <line x1="45" y1="0" x2="45" y2="65" stroke="#ddd" strokeWidth="0.5" />
                  <line x1="0" y1="32" x2="90" y2="32" stroke="#ddd" strokeWidth="0.5" />
                  {/* Shape */}
                  <path d={s.d} fill="none" stroke={selected ? '#005500' : '#333'} strokeWidth={selected ? '2' : '1.5'} />
                  {/* Arrow (direction indicator like wotica) */}
                  <polygon points="74,10 80,14 74,18" fill={selected ? '#005500' : '#555'} />
                </svg>
                <div style={{ fontSize: '9px', fontWeight: selected ? '700' : '400', color: selected ? '#005500' : '#333', fontFamily: "'Courier New', monospace", letterSpacing: '0.3px', marginTop: '2px' }}>
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
