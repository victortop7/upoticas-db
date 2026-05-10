import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

function fg(v: number | null | undefined): string {
  if (v == null || isNaN(Number(v))) return '';
  const n = Number(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2);
}
function fd(s?: string | null): string {
  if (!s) return '';
  const p = s.split('T')[0].split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}
function brl(v: unknown): string {
  const n = Number(v ?? 0);
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function nn(v: unknown, suf = ''): string {
  const n = Number(v);
  return v != null && !isNaN(n) && n !== 0 ? `${n}${suf}` : '';
}

const B: React.CSSProperties = { border: '1px solid #000' };
const TH: React.CSSProperties = { padding: '1px 3px', background: '#ddd', border: '1px solid #aaa', fontSize: '8px', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '1px 3px', border: '1px solid #ddd', fontSize: '9px', textAlign: 'center', whiteSpace: 'nowrap' };
const TDL: React.CSSProperties = { ...TD, textAlign: 'left' };

interface Props {
  ordem: Record<string, unknown>;
  od: Record<string, unknown>;
  oe: Record<string, unknown>;
  armacao: Record<string, unknown> | null;
  servicos: Record<string, unknown>[];
  tenant: Record<string, unknown>;
  via: 'LAB' | 'CLIENTE';
}

function OSSlip({ ordem, od, oe, armacao, servicos, tenant, via }: Props) {
  const total = Number(ordem.total ?? 0);
  const frete = Number(ordem.frete ?? 0);
  const caixa = String(ordem.caixa || '—');
  const condPgto = String(ordem.condicao_pgto || ordem.otica_cond_pgto || 'A VISTA');

  return (
    <div style={{ width: '100%', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9px', color: '#000', lineHeight: '1.2', boxSizing: 'border-box' }}>

      {/* ── CABEÇALHO ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '2px', marginBottom: '3px' }}>
        <div style={{ minWidth: '90px' }}>
          <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '-0.5px' }}>{String(tenant?.nome_reduzido || tenant?.nome || 'LABORATÓRIO')}</div>
          <div style={{ fontSize: '7px', color: '#555', textTransform: 'uppercase' }}>Laboratório Óptico</div>
          {tenant?.telefone ? <div style={{ fontSize: '7px', color: '#555' }}>{String(tenant.telefone)}</div> : null}
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>SERVIÇO {String(Number(ordem.numero) || 0).padStart(6, '0')}</div>
          <div style={{ fontSize: '8px' }}>USUÁRIO: {String(ordem.usuario_receita || ordem.vendedor || '—')}</div>
          <div style={{ fontSize: '8px' }}>DATA: {fd(String(ordem.created_at || ''))} &nbsp; CAIXA: {caixa}</div>
          <div style={{ fontSize: '8px' }}>PREVISÃO PRD: {fd(String(ordem.previsao_entrega || ''))}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '8px', fontWeight: '700', color: '#555', minWidth: '60px' }}>
          <div>VIA DO {via}</div>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#000' }}>#{String(Number(ordem.numero) || 0).padStart(6, '0')}</div>
        </div>
      </div>

      {/* ── CLIENTE + REFERÊNCIA + SERVIÇOS RESUMO ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>

        {/* Box cliente */}
        <div style={{ ...B, padding: '2px 4px', flex: '0 0 44%' }}>
          <div style={{ fontSize: '9px', fontWeight: '700' }}>CLIENTE: {String(ordem.otica_nome || '—')}</div>
          {String(ordem.otica_endereco || '') && <div>END: {String(ordem.otica_endereco)}</div>}
          {String(ordem.otica_bairro || '') && <div>BAIRRO: {String(ordem.otica_bairro)}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            {String(ordem.otica_cidade || '') && <span>CIDADE: {String(ordem.otica_cidade)}</span>}
            {String(ordem.otica_uf || '') && <span>UF: {String(ordem.otica_uf)}</span>}
            {String(ordem.otica_cep || '') && <span>CEP: {String(ordem.otica_cep)}</span>}
          </div>
        </div>

        {/* Referência + tabela serviços resumo */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '8px' }}>
            <span>REF.CLI: <b>{String(ordem.ref_otica || '—')}</b></span>
            <span>ENTREGA: <b>{fd(String(ordem.previsao_entrega || ''))}</b></span>
            <span>CONT.INT: <b>{String(ordem.cont_interno || '—')}</b></span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '8px' }}>
            <span>VENDEDOR: {String(ordem.vendedor || '—')}</span>
            <span>CONDIÇÃO PGTO: <b>{condPgto}</b></span>
          </div>
          {/* Tabela resumo de serviços */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1px' }}>
            <thead>
              <tr>
                <th style={TH}>QTD</th>
                <th style={TH}>V.UNIT</th>
                <th style={TH}>%DESC</th>
                <th style={TH}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {servicos.filter(s => s.descricao).map((s, i) => (
                <tr key={i}>
                  <td style={TD}>{String(s.qtd || '')}</td>
                  <td style={TD}>{brl(s.valor_unit)}</td>
                  <td style={TD}>{s.perc_desc ? `${Number(s.perc_desc).toFixed(2)}` : '—'}</td>
                  <td style={{ ...TD, fontWeight: '700' }}>{brl(s.total || s.total_liq)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABELA PRODUTOS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', ...B, marginBottom: '3px' }}>
        <thead>
          <tr style={{ background: '#ddd', borderBottom: '1px solid #000' }}>
            <th style={{ ...TH, width: '50px', textAlign: 'left', paddingLeft: '4px' }}>CÓDIGO</th>
            <th style={{ ...TH, textAlign: 'left', paddingLeft: '4px' }}>DESCRIÇÃO</th>
            <th style={{ ...TH, width: '35px' }}>QTD.</th>
          </tr>
        </thead>
        <tbody>
          {servicos.filter(s => s.descricao).map((s, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ ...TDL, paddingLeft: '4px', fontSize: '8px', color: '#333' }}>{String(s.codigo || '')}</td>
              <td style={{ ...TDL, paddingLeft: '4px' }}>{String(s.descricao)}</td>
              <td style={TD}>{String(s.qtd || '')}</td>
            </tr>
          ))}
          {servicos.filter(s => s.descricao).length === 0 && (
            <tr><td colSpan={3} style={{ ...TDL, paddingLeft: '4px', color: '#aaa' }}>—</td></tr>
          )}
        </tbody>
      </table>

      {/* ── TOTAIS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: '9px', fontWeight: '700' }}>
        <div>
          Frete|Total: &nbsp;{brl(frete)} | {brl(total)}
          &nbsp;&nbsp; QTD.: {servicos.filter(s => s.descricao).reduce((a, s) => a + (Number(s.qtd) || 0), 0).toFixed(2)}
        </div>
        <div style={{ fontSize: '10px', border: '1px solid #000', padding: '1px 6px' }}>
          TOTAL LÍQUIDO: <span style={{ fontSize: '11px' }}>{brl(total)}</span>
        </div>
      </div>

      {/* ── RECEITA: OD + OE LADO A LADO ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
        {([['D', od, 'OLHO DIREITO'], ['E', oe, 'OLHO ESQUERDO']] as const).map(([side, r, label]) => (
          <div key={side} style={{ flex: 1, ...B }}>
            <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '8px', background: '#ddd', borderBottom: '1px solid #aaa', padding: '1px' }}>{label}</div>
            <div style={{ textAlign: 'center', fontSize: '7px', borderBottom: '1px solid #ddd', padding: '1px' }}>
              LENTE PARA ÓCULOS {armacao?.tipo_lente ? `| ${String(armacao.tipo_lente)}` : ''}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
              <thead>
                <tr>
                  <th style={TH}></th>
                  <th style={TH}>ESF</th>
                  <th style={TH}>CIL</th>
                  <th style={TH}>EIXO</th>
                  <th style={TH}>D.N.P</th>
                  <th style={TH}>ALT</th>
                  <th style={TH}>PRISMA</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...TDL, fontWeight: '700', fontSize: '7px', paddingLeft: '3px' }}>LONGE</td>
                  <td style={TD}>{fg(r.esf_longe as number)}</td>
                  <td style={TD}>{fg(r.cil_longe as number)}</td>
                  <td style={TD}>{nn(r.eixo_longe)}</td>
                  <td style={TD}>{nn(r.dnp)}</td>
                  <td style={TD}>{nn(r.alt)}</td>
                  <td style={{ ...TD, rowSpan: 3 } as React.CSSProperties} rowSpan={3}>{String(r.prisma || '')}</td>
                </tr>
                <tr>
                  <td style={{ ...TDL, fontWeight: '700', fontSize: '7px', paddingLeft: '3px' }}>ADIÇÃO</td>
                  <td style={TD}>{fg(r.adicao as number)}</td>
                  <td style={TD}></td>
                  <td style={TD}></td>
                  <td style={TD}></td>
                  <td style={TD}></td>
                </tr>
                <tr>
                  <td style={{ ...TDL, fontWeight: '700', fontSize: '7px', paddingLeft: '3px' }}>PERTO</td>
                  <td style={TD}>{fg(r.esf_perto as number)}</td>
                  <td style={TD}>{fg(r.cil_perto as number)}</td>
                  <td style={TD}>{nn(r.eixo_longe)}</td>
                  <td style={TD}></td>
                  <td style={TD}>{nn(r.alt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── ARMAÇÃO ── */}
      <div style={{ ...B, padding: '2px 4px', marginBottom: '3px', fontSize: '8px' }}>
        <div style={{ fontWeight: '700', fontSize: '8px', borderBottom: '1px solid #ccc', marginBottom: '2px' }}>ARMAÇÃO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '2px' }}>
          <span>MATERIAL: {String(armacao?.tipo_material || armacao?.material || '—')}</span>
          <span>SHAPE: {String(armacao?.shape || '—')}</span>
          <span>ESTOJO: {armacao?.estojo ? 'Sim' : 'Não'}</span>
          <span>Ø: {nn(armacao?.diametro_final, ' mm')}</span>
          <span>LENTE O/D: {String(armacao?.lente_od || '—')}</span>
          <span>LENTE O/E: {String(armacao?.lente_oe || '—')}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span>LARGURA: {nn(armacao?.largura, ' mm')}</span>
          <span>ALTURA: {nn(armacao?.altura, ' mm')}</span>
          <span>PONTE: {nn(armacao?.ponte, ' mm')}</span>
          <span>MAIOR DIAG: {nn(armacao?.maior_diagonal, ' mm')}</span>
          <span>DIÂM. FINAL: {nn(armacao?.diametro_final, ' mm')}</span>
        </div>
        {(armacao?.informacoes || armacao?.marca_material || ordem.texto_gravura) ? (
          <div style={{ marginTop: '2px', borderTop: '1px solid #eee', paddingTop: '2px' }}>
            {armacao?.informacoes ? <span>INFO: {String(armacao.informacoes)} &nbsp;</span> : null}
            {armacao?.marca_material ? <span>MARCA: {String(armacao.marca_material)} &nbsp;</span> : null}
            {ordem.texto_gravura ? <span>GRAVURA: {String(ordem.texto_gravura)}</span> : null}
          </div>
        ) : null}
      </div>

      {/* ── OBS RECEITA ── */}
      <div style={{ ...B, padding: '2px 4px', minHeight: '14px', fontSize: '8px' }}>
        <b>OBS. RECEITA:</b> {String(ordem.observacoes || '')}
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
      setTimeout(() => window.print(), 800);
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
  const props = { ordem, od, oe, armacao: armacao ?? null, servicos: servicos ?? [], tenant: tenant ?? {} };

  return (
    <div style={{ background: '#fff', margin: 0, padding: 0 }}>
      {/* VIA DO LABORATÓRIO */}
      <div style={{ padding: '5mm 6mm 4mm', boxSizing: 'border-box' }}>
        <OSSlip {...props} via="LAB" />
      </div>

      {/* LINHA DE CORTE */}
      <div style={{ margin: '0 6mm', borderTop: '1px dashed #666', position: 'relative', textAlign: 'center' }}>
        <span style={{ position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', fontSize: '7px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
          ✂ destacar aqui
        </span>
      </div>

      {/* VIA DO CLIENTE */}
      <div style={{ padding: '4mm 6mm 5mm', boxSizing: 'border-box' }}>
        <OSSlip {...props} via="CLIENTE" />
      </div>

      <style>{`
        @media print {
          body { margin: 0; background: #fff !important; }
          @page { margin: 0; size: A4 portrait; }
        }
        @media screen { body { background: #ccc; } }
      `}</style>
    </div>
  );
}
