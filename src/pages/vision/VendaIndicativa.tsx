import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Somente este e-mail (administrador) tem a Tabela Digital liberada.
// Os demais usuários veem um aviso para entrar em contato e cadastrar as lentes.
const ADMIN_EMAIL = 'victormarketing093@gmail.com';
const SUPORTE_WA = '5585991507887';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TipoLenteId = 'multifocais' | 'visao-simples' | 'ocupacionais' | 'bifocais';

interface Produto {
  nome: string;
  parcela: number;            // valor da parcela 12x
  campo?: string;             // família/linha da lente
  superficie?: string;        // Digital / Convencional
  foto?: string;              // Incolor / Fotossensível
  material?: string;          // 1.50 / Orma Blue UV ...
  tratamento?: string;        // AR / Optifog / Verniz HC ...
  codigo?: string;
  disp?: string;              // disponibilidade (dioptria)
  campoImg?: string;          // arquivo em /campos de visão varilux/{campoImg}
}
interface Tabela { id: string; nome: string; marca: string; cor: string; logo?: string; tipos: TipoLenteId[]; produtos: Produto[]; }

// helper
const P = (nome: string, parcela: number, o: Partial<Produto> = {}): Produto => ({
  nome, parcela, campo: o.campo, superficie: o.superficie ?? 'Digital', foto: o.foto ?? 'Incolor',
  material: o.material ?? '1.50', tratamento: o.tratamento ?? 'AR', codigo: o.codigo, disp: o.disp, campoImg: o.campoImg,
});

// caminho de imagem do campo de visão (nomes com espaço/acento → encodeURI)
const cvSrc = (f?: string) => (f ? encodeURI(`/campos de visão varilux/${f}`) : '');

// ─── Tipos de lente (barra do topo) ───────────────────────────────────────────
const TIPOS: { id: TipoLenteId; label: string }[] = [
  { id: 'multifocais', label: 'Multifocal' },
  { id: 'visao-simples', label: 'Simples' },
  { id: 'ocupacionais', label: 'Ocupacional' },
  { id: 'bifocais', label: 'Bifocal' },
];
const TIPO_LABEL: Record<TipoLenteId, string> = {
  'multifocais': 'multifocal', 'visao-simples': 'visão simples', 'ocupacionais': 'ocupacional', 'bifocais': 'bifocal',
};

