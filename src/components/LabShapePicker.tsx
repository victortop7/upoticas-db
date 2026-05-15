// Shapes de lentes ópticas — viewBox "0 0 90 65"
// Paths desenhados individualmente, máxima variedade visual

const SHAPES: Array<{ name: string; d: string }> = [
  // ── 1: Oval larga padrão
  { name:'SHAPE_1',  d:'M 12,33 C 12,14 78,14 78,33 C 78,52 12,52 12,33 Z' },
  // ── 2: Oval larga topo achatado
  { name:'SHAPE_2',  d:'M 12,33 C 12,24 78,24 78,33 C 78,52 12,52 12,33 Z' },
  // ── 3: Oval extra-larga e baixa
  { name:'SHAPE_3',  d:'M 7,33 C 7,21 83,21 83,33 C 83,45 7,45 7,33 Z' },
  // ── 4: Oval alta (mais vertical)
  { name:'SHAPE_4',  d:'M 20,33 C 20,8 70,8 70,33 C 70,58 20,58 20,33 Z' },
  // ── 5: Oval grande equilibrada
  { name:'SHAPE_5',  d:'M 10,33 C 10,10 80,10 80,33 C 80,56 10,56 10,33 Z' },

  // ── 6: Topo MUITO plano, fundo arredondado (estilo browline)
  { name:'SHAPE_6',  d:'M 12,33 C 12,27 78,27 78,33 C 78,54 12,54 12,33 Z' },
  // ── 7: Oval fundo plano, topo arredondado
  { name:'SHAPE_7',  d:'M 12,33 C 12,13 78,13 78,33 C 78,39 12,39 12,33 Z' },
  // ── 8: Retangular arredondado médio
  { name:'SHAPE_8',  d:'M 21,17 H 69 Q 79,17 79,25 V 41 Q 79,49 69,49 H 21 Q 11,49 11,41 V 25 Q 11,17 21,17 Z' },
  // ── 9: Retangular arredondado largo
  { name:'SHAPE_9',  d:'M 18,19 H 72 Q 81,19 81,26 V 40 Q 81,47 72,47 H 18 Q 9,47 9,40 V 26 Q 9,19 18,19 Z' },
  // ── 10: Retangular slim (estreito)
  { name:'SHAPE_10', d:'M 19,22 H 71 Q 79,22 79,28 V 38 Q 79,44 71,44 H 19 Q 11,44 11,38 V 28 Q 11,22 19,22 Z' },

  // ── 11: Cat-eye — nasal (esq) baixo, temporal (dir) alto
  { name:'SHAPE_11', d:'M 13,37 C 13,18 78,10 78,20 C 78,38 13,56 13,37 Z' },
  // ── 12: Cat-eye suave
  { name:'SHAPE_12', d:'M 14,36 C 14,20 77,14 77,24 C 77,42 14,54 14,36 Z' },
  // ── 13: Cat-eye forte
  { name:'SHAPE_13', d:'M 12,38 C 12,16 81,6 81,18 C 81,38 12,58 12,38 Z' },
  // ── 14: Borboleta larga
  { name:'SHAPE_14', d:'M 10,38 C 10,16 83,6 83,18 C 83,38 10,58 10,38 Z' },
  // ── 15: Redonda clássica
  { name:'SHAPE_15', d:'M 21,33 C 21,8 69,8 69,33 C 69,58 21,58 21,33 Z' },

  // ── 16: Redonda média
  { name:'SHAPE_16', d:'M 23,33 C 23,11 67,11 67,33 C 67,55 23,55 23,33 Z' },
  // ── 17: Redonda pequena
  { name:'SHAPE_17', d:'M 26,33 C 26,14 64,14 64,33 C 64,52 26,52 26,33 Z' },
  // ── 18: Oval média padrão
  { name:'SHAPE_18', d:'M 16,33 C 16,14 74,14 74,33 C 74,52 16,52 16,33 Z' },
  // ── 19: Oval média topo achatado
  { name:'SHAPE_19', d:'M 16,33 C 16,23 74,23 74,33 C 74,52 16,52 16,33 Z' },
  // ── 20: Aviador/gota — começa do ponto inferior e traça a silhueta
  { name:'SHAPE_20', d:'M 45,57 C 35,57 11,47 11,28 C 11,13 79,13 79,28 C 79,47 55,57 45,57 Z' },

  // ── 21: Aviador médio
  { name:'SHAPE_21', d:'M 45,55 C 35,55 13,46 13,29 C 13,15 77,15 77,29 C 77,46 55,55 45,55 Z' },
  // ── 22: Oval com leve assimetria
  { name:'SHAPE_22', d:'M 13,35 C 13,15 77,17 77,28 C 77,47 13,52 13,35 Z' },
  // ── 23: Oval slim larga
  { name:'SHAPE_23', d:'M 10,33 C 10,23 80,23 80,33 C 80,43 10,43 10,33 Z' },
  // ── 24: Slim oval média
  { name:'SHAPE_24', d:'M 14,33 C 14,24 76,24 76,33 C 76,42 14,42 14,33 Z' },
  // ── 25: Retangular arredondado quadrado
  { name:'SHAPE_25', d:'M 24,15 H 66 Q 75,15 75,23 V 43 Q 75,51 66,51 H 24 Q 15,51 15,43 V 23 Q 15,15 24,15 Z' },

  // ── 26: Oval pequena padrão
  { name:'SHAPE_26', d:'M 19,33 C 19,14 71,14 71,33 C 71,52 19,52 19,33 Z' },
  // ── 27: Oval pequena topo plano
  { name:'SHAPE_27', d:'M 19,33 C 19,22 71,22 71,33 C 71,52 19,52 19,33 Z' },
  // ── 28: Oval pequena redonda
  { name:'SHAPE_28', d:'M 22,33 C 22,11 68,11 68,33 C 68,55 22,55 22,33 Z' },
  // ── 29: Retangular pequeno
  { name:'SHAPE_29', d:'M 22,19 H 68 Q 76,19 76,26 V 40 Q 76,47 68,47 H 22 Q 14,47 14,40 V 26 Q 14,19 22,19 Z' },
  // ── 30: Slim pequena
  { name:'SHAPE_30', d:'M 18,33 C 18,24 72,24 72,33 C 72,42 18,42 18,33 Z' },

  // ── 31: Muito pequena oval
  { name:'SHAPE_31', d:'M 25,33 C 25,16 65,16 65,33 C 65,50 25,50 25,33 Z' },
  // ── 32: Muito pequena redonda
  { name:'SHAPE_32', d:'M 27,33 C 27,13 63,13 63,33 C 63,53 27,53 27,33 Z' },
  // ── 33: Muito pequena slim
  { name:'SHAPE_33', d:'M 22,33 C 22,23 68,23 68,33 C 68,43 22,43 22,33 Z' },
  // ── 34: Muito pequena retangular
  { name:'SHAPE_34', d:'M 24,20 H 66 Q 73,20 73,27 V 39 Q 73,46 66,46 H 24 Q 17,46 17,39 V 27 Q 17,20 24,20 Z' },
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

        <div style={{ background:'#005500', color:'#fff', padding:'7px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontWeight:'700', fontSize:'12px', letterSpacing:'2px', fontFamily:"'Courier New', monospace" }}>SHAPES</span>
          <button onClick={onClose} style={{ background:'none', border:'1px solid #99ffaa', color:'#ccffcc', padding:'1px 8px', cursor:'pointer', fontSize:'11px' }}>✕</button>
        </div>

        <div style={{ overflowY:'auto', padding:'10px', display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'7px', background:'#e0ddd8' }}>
          {SHAPES.map(s => {
            const sel = value === s.name;
            return (
              <div key={s.name} onClick={() => { onChange(s.name); onClose(); }}
                style={{ background:sel?'#eeffee':'#fff', border:sel?'2px solid #005500':'1px solid #ccc', borderRadius:'4px', cursor:'pointer', padding:'4px 2px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:sel?'0 0 0 2px #005500':'0 1px 2px rgba(0,0,0,0.12)' }}
                onMouseEnter={e=>{ if(!sel)(e.currentTarget as HTMLDivElement).style.background='#f4f4f4'; }}
                onMouseLeave={e=>{ if(!sel)(e.currentTarget as HTMLDivElement).style.background='#fff'; }}
              >
                <svg viewBox="0 0 90 65" width="100%" style={{ maxHeight:'66px' }}>
                  <line x1="45" y1="1"  x2="45" y2="64" stroke="#ddd" strokeWidth="0.8"/>
                  <line x1="1"  y1="33" x2="89" y2="33" stroke="#ddd" strokeWidth="0.8"/>
                  <path d={s.d} fill="rgba(0,0,0,0.04)" stroke={sel?'#005500':'#111'} strokeWidth={sel?'2':'1.5'}/>
                  <polygon points="72,9 80,13 72,17" fill={sel?'#005500':'#555'}/>
                </svg>
                <div style={{ fontSize:'9px', fontWeight:sel?'700':'400', color:sel?'#005500':'#555', fontFamily:"'Courier New', monospace", marginTop:'1px' }}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding:'6px 12px', background:'#d4d0c8', borderTop:'1px solid #bbb', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:'11px', color:'#555', fontFamily:"'Courier New', monospace" }}>
            {value?`Selecionado: ${value}`:'Clique em um shape para selecionar'}
          </span>
          <button onClick={onClose} style={{ padding:'3px 16px', fontSize:'11px', background:'#005500', color:'#fff', border:'none', borderRadius:'2px', cursor:'pointer', fontWeight:'700' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
