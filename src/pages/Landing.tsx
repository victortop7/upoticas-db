import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import InstallAppButton from '../components/InstallAppButton';

// ── Paleta clara ──
const G = '#16a34a';       // verde (botões/acento)
const G2 = '#15803d';      // verde escuro
const G3 = '#22c55e';      // verde vivo
const GLOW = 'rgba(22,163,74,';
const BG = '#ffffff';
const BG2 = '#f7faf8';     // seções alternadas
const TX = '#0f172a';      // títulos
const TX2 = '#475569';     // corpo
const TX3 = '#94a3b8';     // suave
const BD = '#e6ebf0';      // bordas
const CARD_SH = '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';

const PRODUTOS = [
  {
    key: 'otica', nome: 'Conexão Óticas', tag: 'Para óticas', cor: '#16a34a',
    desc: 'A gestão completa da loja: clientes, ordens de serviço, vendas, estoque, financeiro e CRM.',
    print: '/prints/otica-dashboard.jpg', cta: 'Começar grátis · 14 dias', to: '/cadastro?tipo=otica',
    bullets: ['Clientes & CRM automático', 'Ordens de serviço com receita', 'Vendas, caixa e financeiro', 'Relatórios gerenciais'],
  },
  {
    key: 'lab', nome: 'Connect LAB', tag: 'Para laboratórios ópticos', cor: '#0891b2',
    desc: 'O chão de fábrica do laboratório: funil de produção, surfaçagem, rastreio de cada OS e faturamento.',
    print: '/prints/lab-funil.jpg', cta: 'Solicitar demonstração', to: '/interesse-lab',
    bullets: ['Funil de produção (Kanban)', 'Rastreio (GPS) de cada OS', 'Surfaçagem, montagem, entrega', 'Dashboard com faturamento'],
  },
  {
    key: 'vision', nome: 'Connect Vision', tag: 'Para o balcão · tablet', cor: '#7c3aed',
    desc: 'A ferramenta de venda no atendimento: mostra ao cliente, na prática, a diferença de cada tratamento da lente.',
    print: '/prints/vision-antirreflexo.jpg', cta: 'Conhecer o Vision', to: '/cadastro?tipo=otica',
    bullets: ['Simulação de anti-reflexo e anti-risco', 'Antes e depois em tempo real', 'Teste de visão e campos', 'Roda em tablet (PWA)'],
  },
];

// Slides do topo — ordem: Vision → Óticas → LAB
const HERO_SLIDES = [
  { key: 'vision', nome: 'Connect Vision', cor: '#7c3aed', src: '/prints/vision-antirreflexo.jpg', cap: 'Connect Vision — simulação de anti-reflexo no atendimento' },
  { key: 'otica', nome: 'Conexão Óticas', cor: '#16a34a', src: '/prints/otica-dashboard.jpg', cap: 'Conexão Óticas — painel de gestão da loja' },
  { key: 'lab', nome: 'Connect LAB', cor: '#0891b2', src: '/prints/lab-funil.jpg', cap: 'Connect LAB — funil de produção do laboratório' },
];

// Apps instaláveis no computador (Vision fica de fora — é app de celular/tablet)
const DOWNLOADS = [
  { key: 'otica', nome: 'Connect Óticas', cor: '#16a34a', icon: '/icon-512.png', desc: 'Gestão da ótica — clientes, OS, vendas, estoque e financeiro.', manifest: '/manifest-otica.webmanifest' },
  { key: 'lab', nome: 'Connect LAB', cor: '#0f7a35', icon: '/icon-lab-512.png', desc: 'Produção do laboratório — funil, surfaçagem e rastreio.', manifest: '/manifest-lab.webmanifest' },
];

const SHOWCASE = [
  {
    tag: 'Connect Vision', cor: '#7c3aed', title: 'Mostre a diferença do anti-reflexo para o cliente',
    desc: 'Compare, lado a lado, dirigir à noite com e sem anti-reflexo — reflexos de faróis eliminados. O cliente vê o valor da lente e decide na hora.',
    print: '/prints/vision-antirreflexo.jpg',
  },
  {
    tag: 'Connect LAB', cor: '#0891b2', title: 'Rastreio de cada pedido, como uma encomenda',
    desc: 'Saiba na hora onde está cada OS, por quais setores passou, com tempo previsto vs. real. Nunca mais perca um prazo sem ver.',
    print: '/prints/lab-rastreio.jpg',
  },
  {
    tag: 'Conexão Óticas', cor: '#16a34a', title: 'A loja inteira em um painel',
    desc: 'Vendas do mês, OS em aberto, clientes e financeiro em uma tela. Do cadastro do cliente ao pós-venda, tudo conectado.',
    print: '/prints/otica-clientes.jpg',
  },
];

