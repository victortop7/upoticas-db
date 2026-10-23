import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Cliente } from '../types';
import VendaModal from '../components/VendaModal';
import OSModal from '../components/OSModal';
import Icone from '../components/Icone';
import { BaixaModal, type Titulo } from './financeiro/ContasReceber';

type ClienteFicha = Cliente & {
  foto?: string | null; referencia?: string | null; loja_id?: string | null; loja_nome?: string | null; created_at?: string;
  codigo?: number | null; pessoa?: string; rg?: string; tel_comercial?: string; numero?: string; complemento?: string;
  mae?: string; pai?: string; conjuge?: string; regiao?: string; localidade?: string;
  spc?: number; sem_cobranca?: number; nao_receber_msg?: number; situacao_cad?: string; cobranca?: string; data_compra?: string;
};
type VendaP = { id: string; numero: number; situacao: string; valor_total: number; desconto: number; valor_final: number; forma_pagamento?: string; valor_entrada: number; saldo_restante: number; created_at: string; vendedor?: string; loja?: string; itens?: string };
type OSP = { id: string; numero: number; tipo: string; situacao: string; valor_total: number; valor_restante: number; data_entrega?: string; armacao_desc?: string; lente_desc?: string; created_at: string };
type Resumo = { total_comprado: number; qtd_vendas: number; ticket_medio: number; em_aberto: number; em_atraso: number; parcelas_atraso: number; atraso_medio_dias: number | null; primeira_compra: string | null; ultima_compra: string | null };
type Perfil = { cliente: ClienteFicha; vendas: VendaP[]; os: OSP[]; titulos: Titulo[]; resumo: Resumo };
type Conta = { id: string; nome: string };
type Opcoes = { regiao: string[]; localidade: string[]; bairro: string[]; cidade: string[] };

const VAZIO = {
  pessoa: 'F', nome: '', apelido: '', data_nascimento: '', cpf: '', rg: '', telefone: '', tel_comercial: '', celular: '',
  spc: false, sem_cobranca: false, nao_receber_msg: false, situacao_cad: 'ativo', cobranca: 'normal', regiao: '', localidade: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: 'CE', observacao: '', email: '',
  mae: '', pai: '', conjuge: '', referencia: '',
};
type Form = typeof VAZIO;

