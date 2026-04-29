import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

function fmtGrau(v: number | null | undefined, sinal = true): string {
  if (v == null || isNaN(Number(v))) return '—';
  const n = Number(v);
  return (sinal && n >= 0 ? '+' : '') + n.toFixed(2);
}

function fmtData(s?: string): string {
  if (!s) return '—';
  const d = s.split('T')[0];
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

function brl(v: number): string {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtNumOS(n: number): string {
  return String(n).padStart(6, '0');
}

export default function LabImprimirOS() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/lab/ordens/${id}`),
      api.get<any>('/configuracoes'),
    ]).then(([osData, tenantData]) => {
      setData(osData);
      setTenant(tenantData);
      setTimeout(() => window.print(), 700);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      Preparando impressão...
    </div>
  );
  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      OS não encontrada.
    </div>
  );

  const { ordem, receita, armacao, servicos } = data;
  const od = receita?.find((r: any) => r.olho === 'D') ?? {};
  const oe = receita?.find((r: any) => r.olho === 'E') ?? {};
  const total = Number(ordem.total ?? 0);

  const C: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: '#111',
      maxWidth: '740px',
      margin: '0 auto',
      padding: '20px',
      background: '#fff',
    },
    box: {
      border: '1px solid #bbb',
      borderRadius: '3px',
    },
    sectionTitle: {
      fontSize: '9px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: '#555',
      padding: '4px 8px',
      background: '#f5f5f5',
      borderBottom: '1px solid #ddd',
    },
    th: {
      padding: '5px 6px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      fontWeight: '700',
      textAlign: 'center' as const,
      fontSize: '10px',
    },
    td: {
      padding: '5px 6px',
      border: '1px solid #ddd',
      textAlign: 'center' as const,
      fontSize: '11px',
    },
    tdL: {
      padding: '5px 6px',
      border: '1px solid #ddd',
      textAlign: 'left' as const,
      fontSize: '11px',
    },
    tdR: {
      padding: '5px 6px',
      border: '1px solid #ddd',
      textAlign: 'right' as const,
      fontSize: '11px',
    },
    label: {
      fontSize: '9px',
      fontWeight: '700',
      color: '#666',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      display: 'block',
      marginBottom: '2px',
    },
    val: {
      fontSize: '12px',
      color: '#111',
      fontWeight: '500',
    },
  };

  return (
    <div style={C.page}>

      {/* ===== CABEÇALHO ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            {tenant?.nome || 'UpÓticas Lab'}
          </div>
          <div style={{ fontSize: '10px', color: '#444', marginTop: '2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Laboratório Óptico
          </div>
          {tenant?.endereco && (
            <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
              {tenant.endereco}{tenant.cidade ? ` — ${tenant.cidade}${tenant.uf ? `/${tenant.uf}` : ''}` : ''}
            </div>
          )}
          {tenant?.telefone && <div style={{ fontSize: '10px', color: '#555' }}>Tel: {tenant.telefone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Ordem de Serviço
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>
            #{fmtNumOS(ordem.numero)}
          </div>
          <div style={{ fontSize: '10px', color: '#555', marginTop: '6px' }}>
            Emitida em: <strong>{fmtData(ordem.created_at)}</strong>
          </div>
          {ordem.previsao_entrega && (
            <div style={{ fontSize: '10px', color: '#555' }}>
              Previsão: <strong>{fmtData(ordem.previsao_entrega)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ===== ÓTICA CLIENTE + INFO ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {/* Ótica */}
        <div style={{ ...C.box, padding: '8px 10px' }}>
          <span style={C.label}>Ótica Cliente</span>
          <div style={{ fontSize: '14px', fontWeight: '700' }}>{ordem.otica_nome}</div>
          {ordem.otica_cnpj && <div style={{ fontSize: '10px', color: '#555' }}>CNPJ: {ordem.otica_cnpj}</div>}
          {ordem.otica_cidade && (
            <div style={{ fontSize: '10px', color: '#555' }}>
              {ordem.otica_cidade}{ordem.otica_uf ? `/${ordem.otica_uf}` : ''}
            </div>
          )}
          {ordem.otica_telefone && <div style={{ fontSize: '10px', color: '#555' }}>Tel: {ordem.otica_telefone}</div>}
        </div>

        {/* Info OS */}
        <div style={{ ...C.box, padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          {[
            { l: 'Ref. Ótica', v: ordem.ref_otica ?? '—' },
            { l: 'Vendedor', v: ordem.vendedor ?? '—' },
            { l: 'Cond. Pagamento', v: ordem.condicao_pgto ?? '—' },
            { l: 'Entrega Prevista', v: fmtData(ordem.previsao_entrega) },
          ].map(({ l, v }) => (
            <div key={l}>
              <span style={C.label}>{l}</span>
              <span style={C.val}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SERVIÇOS ===== */}
      {servicos?.length > 0 && (
        <div style={{ ...C.box, marginBottom: '10px' }}>
          <div style={C.sectionTitle}>Serviços</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...C.th, textAlign: 'left' as const }}>Descrição</th>
                <th style={{ ...C.th, width: '50px' }}>Qtd</th>
                <th style={{ ...C.th, width: '90px' }}>Valor Unit.</th>
                <th style={{ ...C.th, width: '80px' }}>Desconto</th>
                <th style={{ ...C.th, width: '90px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s: any, i: number) => (
                <tr key={i}>
                  <td style={C.tdL}>{s.descricao}</td>
                  <td style={C.td}>{s.qtd}</td>
                  <td style={C.tdR}>{brl(s.valor_unit)}</td>
                  <td style={C.tdR}>{s.desconto > 0 ? brl(s.desconto) : '—'}</td>
                  <td style={{ ...C.tdR, fontWeight: '700' }}>{brl(s.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ ...C.tdR, fontWeight: '700', background: '#f9f9f9', fontSize: '12px' }}>
                  Total Líquido
                </td>
                <td style={{ ...C.tdR, fontWeight: '800', fontSize: '13px', background: '#f0f0f0' }}>
                  {brl(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ===== RECEITA DAS LENTES ===== */}
      <div style={{ ...C.box, marginBottom: '10px' }}>
        <div style={C.sectionTitle}>Receita das Lentes</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

          {/* OD */}
          <div style={{ borderRight: '1px solid #ddd' }}>
            <div style={{ padding: '4px 8px', fontWeight: '700', fontSize: '11px', background: '#fafafa', borderBottom: '1px solid #eee', textAlign: 'center' }}>
              OLHO DIREITO (OD)
            </div>
            <div style={{ padding: '6px 8px' }}>
              {/* Longe */}
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Longe</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
                <thead>
                  <tr>
                    {['ESF', 'CIL', 'EIXO', 'DNP', 'ALT'].map(h => (
                      <th key={h} style={{ ...C.th, fontSize: '9px', padding: '3px 4px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{fmtGrau(od.esf_longe)}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{fmtGrau(od.cil_longe)}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{od.eixo_longe ?? '—'}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{od.dnp ?? '—'}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{od.alt ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
              {/* Adição + Perto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...C.label, textAlign: 'center' as const }}>Adição</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', border: '1px solid #ddd', padding: '3px', textAlign: 'center' as const }}>{fmtGrau(od.adicao)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...C.label, textAlign: 'center' as const }}>ESF Perto</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', border: '1px solid #ddd', padding: '3px', textAlign: 'center' as const }}>{fmtGrau(od.esf_perto)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...C.label, textAlign: 'center' as const }}>Prisma</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', border: '1px solid #ddd', padding: '3px', textAlign: 'center' as const }}>{od.prisma ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* OE */}
          <div>
            <div style={{ padding: '4px 8px', fontWeight: '700', fontSize: '11px', background: '#fafafa', borderBottom: '1px solid #eee', textAlign: 'center' }}>
              OLHO ESQUERDO (OE)
            </div>
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Longe</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
                <thead>
                  <tr>
                    {['ESF', 'CIL', 'EIXO', 'DNP', 'ALT'].map(h => (
                      <th key={h} style={{ ...C.th, fontSize: '9px', padding: '3px 4px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{fmtGrau(oe.esf_longe)}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{fmtGrau(oe.cil_longe)}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{oe.eixo_longe ?? '—'}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{oe.dnp ?? '—'}</td>
                    <td style={{ ...C.td, fontSize: '12px', fontWeight: '600' }}>{oe.alt ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...C.label, textAlign: 'center' as const }}>Adição</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', border: '1px solid #ddd', padding: '3px', textAlign: 'center' as const }}>{fmtGrau(oe.adicao)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...C.label, textAlign: 'center' as const }}>ESF Perto</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', border: '1px solid #ddd', padding: '3px', textAlign: 'center' as const }}>{fmtGrau(oe.esf_perto)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...C.label, textAlign: 'center' as const }}>Prisma</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', border: '1px solid #ddd', padding: '3px', textAlign: 'center' as const }}>{oe.prisma ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ARMAÇÃO + OBS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {/* Armação */}
        <div style={C.box}>
          <div style={C.sectionTitle}>Armação</div>
          <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 10px' }}>
            {[
              { l: 'Material', v: armacao?.material ?? '—' },
              { l: 'Estojo', v: armacao?.estojo ? 'Sim' : 'Não' },
              { l: 'Ponte', v: armacao?.ponte ? `${armacao.ponte} mm` : '—' },
              { l: 'Diâmetro', v: armacao?.diametro ? `${armacao.diametro} mm` : '—' },
              { l: 'DPLIP', v: armacao?.dplip ?? '—' },
            ].map(({ l, v }) => (
              <div key={l}>
                <span style={C.label}>{l}</span>
                <span style={{ ...C.val, fontSize: '12px' }}>{v}</span>
              </div>
            ))}
          </div>
          {armacao?.informacoes && (
            <div style={{ padding: '4px 10px 8px', fontSize: '10px', color: '#555', borderTop: '1px solid #eee' }}>
              {armacao.informacoes}
            </div>
          )}
        </div>

        {/* Observações */}
        <div style={C.box}>
          <div style={C.sectionTitle}>Observações</div>
          <div style={{ padding: '8px 10px', minHeight: '60px' }}>
            {ordem.texto_gravura && (
              <div style={{ marginBottom: '6px' }}>
                <span style={C.label}>Gravura</span>
                <span style={{ ...C.val, fontSize: '12px' }}>{ordem.texto_gravura}</span>
              </div>
            )}
            {ordem.observacoes && (
              <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.5' }}>{ordem.observacoes}</div>
            )}
            {!ordem.texto_gravura && !ordem.observacoes && (
              <div style={{ fontSize: '11px', color: '#bbb' }}>—</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== ASSINATURAS ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '12px', borderTop: '1px dashed #bbb' }}>
        {['Responsável pelo Laboratório', 'Recebido pela Ótica'].map(label => (
          <div key={label} style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderTop: '1px solid #111', paddingTop: '4px', fontSize: '10px', color: '#666' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ===== RODAPÉ ===== */}
      <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #eee', fontSize: '9px', color: '#aaa', textAlign: 'center' }}>
        OS #{fmtNumOS(ordem.numero)} · Emitida em {fmtData(ordem.created_at)} · UpÓticas Lab
      </div>

      <style>{`
        @media print {
          body { margin: 0; background: #fff !important; }
          @page { margin: 12mm; size: A4; }
        }
        @media screen {
          body { background: #e5e7eb; }
        }
      `}</style>
    </div>
  );
}
