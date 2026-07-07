import { useState, useEffect } from 'react';

// Bloqueia o uso em modo retrato (em pé) em telas de celular, pedindo para girar.
// No app nativo Android já é travado em landscape — isto cobre o navegador/web.
export default function ForcarPaisagem() {
  // Bloqueia qualquer tela em pé (retrato) — celular e tablet. O app é só deitado.
  const emPe = () => typeof window !== 'undefined'
    && window.innerHeight > window.innerWidth;
  const [retrato, setRetrato] = useState(emPe);

  useEffect(() => {
    const onR = () => setRetrato(emPe());
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, []);

  if (!retrato) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: '#060a16', color: '#e8ecf5',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: 28, textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ animation: 'girarAvi 1.8s ease-in-out infinite' }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3ba6ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="3" width="10" height="18" rx="2" /><line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      </div>
      <div style={{ fontSize: 19, fontWeight: 800 }}>Gire o aparelho</div>
      <div style={{ fontSize: 14, color: '#8a93a8', maxWidth: 300, lineHeight: 1.5 }}>
        O Connect Vision funciona na <b style={{ color: '#3ba6ff' }}>horizontal</b> (deitado). Vire o dispositivo para continuar.
      </div>
      <style>{`@keyframes girarAvi { 0%, 55%, 100% { transform: rotate(0deg); } 75%, 90% { transform: rotate(-90deg); } }`}</style>
    </div>
  );
}
