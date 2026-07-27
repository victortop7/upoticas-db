import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const G = '#008800';      // verde escuro
const G2 = '#005500';     // verde mais escuro
const G3 = '#22c55e';     // verde vivo (acento)
const GLOW = 'rgba(0,136,51,';

const PRODUTOS = [
  {
    key: 'otica', nome: 'Conexão Óticas', tag: 'Para óticas', cor: G3,
    desc: 'A gestão completa da loja: clientes, ordens de serviço, vendas, estoque, financeiro e CRM.',
    print: '/prints/otica-dashboard.jpg', cta: 'Começar grátis · 14 dias', to: '/cadastro?tipo=otica',
    bullets: ['Clientes & CRM automático', 'Ordens de serviço com receita', 'Vendas, caixa e financeiro', 'Relatórios gerenciais'],
  },
  {
    key: 'lab', nome: 'Connect LAB', tag: 'Para laboratórios ópticos', cor: '#3ddc7f',
    desc: 'O chão de fábrica do laboratório: funil de produção, surfaçagem, rastreio de cada OS e faturamento.',
    print: '/prints/lab-funil.jpg', cta: 'Solicitar demonstração', to: '/interesse-lab',
    bullets: ['Funil de produção (Kanban)', 'Rastreio (GPS) de cada OS', 'Surfaçagem, montagem, entrega', 'Dashboard com faturamento'],
  },
  {
    key: 'vision', nome: 'Connect Vision', tag: 'Para o balcão · tablet', cor: '#5eead4',
    desc: 'A ferramenta de venda no atendimento: apresenta as lentes ao cliente com demonstrações visuais.',
    print: '/prints/vision-demo.jpg', cta: 'Conhecer o Vision', to: '/cadastro?tipo=otica',
    bullets: ['Demonstração visual de lentes', 'Mapa visual e teste de visão', 'Venda indicativa no balcão', 'Roda em tablet (PWA)'],
  },
];

const SHOWCASE = [
  {
    tag: 'Connect LAB', cor: '#3ddc7f', title: 'Rastreio de cada pedido, como uma encomenda',
    desc: 'Saiba na hora onde está cada OS, por quais setores passou, com tempo previsto vs. real. Nunca mais perca um prazo sem ver.',
    print: '/prints/lab-rastreio.jpg',
  },
  {
    tag: 'Connect Vision', cor: '#5eead4', title: 'Mostre a diferença da lente para o cliente',
    desc: 'Compare superfície convencional e digital, simule campos de visão e apresente o valor da lente — fechando a venda no balcão.',
    print: '/prints/vision-mapa.jpg',
  },
  {
    tag: 'Conexão Óticas', cor: G3, title: 'A loja inteira em um painel',
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
      { texto: 'Clientes ilimitados', inc: true },
      { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true },
      { texto: 'Controle de Estoque', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: true },
      { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true },
      { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: true },
      { texto: '5 usuários incluídos', inc: true },
      { texto: 'Nota Fiscal Eletrônica (NF-e)', inc: false },
    ],
  },
  {
    nome: 'Gestão Pro', preco: '370', desc: 'Gestão completa com NF-e e usuários ilimitados', destaque: true, cta: 'Começar grátis',
    upsell: null,
    features: [
      { texto: 'Clientes ilimitados', inc: true },
      { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true },
      { texto: 'Controle de Estoque', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: true },
      { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true },
      { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: true },
      { texto: 'Usuários ilimitados', inc: true },
      { texto: 'Nota Fiscal Eletrônica (NF-e)', inc: true },
    ],
  },
];

const FAQ = [
  { q: 'Preciso instalar algum programa?', a: 'Não. O Conexão Óticas e o Connect LAB funcionam 100% no navegador. Acesse de qualquer computador, tablet ou celular sem instalar nada.' },
  { q: 'Os três sistemas conversam entre si?', a: 'Sim. Óticas, LAB e Vision compartilham a mesma base na nuvem. Uma venda na ótica pode virar uma OS que o laboratório produz e rastreia, tudo em tempo real.' },
  { q: 'O Connect Vision funciona no tablet?', a: 'Sim! O Vision é um aplicativo web (PWA) pensado para o balcão. Você usa no tablet para apresentar as lentes ao cliente e fechar a venda no atendimento.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Seus dados ficam na infraestrutura da Cloudflare, com backups automáticos. Nenhuma ótica concorrente acessa suas informações.' },
  { q: 'Como funciona o período grátis?', a: '14 dias completos, sem cartão de crédito. Acesso a todos os recursos do plano escolhido.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa e sem burocracia. Se cancelar, seus dados ficam disponíveis por 30 dias para exportação.' },
];

