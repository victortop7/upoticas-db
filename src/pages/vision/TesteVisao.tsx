import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Paleta / estilo ────────────────────────────────────────────────────────
const AZUL = '#1e3a8a';          // título
const AZUL_BTN = '#3b5bdb';      // botão continuar
const LARANJA = '#c7791b';       // avisos
const VERDE = '#16a34a';
const AMBAR = '#d97706';
const VERMELHO = '#dc2626';

// ─── Tabela Snellen (indicativa) ──────────────────────────────────────────────
const SNELLEN = [
  { ac: '20/200', txt: 'E',              size: 108 },
  { ac: '20/100', txt: 'F P',            size: 74 },
  { ac: '20/70',  txt: 'T O Z',          size: 54 },
  { ac: '20/50',  txt: 'L P E D',        size: 41 },
  { ac: '20/40',  txt: 'P E C F D',      size: 32 },
  { ac: '20/30',  txt: 'E D F C Z P',    size: 25 },
  { ac: '20/25',  txt: 'F E L O P Z D',  size: 20 },
  { ac: '20/20',  txt: 'D E F P O T E C', size: 16 },
];

function denom(ac: string) { return parseInt(ac.split('/')[1], 10); }
function statusAcuidade(ac: string | null): { txt: string; cor: string } {
  if (!ac) return { txt: '—', cor: '#94a3b8' };
  const d = denom(ac);
  if (d <= 25) return { txt: 'Ótima', cor: VERDE };
  if (d <= 40) return { txt: 'Boa', cor: AMBAR };
  return { txt: 'Requer avaliação', cor: VERMELHO };
}

// ─── Placa estilo Ishihara (gerada em canvas) ─────────────────────────────────
const FIG_PAL = ['#6bb14a', '#83c25a', '#9ccb6b', '#5aa63f', '#7cbf52', '#8fc765'];
const BG_PAL = ['#e59a6b', '#d98a58', '#e8ac7f', '#cf7c50', '#e0a074', '#eab892', '#d98f63'];

function PlacaIshihara({ numero, size = 260 }: { numero: number; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const S = size;
    cv.width = S; cv.height = S;

    // máscara com o dígito
    const mc = document.createElement('canvas');
    mc.width = S; mc.height = S;
    const mctx = mc.getContext('2d')!;
    mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, S, S);
    mctx.fillStyle = '#000';
    mctx.font = `bold ${Math.round(S * 0.62)}px Arial, sans-serif`;
    mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
    mctx.fillText(String(numero), S / 2, S / 2 + S * 0.02);
    const mask = mctx.getImageData(0, 0, S, S).data;

    // fundo do disco
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#f3e2d0';
    ctx.fillRect(0, 0, S, S);

    const cx = S / 2, cy = S / 2, R = S / 2 - 4;
    for (let i = 0; i < 2200; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random()) * R;
      const x = cx + rad * Math.cos(ang);
      const y = cy + rad * Math.sin(ang);
      const dr = 2.4 + Math.random() * 5;
      const idx = (Math.floor(y) * S + Math.floor(x)) * 4;
      const dentro = mask[idx] < 128; // pixel escuro = dentro do número
      const pal = dentro ? FIG_PAL : BG_PAL;
      ctx.fillStyle = pal[(Math.random() * pal.length) | 0];
      ctx.beginPath();
      ctx.arc(x, y, dr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, [numero, size]);

  return <canvas ref={ref} style={{ width: size, height: size, borderRadius: '50%', maxWidth: '80vw' }} />;
}

// ─── Componentes de UI ────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '30px 34px',
  boxShadow: '0 16px 50px rgba(20,40,90,0.14)', border: '1px solid rgba(30,58,138,0.08)',
  width: '100%', maxWidth: 560,
};

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontSize: 34, fontWeight: 800, color: AZUL, textAlign: 'center',
      letterSpacing: '0.01em', margin: '0 0 22px',
    }}>{children}</h1>
  );
}

