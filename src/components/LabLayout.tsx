import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LabAltF1 from './LabAltF1';

type ModuleKey = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';
type Opcao = { num: number; label: string; to?: string; disabled?: boolean };

const MODULOS: { letra: ModuleKey; nome: string; ativo: boolean }[] = [
  { letra: 'A', nome: 'CONFIGURAÇÕES',             ativo: true  },
  { letra: 'B', nome: 'ÓTICAS CLIENTES',           ativo: true  },
  { letra: 'C', nome: 'FORNECEDORES/OFTALMOS',     ativo: true  },
  { letra: 'D', nome: 'CADASTRO DE PRODUTOS',      ativo: true  },
  { letra: 'E', nome: 'CADASTRO DE ESTOQUE',       ativo: true  },
  { letra: 'F', nome: 'MOVIMENTAÇÃO DE ESTOQUE',   ativo: true  },
  { letra: 'G', nome: 'VENDAS/ORDENS DE SERVIÇOS', ativo: true  },
  { letra: 'H', nome: 'CONTROLE DE FLUXO',         ativo: true  },
  { letra: 'I', nome: 'NOTAS FISCAIS/FECHAMENTOS', ativo: false },
  { letra: 'J', nome: 'FATURAMENTO',               ativo: true  },
  { letra: 'K', nome: 'CONTAS A RECEBER/PAGAR',    ativo: true  },
  { letra: 'L', nome: 'CONTROLE BANCÁRIO',         ativo: true  },
];

const OPCOES: Record<ModuleKey, Opcao[]> = {
  A: [
    { num: 1, label: 'NUMERAÇÃO DE DOCUMENTOS',    to: '/lab/configuracoes' },
    { num: 3, label: 'PARÂMETROS DO SISTEMA',       to: '/lab/configuracoes' },
    { num: 4, label: 'TABELAS DO SISTEMA',          to: '/lab/configuracoes' },
    { num: 5, label: 'CADASTRO DE TRANSPORTADORAS', to: '/lab/transportadoras' },
    { num: 6, label: 'CADASTRO DE OPERADORES',      to: '/lab/operadores' },
  ],
  B: [
    { num: 1, label: 'INCLUIR ÓTICA',     to: '/lab/oticas' },
    { num: 2, label: 'ALTERAR DADOS',     to: '/lab/oticas' },
    { num: 4, label: 'CONSULTA/LISTAGEM', to: '/lab/oticas' },
  ],
  C: [
    { num: 1, label: 'INCLUIR FORNECEDOR', to: '/lab/fornecedores' },
    { num: 2, label: 'ALTERAR DADOS',      to: '/lab/fornecedores' },
    { num: 4, label: 'CONSULTA/LISTAGEM',  to: '/lab/fornecedores' },
  ],
  D: [
    { num: 1, label: 'INCLUIR PRODUTO/SERVIÇO', to: '/lab/produtos' },
    { num: 2, label: 'ALTERAR DADOS',           to: '/lab/produtos' },
    { num: 4, label: 'CONSULTA/LISTAGEM',       to: '/lab/produtos' },
  ],
  E: [
    { num: 1, label: 'INCLUIR ITEM DE ESTOQUE', to: '/lab/estoque' },
    { num: 2, label: 'ALTERAR DADOS',           to: '/lab/estoque' },
    { num: 4, label: 'CONSULTA/LISTAGEM',       to: '/lab/estoque' },
  ],
  F: [
    { num: 1, label: 'ENTRADA DE MERCADORIA', to: '/lab/estoque' },
    { num: 2, label: 'SAÍDA DE MERCADORIA',   to: '/lab/estoque' },
    { num: 3, label: 'CONSULTA/LISTAGEM',     to: '/lab/estoque' },
  ],
  G: [
    { num: 1, label: 'EMITIR OS / PEDIDO',  to: '/lab/ordens/nova' },
    { num: 2, label: 'CONSULTA/LISTAGEM',   to: '/lab/ordens' },
    { num: 3, label: 'ALTERAR OS',          to: '/lab/ordens' },
    { num: 4, label: 'RELATÓRIO MENSAL',    to: '/lab/relatorios' },
  ],
  H: [
    { num: 1, label: 'LANÇAR FLUXO/INDIVIDUAL', to: '/lab/fluxo' },
    { num: 2, label: 'LANÇAR FLUXO/SETOR',      to: '/lab/fluxo' },
    { num: 4, label: 'CONSULTA/PRODUÇÃO',        to: '/lab/fluxo' },
  ],
  I: [],
  J: [
    { num: 1, label: 'GERAR FECHAMENTO',  to: '/lab/faturamento-lab' },
    { num: 2, label: 'CONSULTA/LISTAGEM', to: '/lab/faturamento-lab' },
    { num: 3, label: 'VENDEDORES',        to: '/lab/vendedores' },
  ],
  K: [
    { num: 1, label: 'CONTAS A RECEBER', to: '/lab/contas-receber' },
    { num: 2, label: 'CONTAS A PAGAR',   to: '/lab/contas-pagar'   },
  ],
  L: [
    { num: 1, label: 'LANÇAMENTOS',      to: '/lab/bancario-lab'   },
    { num: 2, label: 'CONSULTA/LISTAGEM',to: '/lab/bancario-lab'   },
    { num: 3, label: 'CONTAS A RECEBER', to: '/lab/contas-receber' },
    { num: 4, label: 'CONTAS A PAGAR',   to: '/lab/contas-pagar'   },
  ],
};

