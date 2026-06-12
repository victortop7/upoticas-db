import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

type Tab = 'cliente' | 'receita' | 'laboratorio' | 'fechamento' | 'busca';
type BuscaTipo = 'numero' | 'data' | 'nome' | 'cpf';
type BuscaLista = 'os' | 'excluidas' | 'clientes';

interface OSData {
  cliente_nome: string; cliente_cpf: string; cliente_rg: string;
  cliente_tel: string; cliente_tel2: string; cliente_email: string;
  cliente_cep: string; cliente_endereco: string; cliente_bairro: string;
  cliente_numero: string; cliente_cidade: string; cliente_uf: string;
  cliente_obs: string; cliente_nascimento: string; cliente_sexo: string;
  cliente_vendedor: string;
  od_esf: string; od_cil: string; od_eixo: string;
  od_adicao: string; od_dnp: string; od_alt: string;
  od_prisma_h: string; od_base_h: string; od_prisma_v: string; od_base_v: string;
  oe_esf: string; oe_cil: string; oe_eixo: string;
  oe_adicao: string; oe_dnp: string; oe_alt: string;
  oe_prisma_h: string; oe_base_h: string; oe_prisma_v: string; oe_base_v: string;
  medico_nome: string; medico_crm: string; data_receita: string; receita_obs: string;
  arm_dnp_od: string; arm_dnp_oe: string;
  arm_vertical: string; arm_ponte: string; arm_aro: string;
  arm_alt_pupilar_od: string; arm_alt_pupilar_oe: string;
  arm_dv: string; arm_diag_maior: string; arm_ip: string; arm_ca: string;
  arm_tipo: string; arm_obs: string;
  lentes_nome: string; lentes_desc: string; lentes_obs: string;
  armacao_nome: string; armacao_obs: string;
  data_entrega: string;
  desconto: string; acrescimo: string;
  forma_pagamento: string; parcelas: string; tipo: string;
  valor_lente: string; valor_armacao: string;
  // kept for API compat
  arm_dnp: string; arm_alt_pupilar: string; lente_desc: string;
}

interface VisionOSRow {
  id: string; numero: number; tipo: string;
  cliente_nome: string | null; valor_total: number; status: string; created_at: string;
}

const EMPTY: OSData = {
  cliente_nome: '', cliente_cpf: '', cliente_rg: '',
  cliente_tel: '', cliente_tel2: '', cliente_email: '',
  cliente_cep: '', cliente_endereco: '', cliente_bairro: '',
  cliente_numero: '', cliente_cidade: '', cliente_uf: 'CE',
  cliente_obs: '', cliente_nascimento: '', cliente_sexo: '',
  cliente_vendedor: '',
  od_esf: '', od_cil: '', od_eixo: '', od_adicao: '', od_dnp: '', od_alt: '',
  od_prisma_h: '', od_base_h: '', od_prisma_v: '', od_base_v: '',
  oe_esf: '', oe_cil: '', oe_eixo: '', oe_adicao: '', oe_dnp: '', oe_alt: '',
  oe_prisma_h: '', oe_base_h: '', oe_prisma_v: '', oe_base_v: '',
  medico_nome: '', medico_crm: '', data_receita: '', receita_obs: '',
  arm_dnp_od: '', arm_dnp_oe: '',
  arm_vertical: '', arm_ponte: '', arm_aro: '',
  arm_alt_pupilar_od: '', arm_alt_pupilar_oe: '',
  arm_dv: '', arm_diag_maior: '', arm_ip: '', arm_ca: '',
  arm_tipo: '---', arm_obs: '',
  lentes_nome: '', lentes_desc: '', lentes_obs: '',
  armacao_nome: '', armacao_obs: '',
  data_entrega: '',
  desconto: '0', acrescimo: '0',
  forma_pagamento: 'Cartão', parcelas: '12', tipo: 'orcamento',
  valor_lente: '0', valor_armacao: '0',
  arm_dnp: '', arm_alt_pupilar: '', lente_desc: '',
};

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function fmtEsf(v: number) { return (v > 0 ? '+' : '') + v.toFixed(2); }
const ESF_VALS = ['', ...Array.from({ length: 161 }, (_, i) => fmtEsf(20 - i * 0.25))];
const CIL_VALS = ['', 'plano', ...Array.from({ length: 32 }, (_, i) => (-(i + 1) * 0.25).toFixed(2))];
const ADD_VALS = ['', ...Array.from({ length: 16 }, (_, i) => '+' + ((i + 1) * 0.25).toFixed(2))];
const BASE_VALS = ['', 'IN', 'OUT', 'UP', 'DOWN'];
const ARM_TIPOS = ['---', 'Aro fechado', 'Nylon', 'Parafuso', 'Balgriff', 'Sem aro'];

