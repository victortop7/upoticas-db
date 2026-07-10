import { useState, useEffect } from 'react';

// Splash de abertura: logo + barra enchendo até 100% (~3s), depois some.
// Mostra 1x por sessão do app (não reaparece ao navegar).
const KEY = 'cv_splashed';

export default function SplashVision() {
  const [show, setShow] = useState(() => {
    try { return sessionStorage.getItem(KEY) !== '1'; } catch { return true; }
  });
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    const DURATION = 2600; // barra enchendo
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2); // desacelera no fim
      setProgress(eased * 100);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { setFade(true); setTimeout(() => setShow(false), 380); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000, background: '#060a16',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      opacity: fade ? 0 : 1, transition: 'opacity .38s ease', pointerEvents: fade ? 'none' : 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Glow de fundo */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 52% 42% at 50% 42%, rgba(0,122,255,0.24), transparent 66%)' }} />

      {/* Logo + marca */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <img src="/vision-icon.png" alt="Connect Vision" style={{
          width: 92, height: 92, borderRadius: 22, objectFit: 'cover', display: 'block', margin: '0 auto 16px',
          boxShadow: '0 12px 44px rgba(0,122,255,0.55), 0 0 0 1px rgba(120,170,255,0.2)',
          animation: 'splashPop .5s ease',
        }} />
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.5px' }}>
          Connect <span style={{ color: '#3ba6ff' }}>Vision</span>
        </div>
      </div>

      {/* Barra de carregamento */}
      <div style={{ position: 'relative', width: 200, height: 6, borderRadius: 999, background: 'rgba(120,170,255,0.15)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`, borderRadius: 999,
          background: 'linear-gradient(90deg, #007aff, #3ba6ff)', boxShadow: '0 0 12px rgba(59,166,255,0.7)',
          transition: 'width .05s linear',
        }} />
      </div>
      <div style={{ position: 'relative', fontSize: 12, color: 'rgba(180,205,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(progress)}%
      </div>

      <style>{`@keyframes splashPop { from { transform: scale(.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
