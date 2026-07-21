// Shapes de lentes ópticas — viewBox "0 0 90 65"
// Baseados nas fotos de referência do catálogo geométrico

const SHAPES: Array<{ name: string; d: string }> = [
  // ── 1: Círculo muito grande
  { name:'SHAPE_1',  d:'M 45,5 C 61,5 75,18 75,33 C 75,48 61,61 45,61 C 29,61 15,48 15,33 C 15,18 29,5 45,5 Z' },
  // ── 2: Círculo grande
  { name:'SHAPE_2',  d:'M 45,7 C 60,7 73,19 73,33 C 73,47 60,59 45,59 C 30,59 17,47 17,33 C 17,19 30,7 45,7 Z' },
  // ── 3: Círculo médio-grande
  { name:'SHAPE_3',  d:'M 45,10 C 58,10 70,20 70,33 C 70,46 58,56 45,56 C 32,56 20,46 20,33 C 20,20 32,10 45,10 Z' },

  // ── 4: Oval alta/gota (teardrop vertical)
  { name:'SHAPE_4',  d:'M 45,6 C 55,6 72,17 72,33 C 72,51 58,60 45,60 C 32,60 18,51 18,33 C 18,17 35,6 45,6 Z' },
  // ── 5: Oval larga clássica
  { name:'SHAPE_5',  d:'M 12,33 C 12,14 78,14 78,33 C 78,52 12,52 12,33 Z' },
  // ── 6: Oval gota horizontal (aviador alongado)
  { name:'SHAPE_6',  d:'M 45,55 C 30,55 10,46 10,30 C 10,14 30,11 45,11 C 60,11 80,14 80,30 C 80,46 60,55 45,55 Z' },

  // ── 7: Retangular quadrado arredondado
  { name:'SHAPE_7',  d:'M 26,14 H 64 Q 76,14 76,24 V 42 Q 76,52 64,52 H 26 Q 14,52 14,42 V 24 Q 14,14 26,14 Z' },
  // ── 8: Irregular oval assimétrica (fundo plano)
  { name:'SHAPE_8',  d:'M 13,38 C 8,28 14,14 30,12 C 46,10 72,12 80,20 C 88,28 80,50 65,54 C 50,58 18,48 13,38 Z' },
  // ── 9: Retangular largo arredondado
  { name:'SHAPE_9',  d:'M 20,19 H 70 Q 80,19 80,27 V 39 Q 80,47 70,47 H 20 Q 10,47 10,39 V 27 Q 10,19 20,19 Z' },

  // ── 10: Retangular muito largo e baixo
  { name:'SHAPE_10', d:'M 16,21 H 74 Q 83,21 83,28 V 38 Q 83,45 74,45 H 16 Q 7,45 7,38 V 28 Q 7,21 16,21 Z' },
  // ── 11: Oval média equilibrada
  { name:'SHAPE_11', d:'M 15,33 C 15,17 75,17 75,33 C 75,49 15,49 15,33 Z' },
  // ── 12: Retangular slim arredondado
  { name:'SHAPE_12', d:'M 19,22 H 71 Q 79,22 79,29 V 37 Q 79,44 71,44 H 19 Q 11,44 11,37 V 29 Q 11,22 19,22 Z' },

  // ── 13: Oval padrão óptica
  { name:'SHAPE_13', d:'M 13,33 C 13,16 77,16 77,33 C 77,50 13,50 13,33 Z' },
  // ── 14: Oval grande alta
  { name:'SHAPE_14', d:'M 16,33 C 16,11 74,11 74,33 C 74,55 16,55 16,33 Z' },
  // ── 15: Browline (retangular topo reto, fundo arredondado)
  { name:'SHAPE_15', d:'M 12,18 H 78 Q 78,18 78,18 V 26 C 78,48 12,52 12,36 V 18 Z' },

  // ── 16: Retangular médio arredondado
  { name:'SHAPE_16', d:'M 22,19 H 68 Q 77,19 77,27 V 39 Q 77,47 68,47 H 22 Q 13,47 13,39 V 27 Q 13,19 22,19 Z' },
  // ── 17: Oval com leve cat-eye
  { name:'SHAPE_17', d:'M 13,37 C 12,20 77,13 78,24 C 79,40 14,53 13,37 Z' },
  // ── 18: Oval slim horizontal (esportivo)
  { name:'SHAPE_18', d:'M 10,33 C 10,20 80,20 80,33 C 80,46 10,46 10,33 Z' },

  // ── 19: Oval slim comprida
  { name:'SHAPE_19', d:'M 8,33 C 8,21 82,21 82,33 C 82,45 8,45 8,33 Z' },
  // ── 20: Oval muito comprida e fina
  { name:'SHAPE_20', d:'M 6,33 C 6,23 84,23 84,33 C 84,43 6,43 6,33 Z' },
  // ── 21: Oval média redonda
  { name:'SHAPE_21', d:'M 18,33 C 18,16 72,16 72,33 C 72,50 18,50 18,33 Z' },

  // ── 22: Redonda clássica (óculos John Lennon)
  { name:'SHAPE_22', d:'M 45,11 C 57,11 67,21 67,33 C 67,45 57,55 45,55 C 33,55 23,45 23,33 C 23,21 33,11 45,11 Z' },
  // ── 23: Oval grande larga
  { name:'SHAPE_23', d:'M 10,33 C 10,13 80,13 80,33 C 80,53 10,53 10,33 Z' },
  // ── 24: Oval grande redonda
  { name:'SHAPE_24', d:'M 12,33 C 12,12 78,12 78,33 C 78,54 12,54 12,33 Z' },

  // ── 25: Retangular pequeno estreito
  { name:'SHAPE_25', d:'M 25,23 H 65 Q 72,23 72,29 V 37 Q 72,43 65,43 H 25 Q 18,43 18,37 V 29 Q 18,23 25,23 Z' },
  // ── 26: Retangular pequeno médio
  { name:'SHAPE_26', d:'M 23,20 H 67 Q 75,20 75,27 V 39 Q 75,46 67,46 H 23 Q 15,46 15,39 V 27 Q 15,20 23,20 Z' },
  // ── 27: Retangular pequeno largo
  { name:'SHAPE_27', d:'M 18,20 H 72 Q 80,20 80,27 V 39 Q 80,46 72,46 H 18 Q 10,46 10,39 V 27 Q 10,20 18,20 Z' },

  // ── 28: Oval grande redonda alta
  { name:'SHAPE_28', d:'M 45,8 C 60,8 73,19 73,33 C 73,47 60,58 45,58 C 30,58 17,47 17,33 C 17,19 30,8 45,8 Z' },
  // ── 29: Oval média clássica
  { name:'SHAPE_29', d:'M 17,33 C 17,18 73,18 73,33 C 73,48 17,48 17,33 Z' },
  // ── 30: Oval pequena redonda
  { name:'SHAPE_30', d:'M 45,17 C 56,17 65,24 65,33 C 65,42 56,49 45,49 C 34,49 25,42 25,33 C 25,24 34,17 45,17 Z' },

  // ── 31: Oval muito pequena
  { name:'SHAPE_31', d:'M 24,33 C 24,19 66,19 66,33 C 66,47 24,47 24,33 Z' },
  // ── 32: Círculo pequeno
  { name:'SHAPE_32', d:'M 45,15 C 56,15 65,23 65,33 C 65,43 56,51 45,51 C 34,51 25,43 25,33 C 25,23 34,15 45,15 Z' },
  // ── 33: Oval muito pequena slim
  { name:'SHAPE_33', d:'M 22,33 C 22,23 68,23 68,33 C 68,43 22,43 22,33 Z' },
  // ── 34: Retangular muito pequeno
  { name:'SHAPE_34', d:'M 27,23 H 63 Q 70,23 70,29 V 37 Q 70,43 63,43 H 27 Q 20,43 20,37 V 29 Q 20,23 27,23 Z' },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export default function LabShapePicker({ value, onChange, onClose }: Props) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:'#f0eeee', border:'2px solid #888', borderRadius:'4px', width:'700px', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 10px 40px rgba(0,0,0,0.6)' }}>

        <div style={{ background:'var(--lab-accent)', color: 'var(--lab-on-accent)', padding:'7px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontWeight:'700', fontSize:'12px', letterSpacing:'2px', fontFamily:"'Courier New', monospace" }}>SHAPES</span>
          <button onClick={onClose} style={{ background:'none', border:'1px solid #99ffaa', color: 'var(--lab-hdr-txt)', padding:'1px 8px', cursor:'pointer', fontSize:'11px' }}>✕</button>
        </div>

        <div style={{ overflowY:'auto', padding:'10px', display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'7px', background:'#e0ddd8' }}>
          {SHAPES.map(s => {
            const sel = value === s.name;
            return (
              <div key={s.name} onClick={() => { onChange(s.name); onClose(); }}
                style={{ background:sel?'#eeffee':'#fff', border:sel?'2px solid var(--lab-accent)':'1px solid #ccc', borderRadius:'4px', cursor:'pointer', padding:'4px 2px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:sel?'0 0 0 2px var(--lab-accent)':'0 1px 2px rgba(0,0,0,0.12)' }}
                onMouseEnter={e=>{ if(!sel)(e.currentTarget as HTMLDivElement).style.background='#f4f4f4'; }}
                onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLDivElement).style.background='#fff'; }}
              >
                <svg viewBox="0 0 90 65" width="100%" style={{ maxHeight:'66px' }}>
                  <line x1="45" y1="1"  x2="45" y2="64" stroke="#ddd" strokeWidth="0.8"/>
                  <line x1="1"  y1="33" x2="89" y2="33" stroke="#ddd" strokeWidth="0.8"/>
                  <path d={s.d} fill="rgba(0,0,0,0.04)" stroke={sel?'var(--lab-accent)':'#111'} strokeWidth={sel?'2':'1.5'}/>
                  <polygon points="72,9 80,13 72,17" fill={sel?'var(--lab-accent)':'#555'}/>
                </svg>
                <div style={{ fontSize:'9px', fontWeight:sel?'700':'400', color:sel?'var(--lab-accent)':'#555', fontFamily:"'Courier New', monospace", marginTop:'1px' }}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding:'6px 12px', background:'var(--lab-alt)', borderTop:'1px solid #bbb', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:'11px', color:'#555', fontFamily:"'Courier New', monospace" }}>
            {value?`Selecionado: ${value}`:'Clique em um shape para selecionar'}
          </span>
          <button onClick={onClose} style={{ padding:'3px 16px', fontSize:'11px', background:'var(--lab-accent)', color: 'var(--lab-on-accent)', border:'none', borderRadius:'2px', cursor:'pointer', fontWeight:'700' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
