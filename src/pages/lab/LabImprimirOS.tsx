import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

function fmtGrau(v: number | null | undefined): string {
  if (v == null || isNaN(Number(v))) return '—';
  const n = Number(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2);
}
function fmtData(s?: string | null): string {
  if (!s) return '—';
  const [y, m, d] = s.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
function brl(v: number): string {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function nn(v: number | null | undefined, suf = ''): string {
  return v != null && !isNaN(Number(v)) ? `${Number(v)}${suf}` : '—';
}

const C: Record<string, React.CSSProperties> = {
  box: { border: '1px solid #bbb', borderRadius: '3px', marginBottom: '7px' },
  title: { fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#444', padding: '4px 8px', background: '#f0f0f0', borderBottom: '1px solid #ccc' },
  th: { padding: '4px 5px', background: '#e8e8e8', border: '1px solid #ccc', fontWeight: '700', textAlign: 'center' as const, fontSize: '9px', whiteSpace: 'nowrap' as const },
  td: { padding: '4px 5px', border: '1px solid #ddd', textAlign: 'center' as const, fontSize: '11px', fontWeight: '600' },
  tdL: { padding: '4px 6px', border: '1px solid #ddd', textAlign: 'left' as const, fontSize: '11px' },
  tdR: { padding: '4px 6px', border: '1px solid #ddd', textAlign: 'right' as const, fontSize: '11px' },
  lbl: { fontSize: '8px', fontWeight: '700', color: '#777', textTransform: 'uppercase' as const, letterSpacing: '0.4px', display: 'block', marginBottom: '1px' },
  val: { fontSize: '11px', color: '#111', fontWeight: '600' },
};

function Field({ l, v, col = false }: { l: string; v: string; col?: boolean }) {
  return (
    <div style={col ? {} : { display: 'flex', gap: '4px', alignItems: 'baseline', marginBottom: '3px' }}>
      <span style={{ ...C.lbl, display: 'inline', whiteSpace: 'nowrap' }}>{l}:&nbsp;</span>
      <span style={{ ...C.val, fontSize: '11px' }}>{v}</span>
    </div>
  );
}

const TIPO_LABEL: Record<string, string> = {
  O: 'OS NORMAL', F: 'OS FREEFORM', G: 'OS GARANTIA', U: 'VENDA/PEDIDO',
  S: 'VENDA/PEDIDO S', E: 'ENCOMENDA', R: 'ROMANEIO', D: 'DEVOLUÇÃO',
  W: 'CONTRATO', Z: 'RECIBO', L: 'PROTOCOLO', N: 'ORÇAMENTO', M: 'MOSTRUÁRIO',
};

interface OSViaProps {
  ordem: Record<string, unknown>; od: Record<string, unknown>; oe: Record<string, unknown>;
  armacao: Record<string, unknown> | null; servicos: Record<string, unknown>[];
  total: number; tenant: Record<string, unknown>; via: 'laboratorio' | 'cliente';
}

function OSVia({ ordem, od, oe, armacao, servicos, total, tenant, via }: OSViaProps) {
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', color: '#111', background: '#fff' }}>

      {/* Via badge */}
      <div style={{ textAlign: 'right', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: via === 'laboratorio' ? '#1e40af' : '#166534', marginBottom: '6px' }}>
        ▣ VIA {via === 'laboratorio' ? 'DO LABORATÓRIO' : 'DO CLIENTE'}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111', paddingBottom: '7px', marginBottom: '7px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.3px' }}>{String(tenant?.nome || 'UpÓticas Lab')}</div>
          <div style={{ fontSize: '8px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laboratório Óptico</div>
          {tenant?.telefone ? <div style={{ fontSize: '9px', color: '#555', marginTop: '1px' }}>Tel: {String(tenant.telefone)}</div> : null}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8px', color: '#777', fontWeight: '700', textTransform: 'uppercase' }}>{TIPO_LABEL[String(ordem.tipo || 'O')] || 'ORDEM DE SERVIÇO'}</div>
          <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>#{String(Number(ordem.numero) || 0).padStart(6, '0')}</div>
          <div style={{ fontSize: '9px', color: '#555' }}>Emitida: {fmtData(String(ordem.created_at || ''))}</div>
          {ordem.previsao_entrega ? <div style={{ fontSize: '9px', color: '#c00', fontWeight: '700' }}>Previsão: {fmtData(String(ordem.previsao_entrega))}</div> : null}
        </div>
      </div>

      {/* Ótica + Info OS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '7px', marginBottom: '7px' }}>
        <div style={C.box}>
          <div style={C.title}>Ótica Cliente</div>
          <div style={{ padding: '5px 7px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '2px' }}>{String(ordem.otica_nome || '—')}</div>
            {ordem.otica_telefone ? <div style={{ fontSize: '9px', color: '#555' }}>Tel: {String(ordem.otica_telefone)}</div> : null}
          </div>
        </div>
        <div style={{ ...C.box }}>
          <div style={C.title}>Dados da OS</div>
          <div style={{ padding: '5px 7px' }}>
            <Field l="Ref. Ótica" v={String(ordem.ref_otica || '—')} />
            <Field l="Cont. Interno" v={String(ordem.cont_interno || '—')} />
            <Field l="Caixa" v={String(ordem.caixa || '—')} />
            <Field l="Operador" v={String(ordem.vendedor || '—')} />
          </div>
        </div>
        <div style={{ ...C.box }}>
          <div style={C.title}>Financeiro</div>
          <div style={{ padding: '5px 7px' }}>
            <Field l="Cond." v={String(ordem.condicao_pgto || '—')} />
            <Field l="Sinal" v={ordem.sinal ? brl(Number(ordem.sinal)) : '—'} />
            <Field l="Rota" v={String(ordem.rota || '—')} />
            <Field l="Médico" v={String(ordem.medico || '—')} />
          </div>
        </div>
      </div>

      {/* RECEITA — tabela completa */}
      <div style={C.box}>
        <div style={C.title}>Receita das Lentes</div>
        <div style={{ display: 'flex', gap: '6px', padding: '6px 7px' }}>
          {/* Tabela graus */}
          <table style={{ borderCollapse: 'collapse', flex: 1 }}>
            <thead>
              <tr>
                <th style={C.th}></th>
                <th style={{ ...C.th }} colSpan={2}>GRAU LONGE</th>
                <th style={C.th}>EIXO</th>
                <th style={C.th}>ADIC</th>
                <th style={{ ...C.th }} colSpan={2}>GRAU PERTO</th>
              </tr>
              <tr>
                <th style={C.th}>OLHO</th>
                <th style={C.th}>ESF</th><th style={C.th}>CIL</th>
                <th style={C.th}></th>
                <th style={C.th}></th>
                <th style={C.th}>ESF</th><th style={C.th}>CIL</th>
              </tr>
            </thead>
            <tbody>
              {([['O/D', od], ['O/E', oe]] as const).map(([l, r]) => (
                <tr key={l}>
                  <td style={{ ...C.td, fontWeight: '800', background: '#fafafa' }}>{l}</td>
                  <td style={C.td}>{fmtGrau(r?.esf_longe as number)}</td>
                  <td style={C.td}>{fmtGrau(r?.cil_longe as number)}</td>
                  <td style={C.td}>{nn(r?.eixo_longe as number)}</td>
                  <td style={C.td}>{fmtGrau(r?.adicao as number)}</td>
                  <td style={C.td}>{fmtGrau(r?.esf_perto as number)}</td>
                  <td style={C.td}>{fmtGrau(r?.cil_perto as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Tabela DNP/PRISMA */}
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={C.th}></th>
                <th style={{ ...C.th }} colSpan={2}>DNP</th>
                <th style={C.th}>ALT</th>
                <th style={C.th}>DEC H</th>
                <th style={{ ...C.th }} colSpan={2}>PRISMA</th>
              </tr>
              <tr>
                <th style={C.th}>OLHO</th>
                <th style={C.th}>LONGE</th><th style={C.th}>PERTO</th>
                <th style={C.th}></th><th style={C.th}></th>
                <th style={C.th}>VALOR</th><th style={C.th}>EIXO</th>
              </tr>
            </thead>
            <tbody>
              {([['O/D', od], ['O/E', oe]] as const).map(([l, r]) => (
                <tr key={l}>
                  <td style={{ ...C.td, fontWeight: '800', background: '#fafafa' }}>{l}</td>
                  <td style={C.td}>{nn(r?.dnp as number)}</td>
                  <td style={C.td}>{nn(r?.dnp_perto as number)}</td>
                  <td style={C.td}>{nn(r?.alt as number)}</td>
                  <td style={C.td}>{nn(r?.dec_h as number)}</td>
                  <td style={C.td}>{String(r?.prisma || '—')}</td>
                  <td style={C.td}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Armação + Lentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '0' }}>
        <div style={C.box}>
          <div style={C.title}>Dados da Armação</div>
          <div style={{ padding: '5px 7px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' }}>
            <Field l="Tipo" v={String(armacao?.tipo_material || armacao?.material || '—')} />
            <Field l="Shape" v={String(armacao?.shape || '—')} />
            <Field l="Largura" v={nn(armacao?.largura as number, ' mm')} />
            <Field l="Altura" v={nn(armacao?.altura as number, ' mm')} />
            <Field l="Ponte" v={nn(armacao?.ponte as number, ' mm')} />
            <Field l="Maior Diag." v={nn(armacao?.maior_diagonal as number, ' mm')} />
            <Field l="Eixo M.Diag." v={nn(armacao?.eixo_maior_diagonal as number)} />
            <Field l="Diâm. Final" v={nn(armacao?.diametro_final as number, ' mm')} />
          </div>
        </div>
        <div style={C.box}>
          <div style={C.title}>Dados das Lentes e Tratamentos</div>
          <div style={{ padding: '5px 7px' }}>
            <Field l="Tipo de Lente" v={String(armacao?.tipo_lente || '—')} />
            <Field l="Marca / Material" v={String(armacao?.marca_material || '—')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', marginTop: '4px' }}>
              <Field l="O/D" v={String(armacao?.lente_od || '—')} />
              <Field l="O/E" v={String(armacao?.lente_oe || '—')} />
            </div>
            {(armacao?.etiq_garantia || armacao?.caixa) ? (
              <div style={{ marginTop: '6px', display: 'flex', gap: '10px' }}>
                {armacao?.caixa ? <Field l="Caixa" v={String(armacao.caixa)} /> : null}
                {armacao?.etiq_garantia ? <span style={{ fontSize: '9px', fontWeight: '700', color: '#166534', background: '#dcfce7', padding: '1px 5px', borderRadius: '3px' }}>GARANTIA</span> : null}
              </div>
            ) : null}
          </div>
          {/* Obs */}
          <div style={{ ...C.title, borderTop: '1px solid #ccc' }}>Observações</div>
          <div style={{ padding: '4px 7px', minHeight: '28px', fontSize: '10px', color: '#333' }}>
            {ordem.texto_gravura ? <div><b>Gravura:</b> {String(ordem.texto_gravura)}</div> : null}
            {ordem.observacoes ? <div>{String(ordem.observacoes)}</div> : null}
            {!ordem.texto_gravura && !ordem.observacoes ? <span style={{ color: '#bbb' }}>—</span> : null}
          </div>
        </div>
      </div>

      {/* Serviços */}
      {servicos?.length > 0 && (
        <div style={{ ...C.box, marginTop: '7px' }}>
          <div style={C.title}>Cobrança / Serviços</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...C.th, textAlign: 'left' as const }}>Descrição</th>
                <th style={C.th}>Qtd</th>
                <th style={C.th}>Valor Unit.</th>
                <th style={C.th}>Desconto</th>
                <th style={C.th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s, i) => (
                <tr key={i}>
                  <td style={C.tdL}>{String(s.descricao)}</td>
                  <td style={C.td}>{String(s.qtd)}</td>
                  <td style={C.tdR}>{brl(Number(s.valor_unit))}</td>
                  <td style={C.tdR}>{Number(s.desconto) > 0 ? brl(Number(s.desconto)) : '—'}</td>
                  <td style={{ ...C.tdR, fontWeight: '700' }}>{brl(Number(s.total))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ ...C.tdR, fontWeight: '700', background: '#f5f5f5', fontSize: '12px' }}>TOTAL</td>
                <td style={{ ...C.tdR, fontWeight: '900', fontSize: '13px', background: '#ebebeb' }}>{brl(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Assinatura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #aaa', marginTop: '8px' }}>
        {['Responsável pelo Laboratório', 'Recebido pela Ótica', 'Data'].map(l => (
          <div key={l} style={{ textAlign: 'center', minWidth: '150px' }}>
            <div style={{ borderTop: '1px solid #111', marginTop: '22px', paddingTop: '3px', fontSize: '8px', color: '#666' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LabImprimirOS() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [tenant, setTenant] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Record<string, unknown>>(`/lab/ordens/${id}`),
      api.get<Record<string, unknown>>('/configuracoes'),
    ]).then(([osData, tenantData]) => {
      setData(osData);
      setTenant(tenantData);
      setTimeout(() => window.print(), 700);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>Preparando impressão...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>OS não encontrada.</div>;

  const { ordem, receita, armacao, servicos } = data as {
    ordem: Record<string, unknown>;
    receita: Record<string, unknown>[];
    armacao: Record<string, unknown> | null;
    servicos: Record<string, unknown>[];
  };
  const od = receita?.find(r => r.olho === 'D') ?? {};
  const oe = receita?.find(r => r.olho === 'E') ?? {};
  const total = Number(ordem.total ?? 0);
  const props = { ordem, od, oe, armacao: armacao ?? null, servicos: servicos ?? [], total, tenant: tenant ?? {} };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '16px', background: '#fff' }}>
      <OSVia {...props} via="laboratorio" />
      <div style={{ margin: '14px 0', borderTop: '2px dashed #999', position: 'relative', textAlign: 'center' }}>
        <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: '8px', color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
          ✂ destacar aqui
        </span>
      </div>
      <OSVia {...props} via="cliente" />
      <style>{`
        @media print {
          body { margin: 0; background: #fff !important; zoom: 0.62; }
          @page { margin: 3mm; size: A4 portrait; }
        }
        @media screen { body { background: #e5e7eb; } }
      `}</style>
    </div>
  );
}
