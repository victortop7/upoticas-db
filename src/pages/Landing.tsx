import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🔧', title: 'Ordens de Serviço', desc: 'Controle completo de OS com receita oftalmológica, situação e entrega.' },
  { icon: '👤', title: 'Clientes', desc: 'Cadastro de clientes com histórico, endereço e observações.' },
  { icon: '🛒', title: 'Vendas', desc: 'Registre vendas, aplique descontos e acompanhe o faturamento.' },
  { icon: '📊', title: 'Relatórios', desc: 'Resumo financeiro por período, top clientes e OS por situação.' },
  { icon: '🖨️', title: 'Impressão de OS', desc: 'Gere e imprima ordens de serviço formatadas com um clique.' },
  { icon: '👥', title: 'Multi-usuário', desc: 'Admin, vendedor e caixa com controle de acesso por perfil.' },
];

const PLANOS = [
  {
    nome: 'Básico',
    preco: 'R$ 49',
    periodo: '/mês',
    desc: 'Para óticas pequenas',
    features: ['Clientes ilimitados', 'OS ilimitadas', 'Vendas', 'Relatórios', '1 usuário'],
    destaque: false,
  },
  {
    nome: 'Pro',
    preco: 'R$ 89',
    periodo: '/mês',
    desc: 'Para óticas em crescimento',
    features: ['Tudo do Básico', 'Usuários ilimitados', 'Suporte prioritário', 'Impressão de OS', 'Backup automático'],
    destaque: true,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: '700' }}>Up<span style={{ color: '#2563eb' }}>Óticas</span></span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '8px 18px', fontSize: '14px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer' }}>Entrar</button>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '8px 18px', fontSize: '14px', fontWeight: '600', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Teste grátis</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '96px 24px 80px', maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '20px', fontSize: '13px', color: '#60a5fa', marginBottom: '24px', fontWeight: '500' }}>
          ✦ 14 dias grátis, sem cartão
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 20px', letterSpacing: '-1px' }}>
          O sistema que sua<br /><span style={{ color: '#2563eb' }}>ótica precisa</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', margin: '0 0 36px', lineHeight: '1.6' }}>
          Gerencie clientes, ordens de serviço e vendas em um só lugar.<br />Simples, rápido e acessível de qualquer dispositivo.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cadastro')} style={{ padding: '14px 32px', fontSize: '16px', fontWeight: '700', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            Começar grátis →
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '14px 32px', fontSize: '16px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer' }}>
            Já tenho conta
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '30px', fontWeight: '700', margin: '0 0 48px' }}>
          Tudo que você precisa para gerenciar sua ótica
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section style={{ padding: '64px 48px', maxWidth: '760px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '30px', fontWeight: '700', margin: '0 0 12px' }}>Preços simples e transparentes</h2>
        <p style={{ textAlign: 'center', fontSize: '15px', color: '#94a3b8', margin: '0 0 48px' }}>14 dias grátis em qualquer plano. Sem surpresas.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {PLANOS.map((p, i) => (
            <div key={i} style={{
              background: p.destaque ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${p.destaque ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '16px', padding: '28px',
            }}>
              {p.destaque && (
                <div style={{ display: 'inline-block', background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recomendado</div>
              )}
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700' }}>{p.nome}</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8' }}>{p.desc}</p>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '36px', fontWeight: '800', color: p.destaque ? '#60a5fa' : '#e2e8f0' }}>{p.preco}</span>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>{p.periodo}</span>
              </div>
              <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none' }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ fontSize: '14px', color: '#cbd5e1', padding: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#22c55e', fontWeight: '700' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/cadastro')} style={{
                width: '100%', padding: '12px', fontSize: '15px', fontWeight: '600',
                background: p.destaque ? '#2563eb' : 'transparent',
                color: p.destaque ? 'white' : '#94a3b8',
                border: p.destaque ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', cursor: 'pointer',
              }}>Começar grátis</button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: '13px' }}>
        © {new Date().getFullYear()} UpÓticas — Sistema de gestão para óticas
      </footer>
    </div>
  );
}
