import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { whatsappLink, foneValido, aplicarVariaveis } from '../../lib/whatsapp';
import { useAuth } from '../../hooks/useAuth';
import Icone from '../../components/Icone';
import EditarPagamentos from '../../components/EditarPagamentos';
import UnificarDuplicados from '../../components/UnificarDuplicados';

interface Estagio {
  id: string; key: string; label: string; icon: string; color: string;
  ordem: number; sistema: number; ativo: number;
}

interface Card {
  id: string; estagio: string; prioridade: string; notas: string | null;
  cliente_id: string; nome: string; celular?: string; telefone?: string;
  email?: string; cidade?: string; uf?: string; data_nascimento?: string;
  ultima_entrega?: string; ultima_venda?: string; total_os: number;
  total_gasto: number; valor_pendente: number; updated_at: string;
  saldo_venda_pendente?: number;
  carne_vencido?: number;
  quitado_em?: string | null;
  prazo_entrega?: string | null;
  entregue_em?: string | null;
  venda_pendente_id?: string;
  os_pendente_id?: string;
}

const MSG_PADRAO: Record<string, string> = {
  novo:        'Olá {nome}! Seja bem-vindo à {loja}! 😊 Qualquer dúvida, estamos à disposição.',
  contato:     'Olá {nome}, tudo bem? Passando para saber se posso te ajudar com algo na {loja}.',
  pos_venda:   'Olá {nome}! Espero que esteja satisfeito com sua compra na {loja}. Precisando de ajuste ou dúvida, é só falar! 😊',
  a_receber:   'Olá {nome}, tudo bem? Identificamos um valor em aberto referente ao seu pedido na {loja}. Poderia nos contatar para regularizar? 😊',
  aniversario: 'Olá {nome}! 🎂 Feliz aniversário! Temos uma surpresa especial para você na {loja}. Venha nos visitar!',
  indicacao:   'Olá {nome}! Que tal indicar um amigo para a {loja}? Por cada indicação você ganha um desconto especial na próxima compra! 👥',
  reativacao:  'Olá {nome}, sentimos sua falta! 😊 Temos novidades esperando por você na {loja}. Venha conferir!',
  vip:         'Olá {nome}! Como nosso cliente especial, você tem acesso antecipado às nossas novidades. Entre em contato! ⭐',
};

// Mensagem de aniversário exclusiva da Ótica Conceito do Ceará
const MSG_ANIVERSARIO_CONCEITO =
  '🎉 Feliz Aniversário, {nome} 🥳\n\n' +
  'A equipe da Ótica Conceito do Ceará deseja a você muita saúde, felicidade e muitas conquistas. Que seu novo ciclo seja incrível! 💙\n\n' +
  '🎁 Para comemorar, você ganhou 20% OFF em nossos solares Conceito, válido por 30 dias.\n\n' +
  '📍 Passe na nossa loja no São Cristóvão. Sua consultora Brena estará te esperando! 👓\n\n' +
  '📲 Acompanhe nossas novidades: @oticaconceitooficial_';

// Identifica a loja Ótica Conceito (mensagem de aniversário só vale pra ela)
function ehOticaConceito(loja?: string) {
  return /conceito/i.test(loja || '');
}

