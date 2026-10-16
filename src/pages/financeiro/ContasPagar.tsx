import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface ContaPagar { id: string; descricao: string; fornecedor?: string; fornecedor_id?: string; categoria?: string; valor: number; data_vencimento: string; data_pagamento?: string; situacao: string; forma_pagamento?: string; observacao?: string; recorrente_id?: string; rec_fixa?: number; rec_ativo?: number; }
interface Conta { id: string; nome: string; tipo: string; }
interface Fornecedor { id: string; nome: string; fantasia?: string; }
interface Recorrente { id: string; descricao: string; fornecedor?: string; fornecedor_id?: string; categoria?: string; valor: number; dia: number; fixa: number; ajuste_fds: string; ativo: number; proximo_vencimento?: string | null; }

const SIT_COLOR: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  vencido:   { bg: 'rgba(220,38,38,0.12)', color: '#dc2626' },
  pago:      { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  cancelado: { bg: 'var(--surface-alt)', color: 'var(--text-muted)' },
};
const SIT_LABEL: Record<string, string> = { pendente: 'Pendente', vencido: 'Vencido', pago: 'Pago', cancelado: 'Cancelado' };
const FORMAS = ['Dinheiro','Pix','Crédito','Débito','Transferência','Boleto','Outro'];
const CATEGORIAS = ['Aluguel','Água','Luz / Energia','Internet / Telefone','Contabilidade','Fornecedor','Funcionários','Impostos','Serviços','Equipamentos','Marketing','Outros'];
// Atalhos de contas fixas: preenchem descrição e categoria e já marcam "repetir todo mês"
const FIXAS = [
  { icon: '🏠', nome: 'Aluguel', cat: 'Aluguel' },
  { icon: '💧', nome: 'Água', cat: 'Água' },
  { icon: '💡', nome: 'Luz', cat: 'Luz / Energia' },
  { icon: '🌐', nome: 'Internet', cat: 'Internet / Telefone' },
  { icon: '📞', nome: 'Telefone', cat: 'Internet / Telefone' },
  { icon: '📑', nome: 'Contabilidade', cat: 'Contabilidade' },
];
const AJUSTES = [
  { v: 'manter', l: 'Manter a data' },
  { v: 'antes', l: 'Antecipar para sexta' },
  { v: 'depois', l: 'Adiar para segunda' },
];

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s?: string | null) { if (!s) return '—'; const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }
function diaSemana(s: string) { const d = new Date(`${s}T12:00:00`); return ['dom','seg','ter','qua','qui','sex','sáb'][d.getDay()]; }

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