// Detect active module from current path
function detectModule(path: string): ModuleKey | null {
  if (path.includes('/lab/configuracoes') || path.includes('/lab/transportadoras') || path.includes('/lab/operadores')) return 'A';
  if (path.includes('/lab/oticas')) return 'B';
  if (path.includes('/lab/fornecedores')) return 'C';
  if (path.includes('/lab/produtos') && !path.includes('/lab/faturamento')) return 'D';
  if (path.includes('/lab/estoque')) return 'E';
  if (path.includes('/lab/ordens')) return 'G';
  if (path.includes('/lab/fluxo')) return 'H';
  if (path.includes('/lab/faturamento')) return 'J';
  if (path.includes('/lab/vendedores')) return 'J';
  if (path.includes('/lab/contas')) return 'K';
  if (path.includes('/lab/bancario')) return 'L';
  return null;
}

export default function LabLayout() {
  const { usuario, tenant, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');
  const [altF1, setAltF1] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(() => detectModule(location.pathname));
  const isDashboard = location.pathname === '/lab/dashboard';

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'F1') { e.preventDefault(); setAltF1(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-detect module from route
  useEffect(() => {
    const detected = detectModule(location.pathname);
    if (detected) setActiveModule(detected);
  }, [location.pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#c8c4b0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
        <div style={{ color: '#880000', fontWeight: 'bold' }}>AGUARDE...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (tenant?.tipo !== 'lab') return <Navigate to="/dashboard" replace />;

  async function handleLogout() { await logout(); navigate('/login'); }

  function clickModule(letra: ModuleKey, ativo: boolean) {
    if (!ativo) return;
    setActiveModule(letra);
  }

  function clickOpcao(op: Opcao) {
    if (op.disabled || !op.to) return;
    navigate(op.to);
  }

  const hdrBg     = dark ? 'linear-gradient(90deg,#440000,#660000)' : 'linear-gradient(90deg,#880000,#cc0000)';
  const hdrBorder = dark ? '#1a4a1a' : '#aa2222';
  const hdrTxt    = dark ? '#ffaaaa' : '#ffcccc';
  const mainBg    = dark ? '#111111' : '#c8c4b0';
  const modBg     = dark ? 'linear-gradient(180deg,#1a0000,#2a0000)' : 'linear-gradient(180deg,#880000,#660000)';
  const modBorder = dark ? '#3a1a1a' : '#5a2a2a';
  const optBg     = dark ? '#1c1c1c' : '#d4d0c8';
  const optBorder = dark ? '#333' : '#a0a098';

  const opcoes = activeModule ? OPCOES[activeModule] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Montserrat', sans-serif", background: mainBg }}>

      {/* ── HEADER ── */}
      <div style={{ background: hdrBg, color: hdrTxt, padding: '4px 16px', fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${hdrBorder}`, letterSpacing: '1.5px', textTransform: 'uppercase', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/lab/dashboard')}>UpÓticas Lab — {tenant?.nome || 'Laboratório'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setAltF1(true)} title="ALT+F1"
            style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', color: hdrTxt, border: `1px solid ${hdrBorder}`, borderRadius: '2px', cursor: 'pointer', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
            🔍 ALT+F1
          </button>
          <span style={{ fontSize: '11px', color: dark ? '#ff6666' : '#d0a0a0' }}>{usuario?.nome}</span>
          <button onClick={handleLogout}
            style={{ padding: '2px 10px', fontSize: '11px', background: '#cc0000', color: '#ffffff', border: '1px solid #ff4040', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>
            SAIR
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── SIDEBAR LOGO ── */}
        <div style={{ background: modBg, width: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderRight: `2px solid ${modBorder}`, flexShrink: 0 }}>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: dark ? '#ff6666' : '#ffcccc', fontSize: '11px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', userSelect: 'none' }}>UPOTICAS</div>
          <div style={{ color: dark ? '#ff4444' : '#ffaaaa', fontSize: '16px' }}>🔬</div>
          <div style={{ writingMode: 'vertical-rl', color: dark ? '#ff4444' : '#ffaaaa', fontSize: '10px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase' }}>LAB</div>
        </div>

        {/* ── MÓDULOS ── */}
        <div style={{ width: '220px', background: modBg, borderRight: `2px solid ${modBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${modBorder}`, fontSize: '10px', fontWeight: '700', color: hdrTxt, letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
            MÓDULOS
          </div>
          {/* Dashboard */}
          <div onClick={() => { setActiveModule(null); navigate('/lab/dashboard'); }}
            style={{ padding: '7px 12px', cursor: 'pointer', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${modBorder}`, background: isDashboard ? 'rgba(255,255,255,0.15)' : 'transparent', color: isDashboard ? '#fff' : dark ? '#ff9999' : '#ffdddd' }}>
            <span>🏠 PAINEL PRINCIPAL</span>
          </div>
          {MODULOS.map(m => {
            const isActive = activeModule === m.letra && !isDashboard;
            return (
              <div key={m.letra}
                onClick={() => clickModule(m.letra, m.ativo)}
                style={{
                  padding: '7px 12px', cursor: m.ativo ? 'pointer' : 'default',
                  fontSize: '11px', fontWeight: isActive ? '700' : '400',
                  color: !m.ativo ? 'rgba(255,255,255,0.3)' : isActive ? '#fff' : dark ? '#ff9999' : '#ffdddd',
                  background: isActive ? 'rgba(0,0,0,0.35)' : 'transparent',
                  borderBottom: `1px solid ${modBorder}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: isActive ? '3px solid #ffaaaa' : '3px solid transparent',
                }}>
                <span>{m.nome}</span>
                <span style={{ fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '12px', opacity: m.ativo ? 1 : 0.4 }}>{m.letra}</span>
              </div>
            );
          })}
        </div>

        {/* ── OPÇÕES ── */}
        {activeModule && opcoes.length > 0 && (
          <div style={{ width: '230px', background: optBg, borderRight: `1px solid ${optBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ padding: '6px 12px', background: '#880000', borderBottom: `1px solid ${hdrBorder}`, fontSize: '10px', fontWeight: '700', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
              OPÇÕES
            </div>
            {opcoes.map(op => {
              const isCurrentRoute = op.to && location.pathname.startsWith(op.to);
              return (
                <div key={op.num}
                  onClick={() => clickOpcao(op)}
                  style={{
                    padding: '8px 12px', cursor: op.disabled ? 'default' : 'pointer',
                    fontSize: '11px', fontWeight: isCurrentRoute ? '700' : '400',
                    color: op.disabled ? '#aaa' : isCurrentRoute ? '#880000' : dark ? '#ccc' : '#222',
                    background: isCurrentRoute ? (dark ? '#2a2a1a' : '#e8e4d8') : 'transparent',
                    borderBottom: `1px solid ${optBorder}`,
                    display: 'flex', gap: '8px', alignItems: 'center',
                    borderLeft: isCurrentRoute ? '3px solid #880000' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!op.disabled && !isCurrentRoute) (e.currentTarget as HTMLDivElement).style.background = dark ? '#252510' : '#dddad0'; }}
                  onMouseLeave={e => { if (!isCurrentRoute) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '11px', color: '#888', minWidth: '14px' }}>{op.num}</span>
                  <span>{op.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTEÚDO ── */}
        <div style={{ flex: 1, background: mainBg, overflow: 'auto', position: 'relative' }}>
          <Outlet />
          {altF1 && <LabAltF1 onClose={() => setAltF1(false)} />}
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{ background: hdrBg, color: hdrTxt, padding: '3px 16px', fontSize: '11px', borderTop: `2px solid ${hdrBorder}`, display: 'flex', justifyContent: 'space-between', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>
        <span>▶ SELECIONE A OPÇÃO DESEJADA</span>
        <span style={{ color: dark ? '#ff4444' : '#cc8888' }}>UpÓticas Lab v1.0</span>
      </div>
    </div>
  );
}
