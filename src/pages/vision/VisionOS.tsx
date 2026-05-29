import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

type Tab = 'cliente' | 'receita' | 'laboratorio' | 'fechamento' | 'busca';

interface OSData {
  cliente_nome: string; cliente_cpf: string; cliente_rg: string;
  cliente_tel: string; cliente_tel2: string; cliente_email: string;
  cliente_cep: string; cliente_endereco: string; cliente_bairro: string;
  cliente_numero: string; cliente_cidade: string; cliente_uf: string;
  cliente_obs: string; cliente_nascimento: string; cliente_sexo: string;
  cliente_vendedor: string;
  od_esf: string; od_cil: string; od_eixo: string;
  od_adicao: string; od_dnp: string; od_alt: string;
  oe_esf: string; oe_cil: string; oe_eixo: string;
  oe_adicao: string; oe_dnp: string; oe_alt: string;
  medico_nome: string; medico_crm: string; data_receita: string;
  arm_dnp: string; arm_vertical: string; arm_ponte: string;
  arm_aro: string; arm_alt_pupilar: string;
  lente_desc: string; valor_lente: string; valor_armacao: string;
  desconto: string; forma_pagamento: string; parcelas: string; tipo: string;
}

interface VisionOSRow {
  id: string; numero: number; tipo: string;
  cliente_nome: string | null; valor_total: number; status: string; created_at: string;
}

const EMPTY: OSData = {
  cliente_nome: '', cliente_cpf: '', cliente_rg: '',
  cliente_tel: '', cliente_tel2: '', cliente_email: '',
  cliente_cep: '', cliente_endereco: '', cliente_bairro: '',
  cliente_numero: '', cliente_cidade: '', cliente_uf: 'CE',
  cliente_obs: '', cliente_nascimento: '', cliente_sexo: '',
  cliente_vendedor: '',
  od_esf: '', od_cil: '', od_eixo: '', od_adicao: '', od_dnp: '', od_alt: '',
  oe_esf: '', oe_cil: '', oe_eixo: '', oe_adicao: '', oe_dnp: '', oe_alt: '',
  medico_nome: '', medico_crm: '', data_receita: '',
  arm_dnp: '', arm_vertical: '', arm_ponte: '', arm_aro: '', arm_alt_pupilar: '',
  lente_desc: '', valor_lente: '', valor_armacao: '', desconto: '',
  forma_pagamento: 'Cartão', parcelas: '1', tipo: 'orcamento',
};

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

// ─── Estilos base ─────────────────────────────────────────────────────────────
const BG = '#d4d0c8';
const FIELD_BG = '#ffffff';
const BORDER = '#888';
const LABEL: React.CSSProperties = { fontSize: 11, color: '#444', fontStyle: 'italic', fontFamily: 'Arial, sans-serif', display: 'block', marginBottom: 1 };
const INPUT: React.CSSProperties = {
  background: FIELD_BG, border: `1px solid ${BORDER}`,
  padding: '4px 6px', fontSize: 13, fontFamily: 'Arial, sans-serif',
  color: '#000', outline: 'none', width: '100%', boxSizing: 'border-box',
  borderRadius: 0,
};

function F({ label, value, onChange, placeholder = '', type = 'text', style = {} }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <label style={LABEL}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={INPUT} />
    </div>
  );
}

function RxCell({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <td style={{ padding: '2px 3px' }}>
      <div style={{ fontSize: 9, color: '#555', fontStyle: 'italic', fontFamily: 'Arial', marginBottom: 1 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)}
        style={{ ...INPUT, width: 62, textAlign: 'center', fontSize: 13 }} />
    </td>
  );
}

function totalOS(data: OSData) {
  return Math.max(0, (parseFloat(data.valor_lente) || 0) + (parseFloat(data.valor_armacao) || 0) - (parseFloat(data.desconto) || 0));
}