const BG = '#f2f2f7';
const BORDER = '#d1d1d6';
const LABEL: React.CSSProperties = {
  fontSize: 11, color: '#8e8e93', fontWeight: 600,
  letterSpacing: '-0.01em', display: 'block', marginBottom: 2,
};
const INPUT: React.CSSProperties = {
  background: '#fff', border: `1px solid ${BORDER}`,
  padding: '6px 10px', fontSize: 13.5, fontFamily: 'inherit',
  color: '#1c1c1e', outline: 'none', width: '100%',
  boxSizing: 'border-box', borderRadius: 9,
};
const SEL: React.CSSProperties = { ...INPUT, padding: '5px 6px', cursor: 'pointer' };
const BTN: React.CSSProperties = {
  background: '#007aff', border: 'none',
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', color: '#fff', whiteSpace: 'nowrap', borderRadius: 10,
  letterSpacing: '-0.01em',
};

function F({ label, value, onChange, placeholder = '', type = 'text', style = {} }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {label && <label style={LABEL}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={INPUT} />
    </div>
  );
}

function Radio({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      width: 18, height: 18, borderRadius: '50%',
      border: checked ? '5.5px solid #007aff' : '2px solid #c7c7cc',
      background: '#fff', boxSizing: 'border-box', cursor: 'pointer',
      flexShrink: 0,
      transition: 'border .15s',
    }} />
  );
}

function totalOS(data: OSData) {
  const lente = parseFloat(data.valor_lente) || 0;
  const armacao = parseFloat(data.valor_armacao) || 0;
  const desc = parseFloat(data.desconto) || 0;
  const acres = parseFloat(data.acrescimo) || 0;
  return Math.max(0, lente + armacao - desc + acres);
}

// ── Glasses SVG (armação wayfarer) ─────────────────────────────────────────────
function GlassesSVG({ data }: { data: OSData }) {
  const v = (val: string) => val || '';
  const FRAME = '#2e2e32';
  const ARROW = '#6e6e73';
  const LBL = '#8e8e93';
  return (
    <svg viewBox="0 0 720 290" width="100%" style={{ display: 'block', background: '#e9e9ee' }}>
      {/* ── Armação wayfarer ── */}
      {/* Lente esquerda */}
      <path
        d="M 64,84 L 300,92 C 308,92 311,98 310,106 L 298,202 C 294,228 281,237 254,239 L 116,244 C 85,244 70,232 67,206 L 56,106 C 55,90 58,84 64,84 Z"
        fill="rgba(160,180,205,0.16)" stroke={FRAME} strokeWidth="14" strokeLinejoin="round"
      />
      {/* Lente direita (espelhada) */}
      <path
        d="M 656,84 L 420,92 C 412,92 409,98 410,106 L 422,202 C 426,228 439,237 466,239 L 604,244 C 635,244 650,232 653,206 L 664,106 C 665,90 662,84 656,84 Z"
        fill="rgba(160,180,205,0.16)" stroke={FRAME} strokeWidth="14" strokeLinejoin="round"
      />
      {/* Ponte */}
      <path d="M 310,108 C 330,90 390,90 410,108" fill="none" stroke={FRAME} strokeWidth="13" strokeLinecap="round" />
      {/* Hastes */}
      <path d="M 57,100 L 16,94" stroke={FRAME} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M 663,100 L 704,94" stroke={FRAME} strokeWidth="11" strokeLinecap="round" fill="none" />
      {/* Rebites (detalhe wayfarer) */}
      <ellipse cx="80" cy="96" rx="5.5" ry="3.5" fill="#f4f4f6" transform="rotate(-12,80,96)" />
      <ellipse cx="640" cy="96" rx="5.5" ry="3.5" fill="#f4f4f6" transform="rotate(12,640,96)" />

      {/* ── Linha central ── */}
      <line x1="360" y1="20" x2="360" y2="86" stroke={ARROW} strokeWidth="1" strokeDasharray="3 3" />

      {/* ── DNP OE (esquerda) ── */}
      <line x1="183" y1="34" x2="360" y2="34" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="183,30 183,38 176,34" fill={ARROW} />
      <text x="248" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill={LBL}>DNP OE</text>
      <rect x="245" y="40" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="270" y="54" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_dnp_oe)}</text>

      {/* ── DNP OD (direita) ── */}
      <line x1="360" y1="34" x2="537" y2="34" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="537,30 537,38 544,34" fill={ARROW} />
      <text x="472" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill={LBL}>DNP OD</text>
      <rect x="425" y="40" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="450" y="54" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_dnp_od)}</text>

      {/* ── VERTICAL (dentro da lente esquerda) ── */}
      <line x1="150" y1="92" x2="150" y2="236" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="146,92 154,92 150,85" fill={ARROW} />
      <polygon points="146,236 154,236 150,243" fill={ARROW} />
      <text x="150" y="140" textAnchor="middle" fontSize="10" fontWeight="600" fill={LBL}>VERTICAL</text>
      <rect x="125" y="148" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="150" y="162" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_vertical)}</text>

      {/* ── PONTE (entre as lentes) ── */}
      <line x1="314" y1="172" x2="406" y2="172" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="314,168 314,176 307,172" fill={ARROW} />
      <polygon points="406,168 406,176 413,172" fill={ARROW} />
      <text x="360" y="163" textAnchor="middle" fontSize="10" fontWeight="600" fill={LBL}>PONTE</text>
      <rect x="335" y="180" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="360" y="194" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_ponte)}</text>

      {/* ── ARO (largura da lente direita) ── */}
      <line x1="416" y1="150" x2="658" y2="150" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="416,146 416,154 409,150" fill={ARROW} />
      <polygon points="658,146 658,154 665,150" fill={ARROW} />
      <text x="537" y="141" textAnchor="middle" fontSize="10" fontWeight="600" fill={LBL}>ARO</text>
      <rect x="512" y="158" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="537" y="172" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_aro)}</text>

      {/* ── ALT PUPILAR OD (lateral esquerda) ── */}
      <line x1="38" y1="84" x2="38" y2="244" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="34,84 42,84 38,77" fill={ARROW} />
      <polygon points="34,244 42,244 38,251" fill={ARROW} />
      <text x="24" y="164" fontSize="9.5" fontWeight="600" fill={LBL} textAnchor="middle" transform="rotate(-90,24,164)">ALT PUPILAR OD</text>
      <rect x="13" y="256" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="38" y="270" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_alt_pupilar_od)}</text>

      {/* ── ALT PUPILAR OE (lateral direita) ── */}
      <line x1="682" y1="84" x2="682" y2="244" stroke={ARROW} strokeWidth="1.2" />
      <polygon points="678,84 686,84 682,77" fill={ARROW} />
      <polygon points="678,244 686,244 682,251" fill={ARROW} />
      <text x="696" y="164" fontSize="9.5" fontWeight="600" fill={LBL} textAnchor="middle" transform="rotate(90,696,164)">ALT PUPILAR OE</text>
      <rect x="657" y="256" width="50" height="20" rx="5" fill="#fff" stroke="#c7c7cc" strokeWidth="1" />
      <text x="682" y="270" textAnchor="middle" fontSize="12" fill="#1c1c1e">{v(data.arm_alt_pupilar_oe)}</text>
    </svg>
  );
}

