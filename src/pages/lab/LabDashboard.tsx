import { useNavigate } from 'react-router-dom';
import { R } from '../../lib/labTheme';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { FLUXOS, flowOf, cardStage } from '../../lib/labFluxo';
import LabIcon, { type IconName } from '../../components/LabIcon';

interface OrdemRef { numero?: number; otica_nome?: string | null; created_at?: string; data?: string }
interface Prazo {
  id: string; numero: number; previsao_entrega: string; status: string;
  setor_atual: string | null; otica_nome: string | null; tipo_lente: string | null;
}
interface Dash {
  total: number; entregues: number; emProducao: number; aguardando: number; pronto: number;
  abertasHoje: number; entreguesHoje: number;
  faturamento: number; faturamentoEntregue: number; faturamentoAberto: number; ticketMedio: number;
  ultimoCliente: OrdemRef | null; ultimaEntrega: OrdemRef | null;
  lentes: { simples: number; progressiva: number; semTipo: number };
  serie: { dia: string; qtd: number; rotulo: string }[];
  prazos: { atrasados: Prazo[]; hoje: Prazo[]; amanha: Prazo[] };
  periodo?: { de: string | null; ate: string | null; agrupamento: 'dia' | 'mes' };
}

function brl(v: number) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// atalhos de período (retornam de/ate em AAAA-MM-DD, no fuso de SP)
function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function hojeSP() { const d = new Date(); d.setHours(d.getHours() - 3); return d; }
const PERIODOS: { key: string; label: string; calc: () => { de: string | null; ate: string | null } }[] = [
  { key: 'hoje',    label: 'Hoje',        calc: () => { const h = hojeSP(); return { de: ymd(h), ate: ymd(h) }; } },
  { key: '7d',      label: '7 dias',      calc: () => { const a = hojeSP(); const d = new Date(a); d.setDate(d.getDate() - 6); return { de: ymd(d), ate: ymd(a) }; } },
  { key: '30d',     label: '30 dias',     calc: () => { const a = hojeSP(); const d = new Date(a); d.setDate(d.getDate() - 29); return { de: ymd(d), ate: ymd(a) }; } },
  { key: 'mes',     label: 'Este mês',    calc: () => { const a = hojeSP(); const d = new Date(a); d.setDate(1); return { de: ymd(d), ate: ymd(a) }; } },
  { key: 'mespass', label: 'Mês passado', calc: () => {
      const a = hojeSP();
      const ini = new Date(a.getFullYear(), a.getMonth() - 1, 1);
      const fim = new Date(a.getFullYear(), a.getMonth(), 0);
      return { de: ymd(ini), ate: ymd(fim) };
    } },
  { key: 'tudo',    label: 'Tudo',        calc: () => ({ de: null, ate: null }) },
];

const VAZIO: Dash = {
  total: 0, entregues: 0, emProducao: 0, aguardando: 0, pronto: 0,
  abertasHoje: 0, entreguesHoje: 0,
  faturamento: 0, faturamentoEntregue: 0, faturamentoAberto: 0, ticketMedio: 0,
  ultimoCliente: null, ultimaEntrega: null,
  lentes: { simples: 0, progressiva: 0, semTipo: 0 }, serie: [],
  prazos: { atrasados: [], hoje: [], amanha: [] },
};

