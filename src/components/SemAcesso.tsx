import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Sistema } from '../types';

const NOMES: Record<Sistema, string> = { otica: 'Connect Óticas', lab: 'Connect LAB', vision: 'Connect Vision' };
const HOME: Record<Sistema, string> = { otica: '/dashboard', lab: '/lab/dashboard', vision: '/vision' };
const SUPORTE_WHATSAPP = '5585991507887';

// Mostrada quando a conta entrou num sistema que não foi liberado no admin.
export default function SemAcesso({ sistema, login }: { sistema: Sistema; login: string }) {
  const { tenant, logout } = useAuth();
  const navigate = useNavigate();
  const liberados = (tenant?.sistemas || []).filter(s => s !== sistema);
  const msg = encodeURIComponent(`Olá! Quero liberar o ${NOMES[sistema]} na minha conta (${tenant?.email || ''}).`);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b10', padding: 20, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#13151d', border: '1px solid #232634', borderRadius: 16, padding: '30px 28px', maxWidth: 420, width: '100%', textAlign: 'center', color: '#e8e8ed' }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>🔐</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700 }}>Sua conta não tem o {NOMES[sistema]}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#8a8c9c', lineHeight: 1.6 }}>
          O login está certo, mas esse sistema ainda não foi liberado pra <b style={{ color: '#e8e8ed' }}>{tenant?.nome}</b>.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {liberados.map(s => (
            <button key={s} onClick={() => navigate(HOME[s], { replace: true })}
              style={{ padding: 11, fontSize: 14, fontWeight: 700, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              Ir para o {NOMES[s]}
            </button>
          ))}
          <a href={`https://wa.me/${SUPORTE_WHATSAPP}?text=${msg}`} target="_blank" rel="noopener noreferrer"
            style={{ padding: 11, fontSize: 14, fontWeight: 700, background: '#25D366', color: '#fff', borderRadius: 10, textDecoration: 'none' }}>
            Pedir liberação no WhatsApp
          </a>
          <button onClick={async () => { await logout(); navigate(login, { replace: true }); }}
            style={{ padding: 10, fontSize: 13.5, fontWeight: 600, background: 'transparent', color: '#8a8c9c', border: '1px solid #232634', borderRadius: 10, cursor: 'pointer' }}>
            Entrar com outra conta
          </button>
        </div>
      </div>
    </div>
  );
}
