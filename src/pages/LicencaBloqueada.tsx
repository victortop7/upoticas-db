import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function LicencaBloqueada() {
  const [params] = useSearchParams();
  const reason = params.get('reason') || 'expired';
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(t);
  }, []);

  const isBlocked = reason === 'blocked';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#c8c4b0', fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '16px' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg,#005500,#008800)',
          color: '#ccffcc', padding: '10px 20px',
          fontSize: '13px', fontWeight: '700', letterSpacing: '2px',
          border: '2px outset #007700', textAlign: 'center', textTransform: 'uppercase',
        }}>
          UPÓTICAS — SISTEMA DE GESTÃO
        </div>

        {/* Panel */}
        <div style={{ background: '#d4d0c8', border: '2px inset #b0aca4', padding: '32px 28px', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>
            {isBlocked ? '🔒' : '⏰'}
          </div>

          {/* Title */}
          <div style={{
            fontSize: '15px', fontWeight: '700', color: '#005500',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px',
            fontFamily: "'Courier New', monospace",
          }}>
            {isBlocked ? 'ACESSO BLOQUEADO' : 'LICENÇA EXPIRADA'}
          </div>

          {/* Message */}
          <div style={{ fontSize: '12px', color: '#444', marginBottom: '24px', lineHeight: '1.6' }}>
            {isBlocked
              ? 'Seu acesso ao sistema foi bloqueado pelo administrador.'
              : 'Seu período de acesso ao sistema expirou.'}
            <br />
            Entre em contato para regularizar sua situação{dots}
          </div>

          {/* Contact box */}
          <div style={{
            background: '#efffef', border: '2px outset #006600',
            padding: '16px 20px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#006600', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Fale com a Conexão Óticas
            </div>
            <a
              href="https://wa.me/5585999999999"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block', padding: '8px 24px',
                background: '#25D366', color: '#fff',
                fontWeight: '700', fontSize: '13px', textDecoration: 'none',
                border: '2px outset #1da851', fontFamily: 'inherit',
                letterSpacing: '0.5px',
              }}
            >
              📱 WHATSAPP
            </a>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#555', fontFamily: "'Courier New', monospace" }}>
              victormarketing093@gmail.com
            </div>
          </div>

          {/* Try login again */}
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '6px 20px', fontSize: '11px', fontWeight: '700',
              background: '#d4d0c8', color: '#000',
              border: '2px outset #b0aca4', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}
          >
            ← Voltar ao Login
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#888', fontFamily: "'Courier New', monospace" }}>
          UPÓTICAS LAB V1.0 — SISTEMA DE GESTÃO PARA LABORATÓRIOS ÓPTICOS
        </div>
      </div>
    </div>
  );
}
