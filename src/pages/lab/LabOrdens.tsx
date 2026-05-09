import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; nome: string; }
interface Ordem {
  id: string; numero: number; status: string; tipo: string;
  ref_otica: string | null; cont_interno: string | null;
  previsao_entrega: string | null; total: number;
  created_at: string; otica_nome: string;
  vendedor: string | null; caixa: string | null;
}

const STATUS_FLOW = [
  { value: '', label: 'Todas', color: 'var(--text-dim)' },
  { value: 'aguardando', label: 'Aguardando', color: 'var(--amber)' },
  { value: 'em_producao', label: 'Em Produção', color: 'var(--accent)' },
  { value: 'pronto', label: 'Pronto', color: 'var(--green)' },
  { value: 'entregue', label: 'Entregue', color: 'var(--text-muted)' },
  { value: 'cancelado', label: 'Cancelado', color: 'var(--red)' },
];

const TIPOS_OS = [
  { value: '', label: 'Todos' },
  { value: 'O', label: 'OS Normal' }, { value: 'F', label: 'OS Freeform' },
  { value: 'G', label: 'OS Garantia' }, { value: 'U', label: 'Venda/Pedido' },
  { value: 'E', label: 'Encomenda' }, { value: 'Z', label: 'Recibo' },
  { value: 'N', label: 'Orçamento' }, { value: 'M', label: 'Mostruário' },
];

function statusColor(s: string) {
  return STATUS_FLOW.find(x => x.value === s)?.color ?? 'var(--text-dim)';
}
function statusLabel(s: string) {
  return STATUS_FLOW.find(x => x.value === s)?.label ?? s;
}
function brl(v: number) {
  return v > 0 ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';
}
function fmtDate(s: string | null) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function tipoLabel(t: string) {
  return TIPOS_OS.find(x => x.value === t)?.label ?? t ?? 'OS';
}

export default function LabOrdens() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [status, setStatus] = useState('');
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [oticaId, setOticaId] = useState('');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (tipo) p.set('tipo', tipo);
    if (busca) p.set('q', busca);
    if (oticaId) p.set('otica_id', oticaId);
    if (dataIni) p.set('data_ini', dataIni);
    if (dataFim) p.set('data_fim', dataFim);
    api.get<Ordem[]>(`/lab/ordens?${p}`)
      .then(setOrdens).catch(() => setOrdens([]))
      .finally(() => setLoading(false));
  }, [status, tipo, busca, oticaId, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => {}); }, []);

  // Stats por status
  const stats = STATUS_FLOW.slice(1).map(s => ({
    ...s, count: ordens.filter(o => o.status === s.value).length,
  }));

  const INP: React.CSSProperties = {
    padding: '7px 10px', fontSize: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '7px', color: 'var(--text)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ===== PAINEL ESQUERDO — FILTROS ===== */}
      <div style={{ width: '200px', flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Status</div>
          {STATUS_FLOW.map(s => (
            <div
              key={s.value}
              onClick={() => setStatus(s.value)}
              style={{
                padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '2px',
                fontSize: '12px', fontWeight: status === s.value ? '700' : '400',
                background: status === s.value ? `${s.color}18` : 'transparent',
                color: status === s.value ? s.color : 'var(--text-dim)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>{s.label}</span>
              {s.value && <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                {ordens.filter(o => o.status === s.value).length}
              </span>}
            </div>
          ))}
        </div>

        <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Tipo</div>
          {TIPOS_OS.map(t => (
            <div
              key={t.value}
              onClick={() => setTipo(t.value)}
              style={{
                padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px',
                fontSize: '12px', fontWeight: tipo === t.value ? '700' : '400',
                background: tipo === t.value ? 'var(--surface-alt)' : 'transparent',
                color: tipo === t.value ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ padding: '14px' }}>
          <button
            onClick={() => navigate('/lab/ordens/nova')}
            style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: '600', background: '#880000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Nova OS
          </button>
        </div>
      </div>

      {/* ===== ÁREA PRINCIPAL ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginRight: '8px' }}>Ordens de Serviço</h1>

          {/* Busca */}
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar OS#, ref., cont. interno..."
            style={{ ...INP, width: '220px' }}
          />

          {/* Ótica */}
          <select value={oticaId} onChange={e => setOticaId(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)', maxWidth: '180px' }}>
            <option value="">Todas as óticas</option>
            {oticas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>

          {/* Período */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>De</span>
            <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...INP, width: '130px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...INP, width: '130px' }} />
          </div>

          {/* Limpar */}
          {(busca || oticaId || dataIni || dataFim || tipo || status) && (
            <button
              onClick={() => { setBusca(''); setOticaId(''); setDataIni(''); setDataFim(''); setTipo(''); setStatus(''); }}
              style={{ fontSize: '12px', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}
            >
              ✕ Limpar filtros
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            {loading ? 'Carregando...' : `${ordens.length} resultado${ordens.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }} onClick={() => setStatus(s.value)}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{s.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--mono)', color: s.count > 0 ? s.color : 'var(--text-muted)' }}>{s.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabela */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
          ) : ordens.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nenhuma ordem encontrada.{' '}
              <button onClick={() => navigate('/lab/ordens/nova')} style={{ color: '#880000', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: '600' }}>
                Criar OS →
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                  {['Nº OS', 'Tipo', 'Data', 'Ótica', 'Ref. Ótica', 'Cont. Int.', 'Operador', 'Total', 'Previsão', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordens.map(o => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/lab/ordens/${o.id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      #{String(o.numero).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: 'var(--surface-alt)', color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontWeight: '600' }}>
                        {tipoLabel(o.tipo)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {fmtDate(o.created_at)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.otica_nome}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                      {o.ref_otica ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                      {o.cont_interno ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-dim)' }}>
                      {o.vendedor ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: '600', textAlign: 'right' }}>
                      {brl(o.total)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {fmtDate(o.previsao_entrega)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: statusColor(o.status), background: `${statusColor(o.status)}18`, padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
