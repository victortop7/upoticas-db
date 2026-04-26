import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { whatsappLink, foneValido, aplicarVariaveis } from '../../lib/whatsapp';
import { useAuth } from '../../hooks/useAuth';

interface Campanha { id: string; nome: string; mensagem: string; situacao: string; total_clientes: number; enviados: number; created_at: string; }
interface Modelo { id: string; nome: string; categoria: string; corpo: string; }
interface Cliente { id: string; nome: string; celular?: string; telefone?: string; }

const SIT_COLOR: Record<string, { bg: string; color: string }> = {
  rascunho:  { bg: 'var(--surface-alt)', color: 'var(--text-muted)' },
  enviada:   { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  cancelada: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
};
const SIT_LABEL: Record<string, string> = { rascunho: 'Rascunho', enviada: 'Enviada', cancelada: 'Cancelada' };

function fmtDate(s: string) { const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }

function NovaCampanhaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { tenant } = useAuth();
  const [step, setStep] = useState<'config' | 'envio'>('config');
  const [form, setForm] = useState({ nome: '', mensagem: '', modelo_id: '' });
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [campanhaId, setCampanhaId] = useState('');
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Modelo[]>('/marketing/modelos'),
      api.get<{ clientes: Cliente[] }>('/clientes?page=1').then(r => r.clientes),
    ]).then(([m, c]) => { setModelos(m); setClientes(c.filter(cl => foneValido(cl.celular || cl.telefone))); });
  }, []);

  function handleModelo(id: string) {
    const m = modelos.find(m => m.id === id);
    setForm(f => ({ ...f, modelo_id: id, mensagem: m?.corpo || f.mensagem }));
  }

  async function criarEAvancar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (!form.mensagem.trim()) { setErro('Mensagem é obrigatória'); return; }
    setSaving(true); setErro('');
    try {
      const res = await api.post<{ id: string }>('/marketing/campanhas', {
        ...form, total_clientes: clientes.length,
      });
      setCampanhaId(res.id);
      setStep('envio');
    } catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }

  async function enviarWhatsApp(cliente: Cliente) {
    const fone = cliente.celular || cliente.telefone || '';
    const msg = aplicarVariaveis(form.mensagem, {
      nome: cliente.nome.split(' ')[0],
      loja: tenant?.nome || 'nossa loja',
    });
    window.open(whatsappLink(fone, msg), '_blank');
    const novos = new Set([...enviados, cliente.id]);
    setEnviados(novos);
    await api.post('/marketing/historico', {
      campanha_id: campanhaId,
      cliente_id: cliente.id, cliente_nome: cliente.nome,
      celular: fone, mensagem: msg, tipo: 'promocao',
    }).catch(() => {});
    if (campanhaId) {
      await api.put(`/marketing/campanhas/${campanhaId}`, {
        nome: form.nome, mensagem: form.mensagem,
        situacao: novos.size === clientes.length ? 'enviada' : 'rascunho',
        enviados: novos.size, total_clientes: clientes.length,
      }).catch(() => {});
    }
  }

  async function finalizarCampanha() {
    if (campanhaId) {
      await api.put(`/marketing/campanhas/${campanhaId}`, {
        nome: form.nome, mensagem: form.mensagem,
        situacao: 'enviada', enviados: enviados.size, total_clientes: clientes.length,
      }).catch(() => {});
    }
    onSaved();
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '600px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
              {step === 'config' ? 'Nova Campanha' : `Enviando: ${form.nome}`}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              {step === 'config' ? 'Configure a mensagem' : `${enviados.size} / ${clientes.length} enviados`}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {step === 'config' ? (
          <form onSubmit={criarEAvancar} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ marginBottom: '14px' }}><label style={lbl}>Nome da campanha *</label><input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Promoção de Inverno" autoFocus /></div>
            {modelos.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Usar modelo</label>
                <select style={inp} value={form.modelo_id} onChange={e => handleModelo(e.target.value)}>
                  <option value="">— Sem modelo (escrever agora) —</option>
                  {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Mensagem * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({form.mensagem.length} chars)</span></label>
              <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical' }} value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} placeholder="Digite a mensagem..." />
            </div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Clientes com WhatsApp cadastrado</span>
              <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--mono)', color: '#16a34a' }}>{clientes.length}</span>
            </div>
            {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving || clientes.length === 0} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving || clientes.length === 0 ? 'var(--primary-dim)' : 'var(--primary)', color: saving || clientes.length === 0 ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving || clientes.length === 0 ? 'default' : 'pointer' }}>
                {saving ? 'Criando...' : `Avançar → Enviar para ${clientes.length} clientes`}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Barra de progresso */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#25D366', borderRadius: '3px', width: `${clientes.length > 0 ? (enviados.size / clientes.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {clientes.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < clientes.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 20px', fontSize: '14px', color: 'var(--text)' }}>{c.nome}</td>
                    <td style={{ padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>{c.celular || c.telefone}</td>
                    <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                      <button onClick={() => enviarWhatsApp(c)} style={{
                        padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                        background: enviados.has(c.id) ? 'rgba(34,197,94,0.12)' : '#25D366',
                        color: enviados.has(c.id) ? '#16a34a' : 'white',
                        border: 'none', borderRadius: '6px', cursor: 'pointer',
                      }}>
                        {enviados.has(c.id) ? '✓ Enviado' : '📱 WhatsApp'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={finalizarCampanha} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Finalizar campanha ({enviados.size} enviados)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCampanhas(await api.get<Campanha[]>('/marketing/campanhas')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir campanha "${nome}"?`)) return;
    await api.delete(`/marketing/campanhas/${id}`);
    load();
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Campanhas</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>{campanhas.length} campanha{campanhas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Nova Campanha</button>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</p> : !campanhas.length ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Nenhuma campanha ainda. Crie sua primeira campanha para disparar mensagens para seus clientes!
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Campanha', 'Data', 'Clientes', 'Enviados', 'Situação', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campanhas.map((c, i) => {
                const sc = SIT_COLOR[c.situacao] || SIT_COLOR.rascunho;
                const pct = c.total_clientes > 0 ? Math.round((c.enviados / c.total_clientes) * 100) : 0;
                return (
                  <tr key={c.id} style={{ borderBottom: i < campanhas.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{c.nome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.mensagem}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>{fmtDate(c.created_at)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>{c.total_clientes}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)', marginBottom: '4px' }}>{c.enviados} / {c.total_clientes} ({pct}%)</div>
                      <div style={{ height: '4px', background: 'var(--surface-alt)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', background: '#25D366', borderRadius: '2px', width: `${pct}%` }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: sc.bg, color: sc.color }}>{SIT_LABEL[c.situacao]}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => excluir(c.id, c.nome)} style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <NovaCampanhaModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
