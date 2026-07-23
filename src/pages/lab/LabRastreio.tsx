import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { R } from '../../lib/labTheme';
import { api } from '../../lib/api';
import { FLUXOS } from '../../lib/labFluxo';
import LabIcon, { type IconName } from '../../components/LabIcon';

interface Ordem {
  id: string; numero: number; status: string; setor_atual: string | null;
  otica_nome: string | null; ref_otica: string | null; cont_interno: string | null;
  previsao_entrega: string | null; created_at: string; tipo_lente: string | null;
  caixa?: string | null; vendedor?: string | null; medico?: string | null;
  tipo?: string | null; condicao_pgto?: string | null; total?: number | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
interface Fluxo {
  id: string; setor: string; setor_num: number | null; maquina: string | null; operador: string | null;
  inicio_data: string | null; inicio_hora: string | null;
  termino_data: string | null; termino_hora: string | null;
  tempo_prev: number | null; tempo_real: number | null; created_at: string;
}

// procura a etapa (rótulo/ícone/cor) pelo key do setor, nos dois fluxos
const TODAS = [...FLUXOS.simples, ...FLUXOS.progressiva];
function etapaDe(setor: string): { label: string; icon: IconName; color: string } {
  const k = (setor || '').toLowerCase().trim();
  const e = TODAS.find(x => x.key === k || x.label.toLowerCase() === k);
  if (e) return { label: e.label, icon: e.icon, color: e.color };
  return { label: setor || '—', icon: 'flow', color: '#6b7280' };
}

function parseDt(data: string | null, hora: string | null): Date | null {
  if (!data) return null;
  const d = new Date(`${data.slice(0, 10)}T${(hora || '00:00').slice(0, 5)}:00`);
  return isNaN(d.getTime()) ? null : d;
}
function fmtData(s: string | null) {
  if (!s) return '—';
  return s.slice(0, 10).split('-').reverse().join('/');
}
function fmtGrau(v: Any) {
  if (v == null || v === '' || isNaN(Number(v))) return '—';
  const n = Number(v);
  return (n > 0 ? '+' : '') + n.toFixed(2).replace('.', ',');
}
function val(v: Any) { return (v == null || v === '') ? '—' : String(v); }
function fmtDur(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  if (h < 24) return m ? `${h}h ${m}min` : `${h}h`;
  const d = Math.floor(h / 24), hr = h % 24;
  return hr ? `${d}d ${hr}h` : `${d}d`;
}

export default function LabRastreio() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [busca, setBusca] = useState(params.get('os') ?? '');
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [fluxo, setFluxo] = useState<Fluxo[]>([]);
  const [receita, setReceita] = useState<Any[]>([]);
  const [armacao, setArmacao] = useState<Any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const buscar = useCallback(async (q: string) => {
    const termo = q.trim();
    if (!termo) return;
    setCarregando(true); setErro(''); setOrdem(null); setFluxo([]); setReceita([]); setArmacao(null);
    try {
      const d = await api.get<{ ordem: Ordem; fluxo: Fluxo[] }>(`/lab/fluxo/os?q=${encodeURIComponent(termo)}`);
      setOrdem(d.ordem); setFluxo(d.fluxo ?? []);
      // detalhe completo (receita + armação) para exibir todos os dados da OS
      try {
        const det = await api.get<Any>(`/lab/ordens/${d.ordem.id}`);
        setReceita(det.receita ?? []);
        setArmacao(det.armacao ?? null);
        if (det.ordem) setOrdem(o => ({ ...(o as Ordem), ...det.ordem }));
      } catch { /* mantém o básico */ }
    } catch {
      setErro('OS não encontrada.');
    }
    setCarregando(false);
  }, []);

