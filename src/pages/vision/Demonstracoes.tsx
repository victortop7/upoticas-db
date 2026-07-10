import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Encolhe o conteúdo para caber na altura/largura disponível (sem rolar)
function AutoFit({ children, dep }: { children: ReactNode; dep?: unknown }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const calc = () => {
      const wrap = wrapRef.current, inner = innerRef.current;
      if (!wrap || !inner) return;
      const s = Math.min(1, (wrap.clientHeight - 4) / inner.scrollHeight, (wrap.clientWidth - 4) / inner.scrollWidth);
      setScale(s > 0 ? s : 1);
    };
    calc();
    const t = setTimeout(calc, 60);
    window.addEventListener('resize', calc);
    return () => { clearTimeout(t); window.removeEventListener('resize', calc); };
  }, [dep]);
  return (
    <div ref={wrapRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '100%' }}>
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {children}
      </div>
    </div>
  );
}

type Tab = 'superficie' | 'visao' | 'fotossensivel' | 'espessura' | 'simulacao';

// Telas grandes (tablet grande, desktop) usam 'cover' (imagem cheia, como era antes).
// Telas menores (10", celular) usam 'contain' pra não cortar a lente nas laterais.
function useFit(): 'cover' | 'contain' {
  const calc = (): 'cover' | 'contain' => (typeof window !== 'undefined' && window.innerWidth >= 1150 ? 'cover' : 'contain');
  const [fit, setFit] = useState<'cover' | 'contain'>(calc);
  useEffect(() => {
    const onR = () => setFit(calc());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return fit;
}

// Simulação por câmera desativada até ter as lentes com tratamento em fundo transparente.
// Virar para true quando as imagens das lentes estiverem prontas.
const SIMULACAO_ATIVA: boolean = false;

const TRATAMENTOS = [
  { id: 'ar',  label: 'Anti-Reflexo',   cor: '#3b82f6' },
  { id: 'az',  label: 'Luz Azul',       cor: '#8b5cf6' },
  { id: 'ab',  label: 'Anti-Abrasivo',  cor: '#22c55e' },
  { id: 'ae',  label: 'Anti-Estático',  cor: '#ec4899' },
  { id: 'ed',  label: 'Est. Dourada',   cor: '#fbbf24' },
  { id: 'hf',  label: 'Hidrofóbico',    cor: '#06b6d4' },
  { id: 'lr',  label: 'Lipo-Repelente', cor: '#14b8a6' },
  { id: 'uv',  label: 'Proteção UV',    cor: '#ef4444' },
  { id: 'et',  label: 'Estético',       cor: '#e879f9' },
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

// ─── Sequência de lente (Campos / Adição) ──────────────────────────────────────
function SequenciaLente({ tipo, onSimular }: { tipo: 'campos' | 'adicao'; onSimular?: (efeito: string) => void }) {
  const [idx, setIdx] = useState(0); // 0..5
  const fit = useFit();
  const [auto, setAuto] = useState(false);
  const base = tipo === 'campos' ? '/campos' : '/adicao';
  const total = 6;

  const titulo = tipo === 'campos' ? 'Campo de Visão' : 'Zonas de Adição';
  const cor = tipo === 'campos' ? '#22c55e' : '#a855f7';
  const desc = tipo === 'campos'
    ? 'Quanto mais avançada a lente, maior a área de visão nítida e menor a distorção periférica.'
    : 'A lente progressiva tem 3 zonas: longe (topo), intermediário (centro) e perto (embaixo).';

  // animação automática
  useEffect(() => {
    if (!auto) return;
    let dir = 1;
    const t = setInterval(() => {
      setIdx(prev => {
        let next = prev + dir;
        if (next >= total - 1) { next = total - 1; dir = -1; }
        else if (next <= 0) { next = 0; dir = 1; }
        return next;
      });
    }, 700);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0c', minWidth: 0 }}>
      {/* Imagens empilhadas (crossfade) */}
      {Array.from({ length: total }).map((_, i) => (
        <img
          key={i}
          src={`${base}/${String(i + 1).padStart(2, '0')}.jpg`}
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: fit, objectPosition: 'center',
            opacity: i === idx ? 1 : 0, transition: 'opacity .25s ease',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Botão Animar — canto inferior esquerdo */}
      <button onClick={() => setAuto(a => !a)} style={{
        position: 'absolute', bottom: 90, left: 16, zIndex: 11,
        display: 'flex', alignItems: 'center', gap: 8,
        background: auto ? cor : 'rgba(0,0,0,.7)',
        border: `1px solid ${auto ? cor : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 999, padding: '7px 14px 7px 11px', cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}>
        {auto
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><polygon points="6 4 20 12 6 20"/></svg>}
        <span style={{ fontSize: 10.5, color: '#fff', fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {auto ? 'Pausar' : 'Animar'}
        </span>
      </button>
      </div>

      {/* Painel de níveis — ao lado (não sobrepõe a imagem) */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 12,
        background: '#0d0d12', borderLeft: '1px solid #1f1f28',
        width: 158, flexShrink: 0, overflowY: 'auto', zIndex: 10,
      }}>
        {/* Título + descrição no topo do painel */}
        <div style={{ padding: '4px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
          <div style={{ fontSize: 10.5, color: cor, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>{titulo}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>{desc}</div>
        </div>
        {Array.from({ length: total }).map((_, i) => {
          const ativo = i === idx;
          const label = tipo === 'campos' ? `Campo ${i + 1}` : `Adição ${String(i + 1).padStart(2, '0')}`;
          return (
            <button key={i} onClick={() => { setAuto(false); setIdx(i); }} style={{
              background: ativo ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '9px 12px',
              textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background .15s', WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 3, height: 15, borderRadius: 2, flexShrink: 0,
                background: ativo ? cor : 'transparent', transition: 'background .15s',
              }} />
              <span style={{
                fontSize: 12, fontWeight: ativo ? 700 : 400,
                fontFamily: 'var(--sans)', letterSpacing: '.05em', textTransform: 'uppercase',
                color: ativo ? '#ffffff' : 'rgba(255,255,255,0.5)', transition: 'color .15s',
              }}>{label}</span>
            </button>
          );
        })}

        {/* Última opção: Simulação na câmera (campo/adição) */}
        {SIMULACAO_ATIVA && (<>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '6px 14px' }} />
        <button onClick={() => onSimular?.(tipo)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '12px 18px 12px 14px', textAlign: 'left', width: '100%',
          display: 'flex', alignItems: 'center', gap: 10, WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '.07em', textTransform: 'uppercase', color: cor }}>Simulação</span>
        </button>
        </>)}
      </div>
    </div>
  );
}

// ─── Superfície ───────────────────────────────────────────────────────────────
function Superficie({ initialDemo, onSimular }: { initialDemo?: string; onSimular?: (efeito: string) => void }) {
  const fit = useFit();
  const [tipo, setTipo] = useState<'convencional' | 'digital' | 'demonstracao'>(
    initialDemo === 'digital' ? 'digital' : 'convencional'
  );
  const [divX, setDivX] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const FOTOS = {
    convencional: '/lentes%20convencionais%20e%20digitais/convencional.jpg',
    digital:      '/lentes%20convencionais%20e%20digitais/digital.jpg',
  };
  const DEMO_FOTOS = {
    com: '/lentes/digital-balao.jpg',          // digital — nítida
    sem: '/lentes/convencional-balao.jpg',     // convencional — periferia embaçada
  };

  function move(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDivX(Math.min(90, Math.max(10, ((clientX - rect.left) / rect.width) * 100)));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
    <div
      ref={containerRef}
      onMouseDown={() => { if (tipo === 'demonstracao') dragging.current = true; }}
      onMouseMove={e => { if (dragging.current) move(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={() => { if (tipo === 'demonstracao') dragging.current = true; }}
      onTouchMove={e => { if (dragging.current) move(e.touches[0].clientX); }}
      onTouchEnd={() => { dragging.current = false; }}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: tipo === 'demonstracao' ? 'col-resize' : 'default', userSelect: 'none', minWidth: 0 }}
    >
      {tipo !== 'demonstracao' ? (
        /* Foto full-screen — contain para não cortar textos da imagem */
        <img
          key={tipo}
          src={FOTOS[tipo]}
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: fit, objectPosition: 'center', background: '#05060a',
            transition: 'opacity .25s',
          }}
        />
      ) : (
        /* Comparador DIGITAL × CONVENCIONAL */
        <>
          {/* CONVENCIONAL — base (direita) */}
          <img
            src={DEMO_FOTOS.sem}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', pointerEvents: 'none' }}
          />
          {/* DIGITAL — overlay esquerda */}
          <img
            src={DEMO_FOTOS.com}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', clipPath: `inset(0 ${100 - divX}% 0 0)`, pointerEvents: 'none' }}
          />

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
            ✓ DIGITAL
          </div>
          <div style={{ position: 'absolute', bottom: 64, right: 16, fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
            ✗ CONVENCIONAL
          </div>

          {/* Descrição */}
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,.78)', borderRadius: 12, padding: '10px 20px',
            width: 'max-content', maxWidth: 420, textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Digital × Convencional
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
              Lente digital: nitidez em todo o campo visual — sem distorção periférica
            </div>
          </div>
        </>
      )}
      </div>

      {/* Toggle — coluna lateral (não sobrepõe a imagem) */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', background: '#0d0d12', borderLeft: '1px solid #1f1f28', width: 180, flexShrink: 0, padding: '12px 10px', zIndex: 10 }}
      >
        {([
          { id: 'convencional',  label: 'Convencional'  },
          { id: 'digital',       label: 'Digital'       },
          { id: 'demonstracao',  label: 'Demonstração'  },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTipo(t.id)} style={{
            padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%',
            background: tipo === t.id ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.45)',
            color: tipo === t.id ? '#111827' : 'rgba(255,255,255,0.65)',
            fontSize: 12, fontWeight: 700, fontFamily: 'var(--sans)',
            textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap',
            boxShadow: tipo === t.id ? '0 2px 12px rgba(0,0,0,.25)' : 'none',
            transition: 'all .15s',
            WebkitTapHighlightColor: 'transparent',
          }}>{t.label}</button>
        ))}
        {/* Simulação na câmera (lente digital) */}
        {SIMULACAO_ATIVA && (
        <button onClick={() => onSimular?.('digital')} style={{
          marginTop: 4, padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(59,130,246,0.9)', color: '#fff',
          fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)',
          textTransform: 'uppercase', letterSpacing: '.07em',
          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,.25)', WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
          Simulação
        </button>
        )}
      </div>
    </div>
  );
}

// ─── Visão COM/SEM ─────────────────────────────────────────────────────────────
function Visao({ initialDemo, onSimular }: { initialDemo?: string; onSimular?: (efeito: string) => void }) {
  const fit = useFit();
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
      com: '/tratamento%20de%20antirreflexo/com%20anti-reflexo.jpg',
      sem: '/tratamento%20de%20antirreflexo/sem%20anti-reflexo.jpg',
    },
    az: {
      com: '/tratamento%20luz%20azul/COM%20LUZ-AZUL-2.jpg',
      sem: '/tratamento%20luz%20azul/SEM%20LUZ-AZUL.jpg',
    },
    ab: {
      com: '/tratamento%20anti-abrasivo/COM%20ANTI-ABRASIVO.jpg',
      sem: '/tratamento%20anti-abrasivo/SEM%20ANTI-ABRASIVO-2%2C.jpg',
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
    uv: {
      com: '/tratamento%20protecao%20uv/com-uv.jpg',
      sem: '/tratamento%20protecao%20uv/sem-uv.jpg',
    },
    et: {
      com: '/tratamento%20estetico/com-estetica.jpg',
      sem: '/tratamento%20estetico/sem-estetica.jpg',
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
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
        style={{ flex: 1, position: 'relative', cursor: 'col-resize', userSelect: 'none', overflow: 'hidden', minWidth: 0, background: '#05060a' }}
      >
        {/* SEM base */}
        {useRealPhoto ? (
          <img
            src={realPhoto!.sem}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', pointerEvents: 'none' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: SCENE_BG[ambiente], filter: effect.semFilter }} />
        )}

        {/* COM overlay — lado esquerdo */}
        {useRealPhoto ? (
          <img
            src={realPhoto!.com}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', clipPath: `inset(0 ${100 - divX}% 0 0)`, pointerEvents: 'none' }}
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

        {/* Labels + Descrição */}
        <div style={{ position: 'absolute', bottom: 64, left: 16, fontSize: 11, color: '#e2e8f0', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✓ COM {trObj.label.toUpperCase()}
        </div>
        <div style={{ position: 'absolute', bottom: 64, right: 16, fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✗ SEM
        </div>

      </div>

      {/* Painel de tratamentos — ao lado (não sobrepõe a imagem) */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 12,
          background: '#0d0d12', borderLeft: '1px solid #1f1f28',
          width: 172, flexShrink: 0, overflowY: 'auto', zIndex: 10,
        }}
      >
          {/* Descrição do tratamento atual (no topo do painel) */}
          <div style={{ padding: '4px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: trObj.cor, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {trObj.label}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
              {effect.description}
            </div>
          </div>
          {TRATAMENTOS.map(t => (
            <button key={t.id} onClick={() => setTratamento(t.id)} style={{
              background: tratamento === t.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '8px 12px',
              textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background .15s',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 3, height: 15, borderRadius: 2, flexShrink: 0,
                background: tratamento === t.id ? t.cor : 'transparent',
                transition: 'background .15s',
              }} />
              <span style={{
                fontSize: 11.5, fontWeight: tratamento === t.id ? 700 : 400,
                fontFamily: 'var(--sans)', letterSpacing: '.03em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                color: tratamento === t.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                transition: 'color .15s',
              }}>{t.label}</span>
            </button>
          ))}

          {/* Última opção: Simulação na câmera (efeito do tratamento atual) */}
          {SIMULACAO_ATIVA && (<>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '6px 14px' }} />
          <button onClick={() => onSimular?.(tratamento)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '12px 18px 12px 14px', textAlign: 'left', width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={trObj.cor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
            <span style={{
              fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)',
              letterSpacing: '.07em', textTransform: 'uppercase', color: trObj.cor,
            }}>Simular {trObj.label}</span>
          </button>
          </>)}

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
  );
}

// ─── Polarizado — módulo próprio (2 cenas: Peixe / Estrada) ────────────────────
const POL_COR = '#f97316';
const POL_CENAS: Record<'peixe' | 'estrada', { label: string; emoji: string; com: string; sem: string; desc: string }> = {
  peixe: {
    label: 'Peixe', emoji: '🐟',
    com: '/tratamento%20polarizado/agua-com.jpg',
    sem: '/tratamento%20polarizado/agua-sem.jpg',
    desc: 'Sem o polarizado o reflexo da água esconde os peixes. Com ele você enxerga sob a superfície.',
  },
  estrada: {
    label: 'Estrada', emoji: '🛣️',
    com: '/tratamento%20polarizado/estrada-com.jpg',
    sem: '/tratamento%20polarizado/estrada-sem.jpg',
    desc: 'Elimina o ofuscamento do asfalto e dos faróis, deixando a estrada nítida e segura.',
  },
};

function Polarizado({ onSimular }: { onSimular?: (efeito: string) => void }) {
  const fit = useFit();
  const [cena, setCena] = useState<'peixe' | 'estrada'>('peixe');
  const [divX, setDivX] = useState(50);
  const [autoDemo, setAutoDemo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

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

  useEffect(() => { if (!autoDemo) setDivX(50); }, [cena, autoDemo]);

  const c = POL_CENAS[cena];

  function move(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (autoDemo) setAutoDemo(false);
    setDivX(Math.min(90, Math.max(10, ((clientX - rect.left) / rect.width) * 100)));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        onMouseDown={() => { dragging.current = true; }}
        onMouseMove={e => { if (dragging.current) move(e.clientX); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchStart={() => { dragging.current = true; }}
        onTouchMove={e => move(e.touches[0].clientX)}
        onTouchEnd={() => { dragging.current = false; }}
        style={{ flex: 1, position: 'relative', cursor: 'col-resize', userSelect: 'none', overflow: 'hidden', background: '#0a0a0c', minWidth: 0 }}
      >
        {/* SEM base */}
        <img src={c.sem} draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', pointerEvents: 'none' }} />
        {/* COM overlay — lado esquerdo */}
        <img src={c.com} draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', clipPath: `inset(0 ${100 - divX}% 0 0)`, pointerEvents: 'none' }} />

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
        <button
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={() => setAutoDemo(p => !p)}
          style={{
            position: 'absolute', bottom: 100, left: 16, zIndex: 11,
            display: 'flex', alignItems: 'center', gap: 8,
            background: autoDemo ? POL_COR : 'rgba(0,0,0,.7)',
            border: `1px solid ${autoDemo ? POL_COR : 'rgba(255,255,255,0.15)'}`,
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

        {/* Labels */}
        <div style={{ position: 'absolute', bottom: 64, left: 16, fontSize: 11, color: '#e2e8f0', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✓ COM POLARIZADO
        </div>
        <div style={{ position: 'absolute', bottom: 64, right: 16, fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✗ SEM
        </div>

      </div>

      {/* Painel de cenas — ao lado (não sobrepõe a imagem) */}
      <div
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 12,
          background: '#0d0d12', borderLeft: '1px solid #1f1f28',
          width: 158, flexShrink: 0, overflowY: 'auto', zIndex: 10,
        }}
      >
          {/* Descrição da cena atual */}
          <div style={{ padding: '4px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: POL_COR, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Polarizado · {c.label}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
              {c.desc}
            </div>
          </div>
          {(['peixe', 'estrada'] as const).map(id => {
            const ativo = cena === id;
            const o = POL_CENAS[id];
            return (
              <button key={id} onClick={() => setCena(id)} style={{
                background: ativo ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer',
                padding: '12px 18px 12px 14px', textAlign: 'left', width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background .15s', WebkitTapHighlightColor: 'transparent',
              }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, flexShrink: 0, background: ativo ? POL_COR : 'transparent', transition: 'background .15s' }} />
                <span style={{ fontSize: 15 }}>{o.emoji}</span>
                <span style={{
                  fontSize: 14, fontWeight: ativo ? 700 : 400,
                  fontFamily: 'var(--sans)', letterSpacing: '.07em', textTransform: 'uppercase',
                  color: ativo ? '#ffffff' : 'rgba(255,255,255,0.45)', transition: 'color .15s',
                }}>{o.label}</span>
              </button>
            );
          })}

          {/* Simulação na câmera */}
          {SIMULACAO_ATIVA && (<>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '6px 14px' }} />
          <button onClick={() => onSimular?.('pol')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '12px 18px 12px 14px', textAlign: 'left', width: '100%',
            display: 'flex', alignItems: 'center', gap: 10, WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={POL_COR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '.07em', textTransform: 'uppercase', color: POL_COR }}>Simular</span>
          </button>
          </>)}
      </div>
    </div>
  );
}

// ─── Fotossensível — módulo próprio (comparador COM/SEM) ──────────────────────
const FOTO_COR = '#8b5cf6';
const FOTO_PHOTO = { com: '/tratamento-fotossensivel/com.jpg', sem: '/tratamento-fotossensivel/sem.jpg' };

function Fotossensivel({ onSimular }: { onSimular?: (efeito: string) => void }) {
  const fit = useFit();
  const [divX, setDivX] = useState(50);
  const [autoDemo, setAutoDemo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

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

  function move(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (autoDemo) setAutoDemo(false);
    setDivX(Math.min(90, Math.max(10, ((clientX - rect.left) / rect.width) * 100)));
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        onMouseDown={() => { dragging.current = true; }}
        onMouseMove={e => { if (dragging.current) move(e.clientX); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchStart={() => { dragging.current = true; }}
        onTouchMove={e => move(e.touches[0].clientX)}
        onTouchEnd={() => { dragging.current = false; }}
        style={{ flex: 1, position: 'relative', cursor: 'col-resize', userSelect: 'none', overflow: 'hidden', background: '#0a0a0c' }}
      >
        {/* SEM base */}
        <img src={FOTO_PHOTO.sem} draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', pointerEvents: 'none' }} />
        {/* COM overlay — lado esquerdo */}
        <img src={FOTO_PHOTO.com} draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: 'center', clipPath: `inset(0 ${100 - divX}% 0 0)`, pointerEvents: 'none' }} />

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
        <button
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={() => setAutoDemo(p => !p)}
          style={{
            position: 'absolute', bottom: 100, left: 16, zIndex: 11,
            display: 'flex', alignItems: 'center', gap: 8,
            background: autoDemo ? FOTO_COR : 'rgba(0,0,0,.7)',
            border: `1px solid ${autoDemo ? FOTO_COR : 'rgba(255,255,255,0.15)'}`,
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

        {/* Labels */}
        <div style={{ position: 'absolute', bottom: 64, left: 16, fontSize: 11, color: '#e2e8f0', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✓ COM FOTOSSENSÍVEL
        </div>
        <div style={{ position: 'absolute', bottom: 64, right: 16, fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', background: 'rgba(0,0,0,.7)', padding: '4px 10px', borderRadius: 6, letterSpacing: '.08em', pointerEvents: 'none' }}>
          ✗ SEM
        </div>

        {/* Descrição */}
        <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,.78)', borderRadius: 12, padding: '10px 20px',
          width: 'max-content', maxWidth: 420, textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, color: FOTO_COR, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Fotossensível
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            Escurece no sol e clareia em ambientes internos — conforto e proteção UV sem trocar de óculos.
          </div>
        </div>

        {/* Painel lateral direito — Simular */}
        {SIMULACAO_ATIVA && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 48,
            background: 'linear-gradient(to left, rgba(0,0,0,0.45) 55%, transparent)',
            paddingRight: 4, zIndex: 10, minWidth: 150,
          }}
        >
          <button onClick={() => onSimular?.('photo')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '12px 18px 12px 14px', textAlign: 'left', width: '100%',
            display: 'flex', alignItems: 'center', gap: 10, WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={FOTO_COR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)', letterSpacing: '.07em', textTransform: 'uppercase', color: FOTO_COR }}>Simular</span>
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Espessura — simulador interativo (grau × índice, dados reais) ────────────
// Espessura em mm (borda p/ negativo, centro p/ positivo). Lente esférica CR-39, Ø65mm.
const ESP_DATA: Record<'negativo' | 'positivo', Record<number, Record<string, number>>> = {
  negativo: {
    2:  { '1.56': 2.1, '1.60': 1.8, '1.67': 1.4, '1.74': 1.0 },
    4:  { '1.56': 3.3, '1.60': 2.7, '1.67': 2.0, '1.74': 1.3 },
    6:  { '1.56': 4.5, '1.60': 3.6, '1.67': 2.6, '1.74': 1.7 },
    8:  { '1.56': 5.8, '1.60': 4.5, '1.67': 3.2, '1.74': 2.1 },
    10: { '1.56': 7.0, '1.60': 5.4, '1.67': 3.9, '1.74': 2.6 },
  },
  positivo: {
    2:  { '1.56': 3.3,  '1.60': 2.9,  '1.67': 2.3, '1.74': 1.8 },
    4:  { '1.56': 5.6,  '1.60': 4.8,  '1.67': 3.6, '1.74': 2.7 },
    6:  { '1.56': 7.9,  '1.60': 6.6,  '1.67': 4.9, '1.74': 3.6 },
    8:  { '1.56': 10.3, '1.60': 8.5,  '1.67': 6.2, '1.74': 4.4 },
    10: { '1.56': 12.7, '1.60': 10.6, '1.67': 7.6, '1.74': 5.2 },
  },
};
const ESP_GRAUS = [2, 4, 6, 8, 10];
const ESP_INDICES = [
  { v: '1.56', nome: 'Padrão' },
  { v: '1.60', nome: 'Fino' },
  { v: '1.67', nome: 'Muito Fino' },
  { v: '1.74', nome: 'Ultra Fino' },
];

// Perfil da lente (corte lateral) — escala mm→px exagerada p/ visualização
function espLensPath(edgeMm: number, centerMm: number) {
  const s = 9, xL = 40, xR = 360, cx = 200, midY = 95;
  const eT = edgeMm * s, cT = centerMm * s;
  const yET = midY - eT / 2, yCT = midY - cT / 2, yEB = midY + eT / 2, yCB = midY + cT / 2;
  const p1t = 2 * yCT - yET, p1b = 2 * yCB - yEB;
  return `M${xL},${yET} Q${cx},${p1t} ${xR},${yET} L${xR},${yEB} Q${cx},${p1b} ${xL},${yEB} Z`;
}

function Espessura() {
  const [sinal, setSinal] = useState<'negativo' | 'positivo'>('negativo');
  const [grau, setGrau] = useState(6);
  const [indice, setIndice] = useState('1.56');
  const [tabela, setTabela] = useState(false);

  const cor = sinal === 'negativo' ? '#38bdf8' : '#34d399';
  const val = ESP_DATA[sinal][grau][indice];
  const val156 = ESP_DATA[sinal][grau]['1.56'];
  const reducao = Math.round((1 - val / val156) * 100);
  const path = sinal === 'negativo' ? espLensPath(val, 1.2) : espLensPath(1.0, val);
  const pathGhost = sinal === 'negativo' ? espLensPath(val156, 1.2) : espLensPath(1.0, val156);
  const fmt = (n: number) => n.toFixed(1).replace('.', ',');
  const grauLabel = (g: number) => `${sinal === 'negativo' ? '−' : '+'}${g.toFixed(2).replace('.', ',')}`;

  const btn = (ativo: boolean): React.CSSProperties => ({
    fontFamily: 'var(--mono)', fontWeight: 700, cursor: 'pointer',
    borderRadius: 10, transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
    border: `1px solid ${ativo ? cor : 'rgba(255,255,255,0.14)'}`,
    background: ativo ? cor : 'rgba(255,255,255,0.04)',
    color: ativo ? '#0a0a0c' : 'rgba(255,255,255,0.7)',
  });

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse 90% 70% at 50% 0%, #0e1630 0%, #08080c 60%)' }}>
      <AutoFit dep={`${sinal}-${grau}-${indice}`}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: cor, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Índice de Refração</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>Simulador de Espessura</div>
          <div style={{ fontSize: 12.5, color: '#8a93a6', marginTop: 4, lineHeight: 1.5 }}>Quanto maior o índice, mais fina e leve a lente para o mesmo grau.</div>
        </div>

        {/* Toggle sinal */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
          {(['negativo', 'positivo'] as const).map(s => {
            const at = sinal === s;
            const c = s === 'negativo' ? '#38bdf8' : '#34d399';
            return (
              <button key={s} onClick={() => setSinal(s)} style={{
                padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: at ? c : 'transparent', color: at ? '#0a0a0c' : 'rgba(255,255,255,0.6)',
                fontWeight: 700, fontSize: 13, fontFamily: 'var(--sans)', WebkitTapHighlightColor: 'transparent', transition: 'all .15s',
              }}>{s === 'negativo' ? 'Miopia (−)' : 'Hipermetropia (+)'}</button>
            );
          })}
        </div>

        {/* Visualização da lente */}
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 14px 8px' }}>
          <svg viewBox="0 0 400 190" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="espGlass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="45%" stopColor={cor} stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* Ghost 1.56 p/ referência */}
            {indice !== '1.56' && (
              <path d={pathGhost} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="5 4" />
            )}
            {/* Lente atual */}
            <path d={path} fill="url(#espGlass)" stroke={cor} strokeWidth="1.8" style={{ transition: 'all .2s' }} />
            {/* Linha central de referência */}
            <line x1="200" y1="20" x2="200" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 4" />
            {/* Cota da espessura */}
            <text x="200" y="185" textAnchor="middle" fill={cor} fontSize="11" fontFamily="var(--mono)" fontWeight="700">
              {sinal === 'negativo' ? 'espessura na borda' : 'espessura no centro'}
            </text>
          </svg>

          {/* Leitura */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 44, fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--mono)', lineHeight: 1 }}>{fmt(val)}</span>
            <span style={{ fontSize: 18, color: '#8a93a6', fontFamily: 'var(--mono)' }}>mm</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, minHeight: 26 }}>
            {indice === '1.56'
              ? <span style={{ fontSize: 12.5, color: '#8a93a6', fontFamily: 'var(--mono)' }}>Índice padrão (referência)</span>
              : <span style={{ fontSize: 13, color: cor, fontWeight: 700, fontFamily: 'var(--mono)', background: 'rgba(255,255,255,0.06)', padding: '5px 12px', borderRadius: 999 }}>
                  ▼ {reducao}% mais fina que a 1.56
                </span>}
          </div>
        </div>

        {/* Seleção de grau */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 10.5, color: '#6b7385', fontFamily: 'var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Grau</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
            {ESP_GRAUS.map(g => (
              <button key={g} onClick={() => setGrau(g)} style={{ ...btn(grau === g), padding: '11px 0', fontSize: 14 }}>{grauLabel(g)}</button>
            ))}
          </div>
        </div>

        {/* Seleção de índice */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 10.5, color: '#6b7385', fontFamily: 'var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Índice de refração</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            {ESP_INDICES.map(ix => (
              <button key={ix.v} onClick={() => setIndice(ix.v)} style={{ ...btn(indice === ix.v), padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16 }}>{ix.v}</span>
                <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.85 }}>{ix.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
          {[['🪶', 'Mais leve'], ['✨', 'Mais fina'], ['👁️', 'Mais conforto']].map(([e, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '7px 14px' }}>
              <span style={{ fontSize: 14 }}>{e}</span>
              <span style={{ fontSize: 12, color: '#c7cede', fontWeight: 600 }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Tabela completa */}
        <button onClick={() => setTabela(true)} style={{
          background: 'transparent', border: `1px solid ${cor}`, color: cor, borderRadius: 10,
          padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 2, WebkitTapHighlightColor: 'transparent',
        }}>Ver tabela completa</button>

        <div style={{ fontSize: 10.5, color: '#5b6273', textAlign: 'center', maxWidth: 460, lineHeight: 1.5 }}>
          Valores aproximados · lente esférica CR-39 · Ø65mm. Variam conforme fabricante, armação e medidas.
        </div>
      </div>
      </AutoFit>

      {/* Overlay tabela completa (imagem) */}
      {tabela && (
        <div onClick={() => setTabela(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .2s ease',
        }}>
          <img src={`/espessura/${sinal}.jpg`} alt="Tabela de espessura" style={{ maxWidth: '100%', maxHeight: '92%', objectFit: 'contain', borderRadius: 12 }} />
          <button onClick={() => setTabela(false)} style={{
            position: 'absolute', top: 18, right: 18, width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer',
          }}>×</button>
        </div>
      )}
    </div>
  );
}

// ─── Simulação — modo CÂMERA contextual (1 efeito por vez) ─────────────────────
const EFEITO_SIM: Record<string, { label: string; cor: string; filtro: string; campo?: boolean; desc: string }> = {
  ar:  { label: 'Anti-Reflexo',   cor: '#3b82f6', filtro: 'brightness(1.06) contrast(1.05)', desc: 'Sem reflexos — visão limpa e nítida' },
  az:  { label: 'Luz Azul',       cor: '#8b5cf6', filtro: 'sepia(.30) saturate(.85) hue-rotate(-12deg) brightness(1.03)', desc: 'Filtra a luz azul de telas e LEDs' },
  ab:  { label: 'Anti-Abrasivo',  cor: '#22c55e', filtro: 'contrast(1.08) brightness(1.03)', desc: 'Superfície protegida contra riscos' },
  ae:  { label: 'Anti-Estático',  cor: '#ec4899', filtro: 'brightness(1.04) contrast(1.03)', desc: 'Repele poeira e partículas' },
  ed:  { label: 'Est. Dourada',   cor: '#fbbf24', filtro: 'sepia(.5) saturate(1.4) brightness(1.02)', desc: 'Tonalidade dourada premium' },
  hf:  { label: 'Hidrofóbico',    cor: '#06b6d4', filtro: 'brightness(1.05) contrast(1.04)', desc: 'Repele água e gordura' },
  lr:  { label: 'Lipo-Repelente', cor: '#14b8a6', filtro: 'brightness(1.04) contrast(1.05)', desc: 'Sem marcas de dedos e gordura' },
  uv:  { label: 'Proteção UV',    cor: '#ef4444', filtro: 'brightness(.6) contrast(1.12) saturate(.92)', desc: 'Bloqueia os raios UV nocivos' },
  et:  { label: 'Estético',       cor: '#e879f9', filtro: 'brightness(1.05) contrast(1.03)', desc: 'Lente invisível, sem reflexos' },
  pol: { label: 'Polarizado',     cor: '#f97316', filtro: 'contrast(1.15) saturate(1.22) brightness(.94)', desc: 'Sem reflexos e ofuscamento' },
  photo: { label: 'Fotossensível', cor: '#8b5cf6', filtro: 'brightness(.62) contrast(1.08) sepia(.15)', desc: 'Lente escurece no sol automaticamente' },
  digital: { label: 'Lente Digital', cor: '#3b82f6', filtro: '', campo: true, desc: 'Nitidez em todo o campo de visão' },
  campos:  { label: 'Campo de Visão', cor: '#22c55e', filtro: '', campo: true, desc: 'Visão nítida e ampla pela lente' },
  adicao:  { label: 'Adição',         cor: '#a855f7', filtro: '', campo: true, desc: 'Zonas de perto, intermediário e longe' },
};

function Simulacao({ efeito, onVoltar }: { efeito: string; onVoltar?: () => void }) {
  const [com, setCom] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const v1 = useRef<HTMLVideoElement>(null); // câmera crua
  const v2 = useRef<HTMLVideoElement>(null); // lente com efeito

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Câmera não disponível neste dispositivo.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        stream = s;
        if (v1.current) v1.current.srcObject = s;
        if (v2.current) v2.current.srcObject = s;
      })
      .catch(() => setErro('Permita o acesso à câmera para usar a simulação.'));
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const ef = EFEITO_SIM[efeito] ?? EFEITO_SIM.ar;
  const LENTE = 'ellipse(40% 42% at 50% 46%)';
  // campo: fundo embaçado + lente nítida; tratamento: filtro na lente
  const bgFiltro = com && ef.campo ? 'blur(5px) brightness(.92)' : 'none';
  const lenteFiltro = ef.campo ? 'none' : ef.filtro;

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
      {/* Câmera crua (fundo) */}
      <video ref={v1} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: bgFiltro, transition: 'filter .2s' }} />

      {/* Lente com o efeito */}
      {com && (
        <video ref={v2} autoPlay playsInline muted
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            filter: lenteFiltro, clipPath: LENTE, WebkitClipPath: LENTE, transition: 'filter .2s',
          }} />
      )}

      {/* Contorno da lente */}
      <div style={{
        position: 'absolute', top: '4%', left: '10%', right: '10%', bottom: '12%',
        borderRadius: '50%', border: '2px solid rgba(255,255,255,.85)',
        boxShadow: '0 0 40px rgba(0,0,0,.5), inset 0 0 30px rgba(255,255,255,.08)',
        pointerEvents: 'none',
      }} />

      {/* Aviso de câmera */}
      {erro && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,.8)', borderRadius: 14, padding: '18px 24px', maxWidth: 320,
          textAlign: 'center', color: '#e5e7eb', fontSize: 13, lineHeight: 1.5,
        }}>📷 {erro}</div>
      )}

      {/* Voltar — topo esquerdo */}
      <button onClick={() => onVoltar?.()} style={{
        position: 'absolute', top: 16, left: 16, zIndex: 12,
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 999,
        padding: '8px 14px 8px 10px', cursor: 'pointer', color: '#fff',
        fontSize: 12, fontWeight: 700, WebkitTapHighlightColor: 'transparent',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Voltar
      </button>

      {/* Título topo */}
      <div style={{
        position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', borderRadius: 12,
        padding: '8px 18px', textAlign: 'center', pointerEvents: 'none', maxWidth: '60%',
      }}>
        <div style={{ fontSize: 10, color: ef.cor, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Simulação · {ef.label}</div>
        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>{ef.desc}</div>
      </div>

      {/* Toggle COM / SEM (canto inferior esquerdo) */}
      <div style={{ position: 'absolute', bottom: 90, left: 16, display: 'flex', background: 'rgba(0,0,0,.6)', borderRadius: 999, padding: 3, zIndex: 11 }}>
        {([{ v: true, l: 'Com' }, { v: false, l: 'Sem' }] as const).map(o => (
          <button key={String(o.v)} onClick={() => setCom(o.v)} style={{
            padding: '7px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: com === o.v ? ef.cor : 'transparent',
            color: com === o.v ? '#fff' : 'rgba(255,255,255,.6)',
            fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '.06em', textTransform: 'uppercase',
            transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
          }}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Demonstracoes() {
  const [params] = useSearchParams();
  const rawTab = params.get('tab') ?? 'superficie';
  const demo = params.get('demo') ?? '';
  const validTabs: Tab[] = ['superficie', 'visao', 'fotossensivel', 'espessura', 'simulacao'];
  const initialTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : 'superficie';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showExtras, setShowExtras] = useState(false);
  const [simEfeito, setSimEfeito] = useState('ar');
  const [prevTab, setPrevTab] = useState<Tab>('visao');
  const navigate = useNavigate();

  function abrirSim(efeito: string) {
    setPrevTab(tab);
    setSimEfeito(efeito);
    setTab('simulacao');
  }

  const DEMO_ITEMS_NAV = [
    { id: 'ar',         label: 'AR',            tab: 'visao'      },
    { id: 'campos',     label: 'Campos',        tab: 'superficie' },
    { id: 'adicao',     label: 'Adição',        tab: 'superficie' },
    { id: 'digital',    label: 'Digital',       tab: 'superficie' },
    { id: 'photo',      label: 'Photo',         tab: 'fotossensivel' },
    { id: 'pol',        label: 'Polarizado',    tab: 'visao'      },
    { id: 'espessura',  label: 'Espessura',     tab: 'espessura'   },
  ];

  return (
    <div
      style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#050508', overflow: 'hidden' }}
      onClick={() => setShowExtras(false)}
    >
      {tab === 'superficie' && (
        demo === 'campos' || demo === 'adicao'
          ? <SequenciaLente tipo={demo as 'campos' | 'adicao'} onSimular={abrirSim} />
          : <Superficie initialDemo={demo} onSimular={abrirSim} />
      )}
      {tab === 'visao' && (demo === 'pol'
        ? <Polarizado onSimular={abrirSim} />
        : <Visao initialDemo={demo} onSimular={abrirSim} />)}
      {tab === 'fotossensivel' && <Fotossensivel onSimular={abrirSim} />}
      {tab === 'espessura' && <Espessura />}
      {tab === 'simulacao' && <Simulacao efeito={simEfeito} onVoltar={() => setTab(prevTab)} />}

      {/* Extras popup — lista de simulações */}
      {showExtras && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', bottom: 100, right: 16,
            background: 'rgba(8,11,22,0.88)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(120,160,255,0.2)',
            borderRadius: 18,
            padding: '14px 8px 10px',
            zIndex: 100,
            minWidth: 160,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
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

      {/* Bottom nav — canto inferior direito (tab bar iOS) */}
      <div style={{
        position: 'fixed', bottom: 16, right: 16,
        background: 'rgba(28,28,30,0.74)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: 22,
        display: 'flex', gap: 0,
        zIndex: 50,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
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
        ].map(btn => (
          <button key={btn.id} onClick={btn.action as any} style={{
            background: 'none',
            border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '9px 18px 8px',
            color: btn.active ? '#0a84ff' : 'rgba(235,235,245,0.6)',
            transition: 'color .15s',
            WebkitTapHighlightColor: 'transparent',
            minWidth: 62,
          }}>
            {btn.icon}
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '-0.01em' }}>{btn.label}</span>
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