const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtD = (s?: string | null) => { if (!s) return '-'; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const cod = (n?: number | null) => (n ? String(n).padStart(6, '0') : '');
const SIT_OS: Record<string, string> = { orcamento: 'Orçamento', aprovado: 'Aprovado', em_producao: 'Produção', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado', aberta: 'Aberta' };

// "46 anos 3 meses 12 dias"
function idadeCompleta(s?: string) {
  if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return '';
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  const h = new Date();
  let anos = h.getFullYear() - y, meses = h.getMonth() + 1 - m, dias = h.getDate() - d;
  if (dias < 0) { meses--; dias += new Date(h.getFullYear(), h.getMonth(), 0).getDate(); }
  if (meses < 0) { anos--; meses += 12; }
  if (anos < 0 || anos > 130) return '';
  return `${anos} ano${anos === 1 ? '' : 's'} ${meses} ${meses === 1 ? 'mês' : 'meses'} ${dias} dia${dias === 1 ? '' : 's'}`;
}
function haQuanto(s?: string | null) {
  if (!s) return '';
  const dias = Math.floor((Date.now() - new Date(s.slice(0, 10) + 'T12:00:00').getTime()) / 86_400_000);
  if (dias < 1) return 'hoje';
  if (dias < 30) return `há ${dias} dia${dias > 1 ? 's' : ''}`;
  if (dias < 365) { const m = Math.floor(dias / 30); return `há ${m} ${m > 1 ? 'meses' : 'mês'}`; }
  const a = Math.floor(dias / 365); return `há ${a} ano${a > 1 ? 's' : ''}`;
}
function mascaraDoc(v: string, pj: boolean) {
  const d = v.replace(/\D/g, '').slice(0, pj ? 14 : 11);
  if (pj) return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function mascaraFone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}
const mascaraCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

// Foto: reduz para 360px (JPEG) antes de enviar
function reduzirFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const esc = Math.min(1, 360 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

// Rótulo + campo (fora da tela pra não recriar o input a cada letra digitada)
const rot: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px' };
function Campo({ r: rotulo, children }: { r: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '108px minmax(0, 1fr)', alignItems: 'center', gap: 10, minHeight: 34 }}>
      <span style={rot}>{rotulo}</span><div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

function doCliente(c: ClienteFicha): Form {
  return {
    pessoa: c.pessoa === 'J' ? 'J' : 'F', nome: c.nome || '', apelido: c.apelido || '', data_nascimento: (c.data_nascimento || '').slice(0, 10),
    cpf: c.cpf || '', rg: c.rg || '', telefone: c.telefone || '', tel_comercial: c.tel_comercial || '', celular: c.celular || '',
    spc: !!c.spc, sem_cobranca: !!c.sem_cobranca, nao_receber_msg: !!c.nao_receber_msg,
    situacao_cad: c.situacao_cad || 'ativo', cobranca: c.cobranca || 'normal', regiao: c.regiao || '', localidade: c.localidade || '',
    cep: c.cep || '', endereco: c.endereco || '', numero: c.numero || '', complemento: c.complemento || '', bairro: c.bairro || '',
    cidade: c.cidade || '', uf: c.uf || '', observacao: c.observacao || '', email: c.email || '',
    mae: c.mae || '', pai: c.pai || '', conjuge: c.conjuge || '', referencia: c.referencia || '',
  };
}

export default function ClientePerfil() {
  const { id = 'novo' } = useParams();
  const novo = id === 'novo';
  const navigate = useNavigate();
  const [p, setP] = useState<Perfil | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [original, setOriginal] = useState<Form>(VAZIO);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [mapa, setMapa] = useState(false);
  const [opcoes, setOpcoes] = useState<Opcoes>({ regiao: [], localidade: [], bairro: [], cidade: [] });
  const [aba, setAba] = useState<'vendas' | 'crediario' | 'os' | 'receita'>('vendas');
  const [novaVenda, setNovaVenda] = useState(false);
  const [novaOS, setNovaOS] = useState(false);
  const [baixa, setBaixa] = useState<Titulo | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);

  const load = useCallback(() => {
    setErro(''); setAviso('');
    if (novo) { setP(null); setForm(VAZIO); setOriginal(VAZIO); return; }
    api.get<Perfil>(`/clientes/${id}/perfil`).then(r => { setP(r); const f = doCliente(r.cliente); setForm(f); setOriginal(f); })
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro'));
  }, [id, novo]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get<Conta[]>('/financeiro/contas').then(setContas).catch(() => {});
    api.get<Opcoes>('/clientes/opcoes').then(setOpcoes).catch(() => {});
  }, []);

  const alterado = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const sairSePuder = () => !alterado || confirm('Há alterações não salvas. Sair mesmo assim?');

  async function salvar() {
    if (!form.nome.trim()) { setAviso('Informe o nome do cliente.'); return; }
    setSalvando(true); setAviso('');
    try {
      if (novo) {
        const r = await api.post<{ id: string }>('/clientes/ficha', form);
        setOriginal(form);
        navigate(`/clientes/${r.id}`, { replace: true });
      } else {
        await api.put(`/clientes/${id}/ficha`, form);
        setOriginal(form);
        setAviso('Salvo.');
        load();
      }
    } catch (e) { setAviso(e instanceof Error ? e.message.replace(/\s*\(HTTP \d+\)$/, '') : 'Erro ao salvar'); }
    setSalvando(false);
  }
  async function navegar(dir: 'primeiro' | 'anterior' | 'proximo' | 'ultimo') {
    if (!sairSePuder()) return;
    const r = await api.get<{ id: string | null }>(`/clientes/${id}/navegar?dir=${dir}`).catch(() => ({ id: null }));
    if (r.id) navigate(`/clientes/${r.id}`);
  }
  async function buscarCep() {
    const cep = form.cep.replace(/\D/g, '');
    if (cep.length !== 8) { setAviso('CEP precisa ter 8 dígitos.'); return; }
    setBuscandoCep(true); setAviso('');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(x => x.json());
      if (r.erro) setAviso('CEP não encontrado.');
      else setForm(f => ({ ...f, endereco: r.logradouro || f.endereco, bairro: r.bairro || f.bairro, cidade: r.localidade || f.cidade, uf: r.uf || f.uf, complemento: f.complemento || r.complemento || '' }));
    } catch { setAviso('Não foi possível consultar o CEP agora.'); }
    setBuscandoCep(false);
  }
  async function trocarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f || novo) return;
    try { await api.put(`/clientes/${id}/perfil`, { foto: await reduzirFoto(f) }); load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Erro ao enviar a foto'); }
  }
  async function tirarFoto() {
    if (!confirm('Remover a foto?')) return;
    await api.put(`/clientes/${id}/perfil`, { foto: null }); load();
  }

  if (erro) return <div style={{ padding: 32, color: 'var(--red)' }}>{erro}</div>;
  if (!novo && !p) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Carregando…</div>;

  const c = p?.cliente; const r = p?.resumo;
  const titulos = p?.titulos || [];
  const atrasados = titulos.filter(t => t.situacao === 'vencido');
  const abertos = titulos.filter(t => t.situacao !== 'recebido');
  const wa = (form.celular || form.telefone || '').replace(/\D/g, '');
  const enderecoMapa = [form.endereco && `${form.endereco}${form.numero ? ', ' + form.numero : ''}`, form.bairro, form.cidade, form.uf, form.cep].filter(Boolean).join(', ');
  const pj = form.pessoa === 'J';
  const idade = idadeCompleta(form.data_nascimento);

  // ---- estilos
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 };
  const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', fontSize: 13.5, border: '1px solid var(--border)', borderRadius: 5, background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const radio = (nome: keyof Form, valor: string, rotulo: string) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-dim)', cursor: 'pointer', marginRight: 12 }}>
      <input type="radio" checked={form[nome] === valor} onChange={() => set(nome, valor as never)} /> {rotulo}
    </label>
  );
  const check = (nome: 'spc' | 'sem_cobranca' | 'nao_receber_msg', rotulo: string) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <input type="checkbox" checked={form[nome]} onChange={e => set(nome, e.target.checked)} /> {rotulo}
    </label>
  );
  const ferr = (icone: string, titulo: string, onClick: () => void, opts?: { desativado?: boolean; cor?: string; texto?: string }) => (
    <button title={titulo} onClick={onClick} disabled={opts?.desativado}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: opts?.texto ? '0 11px' : '0 8px', background: opts?.cor || 'var(--surface-alt)', color: opts?.cor ? '#fff' : 'var(--text)', border: `1px solid ${opts?.cor || 'var(--border)'}`, borderRadius: 5, cursor: opts?.desativado ? 'default' : 'pointer', opacity: opts?.desativado ? 0.4 : 1, fontSize: 12.5, fontWeight: 600 }}>
      <Icone nome={icone} size={16} />{opts?.texto}
    </button>
  );
  const sep = <span style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />;
  const abaBtn = (k: typeof aba, l: string, n?: number) => (
    <button onClick={() => setAba(k)} style={{ padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: 'none', border: 'none', borderBottom: `2px solid ${aba === k ? 'var(--primary)' : 'transparent'}`, color: aba === k ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer' }}>
      {l}{n !== undefined && <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--surface-alt)', fontFamily: 'var(--mono)' }}>{n}</span>}
    </button>
  );

  // crediário agrupado por carnê / saldo de venda
  const grupos = new Map<string, { titulo: string; itens: Titulo[] }>();
  for (const t of titulos) {
    const k = t.carne_id || `${t.origem}-${t.venda_id || t.id}`;
    const nome = t.origem === 'carne' ? `${t.venda_numero ? `Venda #${t.venda_numero} · ` : ''}${t.descricao.replace(/^Venda #\d+\s*[—·-]\s*/, '') || 'Carnê'}` : t.origem === 'venda' ? `Venda #${t.venda_numero} · saldo em aberto` : t.descricao;
    const g = grupos.get(k) || { titulo: nome, itens: [] };
    g.itens.push(t); grupos.set(k, g);
  }

  const alertas: { cor: string; texto: string }[] = [];
  if (form.spc) alertas.push({ cor: '#dc2626', texto: 'Incluído no SPC/Serasa' });
  if (form.situacao_cad === 'bloqueado') alertas.push({ cor: '#dc2626', texto: 'Cliente BLOQUEADO para venda a prazo' });
  if (form.situacao_cad === 'analise') alertas.push({ cor: '#d97706', texto: 'Cadastro em análise' });
  if (form.sem_cobranca) alertas.push({ cor: '#7c7c8c', texto: 'Jurídico / sem cobrança' });
  if (atrasados.length) alertas.push({ cor: '#dc2626', texto: `${atrasados.length} parcela${atrasados.length > 1 ? 's' : ''} em atraso · ${brl(r?.em_atraso || 0)}` });

  return (
    <div style={{ padding: '20px 26px', maxWidth: 1240 }}>
      {/* Barra do cadastro */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', flexWrap: 'wrap', marginBottom: 10 }}>
        <Icone nome="usuario" size={18} color="var(--text-muted)" />
        <span style={{ ...rot, marginLeft: 2 }}>Cliente</span>
        <b style={{ fontSize: 14, color: 'var(--text)', marginRight: 'auto', fontFamily: 'var(--mono)' }}>
          {novo ? 'NOVO CADASTRO' : `${cod(c?.codigo)}${c?.codigo ? '-' : ''}${(form.nome || c?.nome || '').toUpperCase()}`}
        </b>
        {alterado && <span style={{ fontSize: 11.5, color: '#d97706', marginRight: 4 }}>alterações não salvas</span>}
        {ferr('mais', 'Novo cliente', () => { if (sairSePuder()) navigate('/clientes/novo'); })}
        {ferr('salvar', 'Salvar', salvar, { desativado: salvando || (!alterado && !novo), cor: alterado || novo ? '#16a34a' : undefined, texto: salvando ? 'Salvando' : 'Salvar' })}
        {ferr('desfazer', 'Cancelar alterações', () => { setForm(original); setAviso(''); }, { desativado: !alterado })}
        {sep}
        {ferr('primeiro', 'Primeiro', () => navegar('primeiro'))}
        {ferr('anterior', 'Anterior', () => navegar('anterior'))}
        {ferr('proximo', 'Próximo', () => navegar('proximo'))}
        {ferr('ultimo', 'Último', () => navegar('ultimo'))}
        {sep}
        {ferr('mapa', 'Ver no mapa', () => setMapa(m => !m), { desativado: !enderecoMapa })}
        {ferr('whatsapp', 'WhatsApp', () => window.open(`https://wa.me/55${wa.replace(/^55/, '')}`, '_blank'), { desativado: !wa || form.nao_receber_msg })}
        {!novo && abertos.length > 0 && ferr('imprimir', 'Ficha de cobrança', () => window.open(`/financeiro/cobranca/imprimir?cliente_id=${id}&situacao=aberto`, '_blank'))}
        {sep}
        {ferr('vendas', 'Iniciar venda', () => setNovaVenda(true), { desativado: novo || alterado, cor: '#2563eb', texto: 'Venda' })}
        {ferr('os', 'Abrir O.S.', () => setNovaOS(true), { desativado: novo || alterado, cor: '#0f766e', texto: 'O.S.' })}
        {ferr('fechar', 'Fechar', () => { if (sairSePuder()) navigate('/clientes'); })}
      </div>

      {aviso && <div style={{ marginBottom: 10, fontSize: 13, color: aviso === 'Salvo.' ? 'var(--green)' : 'var(--red)' }}>{aviso}</div>}
      {alertas.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {alertas.map(a => <span key={a.texto} style={{ fontSize: 12.5, fontWeight: 600, color: a.cor, border: `1px solid ${a.cor}`, background: `${a.cor}14`, padding: '4px 10px', borderRadius: 5 }}>{a.texto}</span>)}
        </div>
      )}

      {/* Ficha */}
      <div style={{ ...card, padding: '16px 18px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr) 190px', gap: '6px 28px', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <Campo r="Pessoa">{radio('pessoa', 'F', 'Física')}{radio('pessoa', 'J', 'Jurídica')}</Campo>
          <Campo r={pj ? 'Razão social' : 'Nome'}><input style={inp} value={form.nome} onChange={e => set('nome', e.target.value)} autoFocus={novo} /></Campo>
          <Campo r={pj ? 'Fantasia' : 'Apelido'}><input style={inp} value={form.apelido} onChange={e => set('apelido', e.target.value)} /></Campo>
          <Campo r={pj ? 'Fundação' : 'Nascimento'}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="date" style={{ ...inp, width: 160, fontFamily: 'var(--mono)' }} value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
              {idade && <span style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{idade.toUpperCase()}</span>}
            </div>
          </Campo>
          <Campo r={pj ? 'CNPJ' : 'CPF'}><input style={{ ...inp, width: 200, fontFamily: 'var(--mono)' }} value={form.cpf} onChange={e => set('cpf', mascaraDoc(e.target.value, pj))} /></Campo>
          <Campo r={pj ? 'Insc. estadual' : 'RG'}><input style={{ ...inp, width: 200, fontFamily: 'var(--mono)' }} value={form.rg} onChange={e => set('rg', e.target.value)} /></Campo>
          <Campo r="Residência">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input style={{ ...inp, width: 160, fontFamily: 'var(--mono)' }} value={form.telefone} onChange={e => set('telefone', mascaraFone(e.target.value))} />
              {check('spc', 'Inclusão SPC/Serasa')}
            </div>
          </Campo>
          <Campo r="Comercial">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input style={{ ...inp, width: 160, fontFamily: 'var(--mono)' }} value={form.tel_comercial} onChange={e => set('tel_comercial', mascaraFone(e.target.value))} />
              {check('sem_cobranca', 'Jurídico / sem cobrança')}
            </div>
          </Campo>
          <Campo r="Celular">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input style={{ ...inp, width: 160, fontFamily: 'var(--mono)' }} value={form.celular} onChange={e => set('celular', mascaraFone(e.target.value))} />
              {check('nao_receber_msg', 'Não receber WhatsApp/e-mail')}
            </div>
          </Campo>
          <Campo r="Situação">{radio('situacao_cad', 'ativo', 'Ativo')}{radio('situacao_cad', 'analise', 'Análise')}{radio('situacao_cad', 'bloqueado', 'Bloqueado')}{radio('situacao_cad', 'inativo', 'Inativo')}</Campo>
          <Campo r="Cobrança">{radio('cobranca', 'externa', 'Externa')}{radio('cobranca', 'telemark', 'Telemark')}{radio('cobranca', 'normal', 'Normal')}</Campo>
          <Campo r="Região"><input style={inp} list="op-regiao" value={form.regiao} onChange={e => set('regiao', e.target.value)} /></Campo>
          <Campo r="Localidade"><input style={inp} list="op-localidade" value={form.localidade} onChange={e => set('localidade', e.target.value)} /></Campo>
        </div>

        <div style={{ display: 'grid', gap: 4 }}>
          <Campo r="CEP">
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, width: 130, fontFamily: 'var(--mono)' }} value={form.cep} onChange={e => set('cep', mascaraCep(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscarCep(); } }} placeholder="00000-000" />
              <button title="Buscar endereço pelo CEP" onClick={buscarCep} disabled={buscandoCep} style={{ width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}><Icone nome="busca" size={15} /></button>
            </div>
          </Campo>
          <Campo r="Endereço"><input style={inp} value={form.endereco} onChange={e => set('endereco', e.target.value)} /></Campo>
          <Campo r="Número"><input style={{ ...inp, width: 130 }} value={form.numero} onChange={e => set('numero', e.target.value)} /></Campo>
          <Campo r="Complemento"><input style={inp} value={form.complemento} onChange={e => set('complemento', e.target.value)} /></Campo>
          <Campo r="Bairro"><input style={inp} list="op-bairro" value={form.bairro} onChange={e => set('bairro', e.target.value)} /></Campo>
          <Campo r="Cidade"><input style={inp} list="op-cidade" value={form.cidade} onChange={e => set('cidade', e.target.value)} /></Campo>
          <Campo r="UF"><input style={{ ...inp, width: 70, textTransform: 'uppercase' }} maxLength={2} value={form.uf} onChange={e => set('uf', e.target.value.toUpperCase())} /></Campo>
          <Campo r="Referência"><input style={inp} value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="Ponto de referência para o cobrador" /></Campo>
          <Campo r="Observações"><textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={form.observacao} onChange={e => set('observacao', e.target.value)} /></Campo>
          <Campo r="E-mail"><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Campo>
          {!pj && <Campo r="Mãe"><input style={inp} value={form.mae} onChange={e => set('mae', e.target.value)} /></Campo>}
          {!pj && <Campo r="Pai"><input style={inp} value={form.pai} onChange={e => set('pai', e.target.value)} /></Campo>}
          {!pj && <Campo r="Cônjuge"><input style={inp} value={form.conjuge} onChange={e => set('conjuge', e.target.value)} /></Campo>}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ aspectRatio: '3 / 4', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {c?.foto
              ? <img src={c.foto} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}><Icone nome="camera" size={34} style={{ margin: '0 auto 6px' }} /><div>{novo ? 'Salve para pôr foto' : 'Sem foto'}</div></div>}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <label title="Tirar ou escolher foto" style={{ width: 36, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 5, cursor: novo ? 'default' : 'pointer', opacity: novo ? 0.4 : 1, color: 'var(--text)' }}>
              <Icone nome="camera" size={16} />
              <input type="file" accept="image/*" capture="user" disabled={novo} onChange={trocarFoto} style={{ display: 'none' }} />
            </label>
            <button title="Remover foto" disabled={!c?.foto} onClick={tirarFoto} style={{ width: 36, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 5, cursor: c?.foto ? 'pointer' : 'default', opacity: c?.foto ? 1 : 0.4, color: 'var(--text)' }}><Icone nome="excluir" size={16} /></button>
          </div>
          <div style={{ display: 'grid', gap: 2, marginTop: 6 }}>
            <span style={rot}>Loja</span>
            <span style={{ fontSize: 13, color: 'var(--text)', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 8px' }}>{c?.loja_nome || 'Todas as lojas'}</span>
          </div>
          {!novo && c?.created_at && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Cadastrado em {fmtD(c.created_at)}</div>}
        </div>
      </div>

      {mapa && enderecoMapa && (
        <div style={{ ...card, marginTop: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: 12.5, color: 'var(--text-dim)' }}>
            <span>{enderecoMapa}</span>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoMapa)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Abrir no Google Maps</a>
          </div>
          <iframe title="Mapa" src={`https://maps.google.com/maps?q=${encodeURIComponent(enderecoMapa)}&z=16&output=embed`} style={{ width: '100%', height: 280, border: 0, display: 'block' }} loading="lazy" />
        </div>
      )}

      <datalist id="op-regiao">{opcoes.regiao.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="op-localidade">{opcoes.localidade.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="op-bairro">{opcoes.bairro.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="op-cidade">{opcoes.cidade.map(v => <option key={v} value={v} />)}</datalist>

      {!novo && p && r && (
        <>
          {/* Números */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, margin: '12px 0' }}>
            {[
              { l: 'Total comprado', v: brl(r.total_comprado), cor: 'var(--primary)' },
              { l: 'Vendas', v: String(r.qtd_vendas), s: r.ultima_compra ? `última ${haQuanto(r.ultima_compra)}` : '' },
              { l: 'Ticket médio', v: brl(r.ticket_medio) },
              { l: 'Em aberto', v: brl(r.em_aberto), cor: r.em_aberto > 0 ? '#d97706' : undefined },
              { l: 'Em atraso', v: brl(r.em_atraso), cor: r.em_atraso > 0 ? '#dc2626' : '#16a34a', s: r.atraso_medio_dias !== null ? `paga c/ média de ${r.atraso_medio_dias.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dia(s) de atraso` : '' },
            ].map(k => (
              <div key={k.l} style={{ ...card, padding: '10px 12px' }}>
                <div style={rot}>{k.l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: k.cor || 'var(--text)', marginTop: 2 }}>{k.v}</div>
                {k.s && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.s}</div>}
              </div>
            ))}
          </div>

          {/* Histórico */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', padding: '0 10px', flexWrap: 'wrap' }}>
              {abaBtn('vendas', 'Vendas', p.vendas.length)}
              {abaBtn('crediario', 'Crediário', abertos.length)}
              {abaBtn('os', 'O.S.', p.os.length)}
              {abaBtn('receita', 'Receita')}
            </div>

            {aba === 'vendas' && (
              <div>
                {!p.vendas.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma venda.</div>}
                {p.vendas.map(v => (
                  <div key={v.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, alignItems: 'center', opacity: v.situacao === 'cancelada' ? 0.5 : 1 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>#{v.numero}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{fmtD(v.created_at)}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.itens || '-'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{[v.vendedor, v.loja, v.forma_pagamento].filter(Boolean).join(' · ')}{v.situacao === 'cancelada' ? ' · CANCELADA' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{brl(v.valor_final)}</div>
                      {v.desconto > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>desc. {brl(v.desconto)}</div>}
                      {v.saldo_restante > 0.009 && v.situacao !== 'cancelada' && <div style={{ fontSize: 11, color: '#d97706' }}>falta {brl(v.saldo_restante)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === 'crediario' && (
              <div style={{ padding: 14, display: 'grid', gap: 12 }}>
                {!grupos.size && <div style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum crediário / boleto.</div>}
                {[...grupos.entries()].map(([k, g]) => {
                  const aberto = g.itens.filter(t => t.situacao !== 'recebido').reduce((s, t) => s + t.valor, 0);
                  const temAtraso = g.itens.some(t => t.situacao === 'vencido');
                  return (
                    <div key={k} style={{ border: `1px solid ${temAtraso ? 'rgba(220,38,38,.4)' : 'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '9px 14px', background: temAtraso ? 'rgba(220,38,38,.08)' : 'var(--surface-alt)', display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
                        <b style={{ color: 'var(--text)' }}>{g.titulo}</b>
                        <span style={{ fontFamily: 'var(--mono)', color: aberto > 0 ? (temAtraso ? '#dc2626' : '#d97706') : '#16a34a', fontWeight: 700 }}>{aberto > 0 ? `aberto ${brl(aberto)}` : 'quitado'}</span>
                      </div>
                      {g.itens.map(t => {
                        const cor = t.situacao === 'recebido' ? '#16a34a' : t.situacao === 'vencido' ? '#dc2626' : '#d97706';
                        return (
                          <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '92px 70px 1fr 110px 90px', gap: 10, padding: '7px 14px', borderTop: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: cor }}>{t.situacao === 'recebido' ? 'Pago' : t.situacao === 'vencido' ? 'Em atraso' : 'A vencer'}</span>
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{t.parcela || '-'}</span>
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{fmtD(t.vencimento)} <span style={{ fontSize: 11, color: cor }}>{t.situacao === 'vencido' ? `${t.dias_atraso}d atraso` : t.situacao === 'recebido' ? `pago ${fmtD(t.recebido_em)}` : ''}</span></span>
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{brl(t.valor)}</span>
                            <span style={{ textAlign: 'right' }}>
                              {t.situacao !== 'recebido' && <button onClick={() => setBaixa(t)} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Baixar</button>}
                            </span>
                          </div>
                        );
                      })}
                      {g.itens[0]?.carne_id && <div style={{ padding: '7px 14px', borderTop: '1px solid var(--border)', textAlign: 'right' }}><a href={`/carnes/${g.itens[0].carne_id}/imprimir`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--primary)' }}>Imprimir carnê</a></div>}
                    </div>
                  );
                })}
              </div>
            )}

            {aba === 'os' && (
              <div>
                {!p.os.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma O.S.</div>}
                {p.os.map(o => (
                  <div key={o.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--primary)' }}>OS {o.numero}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{fmtD(o.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', minWidth: 0 }}>
                      {[o.armacao_desc, o.lente_desc].filter(Boolean).join(' · ') || '-'}
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{SIT_OS[o.situacao] || o.situacao}{o.data_entrega ? ` · entrega ${fmtD(o.data_entrega)}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{brl(o.valor_total)}</span>
                      <a href={`/os/${o.id}/imprimir`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>imprimir</a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === 'receita' && c && (
              <div style={{ padding: 18 }}>
                <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 14 }}>
                  <thead><tr>{['', 'Esférico', 'Cilíndrico', 'Eixo'].map(h => <th key={h} style={{ padding: '6px 16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--sans)' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    <tr><td style={{ padding: '6px 16px', fontWeight: 700 }}>OD</td><td style={{ padding: '6px 16px' }}>{c.rec_od_esf || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_od_cil || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_od_eixo || '-'}</td></tr>
                    <tr><td style={{ padding: '6px 16px', fontWeight: 700 }}>OE</td><td style={{ padding: '6px 16px' }}>{c.rec_oe_esf || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_oe_cil || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_oe_eixo || '-'}</td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>Adição: <b style={{ fontFamily: 'var(--mono)' }}>{c.rec_adicao || '-'}</b> · DP: <b style={{ fontFamily: 'var(--mono)' }}>{c.rec_dp || '-'}</b>{c.rec_obs ? ` · ${c.rec_obs}` : ''}</div>
              </div>
            )}
          </div>
        </>
      )}

      {novaVenda && c && <VendaModal venda={null} clienteInicial={{ id: c.id, nome: c.nome }} onClose={() => setNovaVenda(false)} onSaved={() => { setNovaVenda(false); load(); }} />}
      {novaOS && c && <OSModal os={null} clienteInicial={{ id: c.id, nome: c.nome }} onClose={() => setNovaOS(false)} onSaved={() => { setNovaOS(false); load(); }} />}
      {baixa && <BaixaModal t={baixa} contas={contas} onClose={() => setBaixa(null)} onSaved={() => { setBaixa(null); load(); }} />}
    </div>
  );
}
