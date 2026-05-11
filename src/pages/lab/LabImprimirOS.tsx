import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

// Injects Libre Barcode 128 font for scannable Code128 barcodes
function useBarcodeFont() {
  useEffect(() => {
    const id = 'barcode-font-link';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Libre+Barcode+128+Text&display=swap';
    document.head.appendChild(link);
  }, []);
}

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

const TH: React.CSSProperties = {
  padding: '2px 4px', background: '#ddd', border: '1px solid #999',
  fontSize: '9px', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: '2px 4px', border: '1px solid #ddd',
  fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap',
};
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
  const condPgto = String(ordem.condicao_pgto || ordem.otica_cond_pgto || 'A VISTA');
  // pad servicos to min 4 rows
  const svcRows = [...servicos.filter(s => s.descricao)];
  while (svcRows.length < 4) svcRows.push({ descricao: '', qtd: '', codigo: '', valor_unit: '', perc_desc: '', total: '' });

  return (
    <div style={{
      width: '100%', height: '148mm', overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px',
      color: '#000', lineHeight: '1.3', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: '3px',
    }}>

      {/* ── CABEÇALHO ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '3px' }}>
        <div style={{ minWidth: '100px' }}>
          <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {String(tenant?.nome_reduzido || tenant?.nome || 'LABORATÓRIO')}
          </div>
          <div style={{ fontSize: '8px', color: '#555', textTransform: 'uppercase' }}>Laboratório Óptico</div>
          {tenant?.telefone ? <div style={{ fontSize: '8px', color: '#555' }}>{String(tenant.telefone)}</div> : null}
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '1px' }}>
            SERVIÇO {String(Number(ordem.numero) || 0).padStart(6, '0')}
          </div>
          <div style={{ fontSize: '9px' }}>USUÁRIO: {String(ordem.usuario_receita || ordem.vendedor || '—')}</div>
          <div style={{ fontSize: '9px' }}>
            DATA: {fd(String(ordem.created_at || ''))} &nbsp;&nbsp; CAIXA: {String(ordem.caixa || '—')}
          </div>
          <div style={{ fontSize: '9px' }}>PREVISÃO PRD: {fd(String(ordem.previsao_entrega || ''))}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          <div style={{ fontFamily: "'Libre Barcode 128 Text'", fontSize: '38px', lineHeight: '1', letterSpacing: '0', color: '#000' }}>
            {String(Number(ordem.numero) || 0).padStart(4, '0')}
          </div>
          <div style={{ fontSize: '8px', color: '#444', fontWeight: '700', marginTop: '1px' }}>
            VIA {via} — OS#{String(Number(ordem.numero) || 0).padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* ── CLIENTE + REF + TABELA PREÇOS ── */}
      <div style={{ display: 'flex', gap: '5px' }}>
        {/* Box cliente */}
        <div style={{ border: '1px solid #000', padding: '3px 5px', flex: '0 0 43%' }}>
          <div style={{ fontSize: '10px', fontWeight: '700' }}>CLIENTE: {String(ordem.otica_nome || '—')}</div>
          {String(ordem.otica_endereco || '') ? <div style={{ fontSize: '9px' }}>END: {String(ordem.otica_endereco)}</div> : null}
          {String(ordem.otica_bairro || '') ? <div style={{ fontSize: '9px' }}>BAIRRO: {String(ordem.otica_bairro)}</div> : null}
          <div style={{ fontSize: '9px', display: 'flex', gap: '6px' }}>
            {String(ordem.otica_cidade || '') ? <span>CIDADE: {String(ordem.otica_cidade)}</span> : null}
            {String(ordem.otica_uf || '') ? <span>UF: {String(ordem.otica_uf)}</span> : null}
          </div>
          {String(ordem.otica_cep || '') ? <div style={{ fontSize: '9px' }}>CEP: {String(ordem.otica_cep)}</div> : null}
        </div>

        {/* REF + tabela */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '9px' }}>
            <span>REF.CLI: <b>{String(ordem.ref_otica || '—')}</b></span>
            <span>ENTREGA: <b>{fd(String(ordem.previsao_entrega || ''))}</b></span>
            <span>CONT.INT: <b>{String(ordem.cont_interno || '—')}</b></span>
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '9px' }}>
            <span>VENDEDOR: {String(ordem.vendedor || '—')}</span>
            <span>CONDIÇÃO PGTO: <b>{condPgto}</b></span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  <td style={TD}>{s.perc_desc ? Number(s.perc_desc).toFixed(2) : '—'}</td>
                  <td style={{ ...TD, fontWeight: '700' }}>{brl(s.total || s.total_liq)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABELA PRODUTOS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <thead>
          <tr style={{ background: '#ddd', borderBottom: '1px solid #000' }}>
            <th style={{ ...TH, width: '55px', textAlign: 'left', paddingLeft: '5px' }}>CÓDIGO</th>
            <th style={{ ...TH, textAlign: 'left', paddingLeft: '5px' }}>DESCRIÇÃO</th>
            <th style={{ ...TH, width: '40px' }}>QTD.</th>
          </tr>
        </thead>
        <tbody>
          {svcRows.map((s, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee', height: '16px' }}>
              <td style={{ ...TDL, paddingLeft: '5px', fontSize: '9px', color: '#333' }}>{String(s.codigo || '')}</td>
              <td style={{ ...TDL, paddingLeft: '5px' }}>{String(s.descricao || '')}</td>
              <td style={TD}>{String(s.qtd || '')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTAIS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: '700' }}>
        <div>
          Frete|Total: {brl(frete)} | {brl(total)}
          &nbsp;&nbsp;&nbsp; QTD.: {servicos.filter(s => s.descricao).reduce((a, s) => a + (Number(s.qtd) || 0), 0).toFixed(2)}
        </div>
        <div style={{ border: '1px solid #000', padding: '2px 8px', fontSize: '11px' }}>
          TOTAL LÍQUIDO: <b>{brl(total)}</b>
        </div>
      </div>

      {/* ── RECEITA: OD + OE ── */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {([['D', od, 'OLHO DIREITO'], ['E', oe, 'OLHO ESQUERDO']] as const).map(([side, r, label]) => (
          <div key={side} style={{ flex: 1, border: '1px solid #000' }}>
            <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '9px', background: '#ddd', borderBottom: '1px solid #999', padding: '2px' }}>{label}</div>
            <div style={{ textAlign: 'center', fontSize: '8px', borderBottom: '1px solid #ddd', padding: '1px' }}>
              LENTE PARA ÓCULOS {armacao?.tipo_lente ? `| ${String(armacao.tipo_lente)}` : ''}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr>
                  <th style={TH}></th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                  <th style={TH}>EIXO</th><th style={TH}>D.N.P</th>
                  <th style={TH}>ALT</th><th style={TH}>PRISMA</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...TDL, fontWeight: '700', fontSize: '8px' }}>LONGE</td>
                  <td style={TD}>{fg(r.esf_longe as number)}</td>
                  <td style={TD}>{fg(r.cil_longe as number)}</td>
                  <td style={TD}>{nn(r.eixo_longe)}</td>
                  <td style={TD}>{nn(r.dnp)}</td>
                  <td style={TD}>{nn(r.alt)}</td>
                  <td style={TD} rowSpan={3}>{String(r.prisma || '')}</td>
                </tr>
                <tr>
                  <td style={{ ...TDL, fontWeight: '700', fontSize: '8px' }}>ADIÇÃO</td>
                  <td style={TD}>{fg(r.adicao as number)}</td>
                  <td style={TD}></td><td style={TD}></td><td style={TD}></td><td style={TD}></td>
                </tr>
                <tr>
                  <td style={{ ...TDL, fontWeight: '700', fontSize: '8px' }}>PERTO</td>
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
      <div style={{ border: '1px solid #000', padding: '3px 5px', fontSize: '9px' }}>
        <div style={{ fontWeight: '700', fontSize: '9px', borderBottom: '1px solid #ccc', marginBottom: '2px' }}>ARMAÇÃO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '2px' }}>
          <span>MATERIAL: <b>{String(armacao?.tipo_material || armacao?.material || '—')}</b></span>
          <span>SHAPE: <b>{String(armacao?.shape || '—')}</b></span>
          <span>ESTOJO: {armacao?.estojo ? 'Sim' : 'Não'}</span>
          <span>Ø: {nn(armacao?.diametro_final, 'mm')}</span>
          <span>MARCA: {String(armacao?.marca_material || '—')}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '2px' }}>
          <span>LARG: {nn(armacao?.largura, 'mm')}</span>
          <span>ALT: {nn(armacao?.altura, 'mm')}</span>
          <span>PONTE: {nn(armacao?.ponte, 'mm')}</span>
          <span>MAIOR DIAG: {nn(armacao?.maior_diagonal, 'mm')}</span>
          <span>DIÂM. FINAL: {nn(armacao?.diametro_final, 'mm')}</span>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span>LENTE O/D: <b>{String(armacao?.lente_od || '—')}</b></span>
          <span>LENTE O/E: <b>{String(armacao?.lente_oe || '—')}</b></span>
          {ordem.texto_gravura ? <span>GRAVURA: {String(ordem.texto_gravura)}</span> : null}
        </div>
      </div>

      {/* ── OBS RECEITA — cresce para preencher espaço ── */}
      <div style={{ border: '1px solid #000', padding: '3px 5px', flex: 1, fontSize: '9px' }}>
        <b>OBS. RECEITA:</b> {String(ordem.observacoes || '')}
      </div>
    </div>
  );
}

export default function LabImprimirOS() {
  useBarcodeFont();
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
    <div style={{ width: '210mm', margin: '0 auto', background: '#fff', boxSizing: 'border-box' }}>
      {/* VIA DO LABORATÓRIO */}
      <div style={{ padding: '4mm 5mm', height: '297mm', boxSizing: 'border-box' }}>
        <OSSlip {...props} via="LAB" />
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
