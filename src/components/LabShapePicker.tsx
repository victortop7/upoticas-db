// Shapes de armações ópticas reais — viewBox "0 0 90 65", centro (45,33)
// Cada shape representa o contorno de UMA lente cortada pelo lab

// Oval via bezier cúbico (M esq,cy C esq,top dir,top dir,cy C dir,bot esq,bot esq,cy Z)
function ov(lx: number, rx: number, tcy: number, bcy: number,
            cy = 33, rs = 0, tskR = 0, tskL = 0, bskR = 0, bskL = 0): string {
  return [
    `M ${lx},${cy}`,
    `C ${lx},${tcy + tskL} ${rx},${tcy + tskR} ${rx},${cy + rs}`,
    `C ${rx},${bcy + bskR} ${lx},${bcy + bskL} ${lx},${cy} Z`,
  ].join(' ');
}

// Retângulo arredondado
function rr(lx: number, rx: number, ty: number, by: number, r: number): string {
  return [
    `M ${lx + r},${ty}`,
    `H ${rx - r} Q ${rx},${ty} ${rx},${ty + r}`,
    `V ${by - r} Q ${rx},${by} ${rx - r},${by}`,
    `H ${lx + r} Q ${lx},${by} ${lx},${by - r}`,
    `V ${ty + r} Q ${lx},${ty} ${lx + r},${ty} Z`,
  ].join(' ');
}

// Cat-eye: lado temporal (direita) sobe
function ce(lx: number, rx: number, topL: number, topR: number, bcy: number, cy = 33): string {
  return [
    `M ${lx},${cy}`,
    `C ${lx},${topL} ${rx},${topR - 8} ${rx},${topR}`,
    `C ${rx},${topR + 14} ${lx},${bcy} ${lx},${cy} Z`,
  ].join(' ');
}

// Aviador (gota): topo quase reto, base arredondada e estreita
function av(lx: number, rx: number, ty: number, by: number): string {
  const cx = (lx + rx) / 2;
  return [
    `M ${lx},${ty + 6}`,
    `C ${lx},${ty} ${rx},${ty} ${rx},${ty + 6}`,
    `C ${rx},${by - 4} ${cx + 10},${by} ${cx},${by}`,
    `C ${cx - 10},${by} ${lx},${by - 4} ${lx},${ty + 6} Z`,
  ].join(' ');
}

