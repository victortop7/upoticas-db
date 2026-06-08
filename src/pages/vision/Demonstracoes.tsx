import { useState, useRef, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Tab = 'superficie' | 'visao' | 'fotossensivel';

const TRATAMENTOS = [
  { id: 'ar',  label: 'Anti-Reflexo',  cor: '#3b82f6' },
  { id: 'az',  label: 'Luz Azul',      cor: '#8b5cf6' },
  { id: 'ft',  label: 'Fotossensível', cor: '#f59e0b' },
  { id: 'ab',  label: 'Anti-Abrasivo', cor: '#22c55e' },
  { id: 'hf',  label: 'Hidrofóbico',   cor: '#06b6d4' },
  { id: 'uv',  label: 'Proteção UV',   cor: '#ef4444' },
  { id: 'pol', label: 'Polarizado',    cor: '#f97316' },
];

const AMBIENTES = [
  { id: 'noite',   label: 'Noite',   emoji: '🌙' },
  { id: 'chuva',   label: 'Chuva',   emoji: '🌧️' },
  { id: 'sol',     label: 'Sol',     emoji: '☀️' },
  { id: 'tela',    label: 'Tela',    emoji: '💻' },
  { id: 'leitura', label: 'Leitura', emoji: '📖' },
];

const SCENE_BG: Record<string, string> = {
  noite: `
    radial-gradient(ellipse at 28% 42%, rgba(255,220,80,1) 0%, rgba(255,165,30,.7) 5%, rgba(255,120,20,.18) 16%, transparent 28%),
    radial-gradient(ellipse at 71% 35%, rgba(255,210,60,.9) 0%, rgba(255,150,20,.6) 4%, rgba(255,120,20,.12) 14%, transparent 25%),
    radial-gradient(ellipse at 50% 80%, rgba(40,80,180,.3) 0%, transparent 55%),
    linear-gradient(to bottom, #020408 0%, #050b18 35%, #070e20 70%, #0a1228 100%)`,
  chuva: `
    repeating-linear-gradient(98deg, transparent 0px, transparent 20px, rgba(160,195,225,.05) 20px, rgba(160,195,225,.05) 22px),
    linear-gradient(170deg, #1c2c3e 0%, #0e1926 50%, #080f1c 100%)`,
  sol: `
    radial-gradient(ellipse at 50% -8%, rgba(255,255,200,1) 0%, rgba(255,240,120,.85) 18%, rgba(130,198,232,.75) 45%, #78b2d8 70%, #5c9ec6 100%)`,
  tela: `
    radial-gradient(ellipse at 50% 44%, rgba(28,78,195,.98) 0%, rgba(14,42,118,.82) 28%, rgba(7,20,58,.95) 55%, #020810 100%)`,
  leitura: `
    radial-gradient(ellipse at 60% 20%, rgba(255,245,220,1) 0%, rgba(250,235,205,.8) 30%, rgba(240,220,185,1) 100%)`,
};

type Effect = { semFilter: string; comFilter: string; description: string };

const EFFECTS: Record<string, Record<string, Effect>> = {
  ar: {
    noite:   { semFilter: 'brightness(.72) contrast(1.22)', comFilter: 'brightness(1.08) contrast(.98) saturate(1.08)', description: 'Reflexos de faróis eliminados — visão noturna segura' },
    chuva:   { semFilter: 'brightness(.76) contrast(1.15) blur(.35px)', comFilter: 'brightness(.94)', description: 'Reflexos do asfalto molhado eliminados completamente' },
    sol:     { semFilter: 'brightness(.82) contrast(1.28) saturate(.78)', comFilter: 'brightness(1.0) contrast(1.05)', description: 'Reflexos em vidros e superfícies — eliminados' },
    tela:    { semFilter: 'brightness(.76) contrast(1.22)', comFilter: 'brightness(1.02) contrast(.98)', description: 'Reflexo da tela eliminado — 99,9% de transmissão de luz' },
    leitura: { semFilter: 'brightness(.8) contrast(1.14)', comFilter: 'brightness(1.04) contrast(1.0)', description: 'Reflexo do papel eliminado — leitura sem esforço' },
  },
  az: {
    noite:   { semFilter: 'hue-rotate(18deg) saturate(1.42) brightness(.84)', comFilter: 'sepia(.12) saturate(.87) brightness(1.02)', description: 'LEDs e fluorescentes filtrados — menos tensão ocular' },
    chuva:   { semFilter: 'hue-rotate(14deg) saturate(1.3) brightness(.88)', comFilter: 'sepia(.1) saturate(.9) brightness(.98)', description: 'Céu cinza emite forte luz azul — filtrada' },
    sol:     { semFilter: 'hue-rotate(8deg) saturate(1.22) brightness(.9)', comFilter: 'sepia(.08) saturate(.94) brightness(1.04)', description: 'Componente azul/UV do sol filtrada' },
    tela:    { semFilter: 'hue-rotate(16deg) saturate(1.62) brightness(.86)', comFilter: 'sepia(.16) saturate(.8) brightness(1.12) hue-rotate(-6deg)', description: 'Luz azul nociva filtrada — menos fadiga e melhor sono' },
    leitura: { semFilter: 'hue-rotate(10deg) saturate(1.26) brightness(.88)', comFilter: 'sepia(.1) saturate(.9) brightness(1.06)', description: 'Leitura prolongada sem cansaço visual' },
  },
  ft: {
    noite:   { semFilter: 'brightness(.88)', comFilter: 'brightness(.9)', description: 'Sem UV à noite — lente totalmente clara' },
    chuva:   { semFilter: 'brightness(1.05) saturate(.84)', comFilter: 'brightness(.68) saturate(.64) contrast(1.06)', description: 'Ativa mesmo em dias nublados com UV presente' },
    sol:     { semFilter: 'brightness(1.38) contrast(1.22) saturate(.68)', comFilter: 'brightness(.4) contrast(1.22) saturate(.52)', description: 'Escurece automaticamente sob luz solar — proteção total' },
    tela:    { semFilter: 'brightness(.92)', comFilter: 'brightness(.94)', description: 'Telas não emitem UV — lente permanece clara' },
    leitura: { semFilter: 'brightness(1.0)', comFilter: 'brightness(.96)', description: 'Iluminação interna: lente clara para conforto de leitura' },
  },
  ab: {
    noite:   { semFilter: 'brightness(.7) blur(.6px) contrast(1.12)', comFilter: 'brightness(1.05)', description: 'Sem riscos = sem difração dos faróis noturnos' },
    chuva:   { semFilter: 'brightness(.76) blur(.5px)', comFilter: 'brightness(.92)', description: 'Riscos não retêm sujeira — limpeza mais fácil' },
    sol:     { semFilter: 'brightness(.86) blur(.35px)', comFilter: 'brightness(1.0)', description: 'Areia e poeira não arranhão — campo e praia' },
    tela:    { semFilter: 'brightness(.78) blur(.4px)', comFilter: 'brightness(1.02)', description: 'Superfície dura protegida — texto perfeitamente nítido' },
    leitura: { semFilter: 'brightness(.83) blur(.5px) contrast(.88)', comFilter: 'brightness(1.06) contrast(1.02)', description: 'Arranhões eliminados — visão cristalina para leitura' },
  },
  hf: {
    noite:   { semFilter: 'brightness(.6) blur(.9px) contrast(.84)', comFilter: 'brightness(.95)', description: 'Névoa e condensação eliminadas à noite' },
    chuva:   { semFilter: 'brightness(.62) blur(1.2px)', comFilter: 'brightness(.9)', description: 'Gotas deslizam imediatamente — visão livre na chuva' },
    sol:     { semFilter: 'brightness(.86) contrast(.92)', comFilter: 'brightness(1.06) contrast(1.05)', description: 'Repele suor, protetor e gordura — praia e esporte' },
    tela:    { semFilter: 'brightness(.84) contrast(.9)', comFilter: 'brightness(1.0)', description: 'Digitais e manchas de gordura escorregam da lente' },
    leitura: { semFilter: 'brightness(.87) contrast(.93)', comFilter: 'brightness(1.02)', description: 'Fácil de limpar — sem marcas persistentes' },
  },
  uv: {
    noite:   { semFilter: 'brightness(.95)', comFilter: 'brightness(1.0)', description: 'Sem UV à noite — proteção sem alterar a visão' },
    chuva:   { semFilter: 'brightness(1.18) contrast(1.12) saturate(.8)', comFilter: 'brightness(.95) contrast(1.0)', description: 'UV presente mesmo nublado — bloqueado automaticamente' },
    sol:     { semFilter: 'brightness(1.48) contrast(1.38) saturate(.52)', comFilter: 'brightness(.96) contrast(1.08)', description: 'UVA e UVB 100% bloqueados — proteção máxima da retina' },
    tela:    { semFilter: 'brightness(.9) saturate(1.16)', comFilter: 'brightness(1.0)', description: 'Telas emitem UV mínimo — proteção preventiva' },
    leitura: { semFilter: 'brightness(1.06)', comFilter: 'brightness(1.0)', description: 'Iluminação UV indireta bloqueada' },
  },
  pol: {
    noite:   { semFilter: 'brightness(.7) contrast(1.28)', comFilter: 'brightness(1.06) contrast(1.06)', description: 'Reflexos horizontais das luzes eliminados' },
    chuva:   { semFilter: 'brightness(.74) contrast(1.22)', comFilter: 'brightness(.95) saturate(1.16)', description: 'Reflexos do asfalto molhado completamente eliminados' },
    sol:     { semFilter: 'brightness(.8) contrast(1.32) saturate(.68)', comFilter: 'brightness(1.0) contrast(1.12) saturate(1.22)', description: 'Reflexos horizontais eliminados — cores vibrantes' },
    tela:    { semFilter: 'brightness(.85) contrast(1.1)', comFilter: 'brightness(1.02)', description: 'Reflexos de telas LCD — comportamento normal com polarizado' },
    leitura: { semFilter: 'brightness(.83) contrast(1.12)', comFilter: 'brightness(1.02) contrast(1.02) saturate(1.06)', description: 'Reflexos de papel eliminados — leitura ao ar livre' },
  },
};

// ─── SVG overlays ─────────────────────────────────────────────────────────────
function GlareRings() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {[9,18,27,36,46].map(r => (
        <circle key={r} cx="28" cy="42" r={r} fill="none" stroke="rgba(255,235,160,.11)" strokeWidth=".8" />
      ))}
      {[8,16,24,32,40].map(r => (
        <circle key={r} cx="71" cy="35" r={r} fill="none" stroke="rgba(255,235,160,.09)" strokeWidth=".7" />
      ))}
      <circle cx="28" cy="42" r="4" fill="rgba(255,255,210,.96)" />
      <circle cx="71" cy="35" r="3.5" fill="rgba(255,255,200,.92)" />
    </svg>
  );
}

