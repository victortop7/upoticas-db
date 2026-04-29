import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_COLOR: Record<string, string> = {
  aguardando: 'var(--amber)',
  em_producao: 'var(--accent)',
  pronto: 'var(--green)',
  entregue: 'var(--text-dim)',
  cancelado: 'var(--red)',
};

export default function LabOrdens() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (busca) params.set('q', busca);
    api.get<any[]>(`/lab/ordens?${params}`)
      .then(setOrdens)
      .catch(() => setOrdens([]))
      .finally(() => setLoading(false));
  }, [status, busca]);

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Ordens de Serviço</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Gerencie a fila de produção do laboratório</p>
        </div>
        <button
          onClick={() => navigate('/lab/ordens/nova')}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Nova OS
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por ótica ou nº OS..."
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STATUS_OPTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              style={{
                padding: '7px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', fontFamily: 'var(--mono)',
                background: status === s.value ? 'var(--surface-alt)' : 'transparent',
                color: status === s.value ? 'var(--text)' : 'var(--text-muted)',
                border: status === s.value ? '1px solid var(--border-light)' : '1px solid transparent',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : ordens.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Nenhuma ordem encontrada.{' '}
            <button onClick={() => navigate('/lab/ordens/nova')} style={{ color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>
              Criar OS →
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nº OS', 'Ótica', 'Ref. Ótica', 'Total', 'Previsão', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordens.map((o: any) => (
                <tr
                  key={o.id}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => navigate(`/lab/ordens/${o.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text)', fontWeight: '600' }}>#{String(o.numero).padStart(4, '0')}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)' }}>{o.otica_nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.ref_otica ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                    {o.total > 0 ? `R$ ${Number(o.total).toFixed(2).replace('.', ',')}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.previsao_entrega ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: STATUS_COLOR[o.status] ?? 'var(--text-dim)', background: `${STATUS_COLOR[o.status] ?? 'var(--text-dim)'}18`, padding: '3px 8px', borderRadius: '20px' }}>
                      {STATUS_OPTS.find(s => s.value === o.status)?.label ?? o.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/lab/ordens/${o.id}`); }}
                      style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Ver →
                    </button>
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
