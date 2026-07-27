import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registra o service worker (habilita "Instalar como app"; não cacheia — updates seguem automáticos)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app-sw.js').catch(() => { /* silencioso */ });
  });
}

// Guarda o evento de instalação para o botão "Instalar aplicativo"
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as unknown as { __pwaPrompt?: unknown }).__pwaPrompt = e;
  window.dispatchEvent(new Event('pwa-installable'));
});
window.addEventListener('appinstalled', () => {
  (window as unknown as { __pwaPrompt?: unknown }).__pwaPrompt = null;
  window.dispatchEvent(new Event('pwa-installed'));
});
