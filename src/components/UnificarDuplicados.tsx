import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Icone from './Icone';

// Cadastros repetidos (mesmo CPF, telefone ou nome): escolher o principal, conferir os dados e unificar.
interface Cli { id: string; nome: string; cpf: string | null; celular: string | null; telefone: string | null; email: string | null; data_nascimento: string | null; cidade: string | null; bairro: string | null; created_at: string; codigo?: number | null; vendas: number; os: number; total: number; ultima: string | null }
interface Grupo { motivos: string[]; clientes: Cli[] }

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtD = (s?: string | null) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '-');
const CAMPOS: { k: keyof Cli; l: string }[] = [{ k: 'nome', l: 'Nome' }, { k: 'cpf', l: 'CPF' }, { k: 'celular', l: 'Celular' }, { k: 'telefone', l: 'Telefone' }, { k: 'email', l: 'E-mail' }, { k: 'data_nascimento', l: 'Nascimento' }];
const IGNORAR = 'duplicados_ignorados';
const chaveGrupo = (g: Grupo) => g.clientes.map(c => c.id).sort().join('|');
const lerIgnorados = (): string[] => { try { return JSON.parse(localStorage.getItem(IGNORAR) || '[]'); } catch { return []; } };

function GrupoCard({ g, onFeito, onIgnorar }: { g: Grupo; onFeito: () => void; onIgnorar: () => void }) {
  const [principal, setPrincipal] = useState(g.clientes[0].id);
  const [juntar, setJuntar] = useState<Set<string>>(new Set(g.clientes.map(c => c.id)));
  const p = g.clientes.find(c => c.id === principal)!;
  const melhor = (k: keyof Cli) => String(p[k] || g.clientes.find(c => juntar.has(c.id) && c[k])?.[k] || '');
  const [dados, setDados] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => { setDados(Object.fromEntries(CAMPOS.map(c => [c.k, melhor(c.k).slice(0, c.k === 'data_nascimento' ? 10 : 200)]))); }, [principal, juntar.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const outros = g.clientes.filter(c => c.id !== principal && juntar.has(c.id)).map(c => c.id);
  async function unificar() {
    if (!outros.length) return;
    if (!confirm(`Unificar ${outros.length + 1} cadastros em "${dados.nome || p.nome}"? As vendas, OS e carnês dos outros passam para este cadastro.`)) return;
    setSalvando(true); setErro('');
    try { await api.post('/clientes/unificar', { principal_id: principal, outros, dados }); onFeito(); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); }
    setSalvando(false);
  }
  const inp: React.CSSProperties = { width: '100%', height: 32, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '9px 12px', background: 'var(--surface-alt)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{g.clientes.length} cadastros · <b style={{ color: '#d97706' }}>{g.motivos.join(', ')}</b></span>
        <button className="btn btn-xs" onClick={onIgnorar}>Não é a mesma pessoa</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead><tr>{['Principal', 'Juntar', 'Nome', 'CPF', 'Celular', 'Cidade', 'Cadastro', 'Vendas', 'Total'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
          <tbody>
            {g.clientes.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: c.id === principal ? 'var(--primary-dim)' : undefined }}>
                <td style={{ padding: '6px 8px' }}><input type="radio" checked={c.id === principal} onChange={() => { setPrincipal(c.id); setJuntar(s => new Set(s).add(c.id)); }} /></td>
                <td style={{ padding: '6px 8px' }}><input type="checkbox" disabled={c.id === principal} checked={juntar.has(c.id)} onChange={e => setJuntar(s => { const n = new Set(s); if (e.target.checked) n.add(c.id); else n.delete(c.id); return n; })} /></td>
                <td style={{ padding: '6px 8px', color: 'var(--text)', fontWeight: 600 }}><a href={`/clientes/${c.id}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{c.nome}</a></td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)' }}>{c.cpf || '-'}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)' }}>{c.celular || c.telefone || '-'}</td>
                <td style={{ padding: '6px 8px', color: 'var(--text-dim)' }}>{[c.bairro, c.cidade].filter(Boolean).join(' · ') || '-'}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{fmtD(c.created_at)}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)' }}>{c.vendas}{c.os ? ` + ${c.os} OS` : ''}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--mono)' }}>{brl(c.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Como o cadastro vai ficar (confira e corrija)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          {CAMPOS.map(f => (
            <label key={f.k} style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{f.l}
              <input type={f.k === 'data_nascimento' ? 'date' : 'text'} style={{ ...inp, marginTop: 3, fontFamily: f.k === 'nome' || f.k === 'email' ? undefined : 'var(--mono)' }}
                value={dados[f.k] || ''} onChange={e => setDados(d => ({ ...d, [f.k]: e.target.value }))} />
            </label>
          ))}
        </div>
        {erro && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 8 }}>{erro}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn btn-sm btn-prim" disabled={!outros.length || salvando} onClick={unificar}>
            <Icone nome="usuarios" size={14} />{salvando ? 'Unificando...' : `Unificar ${outros.length + 1} cadastros`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnificarDuplicados({ onClose, onMudou }: { onClose: () => void; onMudou: () => void }) {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [erro, setErro] = useState('');
  const [ignorados, setIgnorados] = useState<string[]>(lerIgnorados);
  const load = () => { setGrupos(null); api.get<{ grupos: Grupo[] }>('/clientes/duplicados').then(r => setGrupos(r.grupos)).catch(e => setErro(e instanceof Error ? e.message : 'Erro')); };
  useEffect(load, []);
  function ignorar(g: Grupo) {
    const n = [...ignorados, chaveGrupo(g)];
    setIgnorados(n);
    try { localStorage.setItem(IGNORAR, JSON.stringify(n)); } catch { /* ok */ }
  }
  const visiveis = (grupos || []).filter(g => !ignorados.includes(chaveGrupo(g)));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-largo" style={{ maxWidth: 980, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: 'var(--text)' }}>Clientes duplicados</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              {grupos ? `${visiveis.length} grupo(s) com o mesmo CPF, telefone ou nome. Marque o principal, confira os dados e unifique.` : 'Procurando...'}
            </p>
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label="Fechar"><Icone nome="fechar" size={15} /></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', display: 'grid', gap: 12 }}>
          {erro && <div style={{ color: 'var(--red)', fontSize: 13 }}>{erro}</div>}
          {grupos && !visiveis.length && <div style={{ padding: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)' }}>Nenhum cadastro repetido encontrado.</div>}
          {visiveis.map(g => <GrupoCard key={chaveGrupo(g)} g={g} onIgnorar={() => ignorar(g)} onFeito={() => { load(); onMudou(); }} />)}
        </div>
      </div>
    </div>
  );
}