// Moldura de navegador em volta do print
function Frame({ src, alt, cor = G3 }: { src: string; alt: string; cor?: string }) {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0f1420', boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${cor}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: '10px', fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>conexaooticas.com.br</span>
      </div>
      <img src={src} alt={alt} loading="lazy" style={{ width: '100%', display: 'block' }} />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const px = isMobile ? '16px' : '48px';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#0a0d14', color: '#e2e8f0', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '12px 16px' : '16px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(10,13,20,0.96)', backdropFilter: 'blur(16px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg,${G},${G2})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${GLOW}0.4)`, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          </div>
          <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '800', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Conexão <span style={{ color: G3 }}>Óticas</span></span>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '12px', alignItems: 'center' }}>
          {!isMobile && <>
            <a href="#produtos" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>Produtos</a>
            <a href="#planos" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>Planos</a>
            <a href="#faq" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>FAQ</a>
          </>}
          <button onClick={() => navigate('/login')} style={{ padding: isMobile ? '7px 12px' : '8px 18px', fontSize: '13px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Entrar</button>
          <button onClick={() => navigate('/cadastro')} style={{ padding: isMobile ? '7px 12px' : '8px 18px', fontSize: '13px', fontWeight: '700', background: G, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 20px ${GLOW}0.35)`, whiteSpace: 'nowrap' }}>14 dias grátis</button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', textAlign: 'center', padding: isMobile ? '54px 20px 34px' : '80px 24px 40px', maxWidth: '900px', margin: '0 auto' }}>
        {!isMobile && (
          <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', width: '760px', height: '360px', background: `radial-gradient(ellipse, ${GLOW}0.14) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        )}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: `${GLOW}0.12)`, border: `1px solid ${GLOW}0.25)`, borderRadius: '24px', fontSize: '13px', color: '#86efac', marginBottom: '24px', fontWeight: '600' }}>
            <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
            3 sistemas, uma só plataforma · 14 dias grátis
          </div>
          <h1 style={{ fontSize: isMobile ? '34px' : '56px', fontWeight: '900', lineHeight: '1.08', margin: '0 0 20px', letterSpacing: isMobile ? '-0.5px' : '-1.5px' }}>
            Do balcão ao laboratório,<br />sua ótica <span style={{ background: `linear-gradient(135deg,${G},${G3})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>toda conectada</span>
          </h1>
          <p style={{ fontSize: isMobile ? '16px' : '19px', color: '#94a3b8', margin: '0 0 34px', lineHeight: '1.65', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
            Gestão da ótica, produção do laboratório e apresentação de lentes no atendimento — três sistemas que conversam entre si, em tempo real.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button onClick={() => navigate('/cadastro')} style={{ padding: isMobile ? '13px 28px' : '15px 36px', fontSize: isMobile ? '15px' : '16px', fontWeight: '700', background: `linear-gradient(135deg,${G},${G2})`, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 24px ${GLOW}0.4)` }}>Começar grátis →</button>
            <a href="#produtos" style={{ padding: isMobile ? '13px 24px' : '15px 32px', fontSize: isMobile ? '15px' : '16px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Ver os 3 produtos</a>
          </div>
        </div>
      </section>

      {/* ===== HERO PRINT ===== */}
      <section style={{ padding: `0 ${px} 20px`, maxWidth: '1080px', margin: '0 auto', position: 'relative' }}>
        <Frame src="/prints/lab-funil.jpg" alt="Funil de produção do Connect LAB" />
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#475569', marginTop: '12px' }}>Telas reais do sistema — Connect LAB, funil de produção</p>
      </section>

      {/* ===== 3 PRODUTOS ===== */}
      <section id="produtos" style={{ padding: isMobile ? '48px 16px' : '70px 48px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Os produtos</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px' }}>Uma plataforma, três produtos</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>Cada um resolve uma parte do negócio óptico. Juntos, cobrem do atendimento à entrega.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '18px' }}>
          {PRODUTOS.map(p => (
            <div key={p.key} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', borderBottom: `2px solid ${p.cor}` }}>
                <img src={p.print} alt={p.nome} loading="lazy" style={{ width: '100%', height: '190px', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(15,20,32,0.85))' }} />
                <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: '700', color: '#0a0d14', background: p.cor, padding: '3px 10px', borderRadius: '20px' }}>{p.tag}</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '19px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>{p.nome}</div>
                <div style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '14px' }}>{p.desc}</div>
                <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {p.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: p.cor, fontWeight: '800', flexShrink: 0 }}>✓</span>{b}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(p.to)} style={{ marginTop: 'auto', width: '100%', padding: '11px', fontSize: '14px', fontWeight: '700', background: 'transparent', color: p.cor, border: `1px solid ${p.cor}55`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>{p.cta} →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ECOSSISTEMA CONECTADO ===== */}
      <section style={{ background: 'rgba(255,255,255,0.018)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '48px 16px' : '72px 48px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Tudo conectado</div>
          <h2 style={{ fontSize: isMobile ? '25px' : '34px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px' }}>Os três se conversam, em tempo real</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 40px', maxWidth: '620px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
            Uma venda no balcão vira uma OS que o laboratório produz e rastreia. Mesma base de dados, na nuvem — sem retrabalho, sem planilha no meio.
          </p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', justifyContent: 'center', gap: isMobile ? '0' : '8px' }}>
            {[
              { nome: 'Connect Vision', cor: '#5eead4', icon: '👓', passo: 'Apresenta a lente e fecha no balcão' },
              { nome: 'Conexão Óticas', cor: G3, icon: '🏪', passo: 'Registra a venda e gera a OS' },
              { nome: 'Connect LAB', cor: '#3ddc7f', icon: '🔬', passo: 'Produz e rastreia até a entrega' },
            ].map((n, i, arr) => (
              <div key={n.nome} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '0' : '8px', flex: isMobile ? 'none' : 1 }}>
                <div style={{ flex: 1, width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${n.cor}44`, borderRadius: '16px', padding: '22px 18px', minWidth: 0 }}>
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>{n.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: n.cor, marginBottom: '6px' }}>{n.nome}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>{n.passo}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: n.cor, fontSize: '22px', fontWeight: '800', padding: isMobile ? '8px 0' : '0 2px', transform: isMobile ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', fontSize: '13px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: G3 }} /> Mesma conta · mesma base · 100% na nuvem
          </div>
        </div>
      </section>

      {/* ===== SHOWCASE (prints reais alternados) ===== */}
      <section style={{ padding: isMobile ? '48px 16px' : '80px 48px', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Veja por dentro</div>
          <h2 style={{ fontSize: isMobile ? '25px' : '34px', fontWeight: '800', margin: 0, letterSpacing: '-0.8px' }}>Telas reais, não maquete</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '40px' : '64px' }}>
          {SHOWCASE.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '48px', alignItems: 'center', direction: (!isMobile && i % 2 === 1) ? 'rtl' : 'ltr' }}>
              <div style={{ direction: 'ltr' }}>
                <div style={{ fontSize: '12px', color: s.cor, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>{s.tag}</div>
                <h3 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: '1.25' }}>{s.title}</h3>
                <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, lineHeight: '1.65' }}>{s.desc}</p>
              </div>
              <div style={{ direction: 'ltr' }}><Frame src={s.print} alt={s.title} cor={s.cor} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FUNCIONALIDADES ===== */}
      <section style={{ padding: isMobile ? '48px 16px' : '70px 48px', maxWidth: '1180px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)' }} id="funcionalidades">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Conexão Óticas</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px' }}>Tudo para gerenciar sua ótica</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>Do cadastro do cliente ao pós-venda, cada funcionalidade pensada para o dia a dia da ótica.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: isMobile ? '18px 14px' : '26px 24px' }}>
              <div style={{ fontSize: isMobile ? '24px' : '30px', marginBottom: '10px' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: isMobile ? '13px' : '16px', fontWeight: '700', color: '#f1f5f9' }}>{f.title}</h3>
              {!isMobile && <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{f.desc}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section style={{ padding: isMobile ? '50px 16px' : '80px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Como funciona</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '800', margin: '0 0 40px', letterSpacing: '-0.8px' }}>Comece em menos de 5 minutos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '24px' : '32px' }}>
            {[
              { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se com nome, e-mail e senha. Nenhum cartão exigido. 14 dias grátis com todos os recursos.' },
              { num: '02', title: 'Configure sua ótica', desc: 'Adicione o nome da loja e os primeiros colaboradores. Tudo pronto em minutos.' },
              { num: '03', title: 'Comece a usar', desc: 'Abra a primeira OS, registre uma venda ou cadastre um cliente. Simples desde o primeiro acesso.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: isMobile ? 'left' : 'center', padding: '8px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' }}>
                <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: G3, marginBottom: isMobile ? '0' : '12px', fontFamily: 'monospace', letterSpacing: '-2px', flexShrink: 0 }}>{s.num}</div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>{s.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section style={{ padding: isMobile ? '60px 16px' : '88px 48px', maxWidth: '1100px', margin: '0 auto' }} id="planos">
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Planos e preços</div>
          <h2 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.8px' }}>Preços simples e transparentes</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>14 dias grátis em qualquer plano. Cancele quando quiser, sem multa.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px', maxWidth: isMobile ? '100%' : '800px', margin: '0 auto' }}>
          {PLANOS.map((p, i) => (
            <div key={i} style={{ position: 'relative', background: p.destaque ? `linear-gradient(145deg, ${GLOW}0.15), ${GLOW}0.05))` : 'rgba(255,255,255,0.025)', border: `1px solid ${p.destaque ? GLOW + '0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '20px', padding: isMobile ? '28px 20px' : '36px 32px', boxShadow: p.destaque ? `0 0 40px ${GLOW}0.15)` : 'none' }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${G},${G2})`, color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>✦ Mais popular</div>
              )}
              <h3 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800' }}>{p.nome}</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>{p.desc}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8', alignSelf: 'flex-start', marginTop: '8px' }}>R$</span>
                <span style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', color: p.destaque ? G3 : '#f1f5f9' }}>{p.preco}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>/mês</span>
              </div>
              {p.upsell ? <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600', marginBottom: '20px' }}>{p.upsell}</div> : <div style={{ marginBottom: '20px' }} />}
              <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13.5px', color: f.inc ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: f.inc ? '#22c55e' : '#374151', fontWeight: '800', flexShrink: 0, marginTop: '1px', fontSize: '14px' }}>{f.inc ? '✓' : '✕'}</span>
                    <span style={{ textDecoration: f.inc ? 'none' : 'line-through', textDecorationColor: '#374151' }}>{f.texto}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/cadastro')} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700', background: p.destaque ? `linear-gradient(135deg,${G},${G2})` : 'transparent', color: p.destaque ? 'white' : '#94a3b8', border: p.destaque ? 'none' : '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: p.destaque ? `0 4px 16px ${GLOW}0.4)` : 'none' }}>{p.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '24px' }}>Connect LAB e Connect Vision têm planos próprios — fale com a gente para uma demonstração.</p>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ padding: isMobile ? '50px 16px' : '80px 48px', maxWidth: '760px', margin: '0 auto' }} id="faq">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: G3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>FAQ</div>
          <h2 style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: '800', margin: '0', letterSpacing: '-0.8px' }}>Perguntas frequentes</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: isMobile ? '16px' : '22px 24px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#f1f5f9' }}>{item.q}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.65' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 24px', textAlign: 'center', position: 'relative' }}>
        {!isMobile && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '300px', background: `radial-gradient(ellipse, ${GLOW}0.1) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        )}
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: isMobile ? '28px' : '38px', fontWeight: '900', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: '1.15' }}>Pronto para transformar<br />sua ótica?</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 36px', lineHeight: '1.6' }}>Comece seu teste gratuito de 14 dias. Nenhum cartão exigido.</p>
          <button onClick={() => navigate('/cadastro')} style={{ padding: isMobile ? '14px 36px' : '16px 44px', fontSize: isMobile ? '15px' : '17px', fontWeight: '700', background: `linear-gradient(135deg,${G},${G2})`, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 32px ${GLOW}0.45)` }}>Criar conta grátis →</button>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '16px' }}>Sem cartão · Sem contrato · Cancele quando quiser</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '28px 16px' : '40px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg,${G},${G2})`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800' }}>Conexão <span style={{ color: G3 }}>Óticas</span></span>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#produtos" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>Produtos</a>
              <a href="#planos" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>Planos</a>
              <a href="#faq" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>FAQ</a>
            </div>
          )}
          <span style={{ fontSize: '13px', color: '#334155' }}>© {new Date().getFullYear()} Conexão Óticas · Óticas · LAB · Vision</span>
        </div>
      </footer>
    </div>
  );
}
