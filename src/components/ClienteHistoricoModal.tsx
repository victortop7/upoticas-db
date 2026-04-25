import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface OSItem {
  id: string; numero: number; tipo: string; situacao: string;
  valor_total: number; valor_restante: number;
  data_entrega?: string; armacao_desc?: string; created_at: string;
}
interface VendaItem {
  id: string; numero: number; situacao: string;
  valor_final: number; forma_pagamento?: string; created_at: string;
}
interface Historico {
  cliente: { id: string; nome: string };
  os: OSItem[];
  vendas: VendaItem[];
  totais: { os: number; vendas: number; gasto: number };
}

interface Props { clienteId: string; clienteNome: string; onClose: () => void; }

const SITUACAO_COLOR: Record<string, string> = {
  orcamento: '#64748b', aprovado: '#2563eb', em_producao: '#d97706',
  pronto: '#16a34a', entregue: '#15803d', cancelado: '#dc2626',
};
const SITUACAO_LABEL: Record<string, string> = {
  orcamento: 'Orçamento', aprovado: 'Aprovado', em_producao: 'Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};
const PGTO: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', boleto: 'Boleto', outro: 'Outro',
};

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }

export default function ClienteHistoricoModal({ clienteId, clienteNome, onClose }: Props) {
  const [data, setData] = useState<Historico | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'os' | 'vendas'>('os');

  useEffect(() => {
    api.get<Historico>(`/clientes/${clienteId}/historico`)
      .then(setData).finally(() => setLoading(false));
  }, [clienteId]);

  const abaBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', fontSize: '13px', fontWeight: '500',
    border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? 'white' : 'var(--text-dim)',
    marginBottom: '-1px',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '640px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{clienteNome}</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Histórico do cliente</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {/* Totais */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border)' }}>
            {[
              { label: 'Ordens de Serviço', value: String(data.totais.os), color: 'var(--primary)' },
              { label: 'Compras', value: String(data.totais.vendas), color: '#7c3aed' },
              { label: 'Total gasto', value: brl(data.totais.gasto), color: '#16a34a' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'var(--surface-alt)', padding: '14px 20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: c.color, fontFamily: 'var(--mono)' }}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Abas */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <button style={abaBtn(aba === 'os')} onClick={() => setAba('os')}>Ordens de Serviço ({data?.totais.os ?? '...'})</button>
          <button style={abaBtn(aba === 'vendas')} onClick={() => setAba('vendas')}>Vendas ({data?.totais.vendas ?? '...'})</button>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Carregando...</p>
          ) : aba === 'os' ? (
            !data?.os.length ? (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Nenhuma OS encontrada.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nº', 'Data', 'Situação', 'Armação', 'Total', 'Restante'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.os.map((os, i) => (
                    <tr key={os.id} style={{ borderBottom: i < data.os.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>#{String(os.numero).padStart(4,'0')}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{fmtDate(os.created_at)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: `${SITUACAO_COLOR[os.situacao]}18`, color: SITUACAO_COLOR[os.situacao] }}>
                          {SITUACAO_LABEL[os.situacao]}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{os.armacao_desc || '—'}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text)' }}>{brl(os.valor_total)}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', color: os.valor_restante > 0 ? '#dc2626' : 'var(--text-muted)' }}>{brl(os.valor_restante)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            !data?.vendas.length ? (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Nenhuma venda encontrada.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nº', 'Data', 'Pagamento', 'Situação', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.vendas.map((v, i) => (
                    <tr key={v.id} style={{ borderBottom: i < data.vendas.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>#{String(v.numero).padStart(4,'0')}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{fmtDate(v.created_at)}</td>
                      <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{PGTO[v.forma_pagamento || ''] || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: v.situacao === 'ativa' ? '#16a34a' : '#dc2626' }}>
                          {v.situacao === 'ativa' ? 'Ativa' : 'Cancelada'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>{brl(v.valor_final)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
