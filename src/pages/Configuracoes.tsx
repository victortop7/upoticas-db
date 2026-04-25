import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface TenantConfig {
  id: string;
  nome: string;
  email: string;
  plano: string;
  trial_expira?: string;
  telefone?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  created_at: string;
}

export default function Configuracoes() {
  const { setAuth, usuario, tenant } = useAuth();
  const [form, setForm] = useState({ nome: '', telefone: '', cnpj: '', endereco: '', cidade: '', uf: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState('');
  const [config, setConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    api.get<TenantConfig>('/configuracoes').then(data => {
      setConfig(data);
      setForm({
        nome: data.nome || '',
        telefone: data.telefone || '',
        cnpj: data.cnpj || '',
        endereco: data.endereco || '',
        cidade: data.cidade || '',
        uf: data.uf || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSaving(true);
    setErro('');
    setSaved(false);
    try {
      const updated = await api.put<TenantConfig>('/configuracoes', form);
      setConfig(updated);
      // Atualiza o contexto de auth para refletir novo nome
      if (tenant && usuario) {
        setAuth({ token: null, usuario, tenant: { ...tenant, nome: updated.nome } });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '500',
    color: 'var(--text-muted)', marginBottom: '5px',
  };

  const PLANO_LABEL: Record<string, string> = { trial: 'Trial', basico: 'Básico', pro: 'Pro' };
  const PLANO_COLOR: Record<string, string> = { trial: '#d97706', basico: '#2563eb', pro: '#7c3aed' };

  if (loading) return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Configurações</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Dados da sua ótica</p>
      </div>

      {/* Plano */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '18px 20px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plano atual</p>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: PLANO_COLOR[config?.plano || 'trial'] }}>
            {PLANO_LABEL[config?.plano || 'trial']}
          </p>
        </div>
        {config?.plano === 'trial' && config.trial_expira && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--text-muted)' }}>Expira em</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#d97706', fontFamily: 'var(--mono)' }}>
              {new Date(config.trial_expira).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--text-muted)' }}>Conta criada em</p>
          <p style={{ margin: 0, fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
            {new Date(config?.created_at || '').toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Dados da Ótica</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Nome da Ótica *</label>
          <input style={inputStyle} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome da sua ótica" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" />
          </div>
          <div>
            <label style={labelStyle}>CNPJ</label>
            <input style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Endereço</label>
          <input style={inputStyle} value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyle}>Cidade</label>
            <input style={inputStyle} value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" />
          </div>
          <div style={{ width: '90px' }}>
            <label style={labelStyle}>UF</label>
            <select style={inputStyle} value={form.uf} onChange={e => set('uf', e.target.value)}>
              <option value="">—</option>
              {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="submit" disabled={saving} style={{
            padding: '10px 24px', fontSize: '14px', fontWeight: '600',
            background: saving ? 'var(--primary-dim)' : 'var(--primary)',
            color: saving ? 'var(--primary)' : 'white',
            border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          {saved && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '500' }}>✓ Salvo com sucesso</span>}
          {erro && <span style={{ fontSize: '13px', color: 'var(--red)' }}>{erro}</span>}
        </div>
      </form>

      {/* E-mail (read-only) */}
      <div style={{ marginTop: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-mail da conta</p>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontFamily: 'var(--mono)' }}>{config?.email}</p>
      </div>
    </div>
  );
}
