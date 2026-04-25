import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Cliente } from '../types';

interface Props {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
  zIndex?: number;
}

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function ClienteModal({ cliente, onClose, onSaved, zIndex = 1000 }: Props) {
  const [form, setForm] = useState({
    nome: '', apelido: '', cpf: '', telefone: '', celular: '', email: '',
    data_nascimento: '', endereco: '', bairro: '', cidade: '', uf: '', cep: '',
    observacao: '',
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<'dados' | 'endereco' | 'obs'>('dados');

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        apelido: cliente.apelido || '',
        cpf: cliente.cpf || '',
        telefone: cliente.telefone || '',
        celular: cliente.celular || '',
        email: cliente.email || '',
        data_nascimento: cliente.data_nascimento || '',
        endereco: cliente.endereco || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        uf: cliente.uf || '',
        cep: cliente.cep || '',
        observacao: cliente.observacao || '',
      });
    }
  }, [cliente]);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSaving(true);
    setErro('');
    try {
      if (cliente) {
        await api.put(`/clientes/${cliente.id}`, form);
      } else {
        await api.post('/clientes', form);
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

  const fieldStyle: React.CSSProperties = { marginBottom: '14px' };

  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex, padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: '16px',
        border: '1px solid var(--border)', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
              {cliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {cliente ? `Editando ${cliente.nome}` : 'Preencha os dados do cliente'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', border: 'none', borderRadius: '8px',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex', gap: '4px', padding: '12px 24px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          {([['dados', 'Dados'], ['endereco', 'Endereço'], ['obs', 'Observação']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)} style={{
              padding: '7px 14px', fontSize: '13px', fontWeight: '500',
              border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
              background: aba === key ? 'var(--primary)' : 'transparent',
              color: aba === key ? 'white' : 'var(--text-dim)',
              marginBottom: '-1px',
              borderBottom: aba === key ? '1px solid var(--primary)' : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {aba === 'dados' && (
            <>
              <div style={fieldStyle}>
                <label style={labelStyle}>Nome *</label>
                <input style={inputStyle} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" autoFocus />
              </div>
              <div style={row2}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Apelido</label>
                  <input style={inputStyle} value={form.apelido} onChange={e => set('apelido', e.target.value)} placeholder="Como é chamado" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>CPF</label>
                  <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>
              <div style={row2}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Celular</label>
                  <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.celular} onChange={e => set('celular', e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Telefone</label>
                  <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" />
                </div>
              </div>
              <div style={row2}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>E-mail</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Data de Nascimento</label>
                  <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {aba === 'endereco' && (
            <>
              <div style={fieldStyle}>
                <label style={labelStyle}>CEP</label>
                <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.cep} onChange={e => set('cep', e.target.value)} placeholder="00000-000" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Endereço</label>
                <input style={inputStyle} value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, complemento" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Bairro</label>
                <input style={inputStyle} value={form.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro" />
              </div>
              <div style={row2}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Cidade</label>
                  <input style={inputStyle} value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>UF</label>
                  <select style={inputStyle} value={form.uf} onChange={e => set('uf', e.target.value)}>
                    <option value="">—</option>
                    {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {aba === 'obs' && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Observação</label>
              <textarea
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                value={form.observacao}
                onChange={e => set('observacao', e.target.value)}
                placeholder="Anotações sobre o cliente..."
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          {erro && <span style={{ fontSize: '13px', color: 'var(--red)', flex: 1, display: 'flex', alignItems: 'center' }}>{erro}</span>}
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', fontSize: '14px', fontWeight: '500',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '9px 20px', fontSize: '14px', fontWeight: '600',
            background: saving ? 'var(--primary-dim)' : 'var(--primary)',
            color: saving ? 'var(--primary)' : 'white',
            border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Salvando...' : cliente ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
