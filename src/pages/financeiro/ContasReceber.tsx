import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Cliente } from '../../types';

interface ContaReceber { id: string; descricao: string; cliente_id?: string; cliente_nome?: string; categoria?: string; valor: number; data_vencimento: string; data_recebimento?: string; situacao: string; forma_recebimento?: string; observacao?: string; }
interface Conta { id: string; nome: string; }

const SIT_COLOR: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  vencido:   { bg: 'rgba(0,136,0,0.12)', color: '#dc2626' },
  recebido:  { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  cancelado: { bg: 'var(--surface-alt)', color: 'var(--text-muted)' },
};
const SIT_LABEL: Record<string, string> = { pendente: 'Pendente', vencido: 'Vencido', recebido: 'Recebido', cancelado: 'Cancelado' };
const FORMAS = ['Dinheiro','Pix','Crédito','Débito','Transferência','Boleto','Outro'];
const CATEGORIAS = ['Venda','OS','Serviço','Outros'];

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s?: string) { if (!s) return '-'; const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }

function Modal({ conta, onClose, onSaved }: { conta: ContaReceber | null; contas: Conta[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ descricao: '', cliente_id: '', categoria: 'Outros', valor: '', data_vencimento: '', observacao: '' });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<{ clientes: Cliente[] }>('/clientes?page=1').then(r => setClientes(r.clientes)).catch(() => {});
    if (conta) setForm({ descricao: conta.descricao, cliente_id: conta.cliente_id || '', categoria: conta.categoria || 'Outros', valor: String(conta.valor), data_vencimento: conta.data_vencimento, observacao: conta.observacao || '' });
    else setForm({ descricao: '', cliente_id: '', categoria: 'Outros', valor: '', data_vencimento: '', observacao: '' });
  }, [conta]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErro('');
    try {
      if (conta) await api.put(`/financeiro/contas-receber/${conta.id}`, form);
      else await api.post('/financeiro/contas-receber', form);
      onSaved();
    } catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{conta ? 'Editar' : 'Nova Conta a Receber'}</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Descrição *</label><input style={inp} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Cliente</label>
              <select style={inp} value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">Nenhum</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Categoria</label>
              <select style={inp} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={lbl}>Valor (R$) *</label><input type="number" step="0.01" min="0" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
            <div><label style={lbl}>Vencimento *</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: '14px' }}><label style={lbl}>Observação</label><textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} /></div>
          {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contas a Receber integrado: carnês + saldo das vendas + lançamentos manuais ──
export interface Titulo {
  origem: 'carne' | 'venda' | 'manual'; id: string;
  cliente_id: string | null; cliente_nome: string | null; apelido: string | null; cpf: string | null;
  celular: string | null; telefone: string | null; endereco: string | null; bairro: string | null; cidade: string | null; uf: string | null; referencia: string | null;
  venda_id: string | null; venda_numero: number | null; carne_id: string | null;
  descricao: string; parcela: string | null; vencimento: string; valor: number;
  situacao: 'pendente' | 'vencido' | 'recebido'; recebido_em: string | null; dias_atraso: number;
}
interface RespTit { titulos: Titulo[]; resumo: { pendente: number; vencido: number; recebido: number; qtd: number; clientes_em_atraso: number } }

const ORIGEM: Record<string, { label: string; cor: string }> = {
  carne: { label: 'Carnê', cor: '#7c3aed' },
  venda: { label: 'Saldo venda', cor: '#2563eb' },
  manual: { label: 'Manual', cor: '#64748b' },
};

export function BaixaModal({ t, contas, onClose, onSaved }: { t: Titulo; contas: Conta[]; onClose: () => void; onSaved: () => void }) {
  const hoje = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ data: hoje, forma: 'Pix', conta_id: contas[0]?.id || '', valor: String(t.valor) });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const parcial = t.origem === 'venda';
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await api.post('/financeiro/receber/baixar', { origem: t.origem, id: t.id, valor: form.valor, forma: form.forma, data: form.data, conta_id: form.conta_id || null });
      onSaved();
    } catch (err) { setErro(err instanceof Error ? err.message : 'Erro'); setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '420px' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: '0 0 3px', fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>Registrar recebimento</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            {t.cliente_nome || '-'} · {t.descricao}{t.parcela ? ` ${t.parcela}` : ''} · <b style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{brl(t.valor)}</b>
          </p>
        </div>
        <form onSubmit={salvar} style={{ padding: '18px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>{parcial ? 'Valor recebido (pode ser parcial)' : 'Valor'}</label>
              <input type="number" step="0.01" min="0" disabled={!parcial} style={{ ...inp, fontFamily: 'var(--mono)', opacity: parcial ? 1 : 0.7 }} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
            <div><label style={lbl}>Data</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Forma</label>
              <select style={inp} value={form.forma} onChange={e => setForm(f => ({ ...f, forma: e.target.value }))}>{FORMAS.map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            <div><label style={lbl}>Entrou em qual conta</label>
              <select style={inp} value={form.conta_id} onChange={e => setForm(f => ({ ...f, conta_id: e.target.value }))}>
                <option value="">Nenhuma</option>{contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          {erro && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--red)' }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: 14, background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: 14, fontWeight: 600, background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? '...' : 'Confirmar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function filtrosParaQuery(f: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
  return p.toString();
}

export default function ContasReceber() {
  const navigate = useNavigate();
  const [f, setF] = useState({ situacao: 'aberto', inicio: '', fim: '', q: '', bairro: '', cidade: '', endereco: '', origem: '' });
  const [aplicado, setAplicado] = useState(f);
  const [data, setData] = useState<RespTit | null>(null);
  const [contasFin, setContasFin] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [baixa, setBaixa] = useState<Titulo | null>(null);
  const [mais, setMais] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.get<RespTit>(`/financeiro/receber?${filtrosParaQuery(aplicado)}`)); }
    catch { setData(null); }
    finally { setLoading(false); }
  }, [aplicado]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<Conta[]>('/financeiro/contas').then(setContasFin).catch(() => {}); }, []);

  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }));
  const aplicar = (patch?: Partial<typeof f>) => { const n = { ...f, ...(patch || {}) }; setF(n); setAplicado(n); };

  async function desfazer(t: Titulo) {
    if (!confirm('Desfazer este recebimento?')) return;
    await api.post('/financeiro/receber/baixar', { origem: t.origem, id: t.id, desfazer: true });
    load();
  }
  async function excluirManual(t: Titulo) {
    if (!confirm('Excluir este lançamento manual?')) return;
    await api.delete(`/financeiro/contas-receber/${t.id}`);
    load();
  }
  function imprimirCobranca() {
    window.open(`/financeiro/cobranca/imprimir?${filtrosParaQuery(aplicado)}`, '_blank');
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' };
  const chip = (on: boolean): React.CSSProperties => ({ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '6px', cursor: 'pointer', background: on ? 'var(--primary)' : 'var(--surface)', color: on ? 'white' : 'var(--text-dim)' });
  const r = data?.resumo;

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Contas a Receber</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Carnês, saldo das vendas e lançamentos manuais, tudo junto</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={imprimirCobranca} style={{ padding: '9px 16px', fontSize: 14, fontWeight: 600, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: 8, cursor: 'pointer' }}>Relatório do cobrador</button>
          <button onClick={() => setModalOpen(true)} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Lançamento manual</button>
        </div>
      </div>

      {r && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 18 }}>
          {[
            { l: 'Em atraso', v: brl(r.vencido), c: '#dc2626', s: `${r.clientes_em_atraso} cliente${r.clientes_em_atraso === 1 ? '' : 's'}`, on: () => aplicar({ situacao: 'vencido' }) },
            { l: 'A vencer', v: brl(r.pendente), c: '#d97706', s: 'pendente', on: () => aplicar({ situacao: 'pendente' }) },
            { l: 'Recebido', v: brl(r.recebido), c: '#16a34a', s: aplicado.situacao === 'recebido' || aplicado.situacao === 'todos' ? 'no filtro' : 'veja em "Recebidos"', on: () => aplicar({ situacao: 'recebido' }) },
          ].map(k => (
            <div key={k.l} onClick={k.on} style={{ cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{k.s}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <form onSubmit={e => { e.preventDefault(); aplicar(); }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['aberto', 'Em aberto'], ['vencido', 'Atrasados'], ['pendente', 'A vencer'], ['recebido', 'Recebidos'], ['todos', 'Todos']].map(([v, l]) => (
            <button type="button" key={v} style={chip(aplicado.situacao === v)} onClick={() => aplicar({ situacao: v })}>{l}</button>
          ))}
          <span style={{ width: 10 }} />
          {[['', 'Todas origens'], ['carne', 'Carnês'], ['venda', 'Saldo de vendas'], ['manual', 'Manuais']].map(([v, l]) => (
            <button type="button" key={v || 'all'} style={chip(aplicado.origem === v)} onClick={() => aplicar({ origem: v })}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div><label style={lbl}>Cliente, CPF ou nº da venda</label><input style={inp} value={f.q} onChange={e => set('q', e.target.value)} placeholder="Buscar..." /></div>
          <div><label style={lbl}>Vencimento de</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.inicio} onChange={e => set('inicio', e.target.value)} /></div>
          <div><label style={lbl}>até</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.fim} onChange={e => set('fim', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setMais(m => !m)} style={{ padding: '8px 12px', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-light)', fontWeight: 600, borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>{mais ? '− Endereço' : '+ Endereço'}</button>
            <button type="submit" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Buscar</button>
          </div>
        </div>
        {mais && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10, marginTop: 10 }}>
            <div><label style={lbl}>Bairro</label><input style={inp} value={f.bairro} onChange={e => set('bairro', e.target.value)} /></div>
            <div><label style={lbl}>Cidade</label><input style={inp} value={f.cidade} onChange={e => set('cidade', e.target.value)} /></div>
            <div><label style={lbl}>Endereço (rua)</label><input style={inp} value={f.endereco} onChange={e => set('endereco', e.target.value)} /></div>
          </div>
        )}
      </form>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Cliente', 'Referente', 'Vencimento', 'Valor', 'Situação', ''].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: h === 'Valor' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</td></tr>
            ) : !data?.titulos.length ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nada encontrado com esses filtros.</td></tr>
            ) : data.titulos.map(t => {
              const sc = SIT_COLOR[t.situacao] || SIT_COLOR.pendente;
              const og = ORIGEM[t.origem];
              return (
                <tr key={t.origem + t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    {t.cliente_id
                      ? <button onClick={() => navigate(`/clientes/${t.cliente_id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--primary)', textAlign: 'left' }}>{t.cliente_nome}</button>
                      : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>-</span>}
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{[t.bairro, t.cidade].filter(Boolean).join(' · ')}{t.celular ? ` · ${t.celular}` : ''}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-dim)' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: og.cor + '1f', color: og.cor, marginRight: 6 }}>{og.label}</span>
                    {t.venda_numero ? <b style={{ fontFamily: 'var(--mono)' }}>#{t.venda_numero}</b> : t.descricao}
                    {t.parcela && <span style={{ fontFamily: 'var(--mono)', marginLeft: 6 }}>parc. {t.parcela}</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: t.situacao === 'vencido' ? '#dc2626' : 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {fmtDate(t.vencimento)}
                    {t.dias_atraso > 0 && <div style={{ fontSize: 11 }}>{t.dias_atraso} dia{t.dias_atraso > 1 ? 's' : ''} de atraso</div>}
                    {t.recebido_em && <div style={{ fontSize: 11, color: '#16a34a' }}>Recebido {fmtDate(t.recebido_em)}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{brl(t.valor)}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.color }}>{t.situacao === 'vencido' ? 'Em atraso' : SIT_LABEL[t.situacao]}</span></td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {t.situacao !== 'recebido'
                      ? <button onClick={() => setBaixa(t)} style={{ padding: '5px 12px', fontSize: 12, background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Receber</button>
                      : t.origem !== 'venda' && <button onClick={() => desfazer(t)} style={{ padding: '5px 10px', fontSize: 12, background: 'var(--surface-alt)', color: 'var(--text-dim)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Desfazer</button>}
                    {t.origem === 'carne' && t.carne_id && <a href={`/carnes/${t.carne_id}/imprimir`} target="_blank" rel="noreferrer" style={{ marginLeft: 6, padding: '5px 10px', fontSize: 12, background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 6, textDecoration: 'none' }}>Carnê</a>}
                    {t.origem === 'manual' && <button onClick={() => excluirManual(t)} style={{ marginLeft: 6, padding: '5px 10px', fontSize: 12, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Excluir</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data && data.titulos.length >= 3000 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mostrando os primeiros 3000. Use os filtros para refinar.</p>}

      {modalOpen && <Modal conta={null} contas={contasFin} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
      {baixa && <BaixaModal t={baixa} contas={contasFin} onClose={() => setBaixa(null)} onSaved={() => { setBaixa(null); load(); }} />}
    </div>
  );
}
