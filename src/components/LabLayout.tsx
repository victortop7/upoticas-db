import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LabAltF1 from './LabAltF1';
import { applyLabTheme } from '../lib/labTheme';

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
  C: [],
  D: [],
  E: [],
  F: [],
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
  const isAdminPage = location.pathname === '/lab/admin'; // admin nunca é bloqueado por licença
  const licStatus = calcLicenseStatus(tenant);

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  // Aplica o tema (claro/escuro) no <html> — faz TODAS as páginas do lab mudarem juntas
  useEffect(() => { applyLabTheme(dark); }, [dark]);

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
      <div style={{ minHeight: '100vh', background: 'var(--lab-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
        <div style={{ color: 'var(--lab-accent)', fontWeight: 'bold' }}>AGUARDE...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (tenant?.tipo !== 'lab') return <Navigate to="/dashboard" replace />;

  async function handleLogout() { await logout(); navigate('/login'); }

  const MODULO_ROTA: Partial<Record<ModuleKey, string>> = {
    B: '/lab/oticas',
    C: '/lab/fornecedores',
    D: '/lab/servicos',
    E: '/lab/estoque',
    F: '/lab/estoque',
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

  const hdrBg     = 'var(--lab-hdr)';
  const hdrBorder = 'var(--lab-hdr-bdr)';
  const hdrTxt    = dark ? 'var(--lab-hdr-txt)' : 'var(--lab-hdr-txt)';
  const mainBg    = 'var(--lab-bg)';
  const modBg     = 'var(--lab-hdr)';
  const modBorder = 'var(--lab-hdr-bdr)';

  const opcoes = activeModule ? OPCOES[activeModule] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Montserrat', sans-serif", background: mainBg }}>

      {/* ── HEADER ── */}
      <div style={{ background: hdrBg, color: hdrTxt, padding: '4px 16px', fontSize: '13px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${hdrBorder}`, letterSpacing: '1.5px', textTransform: 'uppercase', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/lab/dashboard')}>Connect LAB — {tenant?.nome || 'Laboratório'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setAltF1(true)} title="ALT+F1"
            style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', color: hdrTxt, border: `1px solid ${hdrBorder}`, borderRadius: '2px', cursor: 'pointer', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
            🔍 ALT+F1
          </button>
          <span style={{ fontSize: '11px', color: 'var(--lab-hdr-txt)' }}>{usuario?.nome}</span>
          <button onClick={handleLogout}
            style={{ padding: '2px 10px', fontSize: '11px', background: 'var(--lab-accent)', color: '#ffffff', border: '1px solid var(--lab-hdr-bdr)', borderRadius: '2px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>
            SAIR
          </button>
        </div>
      </div>

      {/* ── AVISO DE VENCIMENTO ── */}
      {!licStatus.blocked && !licStatus.expired && licStatus.daysLeft !== null && licStatus.daysLeft <= 3 && (
        <div style={{ background: licStatus.daysLeft === 1 ? 'var(--lab-accent)' : licStatus.daysLeft === 2 ? '#aa4400' : '#886600', color: '#fff', padding: '5px 16px', fontSize: '12px', fontWeight: '700', textAlign: 'center', letterSpacing: '1px', fontFamily: "'Courier New', monospace", flexShrink: 0 }}>
          ⚠ ATENÇÃO: {licStatus.daysLeft === 1 ? 'ÚLTIMO DIA' : `${licStatus.daysLeft} DIAS RESTANTES`} — ENTRE EM CONTATO PARA RENOVAR SUA LICENÇA ⚠
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── SIDEBAR LOGO ── */}
        <div style={{ background: modBg, width: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderRight: `2px solid ${modBorder}`, flexShrink: 0 }}>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--lab-hdr-txt)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', userSelect: 'none' }}>CONNECT</div>
          <div style={{ color: 'var(--lab-hdr-txt)', fontSize: '16px' }}>🔬</div>
          <div style={{ writingMode: 'vertical-rl', color: 'var(--lab-hdr-txt)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase' }}>LAB</div>
        </div>

        {/* ── MÓDULOS ── */}
        <div style={{ width: '240px', background: 'var(--lab-alt)', borderRight: `2px solid ${modBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ background: 'var(--lab-hdr)', color: 'var(--lab-hdr-txt)', textAlign: 'center', padding: '5px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', border: '1px solid var(--lab-hdr-bdr)', boxShadow: 'var(--lab-sh)', borderBottom: 'none' }}>
            MÓDULOS
          </div>
          <div style={{ border: '1px solid var(--lab-bdr)', boxShadow: 'var(--lab-sh-sm)' }}>
            {/* Painel Principal */}
            <div onClick={() => { setActiveModule(null); navigate('/lab/dashboard'); }}
              style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${'var(--lab-bdr)'}`, background: isDashboard ? 'var(--lab-accent)' : ('var(--lab-alt)'), color: isDashboard ? 'var(--lab-hdr-txt)' : ('var(--lab-txt)'), cursor: 'pointer', userSelect: 'none' }}
              onMouseEnter={e => { if (!isDashboard) (e.currentTarget as HTMLElement).style.background = 'var(--lab-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lab-hdr-txt)'; }}
              onMouseLeave={e => { if (!isDashboard) { (e.currentTarget as HTMLElement).style.background = 'var(--lab-alt)'; (e.currentTarget as HTMLElement).style.color = 'var(--lab-txt)'; } }}>
              <span style={{ fontSize: '15px', width: '26px', textAlign: 'center', flexShrink: 0 }}>🏠</span>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>PAINEL PRINCIPAL</span>
            </div>
            {MODULOS.map((m, i) => {
              const isActive = activeModule === m.letra && !isDashboard;
              const rowBg = isActive ? 'var(--lab-accent)' : (i % 2 === 0 ? ('var(--lab-alt)') : ('var(--lab-panel)'));
              return (
                <div key={m.letra} onClick={() => clickModule(m.letra, m.ativo)}
                  style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${'var(--lab-bdr)'}`, background: rowBg, color: isActive ? 'var(--lab-hdr-txt)' : (m.ativo ? ('var(--lab-txt)') : ('var(--lab-dim)')), cursor: m.ativo ? 'pointer' : 'default', opacity: m.ativo ? 1 : 0.5, userSelect: 'none', transition: 'background 0.08s' }}
                  onMouseEnter={e => { if (m.ativo && !isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--lab-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lab-hdr-txt)'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = rowBg; (e.currentTarget as HTMLElement).style.color = isActive ? 'var(--lab-hdr-txt)' : (m.ativo ? ('var(--lab-txt)') : ('var(--lab-dim)')); } }}>
                  <span style={{ fontSize: '15px', width: '26px', textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{m.nome}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? 'var(--lab-hdr-txt)' : ('var(--lab-accent)'), width: '18px', textAlign: 'right', flexShrink: 0 }}>{m.letra}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── OPÇÕES ── */}
        {activeModule && opcoes.length > 0 && (
          <div style={{ width: '240px', background: 'var(--lab-alt)', borderRight: `2px solid ${modBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ background: 'var(--lab-hdr)', color: 'var(--lab-hdr-txt)', textAlign: 'center', padding: '5px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', border: '1px solid var(--lab-hdr-bdr)', boxShadow: 'var(--lab-sh)', borderBottom: 'none' }}>
              OPÇÕES
            </div>
            <div style={{ border: '1px solid var(--lab-bdr)', boxShadow: 'var(--lab-sh-sm)' }}>
              {opcoes.map((op, i) => {
                const currentFull = location.pathname + location.search;
                const isCurrentRoute = !!(op.to && (
                  op.to.includes('?')
                    ? currentFull === op.to
                    : location.pathname === op.to
                ));
                const rowBg = isCurrentRoute ? 'var(--lab-accent)' : (i % 2 === 0 ? ('var(--lab-alt)') : ('var(--lab-panel)'));
                return (
                  <div key={op.num} onClick={() => clickOpcao(op)}
                    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${'var(--lab-bdr)'}`, background: rowBg, color: isCurrentRoute ? 'var(--lab-hdr-txt)' : (op.disabled ? ('var(--lab-dim)') : ('var(--lab-txt)')), cursor: op.disabled ? 'default' : 'pointer', userSelect: 'none', transition: 'background 0.08s' }}
                    onMouseEnter={e => { if (!op.disabled && !isCurrentRoute) { (e.currentTarget as HTMLElement).style.background = 'var(--lab-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lab-hdr-txt)'; } }}
                    onMouseLeave={e => { if (!isCurrentRoute) { (e.currentTarget as HTMLElement).style.background = rowBg; (e.currentTarget as HTMLElement).style.color = op.disabled ? ('var(--lab-dim)') : ('var(--lab-txt)'); } }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '12px', color: isCurrentRoute ? 'var(--lab-hdr-txt)' : ('var(--lab-accent)'), width: '20px', flexShrink: 0 }}>{op.num}</span>
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
        <span style={{ color: 'var(--lab-hdr-txt)' }}>Connect LAB v1.0</span>
      </div>

      {/* ── OVERLAY BLOQUEIO/EXPIRADO (admin é isento) ── */}
      {(licStatus.blocked || licStatus.expired) && !isAdminPage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
          <div style={{ background: 'linear-gradient(180deg,#001a00,#002a00)', border: '3px outset var(--lab-accent)', borderRadius: '4px', padding: '40px 60px', maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <div style={{ color: '#44cc55', fontSize: '20px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>
              {licStatus.blocked ? 'SISTEMA BLOQUEADO' : 'LICENÇA EXPIRADA'}
            </div>
            <div style={{ color: 'var(--lab-hdr-txt)', fontSize: '13px', lineHeight: '1.8', marginBottom: '24px' }}>
              {licStatus.message}
            </div>
            <div style={{ color: 'var(--lab-hdr-txt)', fontSize: '12px', padding: '12px', background: 'rgba(0,85,0,0.3)', border: '1px solid var(--lab-accent)', borderRadius: '2px', marginBottom: '20px' }}>
              Entre em contato com o suporte para regularizar o acesso ao sistema.
            </div>
            <button onClick={handleLogout}
              style={{ padding: '8px 24px', fontSize: '12px', fontWeight: 'bold', background: 'var(--lab-accent)', color: 'var(--lab-hdr-txt)', border: '2px outset var(--lab-hdr-bdr)', borderRadius: '2px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SAIR DO SISTEMA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
