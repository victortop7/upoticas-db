import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';

interface ScanResult {
  ok: boolean;
  ordem?: {
    numero: number;
    otica_nome: string;
    status_anterior: string;
    status_novo: string;
    setor_nome: string;
    mudou: boolean;
  };
  error?: string;
}

const STATUS_LABELS: Record<string, string> = {
  aguardando: 'AGUARDANDO',
  em_producao: 'EM PRODUÇÃO',
  pronto: 'PRONTO',
  entregue: 'ENTREGUE',
  cancelado: 'CANCELADO',
};
const STATUS_BG: Record<string, string> = {
  aguardando: '#fff8cc', em_producao: '#cce0ff', pronto: '#ccffcc', entregue: '#e0e0e0', cancelado: '#ccffcc',
};
const STATUS_COLOR: Record<string, string> = {
  aguardando: '#886600', em_producao: '#003388', pronto: '#006600', entregue: '#444', cancelado: '#005500',
};

const R = {
  bg: '#c8c4b0', panel: '#d4d0c8', alt: '#dedad2', bdr: '#b0aca4',
  hdr: 'linear-gradient(90deg,#005500,#008800)', hdrTxt: '#ccffcc', hdrBdr: '#007700',
};

function statusBadge(s: string) {
  return (
    <span style={{
      fontWeight: '700', fontSize: '11px', fontFamily: "'Courier New', monospace",
      color: STATUS_COLOR[s] || '#333', background: STATUS_BG[s] || '#eee',
      padding: '3px 10px', border: `1px solid ${STATUS_COLOR[s] || '#ccc'}`,
    }}>
      {STATUS_LABELS[s] || s.toUpperCase()}
    </span>
  );
}

