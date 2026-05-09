import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; nome: string; }
interface Servico { id: string; nome: string; valor_padrao: number; }
interface Usuario { id: string; nome: string; }

interface RxOlho {
  esf_longe: string; cil_longe: string; eixo_longe: string; adicao: string;
  esf_perto: string; cil_perto: string;
  dnp_longe: string; dnp_perto: string; alt: string; dec_h: string;
  prisma_valor: string; prisma_eixo: string;
}

interface ItemOS { descricao: string; qtd: string; valor_unit: string; desconto: string; }

const TIPOS = [
  { key: 'U', label: 'VENDA/PEDIDO' }, { key: 'S', label: 'VENDA/PEDIDO' },
  { key: 'O', label: 'OS NORMAL' }, { key: 'F', label: 'OS FREEFORM' },
  { key: 'G', label: 'OS GARANTIA' }, { key: 'E', label: 'ENCOMENDA' },
  { key: 'R', label: 'ROMANEIO' }, { key: 'D', label: 'DEVOLUÇÃO' },
  { key: 'W', label: 'CONTRATO' }, { key: 'Z', label: 'RECIBO' },
  { key: 'L', label: 'PROTOCOLO' }, { key: 'N', label: 'ORÇAMENTO' },
  { key: 'M', label: 'MOSTRUÁRIO' },
];

const ARM_TIPOS = [
  { value: '', label: '— Tipo' }, { value: '0', label: 'SEM ARMAÇÃO' },
  { value: '1', label: 'METAL' }, { value: '2', label: 'ACETATO' },
  { value: '3', label: 'FIO DE NYLON' }, { value: '4', label: 'PARAFUSADA' },
  { value: '5', label: 'SEGURANÇA' }, { value: '6', label: 'FIO DE AÇO' },
  { value: '7', label: 'PARAF C/BUCHA' }, { value: '8', label: 'ACETATO NYLON' },
  { value: '9', label: 'METAL NYLON' },
];

const LENTE_TIPOS = [
  { value: '', label: '— Tipo de lente' },
  { value: '11', label: '11 - VISÃO SIMPLES' }, { value: '111', label: '111 - VIS. SIMPLES BASE INT' },
  { value: '51', label: '51 - KATRAL VIS. SIMPLES' }, { value: '41', label: '41 - HIDROP VIS. SIMPLES' },
  { value: '12', label: '12 - SOLA ASL' }, { value: '3', label: '3 - PROGRESSIVOS' },
  { value: '13', label: '13 - VISÃO INTERMEDIÁRIA' }, { value: '22', label: '22 - BIFOCAL TOPO RETO' },
  { value: '23', label: '23 - BIFOCAL KRIPTOK' }, { value: '24', label: '24 - BIFOCAL ULTEX' },
  { value: '241', label: '241 - BIFOCAL ULTEX CURVA EXT' }, { value: '25', label: '25 - BIFOCAL EXECUTIVE' },
  { value: '42', label: '42 - HIDROP TOPO RETO' }, { value: '52', label: '52 - BIFOCAL KATRAL TOPORETO' },
];

const SHAPES = [''].concat(Array.from({ length: 34 }, (_, i) => `SHAPE_${i + 1}`));

const OLHO_INI: RxOlho = {
  esf_longe: '', cil_longe: '', eixo_longe: '', adicao: '',
  esf_perto: '', cil_perto: '',
  dnp_longe: '', dnp_perto: '', alt: '', dec_h: '',
  prisma_valor: '', prisma_eixo: '',
};

function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}
function toYMD(d: Date) { return d.toISOString().split('T')[0]; }

const INP: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontSize: '12px',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--mono)',
};
const LBL: React.CSSProperties = {
  fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px',
};
const TH: React.CSSProperties = {
  padding: '5px 6px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)',
  textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid var(--border)',
  background: 'var(--surface-alt)', whiteSpace: 'nowrap',
};
const TD_INP: React.CSSProperties = { padding: '3px 4px', verticalAlign: 'middle' };
const RX_INP: React.CSSProperties = {
  width: '100%', padding: '4px 5px', fontSize: '12px', textAlign: 'center',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '5px', color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)',
};

function totalItem(s: ItemOS) {
  const q = parseFloat(s.qtd.replace(',', '.')) || 0;
  const v = parseFloat(s.valor_unit.replace(',', '.')) || 0;
  const d = parseFloat(s.desconto.replace(',', '.')) || 0;
  return Math.max(0, q * v - d);
}

