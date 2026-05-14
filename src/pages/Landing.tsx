import { useNavigate } from 'react-router-dom';

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
    nome: 'Gestão', preco: '250', desc: 'Para óticas que querem organização', destaque: false, cta: 'Começar grátis',
    features: [
      { texto: 'Clientes ilimitados', inc: true },
      { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true },
      { texto: 'Controle de Estoque', inc: true },
      { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true },
      { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Até 10 usuários', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: false },
      { texto: 'Marketing e Campanhas WhatsApp', inc: false },
      { texto: 'Nota Fiscal (em breve)', inc: false },
    ],
  },
  {
    nome: 'Gestão Pro', preco: '350', desc: 'Para óticas em crescimento', destaque: true, cta: 'Começar grátis',
    features: [
      { texto: 'Clientes ilimitados', inc: true },
      { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true },
      { texto: 'Controle de Estoque', inc: true },
      { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true },
      { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Até 15 usuários', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: false },
      { texto: 'Nota Fiscal (em breve)', inc: false },
    ],
  },
  {
    nome: 'Completo', preco: '450', desc: 'Para quem quer vender mais', destaque: false, cta: 'Começar grátis',
    features: [
      { texto: 'Clientes ilimitados', inc: true },
      { texto: 'Ordens de Serviço ilimitadas', inc: true },
      { texto: 'Controle de Vendas e Caixa', inc: true },
      { texto: 'Controle de Estoque', inc: true },
      { texto: 'Relatórios gerenciais', inc: true },
      { texto: 'Impressão de OS', inc: true },
      { texto: 'CRM & Funil de relacionamento', inc: true },
      { texto: 'Usuários ilimitados', inc: true },
      { texto: 'Financeiro (contas a pagar/receber)', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: true },
      { texto: 'Nota Fiscal — em breve 🔜', inc: true },
    ],
  },
];

const FAQ = [
  { q: 'Preciso instalar algum programa?', a: 'Não. O Conexão Óticas funciona 100% no navegador. Acesse de qualquer computador, tablet ou celular sem instalar nada.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Seus dados ficam armazenados na infraestrutura da Cloudflare, com backups automáticos. Nenhuma ótica concorrente acessa suas informações.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa e sem burocracia. Se cancelar, seus dados ficam disponíveis por 30 dias para exportação.' },
  { q: 'Quantos usuários posso ter?', a: 'Depende do plano. Gestão tem até 10 usuários, Pro até 15 e Completo é ilimitado.' },
  { q: 'Como funciona o período grátis?', a: '14 dias completos, sem cartão de crédito. Acesso a todos os recursos do plano escolhido.' },
  { q: 'O Conexão Lab tem aplicativo?', a: 'Sim! O Conexão Lab é distribuído como aplicativo para Windows. Após a demonstração, fornecemos o instalador.' },
];

