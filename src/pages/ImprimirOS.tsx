import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

interface OSCompleta {
  id: string; numero: number; tipo: string; situacao: string;
  cliente_nome: string; cliente_id: string;
  longe_od_esf?: number; longe_od_cil?: number; longe_od_eixo?: number;
  longe_oe_esf?: number; longe_oe_cil?: number; longe_oe_eixo?: number;
  perto_od_esf?: number; perto_od_cil?: number; perto_od_eixo?: number;
  perto_oe_esf?: number; perto_oe_cil?: number; perto_oe_eixo?: number;
  dp?: number; altura?: number; adicao?: number;
  armacao_desc?: string; lente_desc?: string;
  valor_total: number; valor_entrada: number; valor_restante: number;
  data_entrega?: string; medico?: string; observacao?: string;
  created_at: string;
}

interface TenantInfo {
  nome: string; email: string; telefone?: string; cnpj?: string;
  endereco?: string; cidade?: string; uf?: string;
}

function fmtGrau(v?: number) {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}
function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s?: string) {
  if (!s) return '—';
  const [y, m, d] = s.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
const TIPO_LABEL: Record<string, string> = {
  oculos_grau: 'Óculos de Grau', oculos_sol: 'Óculos de Sol',
  lente_contato: 'Lente de Contato', conserto: 'Conserto', outro: 'Outro',
};

export default function ImprimirOS() {
  const { id } = useParams<{ id: string }>();
  const [os, setOs] = useState<OSCompleta | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<OSCompleta>(`/os/${id}`),
      api.get<TenantInfo>('/configuracoes'),
    ]).then(([osData, tenantData]) => {
      setOs(osData);
      setTenant(tenantData);
      setTimeout(() => window.print(), 600);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#333' }}>Preparando impressão...</div>
  );
  if (!os) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#333' }}>OS não encontrada.</div>
  );

  const temGrau = [os.longe_od_esf, os.longe_od_cil, os.longe_oe_esf, os.longe_oe_cil].some(v => v != null);
  const temPerto = [os.perto_od_esf, os.perto_od_cil, os.perto_oe_esf, os.perto_oe_cil].some(v => v != null);

  const s: Record<string, React.CSSProperties> = {
    page: { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#1a1a1a', maxWidth: '720px', margin: '0 auto', padding: '24px', background: '#fff' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a1a', paddingBottom: '14px', marginBottom: '16px' },
    oticaName: { fontSize: '20px', fontWeight: '700', margin: '0 0 4px' },
    oticaInfo: { fontSize: '12px', color: '#555', margin: '2px 0' },
    osNum: { textAlign: 'right' as const },
    osNumVal: { fontSize: '26px', fontWeight: '700', color: '#1a1a1a' },
    osDate: { fontSize: '12px', color: '#555', marginTop: '4px' },
    section: { marginBottom: '14px' },
    sectionTitle: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: '#555', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '10px' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    field: { marginBottom: '6px' },
    fieldLabel: { fontSize: '10px', fontWeight: '600', textTransform: 'uppercase' as const, color: '#888', display: 'block', marginBottom: '2px' },
    fieldVal: { fontSize: '13px', color: '#1a1a1a' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' },
    th: { padding: '6px 8px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: '600', textAlign: 'center' as const },
    td: { padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center' as const },
    tdLeft: { padding: '6px 8px', border: '1px solid #ddd', fontWeight: '600', background: '#fafafa', textAlign: 'left' as const },
    finRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '13px' },
    finTotal: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: '4px', fontWeight: '700', fontSize: '15px', borderTop: '2px solid #1a1a1a' },
    assinatura: { display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '16px', borderTop: '1px dashed #ccc' },
    assLine: { width: '200px', borderTop: '1px solid #1a1a1a', paddingTop: '4px', fontSize: '11px', color: '#888', textAlign: 'center' as const },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.oticaName}>{tenant?.nome || 'Ótica'}</p>
          {tenant?.cnpj && <p style={s.oticaInfo}>CNPJ: {tenant.cnpj}</p>}
          {tenant?.endereco && <p style={s.oticaInfo}>{tenant.endereco}{tenant.cidade ? ` — ${tenant.cidade}${tenant.uf ? `/${tenant.uf}` : ''}` : ''}</p>}
          {tenant?.telefone && <p style={s.oticaInfo}>Tel: {tenant.telefone}</p>}
        </div>
        <div style={s.osNum}>
          <div style={s.osNumVal}>OS #{String(os.numero).padStart(4, '0')}</div>
          <div style={s.osDate}>Emitida em {fmtDate(os.created_at)}</div>
          <div style={{ ...s.osDate, marginTop: '4px' }}>{TIPO_LABEL[os.tipo] || os.tipo}</div>
        </div>
      </div>

      {/* Cliente + Médico */}
      <div style={{ ...s.section, ...s.row2 }}>
        <div>
          <div style={s.sectionTitle}>Cliente</div>
          <div style={{ fontSize: '15px', fontWeight: '600' }}>{os.cliente_nome}</div>
          {os.data_entrega && (
            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
              Entrega prevista: <strong>{fmtDate(os.data_entrega)}</strong>
            </div>
          )}
        </div>
        {os.medico && (
          <div>
            <div style={s.sectionTitle}>Médico / Clínica</div>
            <div style={{ fontSize: '14px' }}>{os.medico}</div>
          </div>
        )}
      </div>

      {/* Receita */}
      {(temGrau || temPerto) && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Receita Oftalmológica</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}></th>
                <th style={s.th}>Esf</th>
                <th style={s.th}>Cil</th>
                <th style={s.th}>Eixo</th>
              </tr>
            </thead>
            <tbody>
              {temGrau && <>
                <tr>
                  <td style={s.tdLeft}>Longe OD</td>
                  <td style={s.td}>{fmtGrau(os.longe_od_esf)}</td>
                  <td style={s.td}>{fmtGrau(os.longe_od_cil)}</td>
                  <td style={s.td}>{os.longe_od_eixo ?? '—'}°</td>
                </tr>
                <tr>
                  <td style={s.tdLeft}>Longe OE</td>
                  <td style={s.td}>{fmtGrau(os.longe_oe_esf)}</td>
                  <td style={s.td}>{fmtGrau(os.longe_oe_cil)}</td>
                  <td style={s.td}>{os.longe_oe_eixo ?? '—'}°</td>
                </tr>
              </>}
              {temPerto && <>
                <tr>
                  <td style={s.tdLeft}>Perto OD</td>
                  <td style={s.td}>{fmtGrau(os.perto_od_esf)}</td>
                  <td style={s.td}>{fmtGrau(os.perto_od_cil)}</td>
                  <td style={s.td}>{os.perto_od_eixo ?? '—'}°</td>
                </tr>
                <tr>
                  <td style={s.tdLeft}>Perto OE</td>
                  <td style={s.td}>{fmtGrau(os.perto_oe_esf)}</td>
                  <td style={s.td}>{fmtGrau(os.perto_oe_cil)}</td>
                  <td style={s.td}>{os.perto_oe_eixo ?? '—'}°</td>
                </tr>
              </>}
            </tbody>
          </table>
          {(os.dp || os.altura || os.adicao) && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '12px' }}>
              {os.dp && <span><strong>DP:</strong> {os.dp} mm</span>}
              {os.altura && <span><strong>Altura:</strong> {os.altura} mm</span>}
              {os.adicao && <span><strong>Adição:</strong> +{os.adicao}</span>}
            </div>
          )}
        </div>
      )}

      {/* Produtos */}
      {(os.armacao_desc || os.lente_desc) && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Produtos</div>
          <div style={s.row2}>
            {os.armacao_desc && (
              <div style={s.field}>
                <span style={s.fieldLabel}>Armação</span>
                <span style={s.fieldVal}>{os.armacao_desc}</span>
              </div>
            )}
            {os.lente_desc && (
              <div style={s.field}>
                <span style={s.fieldLabel}>Lente</span>
                <span style={s.fieldVal}>{os.lente_desc}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financeiro */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Financeiro</div>
        <div style={{ maxWidth: '280px' }}>
          <div style={s.finRow}><span>Valor Total</span><span>{brl(os.valor_total)}</span></div>
          <div style={s.finRow}><span>Entrada</span><span>{brl(os.valor_entrada)}</span></div>
          <div style={s.finTotal}><span>Restante</span><span>{brl(os.valor_restante)}</span></div>
        </div>
      </div>

      {/* Observação */}
      {os.observacao && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Observações</div>
          <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>{os.observacao}</p>
        </div>
      )}

      {/* Assinaturas */}
      <div style={s.assinatura}>
        <div style={s.assLine}>Assinatura do Cliente</div>
        <div style={s.assLine}>Assinatura da Ótica</div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 15mm; }
        }
        @media screen {
          body { background: #e5e7eb; }
        }
      `}</style>
    </div>
  );
}
