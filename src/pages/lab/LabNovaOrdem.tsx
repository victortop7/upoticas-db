import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; codigo?: string; nome: string; lista_preco?: number; condicao_pgto?: string; }
interface Produto { id: string; codigo?: string; nome: string; unidade?: string; valor_padrao: number; estoque_atual?: number; }
interface Usuario { id: string; nome: string; }
interface Vendedor { id: string; codigo: string; nome: string; }

interface RxOlho {
  esf_longe: string; cil_longe: string; eixo_longe: string; adicao: string;
  esf_perto: string; cil_perto: string;
  dnp_longe: string; dnp_perto: string; alt: string; dec_h: string;
  prisma_valor: string; prisma_eixo: string;
}

interface ItemCobranca {
  codigo: string; descricao: string; un: string;
  estoque: string; qtd: string; pv_unit: string;
  perc_desc: string; produto_id: string;
}

interface ItemEstoque {
  codigo: string; descricao: string; un: string; estoque: string; qtd: string; produto_id: string;
}

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

const ITEM_COB_INI: ItemCobranca = { codigo: '', descricao: '', un: '', estoque: '', qtd: '1', pv_unit: '', perc_desc: '0', produto_id: '' };
const ITEM_EST_INI: ItemEstoque = { codigo: '', descricao: '', un: '', estoque: '', qtd: '1', produto_id: '' };

function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
  return d;
}
function toYMD(d: Date) { return d.toISOString().split('T')[0]; }

function calcItem(s: ItemCobranca) {
  const q = parseFloat(s.qtd.replace(',', '.')) || 0;
  const v = parseFloat(s.pv_unit.replace(',', '.')) || 0;
  const p = parseFloat(s.perc_desc.replace(',', '.')) || 0;
  const bruto = q * v;
  const liq = Math.max(0, bruto * (1 - p / 100));
  return { bruto, liq };
}

const INP: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontSize: '12px',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'var(--mono)',
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
const TD: React.CSSProperties = { padding: '3px 4px', verticalAlign: 'middle' };
const RX_INP: React.CSSProperties = {
  width: '100%', padding: '4px 5px', fontSize: '12px', textAlign: 'center',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '5px', color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)',
};
const COB_INP: React.CSSProperties = {
  width: '100%', padding: '4px 5px', fontSize: '12px',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '4px', color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)',
};

// Components defined OUTSIDE the main component to avoid focus loss on re-render
function RxInput({ value, onChange, width = 62 }: { value: string; onChange: (v: string) => void; width?: number }) {
  return <input value={value} onChange={e => onChange(e.target.value)} style={{ ...RX_INP, width: `${width}px` }} />;
}

