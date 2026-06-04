import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

const STATUS_FLOW = [
  { value: 'aguardando', label: 'Aguardando', color: '#886600' },
  { value: 'em_producao', label: 'Em Produção', color: '#003388' },
  { value: 'pronto', label: 'Pronto', color: '#006600' },
  { value: 'entregue', label: 'Entregue', color: '#555' },
  { value: 'cancelado', label: 'Cancelado', color: '#cc0000' },
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
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleExcluir() {
    setExcluindo(true);
    try {
      await api.delete(`/lab/ordens/${id}`);
      navigate('/lab/ordens');
    } catch { setExcluindo(false); }
  }

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

  if (loading) return <div style={{ padding: '48px', color: '#666', fontSize: '14px' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '48px', color: '#cc0000', fontSize: '14px' }}>Ordem não encontrada.</div>;

  const { ordem, receita, armacao, servicos } = data;
  const od = receita?.find((r: any) => r.olho === 'D');
  const oe = receita?.find((r: any) => r.olho === 'E');
  const statusAtual = STATUS_FLOW.find(s => s.value === ordem.status);

  function RxRow({ label, od: d, oe: e }: { label: string; od: string; oe: string }) {
    return (
      <tr style={{ borderBottom: '1px solid #b0aca4' }}>
        <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>{label}</td>
        <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: "'Courier New', monospace", color: '#000', textAlign: 'center' }}>{d || '—'}</td>
        <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: "'Courier New', monospace", color: '#000', textAlign: 'center' }}>{e || '—'}</td>
      </tr>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px', background: '#c8c4b0', fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/lab/ordens')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#000' }}>
                OS #{String(ordem.numero).padStart(4, '0')}
              </h1>
              {statusAtual && (
                <span style={{ fontSize: '12px', fontWeight: '600', color: statusAtual.color, background: `${statusAtual.color}18`, padding: '3px 10px', borderRadius: '20px' }}>
                  {statusAtual.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '2px' }}>{ordem.otica_nome}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            to={`/lab/ordens/${id}/imprimir`}
            target="_blank"
            style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '600', background: 'transparent', color: '#555', border: '1px solid #b0aca4', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}
          >
            Imprimir OS
          </Link>
          <button
            onClick={() => setConfirmarExcluir(true)}
            style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '600', background: 'rgba(200,0,0,0.12)', color: '#cc0000', border: '1px solid #cc0000', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Excluir OS
          </button>
        </div>
      </div>

      {/* Modal confirmar exclusão */}
      {confirmarExcluir && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px', width: '360px', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(200,0,0,0.12)', borderBottom: '1px solid #cc0000', padding: '14px 18px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#cc0000' }}>⚠ Excluir Ordem de Serviço</div>
            </div>
            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', color: '#000', lineHeight: 1.6 }}>
                Deseja excluir a <strong>OS #{String(ordem.numero).padStart(4, '0')}</strong>?<br />
                <span style={{ fontSize: '12px', color: '#555' }}>Receita, armação e serviços serão removidos. Esta ação não pode ser desfeita.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setConfirmarExcluir(false)}
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', background: 'transparent', color: '#000', border: '1px solid #b0aca4', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  NÃO
                </button>
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', background: '#cc0000', color: '#fff', border: 'none', borderRadius: '8px', cursor: excluindo ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {excluindo ? 'Excluindo...' : 'SIM, EXCLUIR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alterar Status */}
      <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alterar Status</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_FLOW.map(s => (
            <button
              key={s.value}
              disabled={updatingStatus || ordem.status === s.value}
              onClick={() => changeStatus(s.value)}
              style={{
                padding: '7px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: ordem.status === s.value ? 'default' : 'pointer', fontFamily: 'inherit',
                background: ordem.status === s.value ? `${s.color}20` : 'transparent',
                color: ordem.status === s.value ? s.color : '#666',
                border: `1px solid ${ordem.status === s.value ? s.color : '#b0aca4'}`,
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
        <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#000', marginBottom: '12px' }}>Informações</div>
          {[
            { label: 'Tipo', value: ordem.tipo ?? '—' },
            { label: 'Ótica', value: ordem.otica_nome },
            { label: 'Ref. Ótica', value: ordem.ref_otica ?? '—' },
            { label: 'Cont. Interno', value: ordem.cont_interno ?? '—' },
            { label: 'Caixa', value: ordem.caixa ?? '—' },
            { label: 'Operador', value: ordem.vendedor ?? '—' },
            { label: 'Médico', value: ordem.medico ?? '—' },
            { label: 'Previsão', value: ordem.previsao_entrega ?? '—' },
            { label: 'Cond. Pgto', value: ordem.condicao_pgto ?? '—' },
            { label: 'Sinal/Entrada', value: ordem.sinal ? `R$ ${Number(ordem.sinal).toFixed(2).replace('.',',')}` : '—' },
            { label: 'Rota', value: ordem.rota ?? '—' },
            { label: 'Gravura', value: ordem.texto_gravura ?? '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: '#000', fontFamily: "'Courier New', monospace" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Armação */}
        <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#000', marginBottom: '12px' }}>Armação</div>
          {armacao ? [
            { label: 'Tipo', value: armacao.tipo_material ?? armacao.material ?? '—' },
            { label: 'Shape', value: armacao.shape ?? '—' },
            { label: 'Largura', value: armacao.largura ? `${armacao.largura} mm` : '—' },
            { label: 'Altura', value: armacao.altura ? `${armacao.altura} mm` : '—' },
            { label: 'Ponte', value: armacao.ponte ? `${armacao.ponte} mm` : '—' },
            { label: 'Maior Diag.', value: armacao.maior_diagonal ? `${armacao.maior_diagonal} mm` : '—' },
            { label: 'Diâmetro Final', value: armacao.diametro_final ? `${armacao.diametro_final} mm` : '—' },
            { label: 'Tipo Lente', value: armacao.tipo_lente ?? '—' },
            { label: 'Marca/Material', value: armacao.marca_material ?? '—' },
            { label: 'O/D', value: armacao.lente_od ?? '—' },
            { label: 'O/E', value: armacao.lente_oe ?? '—' },
            { label: 'Estojo', value: armacao.estojo ? 'Sim' : 'Não' },
            { label: 'Info', value: armacao.informacoes ?? '—' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: '#000', fontFamily: "'Courier New', monospace" }}>{item.value}</span>
            </div>
          )) : <div style={{ fontSize: '13px', color: '#666' }}>Sem dados de armação</div>}
        </div>
      </div>

      {/* Receita */}
      <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #b0aca4', fontSize: '13px', fontWeight: '700', color: '#000' }}>Receita das Lentes</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #b0aca4', background: '#dedad2' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#666', fontWeight: '600' }}></th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: '#555', fontWeight: '700' }}>OD</th>
              <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: '#555', fontWeight: '700' }}>OE</th>
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
      <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #b0aca4', fontSize: '13px', fontWeight: '700', color: '#000' }}>Serviços</div>
        {servicos?.length === 0 ? (
          <div style={{ padding: '24px', color: '#666', fontSize: '13px' }}>Nenhum serviço registrado.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #b0aca4' }}>
                  {['Descrição', 'Qtd', 'Valor Unit.', 'Desconto', 'Total'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servicos.map((s: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #b0aca4' }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: '#000' }}>{s.descricao}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: "'Courier New', monospace", textAlign: 'right', color: '#555' }}>{s.qtd}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: "'Courier New', monospace", textAlign: 'right', color: '#555' }}>R$ {Number(s.valor_unit).toFixed(2).replace('.', ',')}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: "'Courier New', monospace", textAlign: 'right', color: '#555' }}>R$ {Number(s.desconto).toFixed(2).replace('.', ',')}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: "'Courier New', monospace", textAlign: 'right', color: '#000', fontWeight: '600' }}>R$ {Number(s.total).toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #b0aca4' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#000', fontFamily: "'Courier New', monospace" }}>
                Total: R$ {Number(ordem.total).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </>
        )}
      </div>

      {ordem.observacoes && (
        <div style={{ background: '#d4d0c8', border: '1px solid #b0aca4', borderRadius: '12px', padding: '16px 20px', marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Observações</div>
          <div style={{ fontSize: '13px', color: '#000', lineHeight: '1.5' }}>{ordem.observacoes}</div>
        </div>
      )}
    </div>
  );
}
