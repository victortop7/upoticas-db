import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface VisionOSRow {
  id: string;
  numero: number;
  tipo: string;
  cliente_nome: string | null;
  valor_total: number;
  desconto: number;
  status: string;
  created_at: string;
}

type Periodo = 'hoje' | '7d' | '30d';

function startOf(periodo: Periodo): string {
  const d = new Date();
  if (periodo === 'hoje') {
    d.setHours(0, 0, 0, 0);
  } else if (periodo === '7d') {
    d.setDate(d.getDate() - 7);
  } else {
    d.setDate(d.getDate() - 30);
  }
  return d.toISOString().slice(0, 10);
}

export default function VisionAtendimentos() {
  const [tab, setTab] = useState<'atendimentos' | 'exames'>('atendimentos');
  const [periodo, setPeriodo] = useState<Periodo>('7d');
  const [rows, setRows] = useState<VisionOSRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<VisionOSRow[]>('/vision/os?limit=200').then(data => {
      setRows(data);
    }).finally(() => setLoading(false));
  }, []);

  const inicio = startOf(periodo);
  const filtrado = rows.filter(r => r.created_at.slice(0, 10) >= inicio);
  const vendas = filtrado.filter(r => r.tipo === 'venda');
  const orcamentos = filtrado.filter(r => r.tipo === 'orcamento');

  const totalVendas = vendas.reduce((s, r) => s + r.valor_total, 0);
  const totalOrc = orcamentos.length;
  const totalDesc = filtrado.reduce((s, r) => s + (r.desconto || 0), 0);
  const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

  const cards = [
    { label: 'Orçamentos', value: totalOrc, color: '#3b82f6', format: 'n' },
    { label: 'Vendas', value: vendas.length, color: '#22c55e', format: 'n' },
    { label: 'Descontos', value: totalDesc, color: '#f59e0b', format: 'brl' },
    { label: 'Ticket Médio', value: ticketMedio, color: '#a855f7', format: 'brl' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      background: '#080a0f',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', background: '#0a0c12',
        borderBottom: '1px solid #1a1f2e', padding: '0 24px',
      }}>
        {([['atendimentos', 'Atendimentos'], ['exames', 'Exames']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 18px', fontSize: 13, fontWeight: 600,
              color: tab === t ? '#3b82f6' : '#4a5568',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
              fontFamily: 'var(--sans)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {tab === 'atendimentos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Filtro período */}
            <div style={{ display: 'flex', gap: 8 }}>
              {([['hoje', 'Hoje'], ['7d', '7 Dias'], ['30d', '1 Mês']] as [Periodo, string][]).map(([p, label]) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  style={{
                    padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                    background: periodo === p ? '#3b82f6' : '#0f1218',
                    border: `1px solid ${periodo === p ? '#3b82f6' : '#1a1f2e'}`,
                    color: periodo === p ? '#fff' : '#4a5568',
                    fontSize: 13, fontFamily: 'var(--sans)',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Cards stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {cards.map(c => (
                <div key={c.label} style={{
                  background: '#0a0c12', border: `1px solid ${c.color}30`,
                  borderRadius: 14, padding: '16px 20px',
                  boxShadow: `0 4px 20px ${c.color}10`,
                }}>
                  <div style={{
                    fontSize: 11, color: '#3d4a5c', fontFamily: 'var(--mono)',
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>{c.label}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 700, color: c.color,
                    fontFamily: 'var(--mono)',
                  }}>
                    {c.format === 'brl'
                      ? c.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Lista */}
            {loading ? (
              <div style={{ color: '#3d4a5c', fontSize: 13, fontFamily: 'var(--sans)' }}>Carregando...</div>
            ) : filtrado.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                color: '#3d4a5c', fontSize: 14, fontFamily: 'var(--sans)',
              }}>
                Nenhum atendimento no período.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtrado.map(os => (
                  <div key={os.id} style={{
                    background: '#0a0c12', border: '1px solid #1a1f2e',
                    borderRadius: 10, padding: '12px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#3b82f6',
                        fontFamily: 'var(--mono)', minWidth: 36,
                      }}>#{os.numero}</span>
                      <span style={{ fontSize: 13, color: '#e8eaf0' }}>
                        {os.cliente_nome ?? '—'}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: os.tipo === 'venda' ? '#22c55e18' : '#1a1f2e',
                        color: os.tipo === 'venda' ? '#22c55e' : '#64748b',
                        fontFamily: 'var(--mono)',
                      }}>
                        {os.tipo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: os.tipo === 'venda' ? '#22c55e' : '#64748b',
                        fontFamily: 'var(--mono)',
                      }}>
                        {os.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span style={{ fontSize: 11, color: '#3d4a5c', fontFamily: 'var(--mono)' }}>
                        {new Date(os.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'exames' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', minHeight: 300,
            flexDirection: 'column', gap: 16,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#3b82f618',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>👁️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf0' }}>Teste de Visão</div>
            <div style={{ fontSize: 13, color: '#4a5568', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
              O módulo de teste de visão completo (Snellen, contraste, Ishihara) estará disponível na versão V2.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
