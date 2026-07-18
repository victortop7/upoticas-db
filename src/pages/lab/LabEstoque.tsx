import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Produto {
  id: string; marca: string; tratamento: string; indice: string;
  tipo: string; descricao?: string; quantidade: number; quantidade_minima: number;
}

const INDICES = ['1.50', '1.53', '1.56', '1.59', '1.61', '1.67', '1.74'];
const TIPOS = ['visao_simples', 'monofocal', 'bifocal', 'progressivo', 'ocupacional'];
const TRATAMENTOS = ['Sem tratamento', 'Antirreflexo', 'Blue Cut', 'Fotossensível', 'UV400', 'Antirreflexo + Blue Cut', 'Antirreflexo + Fotossensível'];
const TIPO_LABEL: Record<string, string> = {
  visao_simples: 'Visão Simples', monofocal: 'Monofocal', bifocal: 'Bifocal',
  progressivo: 'Progressivo', ocupacional: 'Ocupacional',
};

const FORM_VAZIO = { marca: '', tratamento: 'Sem tratamento', indice: '1.56', tipo: 'monofocal', descricao: '', quantidade: '0', quantidade_minima: '5' };
const MOV_VAZIO = { tipo: 'entrada' as 'entrada' | 'saida', quantidade: '', motivo: '' };

import { R } from '../../lib/labTheme';
const INP: React.CSSProperties = { width:'100%', padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', boxSizing:'border-box', fontFamily:"'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize:'10px', fontWeight:'700', color:R.txt, textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'3px' };

