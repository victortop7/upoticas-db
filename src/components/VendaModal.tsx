import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Cliente } from '../types';

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

export default function VendaModal({ venda, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    loadClientes('');
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
  }, [venda]);

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
    if (!form.valor_total || parseFloat(form.valor_total) <= 0) {
      setErro('Informe o valor total da venda');
      return;
    }
    setSaving(true);
    setErro('');
    try {
      if (venda) {
        await api.put(`/vendas/${venda.id}`, form);
      } else {
        await api.post('/vendas', form);
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

  return (
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
            <label style={labelStyle}>Cliente (opcional)</label>
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

          {/* Forma de pagamento + situação */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Forma de Pagamento</label>
              <select style={inputStyle} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
                {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Situação</label>
              <select style={inputStyle} value={form.situacao} onChange={e => set('situacao', e.target.value)}>
                <option value="ativa">Ativa</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Valores */}
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

          {/* Resumo valor final */}
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
  );
}
