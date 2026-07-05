import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface PixResp {
  paymentId?: string;
  value?: number;
  dueDate?: string;
  qrImage?: string;
  copiaCola?: string;
  need_document?: boolean;
  error?: string;
}

export default function PixModal({ onClose, onPago }: { onClose: () => void; onPago?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [precisaDoc, setPrecisaDoc] = useState(false);
  const [documento, setDocumento] = useState('');
  const [pix, setPix] = useState<PixResp | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pago, setPago] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function gerar(doc?: string) {
    setLoading(true); setErro('');
    try {
      const r = await api.post<PixResp>('/asaas/pix', { documento: doc });
      if (r.need_document) { setPrecisaDoc(true); setLoading(false); return; }
      setPrecisaDoc(false);
      setPix(r);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar o Pix');
    } finally { setLoading(false); }
  }

  useEffect(() => { gerar(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  // Confirmação automática do pagamento
  useEffect(() => {
    if (!pix?.paymentId || pago) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get<{ pago: boolean }>(`/asaas/pix?paymentId=${pix.paymentId}`);
        if (r.pago) { setPago(true); if (pollRef.current) clearInterval(pollRef.current); onPago?.(); }
      } catch { /* segue tentando */ }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pix?.paymentId, pago]);

  function copiar() {
    if (!pix?.copiaCola) return;
    navigator.clipboard?.writeText(pix.copiaCola).then(() => {
      setCopiado(true); setTimeout(() => setCopiado(false), 2000);
    });
  }

  const valorFmt = pix?.value != null ? pix.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 97,00';

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(4,9,22,0.78)', zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 380, maxWidth: '94vw', background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        {/* Cabeçalho */}
        <div style={{ background: 'linear-gradient(135deg, #1faf4a, #128a3a)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>Connect Vision · Mensalidade</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{valorFmt}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {pago ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>Pagamento confirmado!</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>Sua assinatura foi renovada. Obrigado!</div>
              <button onClick={onClose} style={{ marginTop: 20, background: '#1faf4a', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Concluir</button>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#1faf4a', margin: '0 auto', animation: 'spinPix .8s linear infinite' }} />
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 14 }}>Gerando cobrança Pix…</div>
            </div>
          ) : precisaDoc ? (
            <div>
              <div style={{ fontSize: 14.5, color: '#334155', marginBottom: 12, lineHeight: 1.5 }}>
                Para gerar o Pix, informe o <b>CPF ou CNPJ</b> do responsável pela ótica:
              </div>
              <input value={documento} onChange={e => setDocumento(e.target.value.replace(/\D/g, '').slice(0, 14))}
                inputMode="numeric" placeholder="CPF ou CNPJ (só números)"
                style={{ width: '100%', padding: '13px 15px', fontSize: 15, borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => gerar(documento)} disabled={documento.length < 11} style={{
                width: '100%', marginTop: 14, background: documento.length < 11 ? '#a7d8b6' : '#1faf4a', color: '#fff',
                border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: documento.length < 11 ? 'default' : 'pointer',
              }}>Gerar Pix</button>
            </div>
          ) : erro ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 15, color: '#dc2626', fontWeight: 600, marginBottom: 14 }}>{erro}</div>
              <button onClick={() => gerar()} style={{ background: '#1faf4a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Tentar novamente</button>
            </div>
          ) : pix ? (
            <div style={{ textAlign: 'center' }}>
              {pix.qrImage && (
                <img src={pix.qrImage} alt="QR Code Pix" style={{ width: 220, height: 220, margin: '0 auto', display: 'block', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              )}
              <div style={{ fontSize: 13, color: '#64748b', margin: '14px 0 10px' }}>Escaneie o QR Code ou use o Pix copia e cola:</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: '#475569', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                  {pix.copiaCola}
                </div>
                <button onClick={copiar} style={{
                  background: copiado ? '#16a34a' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{copiado ? '✓ Copiado' : 'Copiar'}</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, fontSize: 13, color: '#64748b' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulsePix 1.4s ease-in-out infinite' }} />
                Aguardando pagamento…
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <style>{`
        @keyframes spinPix { to { transform: rotate(360deg); } }
        @keyframes pulsePix { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
