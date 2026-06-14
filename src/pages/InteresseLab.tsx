import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InteresseLab() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', laboratorio: '', email: '', whatsapp: '', cidade: '', mensagem: '' });
  const [saving, setSaving] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tipo: 'lab' }),
      });
      if (!res.ok) throw new Error('Erro ao enviar');
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: '14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', color: '#f1f5f9', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const LBL: React.CSSProperties = {
    fontSize: '12px', fontWeight: '600', color: '#94a3b8',
    display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#0a0d14', color: '#e2e8f0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#008800,#005500)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
        </div>
        <span style={{ fontSize: '18px', fontWeight: '800' }}>Connect <span style={{ color: '#16a34a' }}>LAB</span></span>
      </button>

      <div style={{ width: '100%', maxWidth: '480px' }}>

        {enviado ? (
          /* Tela de sucesso */
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '48px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '800' }}>Recebemos seu contato!</h2>
            <p style={{ margin: '0 0 28px', fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' }}>
              Nossa equipe vai entrar em contato em breve pelo WhatsApp para agendar uma demonstração do Conexão Lab.
            </p>
            <button onClick={() => navigate('/')} style={{ padding: '11px 28px', fontSize: '14px', fontWeight: '700', background: '#008800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Voltar ao início
            </button>
          </div>
        ) : (
          /* Formulário */
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Quero conhecer o Conexão Lab</h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                Preencha os dados abaixo e nossa equipe entrará em contato para agendar uma demonstração.
              </p>
            </div>

            {erro && (
              <div style={{ background: 'rgba(0,136,0,0.1)', border: '1px solid rgba(0,136,0,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#f87171' }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LBL}>Nome completo *</label>
                <input value={form.nome} onChange={e => set('nome', e.target.value)} required style={INP} placeholder="Seu nome" />
              </div>

              <div>
                <label style={LBL}>Nome do laboratório *</label>
                <input value={form.laboratorio} onChange={e => set('laboratorio', e.target.value)} required style={INP} placeholder="Ex: Lab Visão Clara" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LBL}>E-mail *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required style={INP} placeholder="seu@email.com" />
                </div>
                <div>
                  <label style={LBL}>WhatsApp *</label>
                  <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} required style={INP} placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div>
                <label style={LBL}>Cidade / Estado *</label>
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)} required style={INP} placeholder="Ex: Fortaleza, CE" />
              </div>

              <div>
                <label style={LBL}>Mensagem (opcional)</label>
                <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)} rows={3} style={{ ...INP, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Conte um pouco sobre seu laboratório..." />
              </div>

              <button type="submit" disabled={saving} style={{
                padding: '13px', fontSize: '15px', fontWeight: '700',
                background: saving ? '#555' : 'linear-gradient(135deg,#008800,#005500)',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                marginTop: '4px', boxShadow: '0 4px 20px rgba(204,0,0,0.3)',
              }}>
                {saving ? 'Enviando...' : 'Quero uma demonstração →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#475569', margin: 0 }}>
                Sem compromisso. Entraremos em contato em até 24 horas.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
