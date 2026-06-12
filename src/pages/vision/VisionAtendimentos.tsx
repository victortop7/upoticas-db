import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    { label: 'Orçamentos', value: totalOrc, color: '#007aff', format: 'n' },
    { label: 'Vendas', value: vendas.length, color: '#34c759', format: 'n' },
    { label: 'Descontos', value: totalDesc, color: '#ff9500', format: 'brl' },
    { label: 'Ticket Médio', value: ticketMedio, color: '#af52de', format: 'brl' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      background: '#f2f2f7',
      color: '#1c1c1e',
    }}>
      {/* Nav bar estilo iOS */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(249,249,251,0.85)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        borderBottom: '0.5px solid rgba(60,60,67,0.22)',
        padding: '10px 14px',
        gap: 10,
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
      }}>
        <button onClick={() => navigate('/vision')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 2,
          color: '#007aff', fontSize: 15, fontWeight: 500,
          padding: '4px 6px', WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Menu
        </button>

        {/* Segmented control central */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(118,118,128,0.12)',
          borderRadius: 10, padding: 2.5, display: 'flex', gap: 2,
        }}>
          {([['atendimentos', 'Atendimentos'], ['exames', 'Exames']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? '#fff' : 'transparent',
                border: 'none', cursor: 'pointer',
                padding: '6px 22px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                color: tab === t ? '#1c1c1e' : 'rgba(60,60,67,0.6)',
                boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'all .18s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px' }}>
        {tab === 'atendimentos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            {/* Filtro período — segmented iOS */}
            <div style={{
              alignSelf: 'flex-start',
              background: 'rgba(118,118,128,0.12)',
              borderRadius: 10, padding: 2.5, display: 'flex', gap: 2,
            }}>
              {([['hoje', 'Hoje'], ['7d', '7 Dias'], ['30d', '1 Mês']] as [Periodo, string][]).map(([p, label]) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  style={{
                    padding: '6px 18px', borderRadius: 8, cursor: 'pointer',
                    background: periodo === p ? '#fff' : 'transparent',
                    border: 'none',
                    color: periodo === p ? '#1c1c1e' : 'rgba(60,60,67,0.6)',
                    fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                    boxShadow: periodo === p ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.18s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Cards stats — estilo widget iOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {cards.map(c => (
                <div key={c.label} style={{
                  background: '#fff',
                  borderRadius: 16, padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                    <div style={{
                      fontSize: 11.5, color: '#8e8e93', fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}>{c.label}</div>
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 700, color: '#1c1c1e',
                    letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {c.format === 'brl'
                      ? c.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Lista — grouped list iOS */}
            {loading ? (
              <div style={{ color: '#8e8e93', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Carregando…</div>
            ) : filtrado.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                color: '#8e8e93', fontSize: 14,
              }}>
                Nenhum atendimento no período.
              </div>
            ) : (
              <div style={{
                background: '#fff', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {filtrado.map((os, i) => (
                  <div key={os.id} style={{
                    padding: '13px 18px',
                    borderBottom: i < filtrado.length - 1 ? '0.5px solid rgba(60,60,67,0.15)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12.5, fontWeight: 700, color: '#007aff',
                        fontVariantNumeric: 'tabular-nums', minWidth: 38,
                      }}>#{os.numero}</span>
                      <span style={{ fontSize: 14, color: '#1c1c1e', fontWeight: 500 }}>
                        {os.cliente_nome ?? '—'}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 999,
                        background: os.tipo === 'venda' ? 'rgba(52,199,89,0.15)' : 'rgba(118,118,128,0.12)',
                        color: os.tipo === 'venda' ? '#248a3d' : '#8e8e93',
                        fontWeight: 600, letterSpacing: '-0.01em',
                        textTransform: 'capitalize',
                      }}>
                        {os.tipo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 14.5, fontWeight: 700,
                        color: os.tipo === 'venda' ? '#248a3d' : '#8e8e93',
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
                      }}>
                        {os.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span style={{ fontSize: 12, color: '#aeaeb2', fontVariantNumeric: 'tabular-nums' }}>
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
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(180deg, #3ba6ff 0%, #007aff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 6px 18px rgba(0,122,255,0.3)',
            }}>👁️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em' }}>Teste de Visão</div>
            <div style={{ fontSize: 13.5, color: '#8e8e93', textAlign: 'center', maxWidth: 320, lineHeight: 1.55 }}>
              O módulo de teste de visão completo (Snellen, contraste, Ishihara) estará disponível na versão V2.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