const SHAPES: Array<{ name: string; d: string }> = [
  // ── OVALS CLÁSSICAS ──────────────────────────────────────
  { name: 'SHAPE_1',  d: ov(13, 77, 15, 51) },                        // oval padrão larga
  { name: 'SHAPE_2',  d: ov(17, 73, 13, 53) },                        // oval média redonda
  { name: 'SHAPE_3',  d: ov(10, 80, 18, 48) },                        // oval extra larga
  { name: 'SHAPE_4',  d: ov(19, 71, 10, 56) },                        // oval grande circular
  { name: 'SHAPE_5',  d: ov(12, 78, 14, 52) },                        // oval larga alta

  // ── RETANGULARES (WAYFARER) ───────────────────────────────
  { name: 'SHAPE_6',  d: rr(12, 78, 16, 50, 8) },                     // wayfarer clássico
  { name: 'SHAPE_7',  d: rr(14, 76, 18, 48, 6) },                     // wayfarer médio
  { name: 'SHAPE_8',  d: rr(10, 80, 20, 46, 7) },                     // wayfarer largo
  { name: 'SHAPE_9',  d: rr(15, 75, 20, 46, 10) },                    // wayfarer arredondado
  { name: 'SHAPE_10', d: rr(12, 78, 22, 44, 5) },                     // slim retangular

  // ── CAT-EYE ──────────────────────────────────────────────
  { name: 'SHAPE_11', d: ce(13, 77, 16, 20, 50) },                    // cat-eye clássico
  { name: 'SHAPE_12', d: ce(15, 75, 18, 22, 50) },                    // cat-eye suave
  { name: 'SHAPE_13', d: ce(12, 78, 14, 18, 52) },                    // cat-eye pronunciado
  { name: 'SHAPE_14', d: ce(16, 74, 20, 24, 50) },                    // cat-eye moderno
  { name: 'SHAPE_15', d: ce(13, 77, 17, 21, 48) },                    // borboleta/cat-eye largo

  // ── REDONDAS ─────────────────────────────────────────────
  { name: 'SHAPE_16', d: ov(21, 69, 9, 57) },                         // redonda clássica
  { name: 'SHAPE_17', d: ov(18, 72, 10, 56) },                        // redonda maior
  { name: 'SHAPE_18', d: ov(24, 66, 11, 55) },                        // redonda pequena
  { name: 'SHAPE_19', d: ov(22, 68, 13, 53) },                        // oval redonda
  { name: 'SHAPE_20', d: ov(20, 70, 11, 56, 33, -2) },                // redonda com leve assimetria

  // ── AVIADOR (GOTA) ────────────────────────────────────────
  { name: 'SHAPE_21', d: av(11, 79, 16, 54) },                        // aviador clássico
  { name: 'SHAPE_22', d: av(14, 76, 17, 53) },                        // aviador médio
  { name: 'SHAPE_23', d: av(13, 77, 19, 51) },                        // aviador slim
  { name: 'SHAPE_24', d: av(16, 74, 18, 52) },                        // aviador pequeno

  // ── OVAL COM TOPO RETO (BROWLINE) ─────────────────────────
  { name: 'SHAPE_25', d: ov(12, 78, 22, 51, 33, 0, 2, 2) },          // browline oval
  { name: 'SHAPE_26', d: rr(13, 77, 19, 49, 12) },                    // browline retangular
  { name: 'SHAPE_27', d: ov(14, 76, 22, 50, 33, 0, 3, 3) },          // oval topo quase reto

  // ── SLIM / FINAS ──────────────────────────────────────────
  { name: 'SHAPE_28', d: rr(11, 79, 24, 42, 6) },                     // slim retangular larga
  { name: 'SHAPE_29', d: rr(14, 76, 24, 42, 8) },                     // slim retangular
  { name: 'SHAPE_30', d: ov(13, 77, 22, 44) },                        // oval slim

  // ── QUADRADAS ────────────────────────────────────────────
  { name: 'SHAPE_31', d: rr(18, 72, 13, 53, 14) },                    // quadrada arredondada
  { name: 'SHAPE_32', d: rr(19, 71, 15, 51, 11) },                    // quadrada menor

  // ── VARIAÇÕES ─────────────────────────────────────────────
  { name: 'SHAPE_33', d: ov(15, 75, 16, 52, 33, 0, -3, 3) },         // oval com desvio nasal
  { name: 'SHAPE_34', d: ov(16, 74, 15, 53, 33, -2) },               // oval lado temporal baixo
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
          <span style={{ fontWeight: '700', fontSize: '13px', letterSpacing: '2px', fontFamily: "'Courier New', monospace" }}>SHAPES — FORMAS DE ARMAÇÃO</span>
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
                  {/* Crosshair */}
                  <line x1="45" y1="2" x2="45" y2="63" stroke="#e0e0e0" strokeWidth="0.6" />
                  <line x1="2" y1="33" x2="88" y2="33" stroke="#e0e0e0" strokeWidth="0.6" />
                  {/* Shape */}
                  <path d={s.d} fill="rgba(0,0,0,0.04)" stroke={selected ? '#005500' : '#111'} strokeWidth={selected ? '1.8' : '1.5'} />
                  {/* Seta de referência (nasal→temporal) */}
                  <polygon points="72,10 80,14 72,18" fill={selected ? '#005500' : '#555'} />
                </svg>
                <div style={{ fontSize: '9px', fontWeight: selected ? '700' : '400', color: selected ? '#005500' : '#444', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>
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