function Janela({ titulo, sub, largura = 520, onClose, children }: { titulo: string; sub?: React.ReactNode; largura?: number; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: largura, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{titulo}</h2>
            {sub && <div style={{ marginTop: 3, fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

// Fornecedor: escolhe do cadastro (sugestões) ou digita um avulso
function CampoFornecedor({ nome, fornecedores, onChange }: { nome: string; fornecedores: Fornecedor[]; onChange: (nome: string, id: string) => void }) {
  const doCadastro = fornecedores.find(f => f.nome.toLowerCase() === nome.trim().toLowerCase() || (f.fantasia || '').toLowerCase() === nome.trim().toLowerCase());
  return (
    <div>
      <label style={lbl}>Fornecedor</label>
      <input style={inp} list="lista-fornecedores" value={nome} placeholder="Escolha ou digite"
        onChange={e => {
          const v = e.target.value;
          const f = fornecedores.find(x => x.nome.toLowerCase() === v.trim().toLowerCase() || (x.fantasia || '').toLowerCase() === v.trim().toLowerCase());
          onChange(v, f?.id || '');
        }} />
      <datalist id="lista-fornecedores">
        {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.fantasia && f.fantasia !== f.nome ? f.fantasia : ''}</option>)}
      </datalist>
      {nome.trim() && <div style={{ fontSize: 11, marginTop: 3, color: doCadastro ? '#16a34a' : 'var(--text-muted)' }}>{doCadastro ? '✓ do cadastro de fornecedores' : 'avulso (não está no cadastro)'}</div>}
    </div>
  );
}

function ModalConta({ conta, fornecedores, onClose, onSaved }: { conta: ContaPagar | null; fornecedores: Fornecedor[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    descricao: conta?.descricao || '', fornecedor: conta?.fornecedor || '', fornecedor_id: conta?.fornecedor_id || '',
    categoria: conta?.categoria || '', valor: conta ? String(conta.valor) : '', data_vencimento: conta?.data_vencimento || '',
    data_pagamento: conta?.data_pagamento || '', observacao: conta?.observacao || '',
  });
  const [repetir, setRepetir] = useState(false);
  const [fixa, setFixa] = useState(false);
  const [ajuste, setAjuste] = useState('manter');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fimDeSemana = form.data_vencimento && ['sáb', 'dom'].includes(diaSemana(form.data_vencimento));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErro('');
    try {
      if (conta) await api.put(`/financeiro/contas-pagar/${conta.id}`, form);
      else if (repetir) await api.post('/financeiro/recorrentes', { ...form, fixa, ajuste_fds: ajuste });
      else await api.post('/financeiro/contas-pagar', form);
      onSaved();
    } catch (err) { setErro(err instanceof Error ? err.message : 'Erro'); } finally { setSaving(false); }
  }

  return (
    <Janela titulo={conta ? 'Editar conta' : 'Nova conta a pagar'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {!conta && (
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Contas fixas (atalho)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FIXAS.map(f => (
                <button type="button" key={f.nome} onClick={() => { setForm(x => ({ ...x, descricao: f.nome, categoria: f.cat })); setRepetir(true); setFixa(true); }}
                  style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 8, cursor: 'pointer', border: `1px solid ${form.descricao === f.nome ? 'var(--primary)' : 'var(--border)'}`, background: form.descricao === f.nome ? 'var(--primary-dim)' : 'var(--surface-alt)', color: 'var(--text)' }}>
                  {f.icon} {f.nome}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom: '14px' }}><label style={lbl}>Descrição *</label><input style={inp} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Aluguel loja 1" autoFocus={!!conta} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <CampoFornecedor nome={form.fornecedor} fornecedores={fornecedores} onChange={(n, id) => setForm(f => ({ ...f, fornecedor: n, fornecedor_id: id }))} />
          <div><label style={lbl}>Categoria</label>
            <select style={inp} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
              <option value="">—</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              {form.categoria && !CATEGORIAS.includes(form.categoria) && <option value={form.categoria}>{form.categoria}</option>}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '6px' }}>
          <div><label style={lbl}>Valor (R$) *</label><input type="number" step="0.01" min="0" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" /></div>
          <div><label style={lbl}>{repetir ? '1º vencimento *' : 'Vencimento *'}</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} /></div>
        </div>
        {fimDeSemana && !repetir && <div style={{ fontSize: 12, color: '#d97706', marginBottom: 8 }}>⚠️ Essa data cai num {diaSemana(form.data_vencimento) === 'sáb' ? 'sábado' : 'domingo'}.</div>}
        {conta?.situacao === 'pago' && (
          <div style={{ marginTop: 8, marginBottom: 6, maxWidth: 220 }}><label style={lbl}>Data do pagamento</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} /></div>
        )}

        {!conta && (
          <div style={{ marginTop: 10, marginBottom: 14, background: 'var(--surface-alt)', border: `1px solid ${repetir ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={repetir} onChange={e => { setRepetir(e.target.checked); if (!e.target.checked) setFixa(false); }} />
              🔁 Repetir todo mês (conta recorrente)
            </label>
            {repetir && (
              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Todo mês, <b>5 dias antes do vencimento</b>, a conta entra sozinha em Contas a Pagar e aparece no Painel.
                  {form.data_vencimento && <> Vence todo dia <b>{Number(form.data_vencimento.slice(8, 10))}</b>.</>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'end' }}>
                  <div><label style={lbl}>Se cair no fim de semana</label>
                    <select style={inp} value={ajuste} onChange={e => setAjuste(e.target.value)}>{AJUSTES.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}</select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer', paddingBottom: 9 }}>
                    <input type="checkbox" checked={fixa} onChange={e => setFixa(e.target.checked)} /> Conta fixa
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
        {conta?.recorrente_id && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 12px', lineHeight: 1.5 }}>
            🔁 Esta conta é de uma recorrência. A alteração vale só para este mês. Para mudar os próximos meses, use a aba <b>Recorrentes e fixas</b>.
          </div>
        )}
        <div style={{ marginBottom: '14px', marginTop: 8 }}><label style={lbl}>Observação</label><textarea style={{ ...inp, minHeight: '56px', resize: 'vertical' }} value={form.observacao} onChange={e => set('observacao', e.target.value)} /></div>
        {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Janela>
  );
}

function PagarModal({ conta, contas, onClose, onSaved }: { conta: ContaPagar; contas: Conta[]; onClose: () => void; onSaved: () => void }) {
  const hoje = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ data_pagamento: hoje, forma_pagamento: 'Pix', conta_id: contas[0]?.id || '', valor: String(conta.valor) });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await api.put(`/financeiro/contas-pagar/${conta.id}`, { acao: 'pagar', ...form }); onSaved(); }
    finally { setSaving(false); }
  }

  return (
    <Janela titulo="Registrar pagamento" largura={420} onClose={onClose} sub={<>{conta.descricao} · vence {fmtDate(conta.data_vencimento)}</>}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div><label style={lbl}>Valor pago (R$)</label><input type="number" step="0.01" min="0" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
          <div><label style={lbl}>Data do pagamento</label><input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div><label style={lbl}>Forma</label>
            <select style={inp} value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
              {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Saiu de qual conta</label>
            <select style={inp} value={form.conta_id} onChange={e => setForm(f => ({ ...f, conta_id: e.target.value }))}>
              <option value="">— Nenhuma —</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? '...' : '✓ Confirmar pagamento'}
          </button>
        </div>
      </form>
    </Janela>
  );
}

function ModalRecorrente({ rec, fornecedores, onClose, onSaved }: { rec: Recorrente; fornecedores: Fornecedor[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ descricao: rec.descricao, fornecedor: rec.fornecedor || '', fornecedor_id: rec.fornecedor_id || '', categoria: rec.categoria || '', valor: String(rec.valor), dia: String(rec.dia), ajuste_fds: rec.ajuste_fds, fixa: !!rec.fixa });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try { await api.put(`/financeiro/recorrentes/${rec.id}`, f); onSaved(); }
    catch (err) { setErro(err instanceof Error ? err.message : 'Erro'); setSaving(false); }
  }
  return (
    <Janela titulo="Editar recorrência" sub="Vale para os próximos meses. As contas já lançadas não mudam." onClose={onClose}>
      <form onSubmit={salvar}>
        <div style={{ marginBottom: 14 }}><label style={lbl}>Descrição</label><input style={inp} value={f.descricao} onChange={e => setF(x => ({ ...x, descricao: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <CampoFornecedor nome={f.fornecedor} fornecedores={fornecedores} onChange={(n, id) => setF(x => ({ ...x, fornecedor: n, fornecedor_id: id }))} />
          <div><label style={lbl}>Categoria</label>
            <select style={inp} value={f.categoria} onChange={e => setF(x => ({ ...x, categoria: e.target.value }))}>
              <option value="">—</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 12, marginBottom: 14 }}>
          <div><label style={lbl}>Valor (R$)</label><input type="number" step="0.01" style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.valor} onChange={e => setF(x => ({ ...x, valor: e.target.value }))} /></div>
          <div><label style={lbl}>Dia do vencimento</label><input type="number" min={1} max={31} style={{ ...inp, fontFamily: 'var(--mono)' }} value={f.dia} onChange={e => setF(x => ({ ...x, dia: e.target.value }))} /></div>
          <div><label style={lbl}>Fim de semana</label>
            <select style={inp} value={f.ajuste_fds} onChange={e => setF(x => ({ ...x, ajuste_fds: e.target.value }))}>{AJUSTES.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}</select>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={f.fixa} onChange={e => setF(x => ({ ...x, fixa: e.target.checked }))} /> Conta fixa
        </label>
        {erro && <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--red)' }}>{erro}</p>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Janela>
  );
}

interface Resp { contas: ContaPagar[]; total: number; pages: number; totais: { pendente: number; pago: number }; }

export default function ContasPagar() {
  const [aba, setAba] = useState<'contas' | 'recorrentes'>('contas');
  const [data, setData] = useState<Resp | null>(null);
  const [recs, setRecs] = useState<Recorrente[]>([]);
  const [contasFin, setContasFin] = useState<Conta[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [situacao, setSituacao] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagarModal, setPagarModal] = useState<ContaPagar | null>(null);
  const [editando, setEditando] = useState<ContaPagar | null>(null);
  const [editRec, setEditRec] = useState<Recorrente | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (situacao) params.set('situacao', situacao);
      const res = await api.get<Resp>(`/financeiro/contas-pagar?${params}`);
      setData(res);
      api.get<Recorrente[]>('/financeiro/recorrentes').then(setRecs).catch(() => {});
    } finally { setLoading(false); }
  }, [situacao, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get<Conta[]>('/financeiro/contas').then(setContasFin).catch(() => {});
    api.get<Fornecedor[]>('/fornecedores').then(setFornecedores).catch(() => {});
  }, []);

  async function excluir(id: string) {
    if (!confirm('Excluir esta conta?')) return;
    await api.delete(`/financeiro/contas-pagar/${id}`);
    load();
  }
  async function reabrir(c: ContaPagar) {
    if (!confirm(`Desfazer o pagamento de "${c.descricao}"? Ela volta para pendente.`)) return;
    await api.put(`/financeiro/contas-pagar/${c.id}`, { acao: 'reabrir' });
    load();
  }
  async function pausar(r: Recorrente) {
    await api.put(`/financeiro/recorrentes/${r.id}`, { ativo: !r.ativo });
    load();
  }
  async function encerrar(r: Recorrente) {
    if (!confirm(`Encerrar a recorrência "${r.descricao}"? Não entram mais contas novas. As já lançadas continuam na lista.`)) return;
    await api.delete(`/financeiro/recorrentes/${r.id}`);
    load();
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', fontSize: '12px', fontWeight: '500', border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text-dim)' });
  const abaBtn = (on: boolean): React.CSSProperties => ({ padding: '9px 16px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', borderBottom: `2px solid ${on ? 'var(--primary)' : 'transparent'}`, color: on ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer' });
  const btn = (bg: string, color: string): React.CSSProperties => ({ padding: '5px 10px', fontSize: '12px', marginRight: '6px', background: bg, color, border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer' });
  const fixasAtivas = recs.filter(r => r.ativo);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Contas a Pagar</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>{data?.total ?? '...'} contas · {fixasAtivas.length} recorrente{fixasAtivas.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Nova Conta</button>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button style={abaBtn(aba === 'contas')} onClick={() => setAba('contas')}>Contas</button>
        <button style={abaBtn(aba === 'recorrentes')} onClick={() => setAba('recorrentes')}>🔁 Recorrentes e fixas {recs.length ? `(${recs.length})` : ''}</button>
      </div>

      {aba === 'contas' && (<>
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[{ label: 'Pendente / Vencido', value: brl(data.totais.pendente), color: '#dc2626' }, { label: 'Pago', value: brl(data.totais.pago), color: '#16a34a' }].map((c, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--mono)', color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[['', 'Todas'], ['pendente', 'Pendentes'], ['vencido', 'Vencidas'], ['pago', 'Pagas']].map(([val, label]) => (
            <button key={val} style={filterBtn(situacao === val)} onClick={() => { setSituacao(val); setPage(1); }}>{label}</button>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Descrição', 'Fornecedor', 'Vencimento', 'Valor', 'Situação', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</td></tr>
              ) : !data?.contas.length ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma conta encontrada.</td></tr>
              ) : data.contas.map((c, i) => {
                const sc = SIT_COLOR[c.situacao] || SIT_COLOR.pendente;
                return (
                  <tr key={c.id} style={{ borderBottom: i < data.contas.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
                        {c.descricao}
                        {c.recorrente_id && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'var(--primary-dim)', color: 'var(--primary)' }}>🔁 {c.rec_fixa ? 'Fixa' : 'Recorrente'}</span>}
                      </div>
                      {c.categoria && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.categoria}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-dim)' }}>{c.fornecedor || '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: c.situacao === 'vencido' ? '#dc2626' : 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {fmtDate(c.data_vencimento)} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{diaSemana(c.data_vencimento)}</span>
                      {c.data_pagamento && <div style={{ fontSize: '11px', color: '#16a34a' }}>Pago: {fmtDate(c.data_pagamento)}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{brl(c.valor)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: sc.bg, color: sc.color }}>{SIT_LABEL[c.situacao]}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {c.situacao !== 'pago'
                        ? <button onClick={() => setPagarModal(c)} style={btn('rgba(34,197,94,0.12)', '#16a34a')}>Pagar</button>
                        : <button onClick={() => reabrir(c)} title="Desfazer pagamento" style={btn('var(--surface-alt)', 'var(--text-dim)')}>Desfazer</button>}
                      <button onClick={() => { setEditando(c); setModalOpen(true); }} style={btn('var(--primary-dim)', 'var(--primary)')}>Editar</button>
                      <button onClick={() => excluir(c.id)} style={{ ...btn('var(--red-dim)', 'var(--red)'), marginRight: 0 }}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', fontSize: '14px', background: p === page ? 'var(--primary)' : 'var(--surface)', color: p === page ? 'white' : 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        )}
      </>)}

      {aba === 'recorrentes' && (
        <div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Contas que se repetem todo mês (aluguel, água, luz, internet…). <b>5 dias antes</b> de cada vencimento a conta do mês entra sozinha em Contas a Pagar e aparece no Painel.
            Para criar, clique em <b>+ Nova Conta</b> e marque <b>Repetir todo mês</b>.
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Conta', 'Fornecedor', 'Vence todo dia', 'Valor', 'Próxima', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!recs.length ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma conta recorrente ainda.</td></tr>
                ) : recs.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', opacity: r.ativo ? 1 : 0.55 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{r.descricao} {r.fixa ? <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'var(--primary-dim)', color: 'var(--primary)' }}>Fixa</span> : null} {!r.ativo && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· pausada</span>}</div>
                      {r.categoria && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.categoria}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-dim)' }}>{r.fornecedor || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                      dia {r.dia}
                      {r.ajuste_fds !== 'manter' && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>fim de semana → {r.ajuste_fds === 'antes' ? 'sexta' : 'segunda'}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{brl(r.valor)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{r.proximo_vencimento ? `${fmtDate(r.proximo_vencimento)} ${diaSemana(r.proximo_vencimento)}` : '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setEditRec(r)} style={btn('var(--primary-dim)', 'var(--primary)')}>Editar</button>
                      <button onClick={() => pausar(r)} style={btn('var(--surface-alt)', 'var(--text-dim)')}>{r.ativo ? 'Pausar' : 'Retomar'}</button>
                      <button onClick={() => encerrar(r)} style={{ ...btn('var(--red-dim)', 'var(--red)'), marginRight: 0 }}>Encerrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <ModalConta conta={editando} fornecedores={fornecedores} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
      {pagarModal && <PagarModal conta={pagarModal} contas={contasFin} onClose={() => setPagarModal(null)} onSaved={() => { setPagarModal(null); load(); }} />}
      {editRec && <ModalRecorrente rec={editRec} fornecedores={fornecedores} onClose={() => setEditRec(null)} onSaved={() => { setEditRec(null); load(); }} />}
    </div>
  );
}
