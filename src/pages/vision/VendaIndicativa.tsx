import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Tipos de dados ─────────────────────────────────────────────────────────
type TipoLenteId = 'multifocais' | 'visao-simples' | 'ocupacionais' | 'bifocais';

interface Produto {
  nome: string;
  parcelas: number;       // ex: 12
  valorParcela: number;   // ex: 53.34  (deixe 0 para "a definir")
  superficie: string;     // Digital / Convencional
  fotossensivel: string;  // Incolor / Fotossensível
  material: string;       // 1.50 / 1.56 / 1.61 / 1.67
  tratamento: string;     // Antirrisco / Antirreflexo / Titanium ...
}

interface Tabela {
  id: string;
  marca: string;          // ex: "Zeiss"
  nomeTabela: string;     // ex: "FREEVIEW"
  data: string;           // ex: "04 2026"
  cor: string;            // cor de destaque da marca (placeholder do logo)
  tipos: TipoLenteId[];   // quais tipos de lente essa tabela cobre
  produtos: Produto[];
}

// ─── Tipos de lente (etapa 1) ───────────────────────────────────────────────
const TIPOS_LENTE: { id: TipoLenteId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'multifocais', label: 'Multifocais',
    icon: <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M6 4h12l-2 16H8L6 4z" stroke="#2563eb" strokeWidth="1.4" strokeLinejoin="round" /><line x1="7" y1="9" x2="17" y2="9" stroke="#2563eb" strokeWidth="1.2" /><line x1="7.5" y1="14" x2="16.5" y2="14" stroke="#2563eb" strokeWidth="1.2" /></svg>,
  },
  {
    id: 'visao-simples', label: 'Visão Simples',
    icon: <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.4" /><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="1.2" /></svg>,
  },
  {
    id: 'ocupacionais', label: 'Ocupacionais',
    icon: <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="#2563eb" strokeWidth="1.4" /><path d="M4 10h16M9 19v-9" stroke="#2563eb" strokeWidth="1.2" /><circle cx="6.5" cy="7.5" r="0.8" fill="#2563eb" /></svg>,
  },
  {
    id: 'bifocais', label: 'Bifocais',
    icon: <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.4" /><path d="M7 15h10" stroke="#2563eb" strokeWidth="1.2" /><path d="M9.5 15a2.5 2.5 0 0 1 5 0" stroke="#2563eb" strokeWidth="1.2" /></svg>,
  },
];

// ─── Dados de exemplo (TROCAR pelos preços reais depois) ─────────────────────
const P = (nome: string, valorParcela: number, material = '1.50', superficie = 'Digital', tratamento = 'Antirrisco', fotossensivel = 'Incolor'): Produto =>
  ({ nome, parcelas: 12, valorParcela, material, superficie, tratamento, fotossensivel });

