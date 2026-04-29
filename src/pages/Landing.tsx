import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '👤',
    title: 'Clientes & CRM',
    desc: 'Cadastro completo com histórico de compras, receitas e funil de relacionamento automático. Sabe quem está pronto para voltar.',
  },
  {
    icon: '🔧',
    title: 'Ordens de Serviço',
    desc: 'OS completa com receita oftalmológica, lentes, armações, laboratório e entrega. Impressão com um clique.',
  },
  {
    icon: '🛒',
    title: 'Controle de Vendas',
    desc: 'Registre vendas, aplique descontos, controle formas de pagamento e acompanhe o faturamento em tempo real.',
  },
  {
    icon: '💰',
    title: 'Financeiro Completo',
    desc: 'Contas a pagar e a receber, fluxo de caixa e visão clara de clientes inadimplentes. Seu dinheiro sob controle.',
  },
  {
    icon: '📦',
    title: 'Estoque',
    desc: 'Controle de armações, lentes e acessórios. Alertas de estoque baixo e histórico de movimentações.',
  },
  {
    icon: '📊',
    title: 'Painel Gerencial',
    desc: 'Relatórios de vendas, OS por situação, top clientes e resumo financeiro. Tome decisões com dados reais.',
  },
  {
    icon: '🤝',
    title: 'CRM & Marketing',
    desc: 'Funil Kanban automático: pós-venda, aniversário, indicação, reativação. Mensagens prontas no WhatsApp.',
  },
  {
    icon: '👥',
    title: 'Multi-usuário',
    desc: 'Admin, vendedor e caixa com permissões separadas. Cada colaborador acessa só o que precisa.',
  },
];

const PLANOS = [
  {
    nome: 'Gestão',
    preco: '250',
    desc: 'Para óticas que querem organização',
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
      { texto: 'Controle de Inadimplência', inc: false },
      { texto: 'Marketing e Campanhas WhatsApp', inc: false },
      { texto: 'Nota Fiscal (em breve)', inc: false },
    ],
    destaque: false,
    cta: 'Começar grátis',
  },
  {
    nome: 'Gestão Pro',
    preco: '350',
    desc: 'Para óticas em crescimento',
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
      { texto: 'Controle de Inadimplência', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: false },
      { texto: 'Nota Fiscal (em breve)', inc: false },
    ],
    destaque: true,
    cta: 'Começar grátis',
  },
  {
    nome: 'Completo',
    preco: '450',
    desc: 'Para quem quer vender mais',
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
      { texto: 'Controle de Inadimplência', inc: true },
      { texto: 'Marketing e Campanhas WhatsApp', inc: true },
      { texto: 'Nota Fiscal — em breve 🔜', inc: true },
    ],
    destaque: false,
    cta: 'Começar grátis',
  },
];

const TESTIMONIALS = [
  {
    nome: 'Ana Paula S.',
    loja: 'Ótica Visão Clara',
    cidade: 'São Paulo, SP',
    texto: 'Antes eu controlava tudo em planilha. Hoje em 2 minutos sei quantas OS estão abertas, quanto vou receber e quem está devendo. Não troco por nada.',
    inicial: 'A',
    cor: '#2563eb',
  },
  {
    nome: 'Marcos R.',
    loja: 'Ótica Marcos',
    cidade: 'Belo Horizonte, MG',
    texto: 'O CRM mudou meu negócio. O sistema me avisa automaticamente quem está no aniversário e quem não volta há 1 ano. Minhas vendas de reativação triplicaram.',
    inicial: 'M',
    cor: '#7c3aed',
  },
  {
    nome: 'Fernanda L.',
    loja: 'Lentes & Luz',
    cidade: 'Curitiba, PR',
    texto: 'Sistema simples e rápido. Minha equipe aprendeu em 1 dia sem precisar de treinamento. O suporte responde rápido quando preciso.',
    inicial: 'F',
    cor: '#059669',
  },
];

