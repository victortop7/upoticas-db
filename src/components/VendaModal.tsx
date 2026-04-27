import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Cliente } from '../types';
import ClienteModal from './ClienteModal';

interface Venda {
  id: string;
  numero: number;
  cliente_id?: string;
  os_id?: string;
  situacao: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento?: string;
  observacao?: string;
}

interface Props {
  venda: Venda | null;
  onClose: () => void;
  onSaved: () => void;
}

function NovoVendedorInline({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'vendedor', senha: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      const res = await api.post<{ id: string }>('/usuarios', form);
      onSaved(res.id);
    } catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Cadastrar Vendedor</h3>
          <button onClick={onClose} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: '10px' }}><label style={lbl}>Nome *</label><input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" autoFocus /></div>
          <div style={{ marginBottom: '10px' }}><label style={lbl}>E-mail *</label><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={lbl}>Perfil</label>
              <select style={inp} value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                <option value="vendedor">Vendedor</option><option value="marketing">Marketing</option><option value="caixa">Caixa</option><option value="admin">Admin</option>
              </select>
            </div>
            <div><label style={lbl}>Senha *</label><input type="password" style={inp} value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mín. 6 caracteres" /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            {erro && <span style={{ fontSize: '12px', color: 'var(--red)', flex: 1, alignSelf: 'center' }}>{erro}</span>}
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '7px', cursor: saving ? 'default' : 'pointer' }}>{saving ? 'Criando...' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FORMAS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'outro', label: 'Outro' },
];

const EMPTY = {
  cliente_id: '', os_id: '', situacao: 'ativa',
  valor_total: '', desconto: '', forma_pagamento: 'pix', observacao: '',
};

interface UsuarioSimples { id: string; nome: string; perfil: string; }