const RED = '#008800';
const RED2 = '#005500';
const RED3 = '#22c55e';
const REDGLOW = 'rgba(0,136,51,';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#0a0d14', color: '#e2e8f0', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(10,13,20,0.96)',
        backdropFilter: 'blur(16px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg,${RED},${RED2})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${REDGLOW}0.4)` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.3px' }}>Conexão <span style={{ color: RED3 }}>Óticas</span></span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="#planos" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>Planos</a>
          <a href="#faq" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>FAQ</a>
          <button onClick={() => navigate('/login')} style={{ padding: '8px 18px', fontSize: '14px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Entrar</button>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '8px 18px', fontSize: '14px', fontWeight: '700', background: RED, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 20px ${REDGLOW}0.35)` }}>14 dias grátis</button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '90px 24px 70px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '350px', background: `radial-gradient(ellipse, ${REDGLOW}0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: `${REDGLOW}0.12)`, border: `1px solid ${REDGLOW}0.25)`, borderRadius: '24px', fontSize: '13px', color: '#fca5a5', marginBottom: '28px', fontWeight: '600' }}>
          <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
          Sem cartão de crédito · 14 dias grátis
        </div>

        <h1 style={{ fontSize: '58px', fontWeight: '900', lineHeight: '1.08', margin: '0 0 22px', letterSpacing: '-1.5px' }}>
          O sistema completo<br />para sua <span style={{ background: `linear-gradient(135deg,${RED},${RED3})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ótica crescer</span>
        </h1>

        <p style={{ fontSize: '19px', color: '#94a3b8', margin: '0 0 40px', lineHeight: '1.65', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Gerencie clientes, OS, estoque e financeiro em um só lugar.<br />
          CRM automático para vender mais sem esforço extra.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '52px' }}>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '15px 36px', fontSize: '16px', fontWeight: '700', background: `linear-gradient(135deg,${RED},${RED2})`, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 24px ${REDGLOW}0.4)`, letterSpacing: '-0.2px' }}>
            Começar grátis →
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '15px 32px', fontSize: '16px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Já tenho conta
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[{ num: '1.200+', label: 'Óticas ativas' }, { num: '85.000+', label: 'OS emitidas/mês' }, { num: '99,9%', label: 'Uptime garantido' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.5px' }}>{s.num}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOTO ÓTICAS (galeria) ===== */}
      <section style={{ padding: '0 48px 70px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', borderRadius: '20px', overflow: 'hidden', maxHeight: '360px' }}>
          <img src="https://images.unsplash.com/photo-1682664175844-8db2a436bd94?w=700&h=360&fit=crop&q=80" alt="Interior da ótica" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <img src="https://images.unsplash.com/photo-1682664175832-98a0ecdfca79?w=350&h=172&fit=crop&q=80" alt="Expositores de óculos" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <img src="https://images.unsplash.com/photo-1764778055595-b641b067ab40?w=350&h=172&fit=crop&q=80" alt="Óculos na prateleira" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <img src="https://images.unsplash.com/photo-1682664175900-7771b38e1585?w=350&h=172&fit=crop&q=80" alt="Vitrine de óculos" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <img src="https://images.unsplash.com/photo-1775825094939-3759ede3dec2?w=350&h=172&fit=crop&q=80" alt="Cliente na ótica" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* ===== ESCOLHA SEU SISTEMA ===== */}
      <section style={{ background: 'rgba(255,255,255,0.018)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Escolha seu sistema</p>
          <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 36px', letterSpacing: '-0.5px' }}>Uma plataforma, dois produtos</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Card Ótica */}
            <button
              onClick={() => navigate('/cadastro?tipo=otica')}
              style={{ background: `${REDGLOW}0.06)`, border: `1px solid ${REDGLOW}0.2)`, borderRadius: '16px', padding: '0', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', overflow: 'hidden' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${REDGLOW}0.45)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${REDGLOW}0.2)`; }}
            >
              <img src="https://images.unsplash.com/photo-1776890948428-5cb3e62cc680?w=600&h=180&fit=crop&q=80" alt="Ótica" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '22px 20px' }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>Conexão Óticas</div>
                <div style={{ fontSize: '12px', color: RED3, fontWeight: '600', marginBottom: '10px' }}>Para óticas</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.55', marginBottom: '14px' }}>Clientes, OS, vendas, estoque, financeiro e CRM</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: RED3 }}>Começar grátis · 14 dias →</div>
              </div>
            </button>

            {/* Card Lab */}
            <button
              onClick={() => navigate('/interesse-lab')}
              style={{ background: `${REDGLOW}0.06)`, border: `1px solid ${REDGLOW}0.2)`, borderRadius: '16px', padding: '0', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', overflow: 'hidden' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${REDGLOW}0.45)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${REDGLOW}0.2)`; }}
            >
              <img src="https://images.unsplash.com/photo-1758573467030-52481ea92007?w=600&h=180&fit=crop&q=80" alt="Laboratório óptico" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '22px 20px' }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>Conexão Lab</div>
                <div style={{ fontSize: '12px', color: RED3, fontWeight: '600', marginBottom: '10px' }}>Para laboratórios ópticos</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.55', marginBottom: '14px' }}>Ordens de produção, óticas clientes, estoque de lentes</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: RED3 }}>Solicitar demonstração →</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ===== FUNCIONALIDADES ===== */}
      <section style={{ padding: '80px 48px', maxWidth: '1180px', margin: '0 auto' }} id="funcionalidades">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '13px', color: RED3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Funcionalidades</div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px' }}>Tudo para gerenciar sua ótica</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            Do cadastro do cliente até o pós-venda, cada funcionalidade foi pensada para o dia a dia de uma ótica.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '26px 24px' }}>
              <div style={{ fontSize: '30px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOTO LABORATÓRIO ===== */}
      <section style={{ padding: '0 48px 70px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
          <img src="https://images.unsplash.com/photo-1732064137039-1599dc5d0a17?w=1200&h=400&fit=crop&q=80" alt="Laboratório óptico" style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,13,20,0.85) 0%, rgba(10,13,20,0.2) 60%, transparent 100%)', display: 'flex', alignItems: 'center', padding: '48px' }}>
            <div style={{ maxWidth: '420px' }}>
              <div style={{ fontSize: '12px', color: RED3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Conexão Lab</div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.5px', lineHeight: '1.2' }}>Sistema completo para laboratórios ópticos</h3>
              <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 24px', lineHeight: '1.6' }}>Gerencie ordens de produção, estoque de lentes, óticas clientes e muito mais.</p>
              <button onClick={() => navigate('/interesse-lab')} style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '700', background: RED, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Solicitar demonstração →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section style={{ padding: '80px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: RED3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Como funciona</div>
          <h2 style={{ fontSize: '34px', fontWeight: '800', margin: '0 0 52px', letterSpacing: '-0.8px' }}>Comece em menos de 5 minutos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se com nome, e-mail e senha. Nenhum cartão exigido. 14 dias grátis com todos os recursos.' },
              { num: '02', title: 'Configure sua ótica', desc: 'Adicione o nome da loja e os primeiros colaboradores. Tudo pronto em minutos.' },
              { num: '03', title: 'Comece a usar', desc: 'Abra a primeira OS, registre uma venda ou cadastre um cliente. Simples desde o primeiro acesso.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '40px', fontWeight: '900', color: `${REDGLOW}0.25)`, marginBottom: '12px', fontFamily: 'monospace', letterSpacing: '-2px' }}>{s.num}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section style={{ padding: '88px 48px', maxWidth: '1100px', margin: '0 auto' }} id="planos">
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '13px', color: RED3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Planos e preços</div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.8px' }}>Preços simples e transparentes</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0 }}>14 dias grátis em qualquer plano. Cancele quando quiser, sem multa.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {PLANOS.map((p, i) => (
            <div key={i} style={{
              position: 'relative',
              background: p.destaque ? `linear-gradient(145deg, ${REDGLOW}0.15), ${REDGLOW}0.05))` : 'rgba(255,255,255,0.025)',
              border: `1px solid ${p.destaque ? REDGLOW + '0.45)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '20px', padding: '32px 28px',
              boxShadow: p.destaque ? `0 0 40px ${REDGLOW}0.15)` : 'none',
            }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${RED},${RED2})`, color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
                  ✦ Mais popular
                </div>
              )}
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>{p.nome}</h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>{p.desc}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8', alignSelf: 'flex-start', marginTop: '8px' }}>R$</span>
                <span style={{ fontSize: '44px', fontWeight: '900', letterSpacing: '-2px', color: p.destaque ? RED3 : '#f1f5f9' }}>{p.preco}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>/mês</span>
              </div>
              <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13.5px', color: f.inc ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: f.inc ? '#22c55e' : '#374151', fontWeight: '800', flexShrink: 0, marginTop: '1px', fontSize: '14px' }}>{f.inc ? '✓' : '✕'}</span>
                    <span style={{ textDecoration: f.inc ? 'none' : 'line-through', textDecorationColor: '#374151' }}>{f.texto}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/cadastro')} style={{
                width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700',
                background: p.destaque ? `linear-gradient(135deg,${RED},${RED2})` : 'transparent',
                color: p.destaque ? 'white' : '#94a3b8',
                border: p.destaque ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: p.destaque ? `0 4px 16px ${REDGLOW}0.4)` : 'none',
              }}>{p.cta}</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '24px' }}>
          Todos os planos incluem SSL, backups diários e suporte em português. Preços em BRL.
        </p>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ padding: '80px 48px', maxWidth: '760px', margin: '0 auto' }} id="faq">
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '13px', color: RED3, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>FAQ</div>
          <h2 style={{ fontSize: '34px', fontWeight: '800', margin: '0', letterSpacing: '-0.8px' }}>Perguntas frequentes</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '22px 24px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: '#f1f5f9' }}>{item.q}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.65' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '300px', background: `radial-gradient(ellipse, ${REDGLOW}0.1) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: '1.15' }}>
            Pronto para transformar<br />sua ótica?
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 36px', lineHeight: '1.6' }}>
            Comece seu teste gratuito de 14 dias. Nenhum cartão exigido.
          </p>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '16px 44px', fontSize: '17px', fontWeight: '700', background: `linear-gradient(135deg,${RED},${RED2})`, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 32px ${REDGLOW}0.45)` }}>
            Criar conta grátis →
          </button>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '16px' }}>Sem cartão · Sem contrato · Cancele quando quiser</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg,${RED},${RED2})`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800' }}>Conexão <span style={{ color: RED3 }}>Óticas</span></span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#funcionalidades" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>Funcionalidades</a>
            <a href="#planos" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>Planos</a>
            <a href="#faq" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>FAQ</a>
          </div>
          <span style={{ fontSize: '13px', color: '#334155' }}>© {new Date().getFullYear()} Conexão Óticas</span>
        </div>
      </footer>
    </div>
  );
}
