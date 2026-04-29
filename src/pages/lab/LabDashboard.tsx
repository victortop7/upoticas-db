import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

interface Stats {
  total_ordens: number;
  aguardando: number;
  em_producao: number;
  prontos: number;
  entregues_hoje: number;
  total_oticas: number;
}

const STATUS_COLOR: Record<string, string> = {
  aguardando: 'var(--amber)',
  em_producao: 'var(--accent)',
  pronto: 'var(--green)',
  entregue: 'var(--text-dim)',
  cancelado: 'var(--red)',
};

const STATUS_LABEL: Record<string, string> = {
  aguardando: 'Aguardando',
  em_producao: 'Em Produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export default function LabDashboard() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentes, setRecentes] = useState<any[]>([]);

  useEffect(() => {
    api.get<{ stats: Stats; recentes: any[] }>('/lab/dashboard')
      .then(d => { setStats(d.stats); setRecentes(d.recentes); })
      .catch(() => {});
  }, []);

  const kpis = stats ? [
    { label: 'Total de Ordens', value: stats.total_ordens, color: 'var(--text)' },
    { label: 'Aguardando', value: stats.aguardando, color: 'var(--amber)' },
    { label: 'Em Produção', value: stats.em_producao, color: 'var(--accent)' },
    { label: 'Prontos p/ Retirada', value: stats.prontos, color: 'var(--green)' },
    { label: 'Entregues Hoje', value: stats.entregues_hoje, color: 'var(--green)' },
    { label: 'Óticas Clientes', value: stats.total_oticas, color: 'var(--purple)' },
  ] : [];

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '1px' }}>
            UpÓticas Lab
          </span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
        </div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>{tenant?.nome}</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-dim)' }}>Visão geral do laboratório</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {stats ? kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
          </div>
        )) : Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', height: '80px', opacity: 0.4 }} />
        ))}
      </div>

      {/* Ordens recentes */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Ordens Recentes</span>
          <button onClick={() => navigate('/lab/ordens')} style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Ver todas →
          </button>
        </div>
        {recentes.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Nenhuma ordem ainda.{' '}
            <button onClick={() => navigate('/lab/ordens/nova')} style={{ color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>
              Criar primeira OS →
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nº OS', 'Ótica', 'Serviços', 'Previsão', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentes.map((o: any) => (
                <tr key={o.id} onClick={() => navigate(`/lab/ordens/${o.id}`)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 20px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>#{String(o.numero).padStart(4, '0')}</td>
                  <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text)' }}>{o.otica_nome}</td>
                  <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-dim)' }}>{o.servicos_count} serviço(s)</td>
                  <td style={{ padding: '12px 20px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.previsao_entrega ?? '—'}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: STATUS_COLOR[o.status] ?? 'var(--text-dim)', background: `${STATUS_COLOR[o.status] ?? 'var(--text-dim)'}18`, padding: '3px 8px', borderRadius: '20px' }}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
