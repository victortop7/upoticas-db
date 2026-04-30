import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

interface ItemEstoque {
  id: string; produto_id: string; codigo?: string; descricao: string;
  grupo?: string; unidade: string; preco_venda: number;
  quantidade: number; quantidade_minima: number; quantidade_maxima?: number;
  localizacao?: string; fornecedor_nome?: string; abaixo_minimo: number;
}

interface Resumo { total_itens: number; abaixo_minimo: number; valor_total: number; }
interface Movimentacao {
  id: string; produto_id: string; produto_desc: string; produto_codigo?: string;
  tipo: string; quantidade: number; quantidade_anterior: number; quantidade_nova: number;
  motivo?: string; documento?: string; fornecedor_nome?: string; usuario_nome?: string; created_at: string;
}

const TIPO_LABEL: Record<string, string> = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };
const TIPO_COLOR: Record<string, string> = { entrada: 'var(--green)', saida: 'var(--red)', ajuste: 'var(--amber)' };

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s: string) { const d = new Date(s); return d.toLocaleString('pt-BR'); }

export default function Estoque() {
  const [aba, setAba] = useState<'estoque' | 'movimentacoes' | 'compras'>('estoque');
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [grupos, setGrupos] = useState<string[]>([]);

  // Modal de movimentação
  const [modalMov, setModalMov] = useState(false);
  const [itemSel, setItemSel] = useState<ItemEstoque | null>(null);
  const [movForm, setMovForm] = useState({ tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste', quantidade: '', motivo: '', documento: '', preco_unitario: '' });
  const [savingMov, setSavingMov] = useState(false);
  const [erroMov, setErroMov] = useState('');

  // Modal de cadastrar item no estoque
  const [modalItem, setModalItem] = useState(false);
  const [produtos, setProdutos] = useState<{ id: string; descricao: string; codigo?: string; grupo?: string }[]>([]);
  const [itemForm, setItemForm] = useState({ produto_id: '', quantidade: '0', quantidade_minima: '0', localizacao: '' });
  const [savingItem, setSavingItem] = useState(false);
  const [erroItem, setErroItem] = useState('');

  const loadEstoque = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (busca) p.set('q', busca);
    if (filtroGrupo) p.set('grupo', filtroGrupo);
    if (aba === 'compras') p.set('alerta', '1');
    api.get<{ itens: ItemEstoque[]; resumo: Resumo }>(`/estoque?${p}`)
      .then(d => { setItens(d.itens); setResumo(d.resumo); const gs = [...new Set(d.itens.map(i => i.grupo).filter(Boolean) as string[])]; setGrupos(gs); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [busca, filtroGrupo, aba]);

  const loadMovs = useCallback(() => {
    setLoading(true);
    api.get<Movimentacao[]>('/estoque/movimentacoes')
      .then(setMovs).catch(() => setMovs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (aba === 'movimentacoes') loadMovs();
    else loadEstoque();
  }, [aba, loadEstoque, loadMovs]);

  useEffect(() => {
    api.get<{ produtos: { id: string; descricao: string; codigo?: string; grupo?: string }[] }>('/produtos')
      .then(r => setProdutos(r.produtos)).catch(() => {});
  }, []);

  async function salvarMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    if (!itemSel) return;
    setSavingMov(true); setErroMov('');
    try {
      await api.post('/estoque', {
        produto_id: itemSel.produto_id,
        tipo: movForm.tipo,
        quantidade: parseFloat(movForm.quantidade.replace(',', '.')) || 0,
        motivo: movForm.motivo || null,
        documento: movForm.documento || null,
        preco_unitario: parseFloat(movForm.preco_unitario.replace(',', '.')) || null,
      });
      setModalMov(false);
      loadEstoque();
      if (aba === 'movimentacoes') loadMovs();
    } catch (err: unknown) { setErroMov(err instanceof Error ? err.message : 'Erro'); }
    setSavingMov(false);
  }

  async function salvarItem(e: React.FormEvent) {
    e.preventDefault();
    setSavingItem(true); setErroItem('');
    try {
      await api.post('/estoque', {
        produto_id: itemForm.produto_id,
        tipo: 'ajuste',
        quantidade: parseFloat(itemForm.quantidade.replace(',', '.')) || 0,
        quantidade_minima: parseFloat(itemForm.quantidade_minima.replace(',', '.')) || 0,
        localizacao: itemForm.localizacao || null,
        motivo: 'Cadastro inicial',
      });
      setModalItem(false);
      setItemForm({ produto_id: '', quantidade: '0', quantidade_minima: '0', localizacao: '' });
      loadEstoque();
    } catch (err: unknown) { setErroItem(err instanceof Error ? err.message : 'Erro'); }
    setSavingItem(false);
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const tabBtn = (t: typeof aba, label: string) => (
    <button onClick={() => setAba(t)} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: aba === t ? '600' : '400', background: aba === t ? 'var(--surface-alt)' : 'transparent', color: aba === t ? 'var(--text)' : 'var(--text-muted)', border: aba === t ? '1px solid var(--border-light)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Estoque</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Controle de estoque e movimentações</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setModalItem(true)} style={{ padding: '9px 16px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Cadastrar Item
          </button>
        </div>
      </div>

      {/* KPIs */}
      {resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Itens em Estoque', value: resumo.total_itens, color: 'var(--text)' },
            { label: 'Abaixo do Mínimo', value: resumo.abaixo_minimo, color: resumo.abaixo_minimo > 0 ? 'var(--red)' : 'var(--green)' },
            { label: 'Valor em Estoque', value: brl(resumo.valor_total), color: 'var(--accent)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {tabBtn('estoque', 'Estoque Atual')}
        {tabBtn('movimentacoes', 'Movimentações')}
        {tabBtn('compras', `Lista de Compras${resumo && resumo.abaixo_minimo > 0 ? ` (${resumo.abaixo_minimo})` : ''}`)}
      </div>

      {/* Filtros — só para estoque e compras */}
      {aba !== 'movimentacoes' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..."
            style={{ ...inp, maxWidth: '280px' }} />
          {grupos.length > 0 && (
            <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
              style={{ ...inp, width: 'auto', minWidth: '160px', fontFamily: 'inherit' }}>
              <option value="">Todos os grupos</option>
              {grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
        </div>
      )}

      {/* TABELA ESTOQUE */}
      {(aba === 'estoque' || aba === 'compras') && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
          ) : itens.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              {aba === 'compras' ? 'Nenhum produto abaixo do mínimo.' : 'Nenhum item em estoque. Cadastre produtos primeiro.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Produto', 'Grupo', 'Un.', 'Qtd Atual', 'Mínimo', 'Valor (venda)', 'Localização', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: item.abaixo_minimo ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{item.descricao}</div>
                      {item.codigo && <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{item.codigo}</div>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {item.grupo ? <span style={{ fontSize: '11px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 7px', borderRadius: '20px' }}>{item.grupo}</span> : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{item.unidade}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--mono)', color: item.abaixo_minimo ? 'var(--red)' : item.quantidade > item.quantidade_minima * 2 ? 'var(--green)' : 'var(--amber)' }}>
                        {item.quantidade}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{item.quantidade_minima}</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{brl(item.quantidade * item.preco_venda)}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.localizacao || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => { setItemSel(item); setMovForm({ tipo: 'entrada', quantidade: '', motivo: '', documento: '', preco_unitario: '' }); setErroMov(''); setModalMov(true); }}
                        style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        +/− Mov.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TABELA MOVIMENTAÇÕES */}
      {aba === 'movimentacoes' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
          ) : movs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma movimentação registrada.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Produto', 'Tipo', 'Qtd', 'Antes → Depois', 'Motivo/Doc', 'Usuário'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movs.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmtDate(m.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>{m.produto_desc}</div>
                      {m.produto_codigo && <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{m.produto_codigo}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: TIPO_COLOR[m.tipo], background: `${TIPO_COLOR[m.tipo]}18`, padding: '3px 8px', borderRadius: '20px' }}>
                        {TIPO_LABEL[m.tipo] ?? m.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '14px', fontWeight: '700', fontFamily: 'var(--mono)', color: TIPO_COLOR[m.tipo] }}>
                      {m.tipo === 'entrada' ? '+' : m.tipo === 'saida' ? '−' : ''}{m.quantidade}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                      {m.quantidade_anterior} → {m.quantidade_nova}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>
                      {m.motivo || m.documento ? <>{m.motivo}{m.documento ? ` • ${m.documento}` : ''}</> : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{m.usuario_nome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Movimentação */}
      {modalMov && itemSel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Movimentar Estoque</h2>
              <button onClick={() => setModalMov(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ background: 'var(--surface-alt)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{itemSel.descricao}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Estoque atual: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{itemSel.quantidade} {itemSel.unidade}</strong>
              </div>
            </div>
            {erroMov && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erroMov}</div>}
            <form onSubmit={salvarMovimentacao} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Tipo</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['entrada', 'saida', 'ajuste'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setMovForm(f => ({ ...f, tipo: t }))}
                      style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '600', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', background: movForm.tipo === t ? `${TIPO_COLOR[t]}20` : 'transparent', color: movForm.tipo === t ? TIPO_COLOR[t] : 'var(--text-muted)', border: `1px solid ${movForm.tipo === t ? TIPO_COLOR[t] : 'var(--border)'}` }}>
                      {TIPO_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Quantidade *</label>
                <input required type="number" min="0.01" step="0.01" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: e.target.value }))} style={inp} placeholder={movForm.tipo === 'ajuste' ? 'Nova quantidade total' : 'Quantidade'} />
              </div>
              {movForm.tipo === 'entrada' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Preço Unitário de Custo</label>
                  <input value={movForm.preco_unitario} onChange={e => setMovForm(f => ({ ...f, preco_unitario: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0,00" />
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Nº Documento / NF</label>
                <input value={movForm.documento} onChange={e => setMovForm(f => ({ ...f, documento: e.target.value }))} style={inp} placeholder="Ex: NF 001234" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Motivo</label>
                <input value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} style={inp} placeholder="Ex: Compra, Devolução, Inventário..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalMov(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={savingMov} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: TIPO_COLOR[movForm.tipo], color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {savingMov ? 'Salvando...' : `Registrar ${TIPO_LABEL[movForm.tipo]}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Item no Estoque */}
      {modalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Cadastrar no Estoque</h2>
              <button onClick={() => setModalItem(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-dim)' }}>Selecione um produto cadastrado para adicionar ao estoque.</p>
            {erroItem && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erroItem}</div>}
            <form onSubmit={salvarItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Produto *</label>
                <select required value={itemForm.produto_id} onChange={e => setItemForm(f => ({ ...f, produto_id: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>
                  <option value="">Selecionar produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.descricao}{p.codigo ? ` (${p.codigo})` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Qtd Inicial</label>
                  <input value={itemForm.quantidade} onChange={e => setItemForm(f => ({ ...f, quantidade: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Qtd Mínima</label>
                  <input value={itemForm.quantidade_minima} onChange={e => setItemForm(f => ({ ...f, quantidade_minima: e.target.value }))} style={{ ...inp, fontFamily: 'var(--mono)' }} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Localização</label>
                <input value={itemForm.localizacao} onChange={e => setItemForm(f => ({ ...f, localizacao: e.target.value }))} style={inp} placeholder="Ex: Prateleira A3, Gaveta 2..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalItem(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={savingItem} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {savingItem ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
