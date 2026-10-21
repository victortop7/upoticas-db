import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import LeitorEstoque from '../components/LeitorEstoque';

interface ItemEstoque {
  id: string; produto_id: string; codigo?: string; codigo_barras?: string; descricao: string;
  grupo?: string; unidade: string; preco_venda: number; preco_custo: number;
  categoria_id?: string | null; subcategoria_id?: string | null; subcategoria_nome?: string | null;
  quantidade: number; quantidade_minima: number; quantidade_maxima?: number;
  localizacao?: string; fornecedor_nome?: string; abaixo_minimo: number;
}
interface Resumo { total_itens: number; abaixo_minimo: number; valor_total: number; pecas: number; custo_total: number; }
interface Movimentacao {
  id: string; produto_id: string; produto_desc: string; produto_codigo?: string;
  tipo: string; quantidade: number; quantidade_anterior: number; quantidade_nova: number;
  motivo?: string; documento?: string; fornecedor_nome?: string; usuario_nome?: string; created_at: string;
}
export interface Sub { id: string; nome: string; itens: number; pecas: number; baixo: number }
export interface Categoria { id: string; nome: string; icone?: string | null; itens: number; pecas: number; baixo: number; subs: Sub[] }
interface RespCat { categorias: Categoria[]; sem_categoria: { itens: number; pecas: number; baixo: number } }

const TIPO_LABEL: Record<string, string> = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };
const TIPO_COLOR: Record<string, string> = { entrada: 'var(--green)', saida: 'var(--red)', ajuste: 'var(--amber)' };

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const d = new Date(s); return d.toLocaleString('pt-BR'); }
const num = (s: string) => parseFloat(String(s).replace(',', '.')) || 0;

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: 500 };

function Janela({ titulo, onClose, largura = 460, children }: { titulo: string; onClose: () => void; largura?: number; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px 26px', width: '100%', maxWidth: largura, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>{titulo}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Novo item já dentro da categoria (cria o produto + estoque inicial)
function NovoItem({ categorias, catInicial, subInicial, onClose, onSaved }: { categorias: Categoria[]; catInicial: string; subInicial: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ categoria_id: catInicial || categorias[0]?.id || '', subcategoria_id: subInicial, descricao: '', codigo: '', codigo_barras: '', preco_custo: '', preco_venda: '', quantidade: '1', quantidade_minima: '0', localizacao: '' });
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const cat = categorias.find(c => c.id === f.categoria_id);
  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }));
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await api.post('/estoque/item', { ...f, subcategoria_id: f.subcategoria_id || null, preco_custo: num(f.preco_custo), preco_venda: num(f.preco_venda), quantidade: num(f.quantidade), quantidade_minima: num(f.quantidade_minima) });
      onSaved();
    } catch (err) { setErro(err instanceof Error ? err.message : 'Erro'); setSaving(false); }
  }
  return (
    <Janela titulo={`Novo item${cat ? ` em ${cat.nome}` : ''}`} onClose={onClose} largura={520}>
      {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 7, padding: '9px 12px', marginBottom: 14, fontSize: 13, color: 'var(--red)' }}>{erro}</div>}
      <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Categoria</label>
            <select style={inp} value={f.categoria_id} onChange={e => setF(x => ({ ...x, categoria_id: e.target.value, subcategoria_id: '' }))}>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div><label style={lbl}>{cat?.subs.length ? 'Material / subcategoria' : 'Subcategoria'}</label>
            <select style={inp} value={f.subcategoria_id} onChange={e => set('subcategoria_id', e.target.value)} disabled={!cat?.subs.length}>
              <option value="">{cat?.subs.length ? '— Escolher —' : '— nenhuma —'}</option>
              {cat?.subs.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
        </div>
        <div><label style={lbl}>Descrição *</label><input required autoFocus style={inp} value={f.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Armação Ray-Ban RB5154 preta 51" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 10 }}>
          <div><label style={lbl}>Código / referência</label><input style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.codigo} onChange={e => set('codigo', e.target.value)} placeholder="RB5154" /></div>
          <div><label style={lbl}>Código de barras</label><input style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.codigo_barras} onChange={e => set('codigo_barras', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} placeholder="Bipe o leitor aqui" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Custo (R$)</label><input inputMode="decimal" style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.preco_custo} onChange={e => set('preco_custo', e.target.value)} placeholder="0,00" /></div>
          <div><label style={lbl}>Preço de venda (R$)</label><input inputMode="decimal" style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.preco_venda} onChange={e => set('preco_venda', e.target.value)} placeholder="0,00" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 10 }}>
          <div><label style={lbl}>Qtd inicial</label><input style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.quantidade} onChange={e => set('quantidade', e.target.value)} /></div>
          <div><label style={lbl}>Mínimo</label><input style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.quantidade_minima} onChange={e => set('quantidade_minima', e.target.value)} /></div>
          <div><label style={lbl}>Localização</label><input style={inp} value={f.localizacao} onChange={e => set('localizacao', e.target.value)} placeholder="Expositor 2" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, fontSize: 13, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Cadastrar no estoque'}</button>
        </div>
      </form>
    </Janela>
  );
}

