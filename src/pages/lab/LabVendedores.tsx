import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { R } from '../../lib/labTheme';

interface Vendedor {
  id: string; codigo: number; nome: string;
  cpf_cnpj: string | null; rg_insc: string | null;
  endereco: string | null; complemento: string | null; bairro: string | null;
  cidade: string | null; estado: string | null; cep: string | null;
  pct_comissao: number | null; observacoes: string | null;
  telefone: string | null; celular: string | null; email: string | null;
  created_at: string;
}

const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const INP: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '13px', boxSizing: 'border-box', background: R.alt, border: '1px solid #b0aca4', borderRadius: '7px', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };
const CARD: React.CSSProperties = { background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px', padding: '16px' };
const EMPTY = { nome: '', cpf_cnpj: '', rg_insc: '', endereco: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', pct_comissao: '', observacoes: '', telefone: '', celular: '', email: '' };

export default function LabVendedores() {
  const [lista, setLista] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<Vendedor | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [modo, setModo] = useState<'lista' | 'novo' | 'editar'>('lista');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get<Vendedor[]>('/lab/vendedores').then(setLista).catch(() => setLista([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNovo() { setForm({ ...EMPTY }); setSel(null); setModo('novo'); setErro(''); }
  function openEditar(v: Vendedor) { setForm({ nome: v.nome, cpf_cnpj: v.cpf_cnpj ?? '', rg_insc: v.rg_insc ?? '', endereco: v.endereco ?? '', complemento: v.complemento ?? '', bairro: v.bairro ?? '', cidade: v.cidade ?? '', estado: v.estado ?? '', cep: v.cep ?? '', pct_comissao: String(v.pct_comissao ?? ''), observacoes: v.observacoes ?? '', telefone: v.telefone ?? '', celular: v.celular ?? '', email: v.email ?? '' }); setSel(v); setModo('editar'); setErro(''); }
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSaving(true); setErro('');
    try {
      const payload = { ...form, pct_comissao: form.pct_comissao ? parseFloat(form.pct_comissao) : null };
      if (modo === 'novo') await api.post('/lab/vendedores', payload);
      else if (sel) await api.patch(`/lab/vendedores/${sel.id}`, payload);
      load(); setModo('lista');
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro'); } finally { setSaving(false); }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir?')) return;
    try { await api.delete(`/lab/vendedores/${id}`); load(); if (sel?.id === id) setModo('lista'); } catch {}
  }

  const filtrados = lista.filter(v => !busca || v.nome.toLowerCase().includes(busca.toLowerCase()) || String(v.codigo).includes(busca));

  if (modo !== 'lista') return (
    <div style={{ padding: '24px', maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setModo('lista')} style={{ background: 'none', border: 'none', color: R.dim, cursor: 'pointer', fontSize: '20px' }}>←</button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: R.txt }}>{modo === 'novo' ? 'Novo Vendedor/Operador' : `Editar — ${sel?.nome}`}</h1>
      </div>
      {erro && <div style={{ background: 'rgba(200,0,0,0.12)', border: '1px solid #cc0000', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#cc0000' }}>{erro}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={CARD}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Identificação</div>
          <div style={{ marginBottom: '10px' }}><label style={LBL}>Nome *</label><input value={form.nome} onChange={e => set('nome', e.target.value)} style={INP} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div><label style={LBL}>CPF / CNPJ</label><input value={form.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>RG / Insc. Estadual</label><input value={form.rg_insc} onChange={e => set('rg_insc', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>% Comissão</label><input type="number" step="0.01" value={form.pct_comissao} onChange={e => set('pct_comissao', e.target.value)} style={INP} placeholder="0.00" /></div>
          </div>
        </div>
        <div style={CARD}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Endereço</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={LBL}>Endereço</label><input value={form.endereco} onChange={e => set('endereco', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>CEP</label><input value={form.cep} onChange={e => set('cep', e.target.value)} style={INP} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '10px' }}>
            <div><label style={LBL}>Complemento</label><input value={form.complemento} onChange={e => set('complemento', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>Bairro</label><input value={form.bairro} onChange={e => set('bairro', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>Cidade</label><input value={form.cidade} onChange={e => set('cidade', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>UF</label><select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}><option value="">—</option>{ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select></div>
          </div>
        </div>
        <div style={CARD}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Contato</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={LBL}>Telefone</label><input value={form.telefone} onChange={e => set('telefone', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>Celular</label><input value={form.celular} onChange={e => set('celular', e.target.value)} style={INP} /></div>
            <div><label style={LBL}>E-mail</label><input value={form.email} onChange={e => set('email', e.target.value)} style={INP} /></div>
          </div>
          <div><label style={LBL}>Observações</label><textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={2} style={{ ...INP, fontFamily: "'Montserrat', sans-serif", resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {modo === 'editar' && <button onClick={() => excluir(sel!.id)} style={{ padding: '9px 18px', fontSize: '13px', background: 'rgba(200,0,0,0.12)', color: '#cc0000', border: '1px solid #cc0000', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Excluir</button>}
          <button onClick={() => setModo('lista')} style={{ padding: '9px 22px', fontSize: '13px', background: 'transparent', color: R.dim, border: '1px solid #b0aca4', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ padding: '9px 28px', fontSize: '13px', fontWeight: '600', background: saving ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: R.txt }}>Vendedores / Operadores</h1>
        <button onClick={openNovo} style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: R.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo</button>
      </div>
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...INP, marginBottom: '16px', background: R.panel, width: '300px' }} />
      <div style={{ background: R.panel, border: '1px solid #b0aca4', borderRadius: '10px' }}>
        {loading ? <div style={{ padding: '48px', textAlign: 'center', color: R.dim }}>Carregando...</div>
          : filtrados.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: R.dim }}>Nenhum vendedor. <button onClick={openNovo} style={{ color: R.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>Cadastrar →</button></div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: R.alt, borderBottom: '1px solid #b0aca4' }}>
                {['Cód', 'Nome', 'CPF/CNPJ', '% Comissão', 'Telefone', ''].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtrados.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #b0aca4', cursor: 'pointer' }} onClick={() => openEditar(v)}
                    onMouseEnter={e => (e.currentTarget.style.background = R.alt)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 12px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: R.dim }}>{String(v.codigo).padStart(2, '0')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: R.txt }}>{v.nome}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{v.cpf_cnpj ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{v.pct_comissao != null ? `${v.pct_comissao}%` : '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{v.telefone ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}><button onClick={e => { e.stopPropagation(); excluir(v.id); }} style={{ fontSize: '12px', color: '#cc0000', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>
    </div>
  );
}
