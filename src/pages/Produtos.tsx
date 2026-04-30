import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Produto {
  id: string; codigo?: string; descricao: string; grupo?: string;
  unidade: string; preco_custo: number; preco_venda: number; margem?: number;
  fornecedor_id?: string; fornecedor_nome?: string; observacao?: string;
}

interface ProdutosResponse { produtos: Produto[]; grupos: string[]; }

const FORM_VAZIO = {
  codigo: '', descricao: '', grupo: '', unidade: 'UN',
  preco_custo: '', preco_venda: '', fornecedor_id: '', observacao: '',
};

const UNIDADES = ['UN', 'PAR', 'CX', 'KG', 'L', 'M', 'PC'];

function brl(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcMargem(custo: string, venda: string): string {
  const c = parseFloat(custo.replace(',', '.'));
  const v = parseFloat(venda.replace(',', '.'));
  if (!c || !v) return '—';
  return ((v - c) / c * 100).toFixed(1) + '%';
}

export default function Produtos() {
  const [data, setData] = useState<ProdutosResponse>({ produtos: [], grupos: [] });
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);

  function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (busca) p.set('q', busca);
    if (filtroGrupo) p.set('grupo', filtroGrupo);
    api.get<ProdutosResponse>(`/produtos?${p}`)
      .then(setData).catch(() => setData({ produtos: [], grupos: [] }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [busca, filtroGrupo]);

  useEffect(() => {
    api.get<{ produtos: { id: string; nome: string }[] }>('/fornecedores')
      .then(r => setFornecedores((r as any) instanceof Array ? r as any : []))
      .catch(() => {});
    api.get<{ id: string; nome: string }[]>('/fornecedores')
      .then(setFornecedores).catch(() => {});
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm({ ...FORM_VAZIO });
    setErro(''); setModal(true);
  }

  function abrirEditar(p: Produto) {
    setEditando(p);
    setForm({
      codigo: p.codigo || '', descricao: p.descricao, grupo: p.grupo || '',
      unidade: p.unidade, preco_custo: String(p.preco_custo).replace('.', ','),
      preco_venda: String(p.preco_venda).replace('.', ','),
      fornecedor_id: p.fornecedor_id || '', observacao: p.observacao || '',
    });
    setErro(''); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      const payload = {
        ...form,
        preco_custo: parseFloat(form.preco_custo.replace(',', '.')) || 0,
        preco_venda: parseFloat(form.preco_venda.replace(',', '.')) || 0,
      };
      if (editando) await api.put(`/produtos/${editando.id}`, payload);
      else await api.post('/produtos', payload);
      setModal(false); load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  async function excluir(id: string, desc: string) {
    if (!confirm(`Excluir produto "${desc}"?`)) return;
    await api.delete(`/produtos/${id}`); load();
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl = (t: string) => <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>{t}</label>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Produtos / Serviços</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Catálogo de produtos e serviços com preços</p>
        </div>
        <button onClick={abrirNovo} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por descrição ou código..."
          style={{ ...inp, maxWidth: '320px' }} />
        <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
          style={{ ...inp, width: 'auto', minWidth: '160px', fontFamily: 'inherit' }}>
          <option value="">Todos os grupos</option>
          {data.grupos.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        {(busca || filtroGrupo) && (
          <button onClick={() => { setBusca(''); setFiltroGrupo(''); }}
            style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Limpar ×
          </button>
        )}
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : data.produtos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhum produto cadastrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Código', 'Descrição', 'Grupo', 'Un.', 'Custo', 'Venda', 'Margem', 'Fornecedor', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.produtos.map(p => {
                const margem = p.preco_custo > 0 ? ((p.preco_venda - p.preco_custo) / p.preco_custo * 100) : 0;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{p.codigo || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{p.descricao}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {p.grupo ? <span style={{ fontSize: '11px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>{p.grupo}</span> : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{p.unidade}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{brl(p.preco_custo)}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--text)' }}>{brl(p.preco_venda)}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: margem >= 30 ? 'var(--green)' : margem > 0 ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {p.preco_custo > 0 ? margem.toFixed(1) + '%' : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{p.fornecedor_nome || '—'}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => abrirEditar(p)} style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', background: 'var(--primary-dim)', color: 'var(--primary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => excluir(p.id, p.descricao)} style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>{lbl('Código')}<input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="Ex: ARM-001" /></div>
                <div>{lbl('Unidade')}<select value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>{UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                <div style={{ gridColumn: '1 / -1' }}>{lbl('Descrição *')}<input required value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={inp} placeholder="Nome do produto ou serviço" /></div>
                <div style={{ gridColumn: '1 / -1' }}>{lbl('Grupo / Categoria')}<input value={form.grupo} onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))} style={inp} placeholder="Ex: Armações, Lentes, Serviços..." /></div>
              </div>

              {/* Preços */}
              <div style={{ background: 'var(--surface-alt)', borderRadius: '10px', padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  {lbl('Preço de Custo')}
                  <input value={form.preco_custo} onChange={e => setForm(f => ({ ...f, preco_custo: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0,00" />
                </div>
                <div>
                  {lbl('Preço de Venda')}
                  <input value={form.preco_venda} onChange={e => setForm(f => ({ ...f, preco_venda: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0,00" />
                </div>
                <div>
                  {lbl('Margem')}
                  <div style={{ padding: '8px 10px', fontSize: '13px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--green)', background: 'var(--surface)', borderRadius: '7px', border: '1px solid var(--border)' }}>
                    {calcMargem(form.preco_custo, form.preco_venda)}
                  </div>
                </div>
              </div>

              <div>{lbl('Fornecedor')}<select value={form.fornecedor_id} onChange={e => setForm(f => ({ ...f, fornecedor_id: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}><option value="">— Nenhum —</option>{fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div>
              <div>{lbl('Observação')}<input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} style={inp} /></div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
