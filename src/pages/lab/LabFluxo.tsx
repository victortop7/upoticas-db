import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';

interface OrdemFluxo {
  id: string; numero: number; status: string; tipo: string;
  ref_otica: string | null; cont_interno: string | null;
  caixa: string | null; otica_nome: string; vendedor: string | null;
  previsao_entrega: string | null; created_at: string;
  tipo_lente: string | null; marca_material: string | null;
  setor_atual: string | null; setor_desde?: string | null;
}

// ─── Funil (Kanban): etapas por tipo de lente ──────────────────────────────────
type Etapa = { key: string; label: string; icon: string; color: string };
const FLUXOS: Record<'simples' | 'progressiva', Etapa[]> = {
  simples: [
    { key: 'digitacao', label: 'Digitação', icon: '⌨️', color: '#a07500' },
    { key: 'estoque', label: 'Estoque', icon: '📦', color: '#1069c0' },
    { key: 'montagem', label: 'Montagem', icon: '🔧', color: '#7a3fb5' },
    { key: 'pronto', label: 'Pronto', icon: '✅', color: '#0a8a2a' },
    { key: 'entregue', label: 'Entregue', icon: '🚚', color: '#6b7280' },
  ],
  progressiva: [
    { key: 'digitacao', label: 'Digitação', icon: '⌨️', color: '#a07500' },
    { key: 'estoque', label: 'Estoque', icon: '📦', color: '#1069c0' },
    { key: 'surfacagem', label: 'Surfaçagem', icon: '🪚', color: '#c05a1a' },
    { key: 'antirrisco', label: 'Antirrisco', icon: '🛡️', color: '#0e9488' },
    { key: 'antirreflexo', label: 'Antirreflexo', icon: '💠', color: '#2563c7' },
    { key: 'montagem', label: 'Montagem', icon: '🔧', color: '#7a3fb5' },
    { key: 'pronto', label: 'Pronto', icon: '✅', color: '#0a8a2a' },
    { key: 'entregue', label: 'Entregue', icon: '🚚', color: '#6b7280' },
  ],
};
function flowOf(o: OrdemFluxo): 'simples' | 'progressiva' {
  const t = (o.tipo_lente || '').toUpperCase().trim();
  return (t.includes('PROGRESS') || t === '02' || t.startsWith('02 ')) ? 'progressiva' : 'simples';
}
function cardStage(o: OrdemFluxo, etapas: Etapa[]): string {
  if (o.status === 'entregue') return 'entregue';
  if (o.status === 'pronto') return 'pronto';
  const s = o.setor_atual;
  if (s && etapas.some(e => e.key === s)) return s;
  return etapas[0].key; // default: primeira etapa (digitação)
}

interface FluxoRecord {
  id: string; ordem_id: string; setor: string; setor_num: number;
  maquina: string | null; operador: string | null;
  inicio_data: string | null; inicio_hora: string | null;
  termino_data: string | null; termino_hora: string | null;
  tempo_prev: number | null; tempo_real: number | null;
}

const MODO_OPTS = [
  { key: 'consulta', label: 'Funil de Produção', num: 4 },
  { key: 'individual', label: 'Lançar Fluxo/Individual', num: 1 },
];

const STATUS_COLOR: Record<string, string> = {
  aguardando: '#886600', em_producao: R.accent2,
  pronto: R.accent, entregue: R.dim, cancelado: '#cc0000',
};

function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function fmtDt(s: string | null) {
  if (!s) return '—';
  return s.slice(0, 16).replace('T', ' ');
}
function today() { return new Date().toISOString().split('T')[0]; }
function nowTime() { return new Date().toTimeString().slice(0, 5); }

