import { useMemo, useState } from 'react';
import { R } from '../../lib/labTheme';

interface OticaLite { id: string; codigo?: string; nome: string; lista_preco?: number; }
interface ProdutoLite { id: string; codigo?: string; nome: string; unidade?: string; valor_padrao: number; }
interface ItemOrc { produto_id: string; codigo: string; descricao: string; valor_unit: number; qtd: number; }
interface OlhoRx { esf_l: string; cil_l: string; eixo: string; adic: string; esf_p: string; cil_p: string; dnp: string; alt: string; }

const OLHO_INI: OlhoRx = { esf_l: '', cil_l: '', eixo: '', adic: '', esf_p: '', cil_p: '', dnp: '', alt: '' };

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; }
function ymd(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

const INP: React.CSSProperties = { padding: '7px 10px', fontSize: '13px', background: R.inp, border: '1px solid var(--lab-bdr)', borderRadius: 0, color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };
const RXI: React.CSSProperties = { width: '100%', padding: '3px 4px', fontSize: '12px', textAlign: 'center', background: R.inp, border: '1px solid var(--lab-bdr)', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace", boxSizing: 'border-box' };
const TH: React.CSSProperties = { padding: '4px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--lab-on-accent)', textTransform: 'uppercase', textAlign: 'center', background: R.accent, whiteSpace: 'nowrap', border: '1px solid var(--lab-hdr-bdr)' };

export default function LabOrcamentoPanel({ oticas, produtos }: { oticas: OticaLite[]; produtos: ProdutoLite[] }) {
  const hoje = ymd(new Date());

  // Ótica
  const [oticaCod, setOticaCod] = useState('');
  const [oticaNome, setOticaNome] = useState('');
  const [oticaErro, setOticaErro] = useState(false);
  const [refOtica, setRefOtica] = useState('');
  const [cliente, setCliente] = useState('');
  const [validadeDias, setValidadeDias] = useState('7');

  // Exame (RX)
  const [od, setOd] = useState<OlhoRx>({ ...OLHO_INI });
  const [oe, setOe] = useState<OlhoRx>({ ...OLHO_INI });

  // Itens (serviços/lentes) — estilo bet
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<ItemOrc[]>([]);
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState('');

  function lookupOtica(cod: string) {
    const t = cod.trim().toLowerCase();
    if (!t) { setOticaNome(''); setOticaErro(false); return; }
    const found = oticas.find(o =>
      (o.codigo && o.codigo.toLowerCase() === t) ||
      o.nome.toLowerCase().startsWith(t) || o.nome.toLowerCase().includes(t));
    if (found) { setOticaNome(found.nome); setOticaCod(found.codigo || cod); setOticaErro(false); }
    else { setOticaNome(''); setOticaErro(true); }
  }
  const setOlho = (olho: 'od' | 'oe', k: keyof OlhoRx, v: string) =>
    (olho === 'od' ? setOd : setOe)(p => ({ ...p, [k]: v }));

  function addProduto(p: ProdutoLite) {
    setItens(list => {
      const ex = list.find(i => i.produto_id === p.id);
      if (ex) return list.map(i => i.produto_id === p.id ? { ...i, qtd: i.qtd + 1 } : i);
      return [...list, { produto_id: p.id, codigo: p.codigo || '', descricao: p.nome, valor_unit: p.valor_padrao || 0, qtd: 1 }];
    });
  }
  function addAvulso() {
    setItens(list => [...list, { produto_id: `avulso-${Date.now()}`, codigo: '', descricao: '', valor_unit: 0, qtd: 1 }]);
  }
  const patchItem = (id: string, patch: Partial<ItemOrc>) =>
    setItens(list => list.map(i => i.produto_id === id ? { ...i, ...patch } : i));
  const removeItem = (id: string) => setItens(list => list.filter(i => i.produto_id !== id));

  const total = useMemo(() => itens.reduce((a, i) => a + i.qtd * i.valor_unit, 0), [itens]);

  const produtosFiltrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    const base = b
      ? produtos.filter(p => (p.codigo || '').toLowerCase().includes(b) || p.nome.toLowerCase().includes(b))
      : produtos;
    return base.slice(0, 40);
  }, [busca, produtos]);

  function gerarOrcamento(auto: boolean) {
    if (!itens.length) { setMsg('Erro: adicione ao menos um serviço ou lente.'); return; }
    setGerando(true); setMsg('');
    try {
      const nomeCli = oticaNome || cliente || 'Cliente';
      const dias = parseInt(validadeDias, 10) || 7;
      const venc = new Date(); venc.setDate(venc.getDate() + dias);
      const G = '#0a7a2e', GBG = '#e8efe9';

      const rxRow = (lbl: string, o: OlhoRx) =>
        `<tr><td style="padding:3px 6px;font-weight:700;background:${GBG};font-size:10px">${lbl}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.esf_l || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.cil_l || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.eixo || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.adic || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.esf_p || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.cil_p || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.dnp || '—'}</td>
          <td style="padding:3px 6px;text-align:center;font-family:monospace">${o.alt || '—'}</td></tr>`;
      const temRx = [od, oe].some(o => Object.values(o).some(v => v));
      const rxBloco = temRx ? `
        <div style="font-size:11px;font-weight:900;color:${G};margin:12px 0 4px">RECEITA</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #ccc">
          <thead><tr style="background:${G}">
            <th style="padding:3px 6px;color:#fff;font-size:9px">OLHO</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">ESF L</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">CIL L</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">EIXO</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">ADIC</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">ESF P</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">CIL P</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">DNP</th>
            <th style="padding:3px 6px;color:#fff;font-size:9px">ALT</th>
          </tr></thead>
          <tbody>${rxRow('O/D', od)}${rxRow('O/E', oe)}</tbody>
        </table>` : '';

      const linhas = itens.map(i => `<tr>
          <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:#555;border-bottom:1px solid #eee">${i.codigo || '—'}</td>
          <td style="padding:4px 8px;font-size:11px;color:#222;border-bottom:1px solid #eee">${i.descricao || 'Item'}</td>
          <td style="padding:4px 8px;text-align:center;font-family:monospace;font-size:10px;border-bottom:1px solid #eee">${i.qtd}</td>
          <td style="padding:4px 8px;text-align:right;font-family:monospace;font-size:10px;border-bottom:1px solid #eee">${brl(i.valor_unit)}</td>
          <td style="padding:4px 8px;text-align:right;font-family:monospace;font-size:10px;font-weight:700;border-bottom:1px solid #eee">${brl(i.qtd * i.valor_unit)}</td>
        </tr>`).join('');

      const toolbar = `<div class="noprint" style="position:sticky;top:0;display:flex;gap:8px;justify-content:flex-end;align-items:center;padding:10px 12px;background:#0f2a1c;margin:-12px -12px 12px">
          <span style="color:#cff0d6;font-size:12px;margin-right:auto;font-weight:600">Orçamento — ${nomeCli}</span>
          <button onclick="window.print()" style="padding:8px 16px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer">⬇ Baixar PDF / Imprimir</button>
          <button onclick="window.close()" style="padding:8px 14px;font-size:13px;background:transparent;color:#cff0d6;border:1px solid #2f6b45;border-radius:8px;cursor:pointer">Fechar</button>
        </div>`;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orçamento — ${nomeCli}</title>
        <style>*{box-sizing:border-box}body{margin:12px;font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff}
        table{width:100%;border-collapse:collapse}
        @page{margin:8mm}@media print{body{margin:0}.noprint{display:none!important}}</style></head><body>
        ${toolbar}
        <div style="text-align:center;margin-bottom:6px">
          <div style="font-size:20px;font-weight:900;letter-spacing:2px;color:${G}">ORÇAMENTO</div>
          <div style="font-size:11px;color:#666;letter-spacing:1px">SIMULAÇÃO DE VENDA</div>
        </div>
        <div style="border:2px solid ${G};border-radius:6px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Cliente / Ótica</div><div style="font-size:15px;font-weight:900;color:#111">${nomeCli}</div>${refOtica ? `<div style="font-size:10px;color:#666">Ref: ${refOtica}</div>` : ''}</div>
          <div style="text-align:right"><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Emissão</div><div style="font-size:12px;font-family:monospace;color:#333">${fmtDate(hoje)}</div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Validade</div><div style="font-size:12px;font-family:monospace;color:#333">${fmtDate(ymd(venc))} (${dias} dias)</div></div>
        </div>
        ${rxBloco}
        <div style="font-size:11px;font-weight:900;color:${G};margin:12px 0 4px">ITENS</div>
        <table style="border:1px solid #ccc">
          <thead><tr style="background:${G}">
            <th style="padding:5px 8px;text-align:left;font-size:10px;color:#fff">Código</th>
            <th style="padding:5px 8px;text-align:left;font-size:10px;color:#fff">Descrição</th>
            <th style="padding:5px 8px;text-align:center;font-size:10px;color:#fff">Qtd</th>
            <th style="padding:5px 8px;text-align:right;font-size:10px;color:#fff">Vlr Unit</th>
            <th style="padding:5px 8px;text-align:right;font-size:10px;color:#fff">Total</th>
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
        <div style="margin-top:14px;display:flex;justify-content:flex-end">
          <div style="min-width:240px;border-top:3px solid ${G};padding-top:8px">
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:${G}"><span>TOTAL</span><span style="font-family:monospace">${brl(total)}</span></div>
            <div style="font-size:10px;color:#666;margin-top:2px">${itens.length} ite${itens.length === 1 ? 'm' : 'ns'}</div>
          </div>
        </div>
        <div style="margin-top:22px;font-size:10px;color:#666;border-top:1px dashed #bbb;padding-top:10px">
          Este é um <b>orçamento</b> — valores sujeitos a confirmação e disponibilidade. Validade de ${dias} dias a partir da emissão.
        </div>
        </body></html>`;

      const w = window.open('', '_blank');
      if (!w) { setMsg('Erro: o navegador bloqueou a janela. Permita pop-ups para gerar o orçamento.'); setGerando(false); return; }
      w.document.write(html); w.document.close();
      if (auto) setTimeout(() => { try { w.print(); } catch { /* ignora */ } }, 500);
      setMsg(`✓ Orçamento gerado com ${itens.length} item(ns).`);
    } catch (e: unknown) {
      setMsg(`Erro ao gerar: ${e instanceof Error ? e.message : 'tente novamente'}`);
    } finally { setGerando(false); }
  }

  return (
    <div onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ===== Cliente / Ótica ===== */}
      <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: R.txt, marginBottom: '4px' }}>Orçamento — Simulação de Venda</div>
        <div style={{ fontSize: '12px', color: R.dim, marginBottom: '14px' }}>Busque a ótica, informe a receita e escolha os serviços e lentes. O total é simulado ao vivo.</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ width: '150px' }}>
            <label style={LBL}>Cód. / Ótica</label>
            <input value={oticaCod} onChange={e => { setOticaCod(e.target.value); setOticaErro(false); }} onBlur={e => lookupOtica(e.target.value)} placeholder="Código ou nome" style={{ ...INP, width: '100%', borderColor: oticaErro ? '#cc0000' : undefined }} />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={LBL}>Nome da ótica</label>
            <input value={oticaNome} readOnly placeholder="—" style={{ ...INP, width: '100%', fontFamily: "'Montserrat', sans-serif", opacity: 0.9 }} />
          </div>
          <div style={{ width: '150px' }}>
            <label style={LBL}>Ref. / Cliente</label>
            <input value={refOtica} onChange={e => setRefOtica(e.target.value)} placeholder="Referência" style={{ ...INP, width: '100%' }} />
          </div>
          <div style={{ width: '150px' }}>
            <label style={LBL}>Nome do cliente</label>
            <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="(opcional)" style={{ ...INP, width: '100%', fontFamily: "'Montserrat', sans-serif" }} />
          </div>
          <div style={{ width: '110px' }}>
            <label style={LBL}>Validade (dias)</label>
            <input type="number" min="1" value={validadeDias} onChange={e => setValidadeDias(e.target.value)} style={{ ...INP, width: '100%' }} />
          </div>
        </div>
        {oticaErro && <div style={{ marginTop: '8px', fontSize: '12px', color: '#cc0000' }}>Ótica não encontrada — você pode usar o "Nome do cliente" à direita.</div>}
      </div>

      {/* ===== Exame (RX) ===== */}
      <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: R.txt, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exame / Receita</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '620px' }}>
            <thead>
              <tr>
                <th style={TH}>OLHO</th><th style={TH}>ESF LONGE</th><th style={TH}>CIL LONGE</th><th style={TH}>EIXO</th>
                <th style={TH}>ADIÇ</th><th style={TH}>ESF PERTO</th><th style={TH}>CIL PERTO</th><th style={TH}>DNP</th><th style={TH}>ALT</th>
              </tr>
            </thead>
            <tbody>
              {(['od', 'oe'] as const).map(olho => {
                const o = olho === 'od' ? od : oe;
                return (
                  <tr key={olho}>
                    <td style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 700, color: R.dim, whiteSpace: 'nowrap' }}>O/{olho === 'od' ? 'D' : 'E'}</td>
                    {(['esf_l', 'cil_l', 'eixo', 'adic', 'esf_p', 'cil_p', 'dnp', 'alt'] as const).map(k => (
                      <td key={k} style={{ padding: '2px 3px' }}><input value={o[k]} onChange={e => setOlho(olho, k, e.target.value)} style={RXI} /></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('Erro') ? 'rgba(200,0,0,0.1)' : 'var(--lab-chip-bg)', border: `1px solid ${msg.startsWith('Erro') ? '#cc0000' : 'var(--lab-accent)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: msg.startsWith('Erro') ? '#cc0000' : 'var(--lab-chip-txt)', fontWeight: 600 }}>{msg}</div>
      )}

      {/* ===== Catálogo + itens escolhidos ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.3fr)', gap: '12px', alignItems: 'start' }}>

        {/* Catálogo */}
        <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lab-bdr)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: R.txt, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviços e Lentes</div>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por código ou nome..." style={{ ...INP, width: '100%', fontFamily: "'Montserrat', sans-serif" }} />
          </div>
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {produtosFiltrados.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: R.dim, fontSize: '13px' }}>Nenhum serviço/lente encontrado.</div>
            ) : produtosFiltrados.map(p => (
              <div key={p.id} onClick={() => addProduto(p)} style={{ padding: '8px 14px', borderBottom: '1px solid var(--lab-bdr)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                onMouseEnter={e => (e.currentTarget.style.background = R.alt)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim, width: '52px', flexShrink: 0 }}>{p.codigo || '—'}</span>
                <span style={{ fontSize: '13px', color: R.txt, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
                <span style={{ fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.txt, fontWeight: 700 }}>{brl(p.valor_padrao || 0)}</span>
                <span style={{ fontSize: '16px', color: R.accent, fontWeight: 900, lineHeight: 1 }}>＋</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--lab-bdr)' }}>
            <button type="button" onClick={addAvulso} style={{ fontSize: '12px', fontWeight: 700, background: 'transparent', color: R.accent, border: `1px solid ${R.accent}66`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>＋ Item avulso</button>
          </div>
        </div>

        {/* Itens escolhidos (bilhete) */}
        <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lab-bdr)', fontSize: '12px', fontWeight: 800, color: R.txt, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Itens do Orçamento</div>
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {itens.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: R.dim, fontSize: '13px' }}>Clique nos serviços/lentes ao lado para adicionar.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: R.alt, borderBottom: '1px solid var(--lab-bdr)' }}>
                    {['Descrição', 'Qtd', 'Vlr Unit', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: '10px', fontWeight: 600, color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itens.map(i => (
                    <tr key={i.produto_id} style={{ borderBottom: '1px solid var(--lab-bdr)' }}>
                      <td style={{ padding: '5px 8px' }}>
                        <input value={i.descricao} onChange={e => patchItem(i.produto_id, { descricao: e.target.value })} placeholder="Item" style={{ ...INP, width: '100%', padding: '4px 6px', fontFamily: "'Montserrat', sans-serif", fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', width: '64px' }}>
                        <input type="number" min="1" value={i.qtd} onChange={e => patchItem(i.produto_id, { qtd: Math.max(1, parseInt(e.target.value, 10) || 1) })} style={{ ...INP, width: '56px', padding: '4px 6px', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', width: '92px' }}>
                        <input type="number" step="0.01" min="0" value={i.valor_unit} onChange={e => patchItem(i.produto_id, { valor_unit: parseFloat(e.target.value) || 0 })} style={{ ...INP, width: '84px', padding: '4px 6px', textAlign: 'right' }} />
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: "'Courier New', monospace", fontSize: '12px', fontWeight: 700, color: R.txt, whiteSpace: 'nowrap' }}>{brl(i.qtd * i.valor_unit)}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        <button type="button" onClick={() => removeItem(i.produto_id)} title="Remover" style={{ fontSize: '14px', color: '#cc0000', background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Barra bet — total ao vivo */}
          <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(90deg, #0f2a1c, #123a24)', borderTop: `2px solid ${R.accent}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9fd3b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total simulado</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', fontFamily: "'Courier New', monospace", letterSpacing: '-0.5px' }}>{brl(total)}</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => gerarOrcamento(false)} disabled={!itens.length || gerando}
                style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', cursor: (!itens.length || gerando) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (!itens.length || gerando) ? 0.5 : 1, border: `1px solid ${R.accent}66`, background: 'transparent', color: R.accent }}>👁 Visualizar</button>
              <button type="button" onClick={() => gerarOrcamento(true)} disabled={!itens.length || gerando}
                style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', cursor: (!itens.length || gerando) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (!itens.length || gerando) ? 0.5 : 1, border: 'none', background: R.accent, color: '#fff' }}>{gerando ? 'Gerando...' : '⬇ Gerar Orçamento (PDF)'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