function fmtDataHora(s?: string | null) {
  if (!s) return '—';
  const iso = s.replace(' ', 'T');
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  if (isNaN(d.getTime())) return s.slice(0, 16).replace('T', ' ');
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export default function LabDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');
  const [d, setD] = useState<Dash>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [sel, setSel] = useState<Prazo | null>(null);   // OS aberta no painel de ação
  const [novaData, setNovaData] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [periodo, setPeriodo] = useState('30d');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  // intervalo efetivo: 'custom' usa os campos; senão usa o atalho escolhido
  const range = periodo === 'custom'
    ? { de: de || null, ate: ate || null }
    : (PERIODOS.find(p => p.key === periodo) ?? PERIODOS[2]).calc();

  const carregar = useCallback(() => {
    const qs = new URLSearchParams();
    if (range.de) qs.set('de', range.de);
    if (range.ate) qs.set('ate', range.ate);
    const q = qs.toString();
    return api.get<Dash>(`/lab/dashboard${q ? `?${q}` : ''}`)
      .then(r => setD({ ...VAZIO, ...r }))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [range.de, range.ate]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrir(p: Prazo) { setSel(p); setNovaData(p.previsao_entrega?.slice(0, 10) ?? ''); }

  // move a OS de etapa (mesma esteira do funil)
  async function moverEtapa(setorKey: string) {
    if (!sel) return;
    setSalvando(true);
    try { await api.post('/lab/fluxo/mover', { ordem_id: sel.id, setor: setorKey }); } catch {}
    const novoStatus = setorKey === 'entregue' ? 'entregue' : setorKey === 'pronto' ? 'pronto' : 'em_producao';
    setSel({ ...sel, setor_atual: setorKey, status: novoStatus });
    await carregar();
    setSalvando(false);
  }

  // salva a nova data de entrega
  async function salvarData() {
    if (!sel || !novaData) return;
    setSalvando(true);
    try {
      await api.patch(`/lab/ordens/${sel.id}`, { previsao_entrega: novaData });
      setSel({ ...sel, previsao_entrega: novaData });
      await carregar();
    } catch {}
    setSalvando(false);
  }

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  function toggleDark() {
    localStorage.setItem('lab_dark', dark ? '0' : '1');
    window.dispatchEvent(new Event('labtheme'));
  }

  const card: React.CSSProperties = {
    background: R.panelGrad, border: '1px solid var(--lab-bdr)',
    borderRadius: '10px', padding: '14px 16px', boxShadow: R.sh,
  };
  const rotulo: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, color: R.dim,
    textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px',
  };

  const maxSerie = Math.max(1, ...d.serie.map(s => s.qtd));
  const totalLentes = d.lentes.simples + d.lentes.progressiva;
  const pctProg = totalLentes ? (d.lentes.progressiva / totalLentes) * 100 : 0;

  // rosca visão simples x progressiva
  const raio = 54, esp = 16, circ = 2 * Math.PI * raio;
  const dashProg = (pctProg / 100) * circ;

  const etapas = [
    { k: 'Aguardando',  v: d.aguardando,  c: '#a07500' },
    { k: 'Em Produção', v: d.emProducao,  c: '#1069c0' },
    { k: 'Pronto',      v: d.pronto,      c: '#0a8a2a' },
    { k: 'Entregue',    v: d.entregues,   c: '#6b7280' },
  ];
  const maxEtapa = Math.max(1, ...etapas.map(e => e.v));

  return (
    <div style={{ minHeight: '100%', background: R.bg, padding: '20px 24px', fontFamily: "'Montserrat', sans-serif" }}>

      {/* cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: R.txt, letterSpacing: '0.3px' }}>Painel do Laboratório</h1>
          <div style={{ fontSize: '12px', color: R.dim, marginTop: '2px' }}>{tenant?.nome}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/lab/ordens/nova')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, background: R.accent, color: R.onAccent, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: R.shSm }}>
            <LabIcon name="plus" size={15} /> Nova OS
          </button>
          <button onClick={toggleDark}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, background: R.alt, color: R.txt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <LabIcon name={dark ? 'sun' : 'moon'} size={15} /> {dark ? 'Claro' : 'Noturno'}
          </button>
        </div>
      </div>

      {/* filtro de período */}
      <div style={{ ...card, padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ ...rotulo, marginBottom: 0, marginRight: '2px' }}>Período</span>
        {PERIODOS.map(p => {
          const ativo = periodo === p.key;
          return (
            <button key={p.key} onClick={() => setPeriodo(p.key)}
              style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
                background: ativo ? R.accent : 'transparent', color: ativo ? R.onAccent : R.dim,
                border: `1px solid ${ativo ? R.accent : 'var(--lab-bdr)'}` }}>
              {p.label}
            </button>
          );
        })}
        <button onClick={() => setPeriodo('custom')}
          style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
            background: periodo === 'custom' ? R.accent : 'transparent', color: periodo === 'custom' ? R.onAccent : R.dim,
            border: `1px solid ${periodo === 'custom' ? R.accent : 'var(--lab-bdr)'}` }}>
          Personalizado
        </button>
        {periodo === 'custom' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
            <input type="date" value={de} onChange={e => setDe(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '12px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius: '7px', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace" }} />
            <span style={{ fontSize: '11px', color: R.dim }}>até</span>
            <input type="date" value={ate} onChange={e => setAte(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '12px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius: '7px', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace" }} />
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: R.dim, fontFamily: "'Courier New', monospace" }}>
          {range.de || range.ate
            ? `${range.de ? range.de.split('-').reverse().join('/') : '…'} — ${range.ate ? range.ate.split('-').reverse().join('/') : '…'}`
            : 'todo o histórico'}
        </span>
      </div>

      {carregando ? (
        <div style={{ ...card, textAlign: 'center', color: R.dim, fontSize: '13px' }}>Carregando métricas...</div>
      ) : (
      <>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div style={card}>
            <div style={rotulo}>Clientes atendidos</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{d.total}</div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px' }}>
              OS {range.de || range.ate ? 'no período' : 'no total'} (sem canceladas)
            </div>
          </div>
          <div style={card}>
            <div style={rotulo}>Atendidos hoje</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: R.accent, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{d.abertasHoje}</div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px' }}>{d.entreguesHoje} entregue(s) hoje</div>
          </div>
          <div style={{ ...card, gridColumn: 'span 2', minWidth: '260px', borderTop: `3px solid ${R.accent}` }}>
            <div style={rotulo}>Faturamento {range.de || range.ate ? 'do período' : 'total'}</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{brl(d.faturamento)}</div>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: R.dim }}>
                Faturado (entregue): <b style={{ color: R.accent, fontFamily: "'Courier New', monospace" }}>{brl(d.faturamentoEntregue)}</b>
              </span>
              <span style={{ fontSize: '11px', color: R.dim }}>
                A receber: <b style={{ color: '#a07500', fontFamily: "'Courier New', monospace" }}>{brl(d.faturamentoAberto)}</b>
              </span>
              <span style={{ fontSize: '11px', color: R.dim }}>
                Ticket médio: <b style={{ color: R.txt, fontFamily: "'Courier New', monospace" }}>{brl(d.ticketMedio)}</b>
              </span>
            </div>
          </div>
          <div style={card}>
            <div style={rotulo}>Último cliente</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: R.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.ultimoCliente?.otica_nome ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px', fontFamily: "'Courier New', monospace" }}>
              {d.ultimoCliente ? `OS #${String(d.ultimoCliente.numero).padStart(4, '0')} · ${fmtDataHora(d.ultimoCliente.created_at)}` : 'Nenhuma OS'}
            </div>
          </div>
          <div style={card}>
            <div style={rotulo}>Última entrega</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: R.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.ultimaEntrega?.otica_nome ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px', fontFamily: "'Courier New', monospace" }}>
              {d.ultimaEntrega ? `OS #${String(d.ultimaEntrega.numero).padStart(4, '0')} · ${fmtDataHora(d.ultimaEntrega.data)}` : 'Nenhuma entrega'}
            </div>
          </div>
        </div>

        {/* gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '12px', marginBottom: '12px' }}>

          {/* OS por dia — barras */}
          <div style={card}>
            <div style={rotulo}>
              Atendimentos {range.de || range.ate ? 'no período' : 'nos últimos 14 dias'}
              {d.periodo?.agrupamento === 'mes' && ' (por mês)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '150px', marginTop: '10px' }}>
              {d.serie.map(s => (
                <div key={s.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }} title={`${s.rotulo} — ${s.qtd} OS`}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%', height: `${(s.qtd / maxSerie) * 100}%`, minHeight: s.qtd > 0 ? '3px' : '0',
                      background: `linear-gradient(180deg, ${R.accent}, ${R.accent2})`,
                      borderRadius: '4px 4px 0 0', boxShadow: R.shSm, transition: 'height .3s',
                    }} />
                  </div>
                  <span style={{ fontSize: '9px', color: R.dim, fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap' }}>{s.rotulo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* visão simples x progressiva — rosca */}
          <div style={card}>
            <div style={rotulo}>Tipo de lente</div>
            {totalLentes === 0 ? (
              <div style={{ fontSize: '12px', color: R.dim, padding: '30px 0', textAlign: 'center' }}>Sem lentes registradas</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
                  <circle cx="65" cy="65" r={raio} fill="none" stroke={R.accent} strokeWidth={esp} opacity="0.85" />
                  <circle cx="65" cy="65" r={raio} fill="none" stroke={R.accent2} strokeWidth={esp}
                    strokeDasharray={`${dashProg} ${circ - dashProg}`} transform="rotate(-90 65 65)" />
                  <text x="65" y="61" textAnchor="middle" fontSize="21" fontWeight="800" fill={R.txt} fontFamily="'Courier New', monospace">{totalLentes}</text>
                  <text x="65" y="78" textAnchor="middle" fontSize="9" fill={R.dim} letterSpacing="1">LENTES</text>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {[
                    { nome: 'Visão Simples', v: d.lentes.simples,     c: R.accent },
                    { nome: 'Progressiva',   v: d.lentes.progressiva, c: R.accent2 },
                  ].map(i => (
                    <div key={i.nome} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: i.c, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', color: R.dim, fontWeight: 600 }}>{i.nome}</span>
                      </div>
                      <div style={{ fontSize: '19px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace" }}>
                        {i.v}
                        <span style={{ fontSize: '11px', color: R.dim, fontWeight: 600, marginLeft: '5px' }}>
                          {totalLentes ? Math.round((i.v / totalLentes) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {d.lentes.semTipo > 0 && (
                    <div style={{ fontSize: '10px', color: R.dim }}>{d.lentes.semTipo} sem tipo informado</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* prazos de entrega */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {[
            { titulo: 'Atrasados',        itens: d.prazos.atrasados, cor: '#cc0000', icone: 'alert' as IconName },
            { titulo: 'Entrega hoje',     itens: d.prazos.hoje,      cor: '#a07500', icone: 'calendar' as IconName },
            { titulo: 'Entrega amanhã',   itens: d.prazos.amanha,    cor: '#1069c0', icone: 'hourglass' as IconName },
          ].map(g => (
            <div key={g.titulo} style={{ ...card, borderTop: `3px solid ${g.cor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ ...rotulo, marginBottom: 0, color: g.cor, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><LabIcon name={g.icone} size={14} /> {g.titulo}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: g.itens.length ? g.cor : R.dim, fontFamily: "'Courier New', monospace" }}>{g.itens.length}</span>
              </div>
              {g.itens.length === 0 ? (
                <div style={{ fontSize: '11px', color: R.dim, padding: '10px 0' }}>Nenhum pedido</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '210px', overflowY: 'auto' }}>
                  {g.itens.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 9px', background: R.alt, border: '1px solid var(--lab-bdr)', borderLeft: `3px solid ${g.cor}`, borderRadius: '6px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: R.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontFamily: "'Courier New', monospace" }}>#{String(p.numero).padStart(4, '0')}</span> · {p.otica_nome ?? '—'}
                        </div>
                        <div style={{ fontSize: '10px', color: R.dim, fontFamily: "'Courier New', monospace", marginTop: '2px' }}>
                          {p.previsao_entrega?.slice(0, 10).split('-').reverse().join('/')} · {(p.setor_atual ?? p.status).replace('_', ' ')}
                        </div>
                      </div>
                      <button onClick={() => abrir(p)}
                        style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, background: g.cor, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Abrir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* situação da produção */}
        <div style={card}>
          <div style={rotulo}>Situação da produção</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '8px' }}>
            {etapas.map(e => (
              <div key={e.k} onClick={() => navigate('/lab/fluxo')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ width: '96px', fontSize: '11px', color: R.dim, fontWeight: 600, flexShrink: 0 }}>{e.k}</span>
                <div style={{ flex: 1, height: '18px', background: R.alt, borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--lab-bdr)' }}>
                  <div style={{ width: `${(e.v / maxEtapa) * 100}%`, height: '100%', background: e.c, borderRadius: '4px', transition: 'width .3s' }} />
                </div>
                <span style={{ width: '38px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace", flexShrink: 0 }}>{e.v}</span>
              </div>
            ))}
          </div>
        </div>
      </>
      )}

      {/* painel de ação da OS — mover etapa e alterar data de entrega */}
      {sel && (() => {
        const etapas = FLUXOS[flowOf(sel)];
        const atual = cardStage(sel, etapas);
        return (
          <div onClick={() => setSel(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: '520px', maxWidth: '100%', background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '12px', boxShadow: R.shLg, overflow: 'hidden' }}>

              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lab-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: '17px', fontWeight: 800, color: R.txt }}>
                    OS #{String(sel.numero).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '12px', color: R.dim, marginTop: '2px' }}>{sel.otica_nome ?? '—'}</div>
                </div>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: R.dim, fontSize: '21px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* mover etapa */}
                <div>
                  <div style={{ ...rotulo, marginBottom: '7px' }}>
                    Mover para etapa — {flowOf(sel) === 'progressiva' ? 'Progressiva' : 'Visão Simples'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {etapas.map(et => {
                      const ativo = atual === et.key;
                      return (
                        <button key={et.key} disabled={ativo || salvando} onClick={() => moverEtapa(et.key)}
                          style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '20px', cursor: ativo ? 'default' : 'pointer', fontFamily: 'inherit',
                            display: 'inline-flex', alignItems: 'center', gap: '5px', opacity: salvando ? 0.6 : 1,
                            background: ativo ? et.color : 'transparent', color: ativo ? '#fff' : R.dim,
                            border: `1px solid ${ativo ? et.color : 'var(--lab-bdr)'}` }}>
                          <LabIcon name={et.icon} size={14} />{et.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* data de entrega */}
                <div>
                  <div style={{ ...rotulo, marginBottom: '7px' }}>Data de entrega</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)}
                      style={{ flex: 1, padding: '8px 10px', fontSize: '13px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius: '8px', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace" }} />
                    <button onClick={salvarData} disabled={salvando || !novaData || novaData === sel.previsao_entrega?.slice(0, 10)}
                      style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 700, background: R.accent, color: R.onAccent, border: 'none', borderRadius: '8px', cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (salvando || !novaData || novaData === sel.previsao_entrega?.slice(0, 10)) ? 0.5 : 1 }}>
                      {salvando ? '...' : 'Salvar'}
                    </button>
                  </div>
                </div>

                <a href={`/lab/ordens/${sel.id}`} style={{ fontSize: '12px', color: R.accent2, textDecoration: 'none', textAlign: 'center' }}>Abrir OS completa →</a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