  // busca automática se veio ?os= na URL
  useEffect(() => {
    const os = params.get('os');
    if (os) buscar(os);
  }, []); // eslint-disable-line

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setParams(busca.trim() ? { os: busca.trim() } : {});
    buscar(busca);
  }

  const card: React.CSSProperties = {
    background: R.panelGrad, border: '1px solid var(--lab-bdr)', borderRadius: '10px', boxShadow: R.sh,
  };

  // posição atual + tempos
  const abertoAgora = fluxo.find(f => !f.termino_data) ?? null;
  const desde = abertoAgora ? parseDt(abertoAgora.inicio_data, abertoAgora.inicio_hora) : null;
  const paradoMin = desde ? Math.max(0, Math.round((Date.now() - desde.getTime()) / 60000)) : null;
  const entrada = ordem ? new Date(ordem.created_at.replace(' ', 'T') + (ordem.created_at.includes('Z') ? '' : 'Z')) : null;
  const totalMin = entrada && !isNaN(entrada.getTime()) ? Math.max(0, Math.round((Date.now() - entrada.getTime()) / 60000)) : null;
  const etapaAtual = ordem
    ? (ordem.status === 'entregue' ? { label: 'Entregue', icon: 'truck' as IconName, color: '#6b7280' }
      : ordem.status === 'pronto' ? { label: 'Pronto', icon: 'check' as IconName, color: '#0a8a2a' }
      : etapaDe(ordem.setor_atual ?? ''))
    : null;
  const entregue = ordem?.status === 'entregue';

  return (
    <div style={{ minHeight: '100%', background: R.bg, padding: '20px 24px', fontFamily: "'Montserrat', sans-serif" }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: R.txt, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LabIcon name="flow" size={20} /> Rastreio da OS
      </h1>
      <div style={{ fontSize: '12px', color: R.dim, marginBottom: '16px' }}>Acompanhe por onde o pedido passou, como uma encomenda.</div>

      {/* busca */}
      <form onSubmit={submit} style={{ ...card, padding: '12px 14px', marginBottom: '14px', display: 'flex', gap: '8px', maxWidth: '520px' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} autoFocus
          placeholder="Nº da OS, contra-interno ou referência..."
          style={{ flex: 1, padding: '9px 12px', fontSize: '13px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius: '8px', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace" }} />
        <button type="submit"
          style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700, background: R.accent, color: R.onAccent, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <LabIcon name="search" size={15} /> Rastrear
        </button>
      </form>

      {carregando && <div style={{ ...card, padding: '30px', textAlign: 'center', color: R.dim, fontSize: '13px' }}>Buscando...</div>}
      {erro && !carregando && <div style={{ ...card, padding: '20px', color: '#cc0000', fontSize: '13px' }}>{erro}</div>}

      {ordem && !carregando && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '14px', maxWidth: '820px' }}>

          {/* posição atual */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: R.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  OS <span style={{ fontFamily: "'Courier New', monospace", color: R.txt }}>#{String(ordem.numero).padStart(4, '0')}</span> · {ordem.otica_nome ?? '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: `${etapaAtual!.color}22`, color: etapaAtual!.color }}>
                    <LabIcon name={etapaAtual!.icon} size={20} />
                  </span>
                  <div>
                    <div style={{ fontSize: '10px', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Está agora em</div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: R.txt }}>{etapaAtual!.label}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {paradoMin != null && !entregue && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '10px', color: R.dim, textTransform: 'uppercase' }}>Neste setor há</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: paradoMin > 1440 ? '#cc0000' : R.txt, fontFamily: "'Courier New', monospace" }}>{fmtDur(paradoMin)}</div>
                  </div>
                )}
                {totalMin != null && (
                  <div>
                    <div style={{ fontSize: '10px', color: R.dim, textTransform: 'uppercase' }}>Tempo total</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: R.dim, fontFamily: "'Courier New', monospace" }}>{fmtDur(totalMin)}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--lab-bdr)', fontSize: '11px', color: R.dim }}>
              <span>Entrada: <b style={{ color: R.txt, fontFamily: "'Courier New', monospace" }}>{fmtData(ordem.created_at)}</b></span>
              <span>Previsão: <b style={{ color: R.txt, fontFamily: "'Courier New', monospace" }}>{fmtData(ordem.previsao_entrega)}</b></span>
              {ordem.ref_otica && <span>Ref.: <b style={{ color: R.txt, fontFamily: "'Courier New', monospace" }}>{ordem.ref_otica}</b></span>}
              {ordem.tipo_lente && <span>Lente: <b style={{ color: R.txt }}>{ordem.tipo_lente}</b></span>}
              <a onClick={() => navigate(`/lab/ordens/${ordem.id}`)} style={{ marginLeft: 'auto', color: R.accent2, cursor: 'pointer' }}>Abrir OS completa →</a>
            </div>
          </div>

          {/* dados completos da OS (igual à ficha do sistema) */}
          {(() => {
            const od = receita.find(r => r.olho === 'D') ?? {};
            const oe = receita.find(r => r.olho === 'E') ?? {};
            const a = armacao ?? {};
            const th: React.CSSProperties = { padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'center', borderBottom: '1px solid var(--lab-bdr)', whiteSpace: 'nowrap' };
            const td: React.CSSProperties = { padding: '4px 8px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.txt, textAlign: 'center', borderBottom: '1px solid var(--lab-bdr)' };
            const olhoTd: React.CSSProperties = { ...td, fontWeight: 800, color: R.dim, textAlign: 'left' };
            const Item = ({ k, v }: { k: string; v: Any }) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '3px 0', borderBottom: '1px dotted var(--lab-bdr)' }}>
                <span style={{ fontSize: '11px', color: R.dim, whiteSpace: 'nowrap' }}>{k}</span>
                <span style={{ fontSize: '12px', color: R.txt, fontFamily: "'Courier New', monospace", textAlign: 'right' }}>{val(v)}</span>
              </div>
            );
            return (
              <div style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Dados da OS</div>

                {/* identificação */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2px 24px', marginBottom: '14px' }}>
                  <Item k="Cliente / Ótica" v={ordem.otica_nome} />
                  <Item k="Vendedor" v={ordem.vendedor} />
                  <Item k="C/Interno" v={ordem.cont_interno} />
                  <Item k="Referência" v={ordem.ref_otica} />
                  <Item k="Caixa" v={ordem.caixa} />
                  <Item k="Médico / Oftalmo" v={ordem.medico} />
                  <Item k="Tipo" v={ordem.tipo} />
                  <Item k="Cond. Pagamento" v={ordem.condicao_pgto} />
                </div>

                {/* receita — grau */}
                <div style={{ fontSize: '10px', fontWeight: 700, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Receita das Lentes</div>
                <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                    <thead><tr>
                      {['Olho', 'ESF Longe', 'CIL Longe', 'Eixo', 'Adição', 'ESF Perto', 'CIL Perto'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      <tr>
                        <td style={olhoTd}>O/D</td>
                        <td style={td}>{fmtGrau(od.esf_longe)}</td><td style={td}>{fmtGrau(od.cil_longe)}</td>
                        <td style={td}>{val(od.eixo_longe)}</td><td style={td}>{fmtGrau(od.adicao)}</td>
                        <td style={td}>{fmtGrau(od.esf_perto)}</td><td style={td}>{fmtGrau(od.cil_perto)}</td>
                      </tr>
                      <tr>
                        <td style={olhoTd}>O/E</td>
                        <td style={td}>{fmtGrau(oe.esf_longe)}</td><td style={td}>{fmtGrau(oe.cil_longe)}</td>
                        <td style={td}>{val(oe.eixo_longe)}</td><td style={td}>{fmtGrau(oe.adicao)}</td>
                        <td style={td}>{fmtGrau(oe.esf_perto)}</td><td style={td}>{fmtGrau(oe.cil_perto)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* receita — medidas */}
                <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
                    <thead><tr>
                      {['Olho', 'DNP', 'ALT', 'DEC H', 'Prisma'].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      <tr>
                        <td style={olhoTd}>O/D</td>
                        <td style={td}>{val(od.dnp)}</td><td style={td}>{val(od.alt)}</td><td style={td}>{val(od.dec_h)}</td><td style={td}>{val(od.prisma)}</td>
                      </tr>
                      <tr>
                        <td style={olhoTd}>O/E</td>
                        <td style={td}>{val(oe.dnp)}</td><td style={td}>{val(oe.alt)}</td><td style={td}>{val(oe.dec_h)}</td><td style={td}>{val(oe.prisma)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* lente + armação */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2px 24px' }}>
                  <Item k="Tipo de Lente" v={a.tipo_lente ?? ordem.tipo_lente} />
                  <Item k="Marca / Material" v={a.marca_material} />
                  <Item k="Tipo de Armação" v={a.tipo_material ?? a.material} />
                  <Item k="Diâmetro Final" v={a.diametro_final} />
                  <Item k="Largura" v={a.largura} />
                  <Item k="Ponte" v={a.ponte} />
                  <Item k="Altura" v={a.altura} />
                  <Item k="Maior Diagonal" v={a.maior_diagonal} />
                  <Item k="Eixo Maior Diagonal" v={a.eixo_maior_diagonal} />
                  <Item k="Estojo" v={a.estojo ? 'Sim' : 'Não'} />
                </div>
              </div>
            );
          })()}

          {/* linha do tempo */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Histórico de movimentação</div>
            {fluxo.length === 0 ? (
              <div style={{ fontSize: '12px', color: R.dim, padding: '10px 0' }}>Ainda não há registros de movimentação para esta OS.</div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '6px' }}>
                {fluxo.map((f, i) => {
                  const et = etapaDe(f.setor);
                  const aberto = !f.termino_data;
                  const ini = parseDt(f.inicio_data, f.inicio_hora);
                  const fim = parseDt(f.termino_data, f.termino_hora);
                  const durMin = ini && fim ? Math.max(0, Math.round((fim.getTime() - ini.getTime()) / 60000)) : (f.tempo_real ?? null);
                  const dif = (f.tempo_prev != null && durMin != null) ? f.tempo_prev - durMin : null;
                  const ultimo = i === fluxo.length - 1;
                  return (
                    <div key={f.id ?? i} style={{ display: 'flex', gap: '12px', paddingBottom: ultimo ? 0 : '18px', position: 'relative' }}>
                      {/* trilho + nó */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: `${et.color}22`, color: et.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${et.color}`, boxShadow: aberto ? `0 0 0 4px ${et.color}22` : 'none', zIndex: 1 }}>
                          <LabIcon name={et.icon} size={15} />
                        </span>
                        {!ultimo && <span style={{ flex: 1, width: '2px', background: 'var(--lab-bdr)', marginTop: '2px', minHeight: '18px' }} />}
                      </div>
                      {/* conteúdo */}
                      <div style={{ flex: 1, paddingBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: R.txt }}>{et.label}</span>
                          {f.setor_num != null && f.setor_num > 0 && <span style={{ fontSize: '10px', color: R.dim, fontFamily: "'Courier New', monospace" }}>#{f.setor_num}</span>}
                          {aberto && <span style={{ fontSize: '9.5px', fontWeight: 700, color: et.color, background: `${et.color}20`, padding: '2px 7px', borderRadius: '10px' }}>EM ANDAMENTO</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: R.dim, fontFamily: "'Courier New', monospace", marginTop: '3px' }}>
                          Entrou: {fmtData(f.inicio_data)} {f.inicio_hora ?? ''}
                          {f.termino_data && <> · Saiu: {fmtData(f.termino_data)} {f.termino_hora ?? ''}</>}
                        </div>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '5px', fontSize: '11px', color: R.dim }}>
                          {f.operador && <span><b style={{ color: R.txt, fontWeight: 700 }}>Op.</b> {f.operador}</span>}
                          {f.maquina && <span><b style={{ color: R.txt, fontWeight: 700 }}>Máq.</b> {f.maquina}</span>}
                          {durMin != null && <span><b style={{ color: R.txt, fontWeight: 700 }}>Real</b> {fmtDur(durMin)}</span>}
                          {f.tempo_prev != null && <span><b style={{ color: R.txt, fontWeight: 700 }}>Prev.</b> {fmtDur(f.tempo_prev)}</span>}
                          {dif != null && (
                            <span style={{ color: dif >= 0 ? '#0a8a2a' : '#cc0000', fontWeight: 700 }}>
                              {dif >= 0 ? `▲ ${fmtDur(dif)} adiantado` : `▼ ${fmtDur(-dif)} atrasado`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
