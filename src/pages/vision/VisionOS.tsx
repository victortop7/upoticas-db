import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

type Tab = 'cliente' | 'receita' | 'laboratorio' | 'fechamento' | 'busca';

interface OSData {
  // Cliente
  cliente_nome: string;
  cliente_cpf: string;
  cliente_tel: string;
  // Receita
  od_esf: string; od_cil: string; od_eixo: string;
  od_adicao: string; od_dnp: string; od_alt: string;
  oe_esf: string; oe_cil: string; oe_eixo: string;
  oe_adicao: string; oe_dnp: string; oe_alt: string;
  medico_nome: string; medico_crm: string; data_receita: string;
  // Lab
  arm_dnp: string; arm_vertical: string; arm_ponte: string;
  arm_aro: string; arm_alt_pupilar: string;
  // Fechamento
  lente_desc: string; valor_lente: string; valor_armacao: string;
  desconto: string; forma_pagamento: string; parcelas: string;
  tipo: string;
}

interface VisionOSRow {
  id: string;
  numero: number;
  tipo: string;
  cliente_nome: string | null;
  valor_total: number;
  status: string;
  created_at: string;
}

const EMPTY: OSData = {
  cliente_nome: '', cliente_cpf: '', cliente_tel: '',
  od_esf: '', od_cil: '', od_eixo: '', od_adicao: '', od_dnp: '', od_alt: '',
  oe_esf: '', oe_cil: '', oe_eixo: '', oe_adicao: '', oe_dnp: '', oe_alt: '',
  medico_nome: '', medico_crm: '', data_receita: '',
  arm_dnp: '', arm_vertical: '', arm_ponte: '', arm_aro: '', arm_alt_pupilar: '',
  lente_desc: '', valor_lente: '', valor_armacao: '', desconto: '',
  forma_pagamento: 'Cartão', parcelas: '1', tipo: 'orcamento',
};

function Field({ label, value, onChange, placeholder = '', width = '100%' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; width?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width }}>
      <label style={{
        fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
      }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#0a0c12', border: '1px solid #1a1f2e',
          borderRadius: 8, padding: '10px 12px',
          fontSize: 13, color: '#e8eaf0', fontFamily: 'var(--mono)',
          outline: 'none', width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#3b82f660')}
        onBlur={e => (e.currentTarget.style.borderColor = '#1a1f2e')}
      />
    </div>
  );
}

function RxCell({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <td style={{ padding: '4px 6px' }}>
      <div style={{
        fontSize: 9, color: '#3d4a5c', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', marginBottom: 3,
      }}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: 60, background: '#0a0c12', border: '1px solid #1a1f2e',
          borderRadius: 6, padding: '6px 8px', fontSize: 12,
          color: '#e8eaf0', fontFamily: 'var(--mono)',
          outline: 'none', textAlign: 'center',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#3b82f660')}
        onBlur={e => (e.currentTarget.style.borderColor = '#1a1f2e')}
      />
    </td>
  );
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '14px 18px', fontSize: 13, fontWeight: 600,
        color: active ? '#3b82f6' : '#4a5568',
        borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        fontFamily: 'var(--sans)', transition: 'color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function totalOS(data: OSData): number {
  const lente = parseFloat(data.valor_lente) || 0;
  const armacao = parseFloat(data.valor_armacao) || 0;
  const desconto = parseFloat(data.desconto) || 0;
  return Math.max(0, lente + armacao - desconto);
}