export default function LabFluxo() {
  const [modo, setModo] = useState<'consulta' | 'individual'>('consulta');

  // --- FUNIL (Kanban) ---
  const [ordens, setOrdens] = useState<OrdemFluxo[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(true);
  const [busca, setBusca] = useState('');
  const [fluxoTipo, setFluxoTipo] = useState<'simples' | 'progressiva'>('simples');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // --- INDIVIDUAL ---
  const [buscaOS, setBuscaOS] = useState('');
  const [ordemSel, setOrdemSel] = useState<OrdemFluxo | null>(null);
  const [fluxoRecords, setFluxoRecords] = useState<FluxoRecord[]>([]);
  const [loadingOS, setLoadingOS] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  // Form lançar fluxo
  const [setor, setSetor] = useState('');
  const [setorNum, setSetorNum] = useState(1);
  const [maquina, setMaquina] = useState('');
  const [operador, setOperador] = useState('');
  const [inicioDt, setInicioDt] = useState(today());
  const [inicioHr, setInicioHr] = useState(nowTime());
  const [terminoDt, setTerminoDt] = useState('');
  const [terminoHr, setTerminoHr] = useState('');
  const [tempoPrev, setTempoPrev] = useState('');

  const loadOrdens = useCallback(() => {
    setLoadingOrdens(true);
    api.get<OrdemFluxo[]>(`/lab/fluxo?status=board`)
      .then(setOrdens).catch(() => setOrdens([]))
      .finally(() => setLoadingOrdens(false));
  }, []);

  // move a OS para outra etapa (drag & drop) — otimista + persiste
  async function mover(ordId: string, setor: string) {
    const novoStatus = setor === 'entregue' ? 'entregue' : setor === 'pronto' ? 'pronto' : 'em_producao';
    setOrdens(prev => prev.map(o => o.id === ordId ? { ...o, setor_atual: setor, status: novoStatus, setor_desde: null } : o));
    try { await api.post('/lab/fluxo/mover', { ordem_id: ordId, setor }); } catch { /* ignora */ }
    loadOrdens();
  }

  useEffect(() => { if (modo === 'consulta') loadOrdens(); }, [modo, loadOrdens]);

  async function buscarOS() {
    if (!buscaOS.trim()) return;
    setLoadingOS(true);
    setOrdemSel(null);
    setFluxoRecords([]);
    try {
      const data = await api.get<{ ordem: OrdemFluxo; fluxo: FluxoRecord[] }>(`/lab/fluxo/os?q=${encodeURIComponent(buscaOS)}`);
      setOrdemSel(data.ordem);
      setFluxoRecords(data.fluxo);
    } catch {
      setMsg('OS não encontrada');
    }
    setLoadingOS(false);
  }

  async function lancarFluxo() {
    if (!ordemSel || !setor) return;
    setSalvando(true);
    setMsg('');
    try {
      await api.post('/lab/fluxo', {
        ordem_id: ordemSel.id, setor, setor_num: setorNum,
        maquina: maquina || null, operador: operador || null,
        inicio_data: inicioDt || null, inicio_hora: inicioHr || null,
        termino_data: terminoDt || null, termino_hora: terminoHr || null,
        tempo_prev: tempoPrev ? parseInt(tempoPrev) : null,
      });
      setMsg('Fluxo lançado com sucesso!');
      // reload records
      const data = await api.get<{ ordem: OrdemFluxo; fluxo: FluxoRecord[] }>(`/lab/fluxo/os?q=${encodeURIComponent(buscaOS)}`);
      setFluxoRecords(data.fluxo);
      setOrdemSel(data.ordem);
      // reset form
      setSetor(''); setMaquina(''); setOperador('');
      setTerminoDt(''); setTerminoHr(''); setTempoPrev('');
      setInicioDt(today()); setInicioHr(nowTime());
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Erro ao lançar');
    }
    setSalvando(false);
  }

  async function avancarStatus(ordId: string, novoStatus: string) {
    try {
      await api.patch(`/lab/ordens/${ordId}`, { status: novoStatus });
      loadOrdens();
    } catch {}
  }

  const INP: React.CSSProperties = {
    padding: '6px 9px', fontSize: '12px',
    background: R.inp, border: '1px solid #b0aca4',
    borderRadius:  0, color: R.txt, outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'Courier New', monospace",
  };
  const LBL: React.CSSProperties = { fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' };

  const filtrados = ordens.filter(o =>
    !busca || o.otica_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    String(o.numero).includes(busca) || (o.cont_interno ?? '').includes(busca) ||
    (o.ref_otica ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ===== MENU ESQUERDO ===== */}
      <div style={{ width: '200px', flexShrink: 0, background: R.panel, borderRight: '1px solid #b0aca4', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #b0aca4', fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Controle de Fluxo
        </div>
        {MODO_OPTS.map(m => (
          <div
            key={m.key}
            onClick={() => setModo(m.key as 'consulta' | 'individual')}
            style={{
              padding: '10px 14px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #b0aca4',
              fontWeight: modo === m.key ? '700' : '400',
              color: modo === m.key ? R.txt : R.dim,
              background: modo === m.key ? R.alt : 'transparent',
              display: 'flex', justifyContent: 'space-between',
            }}
          >
            <span>{m.label}</span>
            <span style={{ fontFamily: "'Courier New', monospace", color: R.dim, fontSize: '11px' }}>{m.num}</span>
          </div>
        ))}

        {/* Legenda status */}
        <div style={{ padding: '14px', marginTop: 'auto', borderTop: '1px solid #b0aca4' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Legenda</div>
          {[['aguardando', 'Aguardando'], ['em_producao', 'Em Produção'], ['pronto', 'Pronto']].map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLOR[k], flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: R.dim }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CONTEÚDO ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ============ FUNIL DE PRODUÇÃO (Kanban) ============ */}
        {modo === 'consulta' && (() => {
          const etapas = FLUXOS[fluxoTipo];
          const cards = filtrados.filter(o => flowOf(o) === fluxoTipo);
          return (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #b0aca4', background: R.panel, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: R.txt, marginRight: '4px' }}>Funil de Produção</h2>
              {/* Toggle tipo de fluxo */}
              <div style={{ display: 'flex', border: '1px solid #b0aca4', borderRadius: '8px', overflow: 'hidden' }}>
                {(['simples', 'progressiva'] as const).map(t => (
                  <button key={t} onClick={() => setFluxoTipo(t)}
                    style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: fluxoTipo === t ? R.accent : 'transparent', color: fluxoTipo === t ? '#fff' : R.dim }}>
                    {t === 'simples' ? 'Visão Simples' : 'Progressiva'}
                  </button>
                ))}
              </div>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar OS, ótica, ref..." style={{ ...INP, width: '200px' }} />
              <span style={{ fontSize: '11px', color: R.dim }}>{cards.length} OS · arraste os cards entre as etapas</span>
              <button onClick={loadOrdens} style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '13px', background: R.alt, color: R.dim, border: '1px solid #b0aca4', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>↺</button>
            </div>

            {loadingOrdens ? (
              <div style={{ padding: '60px', textAlign: 'center', color: R.dim, fontSize: '14px' }}>Carregando...</div>
            ) : (
              <div style={{ flex: 1, display: 'flex', gap: '12px', overflowX: 'auto', overflowY: 'hidden', padding: '14px 16px' }}>
                {etapas.map(et => {
                  const col = cards.filter(o => cardStage(o, etapas) === et.key);
                  const isOver = dragOver === et.key;
                  return (
                    <div key={et.key}
                      onDragOver={e => { e.preventDefault(); if (dragOver !== et.key) setDragOver(et.key); }}
                      onDrop={() => { if (dragging) mover(dragging, et.key); setDragging(null); setDragOver(null); }}
                      style={{ width: '224px', flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%',
                        background: isOver ? `${et.color}22` : R.panel, border: `1px solid ${isOver ? et.color : '#b0aca4'}`, borderRadius: '10px', transition: 'background .12s, border-color .12s' }}>
                      {/* topo da coluna */}
                      <div style={{ padding: '9px 12px', borderBottom: `2px solid ${et.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          <span style={{ fontSize: '13px' }}>{et.icon}</span>{et.label}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: col.length ? et.color : R.alt, color: col.length ? '#fff' : R.dim }}>{col.length}</span>
                      </div>
                      {/* cards */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {col.length === 0 ? (
                          <div style={{ padding: '18px 8px', textAlign: 'center', fontSize: '11px', color: R.dim, border: '1px dashed #b0aca4', borderRadius: '7px' }}>
                            {isOver ? 'Soltar aqui' : '—'}
                          </div>
                        ) : col.map(o => (
                          <div key={o.id} draggable
                            onDragStart={() => setDragging(o.id)}
                            onDragEnd={() => { setDragging(null); setDragOver(null); }}
                            style={{ opacity: dragging === o.id ? 0.4 : 1, cursor: 'grab', background: R.alt, border: `1px solid #b0aca4`, borderLeft: `3px solid ${et.color}`, borderRadius: '7px', padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', fontWeight: '700', color: R.txt }}>#{String(o.numero).padStart(4, '0')}</span>
                              <span style={{ fontSize: '9.5px', color: R.dim, fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap' }}>{o.ref_otica || o.cont_interno || ''}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: R.txt, fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{o.otica_nome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: R.dim }}>📅 {fmtDate(o.previsao_entrega)}</span>
                              {o.setor_desde && <span style={{ fontSize: '9.5px', color: R.dim, fontFamily: "'Courier New', monospace" }}>desde {o.setor_desde.slice(11, 16) || o.setor_desde.slice(0, 10)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
          );
        })()}

        {/* ============ LANÇAR FLUXO INDIVIDUAL ============ */}
        {modo === 'individual' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* LEFT: busca + dados OS */}
            <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Busca OS */}
              <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px', padding: '14px' }}>
                <label style={LBL}>Buscar OS (número, ref, cont. interno)</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={buscaOS} onChange={e => setBuscaOS(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarOS()} style={INP} placeholder="Ex: 321 / JOSE / 000324" />
                  <button onClick={buscarOS} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: R.accent, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {loadingOS ? '...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {/* Dados da OS */}
              {ordemSel && (
                <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, marginBottom: '10px' }}>
                    OS #{String(ordemSel.numero).padStart(4, '0')} — {ordemSel.otica_nome}
                  </div>
                  {[
                    ['OS', String(ordemSel.numero).padStart(4, '0')],
                    ['C/Interno', ordemSel.cont_interno ?? '—'],
                    ['Ref.', ordemSel.ref_otica ?? '—'],
                    ['Caixa', ordemSel.caixa ?? '—'],
                    ['Entrada', fmtDt(ordemSel.created_at)],
                    ['Previsão', fmtDate(ordemSel.previsao_entrega)],
                    ['Lente', ordemSel.tipo_lente ?? '—'],
                    ['Marca', ordemSel.marca_material ?? '—'],
                    ['Operador', ordemSel.vendedor ?? '—'],
                    ['Status', ordemSel.status.replace('_', ' ')],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '10px', color: R.dim, fontWeight: '600', textTransform: 'uppercase' }}>{l}</span>
                      <span style={{ fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.txt }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Histórico de fluxo */}
              {fluxoRecords.length > 0 && (
                <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, marginBottom: '10px' }}>Histórico de Setores</div>
                  {fluxoRecords.map(f => (
                    <div key={f.id} style={{ padding: '7px 0', borderBottom: '1px solid #b0aca4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: R.txt }}>{f.setor}</div>
                        <div style={{ fontSize: '10px', color: R.dim }}>{f.operador ?? '—'} · {f.maquina ?? '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', fontFamily: "'Courier New', monospace", color: R.dim }}>{f.inicio_hora} {fmtDate(f.inicio_data)}</div>
                        {f.termino_hora && <div style={{ fontSize: '10px', fontFamily: "'Courier New', monospace", color: R.accent }}>→ {f.termino_hora} {fmtDate(f.termino_data)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Formulário lançar fluxo */}
            <div style={{ flex: 1 }}>
              {!ordemSel ? (
                <div style={{ padding: '60px', textAlign: 'center', color: R.dim, fontSize: '13px' }}>
                  Busque uma OS pelo número, referência ou controle interno
                </div>
              ) : (
                <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: R.txt, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Lançar Entrada/Saída de Setor
                  </div>

                  {msg && (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', fontWeight: '600', background: msg.includes('sucesso') ? 'rgba(0,102,0,0.15)' : 'rgba(200,0,0,0.12)', color: msg.includes('sucesso') ? R.accent : '#cc0000', border: `1px solid ${msg.includes('sucesso') ? R.accent : '#cc0000'}` }}>
                      {msg}
                    </div>
                  )}

                  {/* Grid principal */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={LBL}>Setor *</label>
                      <input value={setor} onChange={e => setSetor(e.target.value)} style={INP} placeholder="Ex: SURFAÇAGEM, MONTAGEM, EXPEDIÇÃO..." />
                    </div>
                    <div>
                      <label style={LBL}>Nº Setor</label>
                      <input type="number" value={setorNum} onChange={e => setSetorNum(parseInt(e.target.value) || 1)} style={INP} min={1} max={9} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={LBL}>Máquina</label>
                      <input value={maquina} onChange={e => setMaquina(e.target.value)} style={INP} />
                    </div>
                    <div>
                      <label style={LBL}>Operador</label>
                      <input value={operador} onChange={e => setOperador(e.target.value)} style={INP} />
                    </div>
                  </div>

                  {/* Início */}
                  <div style={{ fontSize: '11px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', marginTop: '4px' }}>Início</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div><label style={LBL}>Data</label><input type="date" value={inicioDt} onChange={e => setInicioDt(e.target.value)} style={INP} /></div>
                    <div><label style={LBL}>Hora</label><input type="time" value={inicioHr} onChange={e => setInicioHr(e.target.value)} style={INP} /></div>
                    <div><label style={LBL}>Tempo Prev. (min)</label><input type="number" value={tempoPrev} onChange={e => setTempoPrev(e.target.value)} style={INP} placeholder="0" /></div>
                  </div>

                  {/* Término */}
                  <div style={{ fontSize: '11px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Término (opcional)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div><label style={LBL}>Data</label><input type="date" value={terminoDt} onChange={e => setTerminoDt(e.target.value)} style={INP} /></div>
                    <div><label style={LBL}>Hora</label><input type="time" value={terminoHr} onChange={e => setTerminoHr(e.target.value)} style={INP} /></div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => avancarStatus(ordemSel.id, ordemSel.status === 'aguardando' ? 'em_producao' : ordemSel.status === 'em_producao' ? 'pronto' : 'entregue')}
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', background: R.alt, color: R.dim, border: '1px solid #b0aca4', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Avançar Status
                    </button>
                    <button
                      onClick={lancarFluxo}
                      disabled={!setor || salvando}
                      style={{ padding: '8px 22px', fontSize: '12px', fontWeight: '600', background: salvando ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '7px', cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {salvando ? 'Salvando...' : 'Lançar Fluxo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