export default function LabNovaOrdem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [catalogo, setCatalogo] = useState<Servico[]>([]);
  const [operadores, setOperadores] = useState<Usuario[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  // TIPO
  const [tipo, setTipo] = useState('O');

  // Cabeçalho
  const [oticaId, setOticaId] = useState(searchParams.get('otica') ?? '');
  const [refOtica, setRefOtica] = useState('');
  const [previsao, setPrevisao] = useState(() => toYMD(addBusinessDays(new Date(), 5)));
  const [operador, setOperador] = useState('');
  const [medico, setMedico] = useState('');
  const [condPgto, setCondPgto] = useState('');
  const [sinal, setSinal] = useState('');
  const [rota, setRota] = useState('');
  const [textoGravura, setTextoGravura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [contInterno, setContInterno] = useState('');
  const [caixa, setCaixa] = useState('');
  const [etiqGarantia, setEtiqGarantia] = useState(false);
  const [usuarioReceita, setUsuarioReceita] = useState('');
  const [fluxoLab, setFluxoLab] = useState(true);

  // Receita
  const [od, setOd] = useState<RxOlho>({ ...OLHO_INI });
  const [oe, setOe] = useState<RxOlho>({ ...OLHO_INI });

  // Armação
  const [armTipo, setArmTipo] = useState('');
  const [armShape, setArmShape] = useState('');
  const [armLargura, setArmLargura] = useState('');
  const [armAltura, setArmAltura] = useState('');
  const [armPonte, setArmPonte] = useState('');
  const [armMaiorDiag, setArmMaiorDiag] = useState('');
  const [armEixoMaiorDiag, setArmEixoMaiorDiag] = useState('0');
  const [armDiametroFinal, setArmDiametroFinal] = useState('');
  const [armEstojo, setArmEstojo] = useState(false);
  const [armDplip, setArmDplip] = useState('');
  const [armInfo, setArmInfo] = useState('');

  // Lentes
  const [lenteTipo, setLenteTipo] = useState('');
  const [lenteMarca, setLenteMarca] = useState('');
  const [lenteOd, setLenteOd] = useState('');
  const [lenteOe, setLenteOe] = useState('');

  // Serviços/Cobrança
  const [servicos, setServicos] = useState<ItemOS[]>([
    { descricao: '', qtd: '1', valor_unit: '', desconto: '0' },
    { descricao: '', qtd: '1', valor_unit: '', desconto: '0' },
    { descricao: '', qtd: '1', valor_unit: '', desconto: '0' },
    { descricao: '', qtd: '1', valor_unit: '', desconto: '0' },
  ]);

  useEffect(() => {
    api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => {});
    api.get<Servico[]>('/lab/servicos').then(setCatalogo).catch(() => {});
    api.get<{ usuarios: Usuario[] }>('/usuarios').then(d => setOperadores(d.usuarios)).catch(() => {});
  }, []);

  const totalGeral = servicos.reduce((acc, s) => acc + totalItem(s), 0);

  function setServico(i: number, patch: Partial<ItemOS>) {
    setServicos(sv => sv.map((x, j) => j === i ? { ...x, ...patch } : x));
  }

  function updateOlho(olho: 'od' | 'oe', k: keyof RxOlho, v: string) {
    if (olho === 'od') setOd(p => ({ ...p, [k]: v }));
    else setOe(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!oticaId) { setErro('Selecione a ótica'); return; }

    const receitaPayload = ([['D', od], ['E', oe]] as const).map(([olho, r]) => ({
      olho,
      esf_longe: parseFloat(r.esf_longe.replace(',', '.')) || null,
      cil_longe: parseFloat(r.cil_longe.replace(',', '.')) || null,
      eixo_longe: parseInt(r.eixo_longe) || null,
      adicao: parseFloat(r.adicao.replace(',', '.')) || null,
      esf_perto: parseFloat(r.esf_perto.replace(',', '.')) || null,
      cil_perto: parseFloat(r.cil_perto.replace(',', '.')) || null,
      dnp: parseFloat(r.dnp_longe.replace(',', '.')) || null,
      alt: parseFloat(r.alt.replace(',', '.')) || null,
      dec_h: parseFloat(r.dec_h.replace(',', '.')) || null,
      prisma: r.prisma_valor || null,
    }));

    const servicosPayload = servicos
      .filter(s => s.descricao.trim())
      .map(s => ({
        descricao: s.descricao,
        qtd: parseFloat(s.qtd.replace(',', '.')) || 1,
        valor_unit: parseFloat(s.valor_unit.replace(',', '.')) || 0,
        desconto: parseFloat(s.desconto.replace(',', '.')) || 0,
        total: totalItem(s),
      }));

    setSaving(true);
    try {
      const { id } = await api.post<{ id: string; numero: number }>('/lab/ordens', {
        otica_id: oticaId, tipo,
        operador: operador || null, medico: medico || null,
        ref_otica: refOtica || null, previsao_entrega: previsao || null,
        condicao_pgto: condPgto || null, sinal: parseFloat(sinal) || null,
        rota: rota || null, texto_gravura: textoGravura || null,
        observacoes: observacoes || null,
        cont_interno: contInterno || null,
        caixa: caixa || null,
        etiq_garantia: etiqGarantia ? 1 : 0,
        usuario_receita: usuarioReceita || null,
        fluxo_lab: fluxoLab ? 1 : 0,
        total: totalGeral,
        receita: receitaPayload,
        armacao: {
          tipo_material: armTipo || null,
          shape: armShape || null,
          largura: parseFloat(armLargura) || null,
          altura: parseFloat(armAltura) || null,
          ponte: parseFloat(armPonte) || null,
          maior_diagonal: parseFloat(armMaiorDiag) || null,
          eixo_maior_diagonal: parseFloat(armEixoMaiorDiag) || null,
          diametro_final: parseFloat(armDiametroFinal) || null,
          estojo: armEstojo ? 1 : 0,
          dplip: parseFloat(armDplip) || null,
          informacoes: armInfo || null,
          tipo_lente: lenteTipo || null,
          marca_material: lenteMarca || null,
          lente_od: lenteOd || null,
          lente_oe: lenteOe || null,
        },
        servicos: servicosPayload,
      });
      navigate(`/lab/ordens/${id}`);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  function RxInput({ olho, field, width = 62 }: { olho: 'od' | 'oe'; field: keyof RxOlho; width?: number }) {
    const val = olho === 'od' ? od[field] : oe[field];
    return (
      <input
        value={val}
        onChange={e => updateOlho(olho, field, e.target.value)}
        style={{ ...RX_INP, width: `${width}px` }}
      />
    );
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '16px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ===== TIPO PANEL ===== */}
      <div style={{ width: '170px', flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo</div>
        {TIPOS.map(t => (
          <div
            key={t.key}
            onClick={() => setTipo(t.key)}
            style={{
              padding: '9px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: tipo === t.key ? '700' : '400',
              color: tipo === t.key ? '#fff' : 'var(--text-dim)',
              background: tipo === t.key ? '#880000' : 'transparent',
              borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
            }}
          >
            <span>{t.label}</span>
            <span style={{ color: tipo === t.key ? '#ffaaaa' : 'var(--text-muted)', fontFamily: 'var(--mono)', fontWeight: '700' }}>{t.key}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={() => navigate('/lab/ordens')} style={{ width: '100%', padding: '7px', fontSize: '11px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Voltar
          </button>
        </div>
      </div>

      {/* ===== MAIN FORM ===== */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}

        {/* ===== CABEÇALHO ===== */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cabeçalho da OS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={LBL}>Ótica *</label>
              <select value={oticaId} onChange={e => setOticaId(e.target.value)} required style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">Selecionar ótica...</option>
                {oticas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Ref. Ótica</label>
              <input value={refOtica} onChange={e => setRefOtica(e.target.value)} style={INP} placeholder="Ref. cliente" />
            </div>
            <div>
              <label style={LBL}>Previsão Entrega</label>
              <input type="date" value={previsao} onChange={e => setPrevisao(e.target.value)} style={INP} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={LBL}>Operador</label>
              <select value={operador} onChange={e => setOperador(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">— Operador</option>
                {operadores.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Médico / Oftalmo</label>
              <input value={medico} onChange={e => setMedico(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Usuário / Nome Receita</label>
              <input value={usuarioReceita} onChange={e => setUsuarioReceita(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Cond. Pagamento</label>
              <input value={condPgto} onChange={e => setCondPgto(e.target.value)} style={INP} placeholder="VV, F..." />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={LBL}>Cont. Interno</label>
              <input value={contInterno} onChange={e => setContInterno(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Caixa</label>
              <input value={caixa} onChange={e => setCaixa(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Sinal / Entrada</label>
              <input type="number" step="0.01" value={sinal} onChange={e => setSinal(e.target.value)} style={INP} placeholder="R$ 0,00" />
            </div>
            <div>
              <label style={LBL}>Rota</label>
              <input value={rota} onChange={e => setRota(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Gravura</label>
              <input value={textoGravura} onChange={e => setTextoGravura(e.target.value)} style={INP} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)' }}>
              <input type="checkbox" checked={fluxoLab} onChange={e => setFluxoLab(e.target.checked)} />
              Fluxo LAB
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)' }}>
              <input type="checkbox" checked={etiqGarantia} onChange={e => setEtiqGarantia(e.target.checked)} />
              Etiq. Garantia
            </label>
          </div>
        </div>

        {/* ===== RECEITA ===== */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receita das Lentes</div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {/* Table 1: graus */}
            <table style={{ borderCollapse: 'collapse', flexShrink: 0 }}>
              <thead>
                <tr>
                  <th style={TH}></th>
                  <th style={{ ...TH, padding: '5px 20px' }} colSpan={2}>GRAU DE LONGE</th>
                  <th style={TH}>EIXO</th>
                  <th style={TH}>ADIC</th>
                  <th style={{ ...TH, padding: '5px 20px' }} colSpan={2}>GRAU DE PERTO</th>
                </tr>
                <tr>
                  <th style={TH}>OLHO</th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                  <th style={TH}></th>
                  <th style={TH}></th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                </tr>
              </thead>
              <tbody>
                {(['od', 'oe'] as const).map((o, i) => (
                  <tr key={o}>
                    <td style={{ ...TD_INP, fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', paddingRight: '8px' }}>O/{i === 0 ? 'D' : 'E'}</td>
                    <td style={TD_INP}><RxInput olho={o} field="esf_longe" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="cil_longe" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="eixo_longe" width={50} /></td>
                    <td style={TD_INP}><RxInput olho={o} field="adicao" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="esf_perto" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="cil_perto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Table 2: DNP/PRISMA */}
            <table style={{ borderCollapse: 'collapse', flexShrink: 0 }}>
              <thead>
                <tr>
                  <th style={TH}></th>
                  <th style={{ ...TH }} colSpan={2}>DNP</th>
                  <th style={TH}>ALT</th>
                  <th style={TH}>DEC H</th>
                  <th style={{ ...TH }} colSpan={2}>PRISMA</th>
                  <th style={TH}>FLUXO</th>
                </tr>
                <tr>
                  <th style={TH}>OLHO</th>
                  <th style={TH}>LONGE</th><th style={TH}>PERTO</th>
                  <th style={TH}></th><th style={TH}></th>
                  <th style={TH}>VALOR</th><th style={TH}>EIXO</th>
                  <th style={TH}>LAB</th>
                </tr>
              </thead>
              <tbody>
                {(['od', 'oe'] as const).map((o, i) => (
                  <tr key={o}>
                    <td style={{ ...TD_INP, fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', paddingRight: '8px' }}>O/{i === 0 ? 'D' : 'E'}</td>
                    <td style={TD_INP}><RxInput olho={o} field="dnp_longe" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="dnp_perto" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="alt" width={50} /></td>
                    <td style={TD_INP}><RxInput olho={o} field="dec_h" width={50} /></td>
                    <td style={TD_INP}><RxInput olho={o} field="prisma_valor" /></td>
                    <td style={TD_INP}><RxInput olho={o} field="prisma_eixo" width={50} /></td>
                    <td style={{ ...TD_INP, textAlign: 'center' }}>
                      {i === 0 && <input type="checkbox" checked={fluxoLab} onChange={e => setFluxoLab(e.target.checked)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== ARMAÇÃO + LENTES ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Armação */}
          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dados da Armação</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={LBL}>Tipo</label>
                <select value={armTipo} onChange={e => setArmTipo(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                  {ARM_TIPOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Shape</label>
                <select value={armShape} onChange={e => setArmShape(e.target.value)} style={{ ...INP, fontFamily: 'var(--mono)' }}>
                  {SHAPES.map(s => <option key={s} value={s}>{s || '— Shape'}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
              <div><label style={LBL}>Largura (mm)</label><input value={armLargura} onChange={e => setArmLargura(e.target.value)} style={INP} placeholder="0.0" /></div>
              <div><label style={LBL}>Altura (mm)</label><input value={armAltura} onChange={e => setArmAltura(e.target.value)} style={INP} placeholder="0.0" /></div>
              <div><label style={LBL}>Ponte (mm)</label><input value={armPonte} onChange={e => setArmPonte(e.target.value)} style={INP} placeholder="0.0" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
              <div><label style={LBL}>Maior Diagonal</label><input value={armMaiorDiag} onChange={e => setArmMaiorDiag(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Eixo Maior Diag.</label><input value={armEixoMaiorDiag} onChange={e => setArmEixoMaiorDiag(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Diâm. Final Lente</label><input value={armDiametroFinal} onChange={e => setArmDiametroFinal(e.target.value)} style={INP} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}><label style={LBL}>DPLIP</label><input value={armDplip} onChange={e => setArmDplip(e.target.value)} style={INP} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', paddingTop: '12px' }}>
                <input type="checkbox" checked={armEstojo} onChange={e => setArmEstojo(e.target.checked)} />
                Estojo
              </label>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={LBL}>Informações</label>
              <input value={armInfo} onChange={e => setArmInfo(e.target.value)} style={INP} />
            </div>
          </div>

          {/* Lentes */}
          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dados das Lentes e Tratamentos</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={LBL}>Tipo de Lente</label>
              <select value={lenteTipo} onChange={e => setLenteTipo(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                {LENTE_TIPOS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={LBL}>Marca / Material</label>
              <input value={lenteMarca} onChange={e => setLenteMarca(e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <div><label style={LBL}>O/D</label><input value={lenteOd} onChange={e => setLenteOd(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>O/E</label><input value={lenteOe} onChange={e => setLenteOe(e.target.value)} style={INP} /></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><label style={LBL}>Caixa</label><input value={caixa} onChange={e => setCaixa(e.target.value)} style={INP} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', paddingTop: '16px' }}>
                <input type="checkbox" checked={etiqGarantia} onChange={e => setEtiqGarantia(e.target.checked)} />
                Etiq. Garantia
              </label>
            </div>
          </div>
        </div>

        {/* ===== COBRANÇA / SERVIÇOS ===== */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cobrança</div>
            {catalogo.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {catalogo.map(sv => (
                  <button key={sv.id} type="button"
                    onClick={() => {
                      const idx = servicos.findIndex(s => !s.descricao);
                      const item: ItemOS = { descricao: sv.nome, qtd: '1', valor_unit: sv.valor_padrao.toFixed(2).replace('.', ','), desconto: '0' };
                      if (idx >= 0) setServico(idx, item);
                      else setServicos(s => [...s, item]);
                    }}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    + {sv.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Descrição', 'Qtd', 'Valor Unit.', 'Desconto', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '5px 6px', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicos.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '4px 6px 4px 0' }}>
                    <input value={s.descricao} onChange={e => setServico(i, { descricao: e.target.value })} style={{ ...INP, width: '100%' }} placeholder="Nome do serviço..." />
                  </td>
                  <td style={{ padding: '4px 6px', width: '55px' }}>
                    <input value={s.qtd} onChange={e => setServico(i, { qtd: e.target.value })} style={{ ...INP, textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '4px 6px', width: '90px' }}>
                    <input value={s.valor_unit} onChange={e => setServico(i, { valor_unit: e.target.value })} style={{ ...INP, textAlign: 'right' }} placeholder="0,00" />
                  </td>
                  <td style={{ padding: '4px 6px', width: '80px' }}>
                    <input value={s.desconto} onChange={e => setServico(i, { desconto: e.target.value })} style={{ ...INP, textAlign: 'right' }} placeholder="0,00" />
                  </td>
                  <td style={{ padding: '4px 6px', width: '85px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text)', textAlign: 'right' }}>
                    R$ {totalItem(s).toFixed(2).replace('.', ',')}
                  </td>
                  <td style={{ padding: '4px 0 4px 6px', width: '24px' }}>
                    <button type="button" onClick={() => setServicos(sv => sv.length > 1 ? sv.filter((_, j) => j !== i) : sv)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
            <button type="button" onClick={() => setServicos(s => [...s, { descricao: '', qtd: '1', valor_unit: '', desconto: '0' }])}
              style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              + Adicionar linha
            </button>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--mono)' }}>
              Total: R$ {totalGeral.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        {/* ===== OBSERVAÇÕES ===== */}
        <div style={card}>
          <label style={LBL}>Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
            style={{ ...INP, fontFamily: 'var(--sans)', resize: 'vertical', width: '100%' }} placeholder="Observações gerais..." />
        </div>

        {/* ===== AÇÕES ===== */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button type="button" onClick={() => navigate('/lab/ordens')}
            style={{ padding: '10px 22px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Desistir
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 28px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--text-muted)' : '#880000', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'Gravar OS →'}
          </button>
        </div>

      </div>
    </form>
  );
}
