// Shapes de armações ópticas — viewBox "0 0 90 65", centro aprox (45,33)
// Cada path é desenhado individualmente para corresponder a formas reais de lentes

const SHAPES: Array<{ name: string; d: string; label: string }> = [
  // ── OVALS CLÁSSICAS ──────────────────────────────────────────────────────
  {
    name: 'SHAPE_1', label: 'OVAL PADRÃO',
    // Oval larga e baixa, mais comum em labs
    d: 'M 13,33 C 13,15 77,15 77,33 C 77,51 13,51 13,33 Z',
  },
  {
    name: 'SHAPE_2', label: 'OVAL MÉDIA',
    d: 'M 16,33 C 16,14 74,14 74,33 C 74,52 16,52 16,33 Z',
  },
  {
    name: 'SHAPE_3', label: 'OVAL LARGA',
    d: 'M 9,33 C 9,18 81,18 81,33 C 81,48 9,48 9,33 Z',
  },
  {
    name: 'SHAPE_4', label: 'OVAL ALTA',
    d: 'M 18,33 C 18,10 72,10 72,33 C 72,56 18,56 18,33 Z',
  },
  {
    name: 'SHAPE_5', label: 'OVAL GRANDE',
    d: 'M 11,33 C 11,11 79,11 79,33 C 79,55 11,55 11,33 Z',
  },

  // ── RETANGULARES (WAYFARER) ───────────────────────────────────────────────
  {
    name: 'SHAPE_6', label: 'WAYFARER',
    // Topo mais plano, cantos arredondados — estilo wayfarer
    d: 'M 20,17 H 70 Q 79,17 79,24 V 42 Q 79,49 70,49 H 20 Q 11,49 11,42 V 24 Q 11,17 20,17 Z',
  },
  {
    name: 'SHAPE_7', label: 'RETANG. LARGO',
    d: 'M 17,18 H 73 Q 81,18 81,24 V 42 Q 81,48 73,48 H 17 Q 9,48 9,42 V 24 Q 9,18 17,18 Z',
  },
  {
    name: 'SHAPE_8', label: 'RETANG. SLIM',
    d: 'M 18,21 H 72 Q 80,21 80,27 V 39 Q 80,45 72,45 H 18 Q 10,45 10,39 V 27 Q 10,21 18,21 Z',
  },
  {
    name: 'SHAPE_9', label: 'RETANG. REDONDO',
    d: 'M 22,16 H 68 Q 79,16 79,25 V 41 Q 79,50 68,50 H 22 Q 11,50 11,41 V 25 Q 11,16 22,16 Z',
  },
  {
    name: 'SHAPE_10', label: 'CLUBMASTER',
    // Clubmaster: topo quase reto (grosso), base oval arredondada
    d: 'M 13,27 C 13,21 77,21 77,27 C 77,51 13,51 13,27 Z',
  },

  // ── CAT-EYE (temporal elevado) ────────────────────────────────────────────
  {
    name: 'SHAPE_11', label: 'CAT-EYE CLÁS.',
    // Nasal (esq) em cy=35, temporal (dir) elevado em cy=20
    d: 'M 13,35 C 13,14 79,10 79,20 C 79,38 13,53 13,35 Z',
  },
  {
    name: 'SHAPE_12', label: 'CAT-EYE SUAVE',
    d: 'M 14,34 C 14,16 78,13 78,23 C 78,40 14,51 14,34 Z',
  },
  {
    name: 'SHAPE_13', label: 'CAT-EYE FORTE',
    d: 'M 12,36 C 12,12 80,6 80,18 C 80,36 12,55 12,36 Z',
  },
  {
    name: 'SHAPE_14', label: 'BORBOLETA',
    // Borboleta: mais largo, temporal muito elevado
    d: 'M 11,35 C 11,14 81,8 81,20 C 81,38 11,54 11,35 Z',
  },
  {
    name: 'SHAPE_15', label: 'CAT-EYE MED.',
    d: 'M 15,34 C 15,17 75,14 75,24 C 75,41 15,50 15,34 Z',
  },

  // ── REDONDAS ─────────────────────────────────────────────────────────────
  {
    name: 'SHAPE_16', label: 'REDONDA',
    // Círculo: rx=ry
    d: 'M 21,33 C 21,9 69,9 69,33 C 69,57 21,57 21,33 Z',
  },
  {
    name: 'SHAPE_17', label: 'REDONDA MÉDIA',
    d: 'M 23,33 C 23,11 67,11 67,33 C 67,55 23,55 23,33 Z',
  },
  {
    name: 'SHAPE_18', label: 'REDONDA GRANDE',
    d: 'M 18,33 C 18,7 72,7 72,33 C 72,59 18,59 18,33 Z',
  },
  {
    name: 'SHAPE_19', label: 'REDONDA PEQ.',
    d: 'M 25,33 C 25,14 65,14 65,33 C 65,52 25,52 25,33 Z',
  },

  // ── AVIADOR (GOTA / TEARDROP) ─────────────────────────────────────────────
  {
    name: 'SHAPE_20', label: 'AVIADOR CLÁS.',
    // Mais largo no topo, estreita na base arredondada
    d: 'M 11,26 C 11,13 79,13 79,26 C 79,52 58,58 45,58 C 32,58 11,52 11,26 Z',
  },
  {
    name: 'SHAPE_21', label: 'AVIADOR MÉD.',
    d: 'M 13,27 C 13,15 77,15 77,27 C 77,51 57,57 45,57 C 33,57 13,51 13,27 Z',
  },
  {
    name: 'SHAPE_22', label: 'AVIADOR LARGO',
    d: 'M 9,26 C 9,13 81,13 81,26 C 81,53 60,59 45,59 C 30,59 9,53 9,26 Z',
  },
  {
    name: 'SHAPE_23', label: 'AVIADOR SLIM',
    d: 'M 13,28 C 13,18 77,18 77,28 C 77,49 58,54 45,54 C 32,54 13,49 13,28 Z',
  },

  // ── BROWLINE / TOPO RETO ──────────────────────────────────────────────────
  {
    name: 'SHAPE_24', label: 'BROWLINE',
    // Topo quase horizontal, base bem arredondada
    d: 'M 13,26 C 13,22 77,22 77,26 C 77,52 13,52 13,26 Z',
  },
  {
    name: 'SHAPE_25', label: 'BROWLINE RET.',
    d: 'M 14,23 H 76 C 79,23 79,26 79,26 V 48 C 79,52 76,52 76,52 H 14 C 11,52 11,48 11,48 V 26 C 11,23 14,23 14,23 Z',
  },

  // ── SLIM / FINAS ──────────────────────────────────────────────────────────
  {
    name: 'SHAPE_26', label: 'SLIM OVAL',
    d: 'M 12,33 C 12,23 78,23 78,33 C 78,43 12,43 12,33 Z',
  },
  {
    name: 'SHAPE_27', label: 'SLIM LARGA',
    d: 'M 9,33 C 9,24 81,24 81,33 C 81,42 9,42 9,33 Z',
  },
  {
    name: 'SHAPE_28', label: 'SLIM RET.',
    d: 'M 16,24 H 74 Q 81,24 81,29 V 37 Q 81,42 74,42 H 16 Q 9,42 9,37 V 29 Q 9,24 16,24 Z',
  },

  // ── QUADRADAS ─────────────────────────────────────────────────────────────
  {
    name: 'SHAPE_29', label: 'QUADRADA',
    d: 'M 22,15 H 68 Q 77,15 77,23 V 43 Q 77,51 68,51 H 22 Q 13,51 13,43 V 23 Q 13,15 22,15 Z',
  },
  {
    name: 'SHAPE_30', label: 'QUAD. ARRED.',
    d: 'M 24,14 H 66 Q 76,14 76,23 V 43 Q 76,52 66,52 H 24 Q 14,52 14,43 V 23 Q 14,14 24,14 Z',
  },

  // ── GEOMÉTRICAS / VARIAÇÕES ───────────────────────────────────────────────
  {
    name: 'SHAPE_31', label: 'HEXAGONAL',
    // Hexágono suave via bezier
    d: 'M 14,33 C 14,16 27,10 45,10 C 63,10 76,16 76,33 C 76,50 63,56 45,56 C 27,56 14,50 14,33 Z',
  },
  {
    name: 'SHAPE_32', label: 'OCTOGONAL',
    d: 'M 22,14 H 68 C 76,14 79,18 79,25 V 41 C 79,48 76,52 68,52 H 22 C 14,52 11,48 11,41 V 25 C 11,18 14,14 22,14 Z',
  },
  {
    name: 'SHAPE_33', label: 'D-SHAPE',
    // Lado nasal (esq) achatado, lado temporal (dir) arredondado
    d: 'M 22,15 C 18,15 14,19 14,33 C 14,47 18,51 22,51 H 68 C 78,51 80,43 80,33 C 80,23 78,15 68,15 Z',
  },
  {
    name: 'SHAPE_34', label: 'OVAL NASAL RET.',
    // Lado nasal levemente reto, temporal arredondado
    d: 'M 18,33 C 18,14 78,14 78,33 C 78,52 18,52 18,33 Z',
  },
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

        {/* Header */}
        <div style={{ background: '#005500', color: '#fff', padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: '700', fontSize: '12px', letterSpacing: '2px', fontFamily: "'Courier New', monospace" }}>SHAPES — FORMAS DE ARMAÇÃO</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #99ffaa', color: '#ccffcc', padding: '1px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>✕</button>
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '7px', background: '#e0ddd8' }}>
          {SHAPES.map(s => {
            const sel = value === s.name;
            return (
              <div key={s.name} onClick={() => { onChange(s.name); onClose(); }}
                style={{ background: sel ? '#eeffee' : '#fff', border: `${sel ? '2px solid #005500' : '1px solid #ccc'}`, borderRadius: '4px', cursor: 'pointer', padding: '4px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: sel ? '0 0 0 2px #005500' : '0 1px 2px rgba(0,0,0,0.12)', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = '#f4f4f4'; }}
                onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
              >
                <svg viewBox="0 0 90 65" width="100%" style={{ maxHeight: '66px' }}>
                  {/* Crosshair */}
                  <line x1="45" y1="1" x2="45" y2="64" stroke="#e4e4e4" strokeWidth="0.7" />
                  <line x1="1" y1="33" x2="89" y2="33" stroke="#e4e4e4" strokeWidth="0.7" />
                  {/* Shape fill */}
                  <path d={s.d} fill="rgba(0,0,0,0.05)" stroke={sel ? '#005500' : '#111'} strokeWidth={sel ? '2' : '1.5'} />
                  {/* Seta nasal→temporal */}
                  <polygon points="72,9 80,13 72,17" fill={sel ? '#005500' : '#555'} />
                </svg>
                <div style={{ fontSize: '8px', fontWeight: sel ? '700' : '400', color: sel ? '#005500' : '#555', fontFamily: "'Courier New', monospace", marginTop: '1px', textAlign: 'center', letterSpacing: '0.2px' }}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
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
