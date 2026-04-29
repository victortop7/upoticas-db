import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

const STATUS_FLOW = [
  { value: 'aguardando', label: 'Aguardando', color: 'var(--amber)' },
  { value: 'em_producao', label: 'Em Produção', color: 'var(--accent)' },
  { value: 'pronto', label: 'Pronto', color: 'var(--green)' },
  { value: 'entregue', label: 'Entregue', color: 'var(--text-dim)' },
  { value: 'cancelado', label: 'Cancelado', color: 'var(--red)' },
];

function fmt(v: number | null | undefined, sinal = true): string {
  if (v == null || isNaN(Number(v))) return '—';
  const n = Number(v);
  return (sinal && n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',');
}

export default function LabOrdemDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  function load() {
    setLoading(true);
    api.get<any>(`/lab/ordens/${id}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(status: string) {
    setUpdatingStatus(true);
    try {
      await api.patch(`/lab/ordens/${id}`, { status });
      setData((d: any) => ({ ...d, ordem: { ...d.ordem, status } }));
    } catch {}
    setUpdatingStatus(false);
  }

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '48px', color: 'var(--red)', fontSize: '14px' }}>Ordem não encontrada.</div>;

  const { ordem, receita, armacao, servicos } = data;
  const od = receita?.find((r: any) => r.olho === 'D');
  const oe = receita?.find((r: any) => r.olho === 'E');
  const statusAtual = STATUS_FLOW.find(s => s.value === ordem.status);

  function RxRow({ label, od: d, oe: e }: { label: string; od: string; oe: string }) {
    return (
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</td>
        <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)', textAlign: 'center' }}>{d || '—'}</td>
        <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)', textAlign: 'center' }}>{e || '—'}</td>
      </tr>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/lab/ordens')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>
                OS #{String(ordem.numero).padStart(4, '0')}
              </h1>
              {statusAtual && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: statusAtual.color, background: `${statusAtual.color}18`, padding: '3px 10px', borderRadius: '20px' }}>
                  {statusAtual.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>{ordem.otica_nome}</div>
          </div>
        </div>
        <Link
          to={`/lab/ordens/${id}/imprimir`}
          target="_blank"
          style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '600', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}
        >
          Imprimir OS
        </Link>
      </div>

      {/* Alterar Status */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alterar Status</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_FLOW.map(s => (
            <button
              key={s.value}
              disabled={updatingStatus || ordem.status === s.value}
              onClick={() => changeStatus(s.value)}
              style={{
                padding: '7px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: ordem.status === s.value ? 'default' : 'pointer', fontFamily: 'inherit',
                background: ordem.status === s.value ? `${s.color}20` : 'transparent',
                color: ordem.status === s.value ? s.color : 'var(--text-muted)',
                border: `1px solid ${ordem.status === s.value ? s.color : 'var(--border)'}`,
                opacity: updatingStatus ? 0.5 : 1,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Info OS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Informações</div>
          {[
            { label: 'Ótica', value: ordem.otica_nome },
            { label: 'Ref. Ótica', value: ordem.ref_otica ?? '—' },
            { label: 'Vendedor', value: ordem.vendedor ?? '—' },
            { label: 'Previsão', value: ordem.previsao_entrega ?? '—' },
            { label: 'Cond. Pgto', value: ordem.condicao_pgto ?? '—' },
            { label: 'Gravura', value: ordem.texto_gravura ?? '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--mono)' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Armação */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Armação</div>
          {armacao ? [
            { label: 'Material', value: armacao.material ?? '—' },
            { label: 'Estojo', value: armacao.estojo ? 'Sim' : 'Não' },
            { label: 'Ponte', value: armacao.ponte ? `${armacao.ponte} mm` : '—' },
            { label: 'Diâmetro', value: armacao.diametro ? `${armacao.diametro} mm` : '—' },
            { label: 'DPLIP', value: armacao.dplip ?? '—' },
            { label: 'Info', value: armacao.informacoes ?? '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'var(--mono)' }}>{item.value}</span>
            </div>
          )) : <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sem dados de armação</div>}
        </div>
      </div>

      {/* Receita */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Receita das Lentes</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}></th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>OD</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>OE</th>
            </tr>
          </thead>
          <tbody>
            <RxRow label="ESF Longe" od={fmt(od?.esf_longe)} oe={fmt(oe?.esf_longe)} />
            <RxRow label="CIL Longe" od={fmt(od?.cil_longe)} oe={fmt(oe?.cil_longe)} />
            <RxRow label="EIXO" od={od?.eixo_longe ?? '—'} oe={oe?.eixo_longe ?? '—'} />
            <RxRow label="Adição" od={fmt(od?.adicao)} oe={fmt(oe?.adicao)} />
            <RxRow label="ESF Perto" od={fmt(od?.esf_perto)} oe={fmt(oe?.esf_perto)} />
            <RxRow label="DNP" od={od?.dnp ?? '—'} oe={oe?.dnp ?? '—'} />
            <RxRow label="ALT" od={od?.alt ?? '—'} oe={oe?.alt ?? '—'} />
            <RxRow label="Prisma" od={od?.prisma ?? '—'} oe={oe?.prisma ?? '—'} />
          </tbody>
        </table>
      </div>

      {/* Serviços */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Serviços</div>
        {servicos?.length === 0 ? (
          <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Nenhum serviço registrado.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Descrição', 'Qtd', 'Valor Unit.', 'Desconto', 'Total'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servicos.map((s: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text)' }}>{s.descricao}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--text-dim)' }}>{s.qtd}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--text-dim)' }}>R$ {Number(s.valor_unit).toFixed(2).replace('.', ',')}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--text-dim)' }}>R$ {Number(s.desconto).toFixed(2).replace('.', ',')}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--text)', fontWeight: '600' }}>R$ {Number(s.total).toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                Total: R$ {Number(ordem.total).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </>
        )}
      </div>

      {ordem.observacoes && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Observações</div>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>{ordem.observacoes}</div>
        </div>
      )}
    </div>
  );
}
