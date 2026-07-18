import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import LabShapePicker from '../../components/LabShapePicker';

interface Otica { id: string; codigo?: string; nome: string; lista_preco?: number; condicao_pgto?: string; }
interface Produto { id: string; codigo?: string; nome: string; unidade?: string; valor_padrao: number; estoque_atual?: number; }
interface Usuario { id: string; nome: string; }

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

const LENTE_TIPOS_PADRAO = [
  { value: '01', label: '01 - VISÃO SIMPLES' },
  { value: '02', label: '02 - PROGRESSIVA' },
  { value: '03', label: '03 - BIFOCAL' },
];


const OLHO_INI: RxOlho = {
  esf_longe: '', cil_longe: '', eixo_longe: '', adicao: '',
  esf_perto: '', cil_perto: '',
  dnp_longe: '', dnp_perto: '', alt: '', dec_h: '',
  prisma_valor: '', prisma_eixo: '',
};

const ITEM_COB_INI: ItemCobranca = { codigo: '', descricao: '', un: '', estoque: '', qtd: '1', pv_unit: '', perc_desc: '0', produto_id: '' };

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

// ── Paleta retro igual aos painéis MÓDULOS/OPÇÕES ──
import { R } from '../../lib/labTheme';

const INP: React.CSSProperties = {
  width: '100%', padding: '4px 7px', fontSize: '12px',
  background: R.inpBg, border: R.inpBdr,
  color: R.txt, outline: 'none',
  boxSizing: 'border-box', fontFamily: "'Courier New', monospace",
};
const LBL: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', color: R.dim,
  textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px',
};
const TH: React.CSSProperties = {
  padding: '4px 6px', fontSize: '10px', fontWeight: '700', color: R.hdrTxt,
  textTransform: 'uppercase', textAlign: 'center',
  background: '#005500', whiteSpace: 'nowrap', border: '1px solid #1a4a1a',
};
const TD: React.CSSProperties = { padding: '2px 3px', verticalAlign: 'middle' };
const RX_INP: React.CSSProperties = {
  width: '100%', padding: '3px 4px', fontSize: '12px', textAlign: 'center',
  background: R.inpBg, border: R.inpBdr,
  color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace",
};
const COB_INP: React.CSSProperties = {
  width: '100%', padding: '3px 4px', fontSize: '12px',
  background: R.inpBg, border: R.inpBdr,
  color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace",
};

