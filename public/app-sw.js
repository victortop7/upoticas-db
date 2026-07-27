// Service worker mínimo — apenas habilita a instalação como app (PWA).
// NÃO faz cache do sistema, então as atualizações continuam automáticas:
// o app sempre busca a versão mais nova da nuvem.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
// Passa tudo direto para a rede (sem cache do app).
self.addEventListener('fetch', () => { /* network-only */ });
