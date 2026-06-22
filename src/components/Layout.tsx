import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BuscaGlobal from './BuscaGlobal';
import { useAuth } from '../hooks/useAuth';

// WhatsApp do suporte para renovação (troque pelo número oficial)
const SUPORTE_WHATSAPP = '5585991507887';

type LicencaStatus = { tipo: 'ok' | 'aviso' | 'bloqueado'; dias?: number; motivo?: string };

function avaliarLicenca(tenant: { plano?: string; trial_expira?: string; licenca_expira?: string; bloqueado?: boolean } | null): LicencaStatus {
  if (!tenant) return { tipo: 'ok' };
  const now = Date.now();
  const dias = (d?: string) => (d ? Math.ceil((new Date(d).getTime() - now) / 86400000) : null);

  if (tenant.bloqueado) return { tipo: 'bloqueado', motivo: 'Acesso bloqueado' };

  if (tenant.plano === 'trial') {
    const d = dias(tenant.trial_expira);
    if (d !== null && d < 0) return { tipo: 'bloqueado', motivo: 'Período de teste expirado' };
    if (d !== null && d <= 5) return { tipo: 'aviso', dias: d, motivo: 'trial' };
  } else if (tenant.licenca_expira) {
    const d = dias(tenant.licenca_expira);
    if (d !== null && d < 0) return { tipo: 'bloqueado', motivo: 'Licença expirada' };
    if (d !== null && d <= 7) return { tipo: 'aviso', dias: d, motivo: 'licenca' };
  }
  return { tipo: 'ok' };
}

function BloqueioOverlay({ motivo }: { motivo?: string }) {
  const msg = encodeURIComponent('Olá! Quero renovar minha licença do Connect Óticas.');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,10,18,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '32px 30px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30 }}>🔒</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{motivo || 'Acesso expirado'}</h2>
        <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Seus dados estão <strong style={{ color: 'var(--text)' }}>salvos e seguros</strong> — nada foi perdido. Para continuar usando o sistema, renove sua licença.
        </p>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: 'var(--text-muted)' }}>Assim que renovar, tudo volta a aparecer normalmente.</p>
        <a href={`https://wa.me/${SUPORTE_WHATSAPP}?text=${msg}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', fontSize: 15, fontWeight: 700, background: '#25D366', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.296 19.935l.646-2.352a9.15 9.15 0 01-1.225-4.61C4.72 7.867 8.572 4 13.28 4a8.549 8.549 0 016.073 2.513 8.633 8.633 0 012.511 6.109c-.002 4.767-3.854 8.634-8.562 8.634a8.57 8.57 0 01-4.097-1.04L5.296 19.935z" fillRule="evenodd"/></svg>
          Renovar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

function AvisoBanner({ dias, motivo }: { dias?: number; motivo?: string }) {
  const msg = encodeURIComponent('Olá! Quero renovar minha licença do Connect Óticas.');
  const texto = motivo === 'trial'
    ? (dias === 0 ? 'Seu período de teste expira hoje!' : `Seu período de teste expira em ${dias} dia${dias === 1 ? '' : 's'}.`)
    : (dias === 0 ? 'Sua licença expira hoje!' : `Sua licença expira em ${dias} dia${dias === 1 ? '' : 's'}.`);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 16px', background: 'linear-gradient(90deg, #d97706, #f59e0b)', color: 'white', fontSize: 13, fontWeight: 600, flexWrap: 'wrap' }}>
      <span>⚠️ {texto} Renove para não perder o acesso.</span>
      <a href={`https://wa.me/${SUPORTE_WHATSAPP}?text=${msg}`} target="_blank" rel="noopener noreferrer"
        style={{ padding: '4px 14px', background: 'rgba(255,255,255,0.95)', color: '#b45309', borderRadius: 999, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Renovar agora
      </a>
    </div>
  );
}

export default function Layout() {
  const { usuario, tenant, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  const licenca = avaliarLicenca(tenant);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        background: 'var(--bg)',
        minHeight: '100vh',
      }}>
        {licenca.tipo === 'aviso' && <AvisoBanner dias={licenca.dias} motivo={licenca.motivo} />}
        <Outlet />
      </main>
      <BuscaGlobal />
      {licenca.tipo === 'bloqueado' && <BloqueioOverlay motivo={licenca.motivo} />}
    </div>
  );
}
