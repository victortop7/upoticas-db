import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../lib/api';

interface Parcela { id: string; numero: number; valor: number; vencimento: string; status: string; pix_copia_cola: string; }
interface Dados {
  carne: { id: string; descricao: string; valor_total: number; num_parcelas: number };
  parcelas: Parcela[];
  cliente: { nome: string; celular?: string; telefone?: string; cpf?: string } | null;
  loja: { nome: string; cidade?: string; uf?: string; telefone?: string; pix_chave?: string; pix_beneficiario?: string } | null;
}

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (s?: string) => { if (!s) return '—'; const [y, m, d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; };

export default function CarneImprimir() {
  const { id } = useParams();
  const [dados, setDados] = useState<Dados | null>(null);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Dados>(`/carnes/${id}`).then(d => {
      setDados(d);
      // Gera os QR Codes (data URL) de cada parcela
      Promise.all(d.parcelas.map(p =>
        QRCode.toDataURL(p.pix_copia_cola, { width: 190, margin: 1, errorCorrectionLevel: 'M' })
          .then(url => [p.id, url] as [string, string]).catch(() => [p.id, ''] as [string, string])
      )).then(pairs => setQrs(Object.fromEntries(pairs)));
    }).catch(() => setDados(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#333' }}>Carregando carnê…</div>;
  if (!dados) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#333' }}>Carnê não encontrado.</div>;

  const { carne, parcelas, cliente, loja } = dados;
  const benef = loja?.pix_beneficiario || loja?.nome || '';

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .no-print { display: none !important; } body { background: #fff; } }
        .slip { page-break-inside: avoid; }
      `}</style>

      {/* Barra de ações (some na impressão) */}
      <div className="no-print" style={{ position: 'sticky', top: 0, background: '#0b132b', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>Carnê — {cliente?.nome || 'Cliente'}</span>
        <button onClick={() => window.print()} style={{ padding: '9px 20px', fontSize: 14, fontWeight: 700, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🖨️ Imprimir / Salvar PDF</button>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px 60px' }}>
        {/* Cabeçalho */}
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{loja?.nome || 'Carnê de Pagamento'}</div>
          <div style={{ fontSize: 13, color: '#555' }}>
            {loja?.cidade ? `${loja.cidade}${loja.uf ? '/' + loja.uf : ''}` : ''}{loja?.telefone ? ` · ${loja.telefone}` : ''}
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <b>Cliente:</b> {cliente?.nome || '—'}{cliente?.cpf ? ` · CPF ${cliente.cpf}` : ''}<br />
            <b>Referente a:</b> {carne.descricao} — <b>{carne.num_parcelas}x</b> · Total {brl(carne.valor_total)}
          </div>
        </div>

        {/* Parcelas */}
        {parcelas.map(p => (
          <div key={p.id} className="slip" style={{ border: '1px solid #bbb', borderRadius: 10, padding: 16, marginTop: 14, display: 'flex', gap: 18, alignItems: 'center' }}>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace' }}>{p.numero}<span style={{ fontSize: 15, color: '#888' }}>/{carne.num_parcelas}</span></span>
                {p.status === 'pago' && <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', border: '1px solid #16a34a', borderRadius: 20, padding: '1px 10px' }}>PAGO</span>}
              </div>
              <div style={{ fontSize: 14, marginBottom: 2 }}><b>Vencimento:</b> {fmtData(p.vencimento)}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0b6b3a' }}>{brl(p.valor)}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>Pix copia e cola:</div>
              <div style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#333', wordBreak: 'break-all', lineHeight: 1.35, marginTop: 2, maxWidth: 460 }}>{p.pix_copia_cola}</div>
              {benef && <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Recebedor: <b>{benef}</b></div>}
            </div>
            {/* QR */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              {qrs[p.id]
                ? <img src={qrs[p.id]} alt="QR Pix" style={{ width: 150, height: 150, border: '1px solid #ddd', borderRadius: 8 }} />
                : <div style={{ width: 150, height: 150, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#999' }}>gerando…</div>}
              <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Aponte a câmera do banco</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20, fontSize: 11, color: '#888', textAlign: 'center' }}>
          Pague pelo app do seu banco escaneando o QR Code ou colando o código Pix de cada parcela.
        </div>
      </div>
    </div>
  );
}
