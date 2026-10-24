import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import Icone from './Icone';

// Receitas do cliente: várias, cada uma com data. Mostra também os graus que vieram das OS.

interface Receita { id: string; data: string; od_esf?: string | null; od_cil?: string | null; od_eixo?: string | null; oe_esf?: string | null; oe_cil?: string | null; oe_eixo?: string | null; adicao?: string | null; dp?: string | null; altura?: string | null; medico?: string | null; observacao?: string | null; usuario_nome?: string | null; created_at?: string }
type Grau = string | number | null | undefined;
export interface ReceitaOS { id: string; numero: number; created_at: string; longe_od_esf?: Grau; longe_od_cil?: Grau; longe_od_eixo?: Grau; longe_oe_esf?: Grau; longe_oe_cil?: Grau; longe_oe_eixo?: Grau; adicao?: Grau; dp?: Grau; altura?: Grau; medico?: string | null }

const CAMPOS = ['od_esf', 'od_cil', 'od_eixo', 'oe_esf', 'oe_cil', 'oe_eixo', 'adicao', 'dp', 'altura'] as const;
const hoje = () => new Date().toISOString().slice(0, 10);
const fmtD = (s?: string | null) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '-');
const g = (v: Grau, sinal = true) => {
  if (v === null || v === undefined || v === '') return '-';
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return String(v);
  return (sinal && n > 0 ? '+' : '') + n.toFixed(2).replace('.', ',');
};
const ex = (v: Grau) => (v === null || v === undefined || v === '' ? '-' : `${String(v).replace(/\.0+$/, '')}°`);
const VAZIA = (): Record<string, string> => ({ data: hoje(), medico: '', observacao: '', ...Object.fromEntries(CAMPOS.map(c => [c, ''])) });

