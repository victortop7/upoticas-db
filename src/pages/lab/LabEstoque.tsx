import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Produto {
  id: string; marca: string; tratamento: string; indice: string;
  tipo: string; descricao?: string; quantidade: number; quantidade_minima: number;
}

const INDICES = ['1.50', '1.53', '1.56', '1.59', '1.61', '1.67', '1.74'];
const TIPOS = ['monofocal', 'bifocal', 'progressivo'];
const TRATAMENTOS = ['Sem tratamento', 'Antirreflexo', 'Blue Cut', 'Fotossensível', 'UV400', 'Antirreflexo + Blue Cut', 'Antirreflexo + Fotossensível'];

const TIPO_LABEL: Record<string, string> = {
  monofocal: 'Monofocal', bifocal: 'Bifocal', progressivo: 'Progressivo',
};

const FORM_VAZIO = { marca: '', tratamento: 'Sem tratamento', indice: '1.56', tipo: 'monofocal', descricao: '', quantidade: '0', quantidade_minima: '5' };
const MOV_VAZIO = { tipo: 'entrada' as 'entrada' | 'saida', quantidade: '', motivo: '' };

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

  function abrirNovo() {
    setEditando(null);
    setForm({ ...FORM_VAZIO });
    setErroProd('');
    setModalProd(true);
  }

  function abrirEditar(p: Produto) {
    setEditando(p);
    setForm({ marca: p.marca, tratamento: p.tratamento, indice: p.indice, tipo: p.tipo, descricao: p.descricao ?? '', quantidade: String(p.quantidade), quantidade_minima: String(p.quantidade_minima) });
    setErroProd('');
    setModalProd(true);
  }

  function abrirMov(p: Produto) {
    setProdutoMov(p);
    setMov({ ...MOV_VAZIO });
    setErroMov('');
    setModalMov(true);
  }

  async function salvarProduto(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErroProd('');
    try {
      const payload = {
        marca: form.marca, tratamento: form.tratamento, indice: form.indice,
        tipo: form.tipo, descricao: form.descricao || null,
        quantidade: parseInt(form.quantidade) || 0,
        quantidade_minima: parseInt(form.quantidade_minima) || 5,
      };
      if (editando) {
        await api.put(`/lab/estoque/${editando.id}`, payload);
      } else {
        await api.post('/lab/estoque', payload);
      }
      setModalProd(false);
      load();
    } catch (err: unknown) {
      setErroProd(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  async function salvarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoMov) return;
    setSavingMov(true); setErroMov('');
    try {
      await api.post(`/lab/estoque/${produtoMov.id}`, {
        tipo: mov.tipo,
        quantidade: parseInt(mov.quantidade) || 0,
        motivo: mov.motivo || null,
      });
      setModalMov(false);
      load();
    } catch (err: unknown) {
      setErroMov(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally { setSavingMov(false); }
  }

  const marcasUnicas = [...new Set(produtos.map(p => p.marca))].sort();
  const baixoEstoque = produtos.filter(p => p.quantidade <= p.quantidade_minima);

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl = (t: string) => <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{t}</label>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Estoque de Lentes</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Blocos de lentes por marca, índice e tratamento</p>
        </div>
        <button onClick={abrirNovo} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Novo Produto
        </button>
      </div>

      {/* Alerta baixo estoque */}
      {baixoEstoque.length > 0 && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--red)', fontSize: '16px' }}>⚠</span>
          <span style={{ fontSize: '13px', color: 'var(--red)', fontWeight: '600' }}>
            {baixoEstoque.length} produto(s) com estoque abaixo do mínimo:{' '}
            {baixoEstoque.map(p => `${p.marca} ${p.indice}`).join(', ')}
          </span>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}
          style={{ ...inp, width: 'auto', minWidth: '150px', fontFamily: 'inherit' }}>
          <option value="">Todas as marcas</option>
          {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtroIndice} onChange={e => setFiltroIndice(e.target.value)}
          style={{ ...inp, width: 'auto', fontFamily: 'inherit' }}>
          <option value="">Todos os índices</option>
          {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ ...inp, width: 'auto', fontFamily: 'inherit' }}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
        {(filtroMarca || filtroIndice || filtroTipo) && (
          <button onClick={() => { setFiltroMarca(''); setFiltroIndice(''); setFiltroTipo(''); }}
            style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Limpar filtros ×
          </button>
        )}
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : produtos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Nenhum produto cadastrado.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Marca', 'Índice', 'Tipo', 'Tratamento', 'Descrição', 'Qtd', 'Mínimo', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => {
                const baixo = p.quantidade <= p.quantidade_minima;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{p.marca}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{p.indice}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{TIPO_LABEL[p.tipo] ?? p.tipo}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{p.tratamento}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{p.descricao ?? '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        fontSize: '15px', fontWeight: '800', fontFamily: 'var(--mono)',
                        color: baixo ? 'var(--red)' : p.quantidade > p.quantidade_minima * 2 ? 'var(--green)' : 'var(--amber)',
                      }}>
                        {p.quantidade}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{p.quantidade_minima}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => abrirMov(p)}
                          style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', background: '#a855f720', color: '#a855f7', border: '1px solid #a855f740', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          +/−
                        </button>
                        <button onClick={() => abrirEditar(p)}
                          style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Editar
                        </button>
                      </div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setModalProd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erroProd && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erroProd}</div>}
            <form onSubmit={salvarProduto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                {lbl('Marca *')}
                <input required value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Ex: Zeiss, Essilor, Hoya, Shamir..." style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  {lbl('Índice de Refração *')}
                  <select required value={form.indice} onChange={e => setForm(f => ({ ...f, indice: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>
                    {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  {lbl('Tipo')}
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>
                    {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                {lbl('Tratamento')}
                <select value={form.tratamento} onChange={e => setForm(f => ({ ...f, tratamento: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>
                  {TRATAMENTOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {lbl('Descrição')}
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes adicionais..." style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  {lbl('Quantidade inicial')}
                  <input type="number" min="0" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} style={inp} />
                </div>
                <div>
                  {lbl('Qtd mínima (alerta)')}
                  <input type="number" min="0" value={form.quantidade_minima} onChange={e => setForm(f => ({ ...f, quantidade_minima: e.target.value }))} style={inp} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalProd(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimentação */}
      {modalMov && produtoMov && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Movimentar Estoque</h2>
              <button onClick={() => setModalMov(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ background: 'var(--surface-alt)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{produtoMov.marca} — {produtoMov.indice}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{produtoMov.tratamento} · {TIPO_LABEL[produtoMov.tipo]}</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--accent)', marginTop: '4px' }}>
                Estoque atual: <strong>{produtoMov.quantidade}</strong>
              </div>
            </div>

            {erroMov && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erroMov}</div>}

            <form onSubmit={salvarMovimentacao} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                {lbl('Tipo de movimentação')}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['entrada', 'saida'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setMov(m => ({ ...m, tipo: t }))}
                      style={{
                        flex: 1, padding: '9px', fontSize: '13px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                        background: mov.tipo === t ? (t === 'entrada' ? 'var(--green-dim)' : 'var(--red-dim)') : 'transparent',
                        color: mov.tipo === t ? (t === 'entrada' ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)',
                        border: `1px solid ${mov.tipo === t ? (t === 'entrada' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                      }}>
                      {t === 'entrada' ? '+ Entrada' : '− Saída'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                {lbl('Quantidade')}
                <input required type="number" min="1" value={mov.quantidade} onChange={e => setMov(m => ({ ...m, quantidade: e.target.value }))} style={inp} placeholder="0" />
              </div>
              <div>
                {lbl('Motivo')}
                <input value={mov.motivo} onChange={e => setMov(m => ({ ...m, motivo: e.target.value }))} style={inp} placeholder={mov.tipo === 'entrada' ? 'Ex: Compra fornecedor' : 'Ex: Uso em OS #0001'} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalMov(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={savingMov} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: mov.tipo === 'entrada' ? 'var(--green)' : 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {savingMov ? 'Salvando...' : mov.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
