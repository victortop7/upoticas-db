import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { tenant, usuario } = useAuth();

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>
        Painel de Informações
      </h1>
      <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'var(--text-dim)' }}>
        Bem-vindo, {usuario?.nome} — {tenant?.nome}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Vendas do mês', value: 'R$ 0,00', color: 'var(--primary)' },
          { label: 'OS em aberto', value: '0', color: 'var(--amber)' },
          { label: 'OS prontas', value: '0', color: 'var(--green)' },
          { label: 'Clientes cadastrados', value: '0', color: 'var(--purple)' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {card.label}
            </p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: card.color, fontFamily: 'var(--mono)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '32px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: '12px', padding: '24px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px'
      }}>
        Em breve: gráficos, OS a entregar, aniversariantes e muito mais.
      </div>
    </div>
  );
}