const TABELAS: Tabela[] = [
  {
    id: 'freeview', marca: 'FREEVIEW', nomeTabela: 'Freeview', data: '06 2025', cor: '#2563eb',
    tipos: ['multifocais'],
    produtos: [
      P('FREEVIEW GENESIS', 573.34, '1.50', 'Digital', 'Titanium'),
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
  {
    id: 'zeiss', marca: 'ZEISS', nomeTabela: 'Zeiss', data: '04 2026', cor: '#1a1a2e',
    tipos: ['multifocais', 'visao-simples'],
    produtos: [
      P('ZEISS SMARTLIFE INDIVIDUAL', 0),
      P('ZEISS SMARTLIFE PLUS', 0),
      P('ZEISS SMARTLIFE PRO', 0),
      P('ZEISS LIGHT D', 0),
    ],
  },
  {
    id: 'varilux', marca: 'VARILUX', nomeTabela: 'Essilor', data: '04 2026', cor: '#003a70',
    tipos: ['multifocais'],
    produtos: [
      P('VARILUX XR SERIES', 0),
      P('VARILUX X', 0),
      P('VARILUX COMFORT MAX', 0),
      P('VARILUX LIBERTY', 0),
    ],
  },
  {
    id: 'hoya', marca: 'HOYA', nomeTabela: 'Hoya', data: '12 2025', cor: '#0072c6',
    tipos: ['multifocais', 'visao-simples'],
    produtos: [
      P('HOYALUX iD MYSTYLE', 0),
      P('HOYALUX iD LIFESTYLE', 0),
      P('HOYALUX SUMMIT', 0),
    ],
  },
  {
    id: 'kodak', marca: 'KODAK', nomeTabela: 'Kodak Lens', data: '01 2024', cor: '#d4001a',
    tipos: ['multifocais', 'visao-simples'],
    produtos: [
      P('KODAK PRECISE PB', 0),
      P('KODAK UNIQUE', 0),
      P('KODAK EASY', 0),
    ],
  },
  {
    id: 'rodenstock', marca: 'RODENSTOCK', nomeTabela: 'Rodenstock', data: '01 2026', cor: '#1a1a1a',
    tipos: ['multifocais'],
    produtos: [
      P('RODENSTOCK B.I.G. EXACT', 0),
      P('RODENSTOCK B.I.G. NORM', 0),
    ],
  },
  {
    id: 'forla', marca: 'FORLA', nomeTabela: 'Forla', data: '06 2025', cor: '#f59e0b',
    tipos: ['multifocais', 'visao-simples', 'ocupacionais'],
    produtos: [
      P('FORLA PRESTIGE', 0),
      P('FORLA DIGITAL', 0),
      P('FORLA BASIC', 0),
    ],
  },
  {
    id: 'brasilor', marca: 'BRASILOR', nomeTabela: 'Brasilor', data: '12 2023', cor: '#0ea5e9',
    tipos: ['multifocais', 'bifocais'],
    produtos: [
      P('BRASILOR INFINITY', 0),
      P('BRASILOR DIGITAL', 0),
    ],
  },
];

// ─── Bottom nav (Menu / Extras / OS) ─────────────────────────────────────────
function BottomNav({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  return (
    <div style={{
      flexShrink: 0, background: '#fff', borderTop: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 4,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
    }}>
      {onBack && (
        <button onClick={onBack} style={navBtn(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={navLabel}>Voltar</span>
        </button>
      )}
      <button onClick={() => navigate('/vision')} style={navBtn(false)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
        <span style={navLabel}>Menu</span>
      </button>
      <div style={{ flex: 1 }} />
      <button onClick={() => navigate('/vision/os')} style={navBtn(false)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" /><line x1="8" y1="15" x2="13" y2="15" /></svg>
        <span style={navLabel}>O.S.</span>
      </button>
    </div>
  );
}
const navBtn = (active: boolean): React.CSSProperties => ({
  background: active ? '#eff6ff' : 'none', border: 'none', cursor: 'pointer',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  padding: '6px 14px', borderRadius: 10, WebkitTapHighlightColor: 'transparent',
});
const navLabel: React.CSSProperties = {
  fontSize: 9.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em',
};

// ─── Cabeçalho com logo da ótica ─────────────────────────────────────────────
function Header({ titulo }: { titulo: string }) {
  return (
    <div style={{ position: 'absolute', top: 24, left: 28, zIndex: 5, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, color: '#fff',
        }}>V</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
          Conect<span style={{ color: '#1d4ed8' }}>Vision</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, paddingLeft: 2 }}>{titulo}</div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function VendaIndicativa() {
  const [etapa, setEtapa] = useState<'tipo' | 'marca' | 'produtos'>('tipo');
  const [tipo, setTipo] = useState<TipoLenteId | null>(null);
  const [tabela, setTabela] = useState<Tabela | null>(null);
  const [produtoIdx, setProdutoIdx] = useState(0);

  const tabelasFiltradas = tipo ? TABELAS.filter(t => t.tipos.includes(tipo)) : [];
  const produtoSel = tabela?.produtos[produtoIdx] ?? null;

  function escolherTipo(id: TipoLenteId) { setTipo(id); setEtapa('marca'); }
  function escolherTabela(t: Tabela) { setTabela(t); setProdutoIdx(0); setEtapa('produtos'); }
  function voltar() {
    if (etapa === 'produtos') { setEtapa('marca'); setTabela(null); }
    else if (etapa === 'marca') { setEtapa('tipo'); setTipo(null); }
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f0f4f8', overflow: 'hidden', position: 'relative' }}>
      {/* ── ETAPA 1: Tipo de lente ── */}
      {etapa === 'tipo' && (
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          backgroundImage: 'url(/portrait-young-business-woman-office.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(232,240,254,0.82) 0%, rgba(219,234,254,0.6) 100%)' }} />
          <Header titulo="Venda Indicativa" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
            <div style={{ textAlign: 'center', animation: 'viRise .5s cubic-bezier(0.22,1,0.36,1) both' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>◆ Venda Indicativa ◆</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Escolha o tipo de lente</div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {TIPOS_LENTE.map((t, i) => (
                <button key={t.id} onClick={() => escolherTipo(t.id)}
                  style={{ ...cardTipo, animation: `viRise .5s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.07}s both` }}
                  onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(37,99,235,0.3)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = cardTipo.boxShadow as string; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = cardTipo.boxShadow as string; }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(124,58,237,0.08))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}>
                    {t.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t.label}</span>
                </button>
              ))}
            </div>
            <style>{`@keyframes viRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          </div>
        </div>
      )}

      {/* ── ETAPA 2: Marca / tabela ── */}
      {etapa === 'marca' && (
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          backgroundImage: 'url(/portrait-young-business-woman-office.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,244,248,0.92)' }} />
          <Header titulo={`Venda Indicativa · ${TIPOS_LENTE.find(t => t.id === tipo)?.label}`} />
          <div style={{ position: 'absolute', top: 92, left: 0, right: 0, bottom: 0, overflowY: 'auto', padding: '8px 28px 28px' }}>
            <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 20 }}>
              Escolha uma tabela
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, maxWidth: 980, margin: '0 auto' }}>
              {tabelasFiltradas.map((t, i) => (
                <button key={t.id} onClick={() => escolherTabela(t)}
                  style={{ ...cardMarca, animation: `viRise .45s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both` }}
                  onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.borderColor = '#2563eb'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                  <div style={{
                    fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', color: t.cor,
                    fontFamily: 'var(--sans)',
                  }}>{t.marca}</div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>{t.nomeTabela} · {t.data}</div>
                </button>
              ))}
            </div>
            <style>{`@keyframes viRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          </div>
        </div>
      )}

      {/* ── ETAPA 3: Produtos com preços ── */}
      {etapa === 'produtos' && tabela && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Lista lateral de produtos */}
          <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: tabela.cor, letterSpacing: '-0.4px' }}>{tabela.marca}</div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>{tabela.nomeTabela} · {tabela.data}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tabela.produtos.map((p, i) => {
                const ativo = i === produtoIdx;
                return (
                  <button key={i} onClick={() => setProdutoIdx(i)} style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: ativo ? '#eff6ff' : 'transparent',
                    borderLeft: `3px solid ${ativo ? '#2563eb' : 'transparent'}`,
                    borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #f1f5f9',
                    padding: '13px 16px', display: 'flex', flexDirection: 'column', gap: 4,
                    WebkitTapHighlightColor: 'transparent', transition: 'background .12s',
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: ativo ? '#1d4ed8' : '#1e293b' }}>{p.nome}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: ativo ? '#1d4ed8' : '#475569', fontFamily: 'var(--mono)' }}>
                      {p.valorParcela > 0 ? `${p.parcelas}x ${p.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'A definir'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área central — lente sobre ambiente + specs */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
            {/* Ambiente desfocado de fundo */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/portrait-young-business-woman-office.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(8px) brightness(.5)',
            }} />
            {/* Lente nítida (elipse) sobre o ambiente */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-55%)',
              width: '70%', height: '64%',
              borderRadius: '50%', overflow: 'hidden',
              boxShadow: '0 0 0 2px rgba(255,255,255,.5), 0 20px 60px rgba(0,0,0,.5)',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/portrait-young-business-woman-office.jpg)',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              {/* brilho da lente */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.25) 0%, transparent 40%)' }} />
            </div>

            {/* Card de specs (topo esquerdo) */}
            {produtoSel && (
              <div style={{
                position: 'absolute', top: 18, left: 18, width: 230,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
                borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,.3)',
              }}>
                <div style={{ padding: '12px 16px', background: tabela.cor }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{produtoSel.nome}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', marginTop: 2 }}>
                    {produtoSel.valorParcela > 0 ? `${produtoSel.parcelas}x ${produtoSel.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'A definir'}
                  </div>
                </div>
                {[
                  ['Superfície', produtoSel.superficie],
                  ['Fotossensível', produtoSel.fotossensivel],
                  ['Material', produtoSel.material],
                  ['Tratamento', produtoSel.tratamento],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 11.5, color: '#1e293b', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Preço grande (rodapé central) */}
            {produtoSel && produtoSel.valorParcela > 0 && (
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
                borderRadius: 14, padding: '12px 28px', textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, marginBottom: 2 }}>{produtoSel.nome}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)' }}>
                  {produtoSel.parcelas}x <span style={{ color: '#60a5fa' }}>R$ {produtoSel.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav onBack={etapa !== 'tipo' ? voltar : undefined} />
    </div>
  );
}

const cardTipo: React.CSSProperties = {
  width: 158, height: 168,
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1.5px solid rgba(255,255,255,0.95)', borderRadius: 22,
  boxShadow: '0 10px 36px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.9)', cursor: 'pointer',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
  transition: 'transform .12s, box-shadow .15s', WebkitTapHighlightColor: 'transparent',
};
const cardMarca: React.CSSProperties = {
  background: 'linear-gradient(170deg, #ffffff 0%, #f8fafc 100%)',
  border: '1.5px solid #e2e8f0', borderRadius: 16,
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)', cursor: 'pointer',
  padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  minHeight: 92, transition: 'transform .12s, border-color .15s', WebkitTapHighlightColor: 'transparent',
};