export default function VendaModal({ venda, onClose, onSaved }: Props) {
  const { usuario } = useAuth();
  const isMarketing = usuario?.perfil === 'marketing';
  const isAdmin = usuario?.perfil === 'admin';
  const [form, setForm] = useState({ ...EMPTY });
  const [funcionarioId, setFuncionarioId] = useState('');
  const [vendedores, setVendedores] = useState<UsuarioSimples[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoVendedorOpen, setNovoVendedorOpen] = useState(false);

  useEffect(() => {
    loadClientes('');
    if (isAdmin) {
      api.get<{ usuarios: UsuarioSimples[] }>('/usuarios').then(r =>
        setVendedores(r.usuarios.filter((u: any) => u.ativo))
      ).catch(() => {});
    }
    if (venda) {
      setForm({
        cliente_id: venda.cliente_id || '',
        os_id: venda.os_id || '',
        situacao: venda.situacao || 'ativa',
        valor_total: venda.valor_total != null ? String(venda.valor_total) : '',
        desconto: venda.desconto != null && venda.desconto > 0 ? String(venda.desconto) : '',
        forma_pagamento: venda.forma_pagamento || 'pix',
        observacao: venda.observacao || '',
      });
    }
  }, [venda, isAdmin]);

  async function loadClientes(q: string) {
    try {
      const params = new URLSearchParams({ page: '1' });
      if (q) params.set('busca', q);
      const res = await api.get<{ clientes: Cliente[] }>(`/clientes?${params}`);
      setClientes(res.clientes);
    } catch {}
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const valorFinal = (parseFloat(form.valor_total) || 0) - (parseFloat(form.desconto) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isMarketing && (!form.valor_total || parseFloat(form.valor_total) <= 0)) {
      setErro('Informe o valor total da venda');
      return;
    }
    setSaving(true);
    setErro('');
    try {
      const payload = {
        ...(isMarketing ? { ...form, valor_total: '0', desconto: '0', forma_pagamento: 'outro' } : form),
        ...(isAdmin && funcionarioId ? { funcionario_id: funcionarioId } : {}),
      };
      if (venda) {
        await api.put(`/vendas/${venda.id}`, payload);
      } else {
        await api.post('/vendas', payload);
      }
      onSaved();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '500',
    color: 'var(--text-muted)', marginBottom: '4px',
  };

  const clienteSelecionado = clientes.find(c => c.id === form.cliente_id);

  async function handleClienteCadastrado() {
    setNovoClienteOpen(false);
    // Recarrega lista e tenta selecionar o mais recente
    const res = await api.get<{ clientes: Cliente[] }>('/clientes?page=1');
    setClientes(res.clientes);
    if (res.clientes.length > 0) {
      // O mais recente está no topo após ordenação por nome — busca pelo created_at mais alto
      const mais_recente = [...res.clientes].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      set('cliente_id', mais_recente.id);
      setBuscaCliente(mais_recente.nome);
    }
  }

  async function recarregarVendedores() {
    const r = await api.get<{ usuarios: UsuarioSimples[] }>('/usuarios');
    const lista = r.usuarios.filter((u: any) => u.ativo);
    setVendedores(lista);
    setNovoVendedorOpen(false);
  }

  return (
    <>
    {novoClienteOpen && (
      <ClienteModal
        cliente={null}
        zIndex={1100}
        onClose={() => setNovoClienteOpen(false)}
        onSaved={handleClienteCadastrado}
      />
    )}
    {novoVendedorOpen && (
      <NovoVendedorInline onClose={() => setNovoVendedorOpen(false)} onSaved={async (id) => { await recarregarVendedores(); setFuncionarioId(id); }} />
    )}
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: '16px',
        border: '1px solid var(--border)', width: '100%', maxWidth: '480px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
              {venda ? `Venda #${String(venda.numero).padStart(4, '0')}` : 'Nova Venda'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {venda ? 'Editando venda' : 'Registrar nova venda'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', border: 'none', borderRadius: '8px',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Cliente */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Cliente (opcional)</label>
              <button type="button" onClick={() => setNovoClienteOpen(true)} style={{
                fontSize: '12px', fontWeight: '600', color: 'var(--primary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>+ Cadastrar novo</button>
            </div>
            <input
              style={inputStyle}
              placeholder="Buscar cliente..."
              value={buscaCliente}
              onChange={e => { setBuscaCliente(e.target.value); loadClientes(e.target.value); }}
            />
          </div>
          {clientes.length > 0 && (
            <div style={{
              border: '1px solid var(--border)', borderRadius: '8px',
              overflow: 'hidden', marginBottom: '14px', maxHeight: '150px', overflowY: 'auto',
            }}>
              <div
                onClick={() => { set('cliente_id', ''); setBuscaCliente(''); }}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  background: !form.cliente_id ? 'var(--surface-alt)' : 'transparent',
                }}
              >— Sem cliente —</div>
              {clientes.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => { set('cliente_id', c.id); setBuscaCliente(c.nome); }}
                  style={{
                    padding: '9px 14px', cursor: 'pointer', fontSize: '14px',
                    borderBottom: i < clientes.length - 1 ? '1px solid var(--border)' : 'none',
                    background: form.cliente_id === c.id ? 'var(--primary-dim)' : 'transparent',
                    color: form.cliente_id === c.id ? 'var(--primary)' : 'var(--text)',
                  }}
                  onMouseEnter={e => { if (form.cliente_id !== c.id) e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  onMouseLeave={e => { if (form.cliente_id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {c.nome}
                </div>
              ))}
            </div>
          )}
          {clienteSelecionado && (
            <div style={{
              background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: '8px', padding: '8px 12px', fontSize: '13px', marginBottom: '14px',
            }}>
              <span style={{ fontWeight: '600', color: 'var(--primary)' }}>✓ {clienteSelecionado.nome}</span>
            </div>
          )}

          {/* Vendedor (só admin vê) */}
          {isAdmin && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Vendedor</label>
                <button type="button" onClick={() => setNovoVendedorOpen(true)} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Cadastrar novo</button>
              </div>
              <select style={inputStyle} value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)}>
                <option value="">— Atribuir a mim mesmo —</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome} ({v.perfil})</option>
                ))}
              </select>
            </div>
          )}

          {/* Situação */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Situação</label>
            <select style={inputStyle} value={form.situacao} onChange={e => set('situacao', e.target.value)}>
              <option value="ativa">Ativa</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {isMarketing ? (
            <div style={{
              background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.2)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>📢</span>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#db2777' }}>Venda de Marketing</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Registrada sem valor — apenas para contabilização</p>
              </div>
            </div>
          ) : (
            <>
              {/* Forma de pagamento + Valores */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Forma de Pagamento</label>
                <select style={inputStyle} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
                  {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Valor Total (R$) *</label>
                  <input
                    type="number" step="0.01" min="0"
                    style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}
                    value={form.valor_total}
                    onChange={e => set('valor_total', e.target.value)}
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Desconto (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}
                    value={form.desconto}
                    onChange={e => set('desconto', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div style={{
                background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)',
                borderRadius: '10px', padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '14px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dim)' }}>Valor Final</span>
                <span style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--primary)' }}>
                  {valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Observação</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              placeholder="Notas adicionais..."
            />
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          {erro && <span style={{ fontSize: '13px', color: 'var(--red)', flex: 1, display: 'flex', alignItems: 'center' }}>{erro}</span>}
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', fontSize: '14px', fontWeight: '500',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '9px 20px', fontSize: '14px', fontWeight: '600',
            background: saving ? 'var(--primary-dim)' : 'var(--primary)',
            color: saving ? 'var(--primary)' : 'white',
            border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Salvando...' : venda ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