// ─── Catálogos (Fase 1 — dados de exemplo; Fase 2 recebe o PDF Essilor completo) ─
const DISP_MULTI = '-6,00 a +6,00 / Cil. até -6,00';
const TABELAS: Tabela[] = [
  {
    id: 'essilor-mf', nome: 'Essilor 04 2026', marca: 'VARILUX', cor: '#003a70', logo: '/logo das lentes/varilux-logo-1.png', tipos: ['multifocais'],
    produtos: [
      P('Varilux XR Pro Orma Blue UV Optifog', 887.42, { material: 'Orma Blue UV', tratamento: 'Optifog', campo: 'Varilux XR', disp: DISP_MULTI, campoImg: 'E DESIGN.png' }),
      P('Varilux XR Design Orma Blue UV Optifog', 457.42, { material: 'Orma Blue UV', tratamento: 'Optifog', campo: 'Varilux XR', campoImg: 'E DESIGN.png' }),
      P('Varilux Physio 3.0 Orma Optifog', 254.10, { material: 'Orma', tratamento: 'Optifog', campo: 'Varilux Physio', campoImg: 'PHYSIO 3.0.png' }),
      P('Varilux Comfort Max Orma Verniz HC', 124.92, { material: 'Orma', tratamento: 'Verniz HC', campo: 'Varilux Comfort', campoImg: 'CONFORT MAX.png' }),
      P('Varilux Comfort Orma Verniz HC', 108.26, { material: 'Orma', tratamento: 'Verniz HC', campo: 'Varilux Comfort', campoImg: 'COMFORT.png' }),
      P('Varilux Liberty 3.0 Orma Verniz HC', 83.26, { material: 'Orma', tratamento: 'Verniz HC', campo: 'Varilux Liberty', campoImg: 'LIBERTY 3.0.png' }),
      P('Varilux Liberty Orma Verniz HC', 74.92, { material: 'Orma', tratamento: 'Verniz HC', campo: 'Varilux Liberty', campoImg: 'LIBERTY.png' }),
      P('Kodak Unique Infinite 1.50 AR', 79.92, { campo: 'Kodak Unique' }),
    ],
  },
  {
    id: 'hoya-mf', nome: 'Hoya 05 2024', marca: 'HOYA', cor: '#0072c6', tipos: ['multifocais'],
    produtos: [
      P('HOYALUX Myself 1.50 HV LongLife UV', 790.84, { tratamento: 'HV LongLife UV', campo: 'HOYALUX Myself' }),
      P('HOYALUX Mystyle V+ 1.50 HV LongLife UV', 707.50, { tratamento: 'HV LongLife UV', campo: 'HOYALUX Mystyle' }),
      P('HOYALUX Lifestyle 4 1.50 No-Risk', 395.00, { tratamento: 'No-Risk', campo: 'HOYALUX Lifestyle' }),
      P('HOYALUX Balansis 1.50 No-Risk', 311.68, { tratamento: 'No-Risk', campo: 'HOYALUX Balansis' }),
    ],
  },
  {
    id: 'zeiss-mf', nome: 'Zeiss 04 2026', marca: 'ZEISS', cor: '#0a2a66', tipos: ['multifocais'],
    produtos: [
      P('Zeiss SmartLife Individual 3 DVBP', 640.00, { tratamento: 'DuraVision Blue', campo: 'SmartLife' }),
      P('Zeiss SmartLife Superb DVBP', 420.00, { tratamento: 'DuraVision Blue', campo: 'SmartLife' }),
      P('Zeiss SmartLife Pure DVP', 280.00, { tratamento: 'DuraVision', campo: 'SmartLife' }),
    ],
  },
  {
    id: 'forla-mf', nome: 'Forla 06 2025', marca: 'FORLA', cor: '#e0a800', tipos: ['multifocais'],
    produtos: [
      P('Forla Ultra HD 1.67 AR Blue', 245.00, { material: '1.67', tratamento: 'AR Blue', campo: 'Forla Ultra' }),
      P('Forla Digital 1.60 AR Blue', 168.00, { material: '1.60', tratamento: 'AR Blue', campo: 'Forla Digital' }),
      P('Forla Digital 1.56 AR', 122.00, { material: '1.56', tratamento: 'AR', campo: 'Forla Digital' }),
    ],
  },
  {
    id: 'indo-mf', nome: 'Indo 01 2026', marca: 'INDO', cor: '#009640', tipos: ['multifocais'],
    produtos: [
      P('Indo Maxima Fusion 1.60 Neva Max', 355.00, { material: '1.60', tratamento: 'Neva Max', campo: 'Indo Maxima' }),
      P('Indo Base 1.50 Neva', 190.00, { tratamento: 'Neva', campo: 'Indo Base' }),
    ],
  },
  {
    id: 'rodenstock-mf', nome: 'Rodenstock 01 2026', marca: 'RODENSTOCK', cor: '#003057', tipos: ['multifocais'],
    produtos: [
      P('Rodenstock B.I.G. Exact 1.60 Solitaire', 690.00, { material: '1.60', tratamento: 'Solitaire Protect', campo: 'B.I.G.' }),
      P('Rodenstock Pro 1.50 Solitaire', 320.00, { tratamento: 'Solitaire', campo: 'Rodenstock Pro' }),
    ],
  },
  {
    id: 'essilor-vs', nome: 'Essilor 04 2026', marca: 'EYEZEN', cor: '#c0006a', tipos: ['visao-simples'],
    produtos: [
      P('Eyezen Boost Orma Blue UV', 134.08, { material: 'Orma Blue UV', tratamento: 'Crizal', campo: 'Eyezen', disp: '-10,00 a +6,00 / Cil. até -6,00' }),
      P('Eyezen Start Orma Blue UV', 124.92, { material: 'Orma Blue UV', tratamento: 'Crizal', campo: 'Eyezen' }),
      P('Visão Simples Surfaçada Orma AR', 101.58, { material: 'Orma', tratamento: 'Crizal Sapphire', campo: 'Visão Simples', superficie: 'Surfaçada' }),
      P('Lentes Kodak Single 1.50 AR', 104.92, { campo: 'Kodak Single' }),
    ],
  },
  {
    id: 'forla-vs', nome: 'Forla 06 2025', marca: 'FORLA', cor: '#e0a800', tipos: ['visao-simples'],
    produtos: [
      P('Forla Digital VS 1.67 AR Blue', 138.00, { material: '1.67', tratamento: 'AR Blue', campo: 'Forla VS' }),
      P('Forla VS 1.56 AR', 74.00, { material: '1.56', tratamento: 'AR', campo: 'Forla VS' }),
    ],
  },
  {
    id: 'essilor-oc', nome: 'Essilor 04 2026', marca: 'DIGITIME', cor: '#5b2a86', tipos: ['ocupacionais'],
    produtos: [
      P('Varilux Digitime Near Orma Blue UV', 134.92, { material: 'Orma Blue UV', tratamento: 'Crizal', campo: 'Digitime', disp: '-10,00 a +6,00 / Cil. até -6,00' }),
      P('Varilux Digitime Mid Orma Blue UV', 134.92, { material: 'Orma Blue UV', tratamento: 'Crizal', campo: 'Digitime' }),
      P('Kodak SoftWear 1.50 AR', 122.42, { campo: 'Kodak SoftWear' }),
    ],
  },
  {
    id: 'forla-bf', nome: 'Forla 04 2024', marca: 'BIFOCAL', cor: '#1e5aa8', tipos: ['bifocais'],
    produtos: [
      P('Bifocal Digital 1.60 AR Blue', 205.92, { material: '1.60', tratamento: 'AR Blue', campo: 'Bifocal Digital', codigo: '142131345700', disp: '+6,00 a -10,00 / Cil. até -4,00' }),
      P('Bifocal Digital 1.67 AR Clean', 186.60, { material: '1.67', tratamento: 'AR Clean', campo: 'Bifocal Digital' }),
      P('Bifocal Digital 1.67 AR Premium', 220.84, { material: '1.67', tratamento: 'AR Premium', campo: 'Bifocal Digital' }),
      P('Bifocal Digital 1.74 Surf. Incolor', 320.00, { material: '1.74', tratamento: 'Surf. Incolor', campo: 'Bifocal Digital', superficie: 'Surfaçada' }),
    ],
  },
];

