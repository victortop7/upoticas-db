import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

// ─── Paisagens (cenário atrás do campo de visão — public/paisagens/{id}.png) ────
const PAISAGENS: { id: number; label: string }[] = [
  { id: 8, label: 'Pôr do sol' },
  { id: 9, label: 'Estrada' },
  { id: 10, label: 'Montanha' },
  { id: 11, label: 'Lago' },
  { id: 12, label: 'Cânion' },
  { id: 13, label: 'Neve' },
  { id: 14, label: 'Vale' },
  { id: 15, label: 'Alameda' },
  { id: 16, label: 'Parque' },
  { id: 17, label: 'Campo' },
  { id: 18, label: 'Cerejeiras' },
  { id: 19, label: 'Floresta' },
];

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Módulo ───────────────────────────────────────────────────────────────────
export default function VendaIndicativa() {
  const navigate = useNavigate();
  const [view, setView] = useState<'grade' | 'tabela'>('grade');
  const [tipo, setTipo] = useState<TipoLenteId>('multifocais');
  const [tabelaId, setTabelaId] = useState('');
  const [busca, setBusca] = useState('');
  const [idx, setIdx] = useState(0);
  const [aba, setAba] = useState<'ambientes' | 'desenhar'>('ambientes');
  const [pais, setPais] = useState(PAISAGENS[0].id);
  const [painel, setPainel] = useState<null | 'descricao' | 'detalhes'>(null);

  const tabelasTipo = TABELAS.filter(t => t.tipos.includes(tipo));
  const tabela = TABELAS.find(t => t.id === tabelaId);

  function abrirTabela(id: string) {
    setTabelaId(id); setIdx(0); setBusca(''); setPainel(null); setView('tabela');
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
  const paisagem = PAISAGENS.find(a => a.id === pais) ?? PAISAGENS[0];

  const cards: [string, string | undefined][] = p ? [
    ['Campo', p.campo], ['Superfície', p.superficie], ['Fotossensível', p.foto],
    ['Material', p.material], ['Tratamento', p.tratamento],
  ] : [];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#e9edf2', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'none' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ══ PAINEL ESQUERDO ══ */}
        <div style={{ width: 392, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #d5dbe3' }}>
          {/* Voltar + marca */}
          <button onClick={() => setView('grade')} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#f7f9fc', border: 'none', borderBottom: '1px solid #eef1f5',
            cursor: 'pointer', padding: '11px 14px', textAlign: 'left', WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0a2f6b' }}>Tabelas</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: tabela.cor }}>{tabela.marca}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>· {tabela.nome}</span>
          </button>

          {/* Busca */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome do Produto..." style={{
              flex: 1, padding: '9px 12px', fontSize: 13.5, borderRadius: 8, border: '1px solid #c3ccd6',
              outline: 'none', color: '#1e293b', background: '#fff', fontFamily: 'inherit',
            }} />
            <button style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '0 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Buscar</button>
          </div>

          {/* Lista de produtos */}
          <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #eef1f5' }}>
            {filtrados.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Nenhum produto encontrado.</div>
            )}
            {filtrados.map((pr) => {
              const realIdx = produtos.indexOf(pr);
              const ativo = realIdx === idx;
              return (
                <button key={pr.nome} onClick={() => { setIdx(realIdx); setPainel(null); }} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  textAlign: 'left', cursor: 'pointer', border: 'none', borderBottom: '1px solid #f1f4f8',
                  background: ativo ? '#dbe4f5' : 'transparent', padding: '11px 14px', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: ativo ? 700 : 500, color: ativo ? '#0a2f6b' : tabela.cor }}>{pr.nome}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: ativo ? '#0a2f6b' : '#334155', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>12x {brl(pr.parcela)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ ÁREA DIREITA ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#c9d1da' }}>
          {/* Abas Ambientes / Desenhar */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {(['ambientes', 'desenhar'] as const).map(a => (
              <button key={a} onClick={() => { setAba(a); setPainel(null); }} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', cursor: 'pointer',
                background: aba === a ? '#0a1a2f' : '#243447', color: '#fff', fontSize: 13, fontWeight: 600,
                borderRight: '1px solid #1a2838', WebkitTapHighlightColor: 'transparent',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {a === 'ambientes'
                    ? <><rect x="3" y="4" width="18" height="14" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="M4 16l4-4 4 3 3-2 5 5" /></>
                    : <path d="M12 19l7-7-4-4-7 7v4h4zM15 6l3 3" />}
                </svg>
                {a === 'ambientes' ? 'Ambientes' : 'Desenhar'}
              </button>
            ))}
          </div>

          {/* Visualização da lente */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            {aba === 'ambientes' ? (
              <>
                {/* Paisagem de fundo */}
                <img key={paisagem.id} src={`/paisagens/${paisagem.id}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

                {/* Menu de paisagens (esquerda) */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', zIndex: 4 }}>
                  {PAISAGENS.map(a => (
                    <button key={a.id} onClick={() => setPais(a.id)} style={{
                      textAlign: 'left', border: 'none', cursor: 'pointer', padding: '9px 20px 9px 16px', minWidth: 116,
                      background: pais === a.id ? 'rgba(10,20,35,0.92)' : 'rgba(30,42,58,0.66)', color: '#fff',
                      fontSize: 12.5, fontWeight: pais === a.id ? 700 : 500, borderBottom: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: pais === a.id ? '3px solid #3b82f6' : '3px solid transparent', WebkitTapHighlightColor: 'transparent',
                    }}>{a.label}</button>
                  ))}
                </div>

                {/* Campo de visão da lente (por cima da paisagem) */}
                {p?.campoImg ? (
                  <img key={p.campoImg} src={cvSrc(p.campoImg)} alt="" style={{
                    position: 'absolute', top: '4%', left: '17%', right: '5%', bottom: '5%', width: 'auto', height: 'auto',
                    maxWidth: '78%', maxHeight: '90%', margin: 'auto', objectFit: 'contain',
                    mixBlendMode: 'multiply', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))', pointerEvents: 'none',
                  }} />
                ) : (
                  // Fallback: lente de vidro genérica
                  <div style={{ position: 'absolute', top: '5%', left: '18%', right: '6%', bottom: '6%', borderRadius: '48% 48% 46% 46% / 52% 52% 48% 48%', border: '2px solid rgba(255,255,255,0.75)', boxShadow: 'inset 0 0 80px rgba(255,255,255,0.14), 0 14px 44px rgba(0,0,0,0.22)', background: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 42%)', pointerEvents: 'none' }} />
                )}

                {/* Botões laterais direita */}
                <div style={{ position: 'absolute', top: '50%', right: 4, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 14, zIndex: 5 }}>
                  {[
                    { id: 'descricao', l: 'Descrição', i: <path d="M4 4h16v13H8l-4 4z" /> },
                    { id: 'detalhes', l: 'Detalhes', i: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.6" fill="currentColor" /></> },
                    { id: 'linha', l: 'Linha', i: <><circle cx="7" cy="12" r="4" /><circle cx="17" cy="12" r="4" /></> },
                    { id: 'olho', l: 'Olho', i: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></> },
                    { id: 'mlp', l: 'MLP', i: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M4 8l16 8M20 8L4 16" /></> },
                  ].map(b => (
                    <button key={b.id} onClick={() => setPainel(prev => prev === (b.id as 'detalhes' | 'descricao') ? null : (b.id === 'detalhes' ? 'detalhes' : b.id === 'descricao' ? 'descricao' : prev))}
                      style={{ background: 'rgba(255,255,255,0.55)', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 8px', color: 'rgba(15,23,42,0.9)', WebkitTapHighlightColor: 'transparent' }}>
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{b.i}</svg>
                      <span style={{ fontSize: 9, fontWeight: 600 }}>{b.l}</span>
                    </button>
                  ))}
                </div>

                {/* Overlay: Detalhes / Descrição */}
                {painel && p && (
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(6,10,18,0.92)', color: '#e8ecf3', padding: '16px 22px', zIndex: 6, animation: 'fadeIn .18s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#7fb2ff' }}>{p.campo ?? p.nome}</div>
                      <button onClick={() => setPainel(null)} style={{ background: 'none', border: 'none', color: '#9aa4b8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                    {painel === 'detalhes' ? (
                      <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                        <div>Código: <b>{p.codigo ?? '—'}</b></div>
                        <div>Disponibilidade: <b>{p.disp ?? '—'}</b></div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c7cede', maxWidth: 640 }}>
                        {p.nome} — lente {p.superficie?.toLowerCase()} em {p.material}, tratamento {p.tratamento}.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Desenhar campoImg={p?.campoImg} paisagemId={paisagem.id} />
            )}
          </div>

          {/* 5 cards */}
          <div style={{ display: 'flex', gap: 6, padding: 8, background: '#dbe0e7', flexShrink: 0 }}>
            {cards.map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #cdd5df', overflow: 'hidden', minWidth: 0 }}>
                <div style={{ textAlign: 'center', padding: '8px 6px 4px', fontSize: 11.5 }}>
                  <div style={{ color: '#64748b' }}>{k}:</div>
                  <div style={{ color: '#1e293b', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v ?? '—'}</div>
                </div>
                <div style={{ height: 58, background: 'linear-gradient(160deg,#eef2f7,#dbe2ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9fb0c4" strokeWidth="1.3"><ellipse cx="12" cy="12" rx="9" ry="6.5" /><circle cx="12" cy="12" r="2.5" /></svg>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 16px', background: '#eef1f5', borderTop: '1px solid #d5dbe3', flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p ? `${p.nome} · ` : ''}<span style={{ color: tabela.cor, fontFamily: 'var(--mono)', fontWeight: 800 }}>{p ? `12x ${brl(p.parcela)}` : ''}</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)' }}>00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dock inferior */}
      <Dock navigate={navigate} onOS={() => navigate('/vision/os')} />
    </div>
  );
}

// ─── Dock inferior (compartilhado) ─────────────────────────────────────────────
function Dock({ navigate, onOS }: { navigate: ReturnType<typeof useNavigate>; onOS: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#f5f6f8', borderTop: '1px solid #d5dbe3', flexShrink: 0 }}>
      {[
        { l: 'Menu', on: () => navigate('/vision'), i: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></> },
        { l: 'Extras', on: () => {}, i: <><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></> },
        { l: 'OS', on: onOS, i: <><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" /></> },
        { l: 'Valor', on: () => {}, i: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
        { l: 'Calculadora', on: () => {}, i: <><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="11" x2="8" y2="11" /><line x1="12" y1="11" x2="12" y2="11" /><line x1="16" y1="11" x2="16" y2="11" /><line x1="8" y1="15" x2="8" y2="15" /><line x1="12" y1="15" x2="12" y2="15" /></> },
      ].map(b => (
        <button key={b.l} onClick={b.on} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '3px 14px', color: '#1d4ed8', WebkitTapHighlightColor: 'transparent' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{b.i}</svg>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{b.l}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10.5, color: '#94a3b8', paddingRight: 6 }}>1.0.16</span>
    </div>
  );
}

// ─── Modo Desenhar (canvas de anotação sobre paisagem + campo de visão) ────────
function Desenhar({ campoImg, paisagemId }: { campoImg?: string; paisagemId: number }) {
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
      <img src={`/paisagens/${paisagemId}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {campoImg
        ? <img src={cvSrc(campoImg)} alt="" style={{ position: 'absolute', top: '4%', left: '17%', right: '5%', bottom: '5%', width: 'auto', height: 'auto', maxWidth: '78%', maxHeight: '90%', margin: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', pointerEvents: 'none' }} />
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
