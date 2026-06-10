import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Tab = 'superficie' | 'visao' | 'simulacao';

const TRATAMENTOS = [
  { id: 'ar',  label: 'Anti-Reflexo',   cor: '#3b82f6' },
  { id: 'az',  label: 'Luz Azul',       cor: '#8b5cf6' },
  { id: 'ab',  label: 'Anti-Abrasivo',  cor: '#22c55e' },
  { id: 'ae',  label: 'Anti-Estático',  cor: '#ec4899' },
  { id: 'ed',  label: 'Est. Dourada',   cor: '#fbbf24' },
  { id: 'hf',  label: 'Hidrofóbico',    cor: '#06b6d4' },
  { id: 'lr',  label: 'Lipo-Repelente', cor: '#14b8a6' },
  { id: 'uv',  label: 'Proteção UV',    cor: '#ef4444' },
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
  ae: {
    noite:   { semFilter: 'brightness(.8) blur(.3px) contrast(.9)', comFilter: 'brightness(1.02)', description: 'Poeira e partículas repelidas — visão nítida à noite' },
    chuva:   { semFilter: 'brightness(.78) blur(.25px)', comFilter: 'brightness(.92)', description: 'Estática eliminada — sem acúmulo em dias úmidos' },
    sol:     { semFilter: 'brightness(.86) contrast(.93) blur(.22px)', comFilter: 'brightness(1.0)', description: 'Superfície anti-estática limpa — sem poeira' },
    tela:    { semFilter: 'brightness(.78) blur(.35px)', comFilter: 'brightness(1.02)', description: 'Campos elétricos repelidos — lente sempre limpa' },
    leitura: { semFilter: 'brightness(.83) blur(.28px) contrast(.9)', comFilter: 'brightness(1.04)', description: 'Zero partículas na lente — foco total na leitura' },
  },
  ed: {
    noite:   { semFilter: 'brightness(.88) saturate(.85)', comFilter: 'brightness(.96) sepia(.22) saturate(1.18) hue-rotate(-8deg)', description: 'Estética dourada elegante — identidade visual única' },
    chuva:   { semFilter: 'brightness(.74) saturate(.8)', comFilter: 'brightness(.88) sepia(.2) saturate(1.12)', description: 'Tonalidade dourada vibrante mesmo em dias nublados' },
    sol:     { semFilter: 'brightness(.9) saturate(.88)', comFilter: 'brightness(1.0) sepia(.28) saturate(1.22) hue-rotate(-10deg)', description: 'Brilho dourado ao sol — estilo e proteção' },
    tela:    { semFilter: 'brightness(.86) saturate(.82)', comFilter: 'brightness(.98) sepia(.18) saturate(1.08)', description: 'Toque dourado premium na sua visão digital' },
    leitura: { semFilter: 'brightness(.9) saturate(.86)', comFilter: 'brightness(1.02) sepia(.24) saturate(1.15) hue-rotate(-8deg)', description: 'Leitura com estilo — tonalidade quente e aconchegante' },
  },
  lr: {
    noite:   { semFilter: 'brightness(.74) blur(.4px) contrast(.88)', comFilter: 'brightness(1.0)', description: 'Gorduras e óleos repelidos — visão nítida à noite' },
    chuva:   { semFilter: 'brightness(.7) blur(.5px)', comFilter: 'brightness(.92)', description: 'Sem marcas de chuva e gordura — lente sempre limpa' },
    sol:     { semFilter: 'brightness(.84) blur(.35px) contrast(.9)', comFilter: 'brightness(1.0)', description: 'Protetor solar e óleos escorregam da lente' },
    tela:    { semFilter: 'brightness(.76) blur(.45px)', comFilter: 'brightness(1.02)', description: 'Digitais e gordura eliminadas — tela perfeitamente visível' },
    leitura: { semFilter: 'brightness(.8) blur(.38px) contrast(.88)', comFilter: 'brightness(1.04)', description: 'Zero marcas de dedos — leitura sem distração' },
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

  const FOTOS = {
    convencional: '/lentes%20convencionais%20e%20digitais/convencional.png',
    digital:      '/lentes%20convencionais%20e%20digitais/digital.png',
  };

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Foto full-screen */}
      <img
        key={tipo}
        src={FOTOS[tipo]}
        draggable={false}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          transition: 'opacity .25s',
        }}
      />

      {/* Toggle — topo direito */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        {(['convencional', 'digital'] as const).map(t => (
          <button key={t} onClick={() => setTipo(t)} style={{
            padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tipo === t ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.45)',
            color: tipo === t ? '#111827' : 'rgba(255,255,255,0.65)',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)',
            textTransform: 'uppercase', letterSpacing: '.07em',
            boxShadow: tipo === t ? '0 2px 12px rgba(0,0,0,.25)' : 'none',
            transition: 'all .15s',
            WebkitTapHighlightColor: 'transparent',
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Demonstração Proteção UV ──────────────────────────────────────────────────
function UVDemo() {
  const [protegido, setProtegido] = useState(true);
  const [intensidade, setIntensidade] = useState(75);

  const uvIndex = Math.round((intensidade / 100) * 11);
  const uvNivel =
    uvIndex <= 2 ? { label: 'Baixo', cor: '#22c55e' } :
    uvIndex <= 5 ? { label: 'Moderado', cor: '#f59e0b' } :
    uvIndex <= 7 ? { label: 'Alto', cor: '#f97316' } :
    uvIndex <= 10 ? { label: 'Muito Alto', cor: '#ef4444' } :
    { label: 'Extremo', cor: '#a855f7' };

  const numRaios = 7;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% -10%, #1a1530 0%, #0d0a18 45%, #060409 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Cena — sol → raios → lente → olho */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Sol realista com corona e raios */}
        <div style={{
          position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200, pointerEvents: 'none',
        }}>
          {/* raios de sol girando */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(253,224,71,.18) 8deg, transparent 16deg, transparent 30deg, rgba(253,224,71,.14) 38deg, transparent 46deg, transparent 60deg, rgba(253,224,71,.18) 68deg, transparent 76deg, transparent 90deg, rgba(253,224,71,.14) 98deg, transparent 106deg, transparent 120deg, rgba(253,224,71,.18) 128deg, transparent 136deg, transparent 150deg, rgba(253,224,71,.14) 158deg, transparent 166deg, transparent 180deg, rgba(253,224,71,.18) 188deg, transparent 196deg, transparent 210deg, rgba(253,224,71,.14) 218deg, transparent 226deg, transparent 240deg, rgba(253,224,71,.18) 248deg, transparent 256deg, transparent 270deg, rgba(253,224,71,.14) 278deg, transparent 286deg, transparent 300deg, rgba(253,224,71,.18) 308deg, transparent 316deg, transparent 330deg, rgba(253,224,71,.14) 338deg, transparent 346deg, transparent 360deg)',
            borderRadius: '50%', filter: 'blur(2px)',
            animation: 'sunrays 28s linear infinite',
          }} />
          {/* corona externa */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 130, height: 130, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(253,224,71,.5) 0%, rgba(245,158,11,.25) 40%, transparent 70%)',
            filter: 'blur(6px)', animation: 'uvpulse 3s ease-in-out infinite',
          }} />
          {/* disco solar */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 76, height: 76, borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #ffffff 0%, #fff7d6 22%, #fde047 50%, #f59e0b 82%, #ea7c0b 100%)',
            boxShadow: '0 0 50px 12px rgba(253,224,71,.6), inset -6px -6px 18px rgba(234,124,11,.5)',
          }} />
        </div>

        {/* Raios UV com glow */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <filter id="uvglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.9" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {Array.from({ length: numRaios }).map((_, i) => {
            const x = 22 + i * (56 / (numRaios - 1));
            const visivel = i < Math.ceil((intensidade / 100) * numRaios);
            if (!visivel) return null;
            return (
              <line
                key={i}
                x1="50" y1="13"
                x2={x} y2={protegido ? 45 : 80}
                stroke={uvNivel.cor}
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeDasharray="2 5"
                opacity={protegido ? 0.9 : 0.78}
                filter="url(#uvglow)"
                style={{ animation: `uvflow ${0.7 + i * 0.06}s linear infinite` }}
              />
            );
          })}
        </svg>

        {/* Lente de vidro realista */}
        <div style={{
          position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 220, height: 76,
        }}>
          <svg viewBox="0 0 220 76" width="220" height="76" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="glassbody" cx="42%" cy="32%" r="75%">
                <stop offset="0%" stopColor={protegido ? 'rgba(216,180,254,.55)' : 'rgba(255,255,255,.22)'} />
                <stop offset="55%" stopColor={protegido ? 'rgba(168,85,247,.32)' : 'rgba(220,235,255,.1)'} />
                <stop offset="100%" stopColor={protegido ? 'rgba(124,58,237,.4)' : 'rgba(200,220,255,.06)'} />
              </radialGradient>
              <linearGradient id="glassrim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={protegido ? '#d8b4fe' : 'rgba(255,255,255,.55)'} />
                <stop offset="100%" stopColor={protegido ? '#7c3aed' : 'rgba(255,255,255,.18)'} />
              </linearGradient>
            </defs>
            {/* corpo do vidro */}
            <ellipse cx="110" cy="38" rx="106" ry="33" fill="url(#glassbody)"
              stroke="url(#glassrim)" strokeWidth={protegido ? 2.2 : 1.4}
              style={{ transition: 'all .3s' }} />
            {/* brilho especular superior */}
            <path d="M 30 22 Q 110 8 190 22 Q 150 26 110 26 Q 70 26 30 22 Z"
              fill="rgba(255,255,255,.4)" opacity="0.7" />
            {/* reflexo curvo */}
            <ellipse cx="74" cy="30" rx="34" ry="9" fill="rgba(255,255,255,.22)"
              transform="rotate(-18 74 30)" />
            {/* halo de proteção pulsante */}
            {protegido && (
              <ellipse cx="110" cy="38" rx="106" ry="33" fill="none" stroke="#c084fc" strokeWidth="1.5"
                opacity="0.6" filter="url(#uvglow)"
                style={{ animation: 'uvpulse 1.8s ease-in-out infinite' }} />
            )}
          </svg>
          {/* Escudo de bloqueio */}
          {protegido && (
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700, color: '#e9d5ff',
              background: 'rgba(88,28,135,.65)', border: '1px solid rgba(192,132,252,.5)',
              padding: '3px 10px', borderRadius: 999,
              letterSpacing: '.08em', whiteSpace: 'nowrap',
            }}>🛡️ UV BLOQUEADO</div>
          )}
        </div>

        {/* Olho humano realista (SVG) */}
        <div style={{
          position: 'absolute', top: '79%', left: '50%', transform: 'translate(-50%,-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <svg width="116" height="68" viewBox="0 0 116 68" style={{
            filter: protegido ? 'drop-shadow(0 0 8px rgba(34,197,94,.35))' : 'drop-shadow(0 0 14px rgba(239,68,68,.7))',
            transition: 'filter .3s',
          }}>
            <defs>
              <radialGradient id="iris" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor={protegido ? '#6ea8d8' : '#b45c4a'} />
                <stop offset="55%" stopColor={protegido ? '#3b6e9c' : '#8a3a2c'} />
                <stop offset="100%" stopColor={protegido ? '#22425f' : '#5c241a'} />
              </radialGradient>
              <clipPath id="eyeclip">
                <path d="M 8 34 Q 58 2 108 34 Q 58 66 8 34 Z" />
              </clipPath>
            </defs>
            {/* esclera (branco do olho) */}
            <path d="M 8 34 Q 58 2 108 34 Q 58 66 8 34 Z"
              fill={protegido ? '#f4f6f8' : '#fbe4e0'} stroke="#cbd5e1" strokeWidth="0.6" />
            {/* veias quando sem proteção */}
            {!protegido && (
              <g clipPath="url(#eyeclip)" stroke="#e57373" strokeWidth="0.7" opacity="0.7" fill="none">
                <path d="M 12 32 Q 24 30 34 36" />
                <path d="M 14 40 Q 26 42 36 38" />
                <path d="M 104 30 Q 92 30 82 37" />
                <path d="M 102 40 Q 90 42 80 38" />
              </g>
            )}
            {/* íris */}
            <g clipPath="url(#eyeclip)">
              <circle cx="58" cy="34" r="22" fill="url(#iris)" />
              {/* fibras da íris */}
              <g stroke={protegido ? '#bcd6ec' : '#d89a8c'} strokeWidth="0.5" opacity="0.5">
                {Array.from({ length: 16 }).map((_, i) => {
                  const a = (i / 16) * Math.PI * 2;
                  return <line key={i} x1={58 + Math.cos(a) * 8} y1={34 + Math.sin(a) * 8}
                    x2={58 + Math.cos(a) * 21} y2={34 + Math.sin(a) * 21} />;
                })}
              </g>
              {/* pupila */}
              <circle cx="58" cy="34" r={protegido ? 9 : 7} fill="#0a0a0c" style={{ transition: 'r .3s' }} />
              {/* reflexo de luz */}
              <circle cx="52" cy="28" r="3.2" fill="rgba(255,255,255,.9)" />
              <circle cx="63" cy="38" r="1.6" fill="rgba(255,255,255,.6)" />
            </g>
            {/* contorno pálpebra */}
            <path d="M 8 34 Q 58 2 108 34" fill="none" stroke={protegido ? '#94a3b8' : '#c2766a'} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 8 34 Q 58 66 108 34" fill="none" stroke={protegido ? '#b8c2cf' : '#d89488'} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div style={{
            fontSize: 9.5, fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '.06em',
            color: protegido ? '#22c55e' : '#ef4444',
            background: protegido ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.15)',
            border: `1px solid ${protegido ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.4)'}`,
            padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
          }}>{protegido ? '✓ RETINA PROTEGIDA' : '✗ RADIAÇÃO NA RETINA'}</div>
        </div>

        {/* Toggle COM/SEM — topo esquerdo */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            { v: true,  label: 'Com Proteção' },
            { v: false, label: 'Sem Proteção' },
          ] as const).map(o => (
            <button key={String(o.v)} onClick={() => setProtegido(o.v)} style={{
              padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: protegido === o.v ? (o.v ? '#a855f7' : '#ef4444') : 'rgba(0,0,0,.4)',
              color: protegido === o.v ? '#fff' : 'rgba(255,255,255,.55)',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)',
              textTransform: 'uppercase', letterSpacing: '.06em', transition: 'all .15s',
              WebkitTapHighlightColor: 'transparent',
            }}>{o.label}</button>
          ))}
        </div>

        {/* Cards UVA / UVB — topo, ao lado do sol */}
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', marginTop: 96, display: 'flex', gap: 8 }}>
          {['UVA', 'UVB'].map(tipo => (
            <div key={tipo} style={{
              background: 'rgba(7,8,14,.7)', border: `1px solid ${protegido ? 'rgba(168,85,247,.4)' : 'rgba(239,68,68,.35)'}`,
              borderRadius: 10, padding: '8px 12px', textAlign: 'center', minWidth: 72,
            }}>
              <div style={{ fontSize: 9, color: '#6b7280', fontFamily: 'var(--mono)', letterSpacing: '.1em', marginBottom: 2 }}>{tipo}</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: protegido ? '#c084fc' : '#ef4444' }}>
                {protegido ? '100%' : '0%'}
              </div>
              <div style={{ fontSize: 8, color: '#6b7280', fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>
                {protegido ? 'bloqueado' : 'passando'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel inferior — índice UV + slider */}
      <div style={{ padding: '14px 20px 18px', borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(7,8,14,.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, maxWidth: 520, margin: '0 auto 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: uvNivel.cor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, fontFamily: 'var(--mono)', color: '#fff',
            }}>{uvIndex}</div>
            <div>
              <div style={{ fontSize: 9, color: '#6b7280', fontFamily: 'var(--mono)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Índice UV</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: uvNivel.cor, fontFamily: 'var(--sans)' }}>{uvNivel.label}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--sans)', maxWidth: 240, textAlign: 'right', lineHeight: 1.4 }}>
            {protegido
              ? 'Lente bloqueia 100% dos raios UVA e UVB — proteção total da retina e prevenção de catarata.'
              : 'Sem proteção, a radiação UV atinge diretamente a retina, acelerando o envelhecimento ocular.'}
          </div>
        </div>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>⛅</span>
            <span style={{ fontSize: 10, color: '#6b7280', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Intensidade Solar</span>
            <span style={{ fontSize: 16 }}>☀️</span>
          </div>
          <div style={{ position: 'relative', height: 8, background: '#1e2030', borderRadius: 4 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${intensidade}%`, borderRadius: 4, background: 'linear-gradient(to right,#22c55e,#f59e0b 55%,#ef4444 80%,#a855f7)' }} />
            <input type="range" min={0} max={100} value={intensidade} onChange={e => setIntensidade(Number(e.target.value))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes uvflow { from { stroke-dashoffset: 14; } to { stroke-dashoffset: 0; } }
        @keyframes uvpulse { 0%,100% { opacity: .35; } 50% { opacity: .85; } }
        @keyframes sunrays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
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
  const [autoDemo, setAutoDemo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Demonstração automática — divisor desliza sozinho de um lado ao outro
  useEffect(() => {
    if (!autoDemo) return;
    let frame: number;
    let dir = -1;
    const animate = () => {
      setDivX(prev => {
        let next = prev + dir * 0.7;
        if (next <= 12) { next = 12; dir = 1; }
        if (next >= 88) { next = 88; dir = -1; }
        return next;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [autoDemo]);

  // Ao trocar de tratamento, reinicia a demo no centro
  useEffect(() => { if (!autoDemo) setDivX(50); }, [tratamento, autoDemo]);

  const trObj = TRATAMENTOS.find(t => t.id === tratamento)!;
  const effect = EFFECTS[tratamento]?.[ambiente] ?? EFFECTS.ar.noite;
  const semSvg = getSemSvg(tratamento, ambiente);
  const REAL_PHOTOS: Record<string, { com: string; sem: string }> = {
    ar: {
      com: '/tratamento%20de%20antirreflexo/com%20anti-reflexo.png',
      sem: '/tratamento%20de%20antirreflexo/sem%20anti-reflexo.png',
    },
    az: {
      com: '/tratamento%20luz%20azul/COM%20LUZ-AZUL-2.png',
      sem: '/tratamento%20luz%20azul/SEM%20LUZ-AZUL.png',
    },
    ab: {
      com: '/tratamento%20anti-abrasivo/COM%20ANTI-ABRASIVO.png',
      sem: '/tratamento%20anti-abrasivo/SEM%20ANTI-ABRASIVO-2%2C.png',
    },
    ae: {
      com: '/tratamento%20anti-estatico/COM%20ANTI-ESTATICO.jpg',
      sem: '/tratamento%20anti-estatico/SEM%20ANTI-ESTATICO.jpg',
    },
    ed: {
      com: '/tratamento%20estico%20dourado/COM%20ESTETICA-LUZ%20AZUL.jpg',
      sem: '/tratamento%20estico%20dourado/SEM%20ESTETICA-DOURADO.jpg',
    },
    hf: {
      com: '/tratamento%20hidro-fobico/COM%20HIDRO-FOBICO.jpg',
      sem: '/tratamento%20hidro-fobico/SEM%20HIDRO-FOBICO-2.jpg',
    },
    lr: {
      com: '/tratamento%20lipo-repelente/COM%20LIPO-REPELENTE.jpg',
      sem: '/tratamento%20lipo-repelente/SEM%20LIPO-REPELENTE-2.jpg',
    },
  };
  const realPhoto = REAL_PHOTOS[tratamento] ?? null;
  const useRealPhoto = !!realPhoto;

  function move(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (autoDemo) setAutoDemo(false);
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
        style={{ flex: 1, position: 'relative', cursor: tratamento === 'uv' ? 'default' : 'col-resize', userSelect: 'none', overflow: 'hidden' }}
      >
        {/* Demonstração dedicada Proteção UV */}
        {tratamento === 'uv' && <UVDemo />}

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

        {/* Botão demonstração automática */}
        {tratamento !== 'uv' && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={() => setAutoDemo(p => !p)}
          style={{
            position: 'absolute', bottom: 100, left: 16, zIndex: 11,
            display: 'flex', alignItems: 'center', gap: 8,
            background: autoDemo ? trObj.cor : 'rgba(0,0,0,.7)',
            border: `1px solid ${autoDemo ? trObj.cor : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 999, padding: '7px 14px 7px 11px', cursor: 'pointer',
            transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {autoDemo ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><polygon points="6 4 20 12 6 20"/></svg>
          )}
          <span style={{ fontSize: 10.5, color: '#fff', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {autoDemo ? 'Pausar' : 'Demonstrar'}
          </span>
        </button>
        )}

        {/* Labels + Descrição (escondidos na demo UV) */}
        {tratamento !== 'uv' && (
        <>
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
        </>
        )}
        {/* Painel de tratamentos — overlay vertical direito */}
        <div
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 48,
            background: 'linear-gradient(to left, rgba(0,0,0,0.45) 55%, transparent)',
            paddingRight: 4, zIndex: 10, minWidth: 160,
          }}
        >
          {TRATAMENTOS.map(t => (
            <button key={t.id} onClick={() => setTratamento(t.id)} style={{
              background: tratamento === t.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '12px 18px 12px 14px',
              textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background .15s',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 3, height: 18, borderRadius: 2, flexShrink: 0,
                background: tratamento === t.id ? t.cor : 'transparent',
                transition: 'background .15s',
              }} />
              <span style={{
                fontSize: 14, fontWeight: tratamento === t.id ? 700 : 400,
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
  const lensLabel = valor < 10 ? 'INCOLOR' : valor < 40 ? `${Math.round(pct * 100)}% ATIVA` : `${Math.round(pct * 100)}% ESCURA`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 32px', gap: 24 }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{
          width: 280, height: 186, borderRadius: 18, overflow: 'hidden', position: 'relative',
          background: SCENE_BG.sol, border: '1px solid #1e2030',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `rgba(${darkR},${darkG},${darkB},${darkA})`,
            transition: 'background .35s ease',
          }} />
          <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 26 }}>{uvIcon}</div>
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,.65)', borderRadius: 8, padding: '4px 12px',
            fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700,
            color: pct < .1 ? '#9ca3af' : `rgba(${220 - Math.round(pct*80)},${180 - Math.round(pct*60)},${60 - Math.round(pct*40)},1)`,
            whiteSpace: 'nowrap',
          }}>{lensLabel}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
          <div>
            <div style={{ fontSize: 10, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>Intensidade UV</div>
            <div style={{ height: 7, background: '#1e2030', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${valor}%`, background: `linear-gradient(to right, #1e3a5f, #3b82f6, #f59e0b, #ef4444)`, transition: 'width 0s' }} />
            </div>
          </div>
          <div style={{ background: '#07080e', borderRadius: 12, padding: '12px 14px', border: '1px solid #1e2030' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', border: '2px solid #2a2d3e', flexShrink: 0,
                background: pct < .05 ? 'rgba(200,220,255,.15)' : `rgba(${darkR*2},${darkG*2},${darkB*2},${Math.min(darkA+.1, 1)})`,
                transition: 'background .35s',
              }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5', fontFamily: 'var(--mono)' }}>{uvIcon} {uvLevel}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {pct < .05 ? 'Lente transparente' : `Filtrando ${Math.round(pct * 100)}% da luz`}
                </div>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.6, background: '#07080e', borderRadius: 10, padding: '10px 14px', border: '1px solid #1e2030' }}>
            Escurece automaticamente ao detectar raios UV. Volta ao estado claro em ambientes fechados.
          </p>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Intensidade da Luz Solar / UV</span>
          <span style={{ fontSize: 20 }}>☀️</span>
        </div>
        <div style={{ position: 'relative', height: 10, background: '#1e2030', borderRadius: 5 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${valor}%`, borderRadius: 5, background: `linear-gradient(to right, #1e3a5f, #3b82f6 40%, #f59e0b 70%, #ef4444)` }} />
          <input type="range" min={0} max={100} value={valor} onChange={e => setValor(Number(e.target.value))}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Polarizado ────────────────────────────────────────────────────────────────
function Polarizado() {
  const [glare, setGlare] = useState(70);
  const pct = glare / 100;

  const glareLabel = glare < 20 ? 'Pouco reflexo' : glare < 50 ? 'Reflexo moderado' : glare < 80 ? 'Reflexo intenso' : 'Reflexo máximo';
  const glareIcon = glare < 20 ? '😌' : glare < 50 ? '😐' : glare < 80 ? '😣' : '🥴';

  const semFilter = `brightness(${.65 + pct * .25}) contrast(${1.1 + pct * .25}) saturate(${.7 - pct * .2})`;
  const comFilter = `brightness(${.96 + pct * .04}) contrast(1.08) saturate(${1.1 + pct * .1})`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 32px', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* SEM polarizado */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 220, height: 146, borderRadius: 14, overflow: 'hidden', position: 'relative',
            background: SCENE_BG.sol, border: '1px solid #1e2030',
            filter: semFilter, transition: 'filter .2s',
          }}>
            <GlareRings />
          </div>
          <span style={{ fontSize: 10, color: '#ef4444', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '.08em' }}>✗ SEM POLARIZADO</span>
        </div>

        {/* COM polarizado */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 220, height: 146, borderRadius: 14, overflow: 'hidden', position: 'relative',
            background: SCENE_BG.sol, border: '1px solid #1e2030',
            filter: comFilter, transition: 'filter .2s',
          }} />
          <span style={{ fontSize: 10, color: '#22c55e', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '.08em' }}>✓ COM POLARIZADO</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 190 }}>
          <div style={{ background: '#07080e', borderRadius: 12, padding: '12px 14px', border: '1px solid #1e2030' }}>
            <div style={{ fontSize: 10, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Nível de reflexo</div>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{glareIcon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5', fontFamily: 'var(--mono)' }}>{glareLabel}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>Polarizado elimina {Math.round(pct * 98)}% dos reflexos</div>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.6, background: '#07080e', borderRadius: 10, padding: '10px 14px', border: '1px solid #1e2030' }}>
            Filtro que bloqueia reflexos horizontais de superfícies como asfalto, água e vidro.
          </p>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>😌</span>
          <span style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Intensidade dos Reflexos</span>
          <span style={{ fontSize: 20 }}>🥴</span>
        </div>
        <div style={{ position: 'relative', height: 10, background: '#1e2030', borderRadius: 5 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${glare}%`, borderRadius: 5, background: `linear-gradient(to right, #1e3a5f, #f59e0b 60%, #ef4444)` }} />
          <input type="range" min={0} max={100} value={glare} onChange={e => setGlare(Number(e.target.value))}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Simulação (Fotossensível + Polarizado) ───────────────────────────────────
function Simulacao() {
  const [tipo, setTipo] = useState<'fotossensivel' | 'polarizado'>('fotossensivel');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toggle topo */}
      <div style={{ display: 'flex', gap: 0, background: '#07080e', borderRadius: 0, padding: '10px 16px', borderBottom: '1px solid #1e2030' }}>
        {([
          { id: 'fotossensivel', label: 'Fotossensível' },
          { id: 'polarizado',    label: 'Polarizado' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTipo(t.id)} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tipo === t.id ? '#1e2030' : 'transparent',
            color: tipo === t.id ? '#f0f0f5' : '#4b5563',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)',
            textTransform: 'uppercase', letterSpacing: '.06em', transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>
      {tipo === 'fotossensivel' ? <Fotossensivel /> : <Polarizado />}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Demonstracoes() {
  const [params] = useSearchParams();
  const rawTab = params.get('tab') ?? 'superficie';
  const demo = params.get('demo') ?? '';
  const validTabs: Tab[] = ['superficie', 'visao', 'simulacao'];
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : 'superficie';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showExtras, setShowExtras] = useState(false);
  const navigate = useNavigate();

  const DEMO_ITEMS_NAV = [
    { id: 'digital',    label: 'Digital',       tab: 'superficie' },
    { id: 'campos',     label: 'Campos',        tab: 'superficie' },
    { id: 'adicao',     label: 'Adição',        tab: 'superficie' },
    { id: 'photo',      label: 'Fotossensível', tab: 'simulacao'  },
    { id: 'polarizado', label: 'Polarizado',    tab: 'simulacao'  },
    { id: 'ar',         label: 'AR',            tab: 'visao'      },
    { id: 'espessura',  label: 'Espessura',     tab: 'superficie' },
  ];

  return (
    <div
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#050508', overflow: 'hidden' }}
      onClick={() => setShowExtras(false)}
    >
      {tab === 'superficie' && <Superficie initialDemo={demo} />}
      {tab === 'visao' && <Visao initialDemo={demo} />}
      {tab === 'simulacao' && <Simulacao />}

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

      {/* Tab bar — SUPERFÍCIE | VISÃO | SIMULAÇÃO */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(7,8,14,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        display: 'flex', gap: 0,
        zIndex: 50,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        {([
          { id: 'superficie', label: 'Superfície' },
          { id: 'visao',      label: 'Visão'      },
          { id: 'simulacao',  label: 'Simulação'  },
        ] as const).map((t, i) => (
          <button key={t.id} onClick={() => { setShowExtras(false); setTab(t.id); }} style={{
            background: tab === t.id ? 'rgba(59,130,246,0.15)' : 'none',
            border: 'none', cursor: 'pointer',
            padding: '10px 20px 11px',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            color: tab === t.id ? '#3b82f6' : 'rgba(255,255,255,0.5)',
            transition: 'color .15s, background .15s',
            WebkitTapHighlightColor: 'transparent',
            minWidth: 80,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '.07em', textTransform: 'uppercase' }}>{t.label}</span>
          </button>
        ))}
      </div>

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