export default function LabEstoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroIndice, setFiltroIndice] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalProd, setModalProd] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [saving, setSaving] = useState(false);
  const [erroProd, setErroProd] = useState('');
  const [modalMov, setModalMov] = useState(false);
  const [produtoMov, setProdutoMov] = useState<Produto | null>(null);
  const [mov, setMov] = useState({ ...MOV_VAZIO });
  const [savingMov, setSavingMov] = useState(false);
  const [erroMov, setErroMov] = useState('');

  function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (filtroMarca) p.set('marca', filtroMarca);
    if (filtroIndice) p.set('indice', filtroIndice);
    if (filtroTipo) p.set('tipo', filtroTipo);
    api.get<Produto[]>(`/lab/estoque?${p}`)
      .then(setProdutos).catch(() => setProdutos([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filtroMarca, filtroIndice, filtroTipo]);

  function abrirNovo() { setEditando(null); setForm({ ...FORM_VAZIO }); setErroProd(''); setModalProd(true); }
  function abrirEditar(p: Produto) {
    setEditando(p);
    setForm({ marca: p.marca, tratamento: p.tratamento, indice: p.indice, tipo: p.tipo, descricao: p.descricao ?? '', quantidade: String(p.quantidade), quantidade_minima: String(p.quantidade_minima) });
    setErroProd(''); setModalProd(true);
  }
  function abrirMov(p: Produto) { setProdutoMov(p); setMov({ ...MOV_VAZIO }); setErroMov(''); setModalMov(true); }

  async function salvarProduto(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErroProd('');
    try {
      const payload = { marca: form.marca, tratamento: form.tratamento, indice: form.indice, tipo: form.tipo, descricao: form.descricao || null, quantidade: parseInt(form.quantidade) || 0, quantidade_minima: parseInt(form.quantidade_minima) || 5 };
      if (editando) await api.put(`/lab/estoque/${editando.id}`, payload);
      else await api.post('/lab/estoque', payload);
      setModalProd(false); load();
    } catch (err: unknown) { setErroProd(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  async function salvarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoMov) return;
    setSavingMov(true); setErroMov('');
    try {
      await api.post(`/lab/estoque/${produtoMov.id}`, { tipo: mov.tipo, quantidade: parseInt(mov.quantidade) || 0, motivo: mov.motivo || null });
      setModalMov(false); load();
    } catch (err: unknown) { setErroMov(err instanceof Error ? err.message : 'Erro ao registrar'); }
    setSavingMov(false);
  }

  const marcasUnicas = [...new Set(produtos.map(p => p.marca))].sort();
  const baixoEstoque = produtos.filter(p => p.quantidade <= p.quantidade_minima);

  const modalStyle: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' };
  const panelStyle: React.CSSProperties = { background:R.panel, border:`2px outset ${R.bdr}`, width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' };

  return (
    <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:R.bg, fontFamily:"'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', flexWrap:'wrap', gap:'6px' }}>
        <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}` }}>
          ESTOQUE DE LENTES — {produtos.length} produto(s)
        </div>
        <button onClick={abrirNovo} style={{ padding:'5px 16px', fontSize:'12px', fontWeight:'700', background:'#005500', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
          + NOVO PRODUTO
        </button>
      </div>

      {/* Alerta baixo estoque */}
      {baixoEstoque.length > 0 && (
        <div style={{ background:'#ddffee', border:'1px solid #005500', padding:'6px 12px', marginBottom:'8px', fontSize:'11px', color:'#005500', fontWeight:'700', fontFamily:"'Courier New', monospace" }}>
          ⚠ {baixoEstoque.length} produto(s) abaixo do mínimo: {baixoEstoque.map(p => `${p.marca} ${p.indice}`).join(', ')}
        </div>
      )}

      {/* Filtros */}
      <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, padding:'6px 12px', marginBottom:'8px', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
        {[
          { val: filtroMarca, set: setFiltroMarca, label: 'Marca', opts: marcasUnicas.map(m => ({ v: m, l: m })) },
          { val: filtroIndice, set: setFiltroIndice, label: 'Índice', opts: INDICES.map(i => ({ v: i, l: i })) },
          { val: filtroTipo, set: setFiltroTipo, label: 'Tipo', opts: TIPOS.map(t => ({ v: t, l: TIPO_LABEL[t] })) },
        ].map(({ val, set, label, opts }) => (
          <select key={label} value={val} onChange={e => set(e.target.value)}
            style={{ ...INP, width:'auto', minWidth:'130px' }}>
            <option value="">Todos {label}s</option>
            {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        {(filtroMarca || filtroIndice || filtroTipo) && (
          <button onClick={() => { setFiltroMarca(''); setFiltroIndice(''); setFiltroTipo(''); }}
            style={{ padding:'4px 10px', fontSize:'11px', fontWeight:'700', background:R.alt, color:R.accent, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
            ✕ LIMPAR
          </button>
        )}
      </div>

      {/* Tabela */}
      <div style={{ flex:1, overflowY:'auto', border:`2px inset ${R.bdr}` }}>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:R.txt, fontFamily:"'Courier New', monospace" }}>Carregando...</div>
        ) : produtos.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:R.txt }}>Nenhum produto cadastrado.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0 }}>
              <tr style={{ background:R.hdr }}>
                {['MARCA','ÍNDICE','TIPO','TRATAMENTO','DESCRIÇÃO','QTD','MÍN',''].map(h => (
                  <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, letterSpacing:'0.5px', border:`1px solid ${R.hdrBdr}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map((p, i) => {
                const baixo = p.quantidade <= p.quantidade_minima;
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? R.panel : R.alt, borderBottom:`1px solid ${R.bdr}` }}>
                    <td style={{ padding:'6px 10px', fontSize:'12px', fontWeight:'700', color:R.txt }}>{p.marca}</td>
                    <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', color:R.accent2, fontWeight:'700' }}>{p.indice}</td>
                    <td style={{ padding:'6px 10px', fontSize:'11px', color:R.txt }}>{TIPO_LABEL[p.tipo] ?? p.tipo}</td>
                    <td style={{ padding:'6px 10px', fontSize:'11px', color:R.txt }}>{p.tratamento}</td>
                    <td style={{ padding:'6px 10px', fontSize:'11px', color:R.dim }}>{p.descricao ?? '—'}</td>
                    <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'14px', fontWeight:'900', color: baixo ? '#005500' : p.quantidade > p.quantidade_minima * 2 ? '#006600' : '#886600', textAlign:'center' }}>
                      {p.quantidade}
                    </td>
                    <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:R.dim, textAlign:'center' }}>{p.quantidade_minima}</td>
                    <td style={{ padding:'6px 10px', whiteSpace:'nowrap' }}>
                      <button onClick={() => abrirMov(p)} style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', background:'#d4d0c8', color:'#000', border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', marginRight:'4px' }}>+/−</button>
                      <button onClick={() => abrirEditar(p)} style={{ fontSize:'11px', padding:'2px 8px', background:R.alt, color:R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Produto */}
      {modalProd && (
        <div style={modalStyle}>
          <div style={panelStyle}>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{editando ? 'EDITAR PRODUTO' : 'INCLUIR PRODUTO'}</span>
              <button onClick={() => setModalProd(false)} style={{ background:'none', border:'1px solid #99ffaa', color:'#99ffaa', padding:'1px 6px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700' }}>✕</button>
            </div>
            <div style={{ padding:'16px' }}>
              {erroProd && <div style={{ background:'#ddffee', border:'1px solid #005500', padding:'6px 10px', marginBottom:'10px', fontSize:'11px', color:'#005500', fontWeight:'700' }}>{erroProd}</div>}
              <form onSubmit={salvarProduto} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div><label style={LBL}>Marca *</label><input required value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} style={INP} placeholder="Ex: Zeiss, Essilor, Hoya..." /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div><label style={LBL}>Índice *</label>
                    <select required value={form.indice} onChange={e => setForm(f => ({ ...f, indice: e.target.value }))} style={INP}>
                      {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Tipo</label>
                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={INP}>
                      {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={LBL}>Tratamento</label>
                  <select value={form.tratamento} onChange={e => setForm(f => ({ ...f, tratamento: e.target.value }))} style={INP}>
                    {TRATAMENTOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={LBL}>Descrição</label><input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={INP} placeholder="Detalhes..." /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div><label style={LBL}>Quantidade</label><input type="number" min="0" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} style={INP} /></div>
                  <div><label style={LBL}>Qtd mínima (alerta)</label><input type="number" min="0" value={form.quantidade_minima} onChange={e => setForm(f => ({ ...f, quantidade_minima: e.target.value }))} style={INP} /></div>
                </div>
                <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                  <button type="button" onClick={() => setModalProd(false)} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background:R.alt, color:R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>CANCELAR</button>
                  <button type="submit" disabled={saving} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background:'#005500', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
                    {saving ? 'SALVANDO...' : 'GRAVAR'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimentação */}
      {modalMov && produtoMov && (
        <div style={modalStyle}>
          <div style={{ ...panelStyle, maxWidth:'380px' }}>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>MOVIMENTAR ESTOQUE</span>
              <button onClick={() => setModalMov(false)} style={{ background:'none', border:'1px solid #99ffaa', color:'#99ffaa', padding:'1px 6px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700' }}>✕</button>
            </div>
            <div style={{ padding:'14px' }}>
              <div style={{ background:R.alt, border:`1px inset ${R.bdr}`, padding:'8px 12px', marginBottom:'12px' }}>
                <div style={{ fontSize:'12px', fontWeight:'700', color:R.txt }}>{produtoMov.marca} — {produtoMov.indice}</div>
                <div style={{ fontSize:'11px', color:R.dim }}>{produtoMov.tratamento} · {TIPO_LABEL[produtoMov.tipo]}</div>
                <div style={{ fontSize:'13px', fontFamily:"'Courier New', monospace", color:R.accent2, marginTop:'4px', fontWeight:'700' }}>
                  Estoque atual: {produtoMov.quantidade}
                </div>
              </div>
              {erroMov && <div style={{ background:'#ddffee', border:'1px solid #005500', padding:'6px 10px', marginBottom:'10px', fontSize:'11px', color:'#005500', fontWeight:'700' }}>{erroMov}</div>}
              <form onSubmit={salvarMovimentacao} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div>
                  <label style={LBL}>Tipo de movimentação</label>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {(['entrada','saida'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setMov(m => ({ ...m, tipo: t }))}
                        style={{ flex:1, padding:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
                          background: mov.tipo === t ? (t==='entrada' ? '#ccffcc' : '#ccffcc') : R.alt,
                          color: mov.tipo === t ? (t==='entrada' ? '#006600' : '#005500') : '#333',
                          border: mov.tipo === t ? `2px inset ${t==='entrada' ? '#006600' : '#005500'}` : `1px outset ${R.bdr}` }}>
                        {t === 'entrada' ? '+ ENTRADA' : '− SAÍDA'}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label style={LBL}>Quantidade</label><input required type="number" min="1" value={mov.quantidade} onChange={e => setMov(m => ({ ...m, quantidade: e.target.value }))} style={INP} placeholder="0" /></div>
                <div><label style={LBL}>Motivo</label><input value={mov.motivo} onChange={e => setMov(m => ({ ...m, motivo: e.target.value }))} style={INP} placeholder={mov.tipo === 'entrada' ? 'Ex: Compra fornecedor' : 'Ex: Uso em OS #0001'} /></div>
                <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                  <button type="button" onClick={() => setModalMov(false)} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background:R.alt, color:R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>CANCELAR</button>
                  <button type="submit" disabled={savingMov} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background: mov.tipo==='entrada' ? '#006600' : '#005500', color:'#fff', border:`1px outset ${mov.tipo==='entrada' ? '#006600' : R.hdrBdr}`, cursor:savingMov?'not-allowed':'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
                    {savingMov ? 'SALVANDO...' : mov.tipo === 'entrada' ? 'REGISTRAR ENTRADA' : 'REGISTRAR SAÍDA'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
