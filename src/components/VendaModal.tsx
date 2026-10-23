import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Cliente } from '../types';
import ClienteModal from './ClienteModal';
import Icone from './Icone';
import { ORIGENS } from '../lib/origens';
import ArmacaoEstoque, { type Escolhido } from './ArmacaoEstoque';
import OSNaVenda, { OS_VAZIA, type OSForm } from './OSNaVenda';

interface Venda {
  id: string;
  numero: number;
  cliente_id?: string;
  os_id?: string;
  situacao: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  valor_entrada?: number;
  saldo_restante?: number;
  forma_pagamento?: string;
  observacao?: string;
}

interface Props {
  venda: Venda | null;
  onClose: () => void;
  onSaved: () => void;
  clienteInicial?: { id: string; nome: string }; // nova venda já com o cliente (perfil do cliente)
}

function NovoVendedorInline({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'vendedor', senha: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      const res = await api.post<{ id: string }>('/usuarios', form);
      onSaved(res.id);
    } catch (err: any) { setErro(err.message || 'Erro'); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Cadastrar Vendedor</h3>
          <button onClick={onClose} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: '10px' }}><label style={lbl}>Nome *</label><input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" autoFocus /></div>
          <div style={{ marginBottom: '10px' }}><label style={lbl}>E-mail *</label><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div><label style={lbl}>Perfil</label>
              <select style={inp} value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                <option value="vendedor">Vendedor</option><option value="marketing">Marketing</option><option value="caixa">Caixa</option><option value="admin">Admin</option>
              </select>
            </div>
            <div><label style={lbl}>Senha *</label><input type="password" style={inp} value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mín. 6 caracteres" /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            {erro && <span style={{ fontSize: '12px', color: 'var(--red)', flex: 1, alignSelf: 'center' }}>{erro}</span>}
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '7px', cursor: saving ? 'default' : 'pointer' }}>{saving ? 'Criando...' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FORMAS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'outro', label: 'Outro' },
];

// prazo padrão de entrega do óculos (Funil: Em andamento até essa data, depois Óculos Pronto)
const PRAZO_PADRAO_DIAS = 7;
function prazoPadrao() { const d = new Date(); d.setDate(d.getDate() + PRAZO_PADRAO_DIAS); return d.toISOString().split('T')[0]; }

const EMPTY = {
  cliente_id: '', os_id: '', situacao: 'ativa',
  valor_total: '', desconto: '', valor_entrada: '', forma_pagamento: 'pix', observacao: '',
  prazo_entrega: '',
  origem: '',
};

interface UsuarioSimples { id: string; nome: string; perfil: string; }
interface ProdutoSimples { id: string; codigo?: string; descricao: string; grupo?: string; preco_venda?: number; }
interface ItemVenda { produto_id: string | null; descricao: string; quantidade: number; valor_unitario: number; desconto: number; }
interface PagLinha { forma: string; valor: string; bandeira: string; parcelas: string; data_recebimento: string; conta: string; }
interface PagApi { forma: string; valor: number; bandeira?: string | null; parcelas?: number | null; data_recebimento?: string | null; conta?: string | null; }
interface AdicionalVenda { cliente_id: string; cliente_nome: string; valor_total: string; desconto: string; }

function brlFmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