function RxInput({ value, onChange, width = 50 }: { value: string; onChange: (v: string) => void; width?: number }) {
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
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [step, setStep] = useState(1);

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
  const [listasDisponiveis, setListasDisponiveis] = useState<{ numero: string; nome: string }[]>([
    { numero: '1', nome: 'LISTA 1' }, { numero: '2', nome: 'LISTA 2' },
  ]);
  const [previsao, setPrevisao] = useState(() => toYMD(addBusinessDays(new Date(), 5)));
  const [dataEmissao, setDataEmissao] = useState(() => toYMD(new Date()));
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

  // Receita
  const [od, setOd] = useState<RxOlho>({ ...OLHO_INI });
  const [oe, setOe] = useState<RxOlho>({ ...OLHO_INI });

  // Armação
  const [showShapePicker, setShowShapePicker] = useState(false);
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
  const [lenteTipos, setLenteTipos] = useState(LENTE_TIPOS_PADRAO);
  const [novoTipoOpen, setNovoTipoOpen] = useState(false);
  const [novoTipoLabel, setNovoTipoLabel] = useState('');
  const [lenteOe, setLenteOe] = useState('');

  // Cobrança
  const [cobranca, setCobranca] = useState<ItemCobranca[]>([
    { ...ITEM_COB_INI }, { ...ITEM_COB_INI }, { ...ITEM_COB_INI }, { ...ITEM_COB_INI },
    { ...ITEM_COB_INI }, { ...ITEM_COB_INI },
  ]);

  // Baixa no estoque

  useEffect(() => {
    api.get<Otica[]>('/lab/oticas').then(list => {
      setOticas(list);
      const presel = searchParams.get('otica');
      if (presel) {
        const found = list.find(o => o.id === presel);
        if (found) { setOticaCod(found.codigo || found.nome); setOticaNome(found.nome); }
      }
    }).catch(() => {});
    api.get<Produto[]>('/lab/servicos').then(setProdutos).catch(() => {});
    api.get<{ usuarios: Usuario[] }>('/usuarios').then(d => setOperadores(d.usuarios)).catch(() => {});
    api.get<Record<string, string>>('/lab/configuracoes').then(cfg => {
      const listas: { numero: string; nome: string }[] = [];
      for (let i = 1; i <= 9; i++) {
        const nome = cfg[`tab_lista_${i}`];
        if (nome || i <= 2) listas.push({ numero: String(i), nome: nome || `LISTA ${i}` });
      }
      if (listas.length > 0) setListasDisponiveis(listas);

      // Carrega tipos de lente extras
      const extras: { value: string; label: string }[] = [];
      for (let i = 4; i <= 30; i++) {
        const v = cfg[`lente_tipo_${i}`];
        if (v) extras.push({ value: String(i).padStart(2, '0'), label: v });
      }
      if (extras.length > 0) setLenteTipos([...LENTE_TIPOS_PADRAO, ...extras]);
    }).catch(() => {});
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
      // Auto-fill lista de preço e condição de pagamento (do cadastro da ótica)
      if (found.lista_preco) setListaPreco(String(found.lista_preco));
      if (found.condicao_pgto) setCondPgto(found.condicao_pgto);
      // REF. ÓTICA é MANUAL: o digitador informa a numeração que veio da ótica (não gerar).
    } else {
      setOticaId('');
      setOticaNome('NÃO ENCONTRADO');
      setOticaErro(true);
    }
  }

  function updateOlho(olho: 'od' | 'oe', k: keyof RxOlho, v: string) {
    const setter = olho === 'od' ? setOd : setOe;
    setter(prev => {
      const next = { ...prev, [k]: v };
      // Transposição automática: ESF perto = ESF longe + Adição, CIL perto = CIL longe
      if (k === 'esf_longe' || k === 'adicao' || k === 'cil_longe') {
        const esf = parseFloat((k === 'esf_longe' ? v : next.esf_longe).replace(',', '.')) || 0;
        const adic = parseFloat((k === 'adicao' ? v : next.adicao).replace(',', '.')) || 0;
        const cil = k === 'cil_longe' ? v : next.cil_longe;
        if (adic !== 0) {
          const esfPerto = esf + adic;
          next.esf_perto = Number.isInteger(esfPerto * 100)
            ? esfPerto.toFixed(2)
            : String(Math.round(esfPerto * 100) / 100);
          next.cil_perto = cil;
        }
      }
      return next;
    });
  }

  function setCobItem(i: number, patch: Partial<ItemCobranca>) {
    setCobranca(c => c.map((x, j) => j === i ? { ...x, ...patch } : x));
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

  async function salvarNovoTipo() {
    if (!novoTipoLabel.trim()) return;
    const proximo = lenteTipos.length + 1;
    const chave = `lente_tipo_${proximo}`;
    const num = String(proximo).padStart(2, '0');
    const label = `${num} - ${novoTipoLabel.trim().toUpperCase()}`;
    await api.put('/lab/configuracoes', { [chave]: label });
    const novo = { value: num, label };
    setLenteTipos(t => [...t, novo]);
    setLenteTipo(num);
    setNovoTipoOpen(false);
  }

  const totalGeral = cobranca.reduce((acc, s) => acc + calcItem(s).liq, 0);
  const totalDesc = parseFloat(desconto.replace(',', '.')) || 0;
  const totalFrete = parseFloat(frete.replace(',', '.')) || 0;
  const totalFinal = Math.max(0, totalGeral - totalDesc + totalFrete);

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    // Não interceptar: textarea, checkbox, radio, submit/button
    if (target.tagName === 'TEXTAREA') return;
    if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio' || target.type === 'submit')) return;
    if (target instanceof HTMLButtonElement) return;

    e.preventDefault();
    const form = e.currentTarget;
    const focusable = Array.from(
      form.querySelectorAll<HTMLElement>('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), select, textarea')
    ).filter(el => !el.hasAttribute('disabled') && !el.hasAttribute('readonly'));
    const idx = focusable.indexOf(target);
    if (idx > -1 && idx < focusable.length - 1) {
      focusable[idx + 1].focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!oticaId) { setErro('Selecione a ótica'); return; }

    // Preserva o zero: 0,00 é um grau válido e NÃO pode virar null (só vazio → null)
    const numN = (s: string): number | null => {
      if (s == null || String(s).trim() === '') return null;
      const n = parseFloat(String(s).replace(',', '.'));
      return isNaN(n) ? null : n;
    };
    const intN = (s: string): number | null => {
      if (s == null || String(s).trim() === '') return null;
      const n = parseInt(String(s), 10);
      return isNaN(n) ? null : n;
    };

    const receitaPayload = ([['D', od], ['E', oe]] as const).map(([olho, r]) => ({
      olho,
      esf_longe: numN(r.esf_longe),
      cil_longe: numN(r.cil_longe),
      eixo_longe: intN(r.eixo_longe),
      adicao: numN(r.adicao),
      esf_perto: numN(r.esf_perto),
      cil_perto: numN(r.cil_perto),
      dnp: numN(r.dnp_longe),
      alt: numN(r.alt),
      dec_h: numN(r.dec_h),
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
        data_emissao: dataEmissao || null,
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
      });
      navigate(`/lab/ordens/${id}`);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  const card: React.CSSProperties = {
    background: R.panel, border: `2px inset ${R.border}`, padding: '10px 12px', marginBottom: '8px',
  };
  const secTitle: React.CSSProperties = {
    background: R.hdrBg, color: R.hdrTxt, fontSize: '11px', fontWeight: '700',
    padding: '4px 10px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase',
    border: `2px outset ${R.hdrBorder}`,
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} style={{ display: 'flex', height: '100%', overflow: 'hidden', background: R.bg, fontFamily: "'Montserrat', sans-serif" }}>

      {/* ===== TIPO PANEL — mesmo estilo MÓDULOS ===== */}
      <div style={{ width: '180px', flexShrink: 0, background: R.panel, borderRight: `2px solid ${R.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: R.hdrBg, color: R.hdrTxt, textAlign: 'center', padding: '5px 8px', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', border: `2px outset ${R.hdrBorder}`, borderBottom: 'none' }}>TIPO DE OS</div>
        <div style={{ border: `2px inset ${R.border}` }}>
          {TIPOS.map((t, i) => {
            const isActive = tipo === t.key;
            const rowBg = isActive ? '#005500' : (i % 2 === 0 ? R.panel : R.panelAlt);
            return (
              <div key={t.key} onClick={() => setTipo(t.key)}
                style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: isActive ? R.hdrTxt : R.txt, background: rowBg, borderBottom: `1px solid ${R.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.08s', userSelect: 'none' }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = '#004400'; (e.currentTarget as HTMLElement).style.color = R.hdrTxt; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = rowBg; (e.currentTarget as HTMLElement).style.color = R.txt; } }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.label}</span>
                <span style={{ fontFamily: "'Courier New', monospace", fontWeight: '700', color: isActive ? '#aaffbb' : R.accent }}>{t.key}</span>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: '8px 10px', borderTop: `2px solid ${R.border}`, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1, height: '5px', background: step >= s ? '#005500' : R.border, border: `1px inset ${R.border}` }} />
            ))}
          </div>
          <div style={{ fontSize: '9px', color: R.dim, textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {step === 1 ? 'ETAPA 1 — CABEÇALHO' : 'ETAPA 2 — RECEITA'}
          </div>
          <button type="button" onClick={() => navigate('/lab/ordens')}
            style={{ width: '100%', padding: '5px', fontSize: '11px', background: R.panelAlt, color: R.txt, border: `1px outset ${R.border}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>
            ← VOLTAR
          </button>
        </div>
      </div>

      {/* ===== MAIN FORM ===== */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '0', background: R.bg }}>

        {erro && <div style={{ background: '#ddffee', border: '1px solid #008800', padding: '8px 12px', fontSize: '12px', color: '#005500', marginBottom: '8px', fontWeight: '700' }}>{erro}</div>}

        {/* ===== CABEÇALHO ===== */}
        <div style={card}>
          <div style={secTitle}>Cabeçalho da OS</div>

          {/* Row 1: Ótica + Ref + Classificação + Lista + Previsão */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 130px 80px 80px 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={LBL}>Cód. Ótica *</label>
              <input
                value={oticaCod}
                onChange={e => { setOticaCod(e.target.value); setOticaErro(false); }}
                onBlur={e => handleOticaLookup(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') handleOticaLookup(oticaCod); }}
                style={{ ...INP, borderColor: oticaErro ? '#cc0000' : undefined }}
                placeholder="Cód."
              />
            </div>
            <div>
              <label style={LBL}>Nome da Ótica</label>
              <div style={{ ...INP, background: '#d4d0c8', color: oticaErro ? '#cc0000' : oticaNome ? '#000' : '#666', fontFamily: "'Montserrat', sans-serif", minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                {oticaNome || <span style={{ color: R.dim, fontSize: '11px' }}>Digite o código ou nome acima...</span>}
              </div>
            </div>
            <div>
              <label style={LBL}>Ref. Ótica</label>
              <input value={refOtica} onChange={e => setRefOtica(e.target.value)} style={INP} placeholder="Nº que veio da ótica" />
            </div>
            <div>
              <label style={LBL}>Data Emissão</label>
              <input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Classif.</label>
              <select value={classificacao} onChange={e => setClassificacao(e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="N">N - Normal</option>
                <option value="E">E - Especial</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Lista Preço</label>
              <select value={listaPreco} onChange={e => setListaPreco(e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                {listasDisponiveis.map(l => (
                  <option key={l.numero} value={l.numero}>{l.nome}</option>
                ))}
              </select>
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

          {/* Row 3: Operador + Vendedor + Médico + Usuário Receita */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={LBL}>Operador</label>
              <select value={operador} onChange={e => setOperador(e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">— Operador</option>
                {operadores.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Vendedor (da ótica)</label>
              <input value={vendedor1Id} onChange={e => setVendedor1Id(e.target.value)} style={INP} placeholder="Nome do vendedor..." />
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: '#000', paddingBottom: '2px' }}>
              <input type="checkbox" checked={fluxoLab} onChange={e => setFluxoLab(e.target.checked)} />
              Fluxo LAB
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: '#000', paddingBottom: '2px' }}>
              <input type="checkbox" checked={etiqGarantia} onChange={e => setEtiqGarantia(e.target.checked)} />
              Etiq. Garantia
            </label>
          </div>
        </div>

        {/* ===== BOTÃO PRÓXIMO (step 1) ===== */}
        {step === 1 && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '10px 0 16px' }}>
            <button type="button" onClick={() => navigate('/lab/ordens')}
              style={{ padding: '6px 18px', fontSize: '12px', fontWeight: '700', background: R.panelAlt, color: R.txt, border: `1px outset ${R.border}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
              DESISTIR
            </button>
            <button type="button" onClick={() => {
              if (!oticaId) { setErro('Selecione a ótica antes de continuar'); return; }
              setErro(''); setStep(2);
              setTimeout(() => window.scrollTo({ top: 0 }), 50);
            }}
              style={{ padding: '6px 28px', fontSize: '12px', fontWeight: '700', background: '#005500', color: R.hdrTxt, border: `1px outset ${R.hdrBorder}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '1px' }}>
              PRÓXIMO →
            </button>
          </div>
        )}

        {/* ===== ETAPA 2: RECEITA, ARMAÇÃO, COBRANÇA ===== */}
        {step === 2 && <>

        {/* ===== RECEITA ===== */}
        <div style={card}>
          <div style={secTitle}>Receita das Lentes</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={TH}>OLHO</th>
                  <th style={{ ...TH, padding: '3px 8px' }} colSpan={2}>GRAU LONGE</th>
                  <th style={TH}>EIXO</th>
                  <th style={TH}>ADIC</th>
                  <th style={{ ...TH, padding: '3px 8px' }} colSpan={2}>GRAU PERTO</th>
                  <th style={{ ...TH, borderLeft: '2px solid #007700' }}>DNP</th>
                  <th style={TH}>ALT</th>
                  <th style={TH}>FLUXO</th>
                </tr>
                <tr>
                  <th style={TH}></th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                  <th style={TH}></th><th style={TH}></th>
                  <th style={TH}>ESF</th><th style={TH}>CIL</th>
                  <th style={{ ...TH, borderLeft: '2px solid #007700' }}></th>
                  <th style={TH}></th>
                  <th style={TH}>LAB</th>
                </tr>
              </thead>
              <tbody>
                {(['od', 'oe'] as const).map((o, i) => (
                  <tr key={o}>
                    <td style={{ ...TD, fontSize: '11px', fontWeight: '700', color: R.dim, paddingRight: '6px', whiteSpace: 'nowrap' }}>O/{i === 0 ? 'D' : 'E'}</td>
                    <td style={TD}><RxInput value={o === 'od' ? od.esf_longe : oe.esf_longe} onChange={v => updateOlho(o, 'esf_longe', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.cil_longe : oe.cil_longe} onChange={v => updateOlho(o, 'cil_longe', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.eixo_longe : oe.eixo_longe} onChange={v => updateOlho(o, 'eixo_longe', v)} width={44} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.adicao : oe.adicao} onChange={v => updateOlho(o, 'adicao', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.esf_perto : oe.esf_perto} onChange={v => updateOlho(o, 'esf_perto', v)} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.cil_perto : oe.cil_perto} onChange={v => updateOlho(o, 'cil_perto', v)} /></td>
                    <td style={{ ...TD, borderLeft: '2px solid #007700' }}><RxInput value={o === 'od' ? od.dnp_longe : oe.dnp_longe} onChange={v => updateOlho(o, 'dnp_longe', v)} width={44} /></td>
                    <td style={TD}><RxInput value={o === 'od' ? od.alt : oe.alt} onChange={v => updateOlho(o, 'alt', v)} width={44} /></td>
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
                <select value={armTipo} onChange={e => setArmTipo(e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                  {ARM_TIPOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Shape</label>
                <button type="button" onClick={() => setShowShapePicker(true)}
                  style={{ ...INP, textAlign: 'left', cursor: 'pointer', color: armShape ? '#000' : '#666', fontWeight: armShape ? '700' : '400', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                  <span>{armShape || '— Shape'}</span>
                  <span style={{ fontSize: '10px', color: R.dim }}>▼</span>
                </button>
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
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select value={lenteTipo} onChange={e => setLenteTipo(e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif", flex: 1 }}>
                  <option value="">— Tipo de lente</option>
                  {lenteTipos.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button type="button" onClick={() => { setNovoTipoLabel(''); setNovoTipoOpen(true); }}
                  title="Adicionar novo tipo"
                  style={{ padding: '5px 10px', fontSize: '14px', fontWeight: '700', background: '#005500', color: '#ccffcc', border: '1px outset #007700', cursor: 'pointer', flexShrink: 0 }}>
                  +
                </button>
              </div>
            </div>

            {/* Modal novo tipo de lente */}
            {novoTipoOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={e => e.target === e.currentTarget && setNovoTipoOpen(false)}>
                <div style={{ background: '#d4d0c8', border: '2px outset #b0aca4', width: '320px', padding: '16px' }}>
                  <div style={{ background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', padding: '6px 12px', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', marginBottom: '14px' }}>
                    NOVO TIPO DE LENTE
                  </div>
                  <label style={LBL}>Nome do tipo</label>
                  <input autoFocus value={novoTipoLabel} onChange={e => setNovoTipoLabel(e.target.value)}
                    onKeyDown={async ev => { if (ev.key === 'Enter') await salvarNovoTipo(); else if (ev.key === 'Escape') setNovoTipoOpen(false); }}
                    style={{ ...INP, marginBottom: '12px', fontFamily: "'Montserrat', sans-serif" }}
                    placeholder="Ex: PROGRESSIVA DIGITAL" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setNovoTipoOpen(false)} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: '#c8c4b0', border: '1px outset #b0aca4', cursor: 'pointer' }}>CANCELAR</button>
                    <button type="button" onClick={salvarNovoTipo} disabled={!novoTipoLabel.trim()} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: '#005500', color: '#ccffcc', border: '1px outset #007700', cursor: novoTipoLabel.trim() ? 'pointer' : 'not-allowed' }}>ADICIONAR</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <label style={LBL}>Marca / Material</label>
              <input value={lenteMarca} onChange={e => setLenteMarca(e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div><label style={LBL}>O/D</label><input value={lenteOd} onChange={e => setLenteOd(e.target.value)} style={INP} /></div>
              <div><label style={LBL}>O/E</label><input value={lenteOe} onChange={e => setLenteOe(e.target.value)} style={INP} /></div>
            </div>
            <div style={{ borderTop: '1px solid #b0aca4', paddingTop: '10px', display: 'grid', gridTemplateColumns: '100px auto', gap: '8px', alignItems: 'center' }}>
              <div>
                <label style={LBL}>Caixa</label>
                <input value={caixa} onChange={e => setCaixa(e.target.value)} style={INP} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px', color: '#000', paddingTop: '14px' }}>
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
                <tr style={{ background: '#dedad2', borderBottom: '1px solid #b0aca4' }}>
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
                    <tr key={i} style={{ borderBottom: '1px solid #b0aca4' }}>
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
                      <td style={{ ...TD, fontFamily: "'Courier New', monospace", fontSize: '11px', color: R.dim, textAlign: 'center' }}>
                        {s.estoque || '—'}
                      </td>
                      <td style={TD}><CobInput value={s.qtd} onChange={v => setCobItem(i, { qtd: v })} style={{ textAlign: 'center', width: '50px' }} /></td>
                      <td style={TD}><CobInput value={s.pv_unit} onChange={v => setCobItem(i, { pv_unit: v })} style={{ textAlign: 'right', width: '75px' }} /></td>
                      <td style={{ ...TD, fontFamily: "'Courier New', monospace", fontSize: '12px', color: R.dim, textAlign: 'right', paddingRight: '8px' }}>
                        {bruto > 0 ? bruto.toFixed(2).replace('.', ',') : ''}
                      </td>
                      <td style={TD}><CobInput value={s.perc_desc} onChange={v => setCobItem(i, { perc_desc: v })} style={{ textAlign: 'center', width: '55px' }} /></td>
                      <td style={{ ...TD, fontFamily: "'Courier New', monospace", fontSize: '12px', fontWeight: liq > 0 ? '700' : '400', color: liq > 0 ? '#000' : '#666', textAlign: 'right', paddingRight: '8px' }}>
                        {liq > 0 ? liq.toFixed(2).replace('.', ',') : ''}
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <button type="button" onClick={() => setCobranca(c => c.length > 1 ? c.filter((_, j) => j !== i) : c)}
                          style={{ background: 'none', border: 'none', color: R.dim, cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
            <button type="button" onClick={() => setCobranca(c => [...c, { ...ITEM_COB_INI }])}
              style={{ fontSize: '11px', color: '#003388', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              + Adicionar linha
            </button>
            <div style={{ display: 'flex', gap: '20px', fontFamily: "'Courier New', monospace", fontSize: '13px' }}>
              {totalDesc > 0 && <span style={{ color: '#cc0000' }}>Desc: R$ {totalDesc.toFixed(2).replace('.', ',')}</span>}
              {totalFrete > 0 && <span style={{ color: '#003388' }}>Frete: R$ {totalFrete.toFixed(2).replace('.', ',')}</span>}
              <span style={{ fontWeight: '700', color: '#000', fontSize: '15px' }}>
                Total: R$ {totalFinal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* ===== OBSERVAÇÕES ===== */}
        <div style={card}>
          <label style={LBL}>Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
            style={{ ...INP, fontFamily: "'Montserrat', sans-serif", resize: 'vertical' }} placeholder="Observações gerais..." />
        </div>

        {/* ===== AÇÕES (step 2) ===== */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', padding: '10px 0 16px' }}>
          <button type="button" onClick={() => { setStep(1); setErro(''); }}
            style={{ padding: '6px 16px', fontSize: '11px', fontWeight: '700', background: R.panelAlt, color: R.txt, border: `1px outset ${R.border}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            ← ANTERIOR
          </button>
          <button type="button" onClick={() => navigate('/lab/ordens')}
            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700', background: R.panelAlt, color: R.txt, border: `1px outset ${R.border}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            DESISTIR
          </button>
          <button type="button" disabled={saving} onClick={handleSubmit as unknown as React.MouseEventHandler}
            style={{ padding: '6px 20px', fontSize: '11px', fontWeight: '700', background: R.panelAlt, color: R.txt, border: `1px outset ${R.border}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            GRAVAR
          </button>
          <button type="button" disabled={saving} onClick={handleSubmit as unknown as React.MouseEventHandler}
            style={{ padding: '6px 24px', fontSize: '11px', fontWeight: '700', background: '#005500', color: R.hdrTxt, border: `1px outset ${R.hdrBorder}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {saving ? 'SALVANDO...' : 'GRAVAR + IMPRIMIR'}
          </button>
        </div>

        </>}

      </div>
      {showShapePicker && (
        <LabShapePicker value={armShape} onChange={setArmShape} onClose={() => setShowShapePicker(false)} />
      )}
    </form>
  );
}
