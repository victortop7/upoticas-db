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
        <div style={{ background: 'linear-gradient(90deg,#880000,#cc0000)', color: '#ffcccc', padding: '8px 14px', fontWeight: '700', fontSize: '13px', letterSpacing: '1px', border: '2px outset #aa2222', borderBottom: 'none', textAlign: 'center' }}>
          ACESSO RESTRITO
        </div>
        <div style={{ border: '2px inset #b0aca4', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '11px', color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Digite o PIN de 4 dígitos
          </div>

          {/* Display */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px',
            animation: shake ? 'shake 0.5s' : 'none',
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: '36px', height: '44px', border: `2px inset ${erro ? '#880000' : '#808080'}`,
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontFamily: "'Courier New', monospace", fontWeight: '900',
                color: erro ? '#880000' : '#000',
              }}>
                {pin[i] ? '●' : ''}
              </div>
            ))}
          </div>

          {erro && (
            <div style={{ textAlign: 'center', color: '#880000', fontSize: '11px', fontWeight: '700', marginBottom: '10px', fontFamily: "'Courier New', monospace" }}>
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
                  color: d === '✓' ? '#888' : '#000',
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

const R = {
  bg: '#c8c4b0', panel: '#d4d0c8', alt: '#dedad2', bdr: '#b0aca4',
  hdr: 'linear-gradient(90deg,#880000,#cc0000)', hdrTxt: '#ffcccc', hdrBdr: '#aa2222',
};
const INP: React.CSSProperties = {
  padding: '5px 8px', fontSize: '12px', background: '#fff',
  border: '1px solid #999', color: '#000', outline: 'none',
  fontFamily: "'Courier New', monospace", boxSizing: 'border-box',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ativo:          { bg: '#ccffcc', color: '#006600', label: 'ATIVO' },
  trial:          { bg: '#cce0ff', color: '#003388', label: 'TRIAL' },
  trial_expirado: { bg: '#fff0cc', color: '#886600', label: 'TRIAL EXPIRADO' },
  expirado:       { bg: '#ffcccc', color: '#880000', label: 'EXPIRADO' },
  bloqueado:      { bg: '#ffcccc', color: '#880000', label: 'BLOQUEADO' },
  desativado:     { bg: '#e0e0e0', color: '#444',    label: 'DESATIVADO' },
};

function fmtDate(s: string | null) {
  if (!s) return '—';
  return s.slice(0, 10).split('-').reverse().join('/');
}

const LEAD_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  novo:       { bg: '#cce0ff', color: '#003388', label: 'NOVO' },
  contatado:  { bg: '#fff0cc', color: '#886600', label: 'CONTATADO' },
  convertido: { bg: '#ccffcc', color: '#006600', label: 'CONVERTIDO' },
  descartado: { bg: '#e0e0e0', color: '#444',    label: 'DESCARTADO' },
};

export default function LabAdmin() {
  const [pinOk, setPinOk] = useState(() => sessionStorage.getItem('admin_pin_ok') === '1');
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [aba, setAba] = useState<'licencas' | 'leads'>('licencas');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ plano: '', licenca_expira: '', bloqueado: false, ativo: true });
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState('');
  const [criarLead, setCriarLead] = useState<Lead | null>(null);
  const [criarForm, setCriarForm] = useState({ nome_lab: '', nome_responsavel: '', email: '', senha: '', plano: 'trial', dias_trial: '14', licenca_expira: '' });
  const [criarErro, setCriarErro] = useState('');
  const [criarSucesso, setCriarSucesso] = useState<null | { email: string; senha: string; nome_lab: string }>(null);

  const load = useCallback(async (s: string) => {
    setLoading(true); setErro('');
    try {
      const [tenantsData, leadsData] = await Promise.all([
        adminRequest<Tenant[]>('/admin/licencas', s),
        adminRequest<Lead[]>('/admin/leads', s),
      ]);
      setTenants(tenantsData);
      setLeads(leadsData);
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
        }),
      });
      setEditId(null);
      load(secret);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    }
    setSaving(false);
  }

  function openEdit(t: Tenant) {
    setEditId(t.id);
    setEditForm({
      plano: t.plano,
      licenca_expira: t.licenca_expira ? t.licenca_expira.slice(0, 10) : '',
      bloqueado: Boolean(t.bloqueado),
      ativo: Boolean(t.ativo),
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
            <div style={{ fontSize: '11px', color: '#444', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>Chave de Administrador:</div>
            {erro && <div style={{ background: '#ffdddd', border: '1px solid #880000', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', color: '#880000', fontWeight: '700' }}>{erro}</div>}
            <input
              type="password" value={secret} autoFocus
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(secret)}
              style={{ ...INP, width: '100%', marginBottom: '10px' }}
              placeholder="ADMIN_SECRET..."
            />
            <button onClick={() => load(secret)} disabled={loading}
              style={{ width: '100%', padding: '7px', fontSize: '12px', fontWeight: '700', background: '#880000', color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
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
          {(['licencas', 'leads'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ padding: '5px 14px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', border: `2px outset ${R.hdrBdr}`, background: aba === a ? R.hdr : R.alt, color: aba === a ? R.hdrTxt : '#000' }}>
              {a === 'licencas' ? `LICENÇAS (${tenants.length})` : `LEADS${novosLeads > 0 ? ` ★${novosLeads} NOVOS` : ` (${leads.length})`}`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {aba === 'licencas' && <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...INP, width: '180px' }} />}
          <button onClick={() => load(secret)} style={{ padding: '5px 14px', fontSize: '11px', fontWeight: '700', background: R.alt, color: '#000', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ ATUALIZAR
          </button>
        </div>
      </div>

      {erro && <div style={{ background: '#ffdddd', border: '1px solid #880000', padding: '7px 10px', marginBottom: '8px', fontSize: '11px', color: '#880000', fontWeight: '700' }}>{erro}</div>}

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
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#000' }}>{t.nome}</div>
                      <div style={{ fontSize: '10px', color: '#555', fontFamily: "'Courier New', monospace" }}>{t.email}</div>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#333' }}>{t.tipo.toUpperCase()}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: st.color, background: st.bg, padding: '2px 7px', border: `1px solid ${st.color}` }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#333' }}>{fmtDate(t.trial_expira)}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#333' }}>{fmtDate(t.licenca_expira)}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#555' }}>{fmtDate(t.created_at)}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <button onClick={() => openEdit(t)}
                        style={{ padding: '3px 10px', fontSize: '11px', fontWeight: '700', background: '#880000', color: '#fff', border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                        EDITAR
                      </button>
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
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#555', whiteSpace: 'nowrap' }}>{fmtDate(l.created_at)}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#000' }}>{l.laboratorio || '—'}</div>
                      <div style={{ fontSize: '10px', color: '#555' }}>{l.nome}</div>
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#333' }}>{l.email}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#333' }}>{l.whatsapp || '—'}</td>
                    <td style={{ padding: '7px 10px', fontSize: '11px', color: '#555' }}>{l.cidade || '—'}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: st.color, background: st.bg, padding: '2px 7px', border: `1px solid ${st.color}` }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {l.status !== 'convertido' && (
                          <button onClick={() => abrirCriarConta(l)}
                            style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '700', background: '#004400', color: '#ccffcc', border: '1px outset #006600', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
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
                            style={{ padding: '3px 8px', fontSize: '10px', fontWeight: '700', background: '#e0e0e0', color: '#666', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            DESCARTAR
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar Conta a partir de Lead */}
      {criarLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: R.hdr, color: R.hdrTxt, padding: '6px 14px', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0 }}>
              <span>CRIAR CONTA — {criarLead.laboratorio || criarLead.nome}</span>
              <button onClick={() => { setCriarLead(null); setCriarSucesso(null); }} style={{ background: 'none', border: '1px solid #ff9999', color: '#ff9999', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ border: `2px inset ${R.bdr}`, padding: '16px' }}>
              {criarSucesso ? (
                <div>
                  <div style={{ textAlign: 'center', fontSize: '28px', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', textAlign: 'center', marginBottom: '14px', color: '#006600' }}>CONTA CRIADA COM SUCESSO!</div>
                  <div style={{ background: '#f0fff0', border: '1px solid #006600', padding: '14px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: '2' }}>
                    <div><b>Laboratório:</b> {criarSucesso.nome_lab}</div>
                    <div><b>E-mail:</b> {criarSucesso.email}</div>
                    <div><b>Senha:</b> {criarSucesso.senha}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '10px', marginBottom: '14px' }}>
                    Anote as credenciais acima para enviar ao cliente quando agendar a reunião.
                  </div>
                  <button onClick={() => { setCriarLead(null); setCriarSucesso(null); }}
                    style={{ width: '100%', padding: '7px', fontSize: '12px', fontWeight: '700', background: '#880000', color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                    FECHAR
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Nome do Laboratório</div>
                      <input value={criarForm.nome_lab} onChange={e => setCriarForm(f => ({ ...f, nome_lab: e.target.value }))} style={{ ...INP, width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Nome do Responsável</div>
                      <input value={criarForm.nome_responsavel} onChange={e => setCriarForm(f => ({ ...f, nome_responsavel: e.target.value }))} style={{ ...INP, width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>E-mail (login)</div>
                      <input value={criarForm.email} onChange={e => setCriarForm(f => ({ ...f, email: e.target.value }))} style={{ ...INP, width: '100%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Senha</div>
                      <input value={criarForm.senha} onChange={e => setCriarForm(f => ({ ...f, senha: e.target.value }))} style={{ ...INP, width: '100%' }} placeholder="Mín. 6 caracteres" />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Plano</div>
                      <select value={criarForm.plano} onChange={e => setCriarForm(f => ({ ...f, plano: e.target.value }))} style={{ ...INP, width: '100%' }}>
                        <option value="trial">Trial</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                        <option value="vitalicio">Vitalício</option>
                      </select>
                    </div>
                    {criarForm.plano === 'trial' && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Dias de Trial</div>
                        <input type="number" min="1" max="90" value={criarForm.dias_trial} onChange={e => setCriarForm(f => ({ ...f, dias_trial: e.target.value }))} style={{ ...INP, width: '100%' }} />
                      </div>
                    )}
                    {(criarForm.plano === 'mensal' || criarForm.plano === 'anual') && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Licença expira em</div>
                        <input type="date" value={criarForm.licenca_expira} onChange={e => setCriarForm(f => ({ ...f, licenca_expira: e.target.value }))} style={{ ...INP, width: '100%' }} />
                      </div>
                    )}
                  </div>

                  {criarErro && <div style={{ background: '#ffdddd', border: '1px solid #880000', padding: '6px 10px', fontSize: '11px', color: '#880000', fontWeight: '700' }}>{criarErro}</div>}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => setCriarLead(null)} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.alt, color: '#000', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                      CANCELAR
                    </button>
                    <button onClick={handleCriarConta} disabled={saving} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: '#004400', color: '#ccffcc', border: '1px outset #006600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                      {saving ? 'CRIANDO...' : 'CRIAR CONTA'}
                    </button>
                  </div>
                </div>
              )}
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
              <button onClick={() => setEditId(null)} style={{ background: 'none', border: '1px solid #ff9999', color: '#ff9999', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ border: `2px inset ${R.bdr}`, padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Plano</div>
                  <select value={editForm.plano} onChange={e => setEditForm(f => ({ ...f, plano: e.target.value }))} style={{ ...INP, width: '100%' }}>
                    <option value="trial">Trial</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="vitalicio">Vitalício</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '4px' }}>Licença expira em</div>
                  <input type="date" value={editForm.licenca_expira} onChange={e => setEditForm(f => ({ ...f, licenca_expira: e.target.value }))} style={{ ...INP, width: '100%' }} />
                </div>
              </div>

              {/* Quick extend buttons */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#444', textTransform: 'uppercase', marginBottom: '6px' }}>Renovar rapidamente:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} onClick={() => addMonths(m)}
                      style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '700', background: R.alt, color: '#000', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#880000' }}>
                  <input type="checkbox" checked={editForm.bloqueado} onChange={e => setEditForm(f => ({ ...f, bloqueado: e.target.checked }))} />
                  Bloqueado
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditId(null)} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: R.alt, color: '#000', border: `1px outset ${R.bdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
                  CANCELAR
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '7px', fontSize: '11px', fontWeight: '700', background: '#880000', color: '#fff', border: `1px outset ${R.hdrBdr}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
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
