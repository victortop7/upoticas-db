import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface Historico { id: string; cliente_nome?: string; celular: string; mensagem: string; tipo: string; campanha_id?: string; created_at: string; }

const TIPOS: Record<string, { label: string; color: string }> = {
  aniversario: { label: 'Aniversário', color: '#d97706' },
  cobranca:    { label: 'Cobrança', color: '#dc2626' },
  os:          { label: 'OS', color: '#2563eb' },
  venda:       { label: 'Venda', color: '#7c3aed' },
  promocao:    { label: 'Promoção', color: '#16a34a' },
  avulso:      { label: 'Avulso', color: '#64748b' },
};

function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Historico() {
  const [data, setData] = useState<{ historico: Historico[]; total: number; pages: number } | null>(null);
  const [tipo, setTipo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (tipo) params.set('tipo', tipo);
      setData(await api.get(`/marketing/historico?${params}`));
    } finally { setLoading(false); }
  }, [tipo, page]);

  useEffect(() => { load(); }, [load]);

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', fontSize: '12px', fontWeight: '500', border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text-dim)' });

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Histórico de Envios</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>{data?.total ?? '...'} mensagens enviadas via WhatsApp</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button style={filterBtn(tipo === '')} onClick={() => { setTipo(''); setPage(1); }}>Todos</button>
        {Object.entries(TIPOS).map(([key, { label }]) => (
          <button key={key} style={filterBtn(tipo === key)} onClick={() => { setTipo(key); setPage(1); }}>{label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data', 'Cliente', 'Celular', 'Tipo', 'Mensagem'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !data?.historico.length ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma mensagem enviada ainda.</td></tr>
            ) : data.historico.map((h, i) => {
              const t = TIPOS[h.tipo] || TIPOS.avulso;
              return (
                <tr key={h.id} style={{ borderBottom: i < data.historico.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmtDate(h.created_at)}</td>
                  <td style={{ padding: '11px 16px', fontSize: '14px', color: 'var(--text)' }}>{h.cliente_nome || '—'}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>{h.celular}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: `${t.color}18`, color: t.color }}>{t.label}</span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text-dim)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.mensagem}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', fontSize: '14px', background: p === page ? 'var(--primary)' : 'var(--surface)', color: p === page ? 'white' : 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
