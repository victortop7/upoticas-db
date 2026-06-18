import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Tipos de dados ─────────────────────────────────────────────────────────
type TipoLenteId = 'multifocais' | 'visao-simples' | 'ocupacionais' | 'bifocais';

interface Produto {
  nome: string;
  parcela: number;            // valor da parcela 12x
  superficie?: string;        // Digital / Convencional
  foto?: string;              // Incolor / Fotossensível
  material?: string;          // 1.50 / 1.56 / Orma Blue UV ...
  tratamento?: string;        // AR / Optifog / Verniz HC ...
}

interface Tabela {
  id: string;
  marca: string;
  data: string;
  cor: string;
  tipos: TipoLenteId[];
  produtos: Produto[];
}

// helper: P(nome, parcela, material?, tratamento?)
const P = (nome: string, parcela: number, material = '1.50', tratamento = 'AR'): Produto =>
  ({ nome, parcela, superficie: 'Digital', foto: 'Incolor', material, tratamento });

// ─── Tipos de lente ─────────────────────────────────────────────────────────
const TIPOS_LENTE: { id: TipoLenteId; label: string; icon: React.ReactNode }[] = [
  { id: 'multifocais', label: 'Multifocais', icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M6 4h12l-2 16H8L6 4z" stroke="#2563eb" strokeWidth="1.4" strokeLinejoin="round" /><line x1="7" y1="9" x2="17" y2="9" stroke="#2563eb" strokeWidth="1.2" /><line x1="7.5" y1="14" x2="16.5" y2="14" stroke="#2563eb" strokeWidth="1.2" /></svg> },
  { id: 'visao-simples', label: 'Visão Simples', icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.4" /><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="1.2" /></svg> },
  { id: 'ocupacionais', label: 'Ocupacionais', icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="#2563eb" strokeWidth="1.4" /><path d="M4 10h16M9 19v-9" stroke="#2563eb" strokeWidth="1.2" /></svg> },
  { id: 'bifocais', label: 'Bifocais', icon: <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.4" /><path d="M7 15h10" stroke="#2563eb" strokeWidth="1.2" /><path d="M9.5 15a2.5 2.5 0 0 1 5 0" stroke="#2563eb" strokeWidth="1.2" /></svg> },
];

// ─── Catálogos (preços transcritos dos prints) ──────────────────────────────
const TABELAS: Tabela[] = [
  {
    id: 'essilor', marca: 'VARILUX', data: 'Essilor 04 2026', cor: '#003a70', tipos: ['multifocais'],
    produtos: [
      P('Varilux XR Pro', 887.42, 'Orma Blue UV', 'Optifog'),
      P('Varilux XR Track', 534.10, 'Orma Blue UV', 'Optifog'),
      P('Varilux XR Track Lite', 510.76, 'Orma Blue UV', 'Optifog'),
      P('Varilux XR Design', 457.42, 'Orma Blue UV', 'Optifog'),
      P('Varilux Physio Extensee Track', 286.60, 'Orma', 'Optifog'),
      P('Varilux Physio Extensee', 254.10, 'Orma', 'Optifog'),
      P('Varilux Comfort Max', 124.92, 'Orma', 'Verniz HC'),
      P('Varilux Comfort', 124.92, 'Orma', 'Verniz HC'),
      P('Varilux Liberty 3.0', 83.26, 'Orma', 'Verniz HC'),
      P('Varilux Liberty', 83.26, 'Orma', 'Sem AR'),
      P('Kodak Unique Infinite', 79.92),
      P('Kodak Unique UHD', 69.10),
      P('Kodak Network UHD', 59.10),
      P('Kodak Precise UHD', 37.42),
      P('Kodak Precise', 37.42, '1.50', 'Sem AR'),
      P('Varilux Sport', 134.92, 'Airwear Blue UV', 'Optifog'),
      P('Varilux Sport Wrap', 134.92, 'Airwear Blue UV', 'Optifog'),
      P('Varilux Roadpilot', 77.42, 'Orma', 'Trio Easy Clean'),
      P('Kodak Easy Sun', 85.76),
    ],
  },
  {
    id: 'zeiss', marca: 'ZEISS', data: 'Zeiss 10 2024', cor: '#1a1a2e', tipos: ['multifocais'],
    produtos: [
      P('Zeiss Progressive SmartLife Individual 3', 750.00, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive SmartLife Individual', 750.00, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive SmartLife Superb', 499.10, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive SmartLife Plus', 399.18, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive SmartLife Pure', 306.68, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive Smartlife Essential / Essential Short', 224.18, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive Light 3Dv', 224.18, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive Light 3D', 158.26, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive Light D FreeForm', 116.60, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive GT2 New Edition', 83.26, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive Individual Sport', 427.42, '1.50 BlueGuard', 'DV Chrome'),
      P('Zeiss Progressive Individual DriveSafe', 374.92, '1.50', 'DV DriveSafe'),
      P('Coloração', 17.50, 'Preto 12 FARB490', 'Preço'),
    ],
  },
  {
    id: 'hoya', marca: 'HOYA', data: 'Hoya 05 2024', cor: '#0072c6', tipos: ['multifocais'],
    produtos: [
      P('HOYALUX Myself', 790.84, '1.50', 'HV LongLife UV Control'),
      P('HOYALUX Mystyle V+', 707.50, '1.50', 'HV LongLife UV Control'),
      P('HOYALUX Lifestyle 4i', 420.00, '1.50', 'No-Risk'),
      P('HOYALUX Lifestyle 4', 395.00, '1.50', 'No-Risk'),
      P('HOYALUX Lifestyle 3i', 386.68, '1.50', 'No-Risk'),
      P('HOYALUX Lifestyle 3', 370.00, '1.50', 'No-Risk'),
      P('HOYALUX Balansis', 311.68, '1.50', 'No-Risk'),
      P('HOYALUX Daynamic', 157.50, '1.50', 'HV Hard'),
      P('Argos', 82.50, '1.50', 'HV Hard'),
      P('Amplus', 57.50, '1.50', 'HV Hard'),
      P('Enroute', 365.84, '1.60', 'AR'),
      P('Sportive', 257.50, '1.50', 'HV Hard'),
    ],
  },
  {
    id: 'progressiva', marca: 'PROGRESSIVA', data: 'Genérica', cor: '#16a34a', tipos: ['multifocais'],
    produtos: [
      P('Progressiva Pro ID Freeform', 140.00, '1.56', 'Sem AR'),
      P('Progressiva Top Freeform', 107.92, '1.56', 'Sem AR'),
      P('Progressiva Smart Freeform', 70.42, '1.56', 'Sem AR'),
      P('Progressiva Acabada', 36.68, '1.56', 'AR Verde'),
      P('Haytek Light Freeform', 10.00, '1.56', 'Antirrisco'),
    ],
  },
  {
    id: 'freeview', marca: 'FREEVIEW', data: 'Freeview 06 2025', cor: '#2563eb', tipos: ['multifocais'],
    produtos: [
      P('FREEVIEW GENESIS', 573.34, '1.50', 'Titanium'),
      P('FREEVIEW SILVER', 360.00, '1.49'),
      P('FREEVIEW HDI', 293.34),
      P('FREEVIEW HD', 243.34),
      P('FREEVIEW SLIM', 316.68),
      P('FREEVIEW PRO', 160.00),
      P('FREEVIEW EASY', 126.68),
      P('TOPVIEW', 75.00),
      P('TOPLIGHT', 53.34),
    ],
  },
];

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const AMBIENTE = '/portrait-young-business-woman-office.jpg';

// ─── Header ─────────────────────────────────────────────────────────────────
function Header({ titulo }: { titulo: string }) {
  return (
    <div style={{ position: 'absolute', top: 22, left: 26, zIndex: 5, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(180deg,#3ba6ff,#007aff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>V</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Connect <span style={{ color: '#007aff' }}>Vision</span></div>
      </div>
      <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, paddingLeft: 2 }}>{titulo}</div>
    </div>
  );
}

// ─── Diagrama de espessura (aba Desenho) ────────────────────────────────────
function Espessura() {
  const lente = (idx: string, idxAlt: string) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
      <svg viewBox="0 0 360 120" width="100%" style={{ maxWidth: 420 }}>
        {/* lente seção transversal */}
        <path d="M 30 70 Q 180 40 330 70 L 330 76 Q 180 50 30 76 Z" fill="#dbe4ec" stroke="#9fb3c8" strokeWidth="1" />
        <line x1="180" y1="46" x2="180" y2="74" stroke="#7a90a4" strokeWidth="1" />
        {/* cota centro */}
        <text x="180" y="30" textAnchor="middle" fontSize="11" fill="#1e3a5f" fontWeight="600">2,0 mm</text>
        <text x="180" y="42" textAnchor="middle" fontSize="9" fill="#64748b">de centro</text>
        {/* cota borda */}
        <text x="6" y="64" fontSize="9" fill="#1e3a5f" fontWeight="600">2,00 mm</text>
        <text x="6" y="74" fontSize="8" fill="#64748b">de borda</text>
        <rect x="28" y="68" width="6" height="10" fill="none" stroke="#9fb3c8" strokeWidth="0.8" />
        {/* diâmetro */}
        <line x1="30" y1="92" x2="330" y2="92" stroke="#9fb3c8" strokeWidth="0.8" strokeDasharray="3 3" />
        <text x="180" y="106" textAnchor="middle" fontSize="10" fill="#1e3a5f">∅ 65 mm</text>
        <text x="345" y="74" fontSize="11" fill="#64748b">0</text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>-1</div>
        <div style={{ display: 'flex', gap: 36, alignItems: 'center', margin: '4px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{idx}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>0</div>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>{idxAlt} &nbsp;&nbsp; +1</div>
      </div>
    </div>
  );
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '40px 30px', background: '#fff' }}>
      {lente('1.50', '1.53')}
      {lente('1.50', '1.53')}
    </div>
  );
}

// ─── Vista detalhada de uma tabela ──────────────────────────────────────────
function Detalhe({ tabela, onVoltar }: { tabela: Tabela; onVoltar: () => void }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [aba, setAba] = useState<'tabela' | 'ambientes' | 'desenho'>('ambientes');
  const p = tabela.produtos[idx];
  const LENTE = 'ellipse(46% 44% at 52% 48%)';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#0f172a' }}>
      {/* Lista lateral de produtos */}
      <div style={{ width: 230, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>
        {/* Specs do produto selecionado */}
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ padding: '12px 14px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tabela.cor, lineHeight: 1.25 }}>{p.nome}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', fontFamily: 'var(--mono)', marginTop: 2 }}>12x {brl(p.parcela)}</div>
          </div>
          {[['Superfície', p.superficie], ['Fotossensível', p.foto], ['Material', p.material], ['Tratamento', p.tratamento]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 6, padding: '5px 14px', borderTop: '1px solid #f1f5f9', fontSize: 11 }}>
              <span style={{ color: '#94a3b8', minWidth: 78 }}>{k}:</span>
              <span style={{ color: '#1e293b', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Lista de produtos */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tabela.produtos.map((pr, i) => {
            const ativo = i === idx;
            return (
              <button key={i} onClick={() => setIdx(i)} style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                background: ativo ? '#eff6ff' : 'transparent',
                borderLeft: `3px solid ${ativo ? tabela.cor : 'transparent'}`,
                border: 'none', borderBottom: '1px solid #f1f5f9',
                padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 3,
                WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ fontSize: 12, fontWeight: ativo ? 700 : 500, color: ativo ? '#1d4ed8' : '#334155', lineHeight: 1.2 }}>{pr.nome}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: ativo ? '#1d4ed8' : '#64748b', fontFamily: 'var(--mono)' }}>12x {brl(pr.parcela)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Centro */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Abas topo */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', gap: 2, background: 'rgba(28,28,30,0.6)', backdropFilter: 'blur(16px)', borderRadius: 10, padding: 3 }}>
          {([['tabela', 'Tabela'], ['ambientes', 'Ambientes'], ['desenho', 'Desenho']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)} style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: aba === id ? 'rgba(255,255,255,0.95)' : 'transparent',
              color: aba === id ? '#111827' : 'rgba(255,255,255,0.7)',
              fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
              WebkitTapHighlightColor: 'transparent',
            }}>{label}</button>
          ))}
        </div>

        {/* Conteúdo central */}
        {aba === 'desenho' ? (
          <Espessura />
        ) : aba === 'tabela' ? (
          <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', overflowY: 'auto', padding: '64px 28px 20px' }}>
            <div style={{ maxWidth: 620, margin: '0 auto', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {tabela.produtos.map((pr, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 18px', borderBottom: i < tabela.produtos.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: i === idx ? '#eff6ff' : 'transparent', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{pr.nome}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: tabela.cor, fontFamily: 'var(--mono)' }}>12x {brl(pr.parcela)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Ambiente desfocado */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${AMBIENTE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(7px) brightness(.85)' }} />
            {/* Lente nítida */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${AMBIENTE})`, backgroundSize: 'cover', backgroundPosition: 'center', clipPath: LENTE, WebkitClipPath: LENTE }} />
            {/* Contorno da lente */}
            <div style={{ position: 'absolute', top: '4%', left: '6%', right: '6%', bottom: '8%', borderRadius: '50%', border: '2px solid rgba(255,255,255,.8)', pointerEvents: 'none' }} />
            {/* brilho */}
            <div style={{ position: 'absolute', inset: 0, clipPath: LENTE, WebkitClipPath: LENTE, background: 'linear-gradient(135deg, rgba(255,255,255,.22) 0%, transparent 35%)', pointerEvents: 'none' }} />
          </>
        )}

        {/* Ícones direita */}
        <div style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 18, zIndex: 6 }}>
          {[
            { l: 'Descrição', i: <path d="M4 4h16v14H7l-3 3z" /> },
            { l: 'Detalhes', i: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.5" fill="currentColor" /></> },
            { l: 'Linha', i: <circle cx="12" cy="12" r="8" /> },
            { l: 'Simulação', i: <><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /></> },
          ].map(b => (
            <button key={b.l} onClick={() => b.l === 'Simulação' && navigate('/vision/demonstracoes?tab=visao')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: aba === 'ambientes' ? '#475569' : '#94a3b8', WebkitTapHighlightColor: 'transparent' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{b.i}</svg>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{b.l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Barra inferior */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 40, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 7 }}>
        <button onClick={onVoltar} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#007aff', fontSize: 13, fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Marcas
        </button>
        <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 600 }}>
          {p.nome} · {p.superficie} {p.material} {p.tratamento} · <span style={{ color: tabela.cor, fontFamily: 'var(--mono)' }}>12x {brl(p.parcela)}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function VendaIndicativa() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoLenteId | null>(null);
  const [tabela, setTabela] = useState<Tabela | null>(null);

  const tabelasFiltradas = tipo ? TABELAS.filter(t => t.tipos.includes(tipo)) : [];

  // ── Vista detalhada ──
  if (tabela) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', overflow: 'hidden' }}>
        <Detalhe tabela={tabela} onVoltar={() => setTabela(null)} />
      </div>
    );
  }

  // ── Etapa 1: tipo de lente ──
  if (!tipo) {
    return (
      <div style={{ height: '100dvh', position: 'relative', overflow: 'hidden', background: '#f0f4f8' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${AMBIENTE})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(232,240,254,0.85) 0%, rgba(219,234,254,0.6) 100%)' }} />
        <Header titulo="Tabela Digital" />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>Escolha o tipo de lente</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TIPOS_LENTE.map(t => (
              <button key={t.id} onClick={() => setTipo(t.id)} style={cardTipo}
                onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                <div style={{ width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(124,58,237,0.08))' }}>{t.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <NavInferior onMenu={() => navigate('/vision')} onOS={() => navigate('/vision/os')} />
      </div>
    );
  }

  // ── Etapa 2: marcas ──
  return (
    <div style={{ height: '100dvh', position: 'relative', overflow: 'hidden', background: '#f0f4f8' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,244,248,0.95)' }} />
      <Header titulo={`Tabela Digital · ${TIPOS_LENTE.find(t => t.id === tipo)?.label}`} />
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, bottom: 48, overflowY: 'auto', padding: '8px 28px 28px' }}>
        <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 18 }}>Escolha uma tabela</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, maxWidth: 1000, margin: '0 auto' }}>
          {tabelasFiltradas.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: '40px 0' }}>
              Nenhuma tabela cadastrada para este tipo ainda.
            </div>
          )}
          {tabelasFiltradas.map(t => (
            <button key={t.id} onClick={() => setTabela(t)} style={cardMarca}
              onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', color: t.cor }}>{t.marca}</div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>{t.data} · {t.produtos.length} lentes</div>
            </button>
          ))}
        </div>
      </div>
      <NavInferior onMenu={() => navigate('/vision')} onOS={() => navigate('/vision/os')} onBack={() => setTipo(null)} />
    </div>
  );
}

// ─── Barra de navegação inferior ─────────────────────────────────────────────
function NavInferior({ onMenu, onOS, onBack }: { onMenu: () => void; onOS: () => void; onBack?: () => void }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(249,249,251,0.85)', backdropFilter: 'blur(24px)', borderTop: '0.5px solid rgba(60,60,67,0.22)', display: 'flex', alignItems: 'center', padding: '6px 16px', gap: 6 }}>
      {onBack && (
        <button onClick={onBack} style={navBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={navLbl}>Voltar</span>
        </button>
      )}
      <button onClick={onMenu} style={navBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
        <span style={navLbl}>Menu</span>
      </button>
      <div style={{ flex: 1 }} />
      <button onClick={onOS} style={navBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" /></svg>
        <span style={navLbl}>O.S.</span>
      </button>
    </div>
  );
}

const navBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '4px 14px', WebkitTapHighlightColor: 'transparent' };
const navLbl: React.CSSProperties = { fontSize: 10, fontWeight: 500, color: '#007aff' };
const cardTipo: React.CSSProperties = { width: 156, height: 162, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.95)', borderRadius: 22, boxShadow: '0 10px 36px rgba(15,23,42,0.12)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'transform .12s', WebkitTapHighlightColor: 'transparent' };
const cardMarca: React.CSSProperties = { background: 'linear-gradient(170deg,#fff,#f8fafc)', border: '1.5px solid #e2e8f0', borderRadius: 16, boxShadow: '0 2px 12px rgba(15,23,42,0.06)', cursor: 'pointer', padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 92, transition: 'transform .12s', WebkitTapHighlightColor: 'transparent' };
