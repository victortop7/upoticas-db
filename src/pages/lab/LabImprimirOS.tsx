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

const C: Record<string, React.CSSProperties> = {
  box: { border: '1px solid #bbb', borderRadius: '3px' },
  sectionTitle: { fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', padding: '4px 8px', background: '#f5f5f5', borderBottom: '1px solid #ddd' },
  th: { padding: '5px 6px', background: '#f0f0f0', border: '1px solid #ccc', fontWeight: '700', textAlign: 'center' as const, fontSize: '10px' },
  td: { padding: '5px 6px', border: '1px solid #ddd', textAlign: 'center' as const, fontSize: '11px' },
  tdL: { padding: '5px 6px', border: '1px solid #ddd', textAlign: 'left' as const, fontSize: '11px' },
  tdR: { padding: '5px 6px', border: '1px solid #ddd', textAlign: 'right' as const, fontSize: '11px' },
  label: { fontSize: '9px', fontWeight: '700', color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.5px', display: 'block', marginBottom: '2px' },
  val: { fontSize: '12px', color: '#111', fontWeight: '500' },
};

interface OSViaProps {
  ordem: any; od: any; oe: any; armacao: any; servicos: any[];
  total: number; tenant: any; via: 'laboratorio' | 'cliente';
}

function OSVia({ ordem, od, oe, armacao, servicos, total, tenant, via }: OSViaProps) {
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', color: '#111', background: '#fff' }}>

      {/* Badge da via */}
      <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: via === 'laboratorio' ? '#1e40af' : '#166534', background: via === 'laboratorio' ? '#dbeafe' : '#dcfce7', padding: '3px 8px', marginBottom: '8px', borderRadius: '3px' }}>
        {via === 'laboratorio' ? '▣ Via do Laboratório' : '▣ Via do Cliente'}
      </div>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: '8px', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>{tenant?.nome || 'UpÓticas Lab'}</div>
          <div style={{ fontSize: '9px', color: '#444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laboratório Óptico</div>
          {tenant?.telefone && <div style={{ fontSize: '9px', color: '#555' }}>Tel: {tenant.telefone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Ordem de Serviço</div>
          <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>#{fmtNumOS(ordem.numero)}</div>
          <div style={{ fontSize: '9px', color: '#555' }}>Emitida: {fmtData(ordem.created_at)}</div>
          {ordem.previsao_entrega && <div style={{ fontSize: '9px', color: '#555' }}>Previsão: {fmtData(ordem.previsao_entrega)}</div>}
        </div>
      </div>

      {/* Ótica + Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div style={{ ...C.box, padding: '6px 8px' }}>
          <span style={C.label}>Ótica Cliente</span>
          <div style={{ fontSize: '12px', fontWeight: '700' }}>{ordem.otica_nome}</div>
          {ordem.otica_cidade && <div style={{ fontSize: '9px', color: '#555' }}>{ordem.otica_cidade}{ordem.otica_uf ? `/${ordem.otica_uf}` : ''}</div>}
          {ordem.otica_telefone && <div style={{ fontSize: '9px', color: '#555' }}>Tel: {ordem.otica_telefone}</div>}
        </div>
        <div style={{ ...C.box, padding: '6px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
          {[
            { l: 'Ref. Ótica', v: ordem.ref_otica ?? '—' },
            { l: 'Vendedor', v: ordem.vendedor ?? '—' },
            { l: 'Cond. Pgto', v: ordem.condicao_pgto ?? '—' },
            { l: 'Previsão', v: fmtData(ordem.previsao_entrega) },
          ].map(({ l, v }) => (
            <div key={l}><span style={C.label}>{l}</span><span style={{ ...C.val, fontSize: '11px' }}>{v}</span></div>
          ))}
        </div>
      </div>

      {/* Serviços */}
      {servicos?.length > 0 && (
        <div style={{ ...C.box, marginBottom: '8px' }}>
          <div style={C.sectionTitle}>Serviços</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...C.th, textAlign: 'left' as const }}>Descrição</th>
                <th style={{ ...C.th, width: '40px' }}>Qtd</th>
                <th style={{ ...C.th, width: '80px' }}>Valor Unit.</th>
                <th style={{ ...C.th, width: '70px' }}>Desconto</th>
                <th style={{ ...C.th, width: '80px' }}>Total</th>
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
                <td colSpan={4} style={{ ...C.tdR, fontWeight: '700', background: '#f9f9f9' }}>Total Líquido</td>
                <td style={{ ...C.tdR, fontWeight: '800', background: '#f0f0f0' }}>{brl(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Receita */}
      <div style={{ ...C.box, marginBottom: '8px' }}>
        <div style={C.sectionTitle}>Receita das Lentes</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[{ titulo: 'OLHO DIREITO (OD)', dados: od }, { titulo: 'OLHO ESQUERDO (OE)', dados: oe }].map(({ titulo, dados }, i) => (
            <div key={i} style={i === 0 ? { borderRight: '1px solid #ddd' } : {}}>
              <div style={{ padding: '3px 6px', fontWeight: '700', fontSize: '10px', background: '#fafafa', borderBottom: '1px solid #eee', textAlign: 'center' }}>{titulo}</div>
              <div style={{ padding: '5px 6px' }}>
                <div style={{ fontSize: '8px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '3px' }}>Longe</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px' }}>
                  <thead><tr>{['ESF', 'CIL', 'EIXO', 'DNP', 'ALT'].map(h => <th key={h} style={{ ...C.th, fontSize: '8px', padding: '2px 3px' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    <tr>
                      <td style={{ ...C.td, fontSize: '11px', fontWeight: '600' }}>{fmtGrau(dados?.esf_longe)}</td>
                      <td style={{ ...C.td, fontSize: '11px', fontWeight: '600' }}>{fmtGrau(dados?.cil_longe)}</td>
                      <td style={{ ...C.td, fontSize: '11px', fontWeight: '600' }}>{dados?.eixo_longe ?? '—'}</td>
                      <td style={{ ...C.td, fontSize: '11px', fontWeight: '600' }}>{dados?.dnp ?? '—'}</td>
                      <td style={{ ...C.td, fontSize: '11px', fontWeight: '600' }}>{dados?.alt ?? '—'}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                  {[{ l: 'Adição', v: fmtGrau(dados?.adicao) }, { l: 'ESF Perto', v: fmtGrau(dados?.esf_perto) }, { l: 'Prisma', v: dados?.prisma ?? '—' }].map(({ l, v }) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ ...C.label, textAlign: 'center' as const }}>{l}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', border: '1px solid #ddd', padding: '2px', textAlign: 'center' as const }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Armação + Obs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div style={C.box}>
          <div style={C.sectionTitle}>Armação</div>
          <div style={{ padding: '6px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px' }}>
            {[
              { l: 'Material', v: armacao?.material ?? '—' },
              { l: 'Estojo', v: armacao?.estojo ? 'Sim' : 'Não' },
              { l: 'Ponte', v: armacao?.ponte ? `${armacao.ponte}mm` : '—' },
              { l: 'Diâmetro', v: armacao?.diametro ? `${armacao.diametro}mm` : '—' },
              { l: 'DPLIP', v: armacao?.dplip ?? '—' },
            ].map(({ l, v }) => (
              <div key={l}><span style={C.label}>{l}</span><span style={{ ...C.val, fontSize: '11px' }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={C.box}>
          <div style={C.sectionTitle}>Observações</div>
          <div style={{ padding: '6px 8px', minHeight: '44px' }}>
            {ordem.texto_gravura && <div style={{ marginBottom: '4px' }}><span style={C.label}>Gravura</span><span style={{ ...C.val, fontSize: '11px' }}>{ordem.texto_gravura}</span></div>}
            {ordem.observacoes && <div style={{ fontSize: '10px', color: '#444' }}>{ordem.observacoes}</div>}
            {!ordem.texto_gravura && !ordem.observacoes && <div style={{ fontSize: '10px', color: '#bbb' }}>—</div>}
          </div>
        </div>
      </div>

      {/* Assinatura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px dashed #bbb' }}>
        {['Responsável pelo Laboratório', 'Recebido pela Ótica'].map(l => (
          <div key={l} style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderTop: '1px solid #111', paddingTop: '3px', fontSize: '9px', color: '#666' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', color: '#333' }}>Preparando impressão...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', color: '#333' }}>OS não encontrada.</div>;

  const { ordem, receita, armacao, servicos } = data;
  const od = receita?.find((r: any) => r.olho === 'D') ?? {};
  const oe = receita?.find((r: any) => r.olho === 'E') ?? {};
  const total = Number(ordem.total ?? 0);
  const props = { ordem, od, oe, armacao, servicos, total, tenant };

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto', padding: '16px', background: '#fff', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* VIA DO LABORATÓRIO */}
      <OSVia {...props} via="laboratorio" />

      {/* SEPARADOR */}
      <div style={{ margin: '16px 0', borderTop: '2px dashed #999', textAlign: 'center', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: '9px', color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
          ✂ destacar aqui
        </span>
      </div>

      {/* VIA DO CLIENTE */}
      <OSVia {...props} via="cliente" />

      <style>{`
        @media print {
          body { margin: 0; background: #fff !important; zoom: 0.68; }
          @page { margin: 6mm; size: A4; }
        }
        @media screen {
          body { background: #e5e7eb; }
        }
      `}</style>
    </div>
  );
}
