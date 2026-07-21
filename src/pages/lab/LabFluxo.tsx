import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';
import { FLUXOS, flowOf, cardStage } from '../../lib/labFluxo';

interface OrdemFluxo {
  id: string; numero: number; status: string; tipo: string;
  ref_otica: string | null; cont_interno: string | null;
  caixa: string | null; otica_nome: string; vendedor: string | null;
  previsao_entrega: string | null; created_at: string;
  tipo_lente: string | null; marca_material: string | null;
  setor_atual: string | null; setor_desde?: string | null;
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

  // --- DETALHE (drawer ao clicar no card) ---
  const [detOrd, setDetOrd] = useState<OrdemFluxo | null>(null);
  const [detData, setDetData] = useState<any>(null);
  const [detHist, setDetHist] = useState<FluxoRecord[]>([]);
  const [detLoading, setDetLoading] = useState(false);

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

  // abre o drawer com detalhes + histórico do fluxo da OS
  async function abrirDetalhe(o: OrdemFluxo) {
    setDetOrd(o);
    setDetData(null);
    setDetHist([]);
    setDetLoading(true);
    try {
      const [det, flx] = await Promise.all([
        api.get<any>(`/lab/ordens/${o.id}`).catch(() => null),
        api.get<{ ordem: OrdemFluxo; fluxo: FluxoRecord[] }>(`/lab/fluxo/os?q=${encodeURIComponent(String(o.numero))}`).catch(() => null),
      ]);
      setDetData(det);
      setDetHist(flx?.fluxo ?? []);
    } catch { /* ignora */ }
    setDetLoading(false);
  }
  function fecharDetalhe() { setDetOrd(null); setDetData(null); setDetHist([]); }

  // move a OS pela esteira a partir do drawer (registra entrada/saída) + atualiza histórico
  async function moverDetalhe(setorKey: string) {
    if (!detOrd) return;
    const novoStatus = setorKey === 'entregue' ? 'entregue' : setorKey === 'pronto' ? 'pronto' : 'em_producao';
    setDetOrd({ ...detOrd, setor_atual: setorKey, status: novoStatus });
    setOrdens(prev => prev.map(o => o.id === detOrd.id ? { ...o, setor_atual: setorKey, status: novoStatus, setor_desde: null } : o));
    try { await api.post('/lab/fluxo/mover', { ordem_id: detOrd.id, setor: setorKey }); } catch {}
    try {
      const flx = await api.get<{ fluxo: FluxoRecord[] }>(`/lab/fluxo/os?q=${encodeURIComponent(String(detOrd.numero))}`);
      setDetHist(flx?.fluxo ?? []);
    } catch {}
    loadOrdens();
  }

  // cancela a OS pelo drawer
  async function cancelarDetalhe() {
    if (!detOrd) return;
    setDetOrd({ ...detOrd, status: 'cancelado' });
    try { await api.patch(`/lab/ordens/${detOrd.id}`, { status: 'cancelado' }); } catch {}
    loadOrdens();
  }