const FEATURES = [
  { icon: '👤', title: 'Clientes & CRM', desc: 'Cadastro completo com histórico de compras, receitas e funil de relacionamento automático.' },
  { icon: '🔧', title: 'Ordens de Serviço', desc: 'OS completa com receita oftalmológica, lentes, armações, laboratório e entrega. Impressão com um clique.' },
  { icon: '🛒', title: 'Controle de Vendas', desc: 'Registre vendas, aplique descontos, controle formas de pagamento e acompanhe o faturamento.' },
  { icon: '💰', title: 'Financeiro Completo', desc: 'Contas a pagar e a receber, fluxo de caixa e visão clara de clientes inadimplentes.' },
  { icon: '📦', title: 'Estoque', desc: 'Controle de armações, lentes e acessórios. Alertas de estoque baixo e histórico de movimentações.' },
  { icon: '📊', title: 'Painel Gerencial', desc: 'Relatórios de vendas, OS por situação, top clientes e resumo financeiro.' },
  { icon: '🤝', title: 'CRM & Marketing', desc: 'Funil Kanban automático: pós-venda, aniversário, indicação, reativação. Mensagens no WhatsApp.' },
  { icon: '👥', title: 'Multi-usuário', desc: 'Admin, vendedor e caixa com permissões separadas. Cada colaborador acessa só o que precisa.' },
];

const PLANOS = [
  {
    nome: 'Gestão', preco: '270', desc: 'Tudo para gerir e relacionar com clientes', destaque: false, cta: 'Começar grátis',
    upsell: '+R$20/mês por usuário adicional',
    features: [
      { texto: 'Clientes ilimitados', inc: true }, { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true }, { texto: 'Controle de Estoque', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: true }, { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true }, { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: true }, { texto: '5 usuários incluídos', inc: true },
      { texto: 'Nota Fiscal Eletrônica (NF-e)', inc: false },
    ],
  },
  {
    nome: 'Gestão Pro', preco: '370', desc: 'Gestão completa com NF-e e usuários ilimitados', destaque: true, cta: 'Começar grátis',
    upsell: null,
    features: [
      { texto: 'Clientes ilimitados', inc: true }, { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true }, { texto: 'Controle de Estoque', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: true }, { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true }, { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: true }, { texto: 'Usuários ilimitados', inc: true },
      { texto: 'Nota Fiscal Eletrônica (NF-e)', inc: true },
    ],
  },
];

const FAQ = [
  { q: 'Preciso instalar algum programa?', a: 'Não. O Conexão Óticas e o Connect LAB funcionam 100% no navegador. Acesse de qualquer computador, tablet ou celular sem instalar nada.' },
  { q: 'Os três sistemas conversam entre si?', a: 'Sim. Óticas, LAB e Vision compartilham a mesma base na nuvem. Uma venda na ótica pode virar uma OS que o laboratório produz e rastreia, tudo em tempo real.' },
  { q: 'O Connect Vision funciona no tablet?', a: 'Sim! O Vision é um aplicativo web (PWA) pensado para o balcão. Você usa no tablet para mostrar ao cliente a diferença dos tratamentos (anti-reflexo, anti-risco) e fechar a venda no atendimento.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Seus dados ficam na infraestrutura da Cloudflare, com backups automáticos. Nenhuma ótica concorrente acessa suas informações.' },
  { q: 'Como funciona o período grátis?', a: '14 dias completos, sem cartão de crédito. Acesso a todos os recursos do plano escolhido.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa e sem burocracia. Se cancelar, seus dados ficam disponíveis por 30 dias para exportação.' },
];