export default function VisionOS() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('cliente');
  const [data, setData] = useState<OSData>({ ...EMPTY });
  const [oslist, setOslist] = useState<VisionOSRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busca, setBusca] = useState('');

  function set(field: keyof OSData) { return (v: string) => setData(p => ({ ...p, [field]: v })); }

  async function salvar(tipo: 'orcamento' | 'venda') {
    setSaving(true);
    try {
      const total = totalOS(data);
      await api.post('/vision/os', {
        ...data, tipo,
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
        valor_total: total, parcelas: parseInt(data.parcelas) || 1,
      });
      setSaved(true); setData({ ...EMPTY });
      setTimeout(() => setSaved(false), 2500);
    } catch { alert('Erro ao salvar OS.'); }
    finally { setSaving(false); }
  }

  async function carregarBusca() {
    try {
      const rows = await api.get<VisionOSRow[]>(`/vision/os?q=${encodeURIComponent(busca)}&limit=30`);
      setOslist(rows);
    } catch { /**/ }
  }

  useEffect(() => { if (tab === 'busca') carregarBusca(); }, [tab]);

  const total = totalOS(data);
  const TABS: [Tab, string][] = [['cliente','CLIENTE'],['receita','RECEITA'],['laboratorio','LABORATÓRIO'],['fechamento','FECHAMENTO'],['busca','BUSCA']];

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: BG, fontFamily: 'Arial, sans-serif', userSelect: 'none' }}>

      {/* Header — resumo do paciente */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: '#b8c8d8', borderBottom: '1px solid #8899aa',
        padding: '3px 10px', flexShrink: 0, fontSize: 12, color: '#000',
      }}>
        {[
          ['Cliente', data.cliente_nome],
          ['Telefone', data.cliente_tel],
          ['Documento', data.cliente_cpf],
          ['RG', data.cliente_rg],
          ['Nascimento', data.cliente_nascimento],
        ].map(([label, val], i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginRight: 28 }}>
            <span style={{ color: '#334', fontWeight: 'bold' }}>{label}:</span>
            <span style={{ color: val ? '#000' : '#889' }}>{val || ''}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: '#3c3c3c', flexShrink: 0,
      }}>
        {/* Título da OS */}
        <div style={{
          padding: '0 18px', display: 'flex', alignItems: 'center',
          background: '#282828', color: '#fff',
          fontSize: 12, fontWeight: 'bold', letterSpacing: '.06em',
          borderRight: '1px solid #555', cursor: 'pointer',
        }} onClick={() => navigate('/vision')}>
          ← ORDEM DE SERVIÇO
        </div>

        {/* Tabs */}
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? BG : '#505050',
            border: 'none', borderRight: '1px solid #555',
            padding: '8px 16px', cursor: 'pointer',
            fontSize: 12, fontWeight: 'bold', letterSpacing: '.05em',
            color: tab === t ? '#000' : '#ccc',
            borderBottom: tab === t ? `1px solid ${BG}` : 'none',
            marginBottom: tab === t ? -1 : 0,
          }}>{label}</button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* CLIENTE */}
        {tab === 'cliente' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 900 }}>
            {/* Linha 1: Cliente radio + Pesquisa + Vendedor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 'bold' }}>Cliente:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontStyle: 'italic', fontSize: 12 }}>
                  <input type="radio" name="paciente" defaultChecked style={{ accentColor: '#1144aa' }} />
                  É o Paciente
                </label>
              </div>
              <button style={{
                background: '#e8e4e0', border: '2px outset #ccc',
                padding: '4px 18px', fontSize: 12, fontWeight: 'bold',
                cursor: 'pointer', letterSpacing: '.04em',
              }}>PESQUISA</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap' }}>Vendedor:</span>
                <input value={data.cliente_vendedor} onChange={e => set('cliente_vendedor')(e.target.value)}
                  style={{ ...INPUT, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 'bold' }}>Data Nascimento:</span>
                <input value={data.cliente_nascimento} onChange={e => set('cliente_nascimento')(e.target.value)}
                  placeholder="DD/MM/AAAA" style={{ ...INPUT, width: 110 }} />
              </div>
            </div>

            {/* Linha 2: CPF + RG + Sexo */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <F label="CPF" value={data.cliente_cpf} onChange={set('cliente_cpf')} placeholder="000.000.000-00" style={{ flex: 2 }} />
              <F label="RG" value={data.cliente_rg} onChange={set('cliente_rg')} placeholder="000.000.000-0" style={{ flex: 2 }} />
              <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 2 }}>
                <span style={{ ...LABEL }}>Sexo:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 27 }}>
                  {['Masc', 'Fem'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" name="sexo" value={s}
                        checked={data.cliente_sexo === s} onChange={() => set('cliente_sexo')(s)}
                        style={{ accentColor: '#1144aa', width: 16, height: 16 }} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha 3: Nome */}
            <F label="Nome" value={data.cliente_nome} onChange={set('cliente_nome')} placeholder="Nome completo" />

            {/* Linha 4: CEP + Endereço */}
            <div style={{ display: 'flex', gap: 10 }}>
              <F label="CEP" value={data.cliente_cep} onChange={set('cliente_cep')} placeholder="00000-000" style={{ flex: '0 0 130px' }} />
              <F label="ENDEREÇO" value={data.cliente_endereco} onChange={set('cliente_endereco')} style={{ flex: 1 }} />
            </div>

            {/* Linha 5: Bairro + Número */}
            <div style={{ display: 'flex', gap: 10 }}>
              <F label="BAIRRO" value={data.cliente_bairro} onChange={set('cliente_bairro')} style={{ flex: 1 }} />
              <F label="Nº" value={data.cliente_numero} onChange={set('cliente_numero')} style={{ flex: '0 0 80px' }} />
            </div>

            {/* Linha 6: Cidade + UF */}
            <div style={{ display: 'flex', gap: 10 }}>
              <F label="CIDADE" value={data.cliente_cidade} onChange={set('cliente_cidade')} style={{ flex: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 80px' }}>
                <label style={LABEL}>UF</label>
                <select value={data.cliente_uf} onChange={e => set('cliente_uf')(e.target.value)}
                  style={{ ...INPUT, padding: '3px 4px' }}>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            {/* Linha 7: Fone 1 + Fone 2 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <F label="FONE 1" value={data.cliente_tel} onChange={set('cliente_tel')} placeholder="(00) 00000-0000" style={{ flex: 1 }} />
              <F label="FONE 2" value={data.cliente_tel2} onChange={set('cliente_tel2')} placeholder="(00) 00000-0000" style={{ flex: 1 }} />
            </div>

            {/* Linha 8: E-mail */}
            <F label="E-mail" value={data.cliente_email} onChange={set('cliente_email')} placeholder="email@exemplo.com" type="email" />

            {/* Linha 9: Observação */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={LABEL}>OBSERVAÇÃO</label>
              <textarea value={data.cliente_obs} onChange={e => set('cliente_obs')(e.target.value)}
                rows={2} style={{ ...INPUT, resize: 'none', fontFamily: 'Arial, sans-serif' }} />
            </div>
          </div>
        )}

        {/* RECEITA */}
        {tab === 'receita' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
            <div style={{
              background: '#c8c4bc', border: '2px inset #888',
              padding: '12px 16px',
            }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: '6px 2px' }}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    {['ESF','CIL','EIXO','ADIÇÃO','DNP','ALT'].map(h => (
                      <th key={h} style={{ fontSize: 10, color: '#333', fontStyle: 'italic', textAlign: 'center', paddingBottom: 4, fontWeight: 'normal' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { olho: 'OD', fields: ['od_esf','od_cil','od_eixo','od_adicao','od_dnp','od_alt'] as (keyof OSData)[] },
                    { olho: 'OE', fields: ['oe_esf','oe_cil','oe_eixo','oe_adicao','oe_dnp','oe_alt'] as (keyof OSData)[] },
                  ].map(({ olho, fields }) => (
                    <tr key={olho}>
                      <td style={{ fontSize: 13, fontWeight: 'bold', color: '#1144aa', fontFamily: 'Arial', paddingRight: 6 }}>{olho}</td>
                      {fields.map(f => <RxCell key={f} label="" value={data[f]} onChange={set(f)} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <F label="Nome do Médico" value={data.medico_nome} onChange={set('medico_nome')} placeholder="Dr. Nome" style={{ flex: '0 0 220px' }} />
              <F label="CRM" value={data.medico_crm} onChange={set('medico_crm')} placeholder="00000/UF" style={{ flex: '0 0 130px' }} />
              <F label="Data da Receita" value={data.data_receita} onChange={set('data_receita')} placeholder="DD/MM/AAAA" style={{ flex: '0 0 140px' }} />
            </div>
          </div>
        )}

        {/* LABORATÓRIO */}
        {tab === 'laboratorio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
            <div style={{ background: '#c8c4bc', border: '2px inset #888', padding: '16px 20px', display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <svg viewBox="0 0 320 140" width="280" height="120">
                <ellipse cx="95" cy="70" rx="70" ry="45" fill="none" stroke="#1144aa" strokeWidth="1.5" strokeOpacity=".5" />
                <ellipse cx="225" cy="70" rx="70" ry="45" fill="none" stroke="#1144aa" strokeWidth="1.5" strokeOpacity=".5" />
                <path d="M165 58 Q160 70 155 58" fill="none" stroke="#1144aa" strokeWidth="1.5" strokeOpacity=".5" />
                <line x1="25" y1="70" x2="165" y2="70" stroke="#1144aa" strokeWidth=".8" strokeDasharray="4 3" strokeOpacity=".4" />
                <line x1="155" y1="70" x2="295" y2="70" stroke="#1144aa" strokeWidth=".8" strokeDasharray="4 3" strokeOpacity=".4" />
                <text x="95" y="130" textAnchor="middle" fill="#333" fontSize="9" fontFamily="Arial">DNP: {data.arm_dnp || '—'}</text>
                <text x="160" y="90" textAnchor="middle" fill="#333" fontSize="9" fontFamily="Arial">{data.arm_ponte || '—'}</text>
              </svg>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
                <F label="DNP" value={data.arm_dnp} onChange={set('arm_dnp')} placeholder="62.0" />
                <F label="Vertical" value={data.arm_vertical} onChange={set('arm_vertical')} placeholder="26.0" />
                <F label="Ponte" value={data.arm_ponte} onChange={set('arm_ponte')} placeholder="17.0" />
                <F label="Aro" value={data.arm_aro} onChange={set('arm_aro')} placeholder="50.0" />
                <F label="Alt. Pupilar" value={data.arm_alt_pupilar} onChange={set('arm_alt_pupilar')} placeholder="22.0" />
              </div>
            </div>
          </div>
        )}

        {/* FECHAMENTO */}
        {tab === 'fechamento' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
            <F label="Lente / Descrição" value={data.lente_desc} onChange={set('lente_desc')} placeholder="Varilux Comfort 1.67 AR" />
            <div style={{ display: 'flex', gap: 10 }}>
              <F label="Valor Lente (R$)" value={data.valor_lente} onChange={set('valor_lente')} placeholder="0,00" style={{ flex: 1 }} />
              <F label="Valor Armação (R$)" value={data.valor_armacao} onChange={set('valor_armacao')} placeholder="0,00" style={{ flex: 1 }} />
              <F label="Desconto (R$)" value={data.desconto} onChange={set('desconto')} placeholder="0,00" style={{ flex: 1 }} />
            </div>

            {/* Total */}
            <div style={{ background: '#c8c4bc', border: '2px inset #888', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={LABEL}>Pagamento</label>
                  <select value={data.forma_pagamento} onChange={e => set('forma_pagamento')(e.target.value)} style={{ ...INPUT, width: 130 }}>
                    {['Cartão','Dinheiro','PIX','Boleto','Cheque'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL}>Parcelas</label>
                  <select value={data.parcelas} onChange={e => set('parcelas')(e.target.value)} style={{ ...INPUT, width: 170 }}>
                    {[1,2,3,4,5,6,8,10,12].map(p => (
                      <option key={p} value={String(p)}>
                        {p}x {p > 1 && total > 0 ? `de ${(total/p).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>TOTAL</div>
                <div style={{ fontSize: 26, fontWeight: 'bold', color: '#000', fontFamily: 'Arial', letterSpacing: '.02em' }}>
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => salvar('orcamento')} disabled={saving} style={{
                padding: '8px 22px', background: '#e8e4e0', border: '2px outset #ccc',
                fontSize: 13, fontWeight: 'bold', cursor: 'pointer', letterSpacing: '.04em',
              }}>ORÇAMENTO</button>
              <button onClick={() => salvar('venda')} disabled={saving} style={{
                padding: '8px 22px', background: '#1144cc', border: '2px outset #3366ee',
                fontSize: 13, fontWeight: 'bold', cursor: 'pointer', color: '#fff', letterSpacing: '.04em',
              }}>{saving ? 'SALVANDO...' : 'ENVIAR PEDIDO'}</button>
              {saved && <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#006600', fontWeight: 'bold' }}>✓ Salvo!</span>}
            </div>
          </div>
        )}

        {/* BUSCA */}
        {tab === 'busca' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, maxWidth: 500 }}>
              <input value={busca} onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && carregarBusca()}
                placeholder="Número, nome ou CPF..."
                style={{ ...INPUT, flex: 1, fontSize: 14 }} />
              <button onClick={carregarBusca} style={{
                padding: '6px 18px', background: '#1144cc', border: '2px outset #3366ee',
                color: '#fff', fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
              }}>BUSCAR</button>
            </div>

            {oslist.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', border: '1px solid #aaa' }}>
                <thead>
                  <tr style={{ background: '#b0b8c8' }}>
                    {['Nº','Cliente','Tipo','Total','Data'].map(h => (
                      <th key={h} style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 'bold', fontSize: 12, borderBottom: '1px solid #888' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {oslist.map((os, i) => (
                    <tr key={os.id} style={{ background: i % 2 === 0 ? '#fff' : '#eeeaE4' }}>
                      <td style={{ padding: '5px 10px', color: '#1144aa', fontWeight: 'bold' }}>#{os.numero}</td>
                      <td style={{ padding: '5px 10px' }}>{os.cliente_nome ?? '—'}</td>
                      <td style={{ padding: '5px 10px' }}>{os.tipo}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>{os.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td style={{ padding: '5px 10px', color: '#555' }}>{new Date(os.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '32px 0', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                {busca ? 'Nenhuma OS encontrada.' : 'Digite para buscar ordens de serviço.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#c0bbb4', borderTop: '2px solid #888',
        padding: '6px 16px', gap: 0, flexShrink: 0,
      }}>
        {[
          { icon: '≡', label: 'Menu', onClick: () => navigate('/vision') },
          { icon: '⊕', label: 'Extras', onClick: () => {} },
          { icon: '📋', label: 'OS', onClick: () => setTab('cliente') },
          { icon: '$', label: 'Valor', onClick: () => setTab('fechamento') },
          { icon: '⌨', label: 'Calculadora', onClick: () => {} },
        ].map(({ icon, label, onClick }) => (
          <button key={label} onClick={onClick} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '4px 20px',
            background: 'none', border: 'none', cursor: 'pointer',
            borderRight: '1px solid #999',
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, color: '#333', fontWeight: 'bold', letterSpacing: '.04em' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