// avatar com iniciais (cor fixa por nome)
const CORES_AVATAR = ['#64748b', '#2563eb', '#0891b2', '#16a34a', '#b45309', '#be185d', '#475569', '#0f766e'];
function corAvatar(nome: string) { let h = 0; for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CORES_AVATAR[h % CORES_AVATAR.length]; }
function iniciais(nome: string) { const p = nome.trim().split(/\s+/); return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function diasAtras(s?: string) {
  if (!s) return null;
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return '1 dia atrás';
  if (diff < 30) return `${diff} dias atrás`;
  if (diff < 365) return `${Math.floor(diff / 30)} meses atrás`;
  return `${Math.floor(diff / 365)} ano(s) atrás`;
}
function proximoAniversario(dataNasc?: string) {
  if (!dataNasc) return null;
  const [, m, d] = dataNasc.split('-');
  const hoje = new Date();
  const aniv = new Date(hoje.getFullYear(), parseInt(m) - 1, parseInt(d));
  if (aniv < hoje) aniv.setFullYear(hoje.getFullYear() + 1);
  const diff = Math.ceil((aniv.getTime() - hoje.getTime()) / 86400000);
  if (diff === 0) return 'Hoje!';
  if (diff <= 7) return `Em ${diff} dias`;
  return null;
}

// ─── Modal de Configuração de Estágios ───────────────────────────────────────
const CORES = ['#64748b','#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#ea580c','#b45309','#0891b2','#be185d'];

function ConfigModal({ estagios, onClose, onSaved }: {
  estagios: Estagio[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lista, setLista] = useState<Estagio[]>([...estagios].sort((a, b) => a.ordem - b.ordem));
  const [novo, setNovo] = useState({ label: '', icon: '', color: '#64748b' });
  const [salvando, setSalvando] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);

  async function salvarEstagio(e: Estagio) {
    setSalvando(e.id);
    try {
      await api.put(`/crm/estagios/${e.id}`, { label: e.label, icon: '', color: e.color, ordem: e.ordem });
    } finally { setSalvando(null); }
  }

  async function excluir(e: Estagio) {
    if (!confirm(`Excluir estágio "${e.label}"? Os cards serão movidos para Novos.`)) return;
    await api.delete(`/crm/estagios/${e.id}`);
    setLista(l => l.filter(x => x.id !== e.id));
    onSaved();
  }

  async function adicionar() {
    if (!novo.label.trim()) return;
    setAdicionando(true);
    try {
      await api.post('/crm/estagios', novo);
      setNovo({ label: '', icon: '', color: '#64748b' });
      onSaved();
    } finally { setAdicionando(false); }
  }

  function moverOrdem(idx: number, dir: -1 | 1) {
    const nova = [...lista];
    const destino = idx + dir;
    if (destino < 0 || destino >= nova.length) return;
    [nova[idx], nova[destino]] = [nova[destino], nova[idx]];
    const atualizada = nova.map((e, i) => ({ ...e, ordem: i }));
    setLista(atualizada);
    // Salva ordens automaticamente
    atualizada.forEach(e => api.put(`/crm/estagios/${e.id}`, { label: e.label, icon: '', color: e.color, ordem: e.ordem }).catch(() => {}));
  }

  function atualizar(id: string, campo: keyof Estagio, valor: string) {
    setLista(l => l.map(e => e.id === id ? { ...e, [campo]: valor } : e));
  }

  const inp: React.CSSProperties = { padding: '7px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>Configurar Estágios</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Renomeie, reordene e adicione estágios</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {lista.map((e, idx) => (
            <div key={e.id} style={{
              background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '8px',
              borderLeft: `4px solid ${e.color}`,
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Ordem */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button onClick={() => moverOrdem(idx, -1)} disabled={idx === 0} style={{ padding: '1px 5px', fontSize: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>▲</button>
                  <button onClick={() => moverOrdem(idx, 1)} disabled={idx === lista.length - 1} style={{ padding: '1px 5px', fontSize: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', cursor: idx === lista.length - 1 ? 'default' : 'pointer', opacity: idx === lista.length - 1 ? 0.3 : 1 }}>▼</button>
                </div>


                {/* Nome */}
                <input value={e.label} onChange={ev => atualizar(e.id, 'label', ev.target.value)}
                  style={{ ...inp, flex: 1 }} placeholder="Nome do estágio" />

                {/* Cor */}
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '80px' }}>
                  {CORES.map(c => (
                    <button key={c} onClick={() => atualizar(e.id, 'color', c)} title={c} style={{
                      width: '14px', height: '14px', borderRadius: '50%', background: c, border: `2px solid ${e.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer', padding: 0,
                    }} />
                  ))}
                </div>

                {/* Salvar */}
                <button onClick={() => salvarEstagio(e)} style={{
                  padding: '6px 10px', fontSize: '12px', fontWeight: '600',
                  background: salvando === e.id ? 'var(--primary-dim)' : 'var(--primary)',
                  color: salvando === e.id ? 'var(--primary)' : 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{salvando === e.id ? '...' : 'Salvar'}</button>

                {/* Excluir */}
                <button onClick={() => excluir(e)} style={{ padding: '6px 8px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          ))}

          {/* Novo estágio */}
          <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '14px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>+ Novo estágio personalizado</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={novo.label} onChange={e => setNovo(n => ({ ...n, label: e.target.value }))}
                style={{ ...inp, flex: 1, minWidth: '120px' }} placeholder="Nome do novo estágio" />
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '80px' }}>
                {CORES.map(c => (
                  <button key={c} onClick={() => setNovo(n => ({ ...n, color: c }))} style={{
                    width: '14px', height: '14px', borderRadius: '50%', background: c, border: `2px solid ${novo.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer', padding: 0,
                  }} />
                ))}
              </div>
              <button onClick={adicionar} disabled={adicionando || !novo.label.trim()} style={{
                padding: '7px 14px', fontSize: '13px', fontWeight: '600',
                background: novo.label.trim() ? 'var(--primary)' : 'var(--primary-dim)',
                color: novo.label.trim() ? 'white' : 'var(--primary)',
                border: 'none', borderRadius: '7px', cursor: novo.label.trim() ? 'pointer' : 'default',
              }}>{adicionando ? '...' : 'Criar'}</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
          <button onClick={() => { onSaved(); onClose(); }} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function CardItem({ card, estagios, onMover, onSalvarNota, tenant, onAtualizar }: {
  card: Card; estagios: Estagio[];
  onMover: (id: string, key: string) => void;
  onSalvarNota: (id: string, nota: string, prioridade?: string) => void;
  tenant: string;
  onAtualizar: () => void;
}) {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState(card.notas || '');
  const [prioridade, setPrioridade] = useState(card.prioridade);
  const [movMenu, setMovMenu] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [formaPagFinal, setFormaPagFinal] = useState('pix');
  const [valorRecebido, setValorRecebido] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  const fone = card.celular || card.telefone || '';
  const temFone = foneValido(fone);
  const aniv = proximoAniversario(card.data_nascimento);
  const priorCor: Record<string, string> = { alta: '#dc2626', normal: '#64748b', baixa: '#94a3b8' };

  // Fonte do saldo a receber: prioriza venda pendente; senão usa a OS em aberto ()
  const saldoVenda = card.saldo_venda_pendente || 0;
  const saldoOS = card.valor_pendente || 0;
  const usarVenda = !!card.venda_pendente_id && saldoVenda > 0;
  const alvoId = usarVenda ? card.venda_pendente_id : card.os_pendente_id;
  const saldo = usarVenda ? saldoVenda : saldoOS;
  const podeReceber = (card.estagio === 'oculos_pendente' || card.estagio === 'a_receber') && saldo > 0 && !!alvoId;

  function abrirWhatsApp() {
    const template = (card.estagio === 'aniversario' && ehOticaConceito(tenant))
      ? MSG_ANIVERSARIO_CONCEITO
      : (MSG_PADRAO[card.estagio] || MSG_PADRAO.novo);
    const msg = aplicarVariaveis(template, {
      nome: card.nome.split(' ')[0], loja: tenant,
    });
    window.open(whatsappLink(fone, msg), '_blank');
  }

  function salvarNota() { onSalvarNota(card.id, nota, prioridade); }

  const [editarPag, setEditarPag] = useState(false);
  function abrirModalFinalizar() {
    setValorRecebido(String(saldo));
    setFinalizarOpen(true);
  }

  async function handleFinalizar() {
    if (!alvoId) return;
    const recebido = parseFloat(valorRecebido) || 0;
    if (recebido <= 0) return;
    setFinalizando(true);
    try {
      await api.post('/crm/receber', {
        ...(usarVenda ? { venda_id: alvoId } : { os_id: alvoId }),
        valor_recebido: String(recebido),
        forma_pagamento: formaPagFinal,
      });
      setFinalizarOpen(false);
      onAtualizar();
    } catch {}
    setFinalizando(false);
  }

  async function handleEntregar() {
    setFinalizando(true);
    try {
      await api.post('/crm/entregue', { cliente_id: card.cliente_id });
      onAtualizar();
    } catch {}
    setFinalizando(false);
  }

  // texto do balão principal, conforme a etapa
  const br = (x?: string | null) => (x ? x.slice(0, 10).split('-').reverse().join('/') : '');
  const diasAte = (x: string) => Math.round((new Date(x.slice(0, 10) + 'T12:00:00').getTime() - new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00').getTime()) / 86_400_000);
  let contexto: { txt: string; cor: string } | null = null;
  if (card.estagio === 'a_receber') {
    const partes = [saldo > 0 ? `${brl(saldo)} em aberto` : '', (card.carne_vencido || 0) > 0 ? `carnê vencido ${brl(card.carne_vencido!)}` : ''].filter(Boolean);
    if (partes.length) contexto = { txt: partes.join(' · '), cor: '#dc2626' };
  } else if (card.estagio === 'contato' && card.prazo_entrega) {
    const n = diasAte(card.prazo_entrega); contexto = { txt: `Entrega ${br(card.prazo_entrega)}${n > 0 ? ` · ${n}d` : ''}`, cor: '#2563eb' };
  } else if (card.estagio === 'oculos_pronto' && card.prazo_entrega) {
    contexto = { txt: `Pronto desde ${br(card.prazo_entrega)}`, cor: '#16a34a' };
  } else if (card.estagio === 'oculos_pendente' && card.prazo_entrega) {
    const n = -diasAte(card.prazo_entrega); contexto = { txt: `Não buscou há ${n} dia${n > 1 ? 's' : ''}`, cor: '#d97706' };
  } else if (card.estagio === 'aniversario' && aniv) {
    contexto = { txt: `Aniversário ${aniv}`, cor: '#d97706' };
  } else if ((card.estagio === 'pos_venda' || card.estagio === 'indicacao') && card.entregue_em) {
    contexto = { txt: `Entregue em ${br(card.entregue_em)}`, cor: 'var(--text-dim)' };
  } else if ((card.estagio === 'vip' || card.estagio === 'reativacao') && card.total_gasto > 0) {
    contexto = { txt: `Comprou ${brl(card.total_gasto)}`, cor: card.estagio === 'vip' ? '#b45309' : '#ea580c' };
  }
  const dataRef = card.estagio === 'contato' || card.estagio === 'oculos_pronto' || card.estagio === 'oculos_pendente' ? card.ultima_venda : (card.entregue_em || card.ultima_venda || card.updated_at);
  const dataCard = dataRef ? (diasAte(dataRef) === 0 ? 'Hoje' : diasAte(dataRef) === -1 ? 'Ontem' : br(dataRef)) : '';
  const acaoBtn = (cor: string): React.CSSProperties => ({ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: cor });

  const recebidoNum = parseFloat(valorRecebido) || 0;
  const novoSaldo = Math.max(0, saldo - recebidoNum);

  return (
    <>
    {editarPag && <EditarPagamentos clienteId={card.cliente_id} onClose={() => setEditarPag(false)} onSaved={() => { setEditarPag(false); onAtualizar(); }} />}
    {finalizarOpen && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        onClick={e => e.target === e.currentTarget && setFinalizarOpen(false)}>
        <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Registrar Recebimento</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{card.nome}</p>
            </div>
            <button onClick={() => setFinalizarOpen(false)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          <div style={{ padding: '18px 22px' }}>
            {/* Saldo atual */}
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '600' }}>Saldo em aberto</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#d97706', fontFamily: 'var(--mono)' }}>{brl(saldo)}</span>
            </div>
            {/* Valor recebido */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Valor Recebido (R$)</label>
              <input
                type="number"
                min="0"
                max={saldo}
                step="0.01"
                value={valorRecebido}
                onChange={e => setValorRecebido(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: '16px', fontFamily: 'var(--mono)', fontWeight: '700', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>
            {/* Saldo restante pós pagamento */}
            {recebidoNum > 0 && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: novoSaldo === 0 ? 'rgba(22,163,74,0.1)' : 'rgba(100,116,139,0.08)', border: `1px solid ${novoSaldo === 0 ? 'rgba(22,163,74,0.3)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: novoSaldo === 0 ? '#16a34a' : 'var(--text-dim)', fontWeight: '600' }}>{novoSaldo === 0 ? 'Quitado!' : 'Saldo restante'}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--mono)', color: novoSaldo === 0 ? '#16a34a' : 'var(--text-dim)' }}>{brl(novoSaldo)}</span>
              </div>
            )}
            {/* Forma de pagamento */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Forma de Pagamento</label>
              <select value={formaPagFinal} onChange={e => setFormaPagFinal(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="debito">Cartão de Débito</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setFinalizarOpen(false)} style={{ flex: 1, padding: '10px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleFinalizar} disabled={finalizando || recebidoNum <= 0} style={{ flex: 2, padding: '10px', fontSize: '14px', fontWeight: '700', background: recebidoNum <= 0 ? 'var(--surface-alt)' : '#f59e0b', color: recebidoNum <= 0 ? 'var(--text-muted)' : 'white', border: 'none', borderRadius: '8px', cursor: recebidoNum <= 0 ? 'default' : 'pointer' }}>
                {finalizando ? 'Salvando...' : novoSaldo === 0 ? 'Confirmar e Finalizar' : 'Registrar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    <div className="crm-card" style={{
      position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px',
      marginBottom: '6px', padding: '9px 10px 8px', display: 'flex', gap: '10px',
    }}>
      {/* avatar */}
      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: corAvatar(card.nome), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
        {iniciais(card.nome)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* linha de cima: telefone/cidade e data */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[temFone ? fone : '', card.cidade].filter(Boolean).join(' · ') || 'sem telefone'}</span>
          {dataCard && <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{dataCard}</span>}
        </div>
        {/* nome em azul: abre a ficha */}
        <button onClick={() => navigate(`/clientes/${card.cliente_id}`)} title="Abrir ficha do cliente"
          style={{ display: 'block', maxWidth: '100%', background: 'none', border: 'none', padding: 0, margin: '1px 0 0', cursor: 'pointer', textAlign: 'left', fontSize: '13.5px', fontWeight: 500, color: '#3b82f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {card.nome}
        </button>

        {/* balões de contexto */}
        {(contexto || aniv || card.notas) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
            {contexto && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 4, background: `${contexto.cor}1f`, color: contexto.cor, fontWeight: 600 }}>{contexto.txt}</span>}
            {aniv && card.estagio !== 'aniversario' && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 4, background: 'rgba(217,119,6,0.12)', color: '#d97706' }}>Aniversário {aniv}</span>}
            {card.notas && !expandido && <span title={card.notas} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 4, background: 'var(--surface-alt)', color: 'var(--text-dim)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.notas}</span>}
          </div>
        )}

        {/* ação principal da etapa */}
        {(podeReceber || card.estagio === 'a_receber' || card.estagio === 'oculos_pronto' || card.estagio === 'oculos_pendente') && (
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {podeReceber && <button onClick={abrirModalFinalizar} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#d97706' }}>Receber {brl(saldo)}</button>}
            {card.estagio === 'a_receber' && (
              <button onClick={() => setEditarPag(true)} title="Corrigir o que o cliente já pagou de uma compra"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)' }}>
                <Icone nome="editar" size={12} /> Editar pagamento
              </button>
            )}
            {(card.estagio === 'oculos_pronto' || card.estagio === 'oculos_pendente') && (
              <button onClick={handleEntregar} disabled={finalizando} title="O cliente buscou o óculos. Em 20 dias ele aparece no Pós-venda."
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                <Icone nome="ok" size={13} /> {finalizando ? 'Salvando...' : 'Entregue'}
              </button>
            )}
          </div>
        )}

        {expandido && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prioridade:</span>
              {(['baixa', 'normal', 'alta'] as const).map(p => (
                <button key={p} onClick={() => setPrioridade(p)} style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer', border: 'none', background: prioridade === p ? priorCor[p] : 'var(--surface-alt)', color: prioridade === p ? 'white' : 'var(--text-muted)' }}>{p}</button>
              ))}
            </div>
            <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Adicionar nota..." style={{ width: '100%', minHeight: '64px', padding: '7px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5' }} onBlur={salvarNota} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Atualizado {diasAtras(card.updated_at)}</span>
              <button onClick={salvarNota} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        )}
      </div>

      {/* pontinho de prioridade no canto */}
      <span title={`Prioridade: ${prioridade}`} style={{ position: 'absolute', right: 8, bottom: 8, width: 6, height: 6, borderRadius: '50%', background: prioridade === 'normal' ? '#e0a800' : priorCor[prioridade] }} />

      {/* ações que aparecem ao passar o mouse (como no Kommo) */}
      <div className="crm-card-acoes" style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2, background: 'var(--surface)', borderRadius: 4, padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        {temFone && <button title="WhatsApp" onClick={abrirWhatsApp} style={acaoBtn('#25D366')}><Icone nome="whatsapp" size={15} /></button>}
        <div style={{ position: 'relative' }}>
          <button title="Mover de etapa" onClick={() => setMovMenu(m => !m)} style={acaoBtn('var(--primary)')}><Icone nome="seta" size={15} /></button>
          {movMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px', minWidth: '170px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
              {estagios.filter(e => e.key !== card.estagio).map(e => (
                <button key={e.key} onClick={() => { onMover(card.id, e.key); setMovMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', fontSize: '12.5px', background: 'none', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-dim)', textAlign: 'left' }}
                  onMouseEnter={e2 => (e2.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e2 => (e2.currentTarget.style.background = 'none')}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: e.color }} />{e.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button title={expandido ? 'Fechar nota' : 'Nota e prioridade'} onClick={() => setExpandido(v => !v)} style={acaoBtn('var(--text-dim)')}><Icone nome="editar" size={14} /></button>
      </div>
    </div>
    </>
  );
}

// ─── View semanal para marketing ─────────────────────────────────────────────
function MarketingView() {
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [vendas, setVendas] = useState<{ dia: string; vendas: number; valor: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const hoje = new Date();
      const dow = hoje.getDay(); // 0=dom
      const diff = dow === 0 ? 6 : dow - 1; // dias desde segunda
      const seg = new Date(hoje); seg.setDate(hoje.getDate() - diff);
      const sab = new Date(seg); sab.setDate(seg.getDate() + 5);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      try {
        const res = await api.get<{ vendas_por_dia: { dia: string; vendas: number; valor: number }[] }>(
          `/relatorios/resumo?inicio=${fmt(seg)}&fim=${fmt(sab)}`
        );
        setVendas(res.vendas_por_dia);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  // gera os 6 dias da semana (seg–sab)
  const hoje = new Date();
  const dow = hoje.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  const semana = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje); d.setDate(hoje.getDate() - diff + i);
    return d.toISOString().split('T')[0];
  });

  const totalSemana = vendas.reduce((s, v) => s + v.vendas, 0);
  const maxVendas = Math.max(...vendas.map(v => v.vendas), 1);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Minhas Vendas da Semana</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Segunda a Sábado · semana atual</p>
      </div>

      {/* Total */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px 28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icone nome="vendas" size={24} color="var(--primary)" /></div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total da semana</p>
          <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--mono)', letterSpacing: '-1px' }}>{loading ? '...' : totalSemana}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>vendas registradas</p>
        </div>
      </div>

      {/* Grid por dia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        {semana.map((dataStr, i) => {
          const diaData = vendas.find(v => v.dia === dataStr);
          const count = diaData?.vendas || 0;
          const isHoje = dataStr === hoje.toISOString().split('T')[0];
          const isPast = dataStr < hoje.toISOString().split('T')[0];
          const barH = count > 0 ? Math.max(12, (count / maxVendas) * 80) : 4;
          return (
            <div key={dataStr} style={{
              background: isHoje ? 'rgba(37,99,235,0.08)' : 'var(--surface)',
              border: `1px solid ${isHoje ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`,
              borderRadius: '12px', padding: '16px 12px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: isHoje ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {DIAS[i]}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '80px', marginBottom: '10px' }}>
                <div style={{
                  width: '28px', borderRadius: '6px 6px 0 0',
                  background: count > 0 ? (isHoje ? 'var(--primary)' : '#2563eb88') : 'var(--border)',
                  height: `${barH}px`, transition: 'height 0.3s',
                }} />
              </div>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: count > 0 ? 'var(--text)' : 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{loading ? '·' : count}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: isPast && count === 0 ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                {count === 1 ? 'venda' : 'vendas'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Funil principal ──────────────────────────────────────────────────────────
export default function Funil() {
  const { tenant, usuario } = useAuth();

  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [duplicados, setDuplicados] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const loadEstagios = useCallback(async () => {
    const es = await api.get<Estagio[]>('/crm/estagios');
    setEstagios(es.sort((a, b) => a.ordem - b.ordem));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [es, cs] = await Promise.all([
        api.get<Estagio[]>('/crm/estagios'),
        api.get<Card[]>('/crm'),
      ]);
      setEstagios(es.sort((a, b) => a.ordem - b.ordem));
      setCards(cs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Marketing vê a visão de vendas da semana (após os hooks: Regras dos Hooks)
  if (usuario?.perfil === 'marketing') return <MarketingView />;

  async function mover(id: string, key: string) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, estagio: key, updated_at: new Date().toISOString() } : c));
    await api.put(`/crm/${id}`, { estagio: key, prioridade: card.prioridade, notas: card.notas }).catch(() => load());
  }

  async function salvarNota(id: string, notas: string, prioridade?: string) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const prio = prioridade || card.prioridade;
    setCards(prev => prev.map(c => c.id === id ? { ...c, notas, prioridade: prio, updated_at: new Date().toISOString() } : c));
    await api.put(`/crm/${id}`, { estagio: card.estagio, prioridade: prio, notas }).catch(() => {});
  }

  function onDragStart(cardId: string) { setDragging(cardId); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  function onDragOver(e: React.DragEvent, key: string) { e.preventDefault(); setDragOver(key); }
  function onDrop(key: string) { if (dragging) mover(dragging, key); setDragging(null); setDragOver(null); }

  const buscaLower = busca.toLowerCase();
  const cardsFiltrados = cards.filter(c => !busca || c.nome.toLowerCase().includes(buscaLower) || c.celular?.includes(busca) || c.telefone?.includes(busca));

  return (
    <div style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Funil CRM</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>
            {cards.length} clientes no funil · passe o mouse no card para as ações
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ padding: '8px 12px', fontSize: '13px', width: '200px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
          {usuario?.perfil === 'admin' && <button className="btn" onClick={() => setDuplicados(true)} title="Achar e unificar clientes cadastrados mais de uma vez"><Icone nome="usuarios" size={15} />Duplicados</button>}
          <button onClick={() => setConfigOpen(true)} style={{ padding: '8px 14px', fontSize: '13px', fontWeight: '500', background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Estágios
          </button>
          <button onClick={load} style={{ padding: '8px 14px', fontSize: '13px', background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>↺</button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando funil...</div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '14px', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '8px' }}>
          {estagios.map(estagio => {
            const colCards = cardsFiltrados.filter(c => c.estagio === estagio.key);
            const isOver = dragOver === estagio.key;
            return (
              <div key={estagio.key} onDragOver={e => onDragOver(e, estagio.key)} onDrop={() => onDrop(estagio.key)} style={{ width: '270px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: isOver ? `${estagio.color}12` : 'transparent', borderRadius: '4px', transition: 'background 0.15s' }}>
                <div style={{ padding: '6px 8px 8px', textAlign: 'center', flexShrink: 0, borderBottom: `2px solid ${estagio.color}`, marginBottom: 8 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>{estagio.label}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                    {colCards.length} cliente{colCards.length === 1 ? '' : 's'}{estagio.key === 'a_receber' ? `: ${brl(colCards.reduce((t, c) => t + (c.saldo_venda_pendente || 0) + (c.valor_pendente || 0) + (c.carne_vencido || 0), 0))}` : ''}
                  </div>
                </div>
                <div className="menu-sem-barra" style={{ flex: 1, overflowY: 'auto', padding: '0 2px 4px' }}>
                  {colCards.length === 0 ? (
                    <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '4px', margin: '2px 0' }}>
                      {isOver ? 'Soltar aqui' : 'Nenhum cliente'}
                    </div>
                  ) : colCards.map(card => (
                    <div key={card.id} draggable onDragStart={() => onDragStart(card.id)} onDragEnd={onDragEnd} style={{ opacity: dragging === card.id ? 0.5 : 1, cursor: 'grab' }}>
                      <CardItem card={card} estagios={estagios} onMover={mover} onSalvarNota={salvarNota} tenant={tenant?.nome || 'nossa loja'} onAtualizar={load} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {configOpen && (
        <ConfigModal
          estagios={estagios}
          onClose={() => setConfigOpen(false)}
          onSaved={() => { loadEstagios(); }}
        />
      )}
      {duplicados && <UnificarDuplicados onClose={() => setDuplicados(false)} onMudou={load} />}
    </div>
  );
}