// Criar / renomear / excluir categorias e subcategorias
function GerenciarCategorias({ categorias, onClose, onMudou }: { categorias: Categoria[]; onClose: () => void; onMudou: () => void }) {
  const [nova, setNova] = useState('');
  const [novaSub, setNovaSub] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  async function criar(nome: string, parent_id?: string) {
    if (!nome.trim()) return;
    setErro('');
    try { await api.post('/estoque/categorias', { nome, parent_id: parent_id || null }); setNova(''); setNovaSub(s => ({ ...s, [parent_id || '']: '' })); onMudou(); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); }
  }
  async function renomear(id: string, atual: string) {
    const nome = prompt('Novo nome:', atual);
    if (!nome || nome.trim() === atual) return;
    try { await api.put(`/estoque/categorias/${id}`, { nome }); onMudou(); } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); }
  }
  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"?`)) return;
    try { await api.delete(`/estoque/categorias/${id}`); onMudou(); } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); }
  }
  const mini: React.CSSProperties = { fontSize: 11.5, padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-dim)', cursor: 'pointer' };
  return (
    <Janela titulo="Categorias do estoque" onClose={onClose} largura={560}>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-dim)' }}>Cada categoria vira uma aba do estoque. As subcategorias separam por tipo ou material (ex.: Armações → Metal, Acetato, TR90…).</p>
      {erro && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{erro}</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {categorias.map(c => (
          <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <b style={{ color: 'var(--text)', fontSize: 14 }}>{c.icone || '📦'} {c.nome} <span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--text-muted)' }}>· {c.itens} modelo(s)</span></b>
              <span style={{ display: 'flex', gap: 6 }}>
                <button style={mini} onClick={() => renomear(c.id, c.nome)}>Renomear</button>
                <button style={{ ...mini, color: 'var(--red)' }} onClick={() => excluir(c.id, c.nome)}>Excluir</button>
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {c.subs.map(s => (
                <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, padding: '3px 4px 3px 10px', borderRadius: 20, background: 'var(--surface-alt)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {s.nome}
                  <button title="Renomear" onClick={() => renomear(s.id, s.nome)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11 }}>✎</button>
                  <button title="Excluir" onClick={() => excluir(s.id, s.nome)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 12 }}>×</button>
                </span>
              ))}
              <form onSubmit={e => { e.preventDefault(); criar(novaSub[c.id] || '', c.id); }} style={{ display: 'inline-flex', gap: 4 }}>
                <input value={novaSub[c.id] || ''} onChange={e => setNovaSub(s => ({ ...s, [c.id]: e.target.value }))} placeholder="+ subcategoria" style={{ ...inp, width: 130, padding: '4px 8px', fontSize: 12 }} />
                {(novaSub[c.id] || '').trim() && <button type="submit" style={{ ...mini, background: 'var(--primary)', color: '#fff', border: 'none' }}>Add</button>}
              </form>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); criar(nova); }} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <input value={nova} onChange={e => setNova(e.target.value)} placeholder="Nova categoria (ex.: Lentes de contato)" style={inp} />
        <button type="submit" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Criar aba</button>
      </form>
    </Janela>
  );
}

type Aba = { tipo: 'cat'; id: string } | { tipo: 'sem' } | { tipo: 'leitor' } | { tipo: 'mov' } | { tipo: 'compras' };

