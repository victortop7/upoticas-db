import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface Modelo { id: string; nome: string; categoria: string; corpo: string; }

const CATEGORIAS = [
  { value: 'aniversario', label: 'Aniversário', icon: '🎂' },
  { value: 'cobranca', label: 'Cobrança', icon: '💰' },
  { value: 'os', label: 'Ordem de Serviço', icon: '🔧' },
  { value: 'venda', label: 'Venda', icon: '🛒' },
  { value: 'promocao', label: 'Promoção', icon: '📢' },
];

const VARIAVEIS = ['{nome}', '{data}', '{numero_os}', '{valor}', '{loja}'];

const DEFAULTS: Record<string, string> = {
  aniversario: 'Olá {nome}! 🎂 Feliz aniversário! Na {loja} temos uma surpresa especial para você. Venha nos visitar!',
  cobranca: 'Olá {nome}, identificamos um valor em aberto de R$ {valor}. Entre em contato conosco para regularizar sua situação.',
  os: 'Olá {nome}! Seu óculos (OS #{numero_os}) está pronto para retirada. Estamos esperando por você na {loja}! 😊',
  venda: 'Olá {nome}! Obrigado pela sua compra na {loja}. Qualquer dúvida estamos à disposição!',
  promocao: 'Olá {nome}! Temos ofertas especiais esperando por você na {loja}. Venha conferir!',
};

function Modal({ modelo, onClose, onSaved }: { modelo: Modelo | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ nome: '', categoria: 'promocao', corpo: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (modelo) setForm({ nome: modelo.nome, categoria: modelo.categoria, corpo: modelo.corpo });
    else setForm({ nome: '', categoria: 'promocao', corpo: DEFAULTS['promocao'] });
  }, [modelo]);

  function handleCategoria(cat: string) {
    setForm(f => ({ ...f, categoria: cat, corpo: f.corpo || DEFAULTS[cat] || '' }));
  }

  function inserirVariavel(v: string) {
    setForm(f => ({ ...f, corpo: f.corpo + v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (!form.corpo.trim()) { setErro('Mensagem é obrigatória'); return; }
    setSaving(true); setErro('');
    try {
      if (modelo) await api.put(`/marketing/modelos/${modelo.id}`, form);
      else await api.post('/marketing/modelos', form);
      onSaved();
    } catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  const chars = form.corpo.length;
  const msgs = Math.ceil(chars / 160) || 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '560px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{modelo ? 'Editar Modelo' : 'Novo Modelo'}</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Nome do modelo *</label><input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Feliz Aniversário 50%" autoFocus /></div>
          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Categoria</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIAS.map(c => (
                <button key={c.value} type="button" onClick={() => handleCategoria(c.value)} style={{
                  padding: '6px 12px', fontSize: '12px', fontWeight: '500', borderRadius: '20px', cursor: 'pointer',
                  border: `1px solid ${form.categoria === c.value ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.categoria === c.value ? 'var(--primary-dim)' : 'transparent',
                  color: form.categoria === c.value ? 'var(--primary)' : 'var(--text-dim)',
                }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={lbl}>Mensagem *</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{chars} chars · {msgs} msg</span>
            </div>
            <textarea style={{ ...inp, minHeight: '120px', resize: 'vertical', lineHeight: '1.5' }} value={form.corpo} onChange={e => setForm(f => ({ ...f, corpo: e.target.value }))} placeholder="Digite a mensagem..." />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Variáveis disponíveis</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {VARIAVEIS.map(v => (
                <button key={v} type="button" onClick={() => inserirVariavel(v)} style={{ padding: '3px 8px', fontSize: '12px', fontFamily: 'var(--mono)', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--primary)' }}>{v}</button>
              ))}
            </div>
          </div>
          {/* Preview */}
          {form.corpo && (
            <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Preview</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>{form.corpo.replace(/\{nome\}/g, 'João').replace(/\{loja\}/g, 'Ótica Example').replace(/\{data\}/g, '26/04').replace(/\{numero_os\}/g, '0042').replace(/\{valor\}/g, '150,00')}</p>
            </div>
          )}
          {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Modelos() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Modelo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = catFiltro ? `?categoria=${catFiltro}` : '';
      setModelos(await api.get<Modelo[]>(`/marketing/modelos${params}`));
    } finally { setLoading(false); }
  }, [catFiltro]);

  useEffect(() => { load(); }, [load]);

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir modelo "${nome}"?`)) return;
    await api.delete(`/marketing/modelos/${id}`);
    load();
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', fontSize: '12px', fontWeight: '500', border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text-dim)' });

  const grupos = CATEGORIAS.map(c => ({ ...c, items: modelos.filter(m => m.categoria === c.value) })).filter(g => !catFiltro || g.value === catFiltro);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Modelos de Mensagem</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>{modelos.length} modelos cadastrados</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Novo Modelo</button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button style={filterBtn(catFiltro === '')} onClick={() => setCatFiltro('')}>Todos</button>
        {CATEGORIAS.map(c => <button key={c.value} style={filterBtn(catFiltro === c.value)} onClick={() => setCatFiltro(c.value)}>{c.icon} {c.label}</button>)}
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {grupos.map(grupo => grupo.items.length === 0 && catFiltro ? null : (
            <div key={grupo.value}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>{grupo.icon}</span>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{grupo.label}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1px 8px' }}>{grupo.items.length}</span>
              </div>
              {grupo.items.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 0 26px' }}>Nenhum modelo cadastrado</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                  {grupo.items.map(m => (
                    <div key={m.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{m.nome}</p>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => { setEditando(m); setModalOpen(true); }} style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--primary-dim)', color: 'var(--primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                          <button onClick={() => excluir(m.id, m.nome)} style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.corpo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && <Modal modelo={editando} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