function WaterDrops() {
  const drops = [
    {cx:18,cy:22,rx:3.5,ry:4.2},{cx:43,cy:14,rx:4.5,ry:5.5},{cx:68,cy:28,rx:3,ry:3.8},
    {cx:30,cy:52,rx:5.2,ry:6.2},{cx:60,cy:62,rx:4,ry:4.8},{cx:82,cy:44,rx:4.2,ry:5},
    {cx:12,cy:72,rx:2.8,ry:3.4},{cx:52,cy:80,rx:4,ry:5},{cx:86,cy:72,rx:3.2,ry:4},
    {cx:22,cy:88,rx:2.5,ry:3.2},{cx:74,cy:85,rx:3.5,ry:4.2},{cx:95,cy:30,rx:3,ry:3.6},
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="wdg" cx="35%" cy="30%">
          <stop offset="0%" stopColor="rgba(210,235,255,.92)" />
          <stop offset="100%" stopColor="rgba(160,200,240,.35)" />
        </radialGradient>
      </defs>
      {drops.map((d, i) => (
        <ellipse key={i} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry}
          fill="url(#wdg)" stroke="rgba(180,215,255,.4)" strokeWidth=".3" />
      ))}
    </svg>
  );
}

function ScratchLines() {
  const sc = [
    {x1:12,y1:18,x2:44,y2:32},{x1:60,y1:8,x2:72,y2:50},{x1:28,y1:55,x2:54,y2:70},
    {x1:70,y1:60,x2:90,y2:76},{x1:18,y1:82,x2:38,y2:96},{x1:82,y1:18,x2:96,y2:38},
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {sc.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="rgba(255,255,255,.38)" strokeWidth=".45" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function getSemSvg(tratamento: string, ambiente: string): ReactNode | null {
  if ((tratamento === 'ar' || tratamento === 'pol') && ambiente === 'noite') return <GlareRings />;
  if (tratamento === 'pol' && ambiente === 'sol') return <GlareRings />;
  if (tratamento === 'hf' && (ambiente === 'chuva' || ambiente === 'noite')) return <WaterDrops />;
  if (tratamento === 'ab') return <ScratchLines />;
  return null;
}

// ─── Superfície ───────────────────────────────────────────────────────────────
function Superficie({ initialDemo }: { initialDemo?: string }) {
  const [tipo, setTipo] = useState<'convencional' | 'digital'>(
    initialDemo === 'digital' ? 'digital' : 'convencional'
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '24px 40px' }}>
      <div style={{ display: 'flex', gap: 0, background: '#07080e', borderRadius: 10, padding: 3, border: '1px solid #1e2030' }}>
        {(['convencional', 'digital'] as const).map(t => (
          <button key={t} onClick={() => setTipo(t)} style={{
            padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tipo === t ? '#1e2030' : 'transparent',
            color: tipo === t ? '#f0f0f5' : '#4b5563',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)',
            textTransform: 'uppercase', letterSpacing: '.06em', transition: 'all .15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#07080e', border: '1px solid #1e2030', borderRadius: 20, padding: 32 }}>
            {tipo === 'convencional' ? (
              <svg viewBox="0 0 220 180" width="220" height="180">
                {[10,22,36,52,70,88,105].map((r, i) => (
                  <ellipse key={i} cx="110" cy="90" rx={r * 1.5} ry={r}
                    fill="none" stroke="#3b82f6" strokeWidth={i === 0 ? 1.8 : .7} strokeOpacity={.5 - i * .05} />
                ))}
                <ellipse cx="110" cy="90" rx="14" ry="10" fill="#3b82f630" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 220 180" width="220" height="180">
                <defs>
                  <linearGradient id="gdig2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity=".04" />
                    <stop offset="55%" stopColor="#3b82f6" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity=".04" />
                  </linearGradient>
                </defs>
                <ellipse cx="110" cy="90" rx="100" ry="70" fill="url(#gdig2)" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity=".5" />
                <ellipse cx="88" cy="72" rx="28" ry="14" fill="#3b82f6" fillOpacity=".15" />
                {[0,1,2,3].map(i => (
                  <line key={i} x1={30+i*53} y1="25" x2={30+i*53} y2="155" stroke="#3b82f6" strokeWidth=".4" strokeOpacity=".15" />
                ))}
                {[0,1,2].map(i => (
                  <line key={i} x1="10" y1={50+i*40} x2="210" y2={50+i*40} stroke="#3b82f6" strokeWidth=".4" strokeOpacity=".15" />
                ))}
              </svg>
            )}
          </div>
          <div style={{ fontSize: 11, color: tipo === 'convencional' ? '#6b7280' : '#3b82f6', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700 }}>
            {tipo}
          </div>
        </div>

        <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-.3px' }}>
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
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: tipo === 'digital' ? '#3b82f6' : '#374151', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#4b5563' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visão COM/SEM ─────────────────────────────────────────────────────────────
function Visao({ initialDemo }: { initialDemo?: string }) {
  const [tratamento, setTratamento] = useState(
    TRATAMENTOS.some(t => t.id === initialDemo) ? initialDemo! : 'ar'
  );
  const [ambiente, setAmbiente] = useState('noite');
  const [divX, setDivX] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const trObj = TRATAMENTOS.find(t => t.id === tratamento)!;
  const effect = EFFECTS[tratamento]?.[ambiente] ?? EFFECTS.ar.noite;
  const semSvg = getSemSvg(tratamento, ambiente);
  const REAL_PHOTOS: Record<string, { com: string; sem: string }> = {
    ar: {
      com: '/tratamento%20de%20antirreflexo/com%20anti-reflexo.png',
      sem: '/tratamento%20de%20antirreflexo/sem%20anti-reflexo.png',
    },
    az: {
      com: '/tratamento%20de%20antirreflexo%20azul/com%20luz%20azul.png',
      sem: '/tratamento%20de%20antirreflexo%20azul/sem%20luz%20azul.png',
    },
    ab: {
      com: '/tratamento%20anti-abrasivo/COM%20ANTI-ABRASIVO.png',
      sem: '/tratamento%20anti-abrasivo/SEM%20ANTI-ABRASIVO-2%2C.png',
    },
  };
  const realPhoto = REAL_PHOTOS[tratamento] ?? null;
  const useRealPhoto = !!realPhoto;

  function move(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDivX(Math.min(90, Math.max(10, ((clientX - rect.left) / rect.width) * 100)));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Comparador */}
      <div
        ref={containerRef}
        onMouseDown={() => { dragging.current = true; }}
        onMouseMove={e => { if (dragging.current) move(e.clientX); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchStart={() => { dragging.current = true; }}
        onTouchMove={e => move(e.touches[0].clientX)}
        onTouchEnd={() => { dragging.current = false; }}
        style={{ flex: 1, position: 'relative', cursor: 'col-resize', userSelect: 'none', overflow: 'hidden' }}
      >
        {/* SEM base */}
        {useRealPhoto ? (
          <img
            src={realPhoto!.sem}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', pointerEvents: 'none' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: SCENE_BG[ambiente], filter: effect.semFilter }} />
        )}

        {/* COM overlay — lado esquerdo */}
        {useRealPhoto ? (
          <img
            src={realPhoto!.com}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', clipPath: `inset(0 ${100 - divX}% 0 0)`, pointerEvents: 'none' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: SCENE_BG[ambiente], filter: effect.comFilter, clipPath: `inset(0 ${100 - divX}% 0 0)` }} />
        )}

        {/* SVG de defeito no lado SEM (direito) — só quando não usa foto real */}
        {!useRealPhoto && semSvg && (
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${divX}%)`, pointerEvents: 'none' }}>
            {semSvg}
          </div>
        )}

        {/* Divisor */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${divX}%`, transform: 'translateX(-50%)',
          width: 2, background: 'rgba(255,255,255,.9)',
          boxShadow: '0 0 12px rgba(255,255,255,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e2030" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e2030" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: -8 }}><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>

        {/* Labels */}
        <div style={{ position: 'absolute', bottom: 64, left: 16, fontSize: 11, color: '#e2e8f0', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✓ COM {trObj.label.toUpperCase()}
        </div>
        <div style={{ position: 'absolute', bottom: 64, right: 16, fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✗ SEM
        </div>

        {/* Descrição */}
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,.78)', borderRadius: 12, padding: '10px 20px',
          width: 'max-content', maxWidth: 400, textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, color: trObj.cor, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {trObj.label}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            {effect.description}
          </div>
        </div>
        {/* Painel de tratamentos — overlay vertical direito */}
        <div
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            background: 'linear-gradient(to left, rgba(0,0,0,0.78) 60%, transparent)',
            paddingRight: 4, zIndex: 10, minWidth: 160,
          }}
        >
          {TRATAMENTOS.map(t => (
            <button key={t.id} onClick={() => setTratamento(t.id)} style={{
              background: tratamento === t.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '10px 18px 10px 14px',
              textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background .15s',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 3, height: 16, borderRadius: 2, flexShrink: 0,
                background: tratamento === t.id ? t.cor : 'transparent',
                transition: 'background .15s',
              }} />
              <span style={{
                fontSize: 11.5, fontWeight: tratamento === t.id ? 700 : 400,
                fontFamily: 'var(--sans)', letterSpacing: '.07em', textTransform: 'uppercase',
                color: tratamento === t.id ? '#ffffff' : 'rgba(255,255,255,0.45)',
                transition: 'color .15s',
              }}>{t.label}</span>
            </button>
          ))}

          {!useRealPhoto && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 14px' }} />
              {AMBIENTES.map(a => (
                <button key={a.id} onClick={() => setAmbiente(a.id)} style={{
                  background: ambiente === a.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  padding: '7px 18px 7px 14px',
                  textAlign: 'left', width: '100%',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background .15s',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ fontSize: 13 }}>{a.emoji}</span>
                  <span style={{
                    fontSize: 10.5, fontWeight: ambiente === a.id ? 700 : 400,
                    fontFamily: 'var(--sans)', letterSpacing: '.05em',
                    color: ambiente === a.id ? '#ffffff' : 'rgba(255,255,255,0.38)',
                    transition: 'color .15s',
                  }}>{a.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fotossensível ─────────────────────────────────────────────────────────────
function Fotossensivel() {
  const [valor, setValor] = useState(0);
  const pct = valor / 100;
  const darkR = Math.round(pct * 40);
  const darkG = Math.round(pct * 35);
  const darkB = Math.round(pct * 20);
  const darkA = pct * 0.85;

  const uvLevel = valor < 25 ? 'Ambiente interno' : valor < 55 ? 'Nublado — UV presente' : valor < 80 ? 'Sol direto' : 'Sol forte — UV intenso';
  const uvIcon = valor < 25 ? '🏠' : valor < 55 ? '⛅' : valor < 80 ? '🌤️' : '☀️';
  const lensLabel = valor < 10 ? 'CLARA' : valor < 40 ? `${Math.round(pct * 100)}% ATIVA` : `${Math.round(pct * 100)}% ESCURA`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 40px', gap: 28 }}>
      {/* Cena com lente sobreposta */}
      <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Cena outdoor */}
        <div style={{
          width: 300, height: 200, borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: SCENE_BG.sol, border: '1px solid #1e2030',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          {/* Overlay da lente fotossensível */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `rgba(${darkR},${darkG},${darkB},${darkA})`,
            transition: 'background .35s ease',
          }} />
          {/* Ícone UV */}
          <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 28 }}>{uvIcon}</div>
          {/* Estado da lente */}
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,.65)', borderRadius: 8, padding: '5px 14px',
            fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 700,
            color: pct < .1 ? '#9ca3af' : `rgba(${220 - Math.round(pct*80)},${180 - Math.round(pct*60)},${60 - Math.round(pct*40)},1)`,
            whiteSpace: 'nowrap',
          }}>{lensLabel}</div>
        </div>

        {/* Info UV */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 220 }}>
          <div>
            <div style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Intensidade UV</div>
            <div style={{ height: 8, background: '#1e2030', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${valor}%`,
                background: `linear-gradient(to right, #1e3a5f, #3b82f6, #f59e0b, #ef4444)`,
                transition: 'width 0s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: '#374151', fontFamily: 'var(--mono)' }}>
              <span>0 UV</span><span>UV máx</span>
            </div>
          </div>

          {/* Escala de escurecimento */}
          <div style={{ background: '#07080e', borderRadius: 14, padding: '14px 16px', border: '1px solid #1e2030' }}>
            <div style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Estado atual</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', border: '2px solid #2a2d3e',
                background: pct < .05 ? 'rgba(200,220,255,.15)' : `rgba(${darkR*2},${darkG*2},${darkB*2},${Math.min(darkA+.1, 1)})`,
                transition: 'background .35s',
              }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5', fontFamily: 'var(--mono)' }}>
                  {uvIcon} {uvLevel}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                  {pct < .05 ? 'Lente transparente' : `Filtrando ${Math.round(pct * 100)}% da luz`}
                </div>
              </div>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.65, background: '#07080e', borderRadius: 12, padding: '12px 16px', border: '1px solid #1e2030' }}>
            Tecnologia fotocromática que escurece automaticamente ao detectar raios UV. Volta ao estado claro em ambientes fechados em segundos.
          </p>
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span style={{ fontSize: 12, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Intensidade da Luz Solar / UV
          </span>
          <span style={{ fontSize: 22 }}>☀️</span>
        </div>
        <div style={{ position: 'relative', height: 10, background: '#1e2030', borderRadius: 5 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${valor}%`, borderRadius: 5,
            background: `linear-gradient(to right, #1e3a5f, #3b82f6 40%, #f59e0b 70%, #ef4444)`,
          }} />
          <input type="range" min={0} max={100} value={valor}
            onChange={e => setValor(Number(e.target.value))}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Demonstracoes() {
  const [params] = useSearchParams();
  const rawTab = params.get('tab') ?? 'superficie';
  const demo = params.get('demo') ?? '';
  const validTabs: Tab[] = ['superficie', 'visao', 'fotossensivel'];
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : 'superficie';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showExtras, setShowExtras] = useState(false);
  const navigate = useNavigate();

  const DEMO_ITEMS_NAV = [
    { id: 'digital',    label: 'Digital',    tab: 'superficie' },
    { id: 'campos',     label: 'Campos',     tab: 'superficie' },
    { id: 'adicao',     label: 'Adição',     tab: 'superficie' },
    { id: 'photo',      label: 'Photo',      tab: 'fotossensivel' },
    { id: 'ar',         label: 'AR',         tab: 'visao' },
    { id: 'polarizado', label: 'Polarizado', tab: 'visao' },
    { id: 'espessura',  label: 'Espessura',  tab: 'superficie' },
  ];

  return (
    <div
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#050508', overflow: 'hidden' }}
      onClick={() => setShowExtras(false)}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', height: 48,
        background: '#07080e', borderBottom: '1px solid #12141c', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            ['superficie', 'SUPERFÍCIE'],
            ['visao', 'VISÃO'],
            ['fotossensivel', 'SIMULAÇÃO'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 20px', height: 48,
              fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
              color: tab === t ? '#f0f0f5' : '#374151',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
              fontFamily: 'var(--mono)', transition: 'color .15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'superficie' && <Superficie initialDemo={demo} />}
      {tab === 'visao' && <Visao initialDemo={demo} />}
      {tab === 'fotossensivel' && <Fotossensivel />}

      {/* Extras popup — lista de simulações */}
      {showExtras && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', bottom: 100, right: 16,
            background: 'rgba(7,8,14,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '14px 8px 10px',
            zIndex: 100,
            minWidth: 160,
            animation: 'popUp 0.18s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 8, paddingInline: 8, fontWeight: 700 }}>
            Simulações
          </div>
          {DEMO_ITEMS_NAV.map(item => (
            <button key={item.id} onClick={() => {
              setTab(item.tab as Tab);
              navigate(`/vision/demonstracoes?tab=${item.tab}&demo=${item.id}`);
              setShowExtras(false);
            }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 10px', borderRadius: 10,
              transition: 'background .12s', WebkitTapHighlightColor: 'transparent',
            }}
            onPointerEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onPointerLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 600, fontFamily: 'var(--sans)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom nav — canto inferior direito */}
      <div style={{
        position: 'fixed', bottom: 16, right: 16,
        background: 'rgba(7,8,14,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        display: 'flex', gap: 0,
        zIndex: 50,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        {[
          {
            id: 'menu', label: 'Menu',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>,
            action: () => { setShowExtras(false); navigate('/vision'); },
            active: false,
          },
          {
            id: 'extras', label: 'Extras',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="4" ry="3"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>,
            action: (e: React.MouseEvent) => { e.stopPropagation(); setShowExtras(p => !p); },
            active: showExtras,
          },
          {
            id: 'os', label: 'OS',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/><polyline points="13 16 15 18 19 14"/></svg>,
            action: () => { setShowExtras(false); navigate('/vision/os'); },
            active: false,
          },
        ].map((btn, i, arr) => (
          <button key={btn.id} onClick={btn.action as any} style={{
            background: btn.active ? 'rgba(59,130,246,0.15)' : 'none',
            border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, padding: '10px 16px 11px',
            borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            color: btn.active ? '#3b82f6' : 'rgba(255,255,255,0.5)',
            transition: 'color .15s, background .15s',
            WebkitTapHighlightColor: 'transparent',
            minWidth: 58,
          }}>
            {btn.icon}
            <span style={{ fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--sans)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{btn.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes popUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
