import { useEffect, useState } from 'react';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
function getPrompt(): BIPEvent | null {
  return (window as unknown as { __pwaPrompt?: BIPEvent | null }).__pwaPrompt ?? null;
}
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

// Botão "Instalar aplicativo" — aparece quando o navegador permite instalar (Chrome/Edge/Android).
// Some quando o app já está instalado. `alwaysShow` mostra instruções mesmo sem o botão nativo.
export default function InstallAppButton({ style, label = 'Instalar aplicativo', alwaysShow = false }:
  { style?: React.CSSProperties; label?: string; alwaysShow?: boolean }) {
  const [prompt, setPrompt] = useState<BIPEvent | null>(() => getPrompt());
  const [installed, setInstalled] = useState(() => isStandalone());
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    const on = () => setPrompt(getPrompt());
    const onI = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('pwa-installable', on);
    window.addEventListener('pwa-installed', onI);
    return () => { window.removeEventListener('pwa-installable', on); window.removeEventListener('pwa-installed', onI); };
  }, []);

  if (installed) return null;
  if (!prompt && !alwaysShow) return null;

  async function instalar() {
    const p = getPrompt();
    if (p) {
      await p.prompt();
      await p.userChoice;
      (window as unknown as { __pwaPrompt?: unknown }).__pwaPrompt = null;
      setPrompt(null);
    } else {
      setAjuda(true);
    }
  }

  return (
    <>
      <button type="button" onClick={instalar} style={style}>⤓ {label}</button>
      {ajuda && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setAjuda(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', color: '#0f172a', borderRadius: '14px', maxWidth: '380px', padding: '22px', fontFamily: "'Inter', sans-serif", boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '10px' }}>Instalar o aplicativo</div>
            <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
              No <b>Chrome</b> ou <b>Edge</b> (computador): clique no ícone <b>⊕ / monitor com seta</b> na barra de endereço, ou no menu <b>⋮ → Instalar Conexão Óticas</b>.<br /><br />
              No <b>celular/tablet</b>: menu do navegador → <b>Adicionar à tela inicial</b>.<br /><br />
              Um ícone será criado e o app abrirá em janela própria, direto no login.
            </div>
            <button onClick={() => setAjuda(false)} style={{ marginTop: '16px', width: '100%', padding: '10px', fontSize: '14px', fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer' }}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