// ─── Ambientes de fundo (public/ambientes/{slug}.jpg) — arrasta p/ trocar (estilo story) ─
// Começa no Olho. (Paisagens antigas seguem guardadas em /paisagens/.)
const AMBIENTES: { slug: string; label: string }[] = [
  { slug: 'olho', label: 'Olho' },
  { slug: 'parque', label: 'Parque' },
  { slug: 'praia', label: 'Praia' },
  { slug: 'dirigindo', label: 'Dirigindo' },
  { slug: 'computador', label: 'Computador' },
  { slug: 'lendo-livro', label: 'Lendo livro' },
  { slug: 'aula', label: 'Aula' },
  { slug: 'cinema', label: 'Cinema' },
];
const ambSrc = (slug: string) => `/ambientes/${slug}.jpg`;

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Celular (paisagem): pouca altura → dá mais destaque à imagem, encolhe cards/opções.
function useCompact() {
  const calc = () => typeof window !== 'undefined' && (window.innerHeight < 460 || window.innerWidth < 720);
  const [c, setC] = useState(calc);
  useEffect(() => {
    const o = () => setC(calc());
    window.addEventListener('resize', o);
    return () => window.removeEventListener('resize', o);
  }, []);
  return c;
}

// ─── Módulo ───────────────────────────────────────────────────────────────────
export default function VendaIndicativa() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const isAdmin = (usuario?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  const [view, setView] = useState<'grade' | 'tabela'>('grade');
  const [tipo, setTipo] = useState<TipoLenteId>('multifocais');
  const [tabelaId, setTabelaId] = useState('');
  const [busca, setBusca] = useState('');
  const [idx, setIdx] = useState(0);
  const [aba, setAba] = useState<'ambientes' | 'desenhar'>('ambientes');
  const [tech, setTech] = useState<string | null>(null); // aspecto técnico aberto (direita)
  const [bgIdx, setBgIdx] = useState(0);                  // paisagem de fundo
  const compact = useCompact();

  const tabelasTipo = TABELAS.filter(t => t.tipos.includes(tipo));
  const tabela = TABELAS.find(t => t.id === tabelaId);

  function abrirTabela(id: string) {
    setTabelaId(id); setIdx(0); setBusca(''); setTech(null); setView('tabela');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 0 — AVISO (usuários que não são o administrador)
  // ══════════════════════════════════════════════════════════════════════════
  if (!isAdmin) {
    const msg = encodeURIComponent('Olá! Quero cadastrar as lentes da minha ótica na Tabela Digital do Connect Vision.');
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#eef1f5', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'none' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 460, textAlign: 'center', background: '#fff', border: '1px solid #dfe4ea', borderRadius: 18, padding: '38px 30px', boxShadow: '0 10px 40px rgba(15,23,42,0.08)' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: 20, background: 'linear-gradient(160deg,#e8effb,#dbe4f5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="9" ry="6" /><circle cx="12" cy="12" r="2.5" /><path d="M3 12h4M17 12h4" /></svg>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#0a2f6b' }}>Tabela Digital</h2>
            <p style={{ margin: '0 0 22px', fontSize: 14.5, lineHeight: 1.6, color: '#475569' }}>
              As tabelas de lentes da sua ótica ainda <b>não foram cadastradas</b>. Entre em contato com a nossa equipe para liberarmos as lentes e os preços na sua Tabela Digital.
            </p>
            <a href={`https://wa.me/${SUPORTE_WA}?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, background: '#22c55e', color: '#fff', textDecoration: 'none',
              padding: '13px 26px', borderRadius: 12, fontSize: 15, fontWeight: 700, boxShadow: '0 6px 18px rgba(34,197,94,0.32)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.26A10 10 0 1 0 12 2z" /></svg>
              Falar no WhatsApp
            </a>
            <div style={{ marginTop: 22 }}>
              <button onClick={() => navigate('/vision')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>← Voltar ao menu</button>
            </div>
          </div>
        </div>
        <Dock navigate={navigate} onOS={() => navigate('/vision/os')} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 1 — GRADE DE TABELAS (escolha da marca)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'grade' || !tabela) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#eef1f5', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'none' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: '#fff', borderBottom: '1px solid #dfe4ea', flexShrink: 0 }}>
          <img src="/vision-icon.png" alt="" style={{ height: 30, width: 'auto' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0a2f6b', letterSpacing: 0.3 }}>Tabela Digital</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 13.5, color: '#64748b', fontWeight: 600 }}>Escolha uma tabela <b style={{ color: '#0a2f6b' }}>{TIPO_LABEL[tipo]}</b></span>
        </div>

        {/* Barra de tipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '12px 22px', background: '#fff', borderBottom: '1px solid #eef1f5', flexShrink: 0 }}>
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 13.5, fontWeight: 600, color: tipo === t.id ? '#0a2f6b' : '#7b8794', WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${tipo === t.id ? '#1d4ed8' : '#c3ccd6'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tipo === t.id && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1d4ed8' }} />}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Grade de cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {tabelasTipo.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 40 }}>Nenhuma tabela cadastrada para {TIPO_LABEL[tipo]}.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {tabelasTipo.map(t => (
                <button key={t.id} onClick={() => abrirTabela(t.id)} style={{
                  background: '#fff', border: '1px solid #dfe4ea', borderRadius: 12, cursor: 'pointer', padding: 0, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', WebkitTapHighlightColor: 'transparent',
                  transition: 'transform .12s, box-shadow .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,78,216,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, background: 'linear-gradient(160deg,#fbfcfe,#eef2f7)' }}>
                    {t.logo
                      ? <img src={t.logo} alt={t.marca} style={{ maxHeight: 52, maxWidth: '80%', objectFit: 'contain' }} onError={e => { (e.currentTarget.parentElement as HTMLElement).innerHTML = `<span style="font-size:22px;font-weight:800;color:${t.cor};letter-spacing:.5px">${t.marca}</span>`; }} />
                      : <span style={{ fontSize: 22, fontWeight: 800, color: t.cor, letterSpacing: 0.5 }}>{t.marca}</span>}
                  </div>
                  <div style={{ padding: '9px 12px', borderTop: '1px solid #eef1f5', textAlign: 'center' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>{t.nome}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{t.produtos.length} produtos</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dock */}
        <Dock navigate={navigate} onOS={() => navigate('/vision/os')} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 2 — TABELA (produtos + campo de visão sobre paisagem)
  // ══════════════════════════════════════════════════════════════════════════
  const produtos = tabela.produtos;
  const filtrados = busca.trim()
    ? produtos.filter(pr => pr.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    : produtos;
  const p = produtos[idx] ?? produtos[0];

  const ambiente = AMBIENTES[bgIdx % AMBIENTES.length];
  const aspectos: [string, string | undefined][] = p ? [
    ['Campo', p.campo], ['Superfície', p.superficie], ['Fotossensível', p.foto],
    ['Material', p.material], ['Tratamento', p.tratamento],
  ] : [];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0b0e', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'none' }}>
      {/* ══ ÁREA IMERSIVA — paisagem em tela cheia, lente centralizada ══ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* Fundo: ambiente em tela cheia — arraste p/ o lado para trocar (estilo story) */}
        {aba === 'ambientes'
          ? <FundoStory idx={bgIdx} onChange={setBgIdx} />
          : <img src={ambSrc(AMBIENTES[bgIdx].slug)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}

        {/* Lente (campo de visão) centralizada — ou modo Desenhar */}
        {aba === 'ambientes' ? (
          p?.campoImg ? (
            <LenteCampo key={p.campoImg} campoImg={p.campoImg} box={{ left: '1%', right: '1%' }} />
          ) : (
            <div style={{ position: 'absolute', top: '4%', left: '20%', right: '20%', bottom: '5%', borderRadius: '48% 48% 46% 46% / 52% 52% 48% 48%', border: '2px solid rgba(255,255,255,0.75)', pointerEvents: 'none' }} />
          )
        ) : (
          <Desenhar campoImg={p?.campoImg} ambSlug={ambiente.slug} />
        )}

        {/* Voltar (topo-esquerda) */}
        <button onClick={() => setView('grade')} style={{
          position: 'absolute', top: 12, left: 12, zIndex: 8, display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)', WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0a2f6b' }}>Tabelas</span>
        </button>

        {/* Nome da lente (topo-centro) */}
        {p && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 7, maxWidth: '42%' }}>
            <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 9, padding: compact ? '7px 16px' : '8px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: compact ? 12 : 14, fontWeight: 800, letterSpacing: '.06em', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>{p.campo ?? p.nome}</div>
            </div>
          </div>
        )}

        {/* Lista flutuante de produtos (esquerda) */}
        {aba === 'ambientes' && (
          <div style={{ position: 'absolute', top: 58, left: 10, bottom: 66, width: compact ? 150 : 206, display: 'flex', flexDirection: 'column', gap: 7, zIndex: 6 }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{
              padding: '8px 11px', fontSize: 12.5, borderRadius: 9, border: 'none', outline: 'none',
              color: '#1e293b', background: 'rgba(255,255,255,0.92)', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }} />
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7, paddingRight: 2 }}>
              {filtrados.length === 0 && <div style={{ color: '#fff', fontSize: 12, textShadow: '0 1px 4px #000', padding: 6 }}>Nada encontrado.</div>}
              {filtrados.map(pr => {
                const realIdx = produtos.indexOf(pr);
                const ativo = realIdx === idx;
                return (
                  <button key={pr.nome} onClick={() => { setIdx(realIdx); setTech(null); }} style={{
                    textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 10, padding: '8px 11px',
                    background: ativo ? tabela.cor : 'rgba(12,22,42,0.72)', color: '#fff',
                    boxShadow: ativo ? '0 3px 12px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.nome}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', opacity: 0.92, marginTop: 1 }}>12x {brl(pr.parcela)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tecnologias da lente (direita) — só o nome; toque para ver o valor */}
        {aba === 'ambientes' && (
          <div style={{ position: 'absolute', top: 58, right: 10, bottom: 66, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 6 }}>
            {aspectos.map(([k, v]) => {
              const aberto = tech === k;
              return (
                <button key={k} onClick={() => setTech(aberto ? null : k)} style={{
                  textAlign: 'left', border: 'none', borderRadius: 9, cursor: 'pointer',
                  width: aberto ? (compact ? 160 : 190) : 'auto',
                  padding: aberto ? '8px 11px' : '5px 9px',
                  background: aberto ? tabela.cor : 'rgba(12,22,42,0.7)', color: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
                  transition: 'width .18s, padding .18s', WebkitTapHighlightColor: 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: aberto ? 12 : 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{k}</span>
                    <span style={{ fontSize: aberto ? 14 : 11, opacity: 0.7, transform: aberto ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>
                  </div>
                  {aberto && <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 5, lineHeight: 1.35, color: '#eaf1ff' }}>{v || '—'}</div>}
                </button>
              );
            })}
          </div>
        )}

        {/* Indicador de ambiente (baixo-centro) — estilo story: arraste p/ trocar */}
        {aba === 'ambientes' && (
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.06em', textShadow: '0 1px 6px rgba(0,0,0,0.8)', textTransform: 'uppercase' }}>{ambiente.label}</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {AMBIENTES.map((a, i) => (
                <span key={a.slug} style={{
                  width: i === bgIdx ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === bgIdx ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)', transition: 'width .2s',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Toggle Desenhar (baixo-direita) */}
        <button onClick={() => { setAba(aba === 'desenhar' ? 'ambientes' : 'desenhar'); setTech(null); }} style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 8, width: 46, height: 46, borderRadius: 13, border: 'none', cursor: 'pointer',
          background: aba === 'desenhar' ? '#1d4ed8' : 'rgba(15,20,30,0.82)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.35)', WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7-4-4-7 7v4h4zM15 6l3 3" /></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Dock inferior (compartilhado) ─────────────────────────────────────────────
function Dock({ navigate, onOS, produto, tabela }: {
  navigate: ReturnType<typeof useNavigate>; onOS: () => void; produto?: Produto; tabela?: Tabela;
}) {
  const [modal, setModal] = useState<null | 'extras' | 'valor' | 'calc'>(null);
  const total = produto ? produto.parcela * 12 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#f5f6f8', borderTop: '1px solid #d5dbe3', flexShrink: 0 }}>
      {[
        { l: 'Menu', on: () => navigate('/vision'), i: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></> },
        { l: 'Extras', on: () => setModal('extras'), i: <><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></> },
        { l: 'OS', on: onOS, i: <><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" /></> },
        { l: 'Valor', on: () => setModal('valor'), i: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
        { l: 'Calculadora', on: () => setModal('calc'), i: <><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="11" x2="8" y2="11" /><line x1="12" y1="11" x2="12" y2="11" /><line x1="16" y1="11" x2="16" y2="11" /><line x1="8" y1="15" x2="8" y2="15" /><line x1="12" y1="15" x2="12" y2="15" /></> },
      ].map(b => (
        <button key={b.l} onClick={b.on} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '3px 14px', color: '#1d4ed8', WebkitTapHighlightColor: 'transparent' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{b.i}</svg>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{b.l}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10.5, color: '#94a3b8', paddingRight: 6 }}>1.0.17</span>

      {/* ── Modais ── */}
      {modal && (
        <div onClick={() => setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.55)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn .15s ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, width: modal === 'calc' ? 300 : 380, maxWidth: '94vw', maxHeight: '92dvh',
            overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #eef1f5' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0a2f6b' }}>
                {modal === 'extras' ? 'Ficha técnica' : modal === 'valor' ? 'Valor da lente' : 'Calculadora'}
              </span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* VALOR */}
            {modal === 'valor' && (
              <div style={{ padding: 18 }}>
                {produto ? (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{produto.nome}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>{tabela?.marca} · {tabela?.nome}</div>
                    {[
                      ['Parcela (12x)', `R$ ${brl(produto.parcela)}`],
                      ['Total (12×)', `R$ ${brl(total)}`],
                      ['À vista', `R$ ${brl(total)}`],
                    ].map(([k, v], i) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderTop: i ? '1px solid #f1f4f8' : 'none' }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>{k}</span>
                        <span style={{ fontSize: i === 1 ? 20 : 15, fontWeight: 800, color: i === 1 ? (tabela?.cor ?? '#0a2f6b') : '#1e293b', fontFamily: 'var(--mono)' }}>{v}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>Selecione um produto na lista.</div>
                )}
              </div>
            )}

            {/* EXTRAS — ficha técnica */}
            {modal === 'extras' && (
              <div style={{ padding: 18 }}>
                {produto ? (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>{produto.nome}</div>
                    {([
                      ['Linha', produto.campo], ['Superfície', produto.superficie], ['Fotossensível', produto.foto],
                      ['Material', produto.material], ['Tratamento', produto.tratamento],
                      ['Código', produto.codigo], ['Disponibilidade', produto.disp],
                    ] as [string, string | undefined][]).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid #f1f4f8' }}>
                        <span style={{ fontSize: 12.5, color: '#64748b', flexShrink: 0 }}>{k}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>Selecione um produto na lista.</div>
                )}
              </div>
            )}

            {/* CALCULADORA */}
            {modal === 'calc' && <Calculadora />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calculadora simples ───────────────────────────────────────────────────────
function Calculadora() {
  const [disp, setDisp] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const fmt = (n: number) => (Number.isFinite(n) ? String(Number(n.toFixed(8))) : '0');
  const apply = (a: number, b: number, o: string) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? 0 : a / b) : b;
  const digit = (d: string) => { setDisp(p => (fresh || p === '0') ? d : p + d); setFresh(false); };
  const dot = () => { if (fresh) { setDisp('0.'); setFresh(false); } else if (!disp.includes('.')) setDisp(disp + '.'); };
  const clear = () => { setDisp('0'); setAcc(null); setOp(null); setFresh(true); };
  const chooseOp = (o: string) => {
    const cur = parseFloat(disp);
    if (op != null && !fresh) { const r = apply(acc ?? 0, cur, op); setAcc(r); setDisp(fmt(r)); } else setAcc(cur);
    setOp(o); setFresh(true);
  };
  const equals = () => { if (op == null) return; const r = apply(acc ?? 0, parseFloat(disp), op); setDisp(fmt(r)); setAcc(null); setOp(null); setFresh(true); };

  const keys: { t: string; on: () => void; bg?: string; col?: string }[] = [
    { t: 'C', on: clear, bg: '#fde2e2', col: '#dc2626' }, { t: '÷', on: () => chooseOp('÷'), bg: '#e8effb', col: '#1d4ed8' },
    { t: '×', on: () => chooseOp('×'), bg: '#e8effb', col: '#1d4ed8' }, { t: '⌫', on: () => setDisp(d => d.length > 1 ? d.slice(0, -1) : '0'), bg: '#eef1f5', col: '#334155' },
    { t: '7', on: () => digit('7') }, { t: '8', on: () => digit('8') }, { t: '9', on: () => digit('9') }, { t: '−', on: () => chooseOp('−'), bg: '#e8effb', col: '#1d4ed8' },
    { t: '4', on: () => digit('4') }, { t: '5', on: () => digit('5') }, { t: '6', on: () => digit('6') }, { t: '+', on: () => chooseOp('+'), bg: '#e8effb', col: '#1d4ed8' },
    { t: '1', on: () => digit('1') }, { t: '2', on: () => digit('2') }, { t: '3', on: () => digit('3') }, { t: '=', on: equals, bg: '#1d4ed8', col: '#fff' },
    { t: '0', on: () => digit('0') }, { t: '.', on: dot },
  ];

  return (
    <div style={{ padding: '10px 12px 12px' }}>
      <div style={{ background: '#0a1526', color: '#fff', borderRadius: 10, padding: '8px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis' }}>{disp}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {keys.map((k, i) => (
          <button key={i} onClick={k.on} style={{
            gridColumn: k.t === '0' ? 'span 2' : undefined,
            padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: k.bg ?? '#f5f6f8', color: k.col ?? '#1e293b',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', WebkitTapHighlightColor: 'transparent',
          }}>{k.t}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Fundo estilo story: arraste para o lado p/ trocar de ambiente ──────────────
function FundoStory({ idx, onChange }: { idx: number; onChange: (i: number) => void }) {
  const N = AMBIENTES.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const [dx, setDx] = useState(0);
  const [anim, setAnim] = useState(false);

  const largura = () => wrapRef.current?.clientWidth || 1;
  const wrapIdx = (i: number) => (i + N) % N;

  const soltar = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const w = largura();
    const passou = Math.abs(dx) > w * 0.15;
    if (!passou) { setAnim(true); setDx(0); setTimeout(() => setAnim(false), 260); return; }
    const dir = dx < 0 ? 1 : -1;              // arrastou p/ esquerda → próximo
    setAnim(true); setDx(dir > 0 ? -w : w);   // desliza até o fim
    setTimeout(() => { setAnim(false); onChange(wrapIdx(idx + dir)); setDx(0); }, 260);
  };

  const onDown = (e: React.PointerEvent) => { dragging.current = true; startX.current = e.clientX; setAnim(false); };
  const onMove = (e: React.PointerEvent) => { if (dragging.current) setDx(e.clientX - startX.current); };

  return (
    <div
      ref={wrapRef}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={soltar} onPointerLeave={soltar} onPointerCancel={soltar}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', touchAction: 'pan-y', cursor: 'grab' }}
    >
      {[-1, 0, 1].map(off => {
        const a = AMBIENTES[wrapIdx(idx + off)];
        return (
          <img
            key={`${a.slug}-${off}`} src={ambSrc(a.slug)} alt="" draggable={false}
            style={{
              position: 'absolute', top: 0, bottom: 0, left: `${off * 100}%`, width: '100%', height: '100%',
              objectFit: 'cover', transform: `translateX(${dx}px)`,
              transition: anim ? 'transform .26s cubic-bezier(.22,.61,.36,1)' : 'none',
              pointerEvents: 'none', userSelect: 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// Lente sobre a paisagem: mostra o PNG do campo de visão COMO ELE É (cores/arte do PNG).
// O PNG deve ter o fundo FORA da lente transparente; dentro, o desenho/preenchimento desejado.
function LenteCampo({ campoImg, box }: { campoImg: string; box?: React.CSSProperties }) {
  const baseBox: React.CSSProperties = { position: 'absolute', top: '1%', left: 128, right: '1%', bottom: '1%', pointerEvents: 'none', ...box };
  return (
    <div style={{
      ...baseBox,
      backgroundImage: `url("${cvSrc(campoImg)}")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'auto 132%', // lente maior (recorta a margem transparente do PNG)
      filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))',
    }} />
  );
}

