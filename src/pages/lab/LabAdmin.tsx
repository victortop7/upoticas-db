import { useState, useEffect, useCallback } from 'react';
import { adminRequest } from '../../lib/api';

const PIN_CORRETO = '2423';

function PinScreen({ onOk }: { onOk: () => void }) {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);
  const [shake, setShake] = useState(false);

  function press(d: string) {
    if (pin.length >= 4) return;
    const novo = pin + d;
    setPin(novo);
    setErro(false);
    if (novo.length === 4) {
      setTimeout(() => {
        if (novo === PIN_CORRETO) {
          sessionStorage.setItem('admin_pin_ok', '1');
          onOk();
        } else {
          setErro(true);
          setShake(true);
          setTimeout(() => { setPin(''); setShake(false); }, 700);
        }
      }, 200);
    }
  }

  function del() { setPin(p => p.slice(0, -1)); setErro(false); }

  const digits = [['1','2','3'],['4','5','6'],['7','8','9'],['←','0','✓']];

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c8c4b0' }}>
      <div style={{ background: '#d4d0c8', border: '2px outset #b0aca4', width: '280px' }}>
        <div style={{ background: 'linear-gradient(90deg,#005500,#008800)', color: '#ccffcc', padding: '8px 14px', fontWeight: '700', fontSize: '13px', letterSpacing: '1px', border: '2px outset #007700', borderBottom: 'none', textAlign: 'center' }}>
          ACESSO RESTRITO
        </div>
        <div style={{ border: '2px inset #b0aca4', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '11px', color: R.txt, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Digite o PIN de 4 dígitos
          </div>

          {/* Display */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px',
            animation: shake ? 'shake 0.5s' : 'none',
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: '36px', height: '44px', border: `2px inset ${erro ? R.accent : R.dim}`,
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontFamily: "'Courier New', monospace", fontWeight: '900',
                color: erro ? R.accent : R.txt,
              }}>
                {pin[i] ? '●' : ''}
              </div>
            ))}
          </div>

          {erro && (
            <div style={{ textAlign: 'center', color: R.accent, fontSize: '11px', fontWeight: '700', marginBottom: '10px', fontFamily: "'Courier New', monospace" }}>
              PIN INCORRETO
            </div>
          )}

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {digits.flat().map(d => (
              <button key={d} onClick={() => d === '←' ? del() : d === '✓' ? undefined : press(d)}
                style={{
                  padding: '12px', fontSize: d === '←' || d === '✓' ? '16px' : '18px',
                  fontWeight: '700', fontFamily: "'Courier New', monospace",
                  background: d === '←' ? '#dedad2' : '#d4d0c8',
                  color: d === '✓' ? R.dim : R.txt,
                  border: '2px outset #b0aca4', cursor: 'pointer',
                  lineHeight: '1',
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
}

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
  dispositivo_modo?: string;
  created_at: string;
  status: string;
}

interface Lead {
  id: string;
  tipo: string;
  nome: string;
  laboratorio: string | null;
  email: string;
  whatsapp: string | null;
  cidade: string | null;
  mensagem: string | null;
  status: string;
  created_at: string;
}

interface Codigo {
  id: string;
  codigo: string;
  dias: number;
  usado: number;
  usado_por: string | null;
  usado_em: string | null;
  nome_contato: string | null;
  criado_em: string;
}

import { R } from '../../lib/labTheme';
const INP: React.CSSProperties = {
  padding: '5px 8px', fontSize: '12px', background: '#fff',
  border: '1px solid #999', color: R.txt, outline: 'none',
  fontFamily: "'Courier New', monospace", boxSizing: 'border-box',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ativo:          { bg: '#ccffcc', color: '#006600', label: 'ATIVO' },
  trial:          { bg: '#cce0ff', color: '#003388', label: 'TRIAL' },
  trial_expirado: { bg: '#fff0cc', color: '#886600', label: 'TRIAL EXPIRADO' },
  expirado:       { bg: '#ccffcc', color: '#005500', label: 'EXPIRADO' },
  bloqueado:      { bg: '#ccffcc', color: '#005500', label: 'BLOQUEADO' },
  desativado:     { bg: '#e0e0e0', color: '#555555',    label: 'DESATIVADO' },
};

function fmtDate(s: string | null) {
  if (!s) return '—';
  return s.slice(0, 10).split('-').reverse().join('/');
}

const LEAD_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  novo:       { bg: '#cce0ff', color: '#003388', label: 'NOVO' },
  contatado:  { bg: '#fff0cc', color: '#886600', label: 'CONTATADO' },
  convertido: { bg: '#ccffcc', color: '#006600', label: 'CONVERTIDO' },
  descartado: { bg: '#e0e0e0', color: '#555555',    label: 'DESCARTADO' },
};

export default function LabAdmin() {
  const [pinOk, setPinOk] = useState(() => sessionStorage.getItem('admin_pin_ok') === '1');
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [aba, setAba] = useState<'licencas' | 'leads' | 'codigos'>('licencas');
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ plano: '', licenca_expira: '', bloqueado: false, ativo: true, dispositivos_limite: 1, dispositivo_modo: 'bloquear' });
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState('');
  const [criarLead, setCriarLead] = useState<Lead | null>(null);
  const [criarForm, setCriarForm] = useState({ nome_lab: '', nome_responsavel: '', email: '', senha: '', plano: 'trial', dias_trial: '14', licenca_expira: '' });
  const [criarErro, setCriarErro] = useState('');
  const [criarSucesso, setCriarSucesso] = useState<null | { email: string; senha: string; nome_lab: string }>(null);
  const [impersonando, setImpersonando] = useState<string | null>(null);
  const [restaurarTenant, setRestaurarTenant] = useState<Tenant | null>(null);
  const [restForm, setRestForm] = useState({ lista1: '', lista2: '', lista3: '', restore_precos: true });
  const [restMsg, setRestMsg] = useState('');

  async function handleImpersonate(tenantId: string, tipo: string) {
    if (!confirm('Entrar no sistema deste cliente?')) return;
    setImpersonando(tenantId);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error || 'Erro'); }
      window.location.href = tipo === 'lab' ? '/lab/dashboard' : '/dashboard';
    } catch (e: unknown) {
      alert('Erro ao entrar: ' + (e instanceof Error ? e.message : String(e)));
      setImpersonando(null);
    }
  }

  async function handleRestaurar() {
    if (!restaurarTenant) return;
    setRestMsg('Restaurando...');
    try {
      const res = await fetch('/api/admin/restore-servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
        body: JSON.stringify({
          tenant_id: restaurarTenant.id,
          lista1: restForm.lista1 || undefined,
          lista2: restForm.lista2 || undefined,
          lista3: restForm.lista3 || undefined,
          restore_precos: restForm.restore_precos,
        }),
      });
      const d = await res.json() as { ok?: boolean; error?: string; config_restored?: number; products_updated?: number };
      if (!res.ok) throw new Error(d.error || 'Erro');
      setRestMsg(`✅ Listas restauradas! Config: ${d.config_restored}, Produtos: ${d.products_updated}`);
    } catch (e: unknown) {
      setRestMsg('❌ Erro: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  const load = useCallback(async (s: string) => {
    setLoading(true); setErro('');
    try {
      const [tenantsData, leadsData, codigosData] = await Promise.all([
        adminRequest<Tenant[]>('/admin/licencas', s),
        adminRequest<Lead[]>('/admin/leads', s),
        adminRequest<Codigo[]>('/admin/codigos', s).catch(() => [] as Codigo[]),
      ]);
      setTenants(tenantsData);
      setLeads(leadsData);
      setCodigos(codigosData);
      setAuthed(true);
      sessionStorage.setItem('admin_secret', s);
    } catch {
      setErro('Chave inválida ou erro de conexão');
      setAuthed(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (secret) load(secret);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!editId) return;
    setSaving(true);
    try {
      await adminRequest('/admin/licencas', secret, {
        method: 'PATCH',
        body: JSON.stringify({
          id: editId,
          plano: editForm.plano || undefined,
          licenca_expira: editForm.licenca_expira || null,
          bloqueado: editForm.bloqueado,
          ativo: editForm.ativo,
          dispositivos_limite: editForm.dispositivos_limite,
          dispositivo_modo: editForm.dispositivo_modo,
        }),
      });
      setEditId(null);
      load(secret);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    }
    setSaving(false);
  }

  async function gerarCodigo() {
    setGerando(true); setErro('');
    try {
      await adminRequest('/admin/codigos', secret, {
        method: 'POST',
        body: JSON.stringify({ nome_contato: novoNome || undefined }),
      });
      setNovoNome('');
      load(secret);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar código');
    }
    setGerando(false);
  }

  async function excluirCodigo(id: string) {
    if (!confirm('Excluir este código?')) return;
    try {
      await adminRequest(`/admin/codigos?id=${id}`, secret, { method: 'DELETE' });
      load(secret);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard?.writeText(codigo).then(() => {
      setCopiado(codigo); setTimeout(() => setCopiado(null), 1800);
    });
  }

  async function resetarDispositivos() {
    if (!editId) return;
    if (!confirm('Desconectar TODOS os tablets desta conta? Eles precisarão entrar de novo (útil pra trocar de tablet).')) return;
    try {
      await adminRequest(`/admin/dispositivos?tenant_id=${editId}&all=1`, secret, { method: 'DELETE' });
      alert('Tablets desconectados. As vagas foram liberadas.');
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao desconectar');
    }
  }

  function openEdit(t: Tenant) {
    setEditId(t.id);
    setEditForm({
      plano: t.plano,
      licenca_expira: t.licenca_expira ? t.licenca_expira.slice(0, 10) : '',
      bloqueado: Boolean(t.bloqueado),
      ativo: Boolean(t.ativo),
      dispositivos_limite: Number(t.dispositivos_limite ?? 1) || 1,
      dispositivo_modo: t.dispositivo_modo === 'rotacionar' ? 'rotacionar' : 'bloquear',
    });
  }

  function addMonths(months: number) {
    const base = editForm.licenca_expira ? new Date(editForm.licenca_expira) : new Date();
    base.setMonth(base.getMonth() + months);
    setEditForm(f => ({ ...f, licenca_expira: base.toISOString().slice(0, 10), plano: 'mensal' }));
  }

  const filtrados = tenants.filter(t =>
    !busca || t.nome.toLowerCase().includes(busca.toLowerCase()) ||
    t.email.toLowerCase().includes(busca.toLowerCase())
  );

  function abrirCriarConta(lead: Lead) {
    setCriarLead(lead);
    setCriarErro('');
    setCriarSucesso(null);
    setCriarForm({
      nome_lab: lead.laboratorio || lead.nome,
      nome_responsavel: lead.nome,
      email: lead.email,
      senha: '',
      plano: 'trial',
      dias_trial: '14',
      licenca_expira: '',
    });
  }

  async function handleCriarConta() {
    if (!criarLead) return;
    setCriarErro(''); setSaving(true);
    try {
      const res = await adminRequest<{ email: string; nome_lab: string }>('/admin/leads', secret, {
        method: 'POST',
        body: JSON.stringify({
          lead_id: criarLead.id,
          nome_lab: criarForm.nome_lab,
          nome_responsavel: criarForm.nome_responsavel,
          email: criarForm.email,
          senha: criarForm.senha,
          plano: criarForm.plano,
          dias_trial: Number(criarForm.dias_trial),
          licenca_expira: criarForm.licenca_expira || undefined,
        }),
      });
      setCriarSucesso({ email: res.email, senha: criarForm.senha, nome_lab: res.nome_lab });
      load(secret);
    } catch (e: unknown) {
      setCriarErro(e instanceof Error ? e.message : 'Erro ao criar conta');
    }
    setSaving(false);
  }

  async function handleLeadStatus(id: string, status: string) {
    try {
      await adminRequest('/admin/leads', secret, {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      setLeads(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    } catch {}
  }

  async function handleExcluirTenant(id: string) {
    try {
      await adminRequest(`/admin/licencas?id=${id}`, secret, { method: 'DELETE' });
      setTenants(ts => ts.filter(t => t.id !== id));
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  async function handleExcluirLead(id: string) {
    try {
      await adminRequest(`/admin/leads?id=${id}`, secret, { method: 'DELETE' });
      setLeads(ls => ls.filter(l => l.id !== id));
    } catch {}
  }

  if (!pinOk) return <PinScreen onOk={() => setPinOk(true)} />;

  // Login screen
  if (!authed) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: R.bg }}>
        <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, width: '360px' }}>
          <div style={{ background: R.hdr, color: R.hdrTxt, padding: '8px 14px', fontWeight: '700', fontSize: '13px', letterSpacing: '1px', border: `2px outset ${R.hdrBdr}`, borderBottom: 'none' }}>
            PAINEL ADMINISTRATIVO
          </div>
          <div style={{ border: `2px inset ${R.bdr}`, padding: '20px' }}>
            <div style={{ fontSize: '11px', color: R.txt, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Chave de Administrador:</div>
            {erro && <div style={{ background: '#ddffee', border: '1px solid #005500', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', color: '#005500', fontWeight: '700' }}>{erro}</div>}
            <input
              type="password" value={secret} autoFocus
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(secret)}
              style={{ ...INP, width: '100%', marginBottom: '10px' }}
              placeholder="ADMIN_SECRET..."
            />
            <button onClick={() => load(secret)} disabled={loading}
              style={{ width: '100%', padding: '7px', fontSize: '12px', fontWeight: '700', background: R.accent, color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
              {loading ? 'VERIFICANDO...' : 'ENTRAR'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const novosLeads = leads.filter(l => l.status === 'novo').length;

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', background: R.bg, fontFamily: "'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['licencas', 'leads', 'codigos'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ padding: '5px 14px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', border: `2px outset ${R.hdrBdr}`, background: aba === a ? R.hdr : R.alt, color: aba === a ? R.hdrTxt : R.txt }}>
              {a === 'licencas' ? `LICENÇAS (${tenants.length})`
                : a === 'leads' ? `LEADS${novosLeads > 0 ? ` ★${novosLeads} NOVOS` : ` (${leads.length})`}`
                : `TESTE GRÁTIS (${codigos.filter(c => !c.usado).length})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {aba === 'licencas' && <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...INP, width: '180px' }} />}
          <button onClick={() => load(secret)} style={{ padding: '5px 14px', fontSize: '11px', fontWeight: '700', background: R.alt, color: R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ ATUALIZAR
          </button>
        </div>
      </div>

      {erro && <div style={{ background: '#ddffee', border: '1px solid #005500', padding: '7px 10px', marginBottom: '8px', fontSize: '11px', color: '#005500', fontWeight: '700' }}>{erro}</div>}

      {/* ── ABA LICENÇAS ── */}
      {aba === 'licencas' && (<>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_STYLE).map(([k, v]) => {
            const count = tenants.filter(t => t.status === k).length;
            if (!count) return null;
            return (
              <span key={k} style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', background: v.bg, color: v.color, border: `1px solid ${v.color}`, fontFamily: "'Courier New', monospace" }}>
                {v.label}: {count}
              </span>
            );
          })}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', border: `2px inset ${R.bdr}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: R.hdr }}>
                {['NOME / EMAIL', 'TIPO', 'STATUS', 'TRIAL ATÉ', 'LICENÇA ATÉ', 'CRIADO EM', 'AÇÕES'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: R.hdrTxt, letterSpacing: '0.5px', border: `1px solid ${R.hdrBdr}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t, i) => {
                const st = STATUS_STYLE[t.status] || STATUS_STYLE.desativado;
                return (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? R.panel : R.alt, borderBottom: `1px solid ${R.bdr}` }}>
                    <td style={{ padding: '7px 10px' }}>
                      <div
                        onClick={() => handleImpersonate(t.id, t.tipo)}
                        title="Clique para entrar no sistema deste cliente"
                        style={{ fontSize: '12px', fontWeight: '700', color: R.accent, cursor: 'pointer', textDecoration: 'underline', display: 'inline-block' }}
                      >
                        {impersonando === t.id ? '⏳ Entrando...' : t.nome}
                      </div>
                      <div style={{ fontSize: '10px', color: R.dim, fontFamily: "'Courier New', monospace" }}>{t.email}</div>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.txt }}>{t.tipo.toUpperCase()}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: st.color, background: st.bg, padding: '2px 7px', border: `1px solid ${st.color}` }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.txt }}>{fmtDate(t.trial_expira)}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.txt }}>{fmtDate(t.licenca_expira)}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim }}>{fmtDate(t.created_at)}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEdit(t)}
                          style={{ padding: '3px 10px', fontSize: '11px', fontWeight: '700', background: R.accent, color: '#fff', border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                          EDITAR
                        </button>
                        <button onClick={() => { if (confirm(`Excluir laboratório "${t.nome}" e todos os usuários? Esta ação não pode ser desfeita.`)) handleExcluirTenant(t.id); }}
                          style={{ padding: '3px 10px', fontSize: '11px', fontWeight: '700', background: '#ddffee', color: '#005500', border: '1px outset #88ccaa', cursor: 'pointer', fontFamily: 'inherit' }}>
                          EXCLUIR
                        </button>
                        <button onClick={() => { setRestaurarTenant(t); setRestForm({ lista1: '', lista2: '', lista3: '', restore_precos: true }); setRestMsg(''); }}
                          style={{ padding: '3px 10px', fontSize: '11px', fontWeight: '700', background: '#fff0cc', color: '#886600', border: '1px outset #ccaa44', cursor: 'pointer', fontFamily: 'inherit' }}>
                          🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── ABA LEADS ── */}
      {aba === 'leads' && (
        <div style={{ flex: 1, overflowY: 'auto', border: `2px inset ${R.bdr}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: R.hdr }}>
                {['DATA', 'LABORATÓRIO / NOME', 'E-MAIL', 'WHATSAPP', 'CIDADE', 'STATUS', 'AÇÕES'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: R.hdrTxt, letterSpacing: '0.5px', border: `1px solid ${R.hdrBdr}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => {
                const st = LEAD_STATUS_STYLE[l.status] || LEAD_STATUS_STYLE.novo;
                return (
                  <tr key={l.id} style={{ background: i % 2 === 0 ? R.panel : R.alt, borderBottom: `1px solid ${R.bdr}` }}>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.dim, whiteSpace: 'nowrap' }}>{fmtDate(l.created_at)}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: R.txt }}>{l.laboratorio || '—'}</div>
                      <div style={{ fontSize: '10px', color: R.dim }}>{l.nome}</div>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.txt }}>{l.email}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: R.txt }}>{l.whatsapp || '—'}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', color: R.dim }}>{l.cidade || '—'}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: st.color, background: st.bg, padding: '2px 7px', border: `1px solid ${st.color}` }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {l.status !== 'convertido' && (
                          <button onClick={() => abrirCriarConta(l)}
                            style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '700', background: R.accent, color: '#ccffcc', border: '1px outset #006600', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            CRIAR CONTA
                          </button>
                        )}
                        {l.status === 'novo' && (
                          <button onClick={() => handleLeadStatus(l.id, 'contatado')}
                            style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '700', background: R.alt, color: '#886600', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            CONTATADO
                          </button>
                        )}
                        {l.status !== 'descartado' && l.status !== 'convertido' && (
                          <button onClick={() => handleLeadStatus(l.id, 'descartado')}
                            style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '700', background: '#e0e0e0', color: '#555555', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            DESCARTAR
                          </button>
                        )}
                        <button onClick={() => { if (confirm(`Excluir lead de ${l.nome}?`)) handleExcluirLead(l.id); }}
                          style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '700', background: '#ddffee', color: '#005500', border: '1px outset #88ccaa', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          EXCLUIR
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ABA TESTE GRÁTIS (códigos) ── */}
      {aba === 'codigos' && (
        <div>
          <div style={{ background: R.panel, border: `1px solid ${R.bdr}`, padding: '10px', marginBottom: '10px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: R.txt }}>Gerar código de 15 dias grátis:</span>
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Pra quem? (opcional)" style={{ ...INP, width: '200px' }} />
            <button onClick={gerarCodigo} disabled={gerando} style={{ padding: '6px 16px', fontSize: '11px', fontWeight: '700', background: R.hdr, color: R.hdrTxt, border: `2px outset ${R.hdrBdr}`, cursor: gerando ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {gerando ? 'GERANDO…' : '+ GERAR CÓDIGO'}
            </button>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${R.bdr}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: R.alt }}>
                  {['CÓDIGO', 'STATUS', 'PRA QUEM', 'USADO POR', 'CRIADO EM', 'AÇÕES'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '700', color: R.txt, borderBottom: `1px solid ${R.bdr}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codigos.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: R.dim }}>Nenhum código gerado ainda.</td></tr>
                )}
                {codigos.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #eee', opacity: c.usado ? 0.6 : 1 }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: '700', fontSize: '13px', letterSpacing: '0.5px' }}>{c.codigo}</td>
                    <td style={{ padding: '6px 10px' }}>
                      {c.usado
                        ? <span style={{ color: R.dim, fontWeight: '700' }}>⚫ USADO</span>
                        : <span style={{ color: R.accent, fontWeight: '700' }}>🟢 DISPONÍVEL</span>}
                    </td>
                    <td style={{ padding: '6px 10px' }}>{c.nome_contato || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>{c.usado_por ? `${c.usado_por}${c.usado_em ? ` (${c.usado_em.slice(0, 10)})` : ''}` : '—'}</td>
                    <td style={{ padding: '6px 10px', color: R.dim }}>{c.criado_em ? c.criado_em.slice(0, 10) : '—'}</td>
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                      {!c.usado && (
                        <button onClick={() => copiarCodigo(c.codigo)} style={{ padding: '3px 10px', fontSize: '10px', fontWeight: '700', background: copiado === c.codigo ? R.accent : R.alt, color: copiado === c.codigo ? '#fff' : R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', marginRight: '4px' }}>
                          {copiado === c.codigo ? '✓ COPIADO' : 'COPIAR'}
                        </button>
                      )}
                      <button onClick={() => excluirCodigo(c.id)} style={{ padding: '3px 10px', fontSize: '10px', fontWeight: '700', background: '#ffdddd', color: '#aa0000', border: '1px outset #cc8888', cursor: 'pointer', fontFamily: 'inherit' }}>
                        EXCLUIR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar Conta a partir de Lead */}
      {criarLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: R.hdr, color: R.hdrTxt, padding: '6px 14px', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0 }}>
              <span>CRIAR CONTA — {criarLead.laboratorio || criarLead.nome}</span>
              <button onClick={() => { setCriarLead(null); setCriarSucesso(null); }} style={{ background: 'none', border: '1px solid #99ffaa', color: '#99ffaa', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ border: `2px inset ${R.bdr}`, padding: '16px' }}>
              {criarSucesso ? (
                <div>
                  <div style={{ textAlign: 'center', fontSize: '28px', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', textAlign: 'center', marginBottom: '14px', color: R.accent }}>CONTA CRIADA COM SUCESSO!</div>
                  <div style={{ background: '#f0fff0', border: '1px solid #006600', padding: '14px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: '2' }}>
                    <div><b>Laboratório:</b> {criarSucesso.nome_lab}</div>
                    <div><b>E-mail:</b> {criarSucesso.email}</div>
                    <div><b>Senha:</b> {criarSucesso.senha}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: R.dim, marginTop: '10px', marginBottom: '14px' }}>
                    Anote as credenciais acima para enviar ao cliente quando agendar a reunião.
                  </div>
                  <button onClick={() => { setCriarLead(null); setCriarSucesso(null); }}
                    style={{ width: '100%', padding: '7px', fontSize: '12px', fontWeight: '700', background: R.accent, color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                    FECHAR
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Nome do Laboratório</div>
                      <input value={criarForm.nome_lab} onChange={e => setCriarForm(f => ({ ...f, nome_lab: e.target.value }))} style={{ ...INP, width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Nome do Responsável</div>
                      <input value={criarForm.nome_responsavel} onChange={e => setCriarForm(f => ({ ...f, nome_responsavel: e.target.value }))} style={{ ...INP, width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>E-mail (login)</div>
                      <input value={criarForm.email} onChange={e => setCriarForm(f => ({ ...f, email: e.target.value }))} style={{ ...INP, width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Senha</div>
                      <input value={criarForm.senha} onChange={e => setCriarForm(f => ({ ...f, senha: e.target.value }))} style={{ ...INP, width: '100%' }} placeholder="Mín. 6 caracteres" />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Plano</div>
                      <select value={criarForm.plano} onChange={e => setCriarForm(f => ({ ...f, plano: e.target.value }))} style={{ ...INP, width: '100%' }}>
                        <option value="trial">Trial</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                        <option value="vitalicio">Vitalício</option>
                      </select>
                    </div>
                    {criarForm.plano === 'trial' && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Dias de Trial</div>
                        <input type="number" min="1" max="90" value={criarForm.dias_trial} onChange={e => setCriarForm(f => ({ ...f, dias_trial: e.target.value }))} style={{ ...INP, width: '100%' }} />
                      </div>
                    )}
                    {(criarForm.plano === 'mensal' || criarForm.plano === 'anual') && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Licença expira em</div>
                        <input type="date" value={criarForm.licenca_expira} onChange={e => setCriarForm(f => ({ ...f, licenca_expira: e.target.value }))} style={{ ...INP, width: '100%' }} />
                      </div>
                    )}
                  </div>

                  {criarErro && <div style={{ background: '#ddffee', border: '1px solid #005500', padding: '6px 10px', fontSize: '11px', color: '#005500', fontWeight: '700' }}>{criarErro}</div>}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => setCriarLead(null)} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.alt, color: R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                      CANCELAR
                    </button>
                    <button onClick={handleCriarConta} disabled={saving} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.accent, color: '#ccffcc', border: '1px outset #006600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                      {saving ? 'CRIANDO...' : 'CRIAR CONTA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Restaurar Listas */}
      {restaurarTenant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, width: '420px' }}>
            <div style={{ background: 'linear-gradient(90deg,#886600,#cc9900)', color: '#fff', padding: '6px 14px', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔄 RESTAURAR LISTAS — {restaurarTenant.nome}</span>
              <button onClick={() => setRestaurarTenant(null)} style={{ background: 'none', border: '1px solid #ffe', color: '#ffe', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#555555', background: '#fffbe6', border: '1px solid #ccaa44', padding: '8px 10px' }}>
                Digite os nomes das listas que deseja restaurar. Deixe em branco para não alterar.
              </div>
              {[
                { label: 'Nome da Lista 1', key: 'lista1' as const },
                { label: 'Nome da Lista 2', key: 'lista2' as const },
                { label: 'Nome da Lista 3', key: 'lista3' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <input value={restForm[key]} onChange={e => setRestForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ ...INP, width: '100%' }} placeholder={`ex: tabela caucaia`} />
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={restForm.restore_precos} onChange={e => setRestForm(f => ({ ...f, restore_precos: e.target.checked }))} />
                Restaurar preços do catálogo padrão
              </label>
              {restMsg && (
                <div style={{ fontSize: '12px', fontWeight: '700', padding: '8px 10px', background: restMsg.startsWith('✅') ? '#ccffcc' : '#ffcccc', color: restMsg.startsWith('✅') ? '#005500' : '#880000', border: `1px solid ${restMsg.startsWith('✅') ? '#005500' : '#880000'}` }}>
                  {restMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setRestaurarTenant(null)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: '700', background: R.alt, color: R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                  FECHAR
                </button>
                <button onClick={handleRestaurar}
                  style={{ flex: 2, padding: '8px', fontSize: '12px', fontWeight: '700', background: 'linear-gradient(90deg,#886600,#cc9900)', color: '#fff', border: '1px outset #cc9900', cursor: 'pointer', fontFamily: 'inherit' }}>
                  🔄 RESTAURAR AGORA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, width: '460px' }}>
            <div style={{ background: R.hdr, color: R.hdrTxt, padding: '6px 14px', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
              <span>EDITAR LICENÇA</span>
              <button onClick={() => setEditId(null)} style={{ background: 'none', border: '1px solid #99ffaa', color: '#99ffaa', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ border: `2px inset ${R.bdr}`, padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Plano</div>
                  <select value={editForm.plano} onChange={e => setEditForm(f => ({ ...f, plano: e.target.value }))} style={{ ...INP, width: '100%' }}>
                    <option value="trial">Trial</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="vitalicio">Vitalício</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '4px' }}>Licença expira em</div>
                  <input type="date" value={editForm.licenca_expira} onChange={e => setEditForm(f => ({ ...f, licenca_expira: e.target.value }))} style={{ ...INP, width: '100%' }} />
                </div>
              </div>

              {/* Tablets (dispositivos) */}
              <div style={{ marginBottom: '12px', background: '#eef4ff', border: '1px solid #b8ccf0', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', marginBottom: '6px' }}>Tablets liberados (dispositivos)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setEditForm(f => ({ ...f, dispositivos_limite: Math.max(1, f.dispositivos_limite - 1) }))}
                    style={{ width: '28px', height: '28px', fontSize: '16px', fontWeight: '700', background: R.alt, border: `1px outset ${R.bdr}`, cursor: 'pointer' }}>−</button>
                  <input type="number" min={1} value={editForm.dispositivos_limite}
                    onChange={e => setEditForm(f => ({ ...f, dispositivos_limite: Math.max(1, Number(e.target.value) || 1) }))}
                    style={{ ...INP, width: '56px', textAlign: 'center', fontWeight: '700' }} />
                  <button onClick={() => setEditForm(f => ({ ...f, dispositivos_limite: f.dispositivos_limite + 1 }))}
                    style={{ width: '28px', height: '28px', fontSize: '16px', fontWeight: '700', background: R.alt, border: `1px outset ${R.bdr}`, cursor: 'pointer' }}>+</button>
                  <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '700', marginLeft: '4px' }}>
                    = R$ {97 + (editForm.dispositivos_limite - 1) * 30}/mês
                    <span style={{ color: '#64748b', fontWeight: '400' }}> (R$97 + R$30 x {editForm.dispositivos_limite - 1})</span>
                  </span>
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #c5d5f0' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', marginBottom: '5px' }}>Ao passar do limite de tablets:</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', marginBottom: '3px', cursor: 'pointer' }}>
                    <input type="radio" name="dispmodo" checked={editForm.dispositivo_modo === 'bloquear'} onChange={() => setEditForm(f => ({ ...f, dispositivo_modo: 'bloquear' }))} />
                    <b>Bloquear</b> — barra o tablet novo e pede pra pagar +R$30
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                    <input type="radio" name="dispmodo" checked={editForm.dispositivo_modo === 'rotacionar'} onChange={() => setEditForm(f => ({ ...f, dispositivo_modo: 'rotacionar' }))} />
                    <b>Rotacionar</b> — desloga o tablet mais antigo automaticamente
                  </label>
                </div>
                <button onClick={resetarDispositivos}
                  style={{ marginTop: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', background: '#fff0f0', color: '#aa0000', border: '1px outset #cc8888', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ↺ Desconectar tablets (trocar dispositivo)
                </button>
              </div>

              {/* Quick extend buttons */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: R.txt, textTransform: 'uppercase', marginBottom: '6px' }}>Renovar rapidamente:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} onClick={() => addMonths(m)}
                      style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', background: R.alt, color: R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                      +{m} {m === 1 ? 'mês' : 'meses'}
                    </button>
                  ))}
                  <button onClick={() => setEditForm(f => ({ ...f, licenca_expira: '', plano: 'vitalicio' }))}
                    style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', background: '#ccffcc', color: '#006600', border: '1px outset #006600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Vitalício
                  </button>
                </div>
              </div>

              {/* Status toggles */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.ativo} onChange={e => setEditForm(f => ({ ...f, ativo: e.target.checked }))} />
                  Conta ativa
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: R.accent }}>
                  <input type="checkbox" checked={editForm.bloqueado} onChange={e => setEditForm(f => ({ ...f, bloqueado: e.target.checked }))} />
                  Bloqueado
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditId(null)} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.alt, color: R.txt, border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                  CANCELAR
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.accent, color: '#fff', border: `1px outset ${R.hdrBdr}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                  {saving ? 'SALVANDO...' : 'SALVAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