const FAQ = [
  {
    q: 'Preciso instalar algum programa?',
    a: 'Não. O UpÓticas funciona 100% no navegador. Acesse de qualquer computador, tablet ou celular sem instalar nada.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Seus dados ficam armazenados na infraestrutura da Cloudflare, com backups automáticos. Nenhuma ótica concorrente acessa suas informações.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, sem multa e sem burocracia. Se cancelar, seus dados ficam disponíveis por 30 dias para exportação.',
  },
  {
    q: 'Quantos usuários posso ter?',
    a: 'Depende do plano. Básico tem 1 usuário, Pro tem até 5 e Empresarial é ilimitado. Cada usuário tem seu login e permissões.',
  },
  {
    q: 'O sistema funciona para mais de uma unidade?',
    a: 'Sim, o plano Empresarial permite gerenciar múltiplas unidades com dados separados por loja e visão consolidada.',
  },
  {
    q: 'Como funciona o período grátis?',
    a: '14 dias completos, sem cartão de crédito. Acesso a todos os recursos do plano Pro. No final você escolhe continuar ou não.',
  },
];

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
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(37,99,235,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.3px' }}>Up<span style={{ color: '#3b82f6' }}>Óticas</span></span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="#planos" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>Planos</a>
          <a href="#faq" style={{ padding: '8px 16px', fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500' }}>FAQ</a>
          <button onClick={() => navigate('/login')} style={{ padding: '8px 18px', fontSize: '14px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Entrar</button>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '8px 18px', fontSize: '14px', fontWeight: '700', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 20px rgba(37,99,235,0.35)' }}>14 dias grátis</button>
        </div>
      </nav>

      {/* Product Chooser */}
      <section style={{ background: 'rgba(255,255,255,0.018)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            Escolha seu sistema
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Card Ótica */}
            <button
              onClick={() => navigate('/cadastro?tipo=otica')}
              style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '14px', padding: '24px 20px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(37,99,235,0.14)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(37,99,235,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(37,99,235,0.22)'; }}
            >
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>🏪</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>UpÓticas</div>
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginBottom: '8px' }}>Para óticas</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.55' }}>Clientes, OS, vendas, estoque e financeiro</div>
              <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: '700', color: '#3b82f6' }}>Começar grátis →</div>
            </button>

            {/* Card Lab */}
            <button
              onClick={() => navigate('/cadastro?tipo=lab')}
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', borderRadius: '14px', padding: '24px 20px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.14)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.22)'; }}
            >
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>🔬</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>UpÓticas Lab</div>
              <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: '600', marginBottom: '8px' }}>Para laboratórios ópticos</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.55' }}>Ordens de produção, fila, óticas clientes e faturamento</div>
              <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: '700', color: '#a855f7' }}>Começar grátis →</div>
            </button>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '24px', fontSize: '13px', color: '#93c5fd', marginBottom: '28px', fontWeight: '600' }}>
          <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
          Sem cartão de crédito · 14 dias grátis
        </div>

        <h1 style={{ fontSize: '58px', fontWeight: '900', lineHeight: '1.08', margin: '0 0 22px', letterSpacing: '-1.5px' }}>
          O sistema completo<br />para a sua <span style={{ color: '#3b82f6', background: 'linear-gradient(135deg,#2563eb,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ótica crescer</span>
        </h1>

        <p style={{ fontSize: '19px', color: '#94a3b8', margin: '0 0 40px', lineHeight: '1.65', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Gerencie clientes, OS, estoque e financeiro em um só lugar.<br />
          CRM automático para vender mais sem esforço extra.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '52px' }}>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '15px 36px', fontSize: '16px', fontWeight: '700', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(37,99,235,0.4)', letterSpacing: '-0.2px' }}>
            Começar grátis →
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '15px 32px', fontSize: '16px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Já tenho conta
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { num: '1.200+', label: 'Óticas ativas' },
            { num: '85.000+', label: 'OS emitidas/mês' },
            { num: '99,9%', label: 'Uptime garantido' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.5px' }}>{s.num}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: '1180px', margin: '0 auto' }} id="funcionalidades">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Funcionalidades</div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.8px' }}>
            Tudo para gerenciar sua ótica
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            Do cadastro do cliente até o pós-venda, cada funcionalidade foi pensada para o dia a dia de uma ótica.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '26px 24px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ fontSize: '30px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ padding: '80px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Como funciona</div>
          <h2 style={{ fontSize: '34px', fontWeight: '800', margin: '0 0 52px', letterSpacing: '-0.8px' }}>Comece em menos de 5 minutos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se com nome, e-mail e senha. Nenhum cartão exigido. 14 dias grátis com todos os recursos.' },
              { num: '02', title: 'Configure sua ótica', desc: 'Adicione o nome da loja, logo e os primeiros colaboradores. Importe clientes existentes em segundos.' },
              { num: '03', title: 'Comece a usar', desc: 'Abra a primeira OS, registre uma venda ou cadastre um cliente. O sistema é intuitivo desde o primeiro acesso.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '40px', fontWeight: '900', color: 'rgba(59,130,246,0.2)', marginBottom: '12px', fontFamily: 'monospace', letterSpacing: '-2px' }}>{s.num}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section style={{ padding: '88px 48px', maxWidth: '1100px', margin: '0 auto' }} id="planos">
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Planos e preços</div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.8px' }}>Preços simples e transparentes</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0 }}>14 dias grátis em qualquer plano. Cancele quando quiser, sem multa.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {PLANOS.map((p, i) => (
            <div key={i} style={{
              position: 'relative',
              background: p.destaque ? 'linear-gradient(145deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${p.destaque ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '20px', padding: '32px 28px',
              boxShadow: p.destaque ? '0 0 40px rgba(37,99,235,0.15)' : 'none',
            }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
                  ✦ Mais popular
                </div>
              )}

              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>{p.nome}</h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>{p.desc}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8', alignSelf: 'flex-start', marginTop: '8px' }}>R$</span>
                <span style={{ fontSize: '44px', fontWeight: '900', letterSpacing: '-2px', color: p.destaque ? '#60a5fa' : '#f1f5f9' }}>{p.preco}</span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>/mês</span>
              </div>

              <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '13.5px', color: f.inc ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: f.inc ? '#22c55e' : '#374151', fontWeight: '800', flexShrink: 0, marginTop: '1px', fontSize: '14px' }}>
                      {f.inc ? '✓' : '✕'}
                    </span>
                    <span style={{ textDecoration: f.inc ? 'none' : 'line-through', textDecorationColor: '#374151' }}>{f.texto}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/cadastro')}
                style={{
                  width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700',
                  background: p.destaque ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'transparent',
                  color: p.destaque ? 'white' : '#94a3b8',
                  border: p.destaque ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: p.destaque ? '0 4px 16px rgba(37,99,235,0.4)' : 'none',
                }}
              >{p.cta}</button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '24px' }}>
          Todos os planos incluem SSL, backups diários e suporte em português. Preços em BRL.
        </p>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Depoimentos</div>
            <h2 style={{ fontSize: '34px', fontWeight: '800', margin: '0', letterSpacing: '-0.8px' }}>O que nossos clientes dizem</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px 24px' }}>
                <div style={{ display: 'flex', marginBottom: '6px' }}>
                  {[...Array(5)].map((_, j) => <span key={j} style={{ color: '#fbbf24', fontSize: '14px' }}>★</span>)}
                </div>
                <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.65', fontStyle: 'italic' }}>
                  "{t.texto}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                    {t.inicial}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{t.nome}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{t.loja} · {t.cidade}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 48px', maxWidth: '760px', margin: '0 auto' }} id="faq">
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>FAQ</div>
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

      {/* CTA Final */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '300px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: '1.15' }}>
            Pronto para transformar<br />sua ótica?
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 36px', lineHeight: '1.6' }}>
            Comece seu teste gratuito de 14 dias. Nenhum cartão exigido.<br />
            Configure em minutos e comece a usar hoje.
          </p>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '16px 44px', fontSize: '17px', fontWeight: '700',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white',
            border: 'none', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 32px rgba(37,99,235,0.45)',
          }}>
            Criar conta grátis →
          </button>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '16px' }}>
            Sem cartão · Sem contrato · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800' }}>Up<span style={{ color: '#3b82f6' }}>Óticas</span></span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#funcionalidades" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>Funcionalidades</a>
            <a href="#planos" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>Planos</a>
            <a href="#faq" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>FAQ</a>
          </div>
          <span style={{ fontSize: '13px', color: '#334155' }}>© {new Date().getFullYear()} UpÓticas</span>
        </div>
      </footer>
    </div>
  );
}
