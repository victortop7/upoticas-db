import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

function AlterarSenhaModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ senha_atual: '', nova_senha: '', confirmar: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.nova_senha !== form.confirmar) { setErro('As senhas não coincidem'); return; }
    if (form.nova_senha.length < 6) { setErro('Nova senha deve ter pelo menos 6 caracteres'); return; }
    setSaving(true); setErro('');
    try {
      await api.put('/auth/senha', { senha_atual: form.senha_atual, nova_senha: form.nova_senha });
      setOk(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao alterar senha');
    } finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>Alterar Senha</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {ok ? (
            <p style={{ textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '15px', margin: '8px 0 16px' }}>✓ Senha alterada com sucesso!</p>
          ) : (
            <>
              {[
                { field: 'senha_atual', label: 'Senha atual' },
                { field: 'nova_senha', label: 'Nova senha' },
                { field: 'confirmar', label: 'Confirmar nova senha' },
              ].map(({ field, label }) => (
                <div key={field} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</label>
                  <input type="password" style={inputStyle} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder="••••••" />
                </div>
              ))}
              {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? 'Salvando...' : 'Alterar'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

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
  nfce_api_key?: string;
  nfce_ambiente?: string;
  created_at: string;
}

export default function Configuracoes() {
  const { setAuth, usuario, tenant } = useAuth();
  const [form, setForm] = useState({ nome: '', telefone: '', cnpj: '', endereco: '', cidade: '', uf: '', nfce_api_key: '', nfce_ambiente: 'homologacao' });
  const [nfceSaved, setNfceSaved] = useState(false);
  const [nfceSaving, setNfceSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState('');
  const [senhaModalOpen, setSenhaModalOpen] = useState(false);
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
        nfce_api_key: data.nfce_api_key || '',
        nfce_ambiente: data.nfce_ambiente || 'homologacao',
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

      {/* E-mail + Senha */}
      <div style={{ marginTop: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-mail da conta</p>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontFamily: 'var(--mono)' }}>{config?.email}</p>
        </div>
        <button onClick={() => setSenhaModalOpen(true)} style={{
          padding: '8px 16px', fontSize: '13px', fontWeight: '500',
          background: 'var(--surface-alt)', color: 'var(--text-dim)',
          border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
        }}>Alterar senha</button>
      </div>

      {/* NFC-e */}
      <div style={{ marginTop: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>NFC-e / Nota Fiscal</h3>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: 'rgba(217,119,6,0.12)', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Em breve
          </span>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Configure sua chave de API para emitir NFC-e direto das vendas.
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Ambiente</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ v: 'homologacao', l: 'Homologação (teste)' }, { v: 'producao', l: 'Produção' }].map(({ v, l }) => (
              <button key={v} type="button"
                onClick={() => set('nfce_ambiente', v)}
                style={{
                  padding: '8px 16px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                  background: form.nfce_ambiente === v ? (v === 'producao' ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)') : 'transparent',
                  color: form.nfce_ambiente === v ? (v === 'producao' ? 'var(--green)' : 'var(--accent)') : 'var(--text-muted)',
                  border: `1px solid ${form.nfce_ambiente === v ? (v === 'producao' ? 'var(--green)' : 'var(--accent)') : 'var(--border)'}`,
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Chave API (Focus NF-e)</label>
          <input
            type="password"
            style={{ ...inputStyle, fontFamily: 'var(--mono)' }}
            value={form.nfce_api_key}
            onChange={e => set('nfce_api_key', e.target.value)}
            placeholder="Sua chave de API..."
          />
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Obtenha em <strong>app.focusnfe.com.br</strong> → Configurações → Tokens de API
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            disabled={nfceSaving}
            onClick={async () => {
              setNfceSaving(true);
              try {
                await api.put('/configuracoes', form);
                setNfceSaved(true);
                setTimeout(() => setNfceSaved(false), 3000);
              } catch {}
              setNfceSaving(false);
            }}
            style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {nfceSaving ? 'Salvando...' : 'Salvar configuração NFC-e'}
          </button>
          {nfceSaved && <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: '500' }}>✓ Salvo</span>}
        </div>
      </div>

      {senhaModalOpen && <AlterarSenhaModal onClose={() => setSenhaModalOpen(false)} />}
    </div>
  );
}