export default function VisionOS() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('cliente');
  const [data, setData] = useState<OSData>({ ...EMPTY });
  const [oslist, setOslist] = useState<VisionOSRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaTipo, setBuscaTipo] = useState<BuscaTipo>('numero');
  const [buscaLista, setBuscaLista] = useState<BuscaLista>('os');

  function set(field: keyof OSData) { return (v: string) => setData(p => ({ ...p, [field]: v })); }

  async function salvar(tipo: 'orcamento' | 'venda') {
    setSaving(true);
    try {
      const total = totalOS(data);
      await api.post('/vision/os', {
        ...data, tipo,
        od_esf: data.od_esf || null, od_cil: data.od_cil || null,
        od_eixo: data.od_eixo ? parseInt(data.od_eixo) : null,
        od_adicao: data.od_adicao || null, od_dnp: data.od_dnp || null, od_alt: data.od_alt || null,
        oe_esf: data.oe_esf || null, oe_cil: data.oe_cil || null,
        oe_eixo: data.oe_eixo ? parseInt(data.oe_eixo) : null,
        oe_adicao: data.oe_adicao || null, oe_dnp: data.oe_dnp || null, oe_alt: data.oe_alt || null,
        arm_dnp: data.arm_dnp_od || null,
        arm_vertical: data.arm_vertical || null,
        arm_ponte: data.arm_ponte || null,
        arm_aro: data.arm_aro || null,
        arm_alt_pupilar: data.arm_alt_pupilar_od || null,
        lente_desc: data.lentes_nome || null,
        valor_lente: parseFloat(data.valor_lente) || 0,
        valor_armacao: parseFloat(data.valor_armacao) || 0,
        desconto: parseFloat(data.desconto) || 0,
        valor_total: total,
        parcelas: parseInt(data.parcelas) || 12,
      });
      setSaved(true);
      setData({ ...EMPTY });
      setTimeout(() => setSaved(false), 2500);
    } catch { alert('Erro ao salvar OS.'); }
    finally { setSaving(false); }
  }

  async function carregarBusca() {
    try {
      const rows = await api.get<VisionOSRow[]>(`/vision/os?q=${encodeURIComponent(busca)}&limit=50`);
      setOslist(rows);
    } catch { /**/ }
  }

  useEffect(() => { if (tab === 'busca') carregarBusca(); }, [tab]);

  const total = totalOS(data);
  const parc = parseInt(data.parcelas) || 12;
  const TABS: [Tab, string][] = [
    ['cliente', 'CLIENTE'], ['receita', 'RECEITA'],
    ['laboratorio', 'LABORATÓRIO'], ['fechamento', 'FECHAMENTO'], ['busca', 'BUSCA'],
  ];

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: BG, userSelect: 'none', overflow: 'hidden', color: '#1c1c1e',
    }}>

      {/* ── Header resumo do cliente ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(249,249,251,0.85)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        borderBottom: '0.5px solid rgba(60,60,67,0.22)',
        padding: '6px 0', flexShrink: 0, fontSize: 12,
      }}>
        {[
          ['Cliente', data.cliente_nome],
          ['Telefone', data.cliente_tel],
          ['Documento', data.cliente_cpf],
          ['RG', data.cliente_rg],
          ['Nascimento', data.cliente_nascimento],
        ].map(([label, val], i) => (
          <div key={i} style={{
            flex: 1, display: 'flex', gap: 5, padding: '0 12px',
            borderRight: i < 4 ? '0.5px solid rgba(60,60,67,0.18)' : 'none',
          }}>
            <span style={{ fontWeight: 600, color: '#8e8e93', whiteSpace: 'nowrap' }}>{label}:</span>
            <span style={{ color: val ? '#1c1c1e' : '#c7c7cc', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || ''}</span>
          </div>
        ))}
      </div>

      {/* ── Nav + tabs estilo iOS ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(249,249,251,0.85)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        borderBottom: '0.5px solid rgba(60,60,67,0.22)',
        padding: '7px 12px', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          color: '#007aff', fontSize: 15, fontWeight: 500,
          cursor: 'pointer', whiteSpace: 'nowrap', padding: '4px 6px',
          WebkitTapHighlightColor: 'transparent',
        }} onClick={() => navigate('/vision')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          O.S.
        </div>
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(118,118,128,0.12)',
            borderRadius: 10, padding: 2.5, display: 'flex', gap: 2,
          }}>
            {TABS.map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? '#fff' : 'transparent',
                border: 'none',
                padding: '6px 18px', cursor: 'pointer', borderRadius: 8,
                fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em',
                color: tab === t ? '#1c1c1e' : 'rgba(60,60,67,0.6)',
                boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'all .18s',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'capitalize',
              }}>{label.charAt(0) + label.slice(1).toLowerCase()}</button>
            ))}
          </div>
        </div>
        <div style={{ width: 50 }} />
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ════ CLIENTE ════ */}
        {tab === 'cliente' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>Cliente:</span>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#007aff', border: '3px solid #fff', boxShadow: '0 0 0 2px #1144cc', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontStyle: 'italic' }}>É o Paciente</span>
              </div>
              <button style={{ background: '#fff', border: '1px solid #d1d1d6', borderRadius: 9, color: '#007aff', padding: '4px 16px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
                PESQUISA
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap' }}>Vendedor:</span>
                <input value={data.cliente_vendedor} onChange={e => set('cliente_vendedor')(e.target.value)} style={{ ...INPUT, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={LABEL}>Data Nascimento:</label>
                <input value={data.cliente_nascimento} onChange={e => set('cliente_nascimento')(e.target.value)}
                  placeholder="DD/MM/AAAA" style={{ ...INPUT, width: 120 }} />
              </div>
            </div>

            {/* Row 2: CPF + RG + Sexo */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <F label="CPF" value={data.cliente_cpf} onChange={set('cliente_cpf')} placeholder="000.000.000-00" style={{ flex: 2 }} />
              <F label="RG" value={data.cliente_rg} onChange={set('cliente_rg')} placeholder="0000000-0" style={{ flex: 2 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 4, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>SEXO:</span>
                {['Masc', 'Fem'].map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                    <Radio checked={data.cliente_sexo === s} onClick={() => set('cliente_sexo')(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            {/* Row 3: Nome */}
            <F label="Nome" value={data.cliente_nome} onChange={set('cliente_nome')} placeholder="Nome completo" />

            {/* Row 4: CEP + Endereço */}
            <div style={{ display: 'flex', gap: 8 }}>
              <F label="CEP" value={data.cliente_cep} onChange={set('cliente_cep')} placeholder="00000-000" style={{ flex: '0 0 140px' }} />
              <F label="ENDEREÇO" value={data.cliente_endereco} onChange={set('cliente_endereco')} style={{ flex: 1 }} />
            </div>

            {/* Row 5: Bairro + Nº */}
            <div style={{ display: 'flex', gap: 8 }}>
              <F label="BAIRRO" value={data.cliente_bairro} onChange={set('cliente_bairro')} style={{ flex: 1 }} />
              <F label="Nº" value={data.cliente_numero} onChange={set('cliente_numero')} style={{ flex: '0 0 80px' }} />
            </div>

            {/* Row 6: Cidade + UF */}
            <div style={{ display: 'flex', gap: 8 }}>
              <F label="CIDADE" value={data.cliente_cidade} onChange={set('cliente_cidade')} style={{ flex: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 90px' }}>
                <label style={LABEL}>UF</label>
                <select value={data.cliente_uf} onChange={e => set('cliente_uf')(e.target.value)} style={SEL}>
                  {UFS.map(uf => <option key={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            {/* Row 7: Fones */}
            <div style={{ display: 'flex', gap: 8 }}>
              <F label="FONE 1" value={data.cliente_tel} onChange={set('cliente_tel')} placeholder="(00) 00000-0000" style={{ flex: 1 }} />
              <F label="FONE 2" value={data.cliente_tel2} onChange={set('cliente_tel2')} placeholder="(00) 00000-0000" style={{ flex: 1 }} />
            </div>

            {/* Row 8: Email */}
            <F label="E-mail" value={data.cliente_email} onChange={set('cliente_email')} type="email" />

            {/* Row 9: Obs */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label style={LABEL}>OBSERVAÇÃO</label>
              <textarea value={data.cliente_obs} onChange={e => set('cliente_obs')(e.target.value)}
                style={{ ...INPUT, resize: 'none', flex: 1, minHeight: 52, fontFamily: 'inherit' }} />
            </div>
          </div>
        )}

        {/* ════ RECEITA ════ */}
        {tab === 'receita' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>Receita:</div>

            {/* Prescription table */}
            <div style={{ overflowX: 'auto', border: '1px solid #d1d1d6' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#e9e9ee' }}>
                    <th style={{ border: '1px solid #d1d1d6', width: 38, padding: '4px' }} />
                    <th style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>ESF</th>
                    <th style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>CIL</th>
                    <th style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>EIXO</th>
                    <th style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>ADIÇÃO</th>
                    <th style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>DNP</th>
                    <th style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>ALT</th>
                    <th colSpan={2} style={{ border: '1px solid #d1d1d6', padding: '3px 6px', fontSize: 10, fontWeight: 'normal', color: '#444', textAlign: 'center' }}>PRISMA HORIZONTAL</th>
                    <th colSpan={2} style={{ border: '1px solid #d1d1d6', padding: '3px 6px', fontSize: 10, fontWeight: 'normal', color: '#444', textAlign: 'center' }}>PRISMA VERTICAL</th>
                  </tr>
                  <tr style={{ background: '#e9e9ee' }}>
                    {[...Array(7)].map((_, i) => <th key={i} style={{ border: '1px solid #d1d1d6' }} />)}
                    {['PRISMA', 'BASE', 'PRISMA', 'BASE'].map((h, i) => (
                      <th key={i} style={{ border: '1px solid #d1d1d6', padding: '2px 4px', fontSize: 10, fontWeight: 'normal', fontStyle: 'italic', color: '#555' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { olho: 'OD', fields: ['od_esf','od_cil','od_eixo','od_adicao','od_dnp','od_alt','od_prisma_h','od_base_h','od_prisma_v','od_base_v'] },
                    { olho: 'OE', fields: ['oe_esf','oe_cil','oe_eixo','oe_adicao','oe_dnp','oe_alt','oe_prisma_h','oe_base_h','oe_prisma_v','oe_base_v'] },
                  ].map(({ olho, fields }) => (
                    <tr key={olho}>
                      <td style={{ border: '1px solid #d1d1d6', background: '#e9e9ee', fontWeight: 'bold', fontSize: 13, textAlign: 'center', padding: '4px' }}>{olho}</td>
                      {/* ESF */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <select value={data[fields[0] as keyof OSData]} onChange={e => set(fields[0] as keyof OSData)(e.target.value)} style={{ ...SEL, width: 82 }}>
                          {ESF_VALS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      {/* CIL */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <select value={data[fields[1] as keyof OSData]} onChange={e => set(fields[1] as keyof OSData)(e.target.value)} style={{ ...SEL, width: 82 }}>
                          {CIL_VALS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      {/* EIXO */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <input value={data[fields[2] as keyof OSData]} onChange={e => set(fields[2] as keyof OSData)(e.target.value)}
                          style={{ ...INPUT, width: 56, textAlign: 'center', background: '#f2f2f7' }} placeholder="0°" />
                      </td>
                      {/* ADIÇÃO */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <select value={data[fields[3] as keyof OSData]} onChange={e => set(fields[3] as keyof OSData)(e.target.value)} style={{ ...SEL, width: 76 }}>
                          {ADD_VALS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      {/* DNP */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <input value={data[fields[4] as keyof OSData]} onChange={e => set(fields[4] as keyof OSData)(e.target.value)}
                          style={{ ...INPUT, width: 60, textAlign: 'center' }} placeholder="32.0" />
                      </td>
                      {/* ALT */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <input value={data[fields[5] as keyof OSData]} onChange={e => set(fields[5] as keyof OSData)(e.target.value)}
                          style={{ ...INPUT, width: 60, textAlign: 'center' }} placeholder="22.0" />
                      </td>
                      {/* PRISMA H */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <input value={data[fields[6] as keyof OSData]} onChange={e => set(fields[6] as keyof OSData)(e.target.value)}
                          style={{ ...INPUT, width: 60, textAlign: 'center' }} placeholder="0.00" />
                      </td>
                      {/* BASE H */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <select value={data[fields[7] as keyof OSData]} onChange={e => set(fields[7] as keyof OSData)(e.target.value)} style={{ ...SEL, width: 72 }}>
                          {BASE_VALS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      {/* PRISMA V */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <input value={data[fields[8] as keyof OSData]} onChange={e => set(fields[8] as keyof OSData)(e.target.value)}
                          style={{ ...INPUT, width: 60, textAlign: 'center' }} placeholder="0.00" />
                      </td>
                      {/* BASE V */}
                      <td style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                        <select value={data[fields[9] as keyof OSData]} onChange={e => set(fields[9] as keyof OSData)(e.target.value)} style={{ ...SEL, width: 72 }}>
                          {BASE_VALS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lower: box + médico/data/obs */}
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
              {/* Left empty box + eye btn */}
              <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ flex: 1, border: '1px solid #d1d1d6', background: '#e9e9ee', minHeight: 100 }} />
                <button style={{ background: '#007aff', border: 'none', borderRadius: 10, padding: '10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 64 42" width="64" height="42" fill="none">
                    <rect x="3" y="8" width="58" height="30" rx="5" stroke="white" strokeWidth="3" />
                    <ellipse cx="22" cy="23" rx="8" ry="8" stroke="white" strokeWidth="2.5" />
                    <circle cx="22" cy="23" r="3.5" fill="white" />
                    <ellipse cx="42" cy="23" rx="8" ry="8" stroke="white" strokeWidth="2.5" />
                    <circle cx="42" cy="23" r="3.5" fill="white" />
                    <line x1="30" y1="23" x2="34" y2="23" stroke="white" strokeWidth="2" />
                    <line x1="3" y1="23" x2="14" y2="23" stroke="white" strokeWidth="2" />
                    <line x1="50" y1="23" x2="61" y2="23" stroke="white" strokeWidth="2" />
                    <path d="M22 15 L18 8 M42 15 L46 8" stroke="white" strokeWidth="2" />
                    <path d="M26 10 Q32 5 38 10" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </button>
              </div>

              {/* Right: médico + data + obs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <F label="Nome Médico" value={data.medico_nome} onChange={set('medico_nome')} placeholder="Dr. Nome" style={{ flex: 1 }} />
                  <F label="CRM" value={data.medico_crm} onChange={set('medico_crm')} placeholder="00000/UF" style={{ flex: '0 0 120px' }} />
                  <button style={{ ...BTN, background: '#fff', color: '#007aff', border: '1px solid #d1d1d6', alignSelf: 'flex-end' }}>
                    Selecionar Médico
                  </button>
                </div>
                <div>
                  <label style={LABEL}>Data Receita:</label>
                  <input value={data.data_receita} onChange={e => set('data_receita')(e.target.value)}
                    placeholder="DD/MM/AAAA" style={{ ...INPUT, width: 130 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={LABEL}>Observação</label>
                  <textarea value={data.receita_obs} onChange={e => set('receita_obs')(e.target.value)}
                    style={{ ...INPUT, resize: 'none', flex: 1, minHeight: 80, fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ LABORATÓRIO ════ */}
        {tab === 'laboratorio' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '8px 12px', gap: 8 }}>
            <div>
              <label style={LABEL}>Data Entrega:</label>
              <input value={data.data_entrega} onChange={e => set('data_entrega')(e.target.value)}
                placeholder="DD/MM/AAAA" style={{ ...INPUT, width: 130 }} />
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 12 }}>
              {/* LEFT */}
              <div style={{ flex: '0 0 560px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Glasses illustration */}
                <GlassesSVG data={data} />

                {/* OD/OE lab table */}
                <div style={{ overflowX: 'auto', border: '1px solid #d1d1d6' }}>
                  <table style={{ borderCollapse: 'collapse', minWidth: 500 }}>
                    <thead>
                      <tr style={{ background: '#e9e9ee' }}>
                        <th style={{ border: '1px solid #d1d1d6', padding: '3px 6px', width: 36 }} />
                        {['ESF','CIL','EIXO','ADIÇÃO','DNP','ALT','PRISMA','BASE','PRISMA','BASE'].map((h, i) => (
                          <th key={i} style={{ border: '1px solid #d1d1d6', padding: '3px 5px', fontSize: 10, fontWeight: 'normal', fontStyle: 'italic', color: '#333' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { olho: 'OD', fields: ['od_esf','od_cil','od_eixo','od_adicao','od_dnp','od_alt','od_prisma_h','od_base_h','od_prisma_v','od_base_v'] },
                        { olho: 'OE', fields: ['oe_esf','oe_cil','oe_eixo','oe_adicao','oe_dnp','oe_alt','oe_prisma_h','oe_base_h','oe_prisma_v','oe_base_v'] },
                      ].map(({ olho, fields }) => (
                        <tr key={olho}>
                          <td style={{ border: '1px solid #d1d1d6', background: '#e9e9ee', fontWeight: 'bold', fontSize: 12, textAlign: 'center', padding: '3px' }}>{olho}</td>
                          {fields.map(f => (
                            <td key={f} style={{ border: '1px solid #d1d1d6', padding: 2 }}>
                              <input value={data[f as keyof OSData]} onChange={e => set(f as keyof OSData)(e.target.value)}
                                style={{ ...INPUT, width: 48, textAlign: 'center', fontSize: 11 }} placeholder="mm" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Measurement inputs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {[
                    ['DNP OD', 'arm_dnp_od', 68], ['DNP OE', 'arm_dnp_oe', 68],
                    ['VERTICAL', 'arm_vertical', 68], ['PONTE', 'arm_ponte', 68],
                    ['ARO', 'arm_aro', 68], ['D.V.', 'arm_dv', 56],
                    ['DIAG. MAIOR', 'arm_diag_maior', 80], ['I.P.', 'arm_ip', 56], ['C.A.', 'arm_ca', 56],
                    ['ALT PUP OD', 'arm_alt_pupilar_od', 72], ['ALT PUP OE', 'arm_alt_pupilar_oe', 72],
                  ].map(([label, field, w]) => (
                    <div key={field as string} style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ ...LABEL, fontSize: 10 }}>{label as string}</label>
                      <input value={data[field as keyof OSData]} onChange={e => set(field as keyof OSData)(e.target.value)}
                        style={{ ...INPUT, width: Number(w), textAlign: 'center', fontSize: 12 }} placeholder="mm" />
                    </div>
                  ))}
                </div>

                {/* Tipo Armação + Obs */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={LABEL}>Tipo Armação:</label>
                    <select value={data.arm_tipo} onChange={e => set('arm_tipo')(e.target.value)} style={{ ...SEL, width: 160 }}>
                      {ARM_TIPOS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={LABEL}>OBSERVAÇÃO</label>
                    <input value={data.arm_obs} onChange={e => set('arm_obs')(e.target.value)} style={INPUT} />
                  </div>
                </div>
              </div>

              {/* RIGHT — Lentes */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 'bold' }}>LENTES:</span>
                  <div style={{ border: '1px solid #d1d1d6', background: '#e9e9ee', minHeight: 70, padding: 4, marginTop: 2 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={LABEL}>DESCRIÇÃO DAS LENTES</label>
                  <textarea value={data.lentes_desc} onChange={e => set('lentes_desc')(e.target.value)}
                    style={{ ...INPUT, resize: 'none', flex: 1, minHeight: 70, fontFamily: 'inherit' }} />
                </div>
                <F label="ARMAÇÃO" value={data.armacao_nome} onChange={set('armacao_nome')} />
                <F label="OBSERVAÇÃO" value={data.armacao_obs} onChange={set('armacao_obs')} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <F label="Valor Lente (R$)" value={data.valor_lente} onChange={set('valor_lente')} placeholder="0,00" style={{ flex: 1 }} />
                  <F label="Valor Armação (R$)" value={data.valor_armacao} onChange={set('valor_armacao')} placeholder="0,00" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ FECHAMENTO ════ */}
        {tab === 'fechamento' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Panel headers */}
            <div style={{ display: 'flex', background: '#e9e9ee', borderBottom: '1px solid #d1d1d6', flexShrink: 0 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRight: '1px solid #d1d1d6' }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>Itens Vistos:</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {['🔍', '✕', '→'].map((ic, i) => (
                    <button key={i} style={{ background: '#007aff', border: 'none', borderRadius: 8, padding: '5px 11px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>Itens Vendidos:</span>
                <span style={{ fontSize: 11 }}>+ Acessórios:</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[
                    { ic: '👁', bg: '#007aff' }, { ic: '🕶', bg: '#007aff' },
                    { ic: '▌▌▌', bg: '#007aff' }, { ic: '✕', bg: '#ff3b30' },
                  ].map(({ ic, bg }, i) => (
                    <button key={i} style={{ background: bg, border: 'none', borderRadius: 8, padding: '5px 9px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>{ic}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table headers */}
            <div style={{ display: 'flex', background: '#e9e9ee', flexShrink: 0 }}>
              {[0, 1].map(pi => (
                <div key={pi} style={{ flex: 1, borderRight: pi === 0 ? '1px solid #d1d1d6' : 'none' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['COD', 'AO', 'UN', 'PRODUTO', 'PREÇO'].map(h => (
                          <th key={h} style={{ border: '1px solid #d1d1d6', padding: '3px 6px', fontWeight: 'bold', color: '#333', textAlign: h === 'PRODUTO' ? 'left' : 'center' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                  </table>
                </div>
              ))}
            </div>

            {/* Empty list area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, background: '#f2f2f7', borderRight: '1px solid #d1d1d6' }} />
              <div style={{ flex: 1, background: '#f2f2f7' }} />
            </div>

            {/* Bottom row */}
            <div style={{ display: 'flex', borderTop: '1px solid #d1d1d6', flexShrink: 0 }}>
              {/* Left: SUB TOTAL */}
              <div style={{ flex: 1, padding: '6px 12px', borderRight: '1px solid #d1d1d6', background: '#e9e9ee', display: 'flex', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 12 }}>SUB TOTAL:</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>Indisponível</span>
              </div>

              {/* Right: Fechamento */}
              <div style={{ flex: 1, background: '#e9e9ee', padding: '8px 12px', display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Fechamento:</div>
                  <div>
                    <label style={LABEL}>Data Entrega:</label>
                    <input value={data.data_entrega} onChange={e => set('data_entrega')(e.target.value)}
                      placeholder="DD/MM/AAAA" style={{ ...INPUT, width: 130 }} />
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12 }}>Desconto (R$):</span>
                    <input value={data.desconto} onChange={e => set('desconto')(e.target.value)}
                      style={{ ...INPUT, width: 70, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12 }}>Acréscimo (R$):</span>
                    <input value={data.acrescimo} onChange={e => set('acrescimo')(e.target.value)}
                      style={{ ...INPUT, width: 70, textAlign: 'right' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                    Total: {parc}x de {(total / parc).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', background: '#f2f2f7', borderTop: '1px solid #d1d1d6', flexShrink: 0 }}>
              <div style={{ flex: 1, borderRight: '1px solid #d1d1d6', padding: '6px 10px' }}>
                {saved && <span style={{ fontSize: 13, color: '#006600', fontWeight: 'bold' }}>✓ Salvo!</span>}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 4, padding: '6px 8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setData({ ...EMPTY })} style={BTN}>Nova</button>
                <button onClick={() => salvar('orcamento')} disabled={saving} style={BTN}>Salvar Orçamento</button>
                <button onClick={() => salvar('venda')} disabled={saving} style={BTN}>{saving ? 'Salvando...' : 'Enviar Pedido'}</button>
                <button style={{ ...BTN, background: '#2a6644' }}>$ Informar Pagamento</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ BUSCA ════ */}
        {tab === 'busca' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '8px 12px', gap: 8 }}>
            {/* Top filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 'bold' }}>Busca:</span>
              {[
                { tipo: 'numero' as BuscaTipo, label: 'Número' },
                { tipo: 'data' as BuscaTipo, label: 'Data Emissão' },
                { tipo: 'nome' as BuscaTipo, label: 'Nome' },
                { tipo: 'cpf' as BuscaTipo, label: 'Cpf' },
              ].map(({ tipo, label }) => (
                <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                  <Radio checked={buscaTipo === tipo} onClick={() => setBuscaTipo(tipo)} />
                  {label}
                </label>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 10 }}>
              {/* Left sidebar */}
              <div style={{ flex: '0 0 130px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { lista: 'os' as BuscaLista, label: 'OS' },
                  { lista: 'excluidas' as BuscaLista, label: 'OS EXCLUÍDAS' },
                  { lista: 'clientes' as BuscaLista, label: 'Clientes' },
                ].map(({ lista, label }) => (
                  <button key={lista} onClick={() => setBuscaLista(lista)} style={{
                    background: buscaLista === lista ? '#3a3a38' : '#5a5854',
                    border: '1px solid #2a2a28',
                    padding: '10px 6px', fontSize: 12, fontWeight: 'bold',
                    cursor: 'pointer', color: '#fff', textAlign: 'center',
                  }}>{label}</button>
                ))}
              </div>

              {/* Right */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <input value={busca} onChange={e => setBusca(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && carregarBusca()}
                    placeholder="Informação" style={{ ...INPUT, flex: 1 }} />
                  <button onClick={carregarBusca} style={BTN}>Buscar</button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d1d6' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr style={{ background: '#e9e9ee' }}>
                        {['Núm.','v.','DAV','Data','Nome','Cpf','Status','Tipo','Desc.','Valor Total','Valor Pago'].map(h => (
                          <th key={h} style={{ border: '1px solid #d1d1d6', padding: '4px 6px', fontWeight: 'bold', textAlign: 'left', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {oslist.map((os, i) => (
                        <tr key={os.id} style={{ background: i % 2 === 0 ? '#d8d4cc' : '#ccc9c2', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#b8d4e8')}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#d8d4cc' : '#ccc9c2')}>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px', fontWeight: 'bold', color: '#1144aa' }}>#{os.numero}</td>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }} />
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }} />
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px', whiteSpace: 'nowrap' }}>{new Date(os.created_at).toLocaleDateString('pt-BR')}</td>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }}>{os.cliente_nome ?? '—'}</td>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }} />
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }}>{os.status}</td>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }}>{os.tipo}</td>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }} />
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px', textAlign: 'right' }}>{os.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td style={{ border: '1px solid #bbb', padding: '4px 6px' }} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {oslist.length === 0 && (
                    <div style={{ padding: '24px', color: '#666', fontStyle: 'italic', textAlign: 'center', background: '#d8d4cc' }}>
                      {busca ? 'Nenhuma OS encontrada.' : 'Clique em Buscar para pesquisar.'}
                    </div>
                  )}
                </div>

                {/* Bottom buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <button style={BTN}>Excluir Pedido</button>
                  <button style={BTN}>Editar Pedido</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#e9e9ee', borderTop: '2px solid #888',
        padding: '4px 12px', flexShrink: 0,
      }}>
        {[
          { icon: '≡', label: 'Menu', onClick: () => navigate('/vision') },
          { icon: '⊕', label: 'Extras', onClick: () => {} },
          { icon: '📋', label: 'OS', onClick: () => setTab('cliente') },
          { icon: '$', label: 'Valor', onClick: () => setTab('fechamento') },
          { icon: '⌨', label: 'Calculadora', onClick: () => {} },
        ].map(({ icon, label, onClick }) => (
          <button key={label} onClick={onClick} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '3px 20px', background: 'none', border: 'none',
            cursor: 'pointer', borderRight: '1px solid #d1d1d6',
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, color: '#333', fontWeight: 'bold', letterSpacing: '.04em' }}>{label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>1.0.15</span>
      </div>
    </div>
  );
}
