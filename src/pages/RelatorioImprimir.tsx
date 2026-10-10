import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

interface Venda { numero: number; data: string; cliente: string; forma: string; valor: number; situacao: string; saldo: number; }
interface Vendedor { funcionario_id: string; vendedor: string; perfil: string; vendas: Venda[]; qtd: number; total: number; descontos: number; a_receber: number; ticket_medio: number; }
interface Dados {
  periodo: { inicio: string; fim: string }; loja: string | null; empresa: string;
  por_vendedor: Vendedor[]; geral: { total: number; qtd: number; ticket_medio: number };
}

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (s?: string) => { if (!s) return '—'; const d = s.split('T')[0].split('-'); return `${d[2]}/${d[1]}/${d[0]}`; };
const FORMA: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', boleto: 'Boleto', outro: 'Outro' };
const SIT: Record<string, string> = { ativa: 'Paga', pendente: 'Pendente', cancelada: 'Cancelada' };

export default function RelatorioImprimir() {
  const [sp] = useSearchParams();
  const [d, setD] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inicio = sp.get('inicio') || '';
    const fim = sp.get('fim') || '';
    api.get<Dados>(`/relatorios/export?inicio=${inicio}&fim=${fim}`)
      .then(setD).catch(() => setD(null)).finally(() => setLoading(false));
  }, [sp]);

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#333' }}>Gerando relatório…</div>;
  if (!d) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#333' }}>Não foi possível carregar.</div>;

  const th: React.CSSProperties = { textAlign: 'left', fontSize: 10.5, color: '#555', textTransform: 'uppercase', padding: '6px 8px', borderBottom: '1px solid #999', fontWeight: 700 };
  const td: React.CSSProperties = { fontSize: 12, padding: '5px 8px', borderBottom: '1px solid #eee' };
  const tdR: React.CSSProperties = { ...td, textAlign: 'right', fontFamily: 'monospace' };

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@page { size: A4; margin: 12mm; } @media print { .no-print { display: none !important; } } .vend { page-break-inside: avoid; }`}</style>

      <div className="no-print" style={{ position: 'sticky', top: 0, background: '#0b132b', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>Relatório de Vendas por Vendedor</span>
        <button onClick={() => window.print()} style={{ padding: '9px 20px', fontSize: 14, fontWeight: 700, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🖨️ Imprimir / Salvar PDF</button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 60px' }}>
        {/* Cabeçalho */}
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{d.empresa}</div>
          <div style={{ fontSize: 13, color: '#555' }}>
            Relatório de Vendas por Vendedor · {fmtData(d.periodo.inicio)} a {fmtData(d.periodo.fim)}
            {d.loja ? ` · Loja: ${d.loja}` : ''}
          </div>
        </div>

        {/* Resumo geral */}
        <div style={{ display: 'flex', gap: 24, padding: '10px 14px', background: '#f4f6f8', borderRadius: 8, marginBottom: 20 }}>
          <div><div style={{ fontSize: 10.5, color: '#666', textTransform: 'uppercase' }}>Total geral</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0b6b3a' }}>{brl(d.geral.total)}</div></div>
          <div><div style={{ fontSize: 10.5, color: '#666', textTransform: 'uppercase' }}>Nº de vendas</div><div style={{ fontSize: 18, fontWeight: 800 }}>{d.geral.qtd}</div></div>
          <div><div style={{ fontSize: 10.5, color: '#666', textTransform: 'uppercase' }}>Ticket médio</div><div style={{ fontSize: 18, fontWeight: 800 }}>{brl(d.geral.ticket_medio)}</div></div>
        </div>

        {d.por_vendedor.length === 0 && <div style={{ color: '#666', padding: 20 }}>Nenhuma venda no período.</div>}

        {/* Por vendedor */}
        {d.por_vendedor.map(v => (
          <div key={v.funcionario_id} className="vend" style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: '#111', color: '#fff', padding: '8px 12px', borderRadius: '6px 6px 0 0' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>👤 {v.vendedor}</span>
              <span style={{ fontSize: 12.5, fontFamily: 'monospace' }}>{v.qtd} venda(s) · Total {brl(v.total)} · Ticket médio {brl(v.ticket_medio)}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', borderTop: 'none' }}>
              <thead><tr>
                <th style={th}>Nº</th><th style={th}>Data</th><th style={th}>Cliente</th><th style={th}>Pagamento</th>
                <th style={{ ...th, textAlign: 'right' }}>Valor</th><th style={th}>Situação</th>
              </tr></thead>
              <tbody>
                {v.vendas.map((s, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700 }}>#{String(s.numero).padStart(4, '0')}</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{fmtData(s.data)}</td>
                    <td style={td}>{s.cliente}</td>
                    <td style={td}>{FORMA[s.forma] || s.forma}</td>
                    <td style={tdR}>{brl(s.valor)}</td>
                    <td style={td}>{SIT[s.situacao] || s.situacao}{s.saldo > 0 ? ` (falta ${brl(s.saldo)})` : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f4f6f8' }}>
                  <td style={{ ...td, fontWeight: 700 }} colSpan={4}>Subtotal — {v.vendedor} · descontos {brl(v.descontos)} · a receber {brl(v.a_receber)}</td>
                  <td style={{ ...tdR, fontWeight: 800 }}>{brl(v.total)}</td>
                  <td style={td}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        <div style={{ marginTop: 16, fontSize: 11, color: '#888', textAlign: 'right' }}>Gerado em {new Date().toLocaleString('pt-BR')}</div>
      </div>
    </div>
  );
}
