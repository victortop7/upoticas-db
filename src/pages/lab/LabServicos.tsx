import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Servico {
  id: string; codigo: string; nome: string; unidade: string;
  valor_padrao: number; valor_lista2: number;
  valor_lista3: number; valor_lista4: number; valor_lista5: number;
  ativo: number;
}

const LISTA_FIELDS = ['valor_padrao','valor_lista2','valor_lista3','valor_lista4','valor_lista5'] as const;
type ListaField = typeof LISTA_FIELDS[number];

const SEED_PRODUTOS = [
  { codigo:'0300', nome:'ACCLIMATES UHD DIGITAL',                   unidade:'UN', preco1:0,      preco2:0 },
  { codigo:'0260', nome:'ALTERAÇÃO DE MODELO',                      unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0012', nome:'ANTIRREFLEXO',                             unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0007', nome:'ANTIRRISCO',                               unidade:'',   preco1:10.00,  preco2:10.00 },
  { codigo:'0276', nome:'ARMAÇÃO',                                  unidade:'',   preco1:75.00,  preco2:0 },
  { codigo:'0309', nome:'ARMAÇÃO ACETATO',                          unidade:'',   preco1:20.00,  preco2:20.00 },
  { codigo:'0206', nome:'BF FLAT TOP CR39 INCOLOR',                 unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0207', nome:'BF FLAT TOP FOTO CR39',                    unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0120', nome:'BF FLATTOP CR39',                          unidade:'',   preco1:33.60,  preco2:0 },
  { codigo:'0229', nome:'BF FLATTOP CR39 FOTO',                     unidade:'',   preco1:72.00,  preco2:0 },
  { codigo:'0147', nome:'BF FLATTOP CR39 FOTO',                     unidade:'',   preco1:32.00,  preco2:0 },
  { codigo:'0135', nome:'BF KRIPTOK CR39 INCOLOR',                  unidade:'',   preco1:107.00, preco2:0 },
  { codigo:'0205', nome:'BF KRIPTOK FOTO',                          unidade:'UN', preco1:71.00,  preco2:69.50 },
  { codigo:'0122', nome:'BF KRIPTOK FOTO AR',                       unidade:'UN', preco1:39.00,  preco2:38.22 },
  { codigo:'0203', nome:'BF KRIPTOK INCOLOR',                       unidade:'UN', preco1:55.00,  preco2:0 },
  { codigo:'0116', nome:'BF KRIPTOK INCOLOR LENTE PRONTA',          unidade:'',   preco1:67.00,  preco2:0 },
  { codigo:'0146', nome:'BF KRIPTOK LENTE PRONTA',                  unidade:'',   preco1:20.00,  preco2:0 },
  { codigo:'0233', nome:'BF OMEGA ORMA',                            unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0094', nome:'BF ULTEX CR39 FOTO',                       unidade:'',   preco1:53.00,  preco2:0 },
  { codigo:'0093', nome:'BF ULTEX CR39 INCOLOR',                    unidade:'UN', preco1:280.00, preco2:280.00 },
  { codigo:'0204', nome:'BF ULTEX FOTO',                            unidade:'UN', preco1:71.00,  preco2:69.50 },
  { codigo:'0202', nome:'BF ULTEX INCOLOR',                         unidade:'',   preco1:39.00,  preco2:38.22 },
  { codigo:'0174', nome:'BF ULTEX INCOLOR LENTE PRONTA',            unidade:'',   preco1:55.00,  preco2:0 },
  { codigo:'0145', nome:'BF ULTEX LENTE PRONTA',                    unidade:'',   preco1:20.00,  preco2:0 },
  { codigo:'0259', nome:'BF. KRIPTOK INCOLOR CRISTAL',              unidade:'',   preco1:20.00,  preco2:0 },
  { codigo:'0069', nome:'BS CR39 FOTO',                             unidade:'',   preco1:53.00,  preco2:0 },
  { codigo:'0272', nome:'BUS 1.60 INCOLOR',                         unidade:'UN', preco1:80.00,  preco2:53.90 },
  { codigo:'0235', nome:'BUS 1.60 INCOLOR BLUE',                    unidade:'',   preco1:100.00, preco2:100.00 },
  { codigo:'0271', nome:'BUS 1.61 ALTO INDICE INCOLOR',             unidade:'',   preco1:120.00, preco2:120.00 },
  { codigo:'0148', nome:'BUS 1.67 FOTO C/ AR',                      unidade:'',   preco1:410.00, preco2:0 },
  { codigo:'0155', nome:'BUS 1.67 FOTO COM AR LUZ AZUL',            unidade:'',   preco1:437.00, preco2:0 },
  { codigo:'0138', nome:'BUS 1.67 INCOLOR',                         unidade:'',   preco1:224.00, preco2:0 },
  { codigo:'0074', nome:'BUS 1.67 INCOLOR C/ AR EXTERNO',           unidade:'',   preco1:220.00, preco2:0 },
  { codigo:'0141', nome:'BUS 1.67 PHOTO FUSION',                    unidade:'',   preco1:242.00, preco2:0 },
  { codigo:'0142', nome:'BUS 1.67 TRANSITIONS',                     unidade:'',   preco1:407.00, preco2:0 },
  { codigo:'0281', nome:'BUS 1.74 INCOLOR',                         unidade:'',   preco1:617.00, preco2:0 },
  { codigo:'0149', nome:'BUS ALTO INDICE BLUE CUT 1.67',            unidade:'',   preco1:560.00, preco2:0 },
  { codigo:'0185', nome:'BUS ALTO INDICE FOTO 1.67',                unidade:'UN', preco1:345.00, preco2:330.10 },
  { codigo:'0186', nome:'BUS ALTO INDICE FOTO BLUE CUT 1.67',       unidade:'UN', preco1:396.00, preco2:361.62 },
  { codigo:'0076', nome:'BUS ALTO INDICE INCOLOR 1.74',             unidade:'',   preco1:301.00, preco2:0 },
  { codigo:'0184', nome:'BUS ALTO INDICE INCOLOR ANTIRREFLEXO',     unidade:'UN', preco1:175.00, preco2:171.50 },
  { codigo:'0177', nome:'BUS CR39 ANTIRREFLEXO',                    unidade:'UN', preco1:47.00,  preco2:41.74 },
  { codigo:'0140', nome:'BUS CR39 BLUE CUT',                        unidade:'',   preco1:59.00,  preco2:0 },
  { codigo:'0179', nome:'BUS CR39 FOTO BLUE CUT',                   unidade:'UN', preco1:62.00,  preco2:60.76 },
  { codigo:'0131', nome:'BUS CR39 FOTO BLUE CUT 125',               unidade:'UN', preco1:125.00, preco2:122.50 },
  { codigo:'0117', nome:'BUS CR39 INCOLOR 75MM',                    unidade:'UN', preco1:41.00,  preco2:40.18 },
  { codigo:'0180', nome:'BUS CR39 TRANSITIONS',                     unidade:'UN', preco1:222.00, preco2:197.96 },
  { codigo:'0078', nome:'BUS FOTO C/ AR EXTERNO',                   unidade:'',   preco1:53.00,  preco2:0 },
  { codigo:'0126', nome:'BUS INCOLOR 1.67',                         unidade:'',   preco1:168.00, preco2:0 },
  { codigo:'0072', nome:'BUS POLI C/ AR EXTERNO',                   unidade:'',   preco1:90.00,  preco2:0 },
  { codigo:'0158', nome:'BUS POLI FOTO C/ AR EXTERNO',              unidade:'',   preco1:210.00, preco2:0 },
  { codigo:'0182', nome:'BUS POLICARBONATO ANTIRREFLEXO OPTO',      unidade:'',   preco1:73.00,  preco2:0 },
  { codigo:'0073', nome:'BUS POLICARBONATO FOTO (MASSA)',            unidade:'',   preco1:192.00, preco2:0 },
  { codigo:'0183', nome:'BUS POLICARBONATO FOTO INSTYLE PELICULA',  unidade:'',   preco1:286.00, preco2:0 },
  { codigo:'0071', nome:'BUS POLICARBONATO INCOLOR',                unidade:'',   preco1:48.00,  preco2:0 },
  { codigo:'0293', nome:'BUS POLICARBONATO INCOLOR (120)',           unidade:'',   preco1:120.00, preco2:120.00 },
  { codigo:'0181', nome:'BUS POLY INC. (1.59) BASES 050/2/4/6/8',   unidade:'',   preco1:40.00,  preco2:0 },
  { codigo:'0218', nome:'BUS POLY TRANSITIONS VIII',                 unidade:'',   preco1:450.00, preco2:0 },
];


const R = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#005500,#008800)', hdrTxt:'#ccffcc', hdrBdr:'#007700', txt:'#000', inp:'#fff' };
const INP: React.CSSProperties = { width:'100%', padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', boxSizing:'border-box', fontFamily:"'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize:'10px', fontWeight:'700', color:'#444', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'3px' };

export default function LabServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Servico | null>(null);
  const [form, setForm] = useState({ codigo: '', nome: '', unidade: '', valor_padrao: '', valor_lista2: '', valor_lista3: '', valor_lista4: '', valor_lista5: '' });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [listaNomes, setListaNomes] = useState<string[]>(['PREÇO 1','PREÇO 2','PREÇO 3','PREÇO 4','PREÇO 5']);
  const [listasAtivas, setListasAtivas] = useState(2);
  const [listaFiltro, setListaFiltro] = useState<number | null>(null);
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string; value: string } | null>(null);
  const [editingNomeLista, setEditingNomeLista] = useState(false);
  const [nomeLista, setNomeLista] = useState('');
  const [novaListaModal, setNovaListaModal] = useState(false);
  const [novaListaNome, setNovaListaNome] = useState('');
  const [confirmarDeleteLista, setConfirmarDeleteLista] = useState<number | null>(null);
  const [confirmarDeleteProduto, setConfirmarDeleteProduto] = useState<{ id: string; nome: string } | null>(null);

  function load() {
    setLoading(true);
    api.get<Servico[]>('/lab/servicos').then(setServicos).catch(() => setServicos([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // Carrega nomes e quantidade de listas da configuração
    api.get<Record<string, string>>('/lab/configuracoes').then(cfg => {
      const nomes = [
        cfg['tab_lista_1'] || 'PREÇO 1',
        cfg['tab_lista_2'] || 'PREÇO 2',
        cfg['tab_lista_3'] || 'PREÇO 3',
        cfg['tab_lista_4'] || 'PREÇO 4',
        cfg['tab_lista_5'] || 'PREÇO 5',
      ];
      setListaNomes(nomes);
      // Conta quantas listas têm nome configurado (mínimo 2)
      let ativas = 2;
      for (let i = 2; i < 5; i++) {
        if (cfg[`tab_lista_${i + 1}`]) ativas = i + 1;
      }
      setListasAtivas(Math.max(2, ativas));
    }).catch(() => {});
  }, []);

  function fv(v: string) { const n = parseFloat(v.replace(',','.')); return isNaN(n) || n === 0 ? null : n; }

  function openNovo() {
    setEditItem(null);
    setForm({ codigo:'', nome:'', unidade:'UN', valor_padrao:'', valor_lista2:'', valor_lista3:'', valor_lista4:'', valor_lista5:'' });
    setErro(''); setModal(true);
  }
  function openEdit(s: Servico) {
    setEditItem(s);
    setForm({
      codigo: s.codigo||'', nome: s.nome, unidade: s.unidade||'',
      valor_padrao: s.valor_padrao>0 ? String(s.valor_padrao) : '',
      valor_lista2: s.valor_lista2>0 ? String(s.valor_lista2) : '',
      valor_lista3: s.valor_lista3>0 ? String(s.valor_lista3) : '',
      valor_lista4: s.valor_lista4>0 ? String(s.valor_lista4) : '',
      valor_lista5: s.valor_lista5>0 ? String(s.valor_lista5) : '',
    });
    setErro(''); setModal(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setErro('');
    const payload = {
      codigo: form.codigo||null, nome: form.nome, unidade: form.unidade||null,
      valor_padrao: fv(form.valor_padrao) ?? 0,
      valor_lista2: fv(form.valor_lista2),
      valor_lista3: fv(form.valor_lista3),
      valor_lista4: fv(form.valor_lista4),
      valor_lista5: fv(form.valor_lista5),
    };
    try {
      if (editItem) await api.put(`/lab/servicos/${editItem.id}`, payload);
      else await api.post('/lab/servicos', payload);
      setModal(false); load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try { await api.delete(`/lab/servicos/${id}`); load(); } catch {}
    setConfirmarDeleteProduto(null);
  }

  async function confirmarEExcluirLista() {
    const idx = confirmarDeleteLista;
    if (idx === null) return;
    setConfirmarDeleteLista(null);
    const field = LISTA_FIELDS[idx];
    const cfgKey = `tab_lista_${idx + 1}`;
    try {
      await Promise.all([
        api.delete(`/lab/servicos?action=clear-lista&field=${field}`),
        api.put('/lab/configuracoes', { [cfgKey]: '' }),
      ]);
      // Só remove do menu se for a última lista (as demais ficam como lista vazia)
      if (idx === listasAtivas - 1 && listasAtivas > 2) {
        setListasAtivas(a => a - 1);
      } else {
        setListaNomes(n => n.map((v, i) => i === idx ? `PREÇO ${idx + 1}` : v));
      }
      setListaFiltro(null);
      load();
    } catch { alert('Erro ao excluir lista'); }
  }

  async function saveInlinePrice(id: string, field: string, value: string) {
    const s = servicos.find(x => x.id === id);
    if (!s) return;
    const n = parseFloat(value.replace(',', '.'));
    const payload = {
      codigo: s.codigo || null, nome: s.nome, unidade: s.unidade || null,
      valor_padrao: s.valor_padrao,
      valor_lista2: s.valor_lista2,
      valor_lista3: s.valor_lista3,
      valor_lista4: s.valor_lista4,
      valor_lista5: s.valor_lista5,
      [field]: isNaN(n) ? 0 : n,
    };
    try { await api.put(`/lab/servicos/${id}`, payload); load(); } catch {}
  }

  async function handleSeed() {
    if (!confirm(`Importar ${SEED_PRODUTOS.length} produtos? Já existentes serão ignorados.`)) return;
    setSeeding(true);
    try {
      const r = await api.post<{ ok: boolean; inserted: number }>('/lab/servicos', { seed: true, items: SEED_PRODUTOS });
      alert(`${r.inserted} produtos importados!`); load();
    } catch { alert('Erro ao importar'); }
    setSeeding(false);
  }

  async function criarNovaLista() {
    if (!novaListaNome.trim()) return;
    const proximo = listasAtivas + 1;
    if (proximo > 5) return;
    const chave = `tab_lista_${proximo}`;
    await api.put('/lab/configuracoes', { [chave]: novaListaNome.trim() });
    const novosNomes = [...listaNomes];
    novosNomes[proximo - 1] = novaListaNome.trim();
    setListaNomes(novosNomes);
    setListasAtivas(proximo);
    setNovaListaNome('');
    setNovaListaModal(false);
    setListaFiltro(proximo - 1);
  }

  function contarProdutosLista(idx: number) {
    return servicos.filter(s => (s[LISTA_FIELDS[idx] as ListaField] as number) > 0).length;
  }

  const filtrado = servicos.filter(s => !busca || s.nome.toLowerCase().includes(busca.toLowerCase()) || (s.codigo||'').includes(busca));

  return (
    <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:R.bg, fontFamily:"'Montserrat', sans-serif" }}>

      {listaFiltro === null ? (
        /* ══════════════════════════════════════════
           LANDING — SÓ MOSTRA AS LISTAS
           ══════════════════════════════════════════ */
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}` }}>
              LISTAS DE PREÇOS — {listasAtivas} lista(s) | {servicos.length} produto(s) no catálogo
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button onClick={handleSeed} disabled={seeding}
                style={{ padding:'5px 12px', fontSize:'11px', fontWeight:'700', background:R.alt, color:'#000', border:`1px outset ${R.bdr}`, cursor:seeding?'not-allowed':'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
                {seeding ? 'IMPORTANDO...' : '📥 IMPORTAR CATÁLOGO'}
              </button>
              {listasAtivas < 5 && (
                <button onClick={() => { setNovaListaNome(''); setNovaListaModal(true); }}
                  style={{ padding:'5px 16px', fontSize:'12px', fontWeight:'700', background:'#005500', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
                  + NOVA LISTA
                </button>
              )}
            </div>
          </div>

          {/* Cards das listas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
            {LISTA_FIELDS.slice(0, listasAtivas).map((_, i) => {
              const count = contarProdutosLista(i);
              return (
                <div key={i} style={{ position:'relative', background:R.panel, border:`2px outset ${R.bdr}` }}>
                  <button onClick={() => { setBusca(''); setListaFiltro(i); }}
                    style={{ width:'100%', padding:'20px 16px', background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', flexDirection:'column', gap:'8px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e8e4d8')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:'#888', textTransform:'uppercase', letterSpacing:'0.5px' }}>LISTA {i + 1}</span>
                    <span style={{ fontSize:'16px', fontWeight:'700', color:'#003300' }}>{listaNomes[i]}</span>
                    <span style={{ fontSize:'11px', fontFamily:"'Courier New', monospace", color:'#555' }}>
                      {count} produto(s) com preço
                    </span>
                    <span style={{ fontSize:'10px', color:'#008800', fontWeight:'700', marginTop:'4px' }}>▶ ENTRAR NA LISTA</span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════
           VIEW DE LISTA ESPECÍFICA
           ══════════════════════════════════════════ */
        <>
          {/* Header da lista */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <button onClick={() => { setListaFiltro(null); setInlineEdit(null); setEditingNomeLista(false); setBusca(''); }}
              style={{ padding:'5px 12px', fontSize:'11px', fontWeight:'700', background:R.alt, color:'#333', border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
              ← VOLTAR
            </button>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}`, flex:1, display:'flex', alignItems:'center', gap:'10px' }}>
              {editingNomeLista ? (
                <>
                  <input autoFocus value={nomeLista} onChange={e => setNomeLista(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        await api.put('/lab/configuracoes', { [`tab_lista_${listaFiltro + 1}`]: nomeLista });
                        setListaNomes(n => n.map((v, i) => i === listaFiltro ? nomeLista : v));
                        setEditingNomeLista(false);
                      } else if (e.key === 'Escape') { setEditingNomeLista(false); }
                    }}
                    style={{ padding:'2px 8px', fontSize:'13px', fontFamily:"'Courier New', monospace", fontWeight:'700', background:'#ffffcc', border:'2px inset #888', color:'#000', outline:'none', width:'200px' }}
                  />
                  <button onClick={async () => {
                    await api.put('/lab/configuracoes', { [`tab_lista_${listaFiltro + 1}`]: nomeLista });
                    setListaNomes(n => n.map((v, i) => i === listaFiltro ? nomeLista : v));
                    setEditingNomeLista(false);
                  }} style={{ padding:'2px 8px', fontSize:'11px', fontWeight:'700', background:'#ccffcc', color:'#005500', border:'1px outset #005500', cursor:'pointer', fontFamily:'inherit' }}>✓ SALVAR</button>
                  <button onClick={() => setEditingNomeLista(false)} style={{ padding:'2px 8px', fontSize:'11px', background:'#ffcccc', color:'#880000', border:'1px outset #880000', cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                </>
              ) : (
                <>
                  <span>{listaNomes[listaFiltro]} — {filtrado.filter(s => (s[LISTA_FIELDS[listaFiltro] as ListaField] as number) > 0).length} produto(s)</span>
                  <button onClick={() => { setNomeLista(listaNomes[listaFiltro]); setEditingNomeLista(true); }}
                    style={{ padding:'2px 8px', fontSize:'11px', fontWeight:'700', background:'rgba(255,255,255,0.15)', color:R.hdrTxt, border:'1px solid rgba(255,255,255,0.3)', cursor:'pointer', fontFamily:'inherit' }}>
                    ✏️ Renomear
                  </button>
                  <div style={{ marginLeft:'auto', display:'flex', gap:'6px' }}>
                    {listaFiltro !== null && (
                      <button onClick={() => setConfirmarDeleteLista(listaFiltro)}
                        style={{ padding:'2px 10px', fontSize:'11px', fontWeight:'700', background:'#ffdddd', color:'#880000', border:'1px outset #cc0000', cursor:'pointer', fontFamily:'inherit' }}>
                        🗑 EXCLUIR LISTA
                      </button>
                    )}
                    <button onClick={openNovo}
                      style={{ padding:'2px 10px', fontSize:'11px', fontWeight:'700', background:'#ccffcc', color:'#003300', border:'1px outset #005500', cursor:'pointer', fontFamily:'inherit' }}>
                      + NOVO PRODUTO
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Busca */}
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por código ou nome..."
            style={{ ...INP, marginBottom:'8px', fontFamily:"'Montserrat', sans-serif" }} />

          {/* Tabela da lista */}
          <div style={{ flex:1, overflowY:'auto', border:`2px inset ${R.bdr}` }}>
            {loading ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#444', fontFamily:"'Courier New', monospace" }}>Carregando...</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ position:'sticky', top:0 }}>
                  <tr style={{ background:R.hdr }}>
                    <th style={{ padding:'6px 10px', textAlign:'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, letterSpacing:'0.5px', border:`1px solid ${R.hdrBdr}` }}>CÓDIGO</th>
                    <th style={{ padding:'6px 10px', textAlign:'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, letterSpacing:'0.5px', border:`1px solid ${R.hdrBdr}` }}>DESCRIÇÃO</th>
                    <th style={{ padding:'6px 10px', textAlign:'right', fontSize:'10px', fontWeight:'700', color:'#ccffcc', letterSpacing:'0.5px', border:`1px solid ${R.hdrBdr}`, background:'#003300', minWidth:'150px' }}>
                      {listaNomes[listaFiltro]} — clique para editar
                    </th>
                    <th style={{ padding:'6px 10px', border:`1px solid ${R.hdrBdr}`, width:'80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {[...filtrado].sort((a, b) => {
                    const va = (a[LISTA_FIELDS[listaFiltro] as ListaField] as number) || 0;
                    const vb = (b[LISTA_FIELDS[listaFiltro] as ListaField] as number) || 0;
                    return vb - va;
                  }).map((s, i) => {
                    const field = LISTA_FIELDS[listaFiltro];
                    const val = (s[field as ListaField] as number) || 0;
                    const isEditing = inlineEdit?.id === s.id && inlineEdit.field === field;
                    return (
                      <tr key={s.id} style={{ background: i%2===0 ? R.panel : R.alt, borderBottom:`1px solid ${R.bdr}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#d0f0d0')}
                        onMouseLeave={e => (e.currentTarget.style.background = i%2===0 ? R.panel : R.alt)}>
                        <td style={{ padding:'6px 10px', fontFamily:"'Courier New', monospace", fontSize:'12px', color:'#555' }}>{s.codigo||'—'}</td>
                        <td style={{ padding:'6px 10px', fontSize:'12px', fontWeight:'700', color:R.txt }}>{s.nome}</td>
                        <td style={{ padding:'4px 6px', textAlign:'right' }}>
                          {isEditing ? (
                            <input autoFocus value={inlineEdit.value}
                              onChange={e => setInlineEdit(v => v ? { ...v, value: e.target.value } : v)}
                              onBlur={async () => { if (inlineEdit) await saveInlinePrice(inlineEdit.id, inlineEdit.field, inlineEdit.value); setInlineEdit(null); }}
                              onKeyDown={async e => {
                                if (e.key === 'Enter') { e.preventDefault(); if (inlineEdit) await saveInlinePrice(inlineEdit.id, inlineEdit.field, inlineEdit.value); setInlineEdit(null); }
                                else if (e.key === 'Escape') { setInlineEdit(null); }
                              }}
                              style={{ width:'120px', padding:'3px 6px', fontSize:'13px', fontFamily:"'Courier New', monospace", textAlign:'right', background:'#ffffcc', border:'2px inset #888', color:'#000', outline:'none' }}
                            />
                          ) : (
                            <button onClick={() => setInlineEdit({ id: s.id, field, value: val > 0 ? String(val) : '' })}
                              style={{ width:'100%', textAlign:'right', padding:'4px 8px', fontFamily:"'Courier New', monospace", fontSize:'13px', fontWeight:'700', background: val > 0 ? '#efffef' : '#fff8f8', color: val > 0 ? '#005500' : '#cc0000', border:`1px solid ${val > 0 ? '#aaddaa' : '#ddaaaa'}`, cursor:'pointer', borderRadius:'2px' }}>
                              {val > 0 ? `R$ ${val.toFixed(2).replace('.',',')}` : '— definir preço'}
                            </button>
                          )}
                        </td>
                        <td style={{ padding:'4px 6px', whiteSpace:'nowrap', textAlign:'center' }}>
                          <button onClick={() => openEdit(s)} style={{ fontSize:'11px', padding:'2px 8px', background:R.alt, color:'#333', border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', marginRight:'3px' }}>✏️</button>
                          <button onClick={() => setConfirmarDeleteProduto({ id: s.id, nome: s.nome })} style={{ fontSize:'11px', padding:'2px 6px', background:'#ffeeee', color:'#880000', border:'1px outset #cc0000', cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal Confirmar Excluir Produto */}
      {confirmarDeleteProduto && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, width:'100%', maxWidth:'360px' }}>
            <div style={{ background:'#880000', color:'#fff', padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px' }}>
              ⚠ EXCLUIR PRODUTO
            </div>
            <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ fontSize:'13px', color:'#222', lineHeight:'1.6' }}>
                Deseja excluir o produto:<br />
                <strong style={{ color:'#880000' }}>{confirmarDeleteProduto.nome}</strong>?<br />
                <span style={{ fontSize:'11px', color:'#666' }}>O produto será removido do catálogo.</span>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setConfirmarDeleteProduto(null)}
                  style={{ flex:1, padding:'10px', fontSize:'13px', fontWeight:'700', background:R.alt, color:'#333', border:`2px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.5px' }}>
                  NÃO
                </button>
                <button onClick={() => handleDelete(confirmarDeleteProduto.id)}
                  style={{ flex:1, padding:'10px', fontSize:'13px', fontWeight:'700', background:'#880000', color:'#fff', border:'2px outset #cc0000', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.5px' }}>
                  SIM, EXCLUIR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Excluir Lista */}
      {confirmarDeleteLista !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, width:'100%', maxWidth:'360px' }}>
            <div style={{ background:'#880000', color:'#fff', padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px' }}>
              ⚠ EXCLUIR LISTA
            </div>
            <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ fontSize:'13px', color:'#222', lineHeight:'1.6' }}>
                Deseja excluir a lista <strong>"{listaNomes[confirmarDeleteLista]}"</strong>?<br />
                <span style={{ fontSize:'11px', color:'#666' }}>Todos os preços desta lista serão zerados. Os produtos não serão excluídos.</span>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setConfirmarDeleteLista(null)}
                  style={{ flex:1, padding:'10px', fontSize:'13px', fontWeight:'700', background:R.alt, color:'#333', border:`2px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.5px' }}>
                  NÃO
                </button>
                <button onClick={confirmarEExcluirLista}
                  style={{ flex:1, padding:'10px', fontSize:'13px', fontWeight:'700', background:'#880000', color:'#fff', border:'2px outset #cc0000', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.5px' }}>
                  SIM, EXCLUIR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Lista */}
      {novaListaModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, width:'100%', maxWidth:'360px' }}>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>NOVA LISTA DE PREÇOS — LISTA {listasAtivas + 1}</span>
              <button onClick={() => setNovaListaModal(false)} style={{ background:'none', border:'1px solid #99ffaa', color:'#99ffaa', padding:'1px 6px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700' }}>✕</button>
            </div>
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={LBL}>Nome da lista (ex: Hoya, Essilor, Tabela 3)</label>
                <input autoFocus value={novaListaNome} onChange={e => setNovaListaNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && criarNovaLista()}
                  style={{ ...INP, fontFamily:"'Montserrat', sans-serif", fontSize:'14px' }} placeholder="Nome da lista..." />
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setNovaListaModal(false)} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background:R.alt, color:R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>CANCELAR</button>
                <button onClick={criarNovaLista} disabled={!novaListaNome.trim()} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background: novaListaNome.trim() ? '#005500' : '#aaa', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor: novaListaNome.trim() ? 'pointer' : 'not-allowed', fontFamily:'inherit', textTransform:'uppercase' }}>
                  CRIAR LISTA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Produto */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, width:'100%', maxWidth:'480px' }}>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{editItem ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</span>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'1px solid #99ffaa', color:'#99ffaa', padding:'1px 6px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700' }}>✕</button>
            </div>
            <div style={{ padding:'16px' }}>
              {erro && <div style={{ background:'#ddffee', border:'1px solid #005500', padding:'6px 10px', marginBottom:'10px', fontSize:'11px', color:'#005500', fontWeight:'700' }}>{erro}</div>}
              <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 70px', gap:'8px' }}>
                  <div><label style={LBL}>Código</label><input value={form.codigo} onChange={e => setForm(f=>({...f,codigo:e.target.value}))} style={INP} placeholder="0001" /></div>
                  <div><label style={LBL}>Descrição *</label><input required value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} style={{ ...INP, fontFamily:"'Montserrat', sans-serif" }} /></div>
                  <div><label style={LBL}>UN</label><input value={form.unidade} onChange={e => setForm(f=>({...f,unidade:e.target.value}))} style={INP} placeholder="UN" /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: listasAtivas <= 2 ? '1fr 1fr' : listasAtivas === 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap:'8px' }}>
                  {LISTA_FIELDS.slice(0, listasAtivas).map((field, i) => (
                    <div key={field}>
                      <label style={LBL}>{listaNomes[i]} R$</label>
                      <input value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={INP} placeholder="0,00" />
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                  <button type="button" onClick={() => setModal(false)} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background:R.alt, color:R.txt, border:`1px outset ${R.bdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>CANCELAR</button>
                  <button type="submit" disabled={saving} style={{ flex:1, padding:'7px', fontSize:'11px', fontWeight:'700', background:'#005500', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
                    {saving ? 'SALVANDO...' : 'GRAVAR'}
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
