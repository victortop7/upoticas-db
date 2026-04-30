import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import VendaModal from '../components/VendaModal';

interface Venda {
  id: string;
  numero: number;
  cliente_id?: string;
  cliente_nome?: string;
  os_id?: string;
  situacao: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento?: string;
  observacao?: string;
  nfce_status?: string;
  created_at: string;
}

interface VendasResponse {
  vendas: Venda[];
  total: number;
  page: number;
  pages: number;
}

const SITUACAO_COLOR: Record<string, { bg: string; color: string }> = {
  ativa:     { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  cancelada: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
};

const PGTO_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito',
  debito: 'Débito', boleto: 'Boleto', outro: 'Outro',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(s: string) {
  const [y, m, d] = s.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export default function Vendas() {
  const [data, setData] = useState<VendasResponse | null>(null);
  const [busca, setBusca] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Venda | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (busca) params.set('busca', busca);
      if (situacaoFiltro) params.set('situacao', situacaoFiltro);
      const res = await api.get<VendasResponse>(`/vendas?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [busca, situacaoFiltro, page]);

  useEffect(() => { load(); }, [load]);

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function abrirNova() { setEditando(null); setModalOpen(true); }
  function abrirEditar(v: Venda) { setEditando(v); setModalOpen(true); }

  async function emitirNfce(vendaId: string) {
    try {
      const res = await api.post<{ ok: boolean; mensagem?: string; status?: string }>('/nfce/emitir', { venda_id: vendaId });
      if (res.ok) {
        alert(res.mensagem || 'NFC-e registrada com sucesso!');
        load();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao emitir NFC-e');
    }
  }

  async function excluir(id: string, numero: number) {
    if (!confirm(`Excluir venda #${numero}?`)) return;
    await api.delete(`/vendas/${id}`);
    load();
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: '12px', fontWeight: '500',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: '20px', cursor: 'pointer',
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? 'white' : 'var(--text-dim)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Vendas</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-dim)' }}>
            {data?.total ?? '...'} vendas registradas
          </p>
        </div>
        <button onClick={abrirNova} style={{
          padding: '9px 18px', fontSize: '14px', fontWeight: '600',
          background: 'var(--primary)', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer',
        }}>+ Nova Venda</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button style={filterBtn(situacaoFiltro === '')} onClick={() => { setSituacaoFiltro(''); setPage(1); }}>Todas</button>
        <button style={filterBtn(situacaoFiltro === 'ativa')} onClick={() => { setSituacaoFiltro('ativa'); setPage(1); }}>Ativas</button>
        <button style={filterBtn(situacaoFiltro === 'cancelada')} onClick={() => { setSituacaoFiltro('cancelada'); setPage(1); }}>Canceladas</button>
      </div>

      {/* Busca */}
      <form onSubmit={handleBusca} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por cliente, nº venda ou forma de pagamento..."
          style={{
            flex: 1, padding: '9px 12px', fontSize: '14px',
            border: '1px solid var(--border)', borderRadius: '8px',
            background: 'var(--surface)', color: 'var(--text)', outline: 'none',
          }}
        />
        <button type="submit" style={{
          padding: '9px 16px', fontSize: '14px',
          background: 'var(--surface)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
        }}>Buscar</button>
        {busca && (
          <button type="button" onClick={() => { setBusca(''); setPage(1); }} style={{
            padding: '9px 12px', fontSize: '14px',
            background: 'transparent', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>Limpar</button>
        )}
      </form>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nº', 'Data', 'Cliente', 'Pagamento', 'Total', 'Desconto', 'Final', 'Situação', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.5px', background: 'var(--surface-alt)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !data?.vendas.length ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                {busca || situacaoFiltro ? 'Nenhuma venda encontrada.' : 'Nenhuma venda registrada ainda.'}
              </td></tr>
            ) : data.vendas.map((v, i) => {
              const sc = SITUACAO_COLOR[v.situacao] || SITUACAO_COLOR.ativa;
              return (
                <tr key={v.id} style={{
                  borderBottom: i < data.vendas.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                    #{String(v.numero).padStart(4, '0')}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>
                    {formatDate(v.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)' }}>
                    {v.cliente_nome || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>
                    {PGTO_LABEL[v.forma_pagamento || ''] || v.forma_pagamento || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>
                    {formatBRL(v.valor_total)}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: v.desconto > 0 ? '#d97706' : 'var(--text-muted)' }}>
                    {v.desconto > 0 ? `-${formatBRL(v.desconto)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                    {formatBRL(v.valor_final)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                      background: sc.bg, color: sc.color,
                    }}>
                      {v.situacao === 'ativa' ? 'Ativa' : 'Cancelada'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => emitirNfce(v.id)} style={{
                      padding: '5px 10px', fontSize: '11px', marginRight: '6px',
                      background: v.nfce_status === 'emitida' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                      color: v.nfce_status === 'emitida' ? 'var(--green)' : 'var(--amber)',
                      border: '1px solid transparent', borderRadius: '6px', cursor: v.nfce_status === 'emitida' ? 'default' : 'pointer',
                      fontWeight: '600',
                    }} disabled={v.nfce_status === 'emitida'}>
                      {v.nfce_status === 'emitida' ? '✓ NFC-e' : 'NFC-e'}
                    </button>
                    <button onClick={() => abrirEditar(v)} style={{
                      padding: '5px 10px', fontSize: '12px', marginRight: '6px',
                      background: 'var(--primary-dim)', color: 'var(--primary)',
                      border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer',
                    }}>Editar</button>
                    <button onClick={() => excluir(v.id, v.numero)} style={{
                      padding: '5px 10px', fontSize: '12px',
                      background: 'var(--red-dim)', color: 'var(--red)',
                      border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer',
                    }}>Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: '36px', height: '36px', fontSize: '14px',
              background: p === page ? 'var(--primary)' : 'var(--surface)',
              color: p === page ? 'white' : 'var(--text-dim)',
              border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>
      )}

      {modalOpen && (
        <VendaModal
          venda={editando}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
