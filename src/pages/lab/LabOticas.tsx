import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; codigo?: string; nome: string; cnpj?: string; telefone?: string; email?: string; cidade?: string; uf?: string; ativo: number; }

const R = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#880000,#cc0000)', hdrTxt:'#ffcccc', hdrBdr:'#aa2222', txt:'#000', inp:'#fff' };
const INP: React.CSSProperties = { width:'100%', padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', boxSizing:'border-box', fontFamily:"'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize:'10px', fontWeight:'700', color:'#444', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'3px' };

export default function LabOticas() {
  const navigate = useNavigate();
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState({ nome: '', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', uf: '', cep: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  function load() {
    setLoading(true);
    api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => setOticas([])).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await api.post('/lab/oticas', form);
      setModal(false); setForm({ nome:'', cnpj:'', telefone:'', email:'', endereco:'', cidade:'', uf:'', cep:'' }); load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  const filtradas = oticas.filter(o => !busca || o.nome.toLowerCase().includes(busca.toLowerCase()) || (o.codigo || '').includes(busca));

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', background: R.bg, fontFamily: "'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ background: R.hdr, color: R.hdrTxt, padding: '5px 14px', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', border: `2px outset ${R.hdrBdr}` }}>
          ÓTICAS CLIENTES — {filtradas.length} cadastrada(s)
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou código..." style={{ ...INP, width: '220px' }} />
          <button onClick={() => setModal(true)}
            style={{ padding: '5px 16px', fontSize: '12px', fontWeight: '700', background: '#880000', color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            + NOVA ÓTICA
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', border: `2px inset ${R.bdr}` }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#444', fontFamily: "'Courier New', monospace" }}>Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Nenhuma ótica cadastrada.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: R.hdr }}>
                {['CÓD', 'NOME', 'CNPJ', 'TELEFONE', 'E-MAIL', 'CIDADE/UF', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: R.hdrTxt, letterSpacing: '0.5px', border: `1px solid ${R.hdrBdr}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o, i) => (
                <tr key={o.id} onClick={() => navigate(`/lab/oticas/${o.id}`)}
                  style={{ background: i % 2 === 0 ? R.panel : R.alt, cursor: 'pointer', borderBottom: `1px solid ${R.bdr}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#880000')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? R.panel : R.alt)}>
                  <td style={{ padding: '7px 12px', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#555' }}>{o.codigo || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '12px', fontWeight: '700', color: R.txt }}>{o.nome}</td>
                  <td style={{ padding: '7px 12px', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#333' }}>{o.cnpj || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#333' }}>{o.telefone || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#333' }}>{o.email || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#333' }}>{o.cidade && o.uf ? `${o.cidade}/${o.uf}` : o.cidade || '—'}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: o.ativo ? '#006600' : '#880000', background: o.ativo ? '#ccffcc' : '#ffcccc', padding: '2px 7px', border: `1px solid ${o.ativo ? '#006600' : '#880000'}` }}>
                      {o.ativo ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nova Ótica */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, padding: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: R.hdr, color: R.hdrTxt, padding: '6px 14px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>INCLUIR ÓTICA CLIENTE</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: '1px solid #ff9999', color: '#ff9999', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>✕</button>
            </div>
            <div style={{ padding: '16px' }}>
              {erro && <div style={{ background: '#ffdddd', border: '1px solid #880000', padding: '7px 10px', marginBottom: '10px', fontSize: '11px', color: '#880000', fontWeight: '700' }}>{erro}</div>}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div><label style={LBL}>Nome *</label><input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={INP} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><label style={LBL}>CNPJ</label><input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} style={INP} /></div>
                  <div><label style={LBL}>Telefone</label><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} style={INP} /></div>
                </div>
                <div><label style={LBL}>E-mail</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={INP} /></div>
                <div><label style={LBL}>Endereço</label><input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} style={INP} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px', gap: '8px' }}>
                  <div><label style={LBL}>Cidade</label><input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} style={INP} /></div>
                  <div><label style={LBL}>UF</label><input value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} maxLength={2} style={INP} /></div>
                  <div><label style={LBL}>CEP</label><input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} style={INP} /></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.alt, color: R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>CANCELAR</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: '#880000', color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
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
