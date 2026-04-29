import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';

const STATUS_COLOR: Record<string, string> = {
  aguardando: 'var(--amber)', em_producao: 'var(--accent)',
  pronto: 'var(--green)', entregue: 'var(--text-dim)', cancelado: 'var(--red)',
};
const STATUS_LABEL: Record<string, string> = {
  aguardando: 'Aguardando', em_producao: 'Em Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

function brl(v: number) {
  return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function LabOticaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get<any>(`/lab/oticas/${id}`)
      .then(d => { setData(d); setForm(d.otica); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/lab/oticas/${id}`, form);
      setEditando(false);
      load();
    } catch {}
    setSaving(false);
  }

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '48px', color: 'var(--red)', fontSize: '14px' }}>Ótica não encontrada.</div>;

  const { otica, ordens, stats } = data;
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/lab/oticas')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>{otica.nome}</h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-dim)' }}>
              {otica.cidade && otica.uf ? `${otica.cidade}/${otica.uf}` : otica.cidade ?? 'Ótica Cliente'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditando(true)}
            style={{ padding: '9px 16px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Editar
          </button>
          <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)}
            style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nova OS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total de OS', value: stats?.total_ordens ?? 0, color: 'var(--text)' },
          { label: 'Em Aberto', value: stats?.em_aberto ?? 0, color: 'var(--amber)' },
          { label: 'Prontos', value: stats?.prontos ?? 0, color: 'var(--green)' },
          { label: 'Valor Total', value: brl(stats?.valor_total ?? 0), color: 'var(--accent)', mono: true },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>

        {/* Info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', alignSelf: 'start' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '14px' }}>Informações</div>
          {[
            { label: 'CNPJ', value: otica.cnpj },
            { label: 'Telefone', value: otica.telefone },
            { label: 'E-mail', value: otica.email },
            { label: 'Endereço', value: otica.endereco },
            { label: 'Cidade/UF', value: otica.cidade && otica.uf ? `${otica.cidade}/${otica.uf}` : otica.cidade },
            { label: 'CEP', value: otica.cep },
            { label: 'Observação', value: otica.observacao },
          ].map(({ label, value }) => value ? (
            <div key={label} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '13px', color: 'var(--text)' }}>{value}</div>
            </div>
          ) : null)}
        </div>

        {/* Histórico de OS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Histórico de Ordens</span>
            <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)}
              style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              + Nova OS →
            </button>
          </div>

          {ordens.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>Nenhuma OS para esta ótica.</div>
              <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)}
                style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Criar primeira OS →
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nº OS', 'Ref.', 'Serviços', 'Total', 'Previsão', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordens.map((o: any) => (
                  <tr key={o.id}
                    onClick={() => navigate(`/lab/ordens/${o.id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                      #{String(o.numero).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.ref_otica ?? '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{o.servicos_count} serv.</td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{brl(o.total)}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.previsao_entrega ?? '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: STATUS_COLOR[o.status] ?? 'var(--text-dim)', background: `${STATUS_COLOR[o.status] ?? 'var(--text-dim)'}18`, padding: '3px 8px', borderRadius: '20px' }}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Editar */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Editar Ótica</h2>
              <button onClick={() => setEditando(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Nome *</label>
                <input required value={form.nome ?? ''} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>CNPJ</label>
                  <input value={form.cnpj ?? ''} onChange={e => setForm((f: any) => ({ ...f, cnpj: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Telefone</label>
                  <input value={form.telefone ?? ''} onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>E-mail</label>
                <input type="email" value={form.email ?? ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Endereço</label>
                <input value={form.endereco ?? ''} onChange={e => setForm((f: any) => ({ ...f, endereco: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Cidade</label>
                  <input value={form.cidade ?? ''} onChange={e => setForm((f: any) => ({ ...f, cidade: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>UF</label>
                  <input value={form.uf ?? ''} onChange={e => setForm((f: any) => ({ ...f, uf: e.target.value }))} maxLength={2} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>CEP</label>
                  <input value={form.cep ?? ''} onChange={e => setForm((f: any) => ({ ...f, cep: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>Observação</label>
                <input value={form.observacao ?? ''} onChange={e => setForm((f: any) => ({ ...f, observacao: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setEditando(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
