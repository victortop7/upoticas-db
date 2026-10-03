import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Loja { id: string; nome: string; endereco?: string; }
interface Usuario { id: string; nome: string; email: string; perfil: string; ativo: boolean; loja_id?: string | null; }
interface VendedorVenda { funcionario_id: string; nome: string; qtd: number; com_loja: number; primeira?: string; ultima?: string; }

const inp: React.CSSProperties = { padding: '9px 11px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

// Form inline pra criar o acesso (vendedora) de uma loja
function NovoAcesso({ lojaId, onSaved }: { lojaId: string; onSaved: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  async function criar() {
    if (!nome.trim() || !email.trim() || senha.length < 6) { setErro('Preencha nome, e-mail e senha (mín. 6).'); return; }
    setSaving(true); setErro('');
    try {
      await api.post('/usuarios', { nome: nome.trim(), email: email.trim().toLowerCase(), senha, perfil: 'vendedor', loja_id: lojaId });
      setNome(''); setEmail(''); setSenha(''); setAberto(false); onSaved();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); } finally { setSaving(false); }
  }

  if (!aberto) return (
    <button onClick={() => setAberto(true)} style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
      + Criar acesso de vendedor(a) desta loja
    </button>
  );

  return (
    <div style={{ marginTop: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Novo acesso (vendedor)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <input style={inp} placeholder="Nome (ex: Brena)" value={nome} onChange={e => setNome(e.target.value)} />
        <input style={inp} placeholder="E-mail (login)" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={inp} type="text" placeholder="Senha (mín. 6)" value={senha} onChange={e => setSenha(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={criar} disabled={saving} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? '...' : 'Criar acesso'}</button>
          <button onClick={() => setAberto(false)} style={{ padding: '9px 12px', fontSize: 13, background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>×</button>
        </div>
      </div>
      {erro && <p style={{ margin: 0, fontSize: 12, color: 'var(--red)' }}>{erro}</p>}
      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>O e-mail é o login (não precisa ser real). Anote a senha pra passar pra ela.</p>
    </div>
  );
}

export default function Lojas() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'admin';
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [vends, setVends] = useState<VendedorVenda[]>([]);
  const [selVinc, setSelVinc] = useState<Record<string, { loja_id: string; desde: string }>>({});
  const [aplicando, setAplicando] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Loja[]>('/lojas').catch(() => [] as Loja[]),
      api.get<{ usuarios: Usuario[] }>('/usuarios').then(r => r.usuarios).catch(() => [] as Usuario[]),
      api.get<VendedorVenda[]>('/lojas/vendedores').catch(() => [] as VendedorVenda[]),
    ]).then(([ls, us, vs]) => { setLojas(ls); setUsuarios(us); setVends(vs); }).finally(() => setLoading(false));
  }, []);

  async function aplicarVinculo(fid: string) {
    const sel = selVinc[fid];
    if (!sel?.loja_id) { alert('Escolha a loja desse vendedor primeiro.'); return; }
    setAplicando(fid);
    try {
      const r = await api.post<{ vendas: number; os: number }>('/lojas/vincular', { funcionario_id: fid, loja_id: sel.loja_id, desde: sel.desde || undefined });
      alert(`Pronto! ${r.vendas} venda(s)${r.os ? ' e ' + r.os + ' OS' : ''} vinculada(s) à loja.`);
      load();
    } catch (e) { alert('Erro: ' + (e instanceof Error ? e.message : '')); }
    setAplicando(null);
  }
  useEffect(() => { load(); }, [load]);

  async function criarLoja() {
    if (!nome.trim()) { setErro('Informe o nome da loja'); return; }
    setSaving(true); setErro('');
    try {
      await api.post('/lojas', { nome: nome.trim(), endereco: endereco.trim() || null });
      setNome(''); setEndereco(''); load();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); } finally { setSaving(false); }
  }

  async function excluirLoja(id: string, nm: string) {
    if (!confirm(`Remover a loja "${nm}" da lista? (os dados continuam salvos)`)) return;
    try { await api.delete(`/lojas/${id}`); load(); } catch {}
  }
  async function removerAcesso(id: string, nm: string) {
    if (!confirm(`Desativar o acesso de "${nm}"?`)) return;
    try { await api.delete(`/usuarios/${id}`); load(); } catch {}
  }

  if (!isAdmin) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Apenas a administradora (Patrícia) acessa esta tela.</div>;

  const vendedoresDa = (lojaId: string) => usuarios.filter(u => u.ativo && u.loja_id === lojaId && u.perfil !== 'admin');

  return (
    <div style={{ padding: '32px', maxWidth: 820 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Lojas & Acessos</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-dim)' }}>Crie as lojas e, em cada uma, o acesso da vendedora. Cada vendedora só vê a própria loja; você (admin) vê todas.</p>
      </div>

      {/* Nova loja */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>+ Nova loja</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Nome (ex: São Cristóvão)" value={nome} onChange={e => setNome(e.target.value)} />
          <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Endereço / bairro (opcional)" value={endereco} onChange={e => setEndereco(e.target.value)} />
          <button onClick={criarLoja} disabled={saving} style={{ padding: '9px 20px', fontSize: 14, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? '...' : 'Adicionar loja'}</button>
        </div>
        {erro && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--red)' }}>{erro}</p>}
      </div>

      {/* Lista de lojas com seus acessos */}
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</div>
        : lojas.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>Nenhuma loja ainda. Adicione a primeira acima (ex: São Cristóvão).</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lojas.map(l => {
            const vs = vendedoresDa(l.id);
            return (
              <div key={l.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>🏬 {l.nome}</div>
                    {l.endereco && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.endereco}</div>}
                  </div>
                  <button onClick={() => excluirLoja(l.id, l.nome)} style={{ padding: '5px 10px', fontSize: 12, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Remover loja</button>
                </div>

                <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Acessos desta loja</div>
                  {vs.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum acesso ainda.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {vs.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', borderRadius: 8, padding: '8px 12px' }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>👤 {u.nome}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--mono)', marginLeft: 10 }}>{u.email}</span>
                          </div>
                          <button onClick={() => removerAcesso(u.id, u.nome)} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Desativar</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <NovoAcesso lojaId={l.id} onSaved={load} />
                </div>
              </div>
            );
          })}
        </div>}

      {/* Vincular vendas/OS já feitas às lojas */}
      {lojas.length > 0 && vends.length > 0 && (
        <div style={{ marginTop: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Vincular vendas já feitas às lojas</div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
            Para cada vendedor, escolha a loja e clique em Aplicar. As vendas (e OS) dele vão pra essa loja. Use “a partir de” se quiser só de uma data em diante.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vends.map(v => {
              const sel = selVinc[v.funcionario_id] || { loja_id: '', desde: '' };
              const upd = (patch: Partial<{ loja_id: string; desde: string }>) => setSelVinc(s => ({ ...s, [v.funcionario_id]: { ...sel, ...patch } }));
              return (
                <div key={v.funcionario_id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface-alt)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ minWidth: 150, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.qtd} venda(s){v.com_loja > 0 ? ` · ${v.com_loja} já com loja` : ''}</div>
                  </div>
                  <select style={{ ...inp, width: 170 }} value={sel.loja_id} onChange={e => upd({ loja_id: e.target.value })}>
                    <option value="">— Escolher loja —</option>
                    {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>a partir de (opcional)</div>
                    <input type="date" style={{ ...inp, width: 150, fontFamily: 'var(--mono)' }} value={sel.desde} onChange={e => upd({ desde: e.target.value })} />
                  </div>
                  <button onClick={() => aplicarVinculo(v.funcionario_id)} disabled={aplicando === v.funcionario_id} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    {aplicando === v.funcionario_id ? '...' : 'Aplicar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
