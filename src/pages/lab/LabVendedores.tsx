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

interface VendaVend {
  id: string; numero: number; status: string; tipo: string | null;
  ref_otica: string | null; rota: string | null; total: number | null;
  created_at: string; previsao_entrega: string | null;
  otica_nome: string | null; otica_codigo: string | null;
  otica_cidade: string | null; otica_uf: string | null;
}

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDia(s?: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.split('T')[0].split('-');
  return d && m && y ? `${d}/${m}/${y}` : s;
}
const STATUS_LABEL: Record<string, string> = {
  aguardando: 'Aguardando', em_producao: 'Em Produção', producao: 'Em Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const INP: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '13px', boxSizing: 'border-box', background: R.alt, border: '1px solid var(--lab-bdr)', borderRadius: '7px', color: R.txt, outline: 'none', fontFamily: "'Courier New', monospace" };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' };
const CARD: React.CSSProperties = { background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px', padding: '16px' };
const EMPTY = { nome: '', cpf_cnpj: '', rg_insc: '', endereco: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', pct_comissao: '', observacoes: '', telefone: '', celular: '', email: '' };

export default function LabVendedores() {
  const [lista, setLista] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<Vendedor | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [modo, setModo] = useState<'lista' | 'novo' | 'editar' | 'detalhe'>('lista');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [vendas, setVendas] = useState<VendaVend[]>([]);
  const [loadingDet, setLoadingDet] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<Vendedor[]>('/lab/vendedores').then(setLista).catch(() => setLista([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDetalhe(v: Vendedor) {
    setSel(v); setModo('detalhe'); setErro(''); setLoadingDet(true); setVendas([]);
    try {
      const res = await api.get<{ vendedor: Vendedor; vendas: VendaVend[] }>(`/lab/vendedores/${v.id}`);
      setVendas(res.vendas || []);
    } catch { setVendas([]); } finally { setLoadingDet(false); }
  }

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

  // ===== DETALHE: vendas e regiões do vendedor =====
  if (modo === 'detalhe' && sel) {
    const totalVendas = vendas.length;
    const valorTotal = vendas.reduce((a, v) => a + (v.total || 0), 0);
    const regioesMap = vendas.reduce((acc, v) => {
      const cidade = (v.otica_cidade || '').trim();
      const uf = (v.otica_uf || '').trim();
      const key = (cidade || uf) ? `${cidade}${uf ? '/' + uf : ''}` : 'Sem região';
      if (!acc[key]) acc[key] = { regiao: key, count: 0, total: 0 };
      acc[key].count++; acc[key].total += (v.total || 0);
      return acc;
    }, {} as Record<string, { regiao: string; count: number; total: number }>);
    const regioes = Object.values(regioesMap).sort((a, b) => b.total - a.total);
    const KPI: React.CSSProperties = { ...CARD, flex: 1, minWidth: '160px' };
    const KLBL: React.CSSProperties = { fontSize: '10px', fontWeight: '700', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };
    const KVAL: React.CSSProperties = { fontSize: '24px', fontWeight: '800', color: R.txt, fontFamily: "'Courier New', monospace" };

    return (
      <div style={{ padding: '24px', maxWidth: '960px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => setModo('lista')} style={{ background: 'none', border: 'none', color: R.dim, cursor: 'pointer', fontSize: '20px' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', fontWeight: '700', color: '#fff', background: R.accent, padding: '2px 8px', borderRadius: '6px' }}>#{String(sel.codigo).padStart(2, '0')}</span>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: R.txt }}>{sel.nome}</h1>
            </div>
            <div style={{ fontSize: '12px', color: R.dim, marginTop: '4px' }}>
              {sel.pct_comissao != null ? `Comissão ${sel.pct_comissao}%` : 'Representante'}{sel.telefone ? ` · ${sel.telefone}` : ''}{sel.cidade ? ` · ${sel.cidade}${sel.estado ? '/' + sel.estado : ''}` : ''}
            </div>
          </div>
          <button onClick={() => openEditar(sel)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: R.alt, color: R.txt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Editar cadastro</button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={KPI}><div style={KLBL}>Vendas (OS)</div><div style={KVAL}>{loadingDet ? '…' : totalVendas}</div></div>
          <div style={KPI}><div style={KLBL}>Valor Total</div><div style={{ ...KVAL, color: R.accent }}>{loadingDet ? '…' : brl(valorTotal)}</div></div>
          <div style={KPI}><div style={KLBL}>Regiões</div><div style={KVAL}>{loadingDet ? '…' : regioes.length}</div></div>
        </div>

        {/* Regiões */}
        <div style={{ ...CARD, marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Regiões atendidas</div>
          {loadingDet ? <div style={{ color: R.dim, fontSize: '13px' }}>Carregando…</div>
            : regioes.length === 0 ? <div style={{ color: R.dim, fontSize: '13px' }}>Nenhuma venda registrada para este vendedor.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {regioes.map(r => {
                  const pct = valorTotal > 0 ? (r.total / valorTotal) * 100 : 0;
                  return (
                    <div key={r.regiao}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: R.txt }}>📍 {r.regiao}</span>
                        <span style={{ fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{r.count} OS · <span style={{ color: R.accent, fontWeight: '700' }}>{brl(r.total)}</span></span>
                      </div>
                      <div style={{ height: '6px', background: R.alt, borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: R.accent, borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>}
        </div>

        {/* Lista de vendas */}
        <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lab-bdr)', fontSize: '11px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendas do vendedor</div>
          {loadingDet ? <div style={{ padding: '40px', textAlign: 'center', color: R.dim }}>Carregando…</div>
            : vendas.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: R.dim }}>Nenhuma OS vinculada a este vendedor.</div>
            : <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                  <thead><tr style={{ background: R.alt, borderBottom: '1px solid var(--lab-bdr)' }}>
                    {['OS', 'Ótica', 'Região', 'Data', 'Valor', 'Status'].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {vendas.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--lab-bdr)' }}>
                        <td style={{ padding: '9px 12px', fontFamily: "'Courier New', monospace", fontSize: '12px', fontWeight: '700', color: R.txt }}>#{String(v.numero).padStart(4, '0')}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', color: R.txt }}>{v.otica_nome ?? '—'}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: R.dim }}>{(v.otica_cidade || v.otica_uf) ? `${v.otica_cidade ?? ''}${v.otica_uf ? '/' + v.otica_uf : ''}` : (v.rota || '—')}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{fmtDia(v.created_at)}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.txt }}>{brl(v.total || 0)}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: R.dim }}>{STATUS_LABEL[v.status] ?? v.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </div>
      </div>
    );
  }

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
          <button onClick={() => setModo('lista')} style={{ padding: '9px 22px', fontSize: '13px', background: 'transparent', color: R.dim, border: '1px solid var(--lab-bdr)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ padding: '9px 28px', fontSize: '13px', fontWeight: '600', background: saving ? R.dim : R.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: R.txt }}>Vendedores / Operadores</h1>
        <button onClick={openNovo} style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: R.accent, color: 'var(--lab-on-accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo</button>
      </div>
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...INP, marginBottom: '16px', background: R.panel, width: '300px' }} />
      <div style={{ background: R.panel, border: '1px solid var(--lab-bdr)', borderRadius: '10px' }}>
        {loading ? <div style={{ padding: '48px', textAlign: 'center', color: R.dim }}>Carregando...</div>
          : filtrados.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: R.dim }}>Nenhum vendedor. <button onClick={openNovo} style={{ color: R.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>Cadastrar →</button></div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: R.alt, borderBottom: '1px solid var(--lab-bdr)' }}>
                {['Cód', 'Nome', 'CPF/CNPJ', '% Comissão', 'Telefone', ''].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtrados.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--lab-bdr)', cursor: 'pointer' }} onClick={() => openDetalhe(v)}
                    onMouseEnter={e => (e.currentTarget.style.background = R.alt)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 12px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: R.dim }}>{String(v.codigo).padStart(2, '0')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: R.txt }}>{v.nome}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{v.cpf_cnpj ?? '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{v.pct_comissao != null ? `${v.pct_comissao}%` : '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: "'Courier New', monospace", color: R.dim }}>{v.telefone ?? '—'}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button onClick={e => { e.stopPropagation(); openDetalhe(v); }} title="Ver vendas e regiões" style={{ fontSize: '12px', color: R.accent, background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', fontWeight: '600', fontFamily: 'inherit' }}>Vendas</button>
                      <button onClick={e => { e.stopPropagation(); openEditar(v); }} title="Editar cadastro" style={{ fontSize: '12px', color: R.dim, background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', fontFamily: 'inherit' }}>Editar</button>
                      <button onClick={e => { e.stopPropagation(); excluir(v.id); }} title="Excluir" style={{ fontSize: '12px', color: '#cc0000', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>
    </div>
  );
}
