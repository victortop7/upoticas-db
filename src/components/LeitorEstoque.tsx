import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

type Leitura = { id: number; codigo: string; descricao: string; tipo: 'entrada' | 'saida'; qtd: number; depois?: number; erro?: string };
type Prod = { id: string; descricao: string; grupo?: string | null };
type CatLeitor = { id: string; nome: string; subs: { id: string; nome: string }[] };

function bip(ok: boolean) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = ok ? 1250 : 300; g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + (ok ? 0.09 : 0.3));
    o.onended = () => ctx.close();
  } catch { /* sem som */ }
}

// Leitura contínua com leitor de código de barras (USB/Bluetooth funciona como teclado + Enter)
// ou pela câmera do celular, quando o navegador suporta.
export default function LeitorEstoque({ onMudou, categorias = [], lojaId }: { onMudou: () => void; categorias?: CatLeitor[]; lojaId?: string }) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [qtd, setQtd] = useState('1');
  const [codigo, setCodigo] = useState('');
  const [lidas, setLidas] = useState<Leitura[]>([]);
  const [novo, setNovo] = useState<{ codigo: string; descricao: string; categoria_id: string; subcategoria_id: string; preco_venda: string; preco_custo: string } | null>(null);
  // categoria padrão do cadastro rápido: Armações (ou a primeira)
  const catPadrao = (categorias.find(c => /arma/i.test(c.nome)) || categorias[0])?.id || '';
  const [ocupado, setOcupado] = useState(false);
  const [camera, setCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const seq = useRef(0);
  const temCamera = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // Modo lote: grife + material + preços definidos uma vez; código novo é cadastrado sozinho
  const [lote, setLote] = useState({ ativo: false, categoria_id: '', subcategoria_id: '', preco_custo: '', preco_venda: '', nome: '' });
  const loteRef = useRef(lote);
  loteRef.current = lote;
  const [pendentes, setPendentes] = useState(0);
  const fila = useRef<{ c: string; extra?: Record<string, unknown>; tipo: 'entrada' | 'saida'; q: number }[]>([]);
  const rodando = useRef(false);
  const contarModelos = useRef(new Set<string>());

  useEffect(() => { if (!novo) inputRef.current?.focus(); }, [novo, tipo]);
  useEffect(() => { if (!lote.categoria_id && catPadrao) setLote(l => ({ ...l, categoria_id: catPadrao })); }, [catPadrao, lote.categoria_id]);

  const catLote = categorias.find(c => c.id === lote.categoria_id);
  const subLote = catLote?.subs.find(s => s.id === lote.subcategoria_id);
  const num = (s: string) => parseFloat(String(s).replace(',', '.')) || 0;

  async function processar() {
    if (rodando.current) return;
    rodando.current = true;
    setOcupado(true);
    while (fila.current.length) {
      const { c, extra, tipo: t, q } = fila.current.shift()!;
      setPendentes(fila.current.length);
      try {
        let r: { produto: Prod; depois: number };
        try {
          r = await api.post<{ produto: Prod; depois: number }>('/estoque/leitura', { codigo: c, tipo: t, quantidade: q, loja_id: lojaId || undefined, ...extra });
        } catch (e) {
          const L = loteRef.current;
          const cat = categorias.find(x => x.id === L.categoria_id);
          // lote ligado: cadastra o código novo com a grife/material/preço do lote e já dá entrada
          if (/não cadastrado/i.test(e instanceof Error ? e.message : '') && t === 'entrada' && L.ativo && cat) {
            const sub = cat.subs.find(s => s.id === L.subcategoria_id);
            const descricao = [L.nome.trim() || cat.nome, sub?.nome, c].filter(Boolean).join(' ');
            r = await api.post<{ produto: Prod; depois: number }>('/estoque/leitura', {
              codigo: c, tipo: t, quantidade: q, loja_id: lojaId || undefined,
              novo: { descricao, categoria_id: cat.id, subcategoria_id: sub?.id, preco_custo: num(L.preco_custo), preco_venda: num(L.preco_venda) },
            });
            contarModelos.current.add(c);
          } else throw e;
        }
        bip(true);
        setLidas(l => [{ id: ++seq.current, codigo: c, descricao: r.produto.descricao, tipo: t, qtd: q, depois: r.depois }, ...l].slice(0, 200));
        setNovo(null);
      } catch (e) {
        bip(false);
        const msg = e instanceof Error ? e.message : 'Erro';
        if (/não cadastrado/i.test(msg) && t === 'entrada') {
          // sem lote: para a fila e abre o cadastro rápido deste código
          fila.current = [];
          setNovo(n => ({ codigo: c, descricao: '', categoria_id: n?.categoria_id || catPadrao, subcategoria_id: n?.subcategoria_id || '', preco_venda: '', preco_custo: '' }));
        } else {
          setLidas(l => [{ id: ++seq.current, codigo: c, descricao: '', tipo: t, qtd: q, erro: /não cadastrado/i.test(msg) ? 'Código não cadastrado' : msg.replace(/\s*\(HTTP \d+\)$/, '') }, ...l].slice(0, 200));
        }
      }
    }
    setPendentes(0);
    rodando.current = false;
    setOcupado(false);
    onMudou();
    inputRef.current?.focus();
  }

  // Bipou: entra na fila (leituras rápidas seguidas não se perdem)
  async function registrar(cod: string, extra?: Record<string, unknown>) {
    const c = cod.trim();
    setCodigo('');
    if (!c) return;
    fila.current.push({ c, extra, tipo, q: Math.max(1, parseInt(qtd) || 1) });
    setPendentes(fila.current.length);
    processar();
  }

  // Câmera (Chrome no Android / alguns desktops)
  useEffect(() => {
    if (!camera || !temCamera) return;
    let stream: MediaStream | null = null;
    let parar = false;
    let ultimo = '';
    let ultimoEm = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const Det = (window as unknown as { BarcodeDetector: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        const det = new Det({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
        const loop = async () => {
          if (parar || !videoRef.current) return;
          try {
            const r = await det.detect(videoRef.current);
            const v = r[0]?.rawValue;
            // evita ler o mesmo código várias vezes seguidas
            if (v && (v !== ultimo || Date.now() - ultimoEm > 2500)) { ultimo = v; ultimoEm = Date.now(); await registrar(v); }
          } catch { /* frame sem código */ }
          setTimeout(loop, 250);
        };
        loop();
      } catch { setCamera(false); alert('Não foi possível abrir a câmera.'); }
    })();
    return () => { parar = true; stream?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, tipo, qtd]);

  const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', fontSize: '14px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const cor = tipo === 'entrada' ? '#16a34a' : '#dc2626';
  const totalEnt = lidas.filter(l => !l.erro && l.tipo === 'entrada').reduce((s, l) => s + l.qtd, 0);
  const totalSai = lidas.filter(l => !l.erro && l.tipo === 'saida').reduce((s, l) => s + l.qtd, 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: 'var(--surface)', border: `2px solid ${cor}`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {(['entrada', 'saida'] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{ flex: 1, minWidth: 140, padding: '12px', fontSize: 15, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: `2px solid ${t === tipo ? (t === 'entrada' ? '#16a34a' : '#dc2626') : 'var(--border)'}`, background: t === tipo ? (t === 'entrada' ? 'rgba(22,163,74,.12)' : 'rgba(220,38,38,.12)') : 'transparent', color: t === tipo ? (t === 'entrada' ? '#16a34a' : '#dc2626') : 'var(--text-muted)' }}>
              {t === 'entrada' ? 'Entrada (chegou)' : 'Baixa (saiu)'}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); registrar(codigo); }} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bipe o código de barras</label>
            <input ref={inputRef} value={codigo} onChange={e => setCodigo(e.target.value)} disabled={!!novo && !lote.ativo}
              style={{ ...inp, fontSize: 20, fontFamily: 'var(--mono)', padding: '12px 14px', borderColor: cor }} placeholder="▌▌▌ ▌▌ ▌▌▌" autoComplete="off" />
          </div>
          <div style={{ width: 90 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Qtd por bipe</label>
            <input type="number" min={1} value={qtd} onChange={e => setQtd(e.target.value)} style={{ ...inp, fontFamily: 'var(--mono)', padding: '12px 10px', fontSize: 16 }} />
          </div>
          <button type="submit" disabled={!codigo.trim()} style={{ padding: '13px 18px', fontSize: 14, fontWeight: 700, background: cor, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: !codigo.trim() ? 0.6 : 1 }}>{ocupado && pendentes ? `… ${pendentes}` : 'OK'}</button>
          {temCamera && (
            <button type="button" onClick={() => setCamera(c => !c)} style={{ padding: '13px 14px', fontSize: 14, fontWeight: 600, background: camera ? 'var(--primary)' : 'var(--surface-alt)', color: camera ? '#fff' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>{camera ? 'Fechar câmera' : 'Câmera'}</button>
          )}
        </form>
        {camera && <video ref={videoRef} muted playsInline style={{ marginTop: 12, width: '100%', maxWidth: 420, borderRadius: 10, background: '#000' }} />}

        {tipo === 'entrada' && categorias.length > 0 && (
          <div style={{ marginTop: 14, border: `1px solid ${lote.ativo ? '#16a34a' : 'var(--border)'}`, background: lote.ativo ? 'rgba(22,163,74,.06)' : 'transparent', borderRadius: 10, padding: '12px 14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={lote.ativo} onChange={e => { setLote(l => ({ ...l, ativo: e.target.checked })); contarModelos.current.clear(); inputRef.current?.focus(); }} />
              Entrada de mercadoria em lote
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>· escolha grife e material uma vez e bipe a caixa toda</span>
            </label>
            {lote.ativo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 0.8fr 0.8fr 1.4fr', gap: 10, marginTop: 10, alignItems: 'end' }}>
                <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grife / linha</label>
                  <select style={inp} value={lote.categoria_id} onChange={e => setLote(l => ({ ...l, categoria_id: e.target.value, subcategoria_id: '' }))}>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select></div>
                <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Material</label>
                  <select style={inp} value={lote.subcategoria_id} onChange={e => setLote(l => ({ ...l, subcategoria_id: e.target.value }))}>
                    <option value="">-</option>
                    {catLote?.subs.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select></div>
                <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Custo R$</label><input inputMode="decimal" style={{ ...inp, fontFamily: 'var(--mono)' }} value={lote.preco_custo} onChange={e => setLote(l => ({ ...l, preco_custo: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Venda R$</label><input inputMode="decimal" style={{ ...inp, fontFamily: 'var(--mono)' }} value={lote.preco_venda} onChange={e => setLote(l => ({ ...l, preco_venda: e.target.value }))} /></div>
                <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nome base (opcional)</label><input style={inp} value={lote.nome} onChange={e => setLote(l => ({ ...l, nome: e.target.value }))} placeholder={catLote?.nome || ''} /></div>
                <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-dim)' }}>
                  Código já cadastrado: soma +{Math.max(1, parseInt(qtd) || 1)}. Código novo: cadastra como <b style={{ fontFamily: 'var(--mono)' }}>{[lote.nome.trim() || catLote?.nome, subLote?.nome, '<código>'].filter(Boolean).join(' ')}</b> e já dá entrada.
                  {contarModelos.current.size > 0 && <> · <b>{contarModelos.current.size}</b> modelo(s) novo(s) neste lote.</>}
                  {' '}Depois dá pra ajustar o nome de cada um em Produtos.
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          Deixe o cursor no campo e vá bipando: cada leitura já {tipo === 'entrada' ? 'soma' : 'tira'} no estoque. Código que ainda não existe abre o cadastro rápido{tipo === 'saida' ? ' (só na Entrada)' : ''}.
        </div>
      </div>

      {novo && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--amber, #f59e0b)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Código novo: <span style={{ fontFamily: 'var(--mono)' }}>{novo.codigo}</span></div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>Cadastre o produto uma vez. Nas próximas leituras ele já é reconhecido.</div>
          <form onSubmit={e => { e.preventDefault(); if (!novo.descricao.trim()) return; registrar(novo.codigo, { novo: { descricao: novo.descricao, categoria_id: novo.categoria_id || undefined, subcategoria_id: novo.subcategoria_id || undefined, preco_venda: parseFloat(novo.preco_venda.replace(',', '.')) || 0, preco_custo: parseFloat(novo.preco_custo.replace(',', '.')) || 0 } }); }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1.1fr 0.8fr 0.8fr', gap: 10, alignItems: 'end' }}>
            <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Descrição *</label><input autoFocus style={inp} value={novo.descricao} onChange={e => setNovo({ ...novo, descricao: e.target.value })} placeholder="Ex: Armação Ray-Ban RB5154 preta" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Categoria</label>
              <select style={inp} value={novo.categoria_id} onChange={e => setNovo({ ...novo, categoria_id: e.target.value, subcategoria_id: '' })}>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select></div>
            <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Material / sub</label>
              <select style={inp} value={novo.subcategoria_id} onChange={e => setNovo({ ...novo, subcategoria_id: e.target.value })}>
                <option value="">-</option>
                {categorias.find(c => c.id === novo.categoria_id)?.subs.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select></div>
            <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Custo (R$)</label><input style={{ ...inp, fontFamily: 'var(--mono)' }} inputMode="decimal" value={novo.preco_custo} onChange={e => setNovo({ ...novo, preco_custo: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Venda (R$)</label><input style={{ ...inp, fontFamily: 'var(--mono)' }} inputMode="decimal" value={novo.preco_venda} onChange={e => setNovo({ ...novo, preco_venda: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setNovo(null)} style={{ padding: '9px 16px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-light)', fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={ocupado} style={{ padding: '9px 18px', fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cadastrar e dar entrada</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <b style={{ color: 'var(--text)' }}>Leituras desta sessão</b>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
            <span style={{ color: '#16a34a' }}>+{totalEnt}</span> · <span style={{ color: '#dc2626' }}>−{totalSai}</span>
          </span>
        </div>
        {!lidas.length ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma leitura ainda.</div>
        ) : lidas.map(l => (
          <div key={l.id} style={{ padding: '9px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, background: l.erro ? 'rgba(220,38,38,.06)' : 'transparent' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: l.erro ? '#dc2626' : 'var(--text)', fontWeight: 500 }}>{l.erro ? `${l.erro}` : l.descricao}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-muted)' }}>{l.codigo}</div>
            </div>
            {!l.erro && (
              <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 700, color: l.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>{l.tipo === 'entrada' ? '+' : '−'}{l.qtd}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>fica {l.depois}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
