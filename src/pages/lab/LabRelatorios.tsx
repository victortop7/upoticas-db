import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface OticaRow {
  otica_id: string;
  otica_nome: string;
  total_pedidos: number;
  valor_total: number;
}

interface ServicoRow {
  descricao: string;
  qtd_total: number;
  valor_total: number;
}

interface Dados {
  oticas: OticaRow[];
  servicos: ServicoRow[];
  totais: { total_pedidos: number; valor_total: number } | null;
  meses: string[];
}

function brl(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtMes(m: string) {
  const [y, mo] = m.split('-');
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${nomes[parseInt(mo) - 1]}/${y}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function LabRelatorios() {
  const [mes, setMes] = useState(mesAtual());
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<Dados>(`/lab/relatorios/mensal?mes=${mes}`)
      .then(setDados)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mes]);

  const CARD: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px 24px',
  };

  const maiorValor = dados?.oticas.reduce((m, o) => Math.max(m, o.valor_total), 0) || 1;
  const totalPedidos = dados?.totais?.total_pedidos ?? 0;
  const totalValor = dados?.totais?.valor_total ?? 0;

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Relatório Mensal</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-dim)' }}>Pedidos e valores por ótica cliente — {fmtMes(mes)}</p>
        </div>
        <button
          className="no-print"
          onClick={() => window.print()}
          style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: '#880000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* Filtro de mês */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        {(dados?.meses ?? []).map(m => (
          <button
            key={m}
            onClick={() => setMes(m)}
            style={{
              padding: '6px 14px', fontSize: '12px', fontWeight: '600',
              borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
              background: mes === m ? '#880000' : 'var(--surface-alt)',
              color: mes === m ? '#ffffff' : 'var(--text-dim)',
              border: mes === m ? 'none' : '1px solid var(--border)',
            }}
          >
            {fmtMes(m)}
          </button>
        ))}
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          style={{
            padding: '5px 10px', fontSize: '12px', borderRadius: '8px',
            background: 'var(--surface-alt)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'inherit', cursor: 'pointer',
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando...</div>
      ) : (
        <>
          {/* Cards totais */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={CARD}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total de Pedidos</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--mono)' }}>{totalPedidos}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>em {fmtMes(mes)}</div>
            </div>
            <div style={CARD}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Valor Total</div>
              <div style={{ fontSize: '30px', fontWeight: '800', color: '#cc0000', fontFamily: 'var(--mono)' }}>{brl(totalValor)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>em {fmtMes(mes)}</div>
            </div>
          </div>

          {/* Tabela */}
          <div style={CARD}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>
              Pedidos por Ótica — {fmtMes(mes)}
            </div>

            {!dados?.oticas.length ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Nenhum pedido encontrado neste período
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Ótica', 'Pedidos', 'Valor Total', 'Participação'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Ótica' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.oticas.map((o, i) => {
                    const pct = Math.round((o.valor_total / (totalValor || 1)) * 100);
                    return (
                      <tr key={o.otica_id} style={{ borderBottom: i < dados.oticas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 12px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{o.otica_nome}</td>
                        <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--mono)' }}>{o.total_pedidos}</td>
                        <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: '600' }}>{brl(o.valor_total)}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <div style={{ width: '80px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.round((o.valor_total / maiorValor) * 100)}%`, height: '100%', background: '#cc0000', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', width: '32px', textAlign: 'right' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Total</td>
                    <td style={{ padding: '12px 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--mono)' }}>{totalPedidos}</td>
                    <td style={{ padding: '12px 12px', fontSize: '13px', fontWeight: '700', color: '#cc0000', textAlign: 'right', fontFamily: 'var(--mono)' }}>{brl(totalValor)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
          {/* Tabela de serviços */}
          {(dados?.servicos?.length ?? 0) > 0 && (
            <div style={{ ...CARD, marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>
                Serviços Realizados — {fmtMes(mes)}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Serviço', 'Qtd', 'Valor Total'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Serviço' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados!.servicos.map((s, i) => (
                    <tr key={i} style={{ borderBottom: i < dados!.servicos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{s.descricao}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--mono)' }}>{s.qtd_total}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: '600' }}>{brl(s.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Total</td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text)', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                      {dados!.servicos.reduce((a, s) => a + s.qtd_total, 0)}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '700', color: '#cc0000', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                      {brl(dados!.servicos.reduce((a, s) => a + s.valor_total, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
