import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LabAltF1 from './LabAltF1';
import { applyLabTheme } from '../lib/labTheme';
import LabIcon, { type IconName } from './LabIcon';

type ModuleKey = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';
type Opcao = { num: number; label: string; to?: string; disabled?: boolean };

const MODULOS: { letra: ModuleKey; nome: string; icon: IconName; ativo: boolean }[] = [
  { letra: 'B', nome: 'ÓTICAS CLIENTES',           icon: 'store',     ativo: true  },
  { letra: 'C', nome: 'FORNECEDORES',              icon: 'factory',   ativo: true  },
  { letra: 'D', nome: 'CADASTRO DE PRODUTOS',      icon: 'box',       ativo: true  },
  { letra: 'E', nome: 'ESTOQUE',                   icon: 'layers',    ativo: true  },
  { letra: 'G', nome: 'VENDAS/ORDENS DE SERVIÇOS', icon: 'clipboard', ativo: true  },
  { letra: 'H', nome: 'CONTROLE DE FLUXO',         icon: 'flow',      ativo: true  },
  { letra: 'I', nome: 'NOTAS FISCAIS/FECHAMENTOS', icon: 'invoice',   ativo: false },
  { letra: 'J', nome: 'FATURAMENTO',               icon: 'billing',   ativo: true  },
  { letra: 'K', nome: 'CONTAS A RECEBER/PAGAR',    icon: 'wallet',    ativo: true  },
  { letra: 'L', nome: 'CONTROLE BANCÁRIO',         icon: 'bank',      ativo: true  },
  { letra: 'A', nome: 'CONFIGURAÇÕES',             icon: 'settings',  ativo: true  },
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
    { num: 5, label: 'RASTREIO / GPS DA OS',      to: '/lab/rastreio' },
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
  if (path.includes('/lab/fluxo') || path.includes('/lab/rastreio')) return 'H';
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
  const [railOpen, setRailOpen] = useState(false);
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

  const mainBg    = 'var(--lab-bg)';
  const modBg     = 'var(--lab-hdr)';
  const modBorder = 'var(--lab-hdr-bdr)';

  const opcoes = activeModule ? OPCOES[activeModule] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Montserrat', sans-serif", background: mainBg }}>

      {/* ── AVISO DE VENCIMENTO ── */}
      {!licStatus.blocked && !licStatus.expired && licStatus.daysLeft !== null && licStatus.daysLeft <= 3 && (
        <div style={{ background: licStatus.daysLeft === 1 ? 'var(--lab-accent)' : licStatus.daysLeft === 2 ? '#aa4400' : '#886600', color: '#fff', padding: '5px 16px', fontSize: '12px', fontWeight: '700', textAlign: 'center', letterSpacing: '1px', fontFamily: "'Courier New', monospace", flexShrink: 0 }}>
          ⚠ ATENÇÃO: {licStatus.daysLeft === 1 ? 'ÚLTIMO DIA' : `${licStatus.daysLeft} DIAS RESTANTES`} — ENTRE EM CONTATO PARA RENOVAR SUA LICENÇA ⚠
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── MENU LATERAL (faixa verde que expande ao encostar o mouse, empurrando o conteúdo) ── */}
        <div
          onMouseEnter={() => setRailOpen(true)}
          onMouseLeave={() => setRailOpen(false)}
          style={{
            width: railOpen ? '252px' : '52px',
            flexShrink: 0,
            background: modBg, borderRight: `1px solid ${modBorder}`,
            boxShadow: railOpen ? 'var(--lab-sh)' : 'none',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'width .18s ease, box-shadow .18s ease',
          }}>

            {/* topo — logo / nome do laboratório */}
            <div onClick={() => { setRailOpen(false); setActiveModule(null); navigate('/lab/dashboard'); }}
              title="Painel principal"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 10px 16px', cursor: 'pointer', borderBottom: `1px solid ${modBorder}`, flexShrink: 0, userSelect: 'none' }}>
              <span style={{ width: '20px', display: 'flex', justifyContent: 'center', flexShrink: 0, color: 'var(--lab-hdr-txt)' }}><LabIcon name="lens" size={20} /></span>
              <span style={{ whiteSpace: 'nowrap', opacity: railOpen ? 1 : 0, transition: 'opacity .15s', color: 'var(--lab-hdr-txt)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Connect LAB
              </span>
            </div>

            {/* módulos */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {[{ letra: null as ModuleKey | null, nome: 'Painel Principal', icon: 'home' as IconName, ativo: true }, ...MODULOS].map(m => {
                const isActive = m.letra === null ? isDashboard : (activeModule === m.letra && !isDashboard);
                return (
                  <div key={m.letra ?? 'home'}
                    onClick={() => { if (m.letra === null) { setActiveModule(null); navigate('/lab/dashboard'); } else { clickModule(m.letra, m.ativo); } }}
                    title={m.nome}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0 9px 16px',
                      background: isActive ? 'var(--lab-accent)' : 'transparent',
                      color: isActive ? 'var(--lab-on-accent)' : 'var(--lab-hdr-txt)',
                      cursor: m.ativo ? 'pointer' : 'default', opacity: m.ativo ? 1 : 0.45,
                      userSelect: 'none', transition: 'background .1s',
                    }}
                    onMouseEnter={e => { if (m.ativo && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ width: '20px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}><LabIcon name={m.icon} size={17} /></span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', opacity: railOpen ? 1 : 0, transition: 'opacity .15s', fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{m.nome}</span>
                    {m.letra && (
                      <span style={{ opacity: railOpen ? 0.75 : 0, transition: 'opacity .15s', fontSize: '12px', fontWeight: '700', paddingRight: '12px', flexShrink: 0 }}>{m.letra}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* rodapé — busca, usuário e sair */}
            <div style={{ borderTop: `1px solid ${modBorder}`, flexShrink: 0, paddingBottom: '4px' }}>
              <div onClick={() => setAltF1(true)} title="Busca rápida (ALT+F1)"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0 9px 16px', cursor: 'pointer', color: 'var(--lab-hdr-txt)', userSelect: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: '20px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}><LabIcon name="search" size={16} /></span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', opacity: railOpen ? 1 : 0, transition: 'opacity .15s', fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Buscar (ALT+F1)</span>
              </div>
              <div onClick={handleLogout} title={`Sair — ${usuario?.nome ?? ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0 9px 16px', cursor: 'pointer', color: 'var(--lab-hdr-txt)', userSelect: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: '20px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}><LabIcon name="power" size={16} /></span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: railOpen ? 1 : 0, transition: 'opacity .15s', fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Sair — {usuario?.nome}
                </span>
              </div>
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
                    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: `1px solid ${'var(--lab-bdr)'}`, background: rowBg, color: isCurrentRoute ? 'var(--lab-on-accent)' : (op.disabled ? ('var(--lab-dim)') : ('var(--lab-txt)')), cursor: op.disabled ? 'default' : 'pointer', userSelect: 'none', transition: 'background 0.08s' }}
                    onMouseEnter={e => { if (!op.disabled && !isCurrentRoute) { (e.currentTarget as HTMLElement).style.background = 'var(--lab-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lab-accent)'; } }}
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
              style={{ padding: '8px 24px', fontSize: '12px', fontWeight: 'bold', background: 'var(--lab-accent)', color: 'var(--lab-on-accent)', border: '2px outset var(--lab-hdr-bdr)', borderRadius: '2px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SAIR DO SISTEMA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