export default function VisionOS() {
  const [tab, setTab] = useState<Tab>('cliente');
  const [data, setData] = useState<OSData>({ ...EMPTY });
  const [oslist, setOslist] = useState<VisionOSRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busca, setBusca] = useState('');

  function set(field: keyof OSData) {
    return (v: string) => setData(prev => ({ ...prev, [field]: v }));
  }

  async function salvar(tipo: 'orcamento' | 'venda') {
    setSaving(true);
    try {
      const total = totalOS(data);
      await api.post('/vision/os', {
        ...data,
        tipo,
        od_esf: data.od_esf || null, od_cil: data.od_cil || null,
        od_eixo: data.od_eixo ? parseInt(data.od_eixo) : null,
        od_adicao: data.od_adicao || null, od_dnp: data.od_dnp || null, od_alt: data.od_alt || null,
        oe_esf: data.oe_esf || null, oe_cil: data.oe_cil || null,
        oe_eixo: data.oe_eixo ? parseInt(data.oe_eixo) : null,
        oe_adicao: data.oe_adicao || null, oe_dnp: data.oe_dnp || null, oe_alt: data.oe_alt || null,
        arm_dnp: data.arm_dnp || null, arm_vertical: data.arm_vertical || null,
        arm_ponte: data.arm_ponte || null, arm_aro: data.arm_aro || null,
        arm_alt_pupilar: data.arm_alt_pupilar || null,
        valor_lente: parseFloat(data.valor_lente) || 0,
        valor_armacao: parseFloat(data.valor_armacao) || 0,
        desconto: parseFloat(data.desconto) || 0,
        valor_total: total,
        parcelas: parseInt(data.parcelas) || 1,
      });
      setSaved(true);
      setData({ ...EMPTY });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Erro ao salvar OS.');
    } finally {
      setSaving(false);
    }
  }

  async function carregarBusca() {
    try {
      const rows = await api.get<VisionOSRow[]>(`/vision/os?q=${encodeURIComponent(busca)}&limit=30`);
      setOslist(rows);
    } catch { /* */ }
  }

  useEffect(() => {
    if (tab === 'busca') carregarBusca();
  }, [tab]);

  const total = totalOS(data);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      background: '#080a0f',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', background: '#0a0c12',
        borderBottom: '1px solid #1a1f2e',
        padding: '0 16px', overflowX: 'auto',
      }}>
        <TabBtn active={tab === 'cliente'} label="Cliente" onClick={() => setTab('cliente')} />
        <TabBtn active={tab === 'receita'} label="Receita" onClick={() => setTab('receita')} />
        <TabBtn active={tab === 'laboratorio'} label="Laboratório" onClick={() => setTab('laboratorio')} />
        <TabBtn active={tab === 'fechamento'} label="Fechamento" onClick={() => setTab('fechamento')} />
        <TabBtn active={tab === 'busca'} label="Busca" onClick={() => setTab('busca')} />
      </div>

      {/* Conteúdo */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '28px 32px',
      }}>

        {/* CLIENTE */}
        {tab === 'cliente' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Dados do Cliente</h3>
            <Field label="Nome" value={data.cliente_nome} onChange={set('cliente_nome')} placeholder="Nome completo" />
            <div style={{ display: 'flex', gap: 16 }}>
              <Field label="CPF" value={data.cliente_cpf} onChange={set('cliente_cpf')} placeholder="000.000.000-00" width="50%" />
              <Field label="Telefone" value={data.cliente_tel} onChange={set('cliente_tel')} placeholder="(00) 00000-0000" width="50%" />
            </div>
          </div>
        )}

        {/* RECEITA */}
        {tab === 'receita' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Receita Óptica</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: '8px 0' }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    {['ESF', 'CIL', 'EIXO', 'ADIÇÃO', 'DNP', 'ALT'].map(h => (
                      <th key={h} style={{
                        fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
                        textTransform: 'uppercase', textAlign: 'center', paddingBottom: 8,
                        fontWeight: 600, letterSpacing: '0.06em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { olho: 'OD', fields: ['od_esf', 'od_cil', 'od_eixo', 'od_adicao', 'od_dnp', 'od_alt'] as (keyof OSData)[] },
                    { olho: 'OE', fields: ['oe_esf', 'oe_cil', 'oe_eixo', 'oe_adicao', 'oe_dnp', 'oe_alt'] as (keyof OSData)[] },
                  ].map(({ olho, fields }) => (
                    <tr key={olho}>
                      <td style={{
                        fontSize: 12, fontWeight: 700, color: '#3b82f6',
                        fontFamily: 'var(--mono)', paddingRight: 8,
                      }}>{olho}</td>
                      {fields.map((f) => (
                        <RxCell key={f} label="" value={data[f]} onChange={set(f)} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Field label="Nome do Médico" value={data.medico_nome} onChange={set('medico_nome')} placeholder="Dr. Nome" width="220px" />
              <Field label="CRM" value={data.medico_crm} onChange={set('medico_crm')} placeholder="00000/UF" width="130px" />
              <Field label="Data da Receita" value={data.data_receita} onChange={set('data_receita')} placeholder="DD/MM/AAAA" width="150px" />
            </div>
          </div>
        )}

        {/* LABORATÓRIO */}
        {tab === 'laboratorio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Dados da Armação</h3>

            {/* Diagrama visual da armação */}
            <div style={{
              background: '#0a0c12', border: '1px solid #1a1f2e',
              borderRadius: 16, padding: 24,
              display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
            }}>
              <svg viewBox="0 0 320 140" width="280" height="120">
                <rect width="320" height="140" fill="transparent" />
                {/* Olho esquerdo */}
                <ellipse cx="95" cy="70" rx="70" ry="45" fill="none" stroke="#3b82f640" strokeWidth="2" />
                {/* Olho direito */}
                <ellipse cx="225" cy="70" rx="70" ry="45" fill="none" stroke="#3b82f640" strokeWidth="2" />
                {/* Ponte */}
                <path d="M165 58 Q160 70 155 58" fill="none" stroke="#3b82f640" strokeWidth="2" />
                {/* Linhas de medida */}
                <line x1="25" y1="70" x2="165" y2="70" stroke="#3b82f620" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="155" y1="70" x2="295" y2="70" stroke="#3b82f620" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="95" y1="25" x2="95" y2="115" stroke="#3b82f620" strokeWidth="1" strokeDasharray="4 3" />
                {/* Labels */}
                <text x="95" y="135" textAnchor="middle" fill="#3d4a5c" fontSize="9" fontFamily="var(--mono)">
                  DNP: {data.arm_dnp || '—'}
                </text>
                <text x="160" y="90" textAnchor="middle" fill="#3d4a5c" fontSize="9" fontFamily="var(--mono)">
                  {data.arm_ponte || '—'}
                </text>
                <text x="15" y="70" fill="#3d4a5c" fontSize="9" fontFamily="var(--mono)">
                  {data.arm_aro || '—'}
                </text>
              </svg>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                <Field label="DNP" value={data.arm_dnp} onChange={set('arm_dnp')} placeholder="62.0" />
                <Field label="Vertical" value={data.arm_vertical} onChange={set('arm_vertical')} placeholder="26.0" />
                <Field label="Ponte" value={data.arm_ponte} onChange={set('arm_ponte')} placeholder="17.0" />
                <Field label="Aro" value={data.arm_aro} onChange={set('arm_aro')} placeholder="50.0" />
                <Field label="Alt. Pupilar" value={data.arm_alt_pupilar} onChange={set('arm_alt_pupilar')} placeholder="22.0" />
              </div>
            </div>
          </div>
        )}

        {/* FECHAMENTO */}
        {tab === 'fechamento' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Fechamento</h3>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Field label="Lente" value={data.lente_desc} onChange={set('lente_desc')} placeholder="Varilux Comfort 1.67 AR" width="100%" />
              <Field label="Valor Lente (R$)" value={data.valor_lente} onChange={set('valor_lente')} placeholder="0,00" width="160px" />
              <Field label="Valor Armação (R$)" value={data.valor_armacao} onChange={set('valor_armacao')} placeholder="0,00" width="180px" />
              <Field label="Desconto (R$)" value={data.desconto} onChange={set('desconto')} placeholder="0,00" width="140px" />
            </div>

            {/* Total */}
            <div style={{
              background: '#0a0c12', border: '1px solid #1a1f2e',
              borderRadius: 16, padding: '20px 24px',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 16,
              }}>
                <span style={{ fontSize: 14, color: '#64748b' }}>Total</span>
                <span style={{
                  fontSize: 28, fontWeight: 700,
                  color: '#e8eaf0', fontFamily: 'var(--mono)',
                }}>
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{
                    fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>Pagamento</label>
                  <select
                    value={data.forma_pagamento}
                    onChange={e => set('forma_pagamento')(e.target.value)}
                    style={{
                      background: '#0f1218', border: '1px solid #1a1f2e',
                      borderRadius: 8, padding: '8px 12px', fontSize: 13,
                      color: '#e8eaf0', fontFamily: 'var(--sans)', outline: 'none',
                    }}
                  >
                    {['Cartão', 'Dinheiro', 'PIX', 'Boleto', 'Cheque'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{
                    fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>Parcelas</label>
                  <select
                    value={data.parcelas}
                    onChange={e => set('parcelas')(e.target.value)}
                    style={{
                      background: '#0f1218', border: '1px solid #1a1f2e',
                      borderRadius: 8, padding: '8px 12px', fontSize: 13,
                      color: '#e8eaf0', fontFamily: 'var(--sans)', outline: 'none',
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(p => (
                      <option key={p} value={String(p)}>{p}x {p > 1 ? `de ${(total / p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => salvar('orcamento')}
                disabled={saving}
                style={{
                  padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                  background: '#1a1f2e', border: '1px solid #2a2f3e',
                  color: '#e8eaf0', fontSize: 14, fontWeight: 600,
                  fontFamily: 'var(--sans)', opacity: saving ? 0.6 : 1,
                }}
              >
                Salvar Orçamento
              </button>
              <button
                onClick={() => salvar('venda')}
                disabled={saving}
                style={{
                  padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                  background: '#3b82f6', border: 'none',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  fontFamily: 'var(--sans)', opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Enviar Pedido'}
              </button>
              {saved && (
                <div style={{
                  padding: '12px 20px', borderRadius: 12,
                  background: '#22c55e18', border: '1px solid #22c55e40',
                  color: '#22c55e', fontSize: 14, fontFamily: 'var(--sans)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  ✓ Salvo com sucesso
                </div>
              )}
            </div>
          </div>
        )}

        {/* BUSCA */}
        {tab === 'busca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Buscar OS</h3>
            <div style={{ display: 'flex', gap: 12, maxWidth: 500 }}>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && carregarBusca()}
                placeholder="Número, nome ou CPF..."
                style={{
                  flex: 1, background: '#0a0c12', border: '1px solid #1a1f2e',
                  borderRadius: 10, padding: '10px 16px',
                  fontSize: 14, color: '#e8eaf0', fontFamily: 'var(--sans)', outline: 'none',
                }}
              />
              <button
                onClick={carregarBusca}
                style={{
                  padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                  background: '#3b82f6', border: 'none',
                  color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--sans)',
                }}
              >
                Buscar
              </button>
            </div>

            {oslist.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {oslist.map(os => (
                  <div
                    key={os.id}
                    style={{
                      background: '#0a0c12', border: '1px solid #1a1f2e',
                      borderRadius: 12, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#3b82f6',
                        fontFamily: 'var(--mono)',
                      }}>#{os.numero}</span>
                      <span style={{ fontSize: 14, color: '#e8eaf0' }}>
                        {os.cliente_nome ?? 'Cliente não informado'}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: os.tipo === 'venda' ? '#22c55e18' : '#1a1f2e',
                        color: os.tipo === 'venda' ? '#22c55e' : '#64748b',
                        fontFamily: 'var(--mono)',
                      }}>
                        {os.tipo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700, color: '#e8eaf0',
                        fontFamily: 'var(--mono)',
                      }}>
                        {os.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span style={{ fontSize: 11, color: '#3d4a5c', fontFamily: 'var(--mono)' }}>
                        {new Date(os.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                color: '#3d4a5c', fontSize: 14, fontFamily: 'var(--sans)',
              }}>
                {busca ? 'Nenhuma OS encontrada.' : 'Digite para buscar ordens de serviço.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