export default function Estoque() {
  const [cats, setCats] = useState<RespCat | null>(null);
  const [aba, setAba] = useState<Aba | null>(null);
  const [sub, setSub] = useState('');
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [novoItem, setNovoItem] = useState(false);
  const [gerenciar, setGerenciar] = useState(false);
  const [mover, setMover] = useState<ItemEstoque | null>(null);
  const [moverPara, setMoverPara] = useState({ categoria_id: '', subcategoria_id: '' });

  // Modal de movimentação
  const [itemSel, setItemSel] = useState<ItemEstoque | null>(null);
  const [movForm, setMovForm] = useState({ tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste', quantidade: '', motivo: '', documento: '', preco_unitario: '' });
  const [savingMov, setSavingMov] = useState(false);
  const [erroMov, setErroMov] = useState('');

  const loadCats = useCallback(() => {
    api.get<RespCat>('/estoque/categorias').then(r => {
      setCats(r);
      setAba(a => a ?? (r.categorias[0] ? { tipo: 'cat', id: r.categorias[0].id } : { tipo: 'leitor' }));
    }).catch(() => setAba(a => a ?? { tipo: 'leitor' }));
  }, []);
  useEffect(() => { loadCats(); }, [loadCats]);

  const loadEstoque = useCallback(() => {
    if (!aba || aba.tipo === 'leitor' || aba.tipo === 'mov') return;
    setLoading(true);
    const p = new URLSearchParams();
    if (busca) p.set('q', busca);
    if (aba.tipo === 'cat') p.set('categoria_id', aba.id);
    if (aba.tipo === 'sem') p.set('categoria_id', 'sem');
    if (aba.tipo === 'cat' && sub) p.set('subcategoria_id', sub);
    if (aba.tipo === 'compras') p.set('alerta', '1');
    api.get<{ itens: ItemEstoque[]; resumo: Resumo }>(`/estoque?${p}`)
      .then(d => { setItens(d.itens); setResumo(d.resumo); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [aba, sub, busca]);

  const loadMovs = useCallback(() => {
    setLoading(true);
    api.get<Movimentacao[]>('/estoque/movimentacoes').then(setMovs).catch(() => setMovs([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (aba?.tipo === 'mov') loadMovs();
    else loadEstoque();
  }, [aba, loadEstoque, loadMovs]);

  const recarregar = () => { loadCats(); loadEstoque(); };

  async function salvarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    if (!itemSel) return;
    setSavingMov(true); setErroMov('');
    try {
      await api.post('/estoque', {
        produto_id: itemSel.produto_id, tipo: movForm.tipo, quantidade: num(movForm.quantidade),
        motivo: movForm.motivo || null, documento: movForm.documento || null, preco_unitario: num(movForm.preco_unitario) || null,
      });
      setItemSel(null);
      recarregar();
    } catch (err: unknown) { setErroMov(err instanceof Error ? err.message : 'Erro'); }
    setSavingMov(false);
  }

  async function salvarMover() {
    if (!mover) return;
    await api.patch('/estoque/item', { produto_id: mover.produto_id, categoria_id: moverPara.categoria_id || null, subcategoria_id: moverPara.subcategoria_id || null });
    setMover(null); recarregar();
  }

  const catAtual = aba?.tipo === 'cat' ? cats?.categorias.find(c => c.id === aba.id) : undefined;
  const abaIgual = (a: Aba) => JSON.stringify(a) === JSON.stringify(aba);
  const tabBtn = (a: Aba, label: React.ReactNode, alerta = 0) => (
    <button key={JSON.stringify(a)} onClick={() => { setAba(a); setSub(''); }} style={{ padding: '9px 14px', fontSize: 13.5, fontWeight: abaIgual(a) ? 700 : 500, background: 'none', border: 'none', borderBottom: `2px solid ${abaIgual(a) ? 'var(--primary)' : 'transparent'}`, color: abaIgual(a) ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
      {label}
      {alerta > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--red)', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>{alerta}</span>}
    </button>
  );
  const chip = (on: boolean): React.CSSProperties => ({ padding: '5px 12px', fontSize: 12.5, fontWeight: 500, borderRadius: 20, cursor: 'pointer', border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-dim)' });
  const listaEstoque = aba && (aba.tipo === 'cat' || aba.tipo === 'sem' || aba.tipo === 'compras');
  const totalBaixo = cats ? cats.categorias.reduce((s, c) => s + c.baixo, 0) + cats.sem_categoria.baixo : 0;

  return (
    <div style={{ padding: '32px', maxWidth: '1180px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>Estoque</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Separado por categoria. Cada venda dá baixa sozinha.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setGerenciar(true)} style={{ padding: '9px 14px', fontSize: 13, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>⚙️ Categorias</button>
          <button onClick={() => setNovoItem(true)} disabled={!cats?.categorias.length} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Novo item{catAtual ? ` em ${catAtual.nome}` : ''}</button>
        </div>
      </div>

      {/* Abas: uma por categoria + ferramentas */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
        {cats?.categorias.map(c => tabBtn({ tipo: 'cat', id: c.id }, <>{c.icone || '📦'} {c.nome} <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{c.pecas}</span></>, c.baixo))}
        {cats && cats.sem_categoria.itens > 0 && tabBtn({ tipo: 'sem' }, <>❔ Sem categoria <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{cats.sem_categoria.itens}</span></>)}
        <span style={{ width: 1, background: 'var(--border)', margin: '8px 6px' }} />
        {tabBtn({ tipo: 'leitor' }, '▌▌▌ Leitor')}
        {tabBtn({ tipo: 'mov' }, 'Movimentações')}
        {tabBtn({ tipo: 'compras' }, 'Repor', totalBaixo)}
      </div>

      {/* Subcategorias da aba */}
      {aba?.tipo === 'cat' && catAtual && (catAtual.subs.length > 0) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          <button style={chip(!sub)} onClick={() => setSub('')}>Todas <span style={{ fontFamily: 'var(--mono)', opacity: .8 }}>{catAtual.pecas}</span></button>
          {catAtual.subs.map(s => (
            <button key={s.id} style={chip(sub === s.id)} onClick={() => setSub(s.id)}>{s.nome} <span style={{ fontFamily: 'var(--mono)', opacity: .8 }}>{s.pecas}</span></button>
          ))}
          <button onClick={() => setGerenciar(true)} style={{ ...chip(false), borderStyle: 'dashed' }}>+ subcategoria</button>
        </div>
      )}

      {/* KPIs da aba */}
      {listaEstoque && resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
          {[
            { label: 'Modelos', value: String(resumo.total_itens || 0), color: 'var(--text)' },
            { label: 'Peças', value: String(resumo.pecas || 0), color: 'var(--text)' },
            { label: 'Valor de venda', value: brl(resumo.valor_total), color: 'var(--accent)' },
            { label: 'Custo em estoque', value: brl(resumo.custo_total), color: 'var(--text-dim)' },
            { label: 'Abaixo do mínimo', value: String(resumo.abaixo_minimo || 0), color: resumo.abaixo_minimo > 0 ? 'var(--red)' : 'var(--green)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {listaEstoque && (
        <div style={{ marginBottom: 12 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, código ou código de barras..." style={{ ...inp, maxWidth: 360 }} />
        </div>
      )}

      {listaEstoque && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
          ) : itens.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {aba?.tipo === 'compras' ? 'Nada abaixo do mínimo. 👍' : <>Nenhum item aqui ainda. <button onClick={() => setNovoItem(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14 }}>Cadastrar o primeiro</button></>}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Produto', aba?.tipo === 'cat' ? 'Material / sub' : 'Categoria', 'Qtd', 'Mín.', 'Custo', 'Venda', 'Local', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: ['Qtd', 'Mín.', 'Custo', 'Venda'].includes(h) ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map(item => {
                  const corQtd = item.quantidade < 0 ? 'var(--red)' : item.abaixo_minimo ? 'var(--red)' : item.quantidade > item.quantidade_minima * 2 ? 'var(--green)' : 'var(--amber)';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{item.descricao}</div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{[item.codigo, item.codigo_barras].filter(Boolean).join(' · ') || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {aba?.tipo === 'cat'
                          ? (item.subcategoria_nome ? <span style={{ fontSize: 11.5, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 20 }}>{item.subcategoria_nome}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>)
                          : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{item.grupo || '—'}</span>}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: corQtd }} title={item.quantidade < 0 ? 'Vendeu mais do que tinha registrado — dê entrada' : ''}>{item.quantidade}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-dim)', textAlign: 'right' }}>{item.quantidade_minima}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-dim)', textAlign: 'right' }}>{brl(item.preco_custo)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text)', textAlign: 'right' }}>{brl(item.preco_venda)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{item.localizacao || '—'}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button onClick={() => { setItemSel(item); setMovForm({ tipo: 'entrada', quantidade: '', motivo: '', documento: '', preco_unitario: '' }); setErroMov(''); }}
                          style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 6 }}>+/− Mov.</button>
                        <button onClick={() => { setMover(item); setMoverPara({ categoria_id: item.categoria_id || cats?.categorias[0]?.id || '', subcategoria_id: item.subcategoria_id || '' }); }}
                          style={{ fontSize: 11.5, padding: '4px 10px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>Mover</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba?.tipo === 'leitor' && <LeitorEstoque categorias={cats?.categorias || []} onMudou={recarregar} />}

      {aba?.tipo === 'mov' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</div>
          ) : movs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma movimentação registrada.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Produto', 'Tipo', 'Qtd', 'Antes → Depois', 'Motivo/Doc', 'Usuário'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movs.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmtDate(m.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>{m.produto_desc}</div>
                      {m.produto_codigo && <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{m.produto_codigo}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: TIPO_COLOR[m.tipo], background: `${TIPO_COLOR[m.tipo]}18`, padding: '3px 8px', borderRadius: 20 }}>{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: TIPO_COLOR[m.tipo] }}>{m.tipo === 'entrada' ? '+' : m.tipo === 'saida' ? '−' : ''}{m.quantidade}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{m.quantidade_anterior} → {m.quantidade_nova}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-dim)' }}>{m.motivo || m.documento ? <>{m.motivo}{m.documento && m.documento !== m.motivo ? ` • ${m.documento}` : ''}</> : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-dim)' }}>{m.usuario_nome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Movimentação */}
      {itemSel && (
        <Janela titulo="Movimentar estoque" onClose={() => setItemSel(null)}>
          <div style={{ background: 'var(--surface-alt)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{itemSel.descricao}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Estoque atual: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{itemSel.quantidade} {itemSel.unidade}</strong></div>
          </div>
          {erroMov && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 7, padding: '9px 12px', marginBottom: 14, fontSize: 13, color: 'var(--red)' }}>{erroMov}</div>}
          <form onSubmit={salvarMovimentacao} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['entrada', 'saida', 'ajuste'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setMovForm(f => ({ ...f, tipo: t }))}
                    style={{ flex: 1, padding: 8, fontSize: 12, fontWeight: 600, borderRadius: 7, cursor: 'pointer', background: movForm.tipo === t ? `${TIPO_COLOR[t]}20` : 'transparent', color: movForm.tipo === t ? TIPO_COLOR[t] : 'var(--text-muted)', border: `1px solid ${movForm.tipo === t ? TIPO_COLOR[t] : 'var(--border)'}` }}>
                    {TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div><label style={lbl}>Quantidade *</label><input required type="number" min="0.01" step="0.01" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} style={inp} placeholder={movForm.tipo === 'ajuste' ? 'Nova quantidade total' : 'Quantidade'} /></div>
            {movForm.tipo === 'entrada' && <div><label style={lbl}>Preço unitário de custo</label><input value={movForm.preco_unitario} onChange={e => setMovForm(f => ({ ...f, preco_unitario: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0,00" /></div>}
            <div><label style={lbl}>Nº documento / NF</label><input value={movForm.documento} onChange={e => setMovForm(f => ({ ...f, documento: e.target.value }))} style={inp} placeholder="Ex: NF 001234" /></div>
            <div><label style={lbl}>Motivo</label><input value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} style={inp} placeholder="Ex: Compra, Devolução, Inventário..." /></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setItemSel(null)} style={{ flex: 1, padding: 10, fontSize: 13, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={savingMov} style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 600, background: TIPO_COLOR[movForm.tipo], color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{savingMov ? 'Salvando...' : `Registrar ${TIPO_LABEL[movForm.tipo]}`}</button>
            </div>
          </form>
        </Janela>
      )}

      {/* Mover de categoria */}
      {mover && cats && (
        <Janela titulo="Mover para categoria" onClose={() => setMover(null)} largura={420}>
          <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600, marginBottom: 12 }}>{mover.descricao}</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div><label style={lbl}>Categoria</label>
              <select style={inp} value={moverPara.categoria_id} onChange={e => setMoverPara({ categoria_id: e.target.value, subcategoria_id: '' })}>
                {cats.categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            {(cats.categorias.find(c => c.id === moverPara.categoria_id)?.subs.length || 0) > 0 && (
              <div><label style={lbl}>Material / subcategoria</label>
                <select style={inp} value={moverPara.subcategoria_id} onChange={e => setMoverPara(m => ({ ...m, subcategoria_id: e.target.value }))}>
                  <option value="">— nenhuma —</option>
                  {cats.categorias.find(c => c.id === moverPara.categoria_id)?.subs.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            )}
            <button onClick={salvarMover} style={{ padding: 10, fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}>Salvar</button>
          </div>
        </Janela>
      )}

      {novoItem && cats && (
        <NovoItem categorias={cats.categorias} catInicial={catAtual?.id || ''} subInicial={sub} onClose={() => setNovoItem(false)} onSaved={() => { setNovoItem(false); recarregar(); }} />
      )}
      {gerenciar && cats && <GerenciarCategorias categorias={cats.categorias} onClose={() => setGerenciar(false)} onMudou={recarregar} />}
    </div>
  );
}
