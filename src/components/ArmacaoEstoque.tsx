import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import Icone from './Icone';

// Escolher a armação (ou outro produto) direto do estoque na hora da venda.
// O que for escolhido entra como item da venda com produto_id, e a venda dá baixa no estoque.

interface Sub { id: string; nome: string; pecas?: number }
interface Cat { id: string; nome: string; modo?: string; pecas?: number; subs: Sub[] }
interface Modelo { produto_id: string; descricao: string; quantidade: number; preco_venda: number; codigo?: string; codigo_barras?: string; subcategoria_nome?: string }
export interface Escolhido { produto_id: string; descricao: string; preco_venda: number }

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ArmacaoEstoque({ onEscolher, inputStyle }: { onEscolher: (p: Escolhido) => void; inputStyle: React.CSSProperties }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [catId, setCatId] = useState('');
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [busca, setBusca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    api.get<{ categorias: Cat[] }>('/estoque/categorias').then(r => {
      // armações primeiro (é o que mais sai junto com a OS)
      const lista = [...(r.categorias || [])].sort((a, b) => Number(!/arma/i.test(a.nome)) - Number(!/arma/i.test(b.nome)));
      setCats(lista);
      if (lista[0]) setCatId(lista[0].id);
    }).catch(() => setCats([]));
  }, []);

  const cat = useMemo(() => cats.find(c => c.id === catId), [cats, catId]);
  const porQuantidade = cat?.modo === 'quantidade';

  useEffect(() => {
    if (!cat || porQuantidade) { setModelos([]); return; }
    const t = setTimeout(() => {
      const ps = new URLSearchParams({ categoria_id: cat.id });
      if (busca.trim()) ps.set('q', busca.trim());
      api.get<{ itens: Modelo[] }>(`/estoque?${ps}`).then(r => setModelos((r.itens || []).slice(0, 8))).catch(() => setModelos([]));
    }, 250);
    return () => clearTimeout(t);
  }, [cat, porQuantidade, busca]);

  async function escolherMaterial(s: Sub | null) {
    if (!cat || ocupado) return;
    setOcupado(true); setAviso('');
    try {
      const ps = new URLSearchParams({ categoria_id: cat.id });
      if (s) ps.set('subcategoria_id', s.id);
      const r = await api.get<{ produto: Escolhido & { id: string; quantidade: number } }>(`/estoque/quantidade?${ps}`);
      onEscolher({ produto_id: r.produto.id, descricao: r.produto.descricao, preco_venda: r.produto.preco_venda || 0 });
      if ((r.produto.quantidade ?? 0) <= 0) setAviso(`${r.produto.descricao} está com 0 no estoque. A venda vai deixar negativo até alguém dar entrada.`);
    } catch (e) { setAviso(e instanceof Error ? e.message : 'Não consegui buscar no estoque'); }
    setOcupado(false);
  }

  // fica dentro do <form> da venda: sem <form> próprio, Enter no campo dispara a busca
  async function bipar() {
    const c = codigo.trim();
    if (!c) return;
    setAviso('');
    try {
      const r = await api.get<{ encontrado: boolean; produto?: { id: string; descricao: string; preco_venda?: number }; quantidade?: number }>(`/estoque/leitura?codigo=${encodeURIComponent(c)}`);
      if (!r.encontrado || !r.produto) { setAviso(`Código ${c} não está cadastrado no estoque.`); return; }
      onEscolher({ produto_id: r.produto.id, descricao: r.produto.descricao, preco_venda: r.produto.preco_venda || 0 });
      setCodigo('');
      if ((r.quantidade ?? 0) <= 0) setAviso(`${r.produto.descricao} está com 0 no estoque.`);
    } catch (err) { setAviso(err instanceof Error ? err.message : 'Erro ao ler o código'); }
  }

  if (!cats.length) return null;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: 'var(--surface-alt)', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icone nome="oculos" size={15} color="var(--text-dim)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Armação do estoque</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>entra na venda e dá baixa</span>
      </div>

      <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <select style={inputStyle} value={catId} onChange={e => { setCatId(e.target.value); setBusca(''); }}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Bipar código de barras"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); bipar(); } }} />
          <button type="button" onClick={bipar} className="btn btn-sm" style={{ height: 'auto' }} title="Buscar pelo código"><Icone nome="leitor" size={15} /></button>
        </div>
      </div>

      {porQuantidade ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
          {(cat!.subs.length ? cat!.subs : [null]).map(s => (
            <button key={s?.id || 'unico'} type="button" className="btn btn-sm" disabled={ocupado} onClick={() => escolherMaterial(s)}
              style={{ justifyContent: 'space-between' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s ? s.nome : cat!.nome}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: (s?.pecas ?? cat!.pecas ?? 0) > 0 ? 'var(--text-muted)' : 'var(--red)' }}>{s ? (s.pecas ?? 0) : (cat!.pecas ?? 0)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <input style={inputStyle} value={busca} onChange={e => setBusca(e.target.value)} placeholder={`Buscar modelo em ${cat?.nome || ''}...`} />
          {modelos.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 6, maxHeight: 190, overflowY: 'auto', background: 'var(--surface)' }}>
              {modelos.map((m, i) => (
                <button key={m.produto_id} type="button" onClick={() => onEscolher({ produto_id: m.produto_id, descricao: m.descricao, preco_venda: m.preco_venda || 0 })}
                  style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 10, alignItems: 'center', padding: '8px 12px', fontSize: 13, textAlign: 'left', background: 'transparent', border: 'none', borderBottom: i < modelos.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.descricao}{m.subcategoria_nome ? <span style={{ color: 'var(--text-muted)' }}> · {m.subcategoria_nome}</span> : null}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: m.quantidade > 0 ? 'var(--text-muted)' : 'var(--red)' }}>{m.quantidade} un</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--text)' }}>{brl(m.preco_venda)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {aviso && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--amber, #d97706)' }}>{aviso}</div>}
    </div>
  );
}
