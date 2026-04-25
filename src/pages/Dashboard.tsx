import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

interface Stats {
  totalClientes: number;
  osAberto: number;
  osPronta: number;
  osHoje: number;
  vendasMes: number;
  osParaEntregar: { numero: number; data_entrega: string; situacao: string; cliente_nome: string }[];
  aniversariantes: { id: string; nome: string; data_nascimento: string; celular?: string }[];
}

const SITUACAO_COLOR: Record<string, string> = {
  orcamento: '#64748b', aprovado: '#2563eb', em_producao: '#d97706',
  pronto: '#16a34a', entregue: '#15803d', cancelado: '#dc2626',
};
const SITUACAO_LABEL: Record<string, string> = {
  orcamento: 'Orçamento', aprovado: 'Aprovado', em_producao: 'Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(s: string) {
  const d = s.split('T')[0];
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function mesAtual() {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return meses[new Date().getMonth()];
}

export default function Dashboard() {
  const { tenant, usuario } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: `Vendas em ${mesAtual()}`,
      value: loading ? '...' : formatBRL(stats?.vendasMes || 0),
      color: 'var(--primary)',
      bg: 'rgba(37,99,235,0.06)',
      icon: '💰',
      onClick: () => navigate('/vendas'),
    },
    {
      label: 'OS em aberto',
      value: loading ? '...' : String(stats?.osAberto || 0),
      color: '#d97706',
      bg: 'rgba(245,158,11,0.06)',
      icon: '🔧',
      onClick: () => navigate('/os'),
    },
    {
      label: 'OS prontas p/ entrega',
      value: loading ? '...' : String(stats?.osPronta || 0),
      color: '#16a34a',
      bg: 'rgba(34,197,94,0.06)',
      icon: '✅',
      onClick: () => navigate('/os'),
    },
    {
      label: 'Clientes cadastrados',
      value: loading ? '...' : String(stats?.totalClientes || 0),
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.06)',
      icon: '👤',
      onClick: () => navigate('/clientes'),
    },
  ];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>
          Painel
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>
          Bem-vindo, {usuario?.nome} — {tenant?.nome}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px 22px', cursor: 'pointer',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.boxShadow = `0 0 0 1px ${card.color}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {card.label}
              </p>
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}>{card.icon}</span>
            </div>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: card.color, fontFamily: 'var(--mono)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* OS para entregar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              Próximas Entregas
            </h3>
            <button onClick={() => navigate('/os')} style={{
              fontSize: '12px', color: 'var(--primary)', background: 'none',
              border: 'none', cursor: 'pointer', fontWeight: '500',
            }}>Ver todas →</button>
          </div>
          <div>
            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Carregando...</p>
            ) : !stats?.osParaEntregar.length ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Nenhuma entrega pendente</p>
            ) : stats.osParaEntregar.map((os, i) => (
              <div
                key={os.numero}
                onClick={() => navigate('/os')}
                style={{
                  padding: '12px 20px', cursor: 'pointer',
                  borderBottom: i < stats.osParaEntregar.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>
                    #{String(os.numero).padStart(4, '0')}
                  </span>
                  <span style={{ marginLeft: '10px', fontSize: '13px', color: 'var(--text)' }}>{os.cliente_nome}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                    background: `${SITUACAO_COLOR[os.situacao]}18`, color: SITUACAO_COLOR[os.situacao],
                  }}>{SITUACAO_LABEL[os.situacao]}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                    {formatDate(os.data_entrega)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aniversariantes */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              Aniversariantes (7 dias)
            </h3>
            <span style={{ fontSize: '18px' }}>🎂</span>
          </div>
          <div>
            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Carregando...</p>
            ) : !stats?.aniversariantes.length ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Nenhum aniversariante nos próximos 7 dias</p>
            ) : stats.aniversariantes.map((c, i) => {
              const [, m, d] = c.data_nascimento.split('-');
              return (
                <div
                  key={c.id}
                  onClick={() => navigate('/clientes')}
                  style={{
                    padding: '12px 20px', cursor: 'pointer',
                    borderBottom: i < stats.aniversariantes.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>{c.nome}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {c.celular && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{c.celular}</span>
                    )}
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600',
                      color: '#d97706', background: 'rgba(245,158,11,0.1)',
                      padding: '2px 8px', borderRadius: '6px',
                    }}>{d}/{m}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* OS abertas hoje */}
      {!loading && (stats?.osHoje || 0) > 0 && (
        <div style={{
          marginTop: '20px', background: 'rgba(37,99,235,0.05)',
          border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>
            <strong style={{ color: 'var(--primary)' }}>{stats?.osHoje}</strong> nova{stats?.osHoje !== 1 ? 's' : ''} OS abertas hoje
          </span>
          <button onClick={() => navigate('/os')} style={{
            marginLeft: 'auto', fontSize: '13px', color: 'var(--primary)',
            background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600',
          }}>Ver →</button>
        </div>
      )}
    </div>
  );
}
