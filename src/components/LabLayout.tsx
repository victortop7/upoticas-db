import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LabAltF1 from './LabAltF1';

type ModuleKey = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';
type Opcao = { num: number; label: string; to?: string; disabled?: boolean };

const MODULOS: { letra: ModuleKey; nome: string; icon: string; ativo: boolean }[] = [
  { letra: 'A', nome: 'CONFIGURAÇÕES',             icon: '⚙',  ativo: true  },
  { letra: 'B', nome: 'ÓTICAS CLIENTES',           icon: '🏪', ativo: true  },
  { letra: 'C', nome: 'FORNECEDORES/OFTALMOS',     icon: '🏭', ativo: true  },
  { letra: 'D', nome: 'CADASTRO DE PRODUTOS',      icon: '📦', ativo: true  },
  { letra: 'E', nome: 'CADASTRO DE ESTOQUE',       icon: '🗂️', ativo: true  },
  { letra: 'F', nome: 'MOVIMENTAÇÃO DE ESTOQUE',   icon: '🔄', ativo: true  },
  { letra: 'G', nome: 'VENDAS/ORDENS DE SERVIÇOS', icon: '📋', ativo: true  },
  { letra: 'H', nome: 'CONTROLE DE FLUXO',         icon: '⚡', ativo: true  },
  { letra: 'I', nome: 'NOTAS FISCAIS/FECHAMENTOS', icon: '🧾', ativo: false },
  { letra: 'J', nome: 'FATURAMENTO',               icon: '💰', ativo: true  },
  { letra: 'K', nome: 'CONTAS A RECEBER/PAGAR',    icon: '📥', ativo: true  },
  { letra: 'L', nome: 'CONTROLE BANCÁRIO',         icon: '🏛️', ativo: true  },
];

const OPCOES: Record<ModuleKey, Opcao[]> = {
  A: [
    { num: 1, label: 'NUMERAÇÃO DE DOCUMENTOS',    to: '/lab/configuracoes?opcao=numeracao' },
    { num: 2, label: 'DADOS DO LABORATÓRIO',        to: '/lab/configuracoes?opcao=dados_lab' },
    { num: 3, label: 'PARÂMETROS DO SISTEMA',       to: '/lab/configuracoes?opcao=parametros' },
    { num: 4, label: 'TABELAS DO SISTEMA',          to: '/lab/configuracoes?opcao=tabelas' },
    { num: 5, label: 'CADASTRO DE TRANSPORTADORAS', to: '/lab/transportadoras' },
    { num: 6, label: 'CADASTRO DE OPERADORES',      to: '/lab/operadores' },
  ],
  B: [],
  C: [
    { num: 1, label: 'INCLUIR FORNECEDOR', to: '/lab/fornecedores' },
    { num: 2, label: 'ALTERAR DADOS',      to: '/lab/fornecedores' },
    { num: 4, label: 'CONSULTA/LISTAGEM',  to: '/lab/fornecedores' },
  ],
  D: [],
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
    { num: 1, label: 'LANÇAR FLUXO/INDIVIDUAL',  to: '/lab/fluxo' },
    { num: 2, label: 'LANÇAR FLUXO/SETOR',       to: '/lab/fluxo' },
    { num: 3, label: 'LEITURA CÓDIGO DE BARRAS',  to: '/lab/fluxo/scan' },
    { num: 4, label: 'CONSULTA/PRODUÇÃO',         to: '/lab/fluxo' },
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
  if (path.includes('/lab/produtos')) return 'D';
  if (path.includes('/lab/estoque')) return 'E';
  if (path.includes('/lab/ordens')) return 'G';
  if (path.includes('/lab/relatorios')) return 'G';
  if (path.includes('/lab/fluxo')) return 'H';
  if (path.includes('/lab/faturamento')) return 'J';
  if (path.includes('/lab/vendedores')) return 'J';
  if (path.includes('/lab/servicos') || path.includes('/lab/produtos')) return 'D';
  if (path.includes('/lab/contas-receber')) return 'K';
  if (path.includes('/lab/contas-pagar')) return 'K';
  if (path.includes('/lab/bancario')) return 'L';
  return null;
}

