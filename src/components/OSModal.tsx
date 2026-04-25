import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { OrdemServico, Cliente } from '../types';

interface Props {
  os: OrdemServico | null;
  onClose: () => void;
  onSaved: () => void;
}

type Aba = 'cliente' | 'grau' | 'produtos' | 'financeiro';

const TIPOS = [
  { value: 'oculos_grau', label: 'Óculos de Grau' },
  { value: 'oculos_sol', label: 'Óculos de Sol' },
  { value: 'lente_contato', label: 'Lente de Contato' },
  { value: 'conserto', label: 'Conserto' },
  { value: 'outro', label: 'Outro' },
];

const SITUACOES = [
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

const EMPTY = {
  cliente_id: '', tipo: 'oculos_grau', situacao: 'orcamento',
  longe_od_esf: '', longe_od_cil: '', longe_od_eixo: '',
  longe_oe_esf: '', longe_oe_cil: '', longe_oe_eixo: '',
  perto_od_esf: '', perto_od_cil: '', perto_od_eixo: '',
  perto_oe_esf: '', perto_oe_cil: '', perto_oe_eixo: '',
  dp: '', altura: '', adicao: '',
  armacao_desc: '', lente_desc: '',
  valor_total: '', valor_entrada: '',
  data_entrega: '', medico: '', observacao: '',
};

export default function OSModal({ os, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [aba, setAba] = useState<Aba>('cliente');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    loadClientes('');
    if (os) {
      setForm({
        cliente_id: os.cliente_id || '',
        tipo: os.tipo || 'oculos_grau',
        situacao: os.situacao || 'orcamento',
        longe_od_esf: os.longe_od_esf != null ? String(os.longe_od_esf) : '',
        longe_od_cil: os.longe_od_cil != null ? String(os.longe_od_cil) : '',
        longe_od_eixo: os.longe_od_eixo != null ? String(os.longe_od_eixo) : '',
        longe_oe_esf: os.longe_oe_esf != null ? String(os.longe_oe_esf) : '',
        longe_oe_cil: os.longe_oe_cil != null ? String(os.longe_oe_cil) : '',
        longe_oe_eixo: os.longe_oe_eixo != null ? String(os.longe_oe_eixo) : '',
        perto_od_esf: os.perto_od_esf != null ? String(os.perto_od_esf) : '',
        perto_od_cil: os.perto_od_cil != null ? String(os.perto_od_cil) : '',
        perto_od_eixo: os.perto_od_eixo != null ? String(os.perto_od_eixo) : '',
        perto_oe_esf: os.perto_oe_esf != null ? String(os.perto_oe_esf) : '',
        perto_oe_cil: os.perto_oe_cil != null ? String(os.perto_oe_cil) : '',
        perto_oe_eixo: os.perto_oe_eixo != null ? String(os.perto_oe_eixo) : '',
        dp: os.dp != null ? String(os.dp) : '',
        altura: os.altura != null ? String(os.altura) : '',
        adicao: os.adicao != null ? String(os.adicao) : '',
        armacao_desc: os.armacao_desc || '',
        lente_desc: os.lente_desc || '',
        valor_total: os.valor_total != null ? String(os.valor_total) : '',
        valor_entrada: os.valor_entrada != null ? String(os.valor_entrada) : '',
        data_entrega: os.data_entrega ? os.data_entrega.split('T')[0] : '',
        medico: os.medico || '',
        observacao: os.observacao || '',
      });
    }
  }, [os]);

  async function loadClientes(q: string) {
    try {
      const params = new URLSearchParams({ page: '1' });
      if (q) params.set('busca', q);
      const res = await api.get<{ clientes: Cliente[] }>(`/clientes?${params}`);
      setClientes(res.clientes);
    } catch {}
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const valorRestante = (parseFloat(form.valor_total) || 0) - (parseFloat(form.valor_entrada) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) { setErro('Selecione um cliente'); setAba('cliente'); return; }
    setSaving(true);
    setErro('');
    try {
      if (os) {
        await api.put(`/os/${os.id}`, form);
      } else {
        await api.post('/os', form);
      }
      onSaved();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  };

  const monoInput: React.CSSProperties = { ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'center' };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '600',
    color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px',
  };

  const field = (children: React.ReactNode, mb = '14px'): React.CSSProperties => ({ marginBottom: mb });

  const ABAS: { key: Aba; label: string }[] = [
    { key: 'cliente', label: 'Cliente' },
    { key: 'grau', label: 'Receita' },
    { key: 'produtos', label: 'Produtos' },
    { key: 'financeiro', label: 'Financeiro' },
  ];

  const clienteSelecionado = clientes.find(c => c.id === form.cliente_id);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', borderRadius: '16px',
        border: '1px solid var(--border)', width: '100%', maxWidth: '600px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
              {os ? `OS #${String(os.numero).padStart(4, '0')}` : 'Nova OS'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {os ? 'Editando ordem de serviço' : 'Preencha os dados da OS'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', border: 'none', borderRadius: '8px',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0', borderBottom: '1px solid var(--border)' }}>
          {ABAS.map(({ key, label }) => (
            <button key={key} onClick={() => setAba(key)} style={{
              padding: '7px 14px', fontSize: '13px', fontWeight: '500',
              border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
              background: aba === key ? 'var(--primary)' : 'transparent',
              color: aba === key ? 'white' : 'var(--text-dim)',
              marginBottom: '-1px',
              borderBottom: aba === key ? '1px solid var(--primary)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* === ABA CLIENTE === */}
          {aba === 'cliente' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select style={inputStyle} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Situação</label>
                  <select style={inputStyle} value={form.situacao} onChange={e => set('situacao', e.target.value)}>
                    {SITUACOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Buscar Cliente</label>
                <input
                  style={inputStyle}
                  placeholder="Digite o nome do cliente..."
                  value={buscaCliente}
                  onChange={e => { setBuscaCliente(e.target.value); loadClientes(e.target.value); }}
                />
              </div>
              {clientes.length > 0 && (
                <div style={{
                  border: '1px solid var(--border)', borderRadius: '8px',
                  overflow: 'hidden', marginBottom: '14px',
                  maxHeight: '200px', overflowY: 'auto',
                }}>
                  {clientes.map((c, i) => (
                    <div
                      key={c.id}
                      onClick={() => { set('cliente_id', c.id); setBuscaCliente(c.nome); }}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: '14px',
                        borderBottom: i < clientes.length - 1 ? '1px solid var(--border)' : 'none',
                        background: form.cliente_id === c.id ? 'var(--primary-dim)' : 'transparent',
                        color: form.cliente_id === c.id ? 'var(--primary)' : 'var(--text)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={e => { if (form.cliente_id !== c.id) e.currentTarget.style.background = 'var(--surface-alt)'; }}
                      onMouseLeave={e => { if (form.cliente_id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{c.nome}</span>
                      {c.celular && <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{c.celular}</span>}
                    </div>
                  ))}
                </div>
              )}
              {clienteSelecionado && (
                <div style={{
                  background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)',
                  borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                }}>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>✓ {clienteSelecionado.nome}</span>
                  {clienteSelecionado.celular && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginLeft: '8px' }}>{clienteSelecionado.celular}</span>}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                <div>
                  <label style={labelStyle}>Data de Entrega</label>
                  <input type="date" style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.data_entrega} onChange={e => set('data_entrega', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Médico / Clínica</label>
                  <input style={inputStyle} placeholder="Nome do médico" value={form.medico} onChange={e => set('medico', e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: '14px' }}>
                <label style={labelStyle}>Observação</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Notas adicionais..." />
              </div>
            </>
          )}

          {/* === ABA GRAU === */}
          {aba === 'grau' && (
            <>
              {/* Grid de grau */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}></th>
                      {['Esf', 'Cil', 'Eixo'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Longe OD', esf: 'longe_od_esf', cil: 'longe_od_cil', eixo: 'longe_od_eixo' },
                      { label: 'Longe OE', esf: 'longe_oe_esf', cil: 'longe_oe_cil', eixo: 'longe_oe_eixo' },
                      { label: 'Perto OD', esf: 'perto_od_esf', cil: 'perto_od_cil', eixo: 'perto_od_eixo' },
                      { label: 'Perto OE', esf: 'perto_oe_esf', cil: 'perto_oe_cil', eixo: 'perto_oe_eixo' },
                    ].map(row => (
                      <tr key={row.label}>
                        <td style={{ padding: '6px 0', fontSize: '13px', fontWeight: '500', color: 'var(--text-dim)', paddingRight: '8px' }}>{row.label}</td>
                        {[row.esf, row.cil, row.eixo].map(field => (
                          <td key={field} style={{ padding: '4px 4px' }}>
                            <input
                              type="number"
                              step="0.01"
                              style={{ ...monoInput, padding: '7px 6px' }}
                              value={(form as any)[field]}
                              onChange={e => set(field, e.target.value)}
                              placeholder="—"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div>
                  <label style={labelStyle}>DP (mm)</label>
                  <input type="number" step="0.1" style={monoInput} value={form.dp} onChange={e => set('dp', e.target.value)} placeholder="—" />
                </div>
                <div>
                  <label style={labelStyle}>Altura</label>
                  <input type="number" step="0.1" style={monoInput} value={form.altura} onChange={e => set('altura', e.target.value)} placeholder="—" />
                </div>
                <div>
                  <label style={labelStyle}>Adição</label>
                  <input type="number" step="0.25" style={monoInput} value={form.adicao} onChange={e => set('adicao', e.target.value)} placeholder="—" />
                </div>
              </div>
            </>
          )}

          {/* === ABA PRODUTOS === */}
          {aba === 'produtos' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Armação</label>
                <input style={inputStyle} value={form.armacao_desc} onChange={e => set('armacao_desc', e.target.value)} placeholder="Marca, modelo, cor..." />
              </div>
              <div>
                <label style={labelStyle}>Lente</label>
                <input style={inputStyle} value={form.lente_desc} onChange={e => set('lente_desc', e.target.value)} placeholder="Tipo, tratamento, marca..." />
              </div>
            </>
          )}

          {/* === ABA FINANCEIRO === */}
          {aba === 'financeiro' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Valor Total (R$)</label>
                  <input type="number" step="0.01" min="0" style={monoInput} value={form.valor_total} onChange={e => set('valor_total', e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <label style={labelStyle}>Entrada (R$)</label>
                  <input type="number" step="0.01" min="0" style={monoInput} value={form.valor_entrada} onChange={e => set('valor_entrada', e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div style={{
                background: valorRestante > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                border: `1px solid ${valorRestante > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                borderRadius: '10px', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dim)' }}>Restante</span>
                <span style={{
                  fontSize: '20px', fontWeight: '700', fontFamily: 'var(--mono)',
                  color: valorRestante > 0 ? '#dc2626' : '#16a34a',
                }}>
                  {valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          {erro && <span style={{ fontSize: '13px', color: 'var(--red)', flex: 1, display: 'flex', alignItems: 'center' }}>{erro}</span>}
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', fontSize: '14px', fontWeight: '500',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '9px 20px', fontSize: '14px', fontWeight: '600',
            background: saving ? 'var(--primary-dim)' : 'var(--primary)',
            color: saving ? 'var(--primary)' : 'white',
            border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Salvando...' : os ? 'Salvar' : 'Criar OS'}
          </button>
        </div>
      </div>
    </div>
  );
}
