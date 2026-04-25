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

export default function Clientes() {
  const [data, setData] = useState<ClientesResponse | null>(null);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (busca) params.set('busca', busca);
      const res = await api.get<ClientesResponse>(`/clientes?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [busca, page]);

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

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'CPF', 'Celular', 'E-mail', 'Cidade', ''].map(h => (
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
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
            ) : !data?.clientes.length ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
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
                <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
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
    </div>
  );
}