// ─── Modo Desenhar (canvas de anotação sobre paisagem + campo de visão) ────────
function Desenhar({ campoImg, ambSlug }: { campoImg?: string; ambSlug: string }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const [cor, setCor] = useState('#e11d48');

  useEffect(() => {
    const cv = cvRef.current, wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const resize = () => { cv.width = wrap.clientWidth; cv.height = wrap.clientHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = cvRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = cvRef.current!.getContext('2d')!;
    const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = cvRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.strokeStyle = cor; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const limpar = () => { const c = cvRef.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); };

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <img src={ambSrc(ambSlug)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {campoImg
        ? <LenteCampo campoImg={campoImg} box={{ left: '1%', right: '1%' }} />
        : <div style={{ position: 'absolute', top: '5%', left: '18%', right: '6%', bottom: '6%', borderRadius: '48% 48% 46% 46% / 52% 52% 48% 48%', border: '2px solid rgba(255,255,255,0.75)', background: 'linear-gradient(135deg, rgba(255,255,255,0.16), transparent 42%)', pointerEvents: 'none' }} />}
      <canvas ref={cvRef} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} style={{ position: 'absolute', inset: 0, cursor: 'crosshair', touchAction: 'none' }} />
      {/* toolbar */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, background: '#0a2540', borderRadius: 14, padding: '10px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
        {['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#111827'].map(c => (
          <button key={c} onClick={() => setCor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: cor === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.3)', cursor: 'pointer' }} />
        ))}
        <button onClick={limpar} style={{ background: 'rgba(255,255,255,0.14)', border: 'none', borderRadius: 9, color: '#fff', padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Limpar</button>
      </div>
    </div>
  );
}