function BotaoPrimario({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#a9b7e6' : AZUL_BTN, color: '#fff', border: 'none',
      borderRadius: 12, padding: '15px 46px', fontSize: 16, fontWeight: 700,
      cursor: disabled ? 'default' : 'pointer', letterSpacing: '0.04em',
      boxShadow: disabled ? 'none' : '0 8px 22px rgba(59,91,219,0.35)',
      transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
    }}>{children}</button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
type Step = 'dados' | 'instrucao' | 'acDir' | 'acEsq' | 'astig' | 'cores' | 'resultado';
const ORDEM: Step[] = ['dados', 'instrucao', 'acDir', 'acEsq', 'astig', 'cores', 'resultado'];
const CORES_NUMS = [7, 5, 2];

export default function TesteVisao() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('dados');

  // dados
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [usaOculos, setUsaOculos] = useState(false);

  // resultados
  const [acDir, setAcDir] = useState<string | null>(null);
  const [acEsq, setAcEsq] = useState<string | null>(null);
  const [astigNormal, setAstigNormal] = useState<boolean | null>(null);
  const [respCores, setRespCores] = useState<(number | null)[]>([]);
  const [placaIdx, setPlacaIdx] = useState(0);

  const idxAtual = ORDEM.indexOf(step);
  const progresso = (idxAtual / (ORDEM.length - 1)) * 100;

  function proximo() { const i = ORDEM.indexOf(step); if (i < ORDEM.length - 1) setStep(ORDEM[i + 1]); }
  function voltar() { const i = ORDEM.indexOf(step); if (i > 0) setStep(ORDEM[i - 1]); }

  function reiniciar() {
    setStep('dados'); setNome(''); setIdade(''); setUsaOculos(false);
    setAcDir(null); setAcEsq(null); setAstigNormal(null); setRespCores([]); setPlacaIdx(0);
  }

  function responderCor(v: number | null) {
    const nova = [...respCores]; nova[placaIdx] = v; setRespCores(nova);
    if (placaIdx < CORES_NUMS.length - 1) setPlacaIdx(placaIdx + 1);
    else setStep('resultado');
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'auto',
      background: 'linear-gradient(120deg, #eef3fb 0%, #dbe6f7 45%, #cdd9ee 100%)',
      color: '#1f2937',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Barra de progresso */}
      <div style={{ height: 4, background: 'rgba(30,58,138,0.1)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progresso}%`, background: AZUL_BTN, transition: 'width .3s ease' }} />
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', flexShrink: 0 }}>
        <button onClick={step === 'dados' ? () => navigate('/vision') : voltar} style={{
          background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(30,58,138,0.12)', borderRadius: 9,
          padding: '8px 14px', fontSize: 13, fontWeight: 600, color: AZUL, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AZUL} strokeWidth="2.4" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          {step === 'dados' ? 'Início' : 'Voltar'}
        </button>
        <button onClick={() => navigate('/vision')} style={{
          background: AZUL_BTN, border: 'none', borderRadius: 8, padding: '8px 18px',
          fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.05em',
          WebkitTapHighlightColor: 'transparent',
        }}>MENU</button>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 20px 40px', gap: 18 }}>

        {/* ── DADOS INICIAIS ── */}
        {step === 'dados' && (
          <>
            <Titulo>DADOS INICIAIS</Titulo>
            <div style={cardStyle}>
              <Campo label="Nome:">
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do cliente" style={inputStyle} />
              </Campo>
              <Campo label="Idade:">
                <input value={idade} onChange={e => setIdade(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="Idade" style={inputStyle} />
              </Campo>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
                <span style={{ fontSize: 16, color: '#334155', minWidth: 110 }}>Usa óculos?</span>
                <button onClick={() => setUsaOculos(v => !v)} style={{
                  width: 34, height: 34, borderRadius: 8, border: `2px solid ${usaOculos ? AZUL_BTN : '#cbd5e1'}`,
                  background: usaOculos ? AZUL_BTN : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  {usaOculos && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              </div>
              <p style={{ color: LARANJA, fontSize: 14.5, textAlign: 'center', margin: '20px 0 0', lineHeight: 1.5, fontWeight: 500 }}>
                Se você usa óculos, mantenha-os durante todo o teste.
              </p>
            </div>
            <div style={{ marginTop: 8 }}>
              <BotaoPrimario onClick={proximo} disabled={!nome.trim()}>CONTINUAR</BotaoPrimario>
            </div>
            <p style={{ color: AZUL, fontWeight: 700, fontSize: 15, marginTop: 4 }}>Teste de visão rápido e eficiente</p>
          </>
        )}

        {/* ── INSTRUÇÃO ── */}
        {step === 'instrucao' && (
          <>
            <Titulo>COMO FUNCIONA</Titulo>
            <div style={{ ...cardStyle, maxWidth: 620 }}>
              <Instrucao n="1" cor={AZUL_BTN} titulo="Distância">Afaste-se cerca de 1 a 2 metros do tablet, na altura dos olhos.</Instrucao>
              <Instrucao n="2" cor={VERDE} titulo="Um olho de cada vez">Cubra o olho indicado com a palma da mão, sem apertar.</Instrucao>
              <Instrucao n="3" cor={AMBAR} titulo="Ambiente iluminado">Faça o teste em um local bem iluminado, sem reflexos na tela.</Instrucao>
              <p style={{ color: LARANJA, fontSize: 14, textAlign: 'center', margin: '18px 0 0', lineHeight: 1.5, fontWeight: 500 }}>
                Este é um teste indicativo e não substitui a avaliação de um profissional.
              </p>
            </div>
            <div style={{ marginTop: 8 }}><BotaoPrimario onClick={proximo}>COMEÇAR TESTE</BotaoPrimario></div>
          </>
        )}

        {/* ── ACUIDADE ── */}
        {(step === 'acDir' || step === 'acEsq') && (
          <AcuidadeView
            olho={step === 'acDir' ? 'DIREITO' : 'ESQUERDO'}
            olhoCobrir={step === 'acDir' ? 'ESQUERDO' : 'DIREITO'}
            valor={step === 'acDir' ? acDir : acEsq}
            onSelect={ac => step === 'acDir' ? setAcDir(ac) : setAcEsq(ac)}
            onContinuar={proximo}
          />
        )}

        {/* ── ASTIGMATISMO ── */}
        {step === 'astig' && (
          <>
            <Titulo>ASTIGMATISMO</Titulo>
            <p style={{ fontSize: 16, color: '#334155', textAlign: 'center', maxWidth: 520, margin: '-6px 0 6px' }}>
              Com os dois olhos abertos, observe as linhas do leque. <b>Todas parecem igualmente nítidas e escuras?</b>
            </p>
            <LequeAstigmatismo />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              <BotaoEscolha ativo={astigNormal === true} cor={VERDE} onClick={() => { setAstigNormal(true); }}>
                Todas iguais e nítidas
              </BotaoEscolha>
              <BotaoEscolha ativo={astigNormal === false} cor={AMBAR} onClick={() => { setAstigNormal(false); }}>
                Algumas mais escuras / borradas
              </BotaoEscolha>
            </div>
            <div style={{ marginTop: 10 }}>
              <BotaoPrimario onClick={proximo} disabled={astigNormal === null}>CONTINUAR</BotaoPrimario>
            </div>
          </>
        )}

        {/* ── DALTONISMO / CORES ── */}
        {step === 'cores' && (
          <>
            <Titulo>VISÃO DE CORES</Titulo>
            <p style={{ fontSize: 16, color: '#334155', textAlign: 'center', margin: '-6px 0 2px' }}>
              Placa {placaIdx + 1} de {CORES_NUMS.length} — que número você enxerga?
            </p>
            <PlacaIshihara numero={CORES_NUMS[placaIdx]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, maxWidth: 360, width: '100%' }}>
              {Array.from({ length: 10 }).map((_, d) => (
                <button key={d} onClick={() => responderCor(d)} style={{
                  padding: '14px 0', fontSize: 20, fontWeight: 700, borderRadius: 10,
                  border: '1px solid rgba(30,58,138,0.15)', background: '#fff', color: AZUL,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>{d}</button>
              ))}
            </div>
            <button onClick={() => responderCor(null)} style={{
              background: 'transparent', border: 'none', color: LARANJA, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', marginTop: 2, WebkitTapHighlightColor: 'transparent',
            }}>Não vejo nenhum número</button>
          </>
        )}

        {/* ── RESULTADO ── */}
        {step === 'resultado' && (
          <ResultadoView
            nome={nome} acDir={acDir} acEsq={acEsq} astigNormal={astigNormal}
            respCores={respCores} onReiniciar={reiniciar} onMenu={() => navigate('/vision')}
          />
        )}
      </div>
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  flex: 1, padding: '12px 14px', fontSize: 16, borderRadius: 10,
  border: '1px solid #cbd5e1', outline: 'none', color: '#1f2937', background: '#fff',
  fontFamily: 'inherit',
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <span style={{ fontSize: 16, color: '#334155', minWidth: 110 }}>{label}</span>
      {children}
    </div>
  );
}

function Instrucao({ n, cor, titulo, children }: { n: string; cor: string; titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: cor, color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>{n}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{titulo}</div>
        <div style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}

function BotaoEscolha({ children, ativo, cor, onClick }: { children: React.ReactNode; ativo: boolean; cor: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 22px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer',
      border: `2px solid ${ativo ? cor : '#cbd5e1'}`,
      background: ativo ? cor : '#fff', color: ativo ? '#fff' : '#475569',
      transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
    }}>{children}</button>
  );
}

function AcuidadeView({ olho, olhoCobrir, valor, onSelect, onContinuar }: {
  olho: string; olhoCobrir: string; valor: string | null; onSelect: (ac: string) => void; onContinuar: () => void;
}) {
  return (
    <>
      <Titulo>ACUIDADE — OLHO {olho}</Titulo>
      <p style={{ fontSize: 16, color: '#334155', textAlign: 'center', margin: '-6px 0 4px', maxWidth: 520 }}>
        Cubra o olho <b style={{ color: VERMELHO }}>{olhoCobrir}</b> e leia com o olho <b style={{ color: VERDE }}>{olho}</b>.
        Toque na <b>menor linha</b> que conseguir ler.
      </p>
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', boxShadow: '0 12px 40px rgba(20,40,90,0.12)', width: '100%', maxWidth: 620 }}>
        {SNELLEN.map(l => {
          const sel = valor === l.ac;
          return (
            <button key={l.ac} onClick={() => onSelect(l.ac)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              width: '100%', border: 'none', cursor: 'pointer', borderRadius: 10,
              background: sel ? 'rgba(59,91,219,0.1)' : 'transparent',
              padding: '6px 12px', marginBottom: 2, WebkitTapHighlightColor: 'transparent',
              outline: sel ? `2px solid ${AZUL_BTN}` : 'none',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: l.size, color: '#111827', lineHeight: 1, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {l.txt}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: sel ? AZUL_BTN : '#94a3b8', fontWeight: 700, flexShrink: 0 }}>{l.ac}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8 }}>
        <BotaoPrimario onClick={onContinuar} disabled={!valor}>CONTINUAR</BotaoPrimario>
      </div>
    </>
  );
}

function LequeAstigmatismo() {
  const linhas = Array.from({ length: 18 }).map((_, i) => {
    const ang = (i * 10) * Math.PI / 180;
    const x1 = 130 + Math.cos(ang) * 30, y1 = 130 + Math.sin(ang) * 30;
    const x2 = 130 + Math.cos(ang) * 118, y2 = 130 + Math.sin(ang) * 118;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth="3" strokeLinecap="round" />;
  });
  return (
    <div style={{ background: '#fff', borderRadius: '50%', padding: 8, boxShadow: '0 12px 40px rgba(20,40,90,0.12)' }}>
      <svg width="260" height="260" viewBox="0 0 260 260" style={{ maxWidth: '78vw', height: 'auto' }}>
        {linhas}
        <circle cx="130" cy="130" r="26" fill="#fff" />
        <circle cx="130" cy="130" r="4" fill="#111827" />
      </svg>
    </div>
  );
}

function ResultadoView({ nome, acDir, acEsq, astigNormal, respCores, onReiniciar, onMenu }: {
  nome: string; acDir: string | null; acEsq: string | null; astigNormal: boolean | null;
  respCores: (number | null)[]; onReiniciar: () => void; onMenu: () => void;
}) {
  const sDir = statusAcuidade(acDir);
  const sEsq = statusAcuidade(acEsq);
  const acertosCores = respCores.filter((r, i) => r === CORES_NUMS[i]).length;
  const coresStatus = acertosCores >= 3
    ? { txt: 'Normal', cor: VERDE }
    : acertosCores === 2
      ? { txt: 'Provavelmente normal', cor: AMBAR }
      : { txt: 'Possível alteração', cor: VERMELHO };

  const pior = Math.max(acDir ? denom(acDir) : 0, acEsq ? denom(acEsq) : 0);
  const recomenda = pior >= 40 || astigNormal === false || acertosCores <= 1;

  return (
    <>
      <Titulo>RESULTADO</Titulo>
      <p style={{ fontSize: 16, color: '#334155', margin: '-8px 0 6px', textAlign: 'center' }}>
        {nome ? <>Olá, <b>{nome}</b>! </> : null}Resumo indicativo do seu teste:
      </p>
      <div style={{ ...cardStyle, maxWidth: 560, padding: '24px 26px' }}>
        <LinhaResultado rotulo="Olho direito" valor={acDir ?? '—'} status={sDir.txt} cor={sDir.cor} />
        <LinhaResultado rotulo="Olho esquerdo" valor={acEsq ?? '—'} status={sEsq.txt} cor={sEsq.cor} />
        <LinhaResultado rotulo="Astigmatismo" valor={astigNormal === null ? '—' : astigNormal ? 'Sem sinais' : 'Sinais presentes'} status={astigNormal ? 'Normal' : astigNormal === false ? 'Atenção' : '—'} cor={astigNormal ? VERDE : astigNormal === false ? AMBAR : '#94a3b8'} />
        <LinhaResultado rotulo="Visão de cores" valor={`${acertosCores}/${CORES_NUMS.length} placas`} status={coresStatus.txt} cor={coresStatus.cor} ultimo />
      </div>

      <div style={{
        background: recomenda ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.1)',
        border: `1px solid ${recomenda ? 'rgba(217,119,6,0.3)' : 'rgba(22,163,74,0.3)'}`,
        borderRadius: 14, padding: '16px 20px', maxWidth: 560, textAlign: 'center',
        color: recomenda ? '#92400e' : '#166534', fontSize: 15, fontWeight: 600, lineHeight: 1.5,
      }}>
        {recomenda
          ? 'Identificamos pontos que merecem atenção. Recomendamos uma avaliação completa com nosso profissional.'
          : 'Seus resultados estão dentro do esperado. Ainda assim, o acompanhamento periódico é importante.'}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        <BotaoPrimario onClick={onMenu}>FALAR COM A ÓTICA</BotaoPrimario>
        <button onClick={onReiniciar} style={{
          background: '#fff', color: AZUL, border: `1.5px solid ${AZUL_BTN}`, borderRadius: 12,
          padding: '15px 34px', fontSize: 15, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}>Refazer teste</button>
      </div>
      <p style={{ fontSize: 12.5, color: '#94a3b8', maxWidth: 480, textAlign: 'center', marginTop: 4 }}>
        Teste indicativo. Não substitui exame oftalmológico profissional.
      </p>
    </>
  );
}

function LinhaResultado({ rotulo, valor, status, cor, ultimo }: { rotulo: string; valor: string; status: string; cor: string; ultimo?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '12px 0', borderBottom: ultimo ? 'none' : '1px solid #eef2f7',
    }}>
      <span style={{ fontSize: 15.5, color: '#475569', fontWeight: 600 }}>{rotulo}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#334155' }}>{valor}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: cor, borderRadius: 999, padding: '3px 12px' }}>{status}</span>
      </div>
    </div>
  );
}