// Moldura de navegador em volta do print
function Frame({ src, alt, cor = G }: { src: string; alt: string; cor?: string }) {
  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${BD}`, background: '#fff', boxShadow: `0 24px 60px rgba(15,23,42,0.14), 0 0 0 1px ${cor}18` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: '#f8fafc', borderBottom: `1px solid ${BD}` }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: '10px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>conexaooticas.com.br</span>
      </div>
      <img src={src} alt={alt} loading="lazy" style={{ width: '100%', display: 'block' }} />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [heroIdx, setHeroIdx] = useState(0);
  const heroPaused = useRef(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // carrossel do topo: avança sozinho Vision → Óticas → LAB
  useEffect(() => {
    const t = setInterval(() => {
      if (!heroPaused.current) setHeroIdx(i => (i + 1) % HERO_SLIDES.length);
    }, 4200);
    return () => clearInterval(t);
  }, []);

  // ── Instalar app no computador (troca o manifesto p/ o produto certo) ──
  const [instrucao, setInstrucao] = useState<string | null>(null);
  function setManifest(href: string) {
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
    link.href = href;
  }
  function esperarPromptFresco(ms: number): Promise<{ prompt: () => Promise<void>; userChoice: Promise<unknown> } | null> {
    return new Promise(res => {
      let done = false;
      const fim = (v: unknown) => { if (done) return; done = true; window.removeEventListener('pwa-installable', on); res(v as never); };
      const on = () => fim((window as unknown as { __pwaPrompt?: unknown }).__pwaPrompt ?? null);
      window.addEventListener('pwa-installable', on);
      setTimeout(() => fim(null), ms);
    });
  }
  async function instalarApp(manifest: string, nome: string) {
    const jaApp = window.matchMedia('(display-mode: standalone)').matches;
    if (jaApp) { setInstrucao(nome); return; }
    setManifest(manifest);
    const p = await esperarPromptFresco(1800);
    if (p) { try { await p.prompt(); await p.userChoice; } catch { /* ignora */ } (window as unknown as { __pwaPrompt?: unknown }).__pwaPrompt = null; }
    else setInstrucao(nome);
  }

  const px = isMobile ? '16px' : '48px';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: BG, color: TX, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '12px 16px' : '15px 48px', borderBottom: `1px solid ${BD}`, position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg,${G},${G2})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${GLOW}0.35)`, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          </div>
          <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '800', letterSpacing: '-0.3px', whiteSpace: 'nowrap', color: TX }}>Conexão <span style={{ color: G }}>Óticas</span></span>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '12px', alignItems: 'center' }}>
          {!isMobile && <>
            <a href="#produtos" style={{ padding: '8px 16px', fontSize: '14px', color: TX2, textDecoration: 'none', fontWeight: '500' }}>Produtos</a>
            <a href="#downloads" style={{ padding: '8px 16px', fontSize: '14px', color: TX2, textDecoration: 'none', fontWeight: '500' }}>Downloads</a>
            <a href="#planos" style={{ padding: '8px 16px', fontSize: '14px', color: TX2, textDecoration: 'none', fontWeight: '500' }}>Planos</a>
            <a href="#faq" style={{ padding: '8px 16px', fontSize: '14px', color: TX2, textDecoration: 'none', fontWeight: '500' }}>FAQ</a>
          </>}
          {!isMobile && <InstallAppButton label="Instalar app" style={{ padding: '8px 14px', fontSize: '13px', background: 'transparent', color: G, border: `1px solid ${G}55`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap' }} />}
          <button onClick={() => navigate('/login')} style={{ padding: isMobile ? '7px 12px' : '8px 18px', fontSize: '13px', background: 'transparent', color: TX2, border: `1px solid ${BD}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Entrar</button>
          <button onClick={() => navigate('/cadastro')} style={{ padding: isMobile ? '7px 12px' : '8px 18px', fontSize: '13px', fontWeight: '700', background: G, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 14px ${GLOW}0.3)`, whiteSpace: 'nowrap' }}>14 dias grátis</button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', textAlign: 'center', padding: isMobile ? '52px 20px 32px' : '78px 24px 40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: `${GLOW}0.08)`, border: `1px solid ${GLOW}0.2)`, borderRadius: '24px', fontSize: '13px', color: G2, marginBottom: '24px', fontWeight: '600' }}>
          <span style={{ width: '6px', height: '6px', background: G3, borderRadius: '50%', display: 'inline-block' }} />
          3 sistemas, uma só plataforma · 14 dias grátis
        </div>
        <h1 style={{ fontSize: isMobile ? '34px' : '56px', fontWeight: '900', lineHeight: '1.08', margin: '0 0 20px', letterSpacing: isMobile ? '-0.5px' : '-1.5px', color: TX }}>
          Do balcão ao laboratório,<br />sua ótica <span style={{ background: `linear-gradient(135deg,${G},${G3})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>toda conectada</span>
        </h1>
        <p style={{ fontSize: isMobile ? '16px' : '19px', color: TX2, margin: '0 0 34px', lineHeight: '1.65', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
          Gestão da ótica, produção do laboratório e apresentação de lentes no atendimento — três sistemas que conversam entre si, em tempo real.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cadastro')} style={{ padding: isMobile ? '13px 28px' : '15px 36px', fontSize: isMobile ? '15px' : '16px', fontWeight: '700', background: `linear-gradient(135deg,${G},${G2})`, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 24px ${GLOW}0.3)` }}>Começar grátis →</button>
          <a href="#produtos" style={{ padding: isMobile ? '13px 24px' : '15px 32px', fontSize: isMobile ? '15px' : '16px', background: '#fff', color: TX, border: `1px solid ${BD}`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontWeight: '600' }}>Ver os 3 produtos</a>
        </div>
      </section>

      {/* ===== HERO CARROSSEL (Vision → Óticas → LAB) ===== */}
      <section style={{ padding: `0 ${px} 24px`, maxWidth: '1080px', margin: '0 auto' }}>
        {/* abas */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {HERO_SLIDES.map((s, i) => {
            const on = i === heroIdx;
            return (
              <button key={s.key} onClick={() => setHeroIdx(i)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: isMobile ? '7px 12px' : '8px 16px', fontSize: isMobile ? '12px' : '13.5px', fontWeight: '700', borderRadius: '22px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', background: on ? s.cor : '#fff', color: on ? '#fff' : TX2, border: `1px solid ${on ? s.cor : BD}`, boxShadow: on ? `0 6px 16px ${s.cor}44` : 'none' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: on ? '#fff' : s.cor }} />
                {s.nome}
              </button>
            );
          })}
        </div>

        {/* moldura com o slide atual */}
        <div onMouseEnter={() => { heroPaused.current = true; }} onMouseLeave={() => { heroPaused.current = false; }}
          style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${BD}`, background: '#fff', boxShadow: `0 24px 60px rgba(15,23,42,0.14), 0 0 0 1px ${HERO_SLIDES[heroIdx].cor}18`, transition: 'box-shadow .4s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: '#f8fafc', borderBottom: `1px solid ${BD}` }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: '10px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>conexaooticas.com.br</span>
          </div>
          {/* viewport do carrossel: altura fixa por proporção, imagens deslizam */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', overflow: 'hidden', background: '#0b0f17' }}>
            <div style={{ display: 'flex', width: '100%', height: '100%', transform: `translateX(-${heroIdx * 100}%)`, transition: 'transform .6s cubic-bezier(.4,0,.2,1)' }}>
              {HERO_SLIDES.map(s => (
                <img key={s.key} src={s.src} alt={s.nome} loading="lazy"
                  style={{ flex: '0 0 100%', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
              ))}
            </div>
          </div>
        </div>

        {/* legenda + bolinhas */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
          <div style={{ display: 'flex', gap: '7px' }}>
            {HERO_SLIDES.map((s, i) => (
              <button key={s.key} onClick={() => setHeroIdx(i)} aria-label={s.nome}
                style={{ width: i === heroIdx ? '22px' : '8px', height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0, transition: 'all .3s', background: i === heroIdx ? s.cor : '#cbd5e1' }} />
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: TX3, margin: 0 }}>{HERO_SLIDES[heroIdx].cap}</p>
        </div>
      </section>

      {/* ===== 3 PRODUTOS ===== */}
      <section id="produtos" style={{ padding: isMobile ? '48px 16px' : '70px 48px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Os produtos</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px', color: TX }}>Uma plataforma, três produtos</h2>
          <p style={{ fontSize: '15px', color: TX2, margin: 0, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>Cada um resolve uma parte do negócio óptico. Juntos, cobrem do atendimento à entrega.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '18px' }}>
          {PRODUTOS.map(p => (
            <div key={p.key} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: CARD_SH }}>
              <div style={{ position: 'relative', borderBottom: `3px solid ${p.cor}` }}>
                <img src={p.print} alt={p.nome} loading="lazy" style={{ width: '100%', height: '190px', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: '700', color: '#fff', background: p.cor, padding: '4px 11px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{p.tag}</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '19px', fontWeight: '800', color: TX, marginBottom: '8px' }}>{p.nome}</div>
                <div style={{ fontSize: '13.5px', color: TX2, lineHeight: '1.6', marginBottom: '14px' }}>{p.desc}</div>
                <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {p.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#334155', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: p.cor, fontWeight: '800', flexShrink: 0 }}>✓</span>{b}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(p.to)} style={{ marginTop: 'auto', width: '100%', padding: '11px', fontSize: '14px', fontWeight: '700', background: `${p.cor}0f`, color: p.cor, border: `1px solid ${p.cor}40`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>{p.cta} →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DOWNLOADS ===== */}
      <section id="downloads" style={{ background: BG2, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: isMobile ? '48px 16px' : '72px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Downloads</div>
            <h2 style={{ fontSize: isMobile ? '25px' : '34px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px', color: TX }}>Instale na área de trabalho</h2>
            <p style={{ fontSize: '15px', color: TX2, margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
              Crie um ícone no computador e acesse o sistema com um clique, como um aplicativo — abre direto no login, em janela própria.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '18px' }}>
            {DOWNLOADS.map(d => (
              <div key={d.key} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: CARD_SH }}>
                <img src={d.icon} alt={d.nome} width={72} height={72} style={{ borderRadius: '18px', marginBottom: '14px', boxShadow: `0 8px 20px ${d.cor}33` }} />
                <div style={{ fontSize: '19px', fontWeight: '800', color: TX, marginBottom: '6px' }}>{d.nome}</div>
                <div style={{ fontSize: '13.5px', color: TX2, lineHeight: '1.55', marginBottom: '18px', maxWidth: '300px' }}>{d.desc}</div>
                <button onClick={() => instalarApp(d.manifest, d.nome)}
                  style={{ width: '100%', maxWidth: '280px', padding: '13px', fontSize: '15px', fontWeight: '700', background: `linear-gradient(135deg,${G},${G2})`, color: '#fff', border: 'none', borderRadius: '11px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 20px ${GLOW}0.28)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  ⤓ Instalar no computador
                </button>
                <div style={{ fontSize: '11.5px', color: TX3, marginTop: '10px' }}>Cria o ícone na área de trabalho</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12.5px', color: TX3, marginTop: '22px', lineHeight: 1.6 }}>
            Funciona no <b style={{ color: TX2 }}>Chrome</b> e <b style={{ color: TX2 }}>Edge</b> (computador). O <b style={{ color: TX2 }}>Connect Vision</b> é usado no celular/tablet, pelos apps de Android e iOS.
          </p>
        </div>

        {/* modal de instruções (quando o navegador não abre o instalador direto) */}
        {instrucao && (
          <div onClick={() => setInstrucao(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', color: TX, borderRadius: '14px', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '10px' }}>Instalar {instrucao}</div>
              <div style={{ fontSize: '13.5px', color: TX2, lineHeight: 1.65 }}>
                No <b>Chrome</b> ou <b>Edge</b> (computador): clique no ícone de <b>instalar</b> (um monitor com uma seta ↓) que aparece na <b>barra de endereço</b>, ou vá no menu <b>⋮ → Instalar {instrucao}</b>.<br /><br />
                No <b>celular/tablet</b>: menu do navegador → <b>Adicionar à tela inicial</b>.<br /><br />
                Vai criar o ícone e abrir o app em janela própria, direto no login.
              </div>
              <button onClick={() => setInstrucao(null)} style={{ marginTop: '18px', width: '100%', padding: '11px', fontSize: '14px', fontWeight: 700, background: G, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Entendi</button>
            </div>
          </div>
        )}
      </section>

      {/* ===== ECOSSISTEMA CONECTADO ===== */}
      <section style={{ background: BG2, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: isMobile ? '48px 16px' : '72px 48px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Tudo conectado</div>
          <h2 style={{ fontSize: isMobile ? '25px' : '34px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px', color: TX }}>Os três se conversam, em tempo real</h2>
          <p style={{ fontSize: '15px', color: TX2, margin: '0 0 40px', maxWidth: '620px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
            Uma venda no balcão vira uma OS que o laboratório produz e rastreia. Mesma base de dados, na nuvem — sem retrabalho, sem planilha no meio.
          </p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', justifyContent: 'center', gap: isMobile ? '0' : '8px' }}>
            {[
              { nome: 'Connect Vision', cor: '#7c3aed', icon: '👓', passo: 'Mostra a lente e fecha no balcão' },
              { nome: 'Conexão Óticas', cor: '#16a34a', icon: '🏪', passo: 'Registra a venda e gera a OS' },
              { nome: 'Connect LAB', cor: '#0891b2', icon: '🔬', passo: 'Produz e rastreia até a entrega' },
            ].map((n, i, arr) => (
              <div key={n.nome} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '0' : '8px', flex: isMobile ? 'none' : 1 }}>
                <div style={{ flex: 1, width: '100%', background: '#fff', border: `1px solid ${n.cor}33`, borderRadius: '16px', padding: '22px 18px', minWidth: 0, boxShadow: CARD_SH }}>
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>{n.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: n.cor, marginBottom: '6px' }}>{n.nome}</div>
                  <div style={{ fontSize: '13px', color: TX2, lineHeight: '1.5' }}>{n.passo}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: n.cor, fontSize: '22px', fontWeight: '800', padding: isMobile ? '8px 0' : '0 2px', transform: isMobile ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', fontSize: '13px', color: TX3, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: G3 }} /> Mesma conta · mesma base · 100% na nuvem
          </div>
        </div>
      </section>

      {/* ===== SHOWCASE (prints reais alternados) ===== */}
      <section style={{ padding: isMobile ? '48px 16px' : '80px 48px', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Veja por dentro</div>
          <h2 style={{ fontSize: isMobile ? '25px' : '34px', fontWeight: '800', margin: 0, letterSpacing: '-0.8px', color: TX }}>Telas reais, não maquete</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '40px' : '64px' }}>
          {SHOWCASE.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '48px', alignItems: 'center', direction: (!isMobile && i % 2 === 1) ? 'rtl' : 'ltr' }}>
              <div style={{ direction: 'ltr' }}>
                <div style={{ fontSize: '12px', color: s.cor, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>{s.tag}</div>
                <h3 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: '1.25', color: TX }}>{s.title}</h3>
                <p style={{ fontSize: '15px', color: TX2, margin: 0, lineHeight: '1.65' }}>{s.desc}</p>
              </div>
              <div style={{ direction: 'ltr' }}><Frame src={s.print} alt={s.title} cor={s.cor} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FUNCIONALIDADES ===== */}
      <section style={{ padding: isMobile ? '48px 16px' : '70px 48px', maxWidth: '1180px', margin: '0 auto', borderTop: `1px solid ${BD}` }} id="funcionalidades">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Conexão Óticas</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px', color: TX }}>Tudo para gerenciar sua ótica</h2>
          <p style={{ fontSize: '15px', color: TX2, margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>Do cadastro do cliente ao pós-venda, cada funcionalidade pensada para o dia a dia da ótica.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: '16px', padding: isMobile ? '18px 14px' : '26px 24px', boxShadow: CARD_SH }}>
              <div style={{ fontSize: isMobile ? '24px' : '30px', marginBottom: '10px' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: isMobile ? '13px' : '16px', fontWeight: '700', color: TX }}>{f.title}</h3>
              {!isMobile && <p style={{ margin: 0, fontSize: '14px', color: TX2, lineHeight: '1.6' }}>{f.desc}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section style={{ padding: isMobile ? '50px 16px' : '80px 48px', background: BG2, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Como funciona</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '800', margin: '0 0 40px', letterSpacing: '-0.8px', color: TX }}>Comece em menos de 5 minutos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '24px' : '32px' }}>
            {[
              { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se com nome, e-mail e senha. Nenhum cartão exigido. 14 dias grátis com todos os recursos.' },
              { num: '02', title: 'Configure sua ótica', desc: 'Adicione o nome da loja e os primeiros colaboradores. Tudo pronto em minutos.' },
              { num: '03', title: 'Comece a usar', desc: 'Abra a primeira OS, registre uma venda ou cadastre um cliente. Simples desde o primeiro acesso.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: isMobile ? 'left' : 'center', padding: '8px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' }}>
                <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: G3, marginBottom: isMobile ? '0' : '12px', fontFamily: 'monospace', letterSpacing: '-2px', flexShrink: 0 }}>{s.num}</div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: TX }}>{s.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: TX2, lineHeight: '1.6' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section style={{ padding: isMobile ? '60px 16px' : '88px 48px', maxWidth: '1100px', margin: '0 auto' }} id="planos">
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Planos e preços</div>
          <h2 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.8px', color: TX }}>Preços simples e transparentes</h2>
          <p style={{ fontSize: '15px', color: TX2, margin: 0 }}>14 dias grátis em qualquer plano. Cancele quando quiser, sem multa.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px', maxWidth: isMobile ? '100%' : '800px', margin: '0 auto' }}>
          {PLANOS.map((p, i) => (
            <div key={i} style={{ position: 'relative', background: '#fff', border: `1.5px solid ${p.destaque ? G : BD}`, borderRadius: '20px', padding: isMobile ? '28px 20px' : '36px 32px', boxShadow: p.destaque ? `0 20px 44px ${GLOW}0.16)` : CARD_SH }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${G},${G2})`, color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>✦ Mais popular</div>
              )}
              <h3 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: TX }}>{p.nome}</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: TX3 }}>{p.desc}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: TX2, alignSelf: 'flex-start', marginTop: '8px' }}>R$</span>
                <span style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', color: p.destaque ? G : TX }}>{p.preco}</span>
                <span style={{ fontSize: '14px', color: TX3 }}>/mês</span>
              </div>
              {p.upsell ? <div style={{ fontSize: '12px', color: G, fontWeight: '600', marginBottom: '20px' }}>{p.upsell}</div> : <div style={{ marginBottom: '20px' }} />}
              <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13.5px', color: f.inc ? '#334155' : '#b4bdc9', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: f.inc ? G : '#cbd5e1', fontWeight: '800', flexShrink: 0, marginTop: '1px', fontSize: '14px' }}>{f.inc ? '✓' : '✕'}</span>
                    <span style={{ textDecoration: f.inc ? 'none' : 'line-through', textDecorationColor: '#cbd5e1' }}>{f.texto}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/cadastro')} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700', background: p.destaque ? `linear-gradient(135deg,${G},${G2})` : '#fff', color: p.destaque ? 'white' : TX, border: p.destaque ? 'none' : `1px solid ${BD}`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: p.destaque ? `0 8px 20px ${GLOW}0.3)` : 'none' }}>{p.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: TX3, marginTop: '24px' }}>Connect LAB e Connect Vision têm planos próprios — fale com a gente para uma demonstração.</p>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ padding: isMobile ? '50px 16px' : '80px 48px', maxWidth: '760px', margin: '0 auto' }} id="faq">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: G, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>FAQ</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '800', margin: '0', letterSpacing: '-0.8px', color: TX }}>Perguntas frequentes</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: '12px', padding: isMobile ? '16px' : '22px 24px', boxShadow: CARD_SH }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: TX }}>{item.q}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: TX2, lineHeight: '1.65' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section style={{ padding: isMobile ? '4px 16px 60px' : '20px 48px 90px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ background: `linear-gradient(135deg,${G2},${G})`, borderRadius: '24px', padding: isMobile ? '44px 24px' : '64px 48px', textAlign: 'center', boxShadow: `0 24px 60px ${GLOW}0.3)` }}>
          <h2 style={{ fontSize: isMobile ? '26px' : '38px', fontWeight: '900', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: '1.15', color: '#fff' }}>Pronto para transformar sua ótica?</h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: '0 0 32px', lineHeight: '1.6' }}>Comece seu teste gratuito de 14 dias. Nenhum cartão exigido.</p>
          <button onClick={() => navigate('/cadastro')} style={{ padding: isMobile ? '14px 36px' : '16px 44px', fontSize: isMobile ? '15px' : '17px', fontWeight: '700', background: '#fff', color: G2, border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>Criar conta grátis →</button>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '16px' }}>Sem cartão · Sem contrato · Cancele quando quiser</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: `1px solid ${BD}`, padding: isMobile ? '28px 16px' : '40px 48px', background: BG2 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg,${G},${G2})`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800', color: TX }}>Conexão <span style={{ color: G }}>Óticas</span></span>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#produtos" style={{ fontSize: '13px', color: TX3, textDecoration: 'none' }}>Produtos</a>
              <a href="#planos" style={{ fontSize: '13px', color: TX3, textDecoration: 'none' }}>Planos</a>
              <a href="#faq" style={{ fontSize: '13px', color: TX3, textDecoration: 'none' }}>FAQ</a>
            </div>
          )}
          <span style={{ fontSize: '13px', color: TX3 }}>© {new Date().getFullYear()} Conexão Óticas · Óticas · LAB · Vision</span>
        </div>
      </footer>
    </div>
  );
}
