import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

/* Pagamento da mensalidade via Pix (Asaas).
   Aparece nas telas de licença expirada / bloqueada.
   Usa /api/asaas/pix (requireAuthBasic — funciona mesmo com licença vencida). */

interface PixResp {
  paymentId: string;
  value: number;
  dueDate: string;
  qrImage: string;
  copiaCola: string;
  need_document?: boolean;
  error?: string;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PixLicenca() {
  const [pix, setPix] = useState<PixResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [needDoc, setNeedDoc] = useState(false);
  const [doc, setDoc] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [pago, setPago] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gerar = useCallback(async (documento?: string) => {
    setLoading(true); setErro('');
    try {
      const r = await api.post<PixResp>('/asaas/pix', documento ? { documento } : {});
      if (r.need_document) { setNeedDoc(true); setLoading(false); return; }
      setNeedDoc(false); setPix(r);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o Pix agora.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { gerar(); }, [gerar]);

  // Confirmação automática de pagamento
  const verificar = useCallback(async (auto = false) => {
    if (!pix) return;
    if (!auto) setVerificando(true);
    try {
      const r = await api.get<{ pago: boolean }>(`/asaas/pix?paymentId=${pix.paymentId}`);
      if (r.pago) {
        setPago(true);
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(() => window.location.reload(), 2500);
      }
    } catch { /* ignora */ } finally { if (!auto) setVerificando(false); }
  }, [pix]);

  useEffect(() => {
    if (!pix || pago) return;
    pollRef.current = setInterval(() => verificar(true), 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pix, pago, verificar]);

  function copiar() {
    if (!pix) return;
    navigator.clipboard?.writeText(pix.copiaCola).then(() => {
      setCopiado(true); setTimeout(() => setCopiado(false), 2000);
    });
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '20px 22px', width: '100%', maxWidth: 360, margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', fontFamily: "'DM Sans', -apple-system, sans-serif", boxSizing: 'border-box' };
  const txtDim = '#64748b';

  if (pago) {
    return (
      <div style={card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>✅</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#16a34a', marginTop: 8 }}>Pagamento confirmado!</div>
          <div style={{ fontSize: 13, color: txtDim, marginTop: 6 }}>Liberando seu acesso…</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={card}><div style={{ textAlign: 'center', color: txtDim, fontSize: 14, padding: '20px 0' }}>Gerando cobrança Pix…</div></div>;
  }

  if (needDoc) {
    return (
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Pagar com Pix</div>
        <div style={{ fontSize: 13, color: txtDim, marginBottom: 14 }}>Informe o CPF ou CNPJ do responsável para gerar a cobrança.</div>
        <input value={doc} onChange={e => setDoc(e.target.value)} placeholder="CPF ou CNPJ" inputMode="numeric"
          style={{ width: '100%', padding: '11px 13px', border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15, boxSizing: 'border-box', fontFamily: 'ui-monospace, monospace' }} />
        {erro && <div style={{ color: '#dc2626', fontSize: 12.5, marginTop: 8 }}>{erro}</div>}
        <button onClick={() => gerar(doc.replace(/\D/g, ''))} disabled={doc.replace(/\D/g, '').length < 11}
          style={{ width: '100%', marginTop: 14, padding: 12, background: '#6d7cff', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', opacity: doc.replace(/\D/g, '').length < 11 ? 0.6 : 1 }}>
          Gerar Pix
        </button>
      </div>
    );
  }

  if (erro || !pix) {
    return (
      <div style={card}>
        <div style={{ textAlign: 'center', color: txtDim, fontSize: 13.5 }}>{erro || 'Não foi possível gerar o Pix.'}</div>
        <button onClick={() => gerar()} style={{ width: '100%', marginTop: 12, padding: 11, background: '#6d7cff', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: txtDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensalidade</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>{brl(pix.value)}</div>
      </div>
      <img src={pix.qrImage} alt="QR Code Pix" style={{ width: 200, height: 200, display: 'block', margin: '0 auto 14px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
      <div style={{ fontSize: 12, color: txtDim, fontWeight: 600, marginBottom: 6 }}>Pix copia e cola</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input readOnly value={pix.copiaCola} onClick={e => (e.target as HTMLInputElement).select()}
          style={{ flex: 1, padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 11.5, fontFamily: 'ui-monospace, monospace', color: '#334155', minWidth: 0, boxSizing: 'border-box' }} />
        <button onClick={copiar} style={{ padding: '0 14px', background: copiado ? '#16a34a' : '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {copiado ? '✓' : 'Copiar'}
        </button>
      </div>
      <button onClick={() => verificar(false)} disabled={verificando}
        style={{ width: '100%', marginTop: 14, padding: 12, background: '#6d7cff', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', opacity: verificando ? 0.7 : 1 }}>
        {verificando ? 'Verificando…' : 'Já paguei'}
      </button>
      <div style={{ fontSize: 11.5, color: txtDim, textAlign: 'center', marginTop: 8 }}>Após o pagamento o acesso é liberado automaticamente.</div>
    </div>
  );
}