  const INP: React.CSSProperties = {
    padding: '6px 9px', fontSize: '12px',
    background: R.inp, border: '1px solid var(--lab-bdr)',
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
      <div style={{ width: '200px', flexShrink: 0, background: R.panel, borderRight: '1px solid var(--lab-bdr)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lab-bdr)', fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Controle de Fluxo
        </div>
        {MODO_OPTS.map(m => (
          <div
            key={m.key}
            onClick={() => setModo(m.key as 'consulta' | 'individual')}
            style={{
              padding: '10px 14px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid var(--lab-bdr)',
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
        <div style={{ padding: '14px', marginTop: 'auto', borderTop: '1px solid var(--lab-bdr)' }}>
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
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--lab-bdr)', background: R.panel, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: R.txt, marginRight: '4px' }}>Funil de Produção</h2>
              {/* Toggle tipo de fluxo */}
              <div style={{ display: 'flex', border: '1px solid var(--lab-bdr)', borderRadius: '8px', overflow: 'hidden' }}>
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
              <button onClick={loadOrdens} style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '13px', background: R.alt, color: R.dim, border: '1px solid var(--lab-bdr)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>↺</button>
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
                        background: isOver ? `${et.color}22` : R.panelGrad, border: `1px solid ${isOver ? et.color : 'var(--lab-bdr)'}`, borderRadius: '10px',
                        boxShadow: isOver ? `${R.shLg}, 0 0 0 1px ${et.color}66` : `${R.sh}, ${R.inset}`,
                        transform: isOver ? 'translateY(-2px)' : 'none',
                        transition: 'background .15s, border-color .15s, box-shadow .15s, transform .15s' }}>
                      {/* topo da coluna */}
                      <div style={{ padding: '9px 12px', borderBottom: `2px solid ${et.color}`, boxShadow: `0 1px 8px ${et.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          <span style={{ fontSize: '13px' }}>{et.icon}</span>{et.label}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: col.length ? et.color : R.alt, color: col.length ? '#fff' : R.dim }}>{col.length}</span>
                      </div>
                      {/* cards */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {col.length === 0 ? (
                          <div style={{ padding: '18px 8px', textAlign: 'center', fontSize: '11px', color: R.dim, border: '1px dashed var(--lab-bdr)', borderRadius: '7px' }}>
                            {isOver ? 'Soltar aqui' : '—'}
                          </div>
                        ) : col.map(o => (
                          <div key={o.id} draggable
                            onDragStart={() => setDragging(o.id)}
                            onDragEnd={() => { setDragging(null); setDragOver(null); }}
                            onClick={() => abrirDetalhe(o)}
                            title="Clique para ver detalhes"
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `${R.sh}, 0 0 0 1px ${et.color}55`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = R.shSm; }}
                            style={{ opacity: dragging === o.id ? 0.4 : 1, cursor: 'pointer', background: R.alt, border: `1px solid var(--lab-bdr)`, borderLeft: `3px solid ${et.color}`, borderRadius: '7px', padding: '8px 10px',
                              boxShadow: R.shSm, transition: 'transform .12s, box-shadow .12s' }}>
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
              <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '14px' }}>
                <label style={LBL}>Buscar OS (número, ref, cont. interno)</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={buscaOS} onChange={e => setBuscaOS(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarOS()} style={INP} placeholder="Ex: 321 / JOSE / 000324" />
                  <button onClick={buscarOS} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', background: R.accent, color: 'var(--lab-on-accent)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {loadingOS ? '...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {/* Dados da OS */}
              {ordemSel && (
                <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '14px' }}>
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
                <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, marginBottom: '10px' }}>Histórico de Setores</div>
                  {fluxoRecords.map(f => (
                    <div key={f.id} style={{ padding: '7px 0', borderBottom: '1px solid var(--lab-bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '18px' }}>
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
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', background: R.alt, color: R.dim, border: '1px solid var(--lab-bdr)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
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

      {/* ============ DRAWER DE DETALHES DA OS ============ */}
      {detOrd && (() => {
        const ord = detData?.ordem ?? detOrd;
        const rec = detData?.receita ?? [];
        const arm = detData?.armacao;
        const svc = detData?.servicos ?? [];
        const od = rec.find((r: any) => r.olho === 'D');
        const oe = rec.find((r: any) => r.olho === 'E');
        const STS = [
          { v: 'aguardando', l: 'Aguardando', c: '#886600' },
          { v: 'em_producao', l: 'Em Produção', c: R.accent2 },
          { v: 'pronto', l: 'Pronto', c: R.accent },
          { v: 'entregue', l: 'Entregue', c: R.dim },
          { v: 'cancelado', l: 'Cancelado', c: '#cc0000' },
        ];
        const stAtual = STS.find(s => s.v === ord.status);
        const etapasDet = FLUXOS[flowOf(ord)];
        const etapaAtual = cardStage(ord, etapasDet);
        const fmtNum = (v: any) => (v == null || isNaN(Number(v))) ? '—' : (Number(v) >= 0 ? '+' : '') + Number(v).toFixed(2).replace('.', ',');
        const Row = ({ k, v }: { k: string; v: any }) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '1.5px 0' }}>
            <span style={{ fontSize: '11px', color: R.dim, fontWeight: '600' }}>{k}</span>
            <span style={{ fontSize: '12px', color: R.txt, fontFamily: "'Courier New', monospace", textAlign: 'right' }}>{v ?? '—'}</span>
          </div>
        );
        return (
          <div onClick={fecharDetalhe} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '520px', maxWidth: '94vw', height: '100%', background: R.panel, borderLeft: '1px solid var(--lab-bdr)', display: 'flex', flexDirection: 'column', boxShadow: R.shLg }}>
              {/* header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lab-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: '18px', fontWeight: '700', color: R.txt }}>OS #{String(ord.numero).padStart(4, '0')}</span>
                    {stAtual && <span style={{ fontSize: '11px', fontWeight: '600', color: stAtual.c, background: `${stAtual.c}20`, padding: '2px 9px', borderRadius: '20px' }}>{stAtual.l}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: R.dim, marginTop: '2px', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ord.otica_nome}</div>
                </div>
                <button onClick={fecharDetalhe} style={{ background: 'none', border: 'none', color: R.dim, fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {/* mover pela esteira — etapas do funil */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mover para Etapa — {flowOf(ord) === 'progressiva' ? 'Progressiva' : 'Visão Simples'}</span>
                    {ord.status !== 'cancelado'
                      ? <button onClick={cancelarDetalhe} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: '10.5px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar OS</button>
                      : <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#cc0000' }}>CANCELADA</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {etapasDet.map(et => {
                      const ativo = etapaAtual === et.key && ord.status !== 'cancelado';
                      return (
                        <button key={et.key} disabled={ativo} onClick={() => moverDetalhe(et.key)}
                          style={{ padding: '5px 11px', fontSize: '11px', fontWeight: '600', borderRadius: '20px', cursor: ativo ? 'default' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: ativo ? et.color : 'transparent', color: ativo ? '#fff' : R.dim, border: `1px solid ${ativo ? et.color : 'var(--lab-bdr)'}` }}>
                          <span style={{ fontSize: '11px' }}>{et.icon}</span>{et.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* histórico do fluxo — o que foi feito */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Histórico do Fluxo — o que foi feito</div>
                  {detLoading ? (
                    <div style={{ fontSize: '12px', color: R.dim, padding: '8px 0' }}>Carregando...</div>
                  ) : detHist.length === 0 ? (
                    <div style={{ fontSize: '12px', color: R.dim, padding: '10px 12px', border: '1px dashed var(--lab-bdr)', borderRadius: '8px' }}>Nenhuma etapa registrada ainda.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {detHist.map((f, i) => {
                        const aberto = !f.termino_data;
                        return (
                          <div key={f.id ?? i} style={{ display: 'flex', gap: '10px', padding: '8px 10px', background: R.alt, border: `1px solid ${aberto ? R.accent : 'var(--lab-bdr)'}`, borderLeft: `3px solid ${aberto ? R.accent : R.dim}`, borderRadius: '7px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: R.txt, textTransform: 'capitalize' }}>{String(f.setor).replace('_', ' ')}</span>
                                {aberto && <span style={{ fontSize: '9px', fontWeight: '700', color: R.accent, background: `${R.accent}20`, padding: '1px 6px', borderRadius: '10px' }}>EM ANDAMENTO</span>}
                              </div>
                              <div style={{ fontSize: '10.5px', color: R.dim, fontFamily: "'Courier New', monospace", marginTop: '3px' }}>
                                Entrada: {fmtDate(f.inicio_data)} {f.inicio_hora ?? ''}
                                {f.termino_data && <> · Saída: {fmtDate(f.termino_data)} {f.termino_hora ?? ''}</>}
                              </div>
                              {(f.operador || f.maquina) && (
                                <div style={{ fontSize: '10.5px', color: R.dim, marginTop: '2px' }}>
                                  {f.operador && <>👤 {f.operador}</>}{f.operador && f.maquina && ' · '}{f.maquina && <>🖥️ {f.maquina}</>}
                                </div>
                              )}
                            </div>
                            {f.tempo_real != null && (
                              <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap' }}>{f.tempo_real} min</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* informações + armação */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: R.alt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Informações</div>
                    <Row k="Ref. Ótica" v={ord.ref_otica} />
                    <Row k="Cont. Int." v={ord.cont_interno} />
                    <Row k="Caixa" v={ord.caixa} />
                    <Row k="Operador" v={ord.vendedor} />
                    <Row k="Médico" v={ord.medico} />
                    <Row k="Previsão" v={fmtDate(ord.previsao_entrega)} />
                    <Row k="Tipo Lente" v={arm?.tipo_lente ?? ord.tipo_lente} />
                  </div>
                  <div style={{ background: R.alt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Armação</div>
                    {arm ? (<>
                      <Row k="Tipo" v={arm.tipo_material ?? arm.material} />
                      <Row k="Shape" v={arm.shape} />
                      <Row k="Marca" v={arm.marca_material} />
                      <Row k="Ponte" v={arm.ponte ? `${arm.ponte} mm` : null} />
                      <Row k="Diâmetro" v={arm.diametro_final ? `${arm.diametro_final} mm` : null} />
                      <Row k="Estojo" v={arm.estojo ? 'Sim' : 'Não'} />
                    </>) : <div style={{ fontSize: '11px', color: R.dim }}>Sem dados</div>}
                  </div>
                </div>

                {/* receita */}
                {(od || oe) && (
                  <div style={{ background: R.alt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--lab-bdr)', fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receita das Lentes</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--lab-bdr)', background: R.panel }}>
                          <th style={{ width: '38%' }}></th>
                          <th style={{ padding: '4px', fontSize: '10px', color: R.dim, fontWeight: '700' }}>OD</th>
                          <th style={{ padding: '4px', fontSize: '10px', color: R.dim, fontWeight: '700' }}>OE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['ESF Longe', fmtNum(od?.esf_longe), fmtNum(oe?.esf_longe)],
                          ['CIL Longe', fmtNum(od?.cil_longe), fmtNum(oe?.cil_longe)],
                          ['Eixo', od?.eixo_longe ?? '—', oe?.eixo_longe ?? '—'],
                          ['Adição', fmtNum(od?.adicao), fmtNum(oe?.adicao)],
                          ['ESF Perto', fmtNum(od?.esf_perto), fmtNum(oe?.esf_perto)],
                          ['DNP', od?.dnp ?? '—', oe?.dnp ?? '—'],
                          ['ALT', od?.alt ?? '—', oe?.alt ?? '—'],
                          ['Prisma', od?.prisma ?? '—', oe?.prisma ?? '—'],
                        ].map(([l, d, e]) => (
                          <tr key={l as string} style={{ borderBottom: '1px solid var(--lab-bdr)' }}>
                            <td style={{ padding: '3px 12px', fontSize: '11px', color: R.dim, fontWeight: '600' }}>{l}</td>
                            <td style={{ padding: '3px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.txt, textAlign: 'center' }}>{d}</td>
                            <td style={{ padding: '3px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.txt, textAlign: 'center' }}>{e}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* serviços */}
                {svc.length > 0 && (
                  <div style={{ background: R.alt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--lab-bdr)', fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviços</div>
                    {svc.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '5px 12px', borderBottom: '1px solid var(--lab-bdr)' }}>
                        <span style={{ fontSize: '12px', color: R.txt }}>{s.descricao}</span>
                        <span style={{ fontSize: '12px', color: R.dim, fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap' }}>R$ {Number(s.total).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                    <div style={{ padding: '7px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: R.txt, fontFamily: "'Courier New', monospace" }}>Total: R$ {Number(ord.total ?? 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                )}

                {/* atalho para tela completa */}
                <a href={`/lab/ordens/${ord.id}`} style={{ fontSize: '12px', color: R.accent2, textDecoration: 'none', textAlign: 'center', padding: '4px' }}>Abrir OS completa →</a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