function CobInput({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  return <input value={value} onChange={e => onChange(e.target.value)} style={{ ...COB_INP, ...style }} />;
}

export default function LabNovaOrdem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [operadores, setOperadores] = useState<Usuario[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  // TIPO
  const [tipo, setTipo] = useState('O');

  // Cabeçalho
  const [oticaId, setOticaId] = useState(searchParams.get('otica') ?? '');
  const [oticaCod, setOticaCod] = useState('');
  const [oticaNome, setOticaNome] = useState('');
  const [oticaErro, setOticaErro] = useState(false);
  const [refOtica, setRefOtica] = useState('');
  const [classificacao, setClassificacao] = useState('N');
  const [listaPreco, setListaPreco] = useState('1');
  const [previsao, setPrevisao] = useState(() => toYMD(addBusinessDays(new Date(), 5)));
  const [operador, setOperador] = useState('');
  const [medico, setMedico] = useState('');
  const [usuarioReceita, setUsuarioReceita] = useState('');
  const [condPgto, setCondPgto] = useState('');
  const [numVias, setNumVias] = useState('1');
  const [cobrancaTipo, setCobrancaTipo] = useState('1');
  const [fechamento, setFechamento] = useState('');
  const [frete, setFrete] = useState('');
  const [desconto, setDesconto] = useState('');
  const [contInterno, setContInterno] = useState('');
  const [caixa, setCaixa] = useState('');
  const [etiqGarantia, setEtiqGarantia] = useState(false);
  const [fluxoLab, setFluxoLab] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [vendedor1Id, setVendedor1Id] = useState('');
  const [vendedor2Id, setVendedor2Id] = useState('');

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

  // Lentes
  const [lenteTipo, setLenteTipo] = useState('');
  const [lenteMarca, setLenteMarca] = useState('');
  const [lenteOd, setLenteOd] = useState('');
  const [lenteOe, setLenteOe] = useState('');

  // Cobrança
  const [cobranca, setCobranca] = useState<ItemCobranca[]>([
    { ...ITEM_COB_INI }, { ...ITEM_COB_INI }, { ...ITEM_COB_INI }, { ...ITEM_COB_INI },
    { ...ITEM_COB_INI }, { ...ITEM_COB_INI },
  ]);

  // Baixa no estoque
  const [baixaEstoque, setBaixaEstoque] = useState<ItemEstoque[]>([
    { ...ITEM_EST_INI }, { ...ITEM_EST_INI }, { ...ITEM_EST_INI }, { ...ITEM_EST_INI },
  ]);

  useEffect(() => {
    api.get<Otica[]>('/lab/oticas').then(list => {
      setOticas(list);
      // Se veio otica_id na URL, preenche código e nome
      const presel = searchParams.get('otica');
      if (presel) {
        const found = list.find(o => o.id === presel);
        if (found) { setOticaCod(found.codigo || found.nome); setOticaNome(found.nome); }
      }
    }).catch(() => {});
    api.get<Produto[]>('/lab/servicos').then(setProdutos).catch(() => {});
    api.get<{ usuarios: Usuario[] }>('/usuarios').then(d => setOperadores(d.usuarios)).catch(() => {});
    api.get<Vendedor[]>('/lab/vendedores').then(setVendedores).catch(() => {});
  }, [searchParams]);

  function handleOticaLookup(cod: string) {
    const t = cod.trim().toLowerCase();
    if (!t) { setOticaId(''); setOticaNome(''); setOticaErro(false); return; }
    const found = oticas.find(o =>
      (o.codigo && o.codigo.toLowerCase() === t) ||
      o.nome.toLowerCase().startsWith(t) ||
      o.nome.toLowerCase().includes(t)
    );
    if (found) {
      setOticaId(found.id);
      setOticaNome(found.nome);
      setOticaCod(found.codigo || cod);
      setOticaErro(false);
      // Auto-fill lista de preço e condição de pagamento
      if (found.lista_preco) setListaPreco(String(found.lista_preco));
      if (found.condicao_pgto) setCondPgto(found.condicao_pgto);
    } else {
      setOticaId('');
      setOticaNome('NÃO ENCONTRADO');
      setOticaErro(true);
    }
  }

  function updateOlho(olho: 'od' | 'oe', k: keyof RxOlho, v: string) {
    if (olho === 'od') setOd(p => ({ ...p, [k]: v }));
    else setOe(p => ({ ...p, [k]: v }));
  }

  function setCobItem(i: number, patch: Partial<ItemCobranca>) {
    setCobranca(c => c.map((x, j) => j === i ? { ...x, ...patch } : x));
  }

  function setEstItem(i: number, patch: Partial<ItemEstoque>) {
    setBaixaEstoque(e => e.map((x, j) => j === i ? { ...x, ...patch } : x));
  }

  const lookupProduto = useCallback((termo: string): Produto | undefined => {
    const t = termo.trim().toLowerCase();
    if (!t) return undefined;
    return produtos.find(p =>
      (p.codigo && p.codigo.toLowerCase() === t) ||
      p.nome.toLowerCase().startsWith(t) ||
      p.nome.toLowerCase().includes(t)
    );
  }, [produtos]);

  function handleCobCodigoBlur(i: number, codigo: string) {
    if (!codigo.trim()) return;
    const p = lookupProduto(codigo);
    if (p) {
      setCobItem(i, {
        codigo: p.codigo,
        descricao: p.nome,
        un: p.unidade || 'UN',
        estoque: p.estoque_atual !== undefined ? String(p.estoque_atual) : '',
        pv_unit: p.valor_padrao > 0 ? p.valor_padrao.toFixed(2).replace('.', ',') : '',
        produto_id: p.id,
      });
    }
  }

  function handleEstCodigoBlur(i: number, codigo: string) {
    if (!codigo.trim()) return;
    const p = lookupProduto(codigo);
    if (p) {
      setEstItem(i, {
        codigo: p.codigo,
        descricao: p.nome,
        un: p.unidade || 'UN',
        estoque: p.estoque_atual !== undefined ? String(p.estoque_atual) : '',
        produto_id: p.id,
      });
    }
  }

  const totalGeral = cobranca.reduce((acc, s) => acc + calcItem(s).liq, 0);
  const totalDesc = parseFloat(desconto.replace(',', '.')) || 0;
  const totalFrete = parseFloat(frete.replace(',', '.')) || 0;
  const totalFinal = Math.max(0, totalGeral - totalDesc + totalFrete);

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

    const servicosPayload = cobranca
      .filter(s => s.descricao.trim())
      .map(s => {
        const { bruto, liq } = calcItem(s);
        return {
          codigo: s.codigo || null,
          produto_id: s.produto_id || null,
          descricao: s.descricao,
          qtd: parseFloat(s.qtd.replace(',', '.')) || 1,
          valor_unit: parseFloat(s.pv_unit.replace(',', '.')) || 0,
          perc_desc: parseFloat(s.perc_desc.replace(',', '.')) || 0,
          total_bruto: bruto,
          total: liq,
        };
      });

    setSaving(true);
    try {
      const { id } = await api.post<{ id: string; numero: number }>('/lab/ordens', {
        otica_id: oticaId, tipo,
        classificacao,
        lista_preco: parseInt(listaPreco) || 1,
        operador: operador || null,
        medico: medico || null,
        ref_otica: refOtica || null,
        previsao_entrega: previsao || null,
        condicao_pgto: condPgto || null,
        num_vias: parseInt(numVias) || 1,
        cobranca_tipo: cobrancaTipo || null,
        fechamento_ref: fechamento || null,
        frete: totalFrete || null,
        desconto_geral: totalDesc || null,
        cont_interno: contInterno || null,
        caixa: caixa || null,
        etiq_garantia: etiqGarantia ? 1 : 0,
        usuario_receita: usuarioReceita || null,
        fluxo_lab: fluxoLab ? 1 : 0,
        observacoes: observacoes || null,
        vendedor1_id: vendedor1Id || null,
        vendedor2_id: vendedor2Id || null,
        total: totalFinal,
        receita: receitaPayload,
        armacao: {
          tipo_material: armTipo || null, shape: armShape || null,
          largura: parseFloat(armLargura) || null, altura: parseFloat(armAltura) || null,
          ponte: parseFloat(armPonte) || null, maior_diagonal: parseFloat(armMaiorDiag) || null,
          eixo_maior_diagonal: parseFloat(armEixoMaiorDiag) || null,
          diametro_final: parseFloat(armDiametroFinal) || null,
          tipo_lente: lenteTipo || null, marca_material: lenteMarca || null,
          lente_od: lenteOd || null, lente_oe: lenteOe || null,
        },
        servicos: servicosPayload,
        baixa_estoque: baixaEstoque
          .filter(e => e.codigo.trim() || e.descricao.trim())
          .map(e => ({
            codigo: e.codigo || null, produto_id: e.produto_id || null,
            descricao: e.descricao, qtd: parseFloat(e.qtd.replace(',', '.')) || 1,
          })),
      });
      navigate(`/lab/ordens/${id}`);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px',
  };
  const secTitle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '700', color: '#880000', marginBottom: '10px',
    textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', paddingBottom: '6px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ===== TIPO PANEL ===== */}
      <div style={{ width: '170px', flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: '700', color: '#880000', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo de OS</div>
        {TIPOS.map(t => (
          <div key={t.key} onClick={() => setTipo(t.key)} style={{
            padding: '8px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: tipo === t.key ? '700' : '400',
            color: tipo === t.key ? '#fff' : 'var(--text-dim)',
            background: tipo === t.key ? '#880000' : 'transparent',
            borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
          }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}

        {/* ===== CABEÇALHO ===== */}
        <div style={card}>
          <div style={secTitle}>Cabeçalho da OS</div>

          {/* Row 1: Ótica + Ref + Classificação + Lista + Previsão */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px 80px 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={LBL}>Cód. Ótica *</label>
              <input
                value={oticaCod}
                onChange={e => { setOticaCod(e.target.value); setOticaErro(false); }}
                onBlur={e => handleOticaLookup(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') handleOticaLookup(oticaCod); }}
                style={{ ...INP, borderColor: oticaErro ? 'var(--red)' : undefined }}
                placeholder="Cód."
              />
            </div>
            <div>
              <label style={LBL}>Nome da Ótica</label>
              <div style={{ ...INP, background: 'var(--surface)', color: oticaErro ? 'var(--red)' : oticaNome ? 'var(--text)' : 'var(--text-muted)', fontFamily: 'var(--sans)', minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                {oticaNome || <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Digite o código ou nome acima...</span>}
              </div>
            </div>
            <div>
              <label style={LBL}>Ref. Ótica</label>
              <input value={refOtica} onChange={e => setRefOtica(e.target.value)} style={INP} placeholder="Nº OS deles" />
            </div>
            <div>
              <label style={LBL}>Classif.</label>
              <select value={classificacao} onChange={e => setClassificacao(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="N">N - Normal</option>
                <option value="E">E - Especial</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Lista Preço</label>
              <input value={listaPreco} onChange={e => setListaPreco(e.target.value)} style={{ ...INP, textAlign: 'center' }} placeholder="1" />
            </div>
            <div>
              <label style={LBL}>Previsão Entrega</label>
              <input type="date" value={previsao} onChange={e => setPrevisao(e.target.value)} style={INP} />
            </div>
          </div>

          {/* Row 2: Nº Vias + Cobrança + Fechamento + Frete + Desconto */}
          <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 1fr 100px 100px', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={LBL}>Nº Vias</label>
              <input value={numVias} onChange={e => setNumVias(e.target.value)} style={{ ...INP, textAlign: 'center' }} />
            </div>
            <div>
              <label style={LBL}>Cobrança</label>
              <input value={cobrancaTipo} onChange={e => setCobrancaTipo(e.target.value)} style={{ ...INP, textAlign: 'center' }} />
            </div>
            <div>
              <label style={LBL}>Fechamento (ref)</label>
              <input value={fechamento} onChange={e => setFechamento(e.target.value)} style={INP} placeholder="Ref. fechamento" />
            </div>
            <div>
              <label style={LBL}>Frete (R$)</label>
              <input value={frete} onChange={e => setFrete(e.target.value)} style={{ ...INP, textAlign: 'right' }} placeholder="0,00" />
            </div>
            <div>
              <label style={LBL}>Desconto (R$)</label>
              <input value={desconto} onChange={e => setDesconto(e.target.value)} style={{ ...INP, textAlign: 'right' }} placeholder="0,00" />
            </div>
          </div>

          {/* Row 3: Operador + Vendedor 1 + Vendedor 2 + Médico + Usuário Receita */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={LBL}>Operador</label>
              <select value={operador} onChange={e => setOperador(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">— Operador</option>
                {operadores.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Vendedor 1</label>
              <select value={vendedor1Id} onChange={e => setVendedor1Id(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">— Vendedor</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Vendedor 2</label>
              <select value={vendedor2Id} onChange={e => setVendedor2Id(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">— Vendedor</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Médico / Oftalmo</label>
              <input value={medico} onChange={e => setMedico(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Usuário / Receita</label>
              <input value={usuarioReceita} onChange={e => setUsuarioReceita(e.target.value)} style={INP} />
            </div>
          </div>

          {/* Row 4: Cond Pgto + Cont Interno + Caixa + flags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px auto auto', gap: '8px', alignItems: 'flex-end' }}>
            <div>
              <label style={LBL}>Cond. Pagamento</label>
              <input value={condPgto} onChange={e => setCondPgto(e.target.value)} style={INP} placeholder="VV, F..." />
            </div>
            <div>
              <label style={LBL}>Cont. Interno</label>
              <input value={contInterno} onChange={e => setContInterno(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Caixa</label>
              <input value={caixa} onChange={e => setCaixa(e.target.value)} style={INP} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', paddingBottom: '2px' }}>
              <input type="checkbox" checked={fluxoLab} onChange={e => setFluxoLab(e.target.checked)} />
              Fluxo LAB
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', paddingBottom: '2px' }}>
              <input type="checkbox" checked={etiqGarantia} onChange={e => setEtiqGarantia(e.target.checked)} />
              Etiq. Garantia
            </label>
          </div>
        </div>

        {/* ===== RECEITA ===== */}
        <div style={card}>
          <div style={secTitle}>Receita das Lentes</div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            {/* Table 1: graus */}
            <table style={{ borderCollapse: 'collapse', flexShrink: 0 }}>
              <thead>
                <tr>
                  <th style={TH}></th>
                  <th style={{ ...TH, padding: '5px 20px' }} colSpan={2}>GRAU DE LONGE</th>
                  <th style={TH}>EIXO</th><th style={TH}>ADIC</th>
                  <th style={{ ...TH, padding: '5px 20px' }} colSpan={2}>GRAU DE PERTO</th>
                </tr>
                <tr>
                  <th style={TH}>OLHO</th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                  <th style={TH}></th><th style={TH}></th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                </tr>
              </thead>
              <tbody>
                {(['od', 'oe'] as const).map((o, i) => (
                  <tr key={o}>
                    <td style={{ ...TD, fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', paddingRight: '8px' }}>O/{i === 0 ? 'D' : 'E'}</td>
                    <td style={TD}><RxInput value={o === 'od' ? od.esf_longe : oe.esf_longe} onChange={v => updateOlho(o, 'esf_longe', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.cil_longe : oe.cil_longe} onChange={v => updateOlho(o, 'cil_longe', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.eixo_longe : oe.eixo_longe} onChange={v => updateOlho(o, 'eixo_longe', v)} width={50} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.adicao : oe.adicao} onChange={v => updateOlho(o, 'adicao', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.esf_perto : oe.esf_perto} onChange={v => updateOlho(o, 'esf_perto', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.cil_perto : oe.cil_perto} onChange={v => updateOlho(o, 'cil_perto', v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Table 2: DNP/PRISMA */}
            <table style={{ borderCollapse: 'collapse', flexShrink: 0 }}>
              <thead>
                <tr>
                  <th style={TH}></th>
                  <th style={TH} colSpan={2}>DNP</th>
                  <th style={TH}>ALT</th><th style={TH}>DEC H</th>
                  <th style={TH} colSpan={2}>PRISMA</th>
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
                    <td style={{ ...TD, fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', paddingRight: '8px' }}>O/{i === 0 ? 'D' : 'E'}</td>
                    <td style={TD}><RxInput value={o === 'od' ? od.dnp_longe : oe.dnp_longe} onChange={v => updateOlho(o, 'dnp_longe', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.dnp_perto : oe.dnp_perto} onChange={v => updateOlho(o, 'dnp_perto', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.alt : oe.alt} onChange={v => updateOlho(o, 'alt', v)} width={50} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.dec_h : oe.dec_h} onChange={v => updateOlho(o, 'dec_h', v)} width={50} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.prisma_valor : oe.prisma_valor} onChange={v => updateOlho(o, 'prisma_valor', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.prisma_eixo : oe.prisma_eixo} onChange={v => updateOlho(o, 'prisma_eixo', v)} width={50} /></td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      {i === 0 && <input type="checkbox" checked={fluxoLab} onChange={e => setFluxoLab(e.target.checked)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== ARMAÇÃO + LENTES ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={card}>
            <div style={secTitle}>Dados da Armação</div>
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
              <div><label style={LBL}>Largura/Dist. Horiz. (mm)</label><input value={armLargura} onChange={e => setArmLargura(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Altura/Dist. Vert. (mm)</label><input value={armAltura} onChange={e => setArmAltura(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Ponte (mm)</label><input value={armPonte} onChange={e => setArmPonte(e.target.value)} style={INP} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div><label style={LBL}>Maior Diagonal</label><input value={armMaiorDiag} onChange={e => setArmMaiorDiag(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Eixo Maior Diag.</label><input value={armEixoMaiorDiag} onChange={e => setArmEixoMaiorDiag(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Diâm. Final Lente</label><input value={armDiametroFinal} onChange={e => setArmDiametroFinal(e.target.value)} style={INP} /></div>
            </div>
          </div>

          <div style={card}>
            <div style={secTitle}>Dados das Lentes e Tratamentos</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div><label style={LBL}>O/D</label><input value={lenteOd} onChange={e => setLenteOd(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>O/E</label><input value={lenteOe} onChange={e => setLenteOe(e.target.value)} style={INP} /></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '100px auto', gap: '8px', alignItems: 'center' }}>
              <div>
                <label style={LBL}>Caixa</label>
                <input value={caixa} onChange={e => setCaixa(e.target.value)} style={INP} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', paddingTop: '14px' }}>
                <input type="checkbox" checked={etiqGarantia} onChange={e => setEtiqGarantia(e.target.checked)} />
                Etiq. Garantia
              </label>
            </div>
          </div>
        </div>

        {/* ===== COBRANÇA ===== */}
        <div style={card}>
          <div style={secTitle}>Cobrança</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'CÓDIGO', w: '80px', align: 'center' },
                    { label: 'DESCRIÇÃO', w: 'auto', align: 'left' },
                    { label: 'UN', w: '45px', align: 'center' },
                    { label: 'ESTOQUE', w: '70px', align: 'center' },
                    { label: 'QTD', w: '55px', align: 'center' },
                    { label: 'PV UNIT', w: '80px', align: 'right' },
                    { label: 'UTOT BRT', w: '85px', align: 'right' },
                    { label: '%DESC', w: '60px', align: 'center' },
                    { label: 'UTOT LIQ', w: '85px', align: 'right' },
                    { label: '', w: '24px', align: 'center' },
                  ].map(h => (
                    <th key={h.label} style={{ ...TH, width: h.w, textAlign: h.align as React.CSSProperties['textAlign'] }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cobranca.map((s, i) => {
                  const { bruto, liq } = calcItem(s);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={TD}>
                        <input
                          value={s.codigo}
                          onChange={e => setCobItem(i, { codigo: e.target.value })}
                          onBlur={() => handleCobCodigoBlur(i, s.codigo)}
                          onKeyDown={e => { if (e.key === 'Tab' || e.key === 'Enter') handleCobCodigoBlur(i, s.codigo); }}
                          style={{ ...COB_INP, textAlign: 'center', width: '75px' }}
                          placeholder="Cód."
                        />
                      </td>
                      <td style={TD}>
                        <input
                          value={s.descricao}
                          onChange={e => setCobItem(i, { descricao: e.target.value })}
                          onBlur={() => { if (!s.descricao && s.codigo) handleCobCodigoBlur(i, s.codigo); }}
                          style={{ ...COB_INP, width: '100%' }}
                          placeholder="Descrição do serviço..."
                        />
                      </td>
                      <td style={TD}><CobInput value={s.un} onChange={v => setCobItem(i, { un: v })} style={{ textAlign: 'center', width: '40px' }} /></td>
                      <td style={{ ...TD, fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {s.estoque || '—'}
                      </td>
                      <td style={TD}><CobInput value={s.qtd} onChange={v => setCobItem(i, { qtd: v })} style={{ textAlign: 'center', width: '50px' }} /></td>
                      <td style={TD}><CobInput value={s.pv_unit} onChange={v => setCobItem(i, { pv_unit: v })} style={{ textAlign: 'right', width: '75px' }} /></td>
                      <td style={{ ...TD, fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'right', paddingRight: '8px' }}>
                        {bruto > 0 ? bruto.toFixed(2).replace('.', ',') : ''}
                      </td>
                      <td style={TD}><CobInput value={s.perc_desc} onChange={v => setCobItem(i, { perc_desc: v })} style={{ textAlign: 'center', width: '55px' }} /></td>
                      <td style={{ ...TD, fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: liq > 0 ? '700' : '400', color: liq > 0 ? 'var(--text)' : 'var(--text-muted)', textAlign: 'right', paddingRight: '8px' }}>
                        {liq > 0 ? liq.toFixed(2).replace('.', ',') : ''}
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <button type="button" onClick={() => setCobranca(c => c.length > 1 ? c.filter((_, j) => j !== i) : c)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
            <button type="button" onClick={() => setCobranca(c => [...c, { ...ITEM_COB_INI }])}
              style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              + Adicionar linha
            </button>
            <div style={{ display: 'flex', gap: '20px', fontFamily: 'var(--mono)', fontSize: '13px' }}>
              {totalDesc > 0 && <span style={{ color: 'var(--red)' }}>Desc: R$ {totalDesc.toFixed(2).replace('.', ',')}</span>}
              {totalFrete > 0 && <span style={{ color: 'var(--accent)' }}>Frete: R$ {totalFrete.toFixed(2).replace('.', ',')}</span>}
              <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>
                Total: R$ {totalFinal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* ===== BAIXA NO ESTOQUE ===== */}
        <div style={card}>
          <div style={secTitle}>Baixa no Estoque</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'CÓDIGO', w: '90px' }, { label: 'DESCRIÇÃO', w: 'auto' },
                    { label: 'UN', w: '45px' }, { label: 'ESTOQUE', w: '75px' }, { label: 'QTD', w: '60px' }, { label: '', w: '24px' },
                  ].map(h => (
                    <th key={h.label} style={{ ...TH, width: h.w }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {baixaEstoque.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={TD}>
                      <input
                        value={e.codigo}
                        onChange={ev => setEstItem(i, { codigo: ev.target.value })}
                        onBlur={() => handleEstCodigoBlur(i, e.codigo)}
                        onKeyDown={ev => { if (ev.key === 'Tab' || ev.key === 'Enter') handleEstCodigoBlur(i, e.codigo); }}
                        style={{ ...COB_INP, textAlign: 'center', width: '80px' }}
                        placeholder="Cód."
                      />
                    </td>
                    <td style={TD}>
                      <input
                        value={e.descricao}
                        onChange={ev => setEstItem(i, { descricao: ev.target.value })}
                        onBlur={() => { if (!e.descricao && e.codigo) handleEstCodigoBlur(i, e.codigo); }}
                        style={{ ...COB_INP, width: '100%' }}
                        placeholder="Produto..."
                      />
                    </td>
                    <td style={TD}><CobInput value={e.un} onChange={v => setEstItem(i, { un: v })} style={{ textAlign: 'center', width: '40px' }} /></td>
                    <td style={{ ...TD, fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{e.estoque || '—'}</td>
                    <td style={TD}><CobInput value={e.qtd} onChange={v => setEstItem(i, { qtd: v })} style={{ textAlign: 'center', width: '55px' }} /></td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <button type="button" onClick={() => setBaixaEstoque(be => be.length > 1 ? be.filter((_, j) => j !== i) : be)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setBaixaEstoque(be => [...be, { ...ITEM_EST_INI }])}
            style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
            + Adicionar linha
          </button>
        </div>

        {/* ===== OBSERVAÇÕES ===== */}
        <div style={card}>
          <label style={LBL}>Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
            style={{ ...INP, fontFamily: 'var(--sans)', resize: 'vertical' }} placeholder="Observações gerais..." />
        </div>

        {/* ===== AÇÕES ===== */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button type="button" onClick={() => navigate('/lab/ordens')}
            style={{ padding: '10px 22px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Desistir
          </button>
          <button type="button" disabled={saving} onClick={handleSubmit as unknown as React.MouseEventHandler}
            style={{ padding: '10px 22px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--text-muted)' : 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            Gravar
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 28px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--text-muted)' : '#880000', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'Gravar + Imprimir →'}
          </button>
        </div>

      </div>
    </form>
  );
}