// Linha de "pessoa adicional" na mesma venda: cada uma tem seu próprio cliente/valor
function PessoaAdicionalRow({ index, value, onChange, onRemove }: {
  index: number;
  value: AdicionalVenda;
  onChange: (v: AdicionalVenda) => void;
  onRemove: () => void;
}) {
  const [busca, setBusca] = useState(value.cliente_nome || '');
  const [lista, setLista] = useState<Cliente[]>([]);
  const [aberto, setAberto] = useState(false);

  async function buscar(q: string) {
    setBusca(q); setAberto(true);
    try {
      const params = new URLSearchParams({ page: '1' });
      if (q) params.set('busca', q);
      const res = await api.get<{ clientes: Cliente[] }>(`/clientes?${params}`);
      setLista(res.clientes.slice(0, 6));
    } catch { setLista([]); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const cell: React.CSSProperties = { ...inp, fontFamily: 'var(--mono)', textAlign: 'right', fontSize: '12px', padding: '6px 8px' };
  const finalRow = Math.max(0, (parseFloat(value.valor_total) || 0) - (parseFloat(value.desconto) || 0));

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', background: 'var(--surface-alt)', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)' }}>Pessoa {index + 2}</span>
        <button type="button" onClick={onRemove} title="Remover" style={{ width: '24px', height: '24px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--red)', cursor: 'pointer', fontWeight: '700' }}>×</button>
      </div>

      {value.cliente_id ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '7px', padding: '7px 10px', marginBottom: '7px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>{value.cliente_nome}</span>
          <button type="button" onClick={() => { onChange({ ...value, cliente_id: '', cliente_nome: '' }); setBusca(''); setAberto(false); }} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>trocar</button>
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: '7px' }}>
          <input style={inp} placeholder="Buscar cliente (opcional)..." value={busca}
            onChange={e => buscar(e.target.value)} onFocus={() => { if (!lista.length) buscar(''); setAberto(true); }} />
          {aberto && lista.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '4px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px', overflowY: 'auto', background: 'var(--surface)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              {lista.map((c, i) => (
                <div key={c.id} onClick={() => { onChange({ ...value, cliente_id: c.id, cliente_nome: c.nome }); setBusca(c.nome); setAberto(false); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', borderBottom: i < lista.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {c.nome}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px', alignItems: 'end' }}>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Valor (R$)</span>
          <input type="number" step="0.01" min="0" style={cell} value={value.valor_total} placeholder="0,00"
            onChange={e => onChange({ ...value, valor_total: e.target.value })} />
        </div>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Desconto</span>
          <input type="number" step="0.01" min="0" style={cell} value={value.desconto} placeholder="0,00"
            onChange={e => onChange({ ...value, desconto: e.target.value })} />
        </div>
        <div style={{ textAlign: 'right', minWidth: '74px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Final</span>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{brlFmt(finalRow)}</div>
        </div>
      </div>
    </div>
  );
}

export default function VendaModal({ venda, onClose, onSaved, clienteInicial }: Props) {
  const { usuario } = useAuth();
  const isMarketing = usuario?.perfil === 'marketing';
  const isAdmin = usuario?.perfil === 'admin';
  const [form, setForm] = useState({ ...EMPTY, prazo_entrega: prazoPadrao() });
  const [funcionarioId, setFuncionarioId] = useState('');
  const [vendedores, setVendedores] = useState<UsuarioSimples[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoVendedorOpen, setNovoVendedorOpen] = useState(false);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtos, setProdutos] = useState<ProdutoSimples[]>([]);
  const [adicionais, setAdicionais] = useState<AdicionalVenda[]>([]);
  const [carneParcelas, setCarneParcelas] = useState('1');
  const [carnePrimeiroVenc, setCarnePrimeiroVenc] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0];
  });
  // Pagamentos: uma forma só (com dados do cartão) ou várias linhas
  const hojeStr = new Date().toISOString().split('T')[0];
  const [multiPag, setMultiPag] = useState(false);
  const [pags, setPags] = useState<PagLinha[]>([]);
  const [cartao, setCartao] = useState({ bandeira: '', parcelas: '1', conta: '' });
  // Venda + OS na mesma tela: venda nova já vem com a OS marcada
  const [gerarOS, setGerarOS] = useState(!venda && !isMarketing);
  const temAbaOS = !venda && !isMarketing;
  const [abaModal, setAbaModal] = useState<'venda' | 'os'>('venda');
  // ao registrar, confirma se a outra aba já foi preenchida
  const [confirmar, setConfirmar] = useState<null | 'venda' | 'os'>(null);
  const [osForm, setOsForm] = useState<OSForm>(OS_VAZIA);
  const setOs = (k: string, val: string) => setOsForm(f => ({ ...f, [k]: val }));

  useEffect(() => {
    if (!venda && clienteInicial) {
      setForm(f => ({ ...f, cliente_id: clienteInicial.id }));
      setBuscaCliente(clienteInicial.nome);
      loadClientes(clienteInicial.nome);
    } else loadClientes('');
    if (isAdmin) {
      api.get<{ usuarios: UsuarioSimples[] }>('/usuarios').then(r =>
        setVendedores(r.usuarios.filter((u: any) => u.ativo))
      ).catch(() => {});
    }
    if (venda) {
      setForm({
        cliente_id: venda.cliente_id || '',
        os_id: venda.os_id || '',
        situacao: venda.situacao || 'ativa',
        valor_total: venda.valor_total != null ? String(venda.valor_total) : '',
        desconto: venda.desconto != null && venda.desconto > 0 ? String(venda.desconto) : '',
        valor_entrada: venda.valor_entrada != null ? String(venda.valor_entrada) : '',
        forma_pagamento: venda.forma_pagamento || 'pix',
        observacao: venda.observacao || '',
        prazo_entrega: ((venda as unknown as { prazo_entrega?: string }).prazo_entrega || '').slice(0, 10),
        origem: (venda as unknown as { origem?: string }).origem || '',
      });
      api.get<{ itens?: ItemVenda[]; pagamentos?: PagApi[] }>(`/vendas/${venda.id}`).then(r => {
        const ps = r.pagamentos || [];
        if (ps.length > 1) {
          setMultiPag(true);
          setPags(ps.map(pg => ({ forma: pg.forma, valor: String(pg.valor), bandeira: pg.bandeira || '', parcelas: pg.parcelas ? String(pg.parcelas) : '', data_recebimento: pg.data_recebimento || '', conta: pg.conta || '' })));
        } else if (ps.length === 1) {
          setCartao({ bandeira: ps[0].bandeira || '', parcelas: ps[0].parcelas ? String(ps[0].parcelas) : '1', conta: ps[0].conta || '' });
        }
        if (Array.isArray(r.itens) && r.itens.length) {
          setItens(r.itens.map(it => ({
            produto_id: it.produto_id ?? null,
            descricao: it.descricao,
            quantidade: Number(it.quantidade) || 1,
            valor_unitario: Number(it.valor_unitario) || 0,
            desconto: Number(it.desconto) || 0,
          })));
        }
      }).catch(() => {});
    }
  }, [venda, isAdmin]);

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

  async function loadProdutos(q: string) {
    try {
      const res = await api.get<{ produtos: ProdutoSimples[] }>(`/produtos?busca=${encodeURIComponent(q)}`);
      setProdutos(res.produtos.slice(0, 8));
    } catch { setProdutos([]); }
  }

  function addProduto(p: ProdutoSimples) {
    setItens(prev => [...prev, { produto_id: p.id, descricao: p.descricao, quantidade: 1, valor_unitario: p.preco_venda || 0, desconto: 0 }]);
    setBuscaProduto(''); setProdutos([]);
  }
  // armação escolhida do estoque: vira item da venda (baixa) e já vai pra OS
  function addDoEstoque(p: Escolhido) {
    setItens(prev => [...prev, { produto_id: p.produto_id, descricao: p.descricao, quantidade: 1, valor_unitario: p.preco_venda || 0, desconto: 0 }]);
    setOsForm(f => ({ ...f, armacao_desc: f.armacao_desc ? `${f.armacao_desc}, ${p.descricao}` : p.descricao }));
  }
  function addAvulso() {
    setItens(prev => [...prev, { produto_id: null, descricao: '', quantidade: 1, valor_unitario: 0, desconto: 0 }]);
  }
  function updItem(idx: number, field: keyof ItemVenda, value: string) {
    setItens(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (field === 'descricao') return { ...it, descricao: value };
      return { ...it, [field]: parseFloat(value) || 0 };
    }));
  }
  function rmItem(idx: number) { setItens(prev => prev.filter((_, i) => i !== idx)); }

  // Quando há itens, o total e o desconto são calculados a partir deles
  useEffect(() => {
    if (itens.length === 0) return;
    const vt = itens.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0);
    const d = itens.reduce((a, i) => a + i.desconto, 0);
    setForm(f => ({ ...f, valor_total: vt.toFixed(2), desconto: d.toFixed(2) }));
  }, [itens]);

  const valorFinal = (parseFloat(form.valor_total) || 0) - (parseFloat(form.desconto) || 0);
  const valorEntrada = form.valor_entrada !== '' ? parseFloat(form.valor_entrada) || 0 : valorFinal;
  const saldoRestante = Math.max(0, valorFinal - valorEntrada);
  const somaPags = pags.reduce((a, pg) => a + (parseFloat(String(pg.valor).replace(',', '.')) || 0), 0);
  const faltaPags = Math.max(0, Math.round((valorFinal - somaPags) * 100) / 100);
  const ehCartao = (f: string) => f === 'credito' || f === 'debito';

  const totalAdicionais = adicionais.reduce((a, p) => a + Math.max(0, (parseFloat(p.valor_total) || 0) - (parseFloat(p.desconto) || 0)), 0);
  const totalCartao = valorFinal + totalAdicionais;
  const podeAgrupar = !venda && !isMarketing;

  async function handleSubmit(e: React.FormEvent | React.MouseEvent, jaConfirmou = false) {
    e.preventDefault();
    if (temAbaOS && !jaConfirmou) {
      const pergunta = abaModal === 'os' ? 'venda' : (gerarOS ? 'os' : null);
      if (pergunta) { setConfirmar(pergunta); return; }
    }
    if (!isMarketing && (!form.valor_total || parseFloat(form.valor_total) <= 0)) {
      setAbaModal('venda');
      setErro('Informe o valor total da venda');
      return;
    }
    // Monta as linhas de pagamento (uma por forma)
    let pagamentos: Record<string, unknown>[] | undefined;
    if (!isMarketing) {
      if (multiPag) {
        pagamentos = pags.filter(pg => (parseFloat(String(pg.valor).replace(',', '.')) || 0) > 0).map(pg => ({ ...pg }));
        if (somaPags > valorFinal + 0.01) { setErro('Os pagamentos somam mais que o valor final da venda.'); return; }
      } else if (form.forma_pagamento === 'boleto') {
        pagamentos = [{ forma: 'boleto', valor: valorFinal, parcelas: carneParcelas, data_recebimento: carnePrimeiroVenc }];
      } else if (valorEntrada > 0) {
        const card = ehCartao(form.forma_pagamento);
        pagamentos = [{
          forma: form.forma_pagamento, valor: Math.min(valorEntrada, valorFinal),
          bandeira: card ? cartao.bandeira : '', parcelas: form.forma_pagamento === 'credito' ? cartao.parcelas : '',
          conta: card ? cartao.conta : '', data_recebimento: hojeStr,
        }];
      }
    }
    const comOS = gerarOS && !venda && !isMarketing;
    if (comOS && !form.cliente_id) {
      setAbaModal('venda');
      setErro('Selecione o cliente: a ordem de serviço precisa de cliente. Ou desmarque "Gerar ordem de serviço" na aba OS.');
      return;
    }
    const boletos = (pagamentos || []).filter(pg => pg.forma === 'boleto');
    const ehBoleto = boletos.length > 0;
    if (ehBoleto && !form.cliente_id) {
      setErro('Selecione o cliente para gerar o boleto/carnê.');
      return;
    }
    setSaving(true);
    setErro('');
    try {
      const payload = {
        ...(isMarketing ? { ...form, valor_total: '0', desconto: '0', forma_pagamento: 'outro' } : form),
        ...(isAdmin && funcionarioId ? { funcionario_id: funcionarioId } : {}),
        // Boleto: a venda entra como "a receber" (entrada 0) até as parcelas serem pagas
        valor_entrada: (form.forma_pagamento === 'boleto' && form.valor_entrada === '') ? '0' : (form.valor_entrada || ''),
        ...(pagamentos ? { pagamentos } : {}),
        ...(isMarketing ? {} : { itens: itens.filter(it => it.descricao.trim()) }),
        ...(comOS ? { os: osForm } : {}),
        ...(podeAgrupar && adicionais.length
          ? { adicionais: adicionais
              .filter(a => (parseFloat(a.valor_total) || 0) > 0)
              .map(a => ({ cliente_id: a.cliente_id, valor_total: a.valor_total, desconto: a.desconto })) }
          : {}),
      };
      if (venda) {
        await api.put(`/vendas/${venda.id}`, payload);
        onSaved();
      } else {
        const nova = await api.post<{ id: string; numero: number }>('/vendas', payload);
        // Cada linha "Boleto" gera um carnê Pix daquele valor
        if (ehBoleto && form.cliente_id) {
          for (const b of boletos) {
            try {
              const venc = String(b.data_recebimento || '') || carnePrimeiroVenc;
              const carne = await api.post<{ id: string }>('/carnes', {
                cliente_id: form.cliente_id,
                descricao: `Venda #${String(nova.numero).padStart(4, '0')} · boleto`,
                valor_total: parseFloat(String(b.valor)) || 0,
                num_parcelas: parseInt(String(b.parcelas || '1')) || 1,
                primeiro_vencimento: venc,
                forma_pagamento: 'boleto',
                venda_id: nova.id,
              });
              window.open(`/carnes/${carne.id}/imprimir`, '_blank');
            } catch (e: any) {
              alert('Venda salva, mas não consegui gerar o carnê: ' + (e?.message || '') + '\nConfira se a chave Pix está configurada em Configurações.');
            }
          }
        }
        onSaved();
      }
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

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '500',
    color: 'var(--text-muted)', marginBottom: '4px',
  };

  const clienteSelecionado = clientes.find(c => c.id === form.cliente_id);

  async function handleClienteCadastrado() {
    setNovoClienteOpen(false);
    // Recarrega lista e tenta selecionar o mais recente
    const res = await api.get<{ clientes: Cliente[] }>('/clientes?page=1');
    setClientes(res.clientes);
    if (res.clientes.length > 0) {
      // O mais recente está no topo após ordenação por nome: busca pelo created_at mais alto
      const mais_recente = [...res.clientes].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      set('cliente_id', mais_recente.id);
      setBuscaCliente(mais_recente.nome);
    }
  }

  async function recarregarVendedores() {
    const r = await api.get<{ usuarios: UsuarioSimples[] }>('/usuarios');
    const lista = r.usuarios.filter((u: any) => u.ativo);
    setVendedores(lista);
    setNovoVendedorOpen(false);
  }

  return (
    <>
    {novoClienteOpen && (
      <ClienteModal
        cliente={null}
        zIndex={1100}
        onClose={() => setNovoClienteOpen(false)}
        onSaved={handleClienteCadastrado}
      />
    )}
    {novoVendedorOpen && (
      <NovoVendedorInline onClose={() => setNovoVendedorOpen(false)} onSaved={async (id) => { await recarregarVendedores(); setFuncionarioId(id); }} />
    )}
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '12px',
    }} className="modal-fundo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-largo" style={{
        background: 'var(--surface)', borderRadius: '12px',
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
              {venda ? `Venda #${String(venda.numero).padStart(4, '0')}` : 'Nova Venda'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {venda ? 'Editando venda' : 'Registrar nova venda'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', border: 'none', borderRadius: '8px',
            background: 'var(--surface-alt)', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {temAbaOS && (
          <div style={{ display: 'flex', gap: 2, padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
            <button type="button" className={'aba-linha' + (abaModal === 'venda' ? ' on' : '')} onClick={() => setAbaModal('venda')}>
              <Icone nome="vendas" size={15} />Venda
            </button>
            <button type="button" className={'aba-linha' + (abaModal === 'os' ? ' on' : '')} onClick={() => setAbaModal('os')}>
              <Icone nome="os" size={15} />Ordem de serviço
              <span className="aba-n" style={gerarOS ? { color: 'var(--primary)' } : undefined}>{gerarOS ? 'gerar' : 'sem OS'}</span>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="modal-form" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px' }}>
          <div className="modal-cols" style={{ display: abaModal === 'venda' ? undefined : 'none' }}>
          <div>
          {/* Cliente */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Cliente (opcional)</label>
              <button type="button" onClick={() => setNovoClienteOpen(true)} style={{
                fontSize: '12px', fontWeight: '600', color: 'var(--primary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>+ Cadastrar novo</button>
            </div>
            <input
              style={inputStyle}
              placeholder="Buscar cliente..."
              value={buscaCliente}
              onChange={e => { setBuscaCliente(e.target.value); loadClientes(e.target.value); }}
            />
          </div>
          {clientes.length > 0 && (
            <div style={{
              border: '1px solid var(--border)', borderRadius: '8px',
              overflow: 'hidden', marginBottom: '14px', maxHeight: '150px', overflowY: 'auto',
            }}>
              <div
                onClick={() => { set('cliente_id', ''); setBuscaCliente(''); }}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  background: !form.cliente_id ? 'var(--surface-alt)' : 'transparent',
                }}
              >Sem cliente</div>
              {clientes.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => { set('cliente_id', c.id); setBuscaCliente(c.nome); }}
                  style={{
                    padding: '9px 14px', cursor: 'pointer', fontSize: '14px',
                    borderBottom: i < clientes.length - 1 ? '1px solid var(--border)' : 'none',
                    background: form.cliente_id === c.id ? 'var(--primary-dim)' : 'transparent',
                    color: form.cliente_id === c.id ? 'var(--primary)' : 'var(--text)',
                  }}
                  onMouseEnter={e => { if (form.cliente_id !== c.id) e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  onMouseLeave={e => { if (form.cliente_id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {c.nome}
                </div>
              ))}
            </div>
          )}
          {clienteSelecionado && (
            <div style={{
              background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: '8px', padding: '8px 12px', fontSize: '13px', marginBottom: '14px',
            }}>
              <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{clienteSelecionado.nome}</span>
              {(() => { const x = clienteSelecionado as unknown as { situacao_cad?: string; spc?: number }; const avisos = [x.situacao_cad === 'bloqueado' && 'cliente BLOQUEADO para venda a prazo', x.situacao_cad === 'analise' && 'cadastro em análise', x.spc && 'incluído no SPC/Serasa'].filter(Boolean); return avisos.length ? <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: '#dc2626' }}>Atenção: {avisos.join(' · ')}</div> : null; })()}
            </div>
          )}

          {/* Vendedor (só admin vê) */}
          {isAdmin && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Vendedor</label>
                <button type="button" onClick={() => setNovoVendedorOpen(true)} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Cadastrar novo</button>
              </div>
              <select style={inputStyle} value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)}>
                <option value="">Atribuir a mim mesmo</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome} ({v.perfil})</option>
                ))}
              </select>
            </div>
          )}

          {/* Situação */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Situação</label>
            <select style={inputStyle} value={form.situacao} onChange={e => set('situacao', e.target.value)}>
              <option value="ativa">Ativa</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {!isMarketing && (
            <>
              <ArmacaoEstoque onEscolher={addDoEstoque} inputStyle={inputStyle} />

              {/* Produtos / Itens da venda */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Outros produtos e serviços</label>
                <input
                  style={inputStyle}
                  placeholder="Buscar produto do catálogo..."
                  value={buscaProduto}
                  onChange={e => { setBuscaProduto(e.target.value); loadProdutos(e.target.value); }}
                />
                {produtos.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginTop: '6px', maxHeight: '170px', overflowY: 'auto' }}>
                    {produtos.map((p, i) => (
                      <div key={p.id} onClick={() => addProduto(p)} style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                        display: 'flex', justifyContent: 'space-between', gap: '8px',
                        borderBottom: i < produtos.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ color: 'var(--text)' }}>{p.descricao}</span>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {(p.preco_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {itens.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {itens.map((it, idx) => {
                      const sub = it.quantidade * it.valor_unitario - it.desconto;
                      const cell: React.CSSProperties = { ...inputStyle, padding: '5px 7px', fontSize: '12px', fontFamily: 'var(--mono)', textAlign: 'right' };
                      return (
                        <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', background: 'var(--surface-alt)' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                            <input style={{ ...inputStyle, padding: '5px 8px', fontSize: '13px' }} placeholder="Descrição do item"
                              value={it.descricao} onChange={e => updItem(idx, 'descricao', e.target.value)} />
                            <button type="button" onClick={() => rmItem(idx)} title="Remover"
                              style={{ flexShrink: 0, width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--red)', cursor: 'pointer', fontWeight: '700' }}>×</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.3fr auto', gap: '6px', alignItems: 'center' }}>
                            <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Qtd</span>
                              <input type="number" step="1" min="0" style={cell} value={it.quantidade} onChange={e => updItem(idx, 'quantidade', e.target.value)} /></div>
                            <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unit.</span>
                              <input type="number" step="0.01" min="0" style={cell} value={it.valor_unitario} onChange={e => updItem(idx, 'valor_unitario', e.target.value)} /></div>
                            <div><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Desc.</span>
                              <input type="number" step="0.01" min="0" style={cell} value={it.desconto} onChange={e => updItem(idx, 'desconto', e.target.value)} /></div>
                            <div style={{ textAlign: 'right', minWidth: '78px' }}><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Subtotal</span>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{sub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button type="button" onClick={addAvulso} style={{
                  marginTop: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--primary)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}>+ Item avulso</button>
              </div>

            </>
          )}

          <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
            <div>
              <label style={labelStyle}>Origem do cliente</label>
              <select style={inputStyle} value={form.origem} onChange={e => set('origem', e.target.value)}>
                <option value="">Selecionar</option>
                {ORIGENS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prazo de entrega do óculos</label>
              <input type="date" style={{ ...inputStyle, fontFamily: 'var(--mono)' }} value={form.prazo_entrega} onChange={e => set('prazo_entrega', e.target.value)} />
            </div>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)' }}>
            No Funil, o cliente fica em Em andamento até a data de entrega e depois passa para Óculos Pronto.
          </p>

          <div>
            <label style={labelStyle}>Observação</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              placeholder="Notas adicionais..."
            />
          </div>
          </div>

          <div>
          {isMarketing ? (
            <div style={{
              background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.2)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Icone nome="campanhas" size={17} color="#ec4899" />
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#db2777' }}>Venda de Marketing</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Registrada sem valor · apenas para contabilização</p>
              </div>
            </div>
          ) : (
            <>
              {/* Forma de pagamento + Valores */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Forma de Pagamento</label>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={multiPag} onChange={e => {
                      const on = e.target.checked; setMultiPag(on);
                      if (on && pags.length === 0) setPags([{ forma: form.forma_pagamento === 'boleto' ? 'pix' : form.forma_pagamento, valor: '', bandeira: '', parcelas: '', data_recebimento: hojeStr, conta: '' }]);
                    }} />
                    Dividir em várias formas
                  </label>
                </div>
                {!multiPag && (
                  <select style={inputStyle} value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
                    {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                )}
                {!multiPag && ehCartao(form.forma_pagamento) && (
                  <div style={{ display: 'grid', gridTemplateColumns: form.forma_pagamento === 'credito' ? '1fr 90px 1fr' : '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <input style={inputStyle} placeholder="Bandeira (Visa, Master...)" value={cartao.bandeira} onChange={e => setCartao(c => ({ ...c, bandeira: e.target.value }))} />
                    {form.forma_pagamento === 'credito' && (
                      <input type="number" min="1" max="24" style={{ ...inputStyle, textAlign: 'center' }} title="Parcelas" placeholder="Parc." value={cartao.parcelas} onChange={e => setCartao(c => ({ ...c, parcelas: e.target.value }))} />
                    )}
                    <input style={inputStyle} placeholder="Maquininha / conta" value={cartao.conta} onChange={e => setCartao(c => ({ ...c, conta: e.target.value }))} />
                  </div>
                )}
                {multiPag && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>Lance cada forma abaixo do valor final (ex.: entrada no Pix + restante no cartão ou no carnê).</p>}
              </div>

              {/* Boleto → gera carnê Pix ao salvar */}
              {!multiPag && form.forma_pagamento === 'boleto' && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#d97706', marginBottom: '10px' }}>Boleto / Carnê (Pix)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Nº de parcelas</label>
                      <input type="number" min="1" max="48" style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'center' }}
                        value={carneParcelas} onChange={e => setCarneParcelas(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>1º vencimento</label>
                      <input type="date" style={{ ...inputStyle, fontFamily: 'var(--mono)' }}
                        value={carnePrimeiroVenc} onChange={e => setCarnePrimeiroVenc(e.target.value)} />
                    </div>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Ao salvar, o sistema gera o <b>carnê com QR Code Pix</b> deste cliente e abre pra imprimir/enviar. Exige cliente selecionado e a chave Pix configurada.
                  </p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Valor Total (R$) {itens.length > 0 ? '(automático)' : '*'}</label>
                  <input
                    type="number" step="0.01" min="0"
                    readOnly={itens.length > 0}
                    style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'right', ...(itens.length > 0 ? { background: 'var(--surface-alt)', color: 'var(--text-dim)' } : {}) }}
                    value={form.valor_total}
                    onChange={e => set('valor_total', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Desconto (R$) {itens.length > 0 ? '(automático)' : ''}</label>
                  <input
                    type="number" step="0.01" min="0"
                    readOnly={itens.length > 0}
                    style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'right', ...(itens.length > 0 ? { background: 'var(--surface-alt)', color: 'var(--text-dim)' } : {}) }}
                    value={form.desconto}
                    onChange={e => set('desconto', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div style={{
                background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)',
                borderRadius: '10px', padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '14px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dim)' }}>Valor Final</span>
                <span style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--primary)' }}>
                  {valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* Várias formas de pagamento */}
              {multiPag && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', marginBottom: '14px', background: 'var(--surface-alt)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Pagamentos</div>
                  {pags.map((pg, i) => {
                    const upd = (patch: Partial<PagLinha>) => setPags(ps => ps.map((x, j) => j === i ? { ...x, ...patch } : x));
                    const small: React.CSSProperties = { ...inputStyle, padding: '6px 8px', fontSize: '12.5px' };
                    const cap: React.CSSProperties = { fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' };
                    return (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 30px', gap: '6px', marginBottom: '6px' }}>
                          <select style={small} value={pg.forma} onChange={e => upd({ forma: e.target.value })}>
                            {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                          <input type="number" step="0.01" min="0" style={{ ...small, fontFamily: 'var(--mono)', textAlign: 'right' }} placeholder="Valor" value={pg.valor} onChange={e => upd({ valor: e.target.value })} />
                          <button type="button" onClick={() => setPags(ps => ps.filter((_, j) => j !== i))} title="Remover"
                            style={{ border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', color: 'var(--red)', cursor: 'pointer', fontWeight: 700 }}>×</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 1.1fr 1fr', gap: '6px' }}>
                          <div><span style={cap}>Bandeira</span>
                            <input style={small} disabled={!ehCartao(pg.forma)} placeholder={ehCartao(pg.forma) ? 'Visa...' : '-'} value={pg.bandeira} onChange={e => upd({ bandeira: e.target.value })} /></div>
                          <div><span style={cap}>Parcelas</span>
                            <input type="number" min="1" style={{ ...small, textAlign: 'center' }} disabled={!(pg.forma === 'credito' || pg.forma === 'boleto')} value={pg.parcelas} onChange={e => upd({ parcelas: e.target.value })} /></div>
                          <div><span style={cap}>{pg.forma === 'boleto' ? '1º vencimento' : 'Data recebimento'}</span>
                            <input type="date" style={{ ...small, fontFamily: 'var(--mono)' }} value={pg.data_recebimento} onChange={e => upd({ data_recebimento: e.target.value })} /></div>
                          <div><span style={cap}>Maquininha / conta</span>
                            <input style={small} disabled={pg.forma === 'boleto'} placeholder={pg.forma === 'boleto' ? 'carnê Pix' : 'Ex: Stone'} value={pg.conta} onChange={e => upd({ conta: e.target.value })} /></div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setPags(ps => [...ps, { forma: 'credito', valor: '', bandeira: '', parcelas: '1', data_recebimento: hojeStr, conta: '' }])}
                        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Adicionar forma</button>
                      {faltaPags > 0.009 && (
                        <button type="button" onClick={() => setPags(ps => [...ps, { forma: 'credito', valor: faltaPags.toFixed(2), bandeira: '', parcelas: '1', data_recebimento: hojeStr, conta: '' }])}
                          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Completar com o restante</button>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: faltaPags > 0.009 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                      {brlFmt(somaPags)} de {brlFmt(valorFinal)}{faltaPags > 0.009 ? ` · falta ${brlFmt(faltaPags)} (fica a receber)` : ''}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Linha em <b>Boleto</b> gera o carnê Pix daquele valor. O que faltar fica como a receber.</p>
                </div>
              )}

              {/* Entrada parcial */}
              {!multiPag && <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>Valor de Entrada (R$) · deixe em branco para pagamento integral</label>
                <input
                  type="number" step="0.01" min="0"
                  style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}
                  value={form.valor_entrada}
                  onChange={e => set('valor_entrada', e.target.value)}
                  placeholder="Ex: 200,00"
                />
              </div>}

              {/* Badge saldo restante */}
              {!multiPag && saldoRestante > 0 && (
                <div style={{
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: '10px', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '14px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#d97706' }}>Óculos Pendente</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Cliente vai buscar e pagar o restante</div>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--mono)', color: '#d97706' }}>
                    {saldoRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              {/* Outras pessoas na mesma venda (mesmo pagamento) */}
              {podeAgrupar && (
                <div style={{ marginBottom: '14px', paddingTop: '14px', borderTop: '1px dashed var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Outras pessoas na mesma venda</label>
                    <button type="button" onClick={() => setAdicionais(prev => [...prev, { cliente_id: '', cliente_nome: '', valor_total: '', desconto: '' }])}
                      style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Adicionar pessoa</button>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Cada pessoa vira uma venda separada, mas todas pagas no mesmo pagamento acima.
                  </p>

                  {adicionais.map((a, idx) => (
                    <PessoaAdicionalRow
                      key={idx}
                      index={idx}
                      value={a}
                      onChange={v => setAdicionais(prev => prev.map((x, i) => i === idx ? v : x))}
                      onRemove={() => setAdicionais(prev => prev.filter((_, i) => i !== idx))}
                    />
                  ))}

                  {adicionais.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '12px 16px', marginTop: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a' }}>Total no pagamento ({adicionais.length + 1} pessoas)</span>
                      <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--mono)', color: '#16a34a' }}>{brlFmt(totalCartao)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          </div>
          </div>

          {temAbaOS && abaModal === 'os' && (
            <OSNaVenda ativo={gerarOS} onAtivo={setGerarOS} value={osForm} onChange={setOs} inputStyle={inputStyle} labelStyle={labelStyle} />
          )}
          {venda?.os_id && (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
              Esta venda tem ordem de serviço vinculada. A receita fica na aba Ordens de Serviço.
            </div>
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
            {saving ? 'Salvando...' : venda ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
    {confirmar && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={e => e.target === e.currentTarget && setConfirmar(null)}>
        <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Icone nome={confirmar === 'os' ? 'os' : 'vendas'} size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {confirmar === 'os' ? 'Já preencheu a ordem de serviço?' : 'Já preencheu a venda?'}
            </h3>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {confirmar === 'os'
              ? 'Receita, lente, armação e médico ficam na aba Ordem de serviço.'
              : 'Cliente, armação, produtos e pagamento ficam na aba Venda.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" className="btn" onClick={() => { setAbaModal(confirmar); setConfirmar(null); }}>
              Não, abrir {confirmar === 'os' ? 'a OS' : 'a venda'}
            </button>
            <button type="button" className="btn btn-prim" autoFocus onClick={e => { setConfirmar(null); handleSubmit(e, true); }}>
              Sim, registrar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
