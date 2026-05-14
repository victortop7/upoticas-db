import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Fornecedor {
  id: string; codigo?: string; nome: string; fantasia?: string; cnpj?: string;
  telefone?: string; email?: string; cidade?: string; uf?: string; ativo: number;
}

const R = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#005500,#008800)', hdrTxt:'#ccffcc', hdrBdr:'#007700', txt:'#000', inp:'#fff' };
const INP: React.CSSProperties = { width:'100%', padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', boxSizing:'border-box', fontFamily:"'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize:'10px', fontWeight:'700', color:'#444', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'3px' };

const FORM_VAZIO = { nome:'', fantasia:'', cnpj:'', telefone:'', email:'', endereco:'', cidade:'', uf:'', cep:'' };

export default function LabFornecedores() {
  const [lista, setLista] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (busca) p.set('q', busca);
    api.get<Fornecedor[]>(`/lab/fornecedores?${p}`)
      .then(setLista).catch(() => setLista([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [busca]);

  function abrirNovo() { setEditando(null); setForm({ ...FORM_VAZIO }); setErro(''); setModal(true); }
  function abrirEditar(f: Fornecedor) {
    setEditando(f);
    setForm({ nome: f.nome, fantasia: f.fantasia||'', cnpj: f.cnpj||'', telefone: f.telefone||'', email: f.email||'', endereco:'', cidade: f.cidade||'', uf: f.uf||'', cep:'' });
    setErro(''); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      if (editando) await api.put(`/lab/fornecedores/${editando.id}`, form);
      else await api.post('/lab/fornecedores', form);
      setModal(false); load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  const filtradas = lista.filter(f => !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || (f.cnpj||'').includes(busca));

  return (
    <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:R.bg, fontFamily:"'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', flexWrap:'wrap', gap:'6px' }}>
        <div style={{ background:R.hdr, color:R.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${R.hdrBdr}` }}>
          FORNECEDORES/OFTALMOS — {filtradas.length} cadastrado(s)
        </div>
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ..." style={{ ...INP, width:'220px' }} />
          <button onClick={abrirNovo}
            style={{ padding:'5px 16px', fontSize:'12px', fontWeight:'700', background:'#005500', color:R.hdrTxt, border:`1px outset ${R.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
            + NOVO FORNECEDOR
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex:1, overflowY:'auto', border:`2px inset ${R.bdr}` }}>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#444', fontFamily:"'Courier New', monospace" }}>Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#444' }}>Nenhum fornecedor cadastrado.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0 }}>
              <tr style={{ background:R.hdr }}>
                {['CÓD','NOME','FANTASIA','CNPJ','TELEFONE','CIDADE/UF'].map(h => (
                  <th key={h} style={{ padding:'6px 12px', textAlign:'left', fontSize:'10px', fontWeight:'700', color:R.hdrTxt, letterSpacing:'0.5px', border:`1px solid ${R.hdrBdr}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((f, i) => (
                <tr key={f.id} onClick={() => abrirEditar(f)}
                  style={{ background: i%2===0 ? R.panel : R.alt, cursor:'pointer', borderBottom:`1px solid ${R.bdr}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#005500')}
                  onMouseLeave={e => (e.currentTarget.style.background = i%2===0 ? R.panel : R.alt)}>
                  <td style={{ padding:'7px 12px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:'#555' }}>{f.codigo||'—'}</td>
                  <td style={{ padding:'7px 12px', fontSize:'12px', fontWeight:'700', color:R.txt }}>{f.nome}</td>
                  <td style={{ padding:'7px 12px', fontSize:'11px', color:'#333' }}>{f.fantasia||'—'}</td>
                  <td style={{ padding:'7px 12px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:'#333' }}>{f.cnpj||'—'}</td>
                  <td style={{ padding:'7px 12px', fontSize:'11px', color:'#333' }}>{f.telefone||'—'}</td>
                  <td style={{ padding:'7px 12px', fontSize:'11px', color:'#333' }}>{f.cidade && f.uf ? `${f.cidade}/${f.uf}` : f.cidade||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:R.panel, border:`2px outset ${R.bdr}`, width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ background:R.hdr, color:R.hdrTxt, padding:'6px 14px', fontSize:'12px', fontWeight:'700', letterSpacing:'1px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{editando ? 'ALTERAR FORNECEDOR' : 'INCLUIR FORNECEDOR'}</span>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'1px solid #99ffaa', color:'#99ffaa', padding:'1px 6px', cursor:'pointer', fontFamily:'inherit', fontWeight:'700' }}>✕</button>
            </div>
            <div style={{ padding:'16px' }}>
              {erro && <div style={{ background:'#ddffee', border:'1px solid #005500', padding:'6px 10px', marginBottom:'10px', fontSize:'11px', color:'#005500', fontWeight:'700' }}>{erro}</div>}
              <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div><label style={LBL}>Nome / Razão Social *</label><input required value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} style={{ ...INP, fontFamily:"'Montserrat', sans-serif" }} /></div>
                <div><label style={LBL}>Fantasia</label><input value={form.fantasia} onChange={e => setForm(f=>({...f,fantasia:e.target.value}))} style={{ ...INP, fontFamily:"'Montserrat', sans-serif" }} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div><label style={LBL}>CNPJ</label><input value={form.cnpj} onChange={e => setForm(f=>({...f,cnpj:e.target.value}))} style={INP} /></div>
                  <div><label style={LBL}>Telefone</label><input value={form.telefone} onChange={e => setForm(f=>({...f,telefone:e.target.value}))} style={INP} /></div>
                </div>
                <div><label style={LBL}>E-mail</label><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={{ ...INP, fontFamily:"'Montserrat', sans-serif" }} /></div>
                <div><label style={LBL}>Endereço</label><input value={form.endereco} onChange={e => setForm(f=>({...f,endereco:e.target.value}))} style={{ ...INP, fontFamily:"'Montserrat', sans-serif" }} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 50px 90px', gap:'8px' }}>
                  <div><label style={LBL}>Cidade</label><input value={form.cidade} onChange={e => setForm(f=>({...f,cidade:e.target.value}))} style={{ ...INP, fontFamily:"'Montserrat', sans-serif" }} /></div>
                  <div><label style={LBL}>UF</label><input value={form.uf} onChange={e => setForm(f=>({...f,uf:e.target.value}))} maxLength={2} style={INP} /></div>
                  <div><label style={LBL}>CEP</label><input value={form.cep} onChange={e => setForm(f=>({...f,cep:e.target.value}))} style={INP} /></div>
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
