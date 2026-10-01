import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Loja { id: string; nome: string; endereco?: string; }

const inp: React.CSSProperties = { padding: '9px 11px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

export default function Lojas() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'admin';
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get<Loja[]>('/lojas').then(setLojas).catch(() => setLojas([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function criar() {
    if (!nome.trim()) { setErro('Informe o nome da loja'); return; }
    setSaving(true); setErro('');
    try {
      await api.post('/lojas', { nome: nome.trim(), endereco: endereco.trim() || null });
      setNome(''); setEndereco(''); load();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); } finally { setSaving(false); }
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Remover a loja "${nome}" da lista? (os dados dela continuam salvos)`)) return;
    try { await api.delete(`/lojas/${id}`); load(); } catch {}
  }

  if (!isAdmin) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Apenas administradores acessam as lojas.</div>;

  return (
    <div style={{ padding: '32px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Lojas</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-dim)' }}>Cadastre as lojas e depois vincule cada vendedor à sua loja em “Usuários”.</p>
      </div>

      {/* Nova loja */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>+ Nova loja</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Nome (ex: São Cristóvão)" value={nome} onChange={e => setNome(e.target.value)} />
          <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Endereço / bairro (opcional)" value={endereco} onChange={e => setEndereco(e.target.value)} />
          <button onClick={criar} disabled={saving} style={{ padding: '9px 20px', fontSize: 14, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? '...' : 'Adicionar'}</button>
        </div>
        {erro && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--red)' }}>{erro}</p>}
      </div>

      {/* Lista */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</div>
          : lojas.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma loja cadastrada. Adicione a primeira acima.</div>
          : lojas.map((l, i) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < lojas.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>🏬 {l.nome}</div>
                {l.endereco && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.endereco}</div>}
              </div>
              <button onClick={() => excluir(l.id, l.nome)} style={{ padding: '6px 12px', fontSize: 12, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Remover</button>
            </div>
          ))}
      </div>
    </div>
  );
}
