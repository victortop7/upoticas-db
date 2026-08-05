import { useState, useEffect, useCallback } from 'react';
import { adminRequest } from '../../lib/api';

/* ============================================================
   PAINEL ADMINISTRATIVO — Conexão Óticas
   Visual próprio (moderno / escuro), separado do Connect LAB.
   Autenticação: ADMIN_SECRET (Bearer).  Rota: /admin
   ============================================================ */

const C = {
  bg: '#0b0f19',
  bgAlt: '#0f1524',
  surface: '#151c2e',
  surfaceHi: '#1c2540',
  border: '#243049',
  borderHi: '#33405f',
  text: '#e7ecf5',
  dim: '#8894ac',
  muted: '#5a6885',
  accent: '#6d7cff',
  accentDim: 'rgba(109,124,255,0.14)',
  green: '#34d399',
  greenDim: 'rgba(52,211,153,0.14)',
  amber: '#fbbf24',
  amberDim: 'rgba(251,191,36,0.14)',
  red: '#f87171',
  redDim: 'rgba(248,113,113,0.14)',
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

interface Tenant {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  plano: string;
  ativo: number;
  bloqueado: number;
  trial_expira: string | null;
  licenca_expira: string | null;
  dispositivos_limite?: number;
  created_at: string;
  status: string;
}

interface Lead {
  id: string;
  tipo: string;
  nome: string;
  laboratorio: string | null;
  email: string;
  telefone: string | null;
  status: string;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ativo:          { label: 'Ativo',           color: C.green, bg: C.greenDim },
  trial:          { label: 'Trial',           color: C.accent, bg: C.accentDim },
  trial_expirado: { label: 'Trial expirado',  color: C.red, bg: C.redDim },
  expirado:       { label: 'Expirado',        color: C.red, bg: C.redDim },
  bloqueado:      { label: 'Bloqueado',       color: C.amber, bg: C.amberDim },
  desativado:     { label: 'Desativado',      color: C.dim, bg: 'rgba(136,148,172,0.12)' },
};

function fmtData(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

/* ─────────────── LOGIN (PIN 4 dígitos + senha) ─────────────── */
const PIN_CORRETO = '2423';

function LoginScreen({ onOk }: { onOk: (secret: string) => void }) {
  const [etapa, setEtapa] = useState<'pin' | 'senha'>(() => sessionStorage.getItem('admin_pin_ok') === '1' ? 'senha' : 'pin');
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [pinErro, setPinErro] = useState(false);
  const [secret, setSecret] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function press(d: string) {
    if (pin.length >= 4) return;
    const novo = pin + d;
    setPin(novo); setPinErro(false);
    if (novo.length === 4) {
      setTimeout(() => {
        if (novo === PIN_CORRETO) {
          sessionStorage.setItem('admin_pin_ok', '1');
          setEtapa('senha');
        } else {
          setPinErro(true); setShake(true);
          setTimeout(() => { setPin(''); setShake(false); }, 700);
        }
      }, 150);
    }
  }
  function del() { setPin(p => p.slice(0, -1)); setPinErro(false); }

  async function entrar() {
    if (!secret.trim()) return;
    setLoading(true); setErro('');
    try {
      await adminRequest<Tenant[]>('/admin/licencas', secret.trim());
      sessionStorage.setItem('admin_secret_v2', secret.trim());
      onOk(secret.trim());
    } catch {
      setErro('Senha incorreta. Verifique e tente novamente.');
      setLoading(false);
    }
  }

  const digits = ['1','2','3','4','5','6','7','8','9','←','0','✓'];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.sans, padding: 20 }}>
      <div style={{ width: 340, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>🛡️</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Painel Administrativo</div>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>Conexão Óticas · acesso restrito</div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          {etapa === 'pin' ? (
            <>
              <div style={{ textAlign: 'center', fontSize: 12.5, color: C.dim, fontWeight: 600, marginBottom: 16 }}>Digite o PIN de 4 dígitos</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18, animation: shake ? 'admShake 0.5s' : 'none' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: 40, height: 48, borderRadius: 10, border: `1.5px solid ${pinErro ? C.red : C.border}`, background: C.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: pinErro ? C.red : C.text }}>
                    {pin[i] ? '●' : ''}
                  </div>
                ))}
              </div>
              {pinErro && <div style={{ textAlign: 'center', color: C.red, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>PIN incorreto</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {digits.map(d => (
                  <button key={d} onClick={() => d === '←' ? del() : d === '✓' ? undefined : press(d)}
                    style={{ padding: '14px 0', fontSize: 18, fontWeight: 700, fontFamily: C.mono,
                      background: d === '←' || d === '✓' ? 'transparent' : C.bgAlt,
                      color: d === '✓' ? C.dim : C.text,
                      border: `1px solid ${C.border}`, borderRadius: 10, cursor: d === '✓' ? 'default' : 'pointer' }}>
                    {d}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha de acesso</label>
                <button onClick={() => { sessionStorage.removeItem('admin_pin_ok'); setPin(''); setEtapa('pin'); }} style={{ background: 'none', border: 'none', color: C.dim, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>voltar ao PIN</button>
              </div>
              <input type="password" value={secret} autoFocus
                onChange={e => { setSecret(e.target.value); setErro(''); }}
                onKeyDown={e => { if (e.key === 'Enter') entrar(); }}
                placeholder="••••••••••••"
                style={{ width: '100%', padding: '12px 14px', background: C.bgAlt, border: `1px solid ${erro ? C.red : C.border}`, borderRadius: 10, color: C.text, fontSize: 15, fontFamily: C.mono, outline: 'none', boxSizing: 'border-box' }} />
              {erro && <div style={{ color: C.red, fontSize: 12.5, marginTop: 8 }}>{erro}</div>}
              <button onClick={entrar} disabled={loading}
                style={{ width: '100%', marginTop: 16, padding: 12, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: C.sans }}>
                {loading ? 'Verificando…' : 'Entrar'}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes admShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

/* ─────────────── MODAL BASE ─────────────── */
function Modal({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 16, width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.dim, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: C.sans };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 6, display: 'block' };

/* ─────────────── NOVO CLIENTE ─────────────── */
function NovoCliente({ secret, onClose, onSaved }: { secret: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ nome: '', responsavel: '', email: '', senha: '', tipo: 'otica', plano: 'trial', dias_trial: '14', licenca_expira: '' });
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  async function salvar() {
    setErro('');
    if (!f.nome.trim() || !f.email.trim() || !f.senha) { setErro('Preencha nome, e-mail e senha.'); return; }
    if (f.senha.length < 6) { setErro('A senha precisa ter no mínimo 6 caracteres.'); return; }
    setSaving(true);
    try {
      await adminRequest('/admin/clientes', secret, {
        method: 'POST',
        body: JSON.stringify({
          nome: f.nome, responsavel: f.responsavel || f.nome, email: f.email, senha: f.senha,
          tipo: f.tipo, plano: f.plano,
          dias_trial: f.plano === 'trial' ? Number(f.dias_trial) || 14 : undefined,
          licenca_expira: (f.plano === 'mensal' || f.plano === 'anual') ? (f.licenca_expira || null) : null,
        }),
      });
      onSaved();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar cliente');
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo cliente" onClose={onClose} width={520}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={lbl}>Nome da empresa / ótica *</label>
          <input style={inp} value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Ótica Visão Clara" autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Responsável</label>
            <input style={inp} value={f.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do titular" />
          </div>
          <div>
            <label style={lbl}>Tipo de sistema</label>
            <select style={inp} value={f.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="otica">Connect Óticas</option>
              <option value="lab">Connect LAB</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>E-mail (login) *</label>
            <input style={inp} value={f.email} onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
          </div>
          <div>
            <label style={lbl}>Senha *</label>
            <input style={inp} value={f.senha} onChange={e => set('senha', e.target.value)} placeholder="mín. 6 caracteres" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Plano</label>
            <select style={inp} value={f.plano} onChange={e => set('plano', e.target.value)}>
              <option value="trial">Trial (avaliação)</option>
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
              <option value="vitalicio">Vitalício</option>
            </select>
          </div>
          {f.plano === 'trial' && (
            <div>
              <label style={lbl}>Dias de trial</label>
              <input style={inp} type="number" value={f.dias_trial} onChange={e => set('dias_trial', e.target.value)} />
            </div>
          )}
          {(f.plano === 'mensal' || f.plano === 'anual') && (
            <div>
              <label style={lbl}>Licença expira em</label>
              <input style={inp} type="date" value={f.licenca_expira} onChange={e => set('licenca_expira', e.target.value)} />
            </div>
          )}
        </div>
        {erro && <div style={{ color: C.red, fontSize: 13, background: C.redDim, padding: '9px 12px', borderRadius: 8 }}>{erro}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', background: 'transparent', color: C.dim, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ padding: '10px 22px', background: C.accent, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Criando…' : 'Criar cliente'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────── EDITAR LICENÇA ─────────────── */
function EditarLicenca({ secret, tenant, onClose, onSaved }: { secret: string; tenant: Tenant; onClose: () => void; onSaved: () => void }) {
  const [plano, setPlano] = useState(tenant.plano);
  const [licenca, setLicenca] = useState(tenant.licenca_expira ? tenant.licenca_expira.slice(0, 10) : '');
  const [bloqueado, setBloqueado] = useState(!!tenant.bloqueado);
  const [ativo, setAtivo] = useState(!!tenant.ativo);
  const [dispositivos, setDispositivos] = useState(String(tenant.dispositivos_limite ?? 1));
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    setSaving(true); setErro('');
    try {
      await adminRequest('/admin/licencas', secret, {
        method: 'PATCH',
        body: JSON.stringify({
          id: tenant.id, plano,
          licenca_expira: (plano === 'mensal' || plano === 'anual') ? (licenca || null) : null,
          bloqueado, ativo,
          dispositivos_limite: Number(dispositivos) || 1,
        }),
      });
      onSaved();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
      setSaving(false);
    }
  }

  return (
    <Modal title={`Licença · ${tenant.nome}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={lbl}>Plano</label>
          <select style={inp} value={plano} onChange={e => setPlano(e.target.value)}>
            <option value="trial">Trial</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
            <option value="vitalicio">Vitalício</option>
          </select>
        </div>
        {(plano === 'mensal' || plano === 'anual') && (
          <div>
            <label style={lbl}>Licença expira em</label>
            <input style={inp} type="date" value={licenca} onChange={e => setLicenca(e.target.value)} />
          </div>
        )}
        <div>
          <label style={lbl}>Limite de dispositivos (Connect Vision)</label>
          <input style={inp} type="number" min={1} value={dispositivos} onChange={e => setDispositivos(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: C.text, fontSize: 14 }}>
          <input type="checkbox" checked={bloqueado} onChange={e => setBloqueado(e.target.checked)} />
          Bloquear acesso (licença suspensa)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: C.text, fontSize: 14 }}>
          <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
          Conta ativa
        </label>
        {erro && <div style={{ color: C.red, fontSize: 13 }}>{erro}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', background: 'transparent', color: C.dim, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ padding: '10px 22px', background: C.accent, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────── KPI CARD ─────────────── */
function Kpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color, marginTop: 6, fontFamily: C.mono }}>{value}</div>
    </div>
  );
}

/* ─────────────── PAINEL PRINCIPAL ─────────────── */
export default function Admin() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret_v2') || '');
  const [authed, setAuthed] = useState(false);
  const [aba, setAba] = useState<'geral' | 'clientes' | 'leads'>('geral');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState<Tenant | null>(null);

  const carregar = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const [ts, ls] = await Promise.all([
        adminRequest<Tenant[]>('/admin/licencas', s),
        adminRequest<Lead[]>('/admin/leads', s).catch(() => [] as Lead[]),
      ]);
      setTenants(ts); setLeads(ls); setAuthed(true);
    } catch {
      sessionStorage.removeItem('admin_secret_v2'); setSecret(''); setAuthed(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (secret) carregar(secret); }, [secret, carregar]);

  function sair() { sessionStorage.removeItem('admin_secret_v2'); setSecret(''); setAuthed(false); }

  async function excluirCliente(t: Tenant) {
    if (!confirm(`Excluir o cliente "${t.nome}" e todos os seus usuários? Esta ação não pode ser desfeita.`)) return;
    await adminRequest(`/admin/licencas?id=${t.id}`, secret, { method: 'DELETE' });
    carregar(secret);
  }
  async function excluirLead(l: Lead) {
    if (!confirm(`Excluir o lead "${l.nome}"?`)) return;
    await adminRequest(`/admin/leads?id=${l.id}`, secret, { method: 'DELETE' });
    carregar(secret);
  }

  if (!authed) return <LoginScreen onOk={s => setSecret(s)} />;

  const clientes = tenants.filter(t =>
    !busca || t.nome.toLowerCase().includes(busca.toLowerCase()) || t.email.toLowerCase().includes(busca.toLowerCase())
  );
  const stats = {
    total: tenants.length,
    ativos: tenants.filter(t => t.status === 'ativo').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    problema: tenants.filter(t => ['trial_expirado', 'expirado', 'bloqueado', 'desativado'].includes(t.status)).length,
  };

  const NAV: { key: typeof aba; label: string; icon: string }[] = [
    { key: 'geral', label: 'Visão geral', icon: '📊' },
    { key: 'clientes', label: 'Clientes', icon: '🏢' },
    { key: 'leads', label: 'Leads', icon: '📥' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.sans, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 234, background: C.bgAlt, borderRight: `1px solid ${C.border}`, padding: '22px 16px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '0 6px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>Painel Admin</div>
            <div style={{ fontSize: 11, color: C.dim }}>Conexão Óticas</div>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setAba(n.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600,
                background: aba === n.key ? C.accentDim : 'transparent',
                color: aba === n.key ? C.text : C.dim,
                fontFamily: C.sans }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={sair} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>Sair</button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={{ flex: 1, padding: '28px 34px', maxWidth: 1200 }}>
        {loading && <div style={{ color: C.dim, fontSize: 13, marginBottom: 12 }}>Carregando…</div>}

        {/* VISÃO GERAL */}
        {aba === 'geral' && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>Visão geral</h1>
            <p style={{ color: C.dim, fontSize: 14, margin: '0 0 24px' }}>Resumo de todos os clientes da plataforma.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 30 }}>
              <Kpi label="Total de clientes" value={stats.total} color={C.text} />
              <Kpi label="Ativos" value={stats.ativos} color={C.green} />
              <Kpi label="Em trial" value={stats.trial} color={C.accent} />
              <Kpi label="Requerem atenção" value={stats.problema} color={C.amber} />
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Cadastrar novo cliente</div>
              <div style={{ color: C.dim, fontSize: 13.5, marginBottom: 14 }}>Cria o acesso (ótica ou lab) com login e senha na hora.</div>
              <button onClick={() => setNovo(true)} style={{ padding: '11px 20px', background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Novo cliente</button>
            </div>
          </>
        )}

        {/* CLIENTES */}
        {aba === 'clientes' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px' }}>Clientes</h1>
                <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>{tenants.length} cadastrados</p>
              </div>
              <button onClick={() => setNovo(true)} style={{ padding: '11px 20px', background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Novo cliente</button>
            </div>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail…"
              style={{ ...inp, marginBottom: 16, maxWidth: 340 }} />
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: C.bgAlt }}>
                      {['Cliente', 'Tipo', 'Plano', 'Status', 'Expira', 'Criado', ''].map((h, i) => (
                        <th key={i} style={{ textAlign: i === 6 ? 'right' : 'left', padding: '12px 16px', fontSize: 11.5, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map(t => {
                      const meta = STATUS_META[t.status] || STATUS_META.ativo;
                      const expira = t.plano === 'trial' ? t.trial_expira : t.licenca_expira;
                      return (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.nome}</div>
                            <div style={{ fontSize: 12.5, color: C.dim, fontFamily: C.mono }}>{t.email}</div>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: C.dim }}>{t.tipo === 'lab' ? 'Connect LAB' : 'Connect Óticas'}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, textTransform: 'capitalize' }}>{t.plano}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, padding: '4px 10px', borderRadius: 999 }}>{meta.label}</span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: C.dim, fontFamily: C.mono }}>{t.plano === 'vitalicio' ? '∞' : fmtData(expira)}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: C.dim, fontFamily: C.mono }}>{fmtData(t.created_at)}</td>
                          <td style={{ padding: '13px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => setEditar(t)} style={{ padding: '6px 12px', background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>Licença</button>
                            <button onClick={() => excluirCliente(t)} style={{ padding: '6px 10px', background: 'transparent', color: C.red, border: `1px solid ${C.redDim}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
                          </td>
                        </tr>
                      );
                    })}
                    {clientes.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: C.dim, fontSize: 14 }}>Nenhum cliente encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* LEADS */}
        {aba === 'leads' && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px' }}>Leads</h1>
            <p style={{ color: C.dim, fontSize: 14, margin: '0 0 20px' }}>Interessados que preencheram o formulário do site.</p>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: C.bgAlt }}>
                      {['Nome', 'Contato', 'Status', 'Recebido', ''].map((h, i) => (
                        <th key={i} style={{ textAlign: i === 4 ? 'right' : 'left', padding: '12px 16px', fontSize: 11.5, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{l.nome}</div>
                          {l.laboratorio && <div style={{ fontSize: 12.5, color: C.dim }}>{l.laboratorio}</div>}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: C.dim }}>
                          <div style={{ fontFamily: C.mono }}>{l.email}</div>
                          {l.telefone && <div style={{ fontFamily: C.mono }}>{l.telefone}</div>}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, textTransform: 'capitalize', color: C.dim }}>{l.status}</td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: C.dim, fontFamily: C.mono }}>{fmtData(l.created_at)}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                          <button onClick={() => excluirLead(l)} style={{ padding: '6px 10px', background: 'transparent', color: C.red, border: `1px solid ${C.redDim}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: C.dim, fontSize: 14 }}>Nenhum lead recebido.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {novo && <NovoCliente secret={secret} onClose={() => setNovo(false)} onSaved={() => { setNovo(false); carregar(secret); setAba('clientes'); }} />}
      {editar && <EditarLicenca secret={secret} tenant={editar} onClose={() => setEditar(null)} onSaved={() => { setEditar(null); carregar(secret); }} />}
    </div>
  );
}