export default function LabFluxoScan() {
  const [setor, setSetor] = useState<number | null>(() => {
    const s = localStorage.getItem('lab_scan_setor');
    return s ? parseInt(s, 10) : null;
  });
  const [setorNome, setSetorNome] = useState('');
  const [setorStatus, setSetorStatus] = useState('');
  const [buffer, setBuffer] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [setupMode, setSetupMode] = useState(!localStorage.getItem('lab_scan_setor'));
  const [historia, setHistoria] = useState<NonNullable<ScanResult['ordem']>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!setor) return;
    api.get<Record<string, string>>('/lab/configuracoes')
      .then(cfg => {
        setSetorNome(cfg[`param_setor_${setor}_nome`] || `Setor ${setor}`);
        setSetorStatus(cfg[`param_setor_${setor}_status`] || '');
      })
      .catch(() => setSetorNome(`Setor ${setor}`));
  }, [setor]);

  useEffect(() => {
    if (!setupMode) setTimeout(() => inputRef.current?.focus(), 100);
  }, [setupMode, result]);

  const handleScan = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || !setor) return;
    setScanning(true);
    setResult(null);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    try {
      const r = await api.post<ScanResult>('/lab/fluxo/scan', { numero: trimmed, setor });
      setResult(r);
      if (r.ok && r.ordem) setHistoria(h => [r.ordem!, ...h].slice(0, 12));
    } catch (err: unknown) {
      setResult({ ok: false, error: err instanceof Error ? err.message : 'Erro ao processar' });
    }
    setScanning(false);
    clearTimer.current = setTimeout(() => { setResult(null); inputRef.current?.focus(); }, 5000);
  }, [setor]);

  if (setupMode) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: R.bg }}>
        <div style={{ background: R.panel, border: `2px outset ${R.bdr}`, width: '360px' }}>
          <div style={{ background: R.hdr, color: R.hdrTxt, padding: '8px 14px', fontWeight: '700', fontSize: '13px', letterSpacing: '1px', border: `2px outset ${R.hdrBdr}`, borderBottom: 'none' }}>
            CONFIGURAR SETOR DESTE COMPUTADOR
          </div>
          <div style={{ border: `2px inset ${R.bdr}`, padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#444', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', fontFamily: "'Courier New', monospace" }}>
              Selecione o setor:
            </div>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n, i) => (
              <div key={n}
                onClick={() => { localStorage.setItem('lab_scan_setor', String(n)); setSetor(n); setSetupMode(false); }}
                style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', cursor: 'pointer', background: i % 2 === 0 ? R.panel : R.alt, borderBottom: `1px solid ${R.bdr}`, fontFamily: "'Courier New', monospace", fontSize: '12px', fontWeight: '700' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#005500'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? R.panel : R.alt; (e.currentTarget as HTMLElement).style.color = '#000'; }}>
                <span style={{ color: '#005500', width: '22px', flexShrink: 0 }}>{n}</span>
                <span>SETOR {n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: R.bg, fontFamily: "'Montserrat', sans-serif" }}
      onClick={() => inputRef.current?.focus()}>

      {/* Header */}
      <div style={{ background: R.hdr, color: R.hdrTxt, padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px outset ${R.hdrBdr}`, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '1px', textTransform: 'uppercase' }}>Leitura de Código de Barras</div>
          <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {setorNome || `Setor ${setor}`}
            {setorStatus && (
              <span style={{ fontSize: '11px', opacity: 0.85, marginLeft: '10px', fontWeight: '400' }}>
                → {STATUS_LABELS[setorStatus] || setorStatus}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setSetupMode(true)}
          style={{ fontSize: '10px', padding: '3px 10px', background: 'rgba(0,0,0,0.3)', color: R.hdrTxt, border: `1px solid ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', textTransform: 'uppercase' }}>
          MUDAR SETOR
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '12px', padding: '12px', overflow: 'hidden' }}>

        {/* Scan area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>

          {result ? (
            <div style={{ width: '100%', maxWidth: '480px', border: `3px outset ${result.ok ? '#006600' : '#005500'}` }}>
              <div style={{ background: result.ok ? '#006600' : '#005500', color: '#fff', padding: '6px 14px', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {result.ok ? '✓ LEITURA REALIZADA COM SUCESSO' : '✕ ERRO NA LEITURA'}
              </div>
              <div style={{ padding: '16px 20px', background: result.ok ? '#f0fff0' : '#fff0f0' }}>
                {result.ok && result.ordem ? (
                  <>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '36px', fontWeight: '900', color: '#000', marginBottom: '4px', letterSpacing: '2px' }}>
                      OS #{String(result.ordem.numero).padStart(4, '0')}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#333', marginBottom: '14px' }}>
                      {result.ordem.otica_nome}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {statusBadge(result.ordem.status_anterior)}
                      {result.ordem.mudou ? (
                        <>
                          <span style={{ fontSize: '20px', color: '#006600', fontWeight: '900' }}>→</span>
                          {statusBadge(result.ordem.status_novo)}
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>status mantido</span>
                      )}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#555', fontFamily: "'Courier New', monospace" }}>
                      Setor registrado: {result.ordem.setor_nome}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '13px', color: '#005500', fontWeight: '700', fontFamily: "'Courier New', monospace" }}>
                    {result.error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', border: `2px inset ${R.bdr}`, background: R.panel, padding: '40px 60px', width: '100%', maxWidth: '480px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: scanning ? 1 : 0.35, letterSpacing: '-4px', fontFamily: 'monospace' }}>
                {scanning ? '⟳' : '▌▌ ▌▌▌ ▌ ▌▌▌'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: scanning ? '#005500' : '#555', letterSpacing: '2px', fontFamily: "'Courier New', monospace", textTransform: 'uppercase' }}>
                {scanning ? 'PROCESSANDO...' : 'AGUARDANDO LEITURA'}
              </div>
              {!scanning && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                  Passe o leitor no código de barras da OS impressa
                </div>
              )}
            </div>
          )}

          {buffer && (
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#005500', fontWeight: '700', padding: '3px 12px', background: '#fff', border: `1px solid ${R.bdr}` }}>
              ► {buffer}_
            </div>
          )}

          {/* Hidden input — barcode readers type here */}
          <input
            ref={inputRef}
            value={buffer}
            onChange={e => setBuffer(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && buffer.trim()) {
                const code = buffer.trim();
                setBuffer('');
                handleScan(code);
              }
            }}
            style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0 }}
            autoFocus
          />
        </div>

        {/* History panel */}
        {historia.length > 0 && (
          <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: R.hdr, color: R.hdrTxt, padding: '4px 10px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', border: `2px outset ${R.hdrBdr}`, borderBottom: 'none', textTransform: 'uppercase' }}>
              Últimas Leituras
            </div>
            <div style={{ border: `2px inset ${R.bdr}`, overflowY: 'auto', flex: 1 }}>
              {historia.map((h, i) => (
                <div key={i} style={{ padding: '6px 10px', borderBottom: `1px solid ${R.bdr}`, background: i % 2 === 0 ? R.panel : R.alt }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', fontWeight: '700', color: '#005500' }}>
                    OS #{String(h.numero).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#333', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.otica_nome}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '700', fontFamily: "'Courier New', monospace", color: h.mudou ? '#006600' : '#888' }}>
                    {h.mudou ? `→ ${STATUS_LABELS[h.status_novo] || h.status_novo}` : '— sem mudança'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
