import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Cliente } from '../types';
import ClienteModal from '../components/ClienteModal';
import ClienteHistoricoModal from '../components/ClienteHistoricoModal';

interface ClientesResponse {
  clientes: Cliente[];
  total: number;
  page: number;
  pages: number;
}

interface Estagio {
  id: string;
  key: string;
  label: string;
  icon: string;
  color: string;
  ordem: number;
}

export default function Clientes() {
  const [data, setData] = useState<ClientesResponse | null>(null);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null);
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [funilCliente, setFunilCliente] = useState<Cliente | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    api.get<Estagio[]>('/crm/estagios').then(setEstagios).catch(() => setEstagios([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (busca) params.set('busca', busca);
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);
      const res = await api.get<ClientesResponse>(`/clientes?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [busca, page, dataInicio, dataFim]);

  useEffect(() => { load(); }, [load]);

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function abrirNovo() {
    setEditando(null);
    setModalOpen(true);
  }

  function abrirEditar(cliente: Cliente) {
    setEditando(cliente);
    setModalOpen(true);
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este cliente?')) return;
    await api.delete(`/clientes/${id}`);
    load();
  }

  function fmtData(iso?: string) {
    if (!iso) return '—';
    const s = iso.slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
  }

  function anos1MaisAtras(iso?: string): boolean {
    if (!iso) return false;
    const d = new Date(iso.slice(0, 10));
    if (isNaN(d.getTime())) return false;
    return (Date.now() - d.getTime()) / 86400000 >= 365;
  }

  // Atalho: clientes que compraram há MAIS de 1 ano (para prospecção/reativação)
  function filtroMais1Ano() {
    const d = new Date();
    d.setDate(d.getDate() - 365);
    setDataInicio('');
    setDataFim(d.toISOString().slice(0, 10));
    setPage(1);
  }

  function limparFiltroData() {
    setDataInicio('');
    setDataFim('');
    setPage(1);
  }

  const filtroDataAtivo = !!(dataInicio || dataFim);

  async function colocarNoFunil(c: Cliente, estagio: Estagio) {
    try {
      await api.post('/crm', { cliente_id: c.id, estagio: estagio.key });
      setFunilCliente(null);
      alert(`${c.nome} foi colocado no funil, na etapa "${estagio.label}".`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível adicionar ao funil');
    }
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Clientes</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-dim)' }}>
            {data?.total ?? '...'} clientes cadastrados
          </p>
        </div>
        <button onClick={abrirNovo} style={{
          padding: '9px 18px', fontSize: '14px', fontWeight: '600',
          background: 'var(--primary)', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer',
        }}>
          + Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <form onSubmit={handleBusca} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, CPF, telefone ou e-mail..."
          style={{
            flex: 1, padding: '9px 12px', fontSize: '14px',
            border: '1px solid var(--border)', borderRadius: '8px',
            background: 'var(--surface)', color: 'var(--text)', outline: 'none',
          }}
        />
        <button type="submit" style={{
          padding: '9px 16px', fontSize: '14px', fontWeight: '500',
          background: 'var(--surface)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
        }}>
          Buscar
        </button>
        {busca && (
          <button type="button" onClick={() => { setBusca(''); setPage(1); }} style={{
            padding: '9px 12px', fontSize: '14px',
            background: 'transparent', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>
            Limpar
          </button>
        )}
      </form>

      {/* Filtro por data da compra */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)' }}>🛍️ Data da compra:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>De</label>
          <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPage(1); }} style={{
            padding: '7px 10px', fontSize: '13px', fontFamily: 'var(--mono)',
            border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none',
          }} />
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Até</label>
          <input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPage(1); }} style={{
            padding: '7px 10px', fontSize: '13px', fontFamily: 'var(--mono)',
            border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none',
          }} />
        </div>
        <button type="button" onClick={filtroMais1Ano} style={{
          padding: '7px 14px', fontSize: '13px', fontWeight: 600,
          background: 'var(--amber-dim)', color: 'var(--amber)',
          border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer',
        }}>
          🔄 Comprou há +1 ano
        </button>
        {filtroDataAtivo && (
          <button type="button" onClick={limparFiltroData} style={{
            padding: '7px 12px', fontSize: '13px',
            background: 'transparent', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>
            Limpar data
          </button>
        )}
        {filtroDataAtivo && (
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: 'auto' }}>
            {data?.total ?? 0} cliente(s) neste período
          </span>
        )}
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'CPF', 'Celular', 'E-mail', 'Cidade', 'Compra', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.5px', background: 'var(--surface-alt)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !data?.clientes.length ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                {busca ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado ainda.'}
              </td></tr>
            ) : data.clientes.map((c, i) => (
              <tr key={c.id} style={{
                borderBottom: i < data.clientes.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{c.nome}</div>
                  {c.apelido && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.apelido}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  {c.cpf || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  {c.celular || c.telefone || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>
                  {c.email || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>
                  {c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ''}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', color: anos1MaisAtras(c.data_compra) ? 'var(--amber)' : 'var(--text-dim)' }} title={anos1MaisAtras(c.data_compra) ? 'Mais de 1 ano — candidato a reativação' : ''}>
                  {fmtData(c.data_compra)}{anos1MaisAtras(c.data_compra) ? ' 🔄' : ''}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => setFunilCliente(c)} title="Colocar este cliente no funil do CRM (escolher a etapa)" style={{
                    padding: '5px 10px', fontSize: '12px', marginRight: '6px',
                    background: 'var(--green-dim)', color: 'var(--green)',
                    border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer',
                  }}>+ Funil</button>
                  <button onClick={() => setHistoricoCliente(c)} style={{
                    padding: '5px 10px', fontSize: '12px', marginRight: '6px',
                    background: 'var(--surface-alt)', color: 'var(--text-dim)',
                    border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                  }}>Histórico</button>
                  <button onClick={() => abrirEditar(c)} style={{
                    padding: '5px 10px', fontSize: '12px', marginRight: '6px',
                    background: 'var(--primary-dim)', color: 'var(--primary)',
                    border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer',
                  }}>Editar</button>
                  <button onClick={() => excluir(c.id)} style={{
                    padding: '5px 10px', fontSize: '12px',
                    background: 'var(--red-dim)', color: 'var(--red)',
                    border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer',
                  }}>Excluir</button>
                </td>
              </tr>
            ))}
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
            }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <ClienteModal
          cliente={editando}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
      {historicoCliente && (
        <ClienteHistoricoModal
          clienteId={historicoCliente.id}
          clienteNome={historicoCliente.nome}
          onClose={() => setHistoricoCliente(null)}
        />
      )}
      {funilCliente && (
        <div onClick={() => setFunilCliente(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,18,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: 360, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Colocar no funil</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{funilCliente.nome} — escolha a etapa:</div>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {estagios.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Carregando etapas…</div>}
              {estagios.map(e => (
                <button key={e.id} onClick={() => colocarNoFunil(funilCliente, e)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '11px 14px', background: 'var(--surface-alt)', border: `1px solid var(--border)`,
                  borderLeft: `4px solid ${e.color}`, borderRadius: 9, cursor: 'pointer',
                  color: 'var(--text)', fontSize: 14, fontWeight: 600,
                }}>
                  <span style={{ fontSize: 17 }}>{e.icon}</span>{e.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