function calcLicenseStatus(tenant: { plano?: string; trial_expira?: string; licenca_expira?: string; bloqueado?: boolean; ativo?: boolean } | null) {
  if (!tenant) return { blocked: false, expired: false, daysLeft: null, message: '' };

  if (!tenant.ativo || tenant.bloqueado) {
    return { blocked: true, expired: false, daysLeft: null, message: 'Acesso bloqueado. Entre em contato com o suporte.' };
  }

  const expira = tenant.plano === 'trial' ? tenant.trial_expira : tenant.licenca_expira;
  if (!expira) return { blocked: false, expired: false, daysLeft: null, message: '' };

  const now = new Date();
  const exp = new Date(expira);
  const diffMs = exp.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    const label = tenant.plano === 'trial' ? 'Período de teste expirado.' : 'Licença expirada.';
    return { blocked: false, expired: true, daysLeft: 0, message: `${label} Entre em contato para renovar.` };
  }

  return { blocked: false, expired: false, daysLeft, message: '' };
}

export default function LabLayout() {
  const { usuario, tenant, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');
  const [altF1, setAltF1] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(() => detectModule(location.pathname));
  const isDashboard = location.pathname === '/lab/dashboard';
  const licStatus = calcLicenseStatus(tenant);

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'F1') { e.preventDefault(); setAltF1(v => !v); return; }
      if (e.key === 'Escape') {
        if (altF1) { setAltF1(false); return; }
        // ESC: se tem módulo ativo, deseleciona e volta ao dashboard
        if (activeModule) { setActiveModule(null); navigate('/lab/dashboard'); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [altF1, activeModule, navigate]);

  // Auto-detect module from route — always update, even to null
  useEffect(() => {
    setActiveModule(detectModule(location.pathname));
  }, [location.pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#c8c4b0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
        <div style={{ color: '#005500', fontWeight: 'bold' }}>AGUARDE...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (tenant?.tipo !== 'lab') return <Navigate to="/dashboard" replace />;

  async function handleLogout() { await logout(); navigate('/login'); }

  const MODULO_ROTA: Partial<Record<ModuleKey, string>> = {
    B: '/lab/oticas',
    D: '/lab/servicos',
  };

  function clickModule(letra: ModuleKey, ativo: boolean) {
    if (!ativo) return;
    if (activeModule === letra) {
      setActiveModule(null);
      navigate('/lab/dashboard');
    } else {
      setActiveModule(letra);
      const firstOp = OPCOES[letra]?.find(op => op.to && !op.disabled);
      if (firstOp?.to) navigate(firstOp.to);
      else if (MODULO_ROTA[letra]) navigate(MODULO_ROTA[letra]!);
    }
  }

  function clickOpcao(op: Opcao) {
    if (op.disabled || !op.to) return;
    navigate(op.to);
  }

  const hdrBg     = dark ? 'linear-gradient(90deg,#004400,#004400)' : 'linear-gradient(90deg,#005500,#008800)';
  const hdrBorder = dark ? '#1a4a1a' : '#007700';
  const hdrTxt    = dark ? '#aaffbb' : '#ccffcc';
  const mainBg    = dark ? '#111111' : '#c8c4b0';
  const modBg     = dark ? 'linear-gradient(180deg,#001a00,#002a00)' : 'linear-gradient(180deg,#005500,#004400)';
  const modBorder = dark ? '#1a3a1a' : '#5a2a2a';

  const opcoes = activeModule ? OPCOES[activeModule] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Montserrat', sans-serif", background: mainBg }}>

      {/* ── HEADER ── */}
      <div style={{ background: hdrBg, color: hdrTxt, padding: '4px 16px', fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${hdrBorder}`, letterSpacing: '1.5px', textTransform: 'uppercase', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/lab/dashboard')}>Conexão Lab — {tenant?.nome || 'Laboratório'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setAltF1(true)} title="ALT+F1"
            style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', color: hdrTxt, border: `1px solid ${hdrBorder}`, borderRadius: '2px', cursor: 'pointer', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
            🔍 ALT+F1
          </button>
          <span style={{ fontSize: '11px', color: dark ? '#66cc77' : '#a0d0a8' }}>{usuario?.nome}</span>
          <button onClick={handleLogout}
            style={{ padding: '2px 10px', fontSize: '11px', background: '#008800', color: '#ffffff', border: '1px solid #44bb44', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>
            SAIR
          </button>
        </div>
      </div>

      {/* ── AVISO DE VENCIMENTO ── */}
      {!licStatus.blocked && !licStatus.expired && licStatus.daysLeft !== null && licStatus.daysLeft <= 3 && (
        <div style={{ background: licStatus.daysLeft === 1 ? '#008800' : licStatus.daysLeft === 2 ? '#aa4400' : '#886600', color: '#fff', padding: '5px 16px', fontSize: '12px', fontWeight: '700', textAlign: 'center', letterSpacing: '1px', fontFamily: "'Courier New', monospace", flexShrink: 0 }}>
          ⚠ ATENÇÃO: {licStatus.daysLeft === 1 ? 'ÚLTIMO DIA' : `${licStatus.daysLeft} DIAS RESTANTES`} — ENTRE EM CONTATO PARA RENOVAR SUA LICENÇA ⚠
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── SIDEBAR LOGO ── */}
        <div style={{ background: modBg, width: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderRight: `2px solid ${modBorder}`, flexShrink: 0 }}>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: dark ? '#66cc77' : '#ccffcc', fontSize: '11px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', userSelect: 'none' }}>CONEXÃO</div>
          <div style={{ color: dark ? '#44cc55' : '#aaffbb', fontSize: '16px' }}>🔬</div>
          <div style={{ writingMode: 'vertical-rl', color: dark ? '#44cc55' : '#aaffbb', fontSize: '10px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase' }}>LAB</div>
        </div>

        {/* ── MÓDULOS ── */}
        <div style={{ width: '240px', background: dark ? '#1c1c1c' : '#d4d0c8', borderRight: `2px solid ${modBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', textAlign: 'center', padding: '5px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', border: `2px outset #007700`, borderBottom: 'none' }}>
            MÓDULOS
          </div>
          <div style={{ border: `2px inset ${dark ? '#444' : '#808080'}` }}>
            {/* Painel Principal */}
            <div onClick={() => { setActiveModule(null); navigate('/lab/dashboard'); }}
              style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${dark ? '#333' : '#b0aca4'}`, background: isDashboard ? '#005500' : (dark ? '#1c1c1c' : '#d4d0c8'), color: isDashboard ? '#ccffcc' : (dark ? '#d8d8d8' : '#000'), cursor: 'pointer', userSelect: 'none' }}
              onMouseEnter={e => { if (!isDashboard) (e.currentTarget as HTMLElement).style.background = '#004400'; (e.currentTarget as HTMLElement).style.color = '#ccffcc'; }}
              onMouseLeave={e => { if (!isDashboard) { (e.currentTarget as HTMLElement).style.background = dark ? '#1c1c1c' : '#d4d0c8'; (e.currentTarget as HTMLElement).style.color = dark ? '#d8d8d8' : '#000'; } }}>
              <span style={{ fontSize: '15px', width: '26px', textAlign: 'center', flexShrink: 0 }}>🏠</span>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>PAINEL PRINCIPAL</span>
            </div>
            {MODULOS.map((m, i) => {
              const isActive = activeModule === m.letra && !isDashboard;
              const rowBg = isActive ? '#005500' : (i % 2 === 0 ? (dark ? '#1c1c1c' : '#d4d0c8') : (dark ? '#222' : '#dedad2'));
              return (
                <div key={m.letra} onClick={() => clickModule(m.letra, m.ativo)}
                  style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${dark ? '#333' : '#b0aca4'}`, background: rowBg, color: isActive ? '#ccffcc' : (m.ativo ? (dark ? '#d8d8d8' : '#000') : (dark ? '#555' : '#aaa')), cursor: m.ativo ? 'pointer' : 'default', opacity: m.ativo ? 1 : 0.5, userSelect: 'none', transition: 'background 0.08s' }}
                  onMouseEnter={e => { if (m.ativo && !isActive) { (e.currentTarget as HTMLElement).style.background = '#004400'; (e.currentTarget as HTMLElement).style.color = '#ccffcc'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = rowBg; (e.currentTarget as HTMLElement).style.color = isActive ? '#ccffcc' : (m.ativo ? (dark ? '#d8d8d8' : '#000') : (dark ? '#555' : '#aaa')); } }}>
                  <span style={{ fontSize: '15px', width: '26px', textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{m.nome}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? '#aaffbb' : (dark ? '#66cc77' : '#005500'), width: '18px', textAlign: 'right', flexShrink: 0 }}>{m.letra}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── OPÇÕES ── */}
        {activeModule && opcoes.length > 0 && (
          <div style={{ width: '240px', background: dark ? '#1c1c1c' : '#d4d0c8', borderRight: `2px solid ${modBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', textAlign: 'center', padding: '5px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', border: `2px outset #007700`, borderBottom: 'none' }}>
              OPÇÕES
            </div>
            <div style={{ border: `2px inset ${dark ? '#444' : '#808080'}` }}>
              {opcoes.map((op, i) => {
                const currentFull = location.pathname + location.search;
                const isCurrentRoute = !!(op.to && (
                  op.to.includes('?')
                    ? currentFull === op.to
                    : location.pathname === op.to
                ));
                const rowBg = isCurrentRoute ? '#005500' : (i % 2 === 0 ? (dark ? '#1c1c1c' : '#d4d0c8') : (dark ? '#222' : '#dedad2'));
                return (
                  <div key={op.num} onClick={() => clickOpcao(op)}
                    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${dark ? '#333' : '#b0aca4'}`, background: rowBg, color: isCurrentRoute ? '#ccffcc' : (op.disabled ? (dark ? '#555' : '#aaa') : (dark ? '#d8d8d8' : '#000')), cursor: op.disabled ? 'default' : 'pointer', userSelect: 'none', transition: 'background 0.08s' }}
                    onMouseEnter={e => { if (!op.disabled && !isCurrentRoute) { (e.currentTarget as HTMLElement).style.background = '#004400'; (e.currentTarget as HTMLElement).style.color = '#ccffcc'; } }}
                    onMouseLeave={e => { if (!isCurrentRoute) { (e.currentTarget as HTMLElement).style.background = rowBg; (e.currentTarget as HTMLElement).style.color = op.disabled ? (dark ? '#555' : '#aaa') : (dark ? '#d8d8d8' : '#000'); } }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '12px', color: isCurrentRoute ? '#aaffbb' : (dark ? '#66cc77' : '#005500'), width: '20px', flexShrink: 0 }}>{op.num}</span>
                    <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{op.label}</span>
                  </div>
                );
              })}
            </div>
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
        <span style={{ color: dark ? '#44cc55' : '#88ccaa' }}>Conexão Lab v1.0</span>
      </div>

      {/* ── OVERLAY BLOQUEIO/EXPIRADO ── */}
      {(licStatus.blocked || licStatus.expired) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
          <div style={{ background: 'linear-gradient(180deg,#001a00,#002a00)', border: '3px outset #005500', borderRadius: '4px', padding: '40px 60px', maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <div style={{ color: '#44cc55', fontSize: '20px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>
              {licStatus.blocked ? 'SISTEMA BLOQUEADO' : 'LICENÇA EXPIRADA'}
            </div>
            <div style={{ color: '#ccffcc', fontSize: '13px', lineHeight: '1.8', marginBottom: '24px' }}>
              {licStatus.message}
            </div>
            <div style={{ color: '#aaffbb', fontSize: '12px', padding: '12px', background: 'rgba(0,85,0,0.3)', border: '1px solid #005500', borderRadius: '2px', marginBottom: '20px' }}>
              Entre em contato com o suporte para regularizar o acesso ao sistema.
            </div>
            <button onClick={handleLogout}
              style={{ padding: '8px 24px', fontSize: '12px', fontWeight: 'bold', background: '#005500', color: '#ccffcc', border: '2px outset #007700', borderRadius: '2px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SAIR DO SISTEMA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