export default function ReceitasCliente({ clienteId, os }: { clienteId: string; os: ReceitaOS[] }) {
  const [lista, setLista] = useState<Receita[]>([]);
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(() => { api.get<Receita[]>(`/clientes/${clienteId}/receitas`).then(setLista).catch(() => setLista([])); }, [clienteId]);
  useEffect(() => { load(); }, [load]);

  function editar(r: Receita) {
    setEditId(r.id); setErro('');
    setForm({ data: r.data, medico: r.medico || '', observacao: r.observacao || '', ...Object.fromEntries(CAMPOS.map(c => [c, String(r[c] ?? '')])) });
  }
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSalvando(true); setErro('');
    try {
      if (editId) await api.put(`/clientes/${clienteId}/receitas/${editId}`, form);
      else await api.post(`/clientes/${clienteId}/receitas`, form);
      setForm(null); setEditId(null); load();
    } catch (err) { setErro(err instanceof Error ? err.message.replace(/\s*\(HTTP \d+\)$/, '') : 'Erro ao salvar'); }
    setSalvando(false);
  }
  async function excluir(r: Receita) {
    if (!confirm(`Excluir a receita de ${fmtD(r.data)}?`)) return;
    await api.delete(`/clientes/${clienteId}/receitas/${r.id}`).catch(() => {});
    load();
  }

  const inp: React.CSSProperties = { width: '100%', height: 34, padding: '0 8px', fontSize: 13.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const mono: React.CSSProperties = { ...inp, fontFamily: 'var(--mono)', textAlign: 'center' };
  const th: React.CSSProperties = { padding: '6px 8px', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--sans)', borderBottom: '1px solid var(--border)' };
  const td: React.CSSProperties = { padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: 12.5 };

  // linhas da tabela: receitas lançadas + receitas que vieram das OS
  const linhas = [
    ...lista.map(r => ({ k: r.id, data: r.data, origem: 'Receita', od: [r.od_esf, r.od_cil, r.od_eixo], oe: [r.oe_esf, r.oe_cil, r.oe_eixo], ad: r.adicao, dp: r.dp, alt: r.altura, med: r.medico || '', obs: r.observacao || '', quem: r.usuario_nome || '', r })),
    ...os.map(o => ({ k: o.id, data: String(o.created_at).slice(0, 10), origem: `OS ${o.numero}`, od: [o.longe_od_esf, o.longe_od_cil, o.longe_od_eixo], oe: [o.longe_oe_esf, o.longe_oe_cil, o.longe_oe_eixo], ad: o.adicao, dp: o.dp, alt: o.altura, med: o.medico || '', obs: '', quem: '', r: null as Receita | null })),
  ].filter(x => [...x.od, ...x.oe, x.ad].some(v => v !== null && v !== undefined && v !== ''))
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{linhas.length ? `${linhas.length} receita(s), da mais nova para a mais antiga` : 'Nenhuma receita ainda.'}</span>
        {!form && <button className="btn btn-sm btn-prim" onClick={() => { setEditId(null); setForm(VAZIA()); setErro(''); }}><Icone nome="mais" size={14} strokeWidth={2.2} />Nova receita</button>}
      </div>

      {form && (
        <form onSubmit={salvar} style={{ border: '1px solid var(--primary)', borderRadius: 8, padding: 12, marginBottom: 14, background: 'var(--surface)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{editId ? 'Editar receita' : 'Nova receita'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: 10, marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Data da receita
              <input type="date" style={{ ...inp, fontFamily: 'var(--mono)', marginTop: 3 }} value={form.data} onChange={e => setForm(f => ({ ...f!, data: e.target.value }))} required />
            </label>
            <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Médico / clínica
              <input style={{ ...inp, marginTop: 3 }} value={form.medico} onChange={e => setForm(f => ({ ...f!, medico: e.target.value }))} placeholder="Nome do médico" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(3, minmax(0, 1fr))', gap: 6, alignItems: 'center', maxWidth: 460 }}>
            <span />
            {['Esférico', 'Cilíndrico', 'Eixo'].map(h => <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{h}</span>)}
            {(['od', 'oe'] as const).map(o => (
              <div key={o} style={{ display: 'contents' }}>
                <b style={{ fontSize: 13, color: 'var(--text)' }}>{o.toUpperCase()}</b>
                {['esf', 'cil', 'eixo'].map(c => (
                  <input key={c} type="number" step={c === 'eixo' ? '1' : '0.25'} style={mono} placeholder="-" value={form[`${o}_${c}`]} onChange={e => setForm(f => ({ ...f!, [`${o}_${c}`]: e.target.value }))} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 110px) minmax(0,1fr)', gap: 8, marginTop: 10 }}>
            {[{ k: 'adicao', l: 'Adição', s: '0.25' }, { k: 'dp', l: 'DP (mm)', s: '0.5' }, { k: 'altura', l: 'Altura', s: '0.5' }].map(f => (
              <label key={f.k} style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{f.l}
                <input type="number" step={f.s} style={{ ...mono, marginTop: 3 }} placeholder="-" value={form[f.k]} onChange={e => setForm(x => ({ ...x!, [f.k]: e.target.value }))} />
              </label>
            ))}
            <label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Observação
              <input style={{ ...inp, marginTop: 3 }} value={form.observacao} onChange={e => setForm(f => ({ ...f!, observacao: e.target.value }))} placeholder="Ex.: usar para perto" />
            </label>
          </div>
          {erro && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 8 }}>{erro}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-sm" onClick={() => { setForm(null); setEditId(null); }}>Cancelar</button>
            <button type="submit" className="btn btn-sm btn-prim" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar receita'}</button>
          </div>
        </form>
      )}

      {linhas.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Data', 'Origem', 'Olho', 'Esf', 'Cil', 'Eixo', 'Adição', 'DP', 'Altura', 'Médico', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {linhas.map(x => (['OD', 'OE'] as const).map((olho, i) => {
                const gr = i === 0 ? x.od : x.oe;
                return (
                  <tr key={x.k + olho} style={{ borderBottom: i === 1 ? '1px solid var(--border)' : undefined }}>
                    <td style={{ ...td, color: 'var(--text-dim)' }}>{i === 0 ? fmtD(x.data) : ''}</td>
                    <td style={{ ...td, fontFamily: 'var(--sans)', color: 'var(--text-dim)' }}>{i === 0 ? x.origem : ''}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{olho}</td>
                    <td style={td}>{g(gr[0])}</td>
                    <td style={td}>{g(gr[1])}</td>
                    <td style={td}>{ex(gr[2])}</td>
                    <td style={td}>{i === 0 ? g(x.ad) : ''}</td>
                    <td style={td}>{i === 0 ? g(x.dp, false) : ''}</td>
                    <td style={td}>{i === 0 ? g(x.alt, false) : ''}</td>
                    <td style={{ ...td, fontFamily: 'var(--sans)', color: 'var(--text-dim)' }}>{i === 0 ? [x.med, x.obs].filter(Boolean).join(' · ') : ''}</td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {i === 0 && x.r && <>
                        <button className="btn btn-xs" style={{ marginRight: 4 }} onClick={() => editar(x.r!)}><Icone nome="editar" size={12} />Editar</button>
                        <button className="btn btn-xs" title="Excluir" onClick={() => excluir(x.r!)}><Icone nome="excluir" size={12} color="var(--red)" /></button>
                      </>}
                      {i === 0 && !x.r && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>edite na OS</span>}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
