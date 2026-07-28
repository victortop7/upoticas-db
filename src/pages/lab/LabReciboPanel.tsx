import { useState } from 'react';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';

interface OticaLite { id: string; codigo?: string; nome: string; }
interface OsItem {
  id: string; numero: number; ref_otica: string | null; cont_interno: string | null;
  total: number; created_at: string; status: string;
  otica_id: string; otica_nome: string; otica_codigo?: string | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Svc = any;

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string | null) { if (!s) return '—'; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; }
function ymd(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

const OS_STATUS: Record<string, { label: string; cor: string }> = {
  aguardando:  { label: 'Aguardando',  cor: '#886600' },
  em_producao: { label: 'Em Produção', cor: R.accent2 },
  pronto:      { label: 'Pronto',      cor: R.accent },
  entregue:    { label: 'Entregue',    cor: R.accent },
};

const INP: React.CSSProperties = { padding: '7px 10px', fontSize: '13px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius: 0, color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };

export default function LabReciboPanel({ oticas }: { oticas: OticaLite[] }) {
  const hoje = ymd(new Date());
  const primeiroDiaMes = ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [oticaId, setOticaId] = useState('');
  const [de, setDe] = useState(primeiroDiaMes);
  const [ate, setAte] = useState(hoje);
  const [osLista, setOsLista] = useState<OsItem[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState('');

  const rangeValido = !!de && !!ate && de <= ate;

  async function buscar() {
    if (!rangeValido) return;
    setCarregando(true); setMsg('');
    try {
      const data = await api.get<OsItem[]>(`/lab/faturamento/os?data_ini=${de}&data_fim=${ate}${oticaId ? `&otica_id=${oticaId}` : ''}`);
      setOsLista(data);
      setSel(new Set(data.map(o => o.id)));   // recibo começa com todas marcadas
    } catch { setOsLista([]); setSel(new Set()); }
    setCarregando(false);
  }
  function toggleSel(id: string) {
    setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function gerarRecibo(auto: boolean) {
    const escolhidas = osLista.filter(o => sel.has(o.id));
    if (!escolhidas.length) { setMsg('Erro: selecione ao menos uma OS.'); return; }
    setGerando(true); setMsg('');
    try {
      const selIds = new Set(escolhidas.map(o => o.id));
      const oticaIds = [...new Set(escolhidas.map(o => o.otica_id))];
      const svcPorOS: Record<string, Svc[]> = {};
      await Promise.all(oticaIds.map(async oid => {
        try {
          const r = await api.get<{ servicos: Svc[] }>(`/lab/relatorios/servicos?otica_id=${oid}&data_ini=${de}&data_fim=${ate}`);
          (r.servicos || []).forEach(s => { if (selIds.has(s.ordem_id)) (svcPorOS[s.ordem_id] ||= []).push(s); });
        } catch { /* segue */ }
      }));

      const grupos = new Map<string, OsItem[]>();
      escolhidas.forEach(o => { const a = grupos.get(o.otica_id) || []; a.push(o); grupos.set(o.otica_id, a); });
      const umaOtica = grupos.size === 1;
      const cliente = umaOtica ? escolhidas[0].otica_nome : `${grupos.size} óticas`;
      const total = escolhidas.reduce((a, o) => a + (o.total || 0), 0);

      const G = '#0a7a2e', GBG = '#e8efe9';
      const secoes = [...grupos.values()].map(os => {
        const nome = os[0].otica_nome;
        const sub = os.reduce((a, o) => a + (o.total || 0), 0);
        const linhas = os.map(o => {
          const svcs = svcPorOS[o.id] || [];
          const svcHtml = svcs.length
            ? svcs.map((s: Svc) => `<tr><td style="padding:3px 8px 3px 26px;font-family:monospace;font-size:10px;color:#555;border-bottom:1px solid #eee">${s.codigo || ''}</td><td style="padding:3px 8px;font-size:11px;color:#333;border-bottom:1px solid #eee">${s.descricao || 'Serviço'}</td><td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:center;border-bottom:1px solid #eee">${Number(s.qtd || 0).toFixed(2)}</td><td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:right;border-bottom:1px solid #eee">${brl(s.valor_unit || 0)}</td><td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:right;font-weight:700;border-bottom:1px solid #eee">${brl(s.total || 0)}</td></tr>`).join('')
            : `<tr><td colspan="5" style="padding:3px 8px 3px 26px;font-size:10px;color:#999;border-bottom:1px solid #eee">Sem itens detalhados</td></tr>`;
          return `<tr style="background:${G}"><td style="padding:5px 8px;font-family:monospace;font-weight:900;color:#fff;font-size:12px">#${String(o.numero).padStart(4, '0')}</td><td colspan="2" style="padding:5px 8px;font-family:monospace;color:#cff0d6;font-size:10px">${fmtDate(o.created_at)}${o.ref_otica ? ` · Ref: ${o.ref_otica}` : ''}</td><td style="padding:5px 8px;font-size:10px;color:#cff0d6;text-align:right">Total OS</td><td style="padding:5px 8px;font-family:monospace;font-weight:900;color:#fff;text-align:right">${brl(o.total || 0)}</td></tr>${svcHtml}<tr><td colspan="5" style="height:4px;background:${GBG}"></td></tr>`;
        }).join('');
        const cab = umaOtica ? '' : `<tr><td colspan="5" style="padding:10px 8px 4px;font-size:13px;font-weight:900;color:${G}">${nome} — ${os.length} OS</td></tr>`;
        const subRow = umaOtica ? '' : `<tr><td colspan="4" style="padding:4px 8px;text-align:right;font-size:11px;color:#555">Subtotal ${nome}</td><td style="padding:4px 8px;text-align:right;font-family:monospace;font-weight:700">${brl(sub)}</td></tr>`;
        return cab + linhas + subRow;
      }).join('');

      const toolbar = `<div class="noprint" style="position:sticky;top:0;display:flex;gap:8px;justify-content:flex-end;align-items:center;padding:10px 12px;background:#0f2a1c;margin:-12px -12px 12px">
          <span style="color:#cff0d6;font-size:12px;margin-right:auto;font-weight:600">Recibo — ${cliente}</span>
          <button onclick="window.print()" style="padding:8px 16px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer">⬇ Baixar PDF / Imprimir</button>
          <button onclick="window.close()" style="padding:8px 14px;font-size:13px;background:transparent;color:#cff0d6;border:1px solid #2f6b45;border-radius:8px;cursor:pointer">Fechar</button>
        </div>`;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo — ${cliente}</title>
        <style>*{box-sizing:border-box}body{margin:12px;font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff}
        table{width:100%;border-collapse:collapse}
        @page{margin:8mm}@media print{body{margin:0}.noprint{display:none!important}}</style></head><body>
        ${toolbar}
        <div style="text-align:center;margin-bottom:6px">
          <div style="font-size:20px;font-weight:900;letter-spacing:2px;color:${G}">RECIBO</div>
          <div style="font-size:11px;color:#666;letter-spacing:1px">COMPROVANTE DE COMPRA / SERVIÇOS</div>
        </div>
        <div style="border:2px solid ${G};border-radius:6px;padding:10px 12px;margin-bottom:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Cliente</div><div style="font-size:15px;font-weight:900;color:#111">${cliente}</div></div>
          <div style="text-align:right"><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Período</div><div style="font-size:12px;font-family:monospace;color:#333">${fmtDate(de)} a ${fmtDate(ate)}</div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Emissão</div><div style="font-size:12px;font-family:monospace;color:#333">${fmtDate(hoje)}</div></div>
        </div>
        <table>
          <thead><tr style="background:${G}">
            <th style="padding:5px 8px;text-align:left;font-size:10px;color:#fff">Código</th>
            <th style="padding:5px 8px;text-align:left;font-size:10px;color:#fff">Descrição</th>
            <th style="padding:5px 8px;text-align:center;font-size:10px;color:#fff">Qtd</th>
            <th style="padding:5px 8px;text-align:right;font-size:10px;color:#fff">Vlr Unit</th>
            <th style="padding:5px 8px;text-align:right;font-size:10px;color:#fff">Total</th>
          </tr></thead>
          <tbody>${secoes}</tbody>
        </table>
        <div style="margin-top:14px;display:flex;justify-content:flex-end">
          <div style="min-width:240px;border-top:3px solid ${G};padding-top:8px">
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:${G}"><span>TOTAL</span><span style="font-family:monospace">${brl(total)}</span></div>
            <div style="font-size:10px;color:#666;margin-top:2px">${escolhidas.length} OS · ${umaOtica ? '1 ótica' : `${grupos.size} óticas`}</div>
          </div>
        </div>
        <div style="margin-top:26px;font-size:11px;color:#333;border-top:1px dashed #bbb;padding-top:12px">
          Recebemos de <b>${cliente}</b> a importância de <b>${brl(total)}</b> referente aos serviços e produtos discriminados neste comprovante.
        </div>
        <div style="margin-top:40px;display:flex;justify-content:space-between;gap:30px">
          <div style="flex:1;text-align:center;border-top:1px solid #333;padding-top:4px;font-size:10px;color:#555">Data</div>
          <div style="flex:2;text-align:center;border-top:1px solid #333;padding-top:4px;font-size:10px;color:#555">Assinatura / Carimbo</div>
        </div>
        </body></html>`;

      const w = window.open('', '_blank');
      if (!w) { setMsg('Erro: o navegador bloqueou a janela. Permita pop-ups para gerar o recibo.'); setGerando(false); return; }
      w.document.write(html); w.document.close();
      if (auto) setTimeout(() => { try { w.print(); } catch { /* ignora */ } }, 500);
      setMsg(`✓ Recibo gerado com ${escolhidas.length} OS.`);
    } catch (e: unknown) {
      setMsg(`Erro ao gerar recibo: ${e instanceof Error ? e.message : 'tente novamente'}`);
    } finally { setGerando(false); }
  }

  const b = busca.trim().toLowerCase();
  const filtradas = osLista.filter(o =>
    !b || String(o.numero).padStart(4, '0').includes(b) || String(o.numero).includes(b)
    || (o.otica_codigo || '').toLowerCase().includes(b)
    || (o.otica_nome || '').toLowerCase().includes(b) || (o.ref_otica || '').toLowerCase().includes(b)
    || (o.cont_interno || '').toLowerCase().includes(b));
  const qtdSel = sel.size;
  const totalSel = osLista.filter(o => sel.has(o.id)).reduce((a, o) => a + (o.total || 0), 0);
  const todosMarc = filtradas.length > 0 && filtradas.every(o => sel.has(o.id));
  const toggleTodos = () => setSel(s => { const n = new Set(s); if (todosMarc) filtradas.forEach(o => n.delete(o.id)); else filtradas.forEach(o => n.add(o.id)); return n; });

  return (
    <div onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: R.txt, marginBottom: '4px' }}>Recibo / Comprovante de Compra</div>
        <div style={{ fontSize: '12px', color: R.dim, marginBottom: '14px' }}>
          Escolha a ótica e o período, selecione as OS e gere um comprovante para imprimir ou baixar em PDF.
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={LBL}>Ótica (opcional)</label>
            <select value={oticaId} onChange={e => setOticaId(e.target.value)} style={{ ...INP, width: '220px', fontFamily: "'Montserrat', sans-serif" }}>
              <option value="">Todas as óticas</option>
              {oticas.map(o => <option key={o.id} value={o.id}>{o.codigo ? `${o.codigo} · ` : ''}{o.nome}</option>)}
            </select>
          </div>
          <div><label style={LBL}>De</label><input type="date" value={de} onChange={e => setDe(e.target.value)} style={{ ...INP, width: '150px' }} /></div>
          <div><label style={LBL}>Até</label><input type="date" value={ate} onChange={e => setAte(e.target.value)} style={{ ...INP, width: '150px' }} /></div>
          <button type="button" onClick={buscar} disabled={carregando || !rangeValido}
            style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, background: (carregando || !rangeValido) ? R.dim : R.accent, color: 'var(--lab-on-accent)', border: 'none', borderRadius: '7px', cursor: (carregando || !rangeValido) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {carregando ? 'Carregando...' : 'Buscar OS'}
          </button>
        </div>
        {!rangeValido && <div style={{ marginTop: '10px', fontSize: '12px', color: '#cc0000' }}>Informe um período válido (início ≤ fim).</div>}
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(200,0,0,0.1)' : 'var(--lab-chip-bg)', border: `1px solid ${msg.startsWith('Erro') ? '#cc0000' : 'var(--lab-accent)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: msg.startsWith('Erro') ? '#cc0000' : 'var(--lab-chip-txt)', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {osLista.length > 0 && (
        <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lab-bdr)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por código da ótica, referência do cliente, nº da OS..." style={{ ...INP, width: '360px', maxWidth: '100%', fontFamily: "'Montserrat', sans-serif" }} />
            <span style={{ fontSize: '12px', color: R.dim }}>Marque as OS que entram no comprovante</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: R.alt, borderBottom: '1px solid var(--lab-bdr)' }}>
                  <th style={{ padding: '8px 12px', width: '34px', textAlign: 'center' }}><input type="checkbox" checked={todosMarc} onChange={toggleTodos} title="Selecionar todos" /></th>
                  {['Nº OS', 'Cód.', 'Ótica', 'Ref.', 'C.Int.', 'Data', 'Status', 'Valor'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Valor' ? 'right' : 'left', fontSize: '10px', fontWeight: 600, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: R.dim, fontSize: '13px' }}>Nenhuma OS encontrada.</td></tr>
                ) : filtradas.map(o => {
                  const on = sel.has(o.id);
                  const st = OS_STATUS[o.status] ?? { label: o.status, cor: R.dim };
                  return (
                    <tr key={o.id} onClick={() => toggleSel(o.id)} style={{ borderBottom: '1px solid var(--lab-bdr)', cursor: 'pointer', background: on ? `${R.accent}12` : 'transparent' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}><input type="checkbox" checked={on} onChange={() => toggleSel(o.id)} onClick={e => e.stopPropagation()} /></td>
                      <td style={{ padding: '8px 12px', fontFamily: "'Courier New', monospace", fontSize: '13px', fontWeight: 700, color: R.txt }}>#{String(o.numero).padStart(4, '0')}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{o.otica_codigo || '—'}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', color: R.txt, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.otica_nome}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{o.ref_otica || '—'}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{o.cont_interno || '—'}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim, whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '10px', fontWeight: 600, color: st.cor, background: `${st.cor}18`, padding: '2px 7px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{st.label}</span></td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 700, color: R.txt, textAlign: 'right', whiteSpace: 'nowrap' }}>{brl(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barra "bilhete" — soma ao vivo */}
          <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(90deg, #0f2a1c, #123a24)', borderTop: `2px solid ${R.accent}`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#cff0d6', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>🧾 {qtdSel} OS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9fd3b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total do comprovante</span>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#fff', fontFamily: "'Courier New', monospace", letterSpacing: '-0.5px' }}>{brl(totalSel)}</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => gerarRecibo(false)} disabled={!qtdSel || gerando}
                style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', cursor: (!qtdSel || gerando) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (!qtdSel || gerando) ? 0.5 : 1, border: `1px solid ${R.accent}66`, background: 'transparent', color: R.accent }}>👁 Visualizar</button>
              <button type="button" onClick={() => gerarRecibo(true)} disabled={!qtdSel || gerando}
                style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', cursor: (!qtdSel || gerando) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (!qtdSel || gerando) ? 0.5 : 1, border: 'none', background: R.accent, color: '#fff' }}>{gerando ? 'Gerando...' : '⬇ Gerar Recibo (PDF)'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
