import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { whatsappLink, foneValido, aplicarVariaveis } from '../../lib/whatsapp';
import { useAuth } from '../../hooks/useAuth';

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
  if (diff === 0) return '🎂 Hoje!';
  if (diff <= 7) return `🎂 Em ${diff} dias`;
  return null;
}

// ─── Modal de Configuração de Estágios ───────────────────────────────────────
const CORES = ['#64748b','#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#ea580c','#b45309','#0891b2','#be185d'];
const ICONES = ['🆕','📞','💰','💳','🎂','👥','🔄','⭐','📌','🏆','🎯','💡','🔔','✅','❤️','🌟'];

function ConfigModal({ estagios, onClose, onSaved }: {
  estagios: Estagio[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lista, setLista] = useState<Estagio[]>([...estagios].sort((a, b) => a.ordem - b.ordem));
  const [novo, setNovo] = useState({ label: '', icon: '📌', color: '#64748b' });
  const [salvando, setSalvando] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);

  async function salvarEstagio(e: Estagio) {
    setSalvando(e.id);
    try {
      await api.put(`/crm/estagios/${e.id}`, { label: e.label, icon: e.icon, color: e.color, ordem: e.ordem });
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
      setNovo({ label: '', icon: '📌', color: '#64748b' });
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
    atualizada.forEach(e => api.put(`/crm/estagios/${e.id}`, { label: e.label, icon: e.icon, color: e.color, ordem: e.ordem }).catch(() => {}));
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

                {/* Ícone seletor */}
                <select value={e.icon} onChange={ev => atualizar(e.id, 'icon', ev.target.value)}
                  style={{ ...inp, width: '64px', fontSize: '16px', textAlign: 'center', padding: '6px 4px' }}>
                  {ICONES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>

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
                }}>{salvando === e.id ? '...' : '✓ Salvar'}</button>

                {/* Excluir (só customizados) */}
                {!e.sistema ? (
                  <button onClick={() => excluir(e)} style={{ padding: '6px 8px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                ) : (
                  <span title="Estágio do sistema — não pode ser excluído" style={{ fontSize: '14px', opacity: 0.4, padding: '0 4px' }}>🔒</span>
                )}
              </div>
            </div>
          ))}

          {/* Novo estágio */}
          <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '14px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>+ Novo estágio personalizado</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={novo.icon} onChange={e => setNovo(n => ({ ...n, icon: e.target.value }))}
                style={{ ...inp, width: '64px', fontSize: '16px', textAlign: 'center', padding: '6px 4px' }}>
                {ICONES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
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
function CardItem({ card, estagios, onMover, onSalvarNota, tenant }: {
  card: Card; estagios: Estagio[];
  onMover: (id: string, key: string) => void;
  onSalvarNota: (id: string, nota: string, prioridade?: string) => void;
  tenant: string;
}) {
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState(card.notas || '');
  const [prioridade, setPrioridade] = useState(card.prioridade);
  const [movMenu, setMovMenu] = useState(false);

  const fone = card.celular || card.telefone || '';
  const temFone = foneValido(fone);
  const aniv = proximoAniversario(card.data_nascimento);
  const ultimaAtiv = card.ultima_entrega || card.ultima_venda;
  const estagio = estagios.find(e => e.key === card.estagio);
  const priorCor: Record<string, string> = { alta: '#dc2626', normal: '#64748b', baixa: '#94a3b8' };

  function abrirWhatsApp() {
    const msg = aplicarVariaveis(MSG_PADRAO[card.estagio] || MSG_PADRAO.novo, {
      nome: card.nome.split(' ')[0], loja: tenant,
    });
    window.open(whatsappLink(fone, msg), '_blank');
  }

  function salvarNota() { onSalvarNota(card.id, nota, prioridade); }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
      marginBottom: '8px', borderLeft: `3px solid ${estagio?.color || '#64748b'}`,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <button onClick={() => setExpandido(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{card.nome}</span>
          </button>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {aniv && <span style={{ fontSize: '10px', fontWeight: '600', color: '#d97706', background: 'rgba(217,119,6,0.1)', padding: '1px 6px', borderRadius: '10px' }}>{aniv}</span>}
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorCor[prioridade] }} title={`Prioridade: ${prioridade}`} />
          </div>
        </div>

        {card.cidade && <p style={{ margin: '0 0 3px', fontSize: '11px', color: 'var(--text-muted)' }}>📍 {card.cidade}{card.uf ? `/${card.uf}` : ''}</p>}
        {temFone && <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{fone}</p>}

        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {card.total_os > 0 && <span style={{ fontSize: '10px', background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '1px 6px', borderRadius: '10px' }}>{card.total_os} OS</span>}
          {card.total_gasto > 0 && <span style={{ fontSize: '10px', background: 'rgba(22,163,74,0.08)', color: '#16a34a', padding: '1px 6px', borderRadius: '10px' }}>{brl(card.total_gasto)}</span>}
          {card.valor_pendente > 0 && <span style={{ fontSize: '10px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>💳 {brl(card.valor_pendente)}</span>}
          {ultimaAtiv && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{diasAtras(ultimaAtiv)}</span>}
        </div>

        {card.notas && !expandido && (
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>💬 {card.notas}</p>
        )}

        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', alignItems: 'center' }}>
          {temFone ? (
            <button onClick={abrirWhatsApp} style={{ flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: '600', background: '#25D366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.296 19.935l.646-2.352a9.15 9.15 0 01-1.225-4.61C4.72 7.867 8.572 4 13.28 4a8.549 8.549 0 016.073 2.513 8.633 8.633 0 012.511 6.109c-.002 4.767-3.854 8.634-8.562 8.634a8.57 8.57 0 01-4.097-1.04L5.296 19.935zm2.454-1.414l.261.155a7.11 7.11 0 003.441.893c3.938 0 7.141-3.217 7.143-7.172a7.18 7.18 0 00-2.088-5.085 7.112 7.112 0 00-5.052-2.106c-3.942 0-7.145 3.217-7.145 7.17 0 1.356.375 2.68 1.084 3.829l.169.267-.714 2.601 2.901-.552z"/></svg>
              WhatsApp
            </button>
          ) : (
            <span style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Sem telefone</span>
          )}

          <div style={{ position: 'relative' }}>
            <button onClick={() => setMovMenu(m => !m)} style={{ padding: '6px 8px', fontSize: '12px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }} title="Mover estágio">⇄</button>
            {movMenu && (
              <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px', minWidth: '160px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                {estagios.filter(e => e.key !== card.estagio).map(e => (
                  <button key={e.key} onClick={() => { onMover(card.id, e.key); setMovMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', fontSize: '13px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-dim)', textAlign: 'left' }}
                    onMouseEnter={e2 => (e2.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e2 => (e2.currentTarget.style.background = 'none')}>
                    <span>{e.icon}</span> {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setExpandido(v => !v)} style={{ padding: '6px 8px', fontSize: '12px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
            {expandido ? '▲' : '▼'}
          </button>
        </div>

        {expandido && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prioridade:</span>
              {(['baixa', 'normal', 'alta'] as const).map(p => (
                <button key={p} onClick={() => setPrioridade(p)} style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: prioridade === p ? priorCor[p] : 'var(--surface-alt)', color: prioridade === p ? 'white' : 'var(--text-muted)' }}>{p}</button>
              ))}
            </div>
            <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Adicionar nota..." style={{ width: '100%', minHeight: '70px', padding: '8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5' }} onBlur={salvarNota} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Atualizado {diasAtras(card.updated_at)}</span>
              <button onClick={salvarNota} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Funil principal ──────────────────────────────────────────────────────────
export default function Funil() {
  const { tenant } = useAuth();
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
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
            {cards.length} clientes · arraste ou use ⇄ para mover
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ padding: '8px 12px', fontSize: '13px', width: '200px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
          <button onClick={() => setConfigOpen(true)} style={{ padding: '8px 14px', fontSize: '13px', fontWeight: '500', background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚙️ Estágios
          </button>
          <button onClick={load} style={{ padding: '8px 14px', fontSize: '13px', background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>↺</button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando funil...</div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '12px', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '8px' }}>
          {estagios.map(estagio => {
            const colCards = cardsFiltrados.filter(c => c.estagio === estagio.key);
            const isOver = dragOver === estagio.key;
            return (
              <div key={estagio.key} onDragOver={e => onDragOver(e, estagio.key)} onDrop={() => onDrop(estagio.key)} style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: isOver ? `${estagio.color}10` : 'var(--surface-alt)', border: `1px solid ${isOver ? estagio.color : 'var(--border)'}`, borderRadius: '12px', transition: 'border-color 0.15s, background 0.15s' }}>
                <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontSize: '16px' }}>{estagio.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{estagio.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '22px', height: '22px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colCards.length > 0 ? estagio.color : 'var(--surface)', color: colCards.length > 0 ? 'white' : 'var(--text-muted)' }}>
                    {colCards.length}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 4px' }}>
                  {colCards.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px', margin: '4px 0' }}>
                      {isOver ? 'Soltar aqui' : 'Nenhum cliente'}
                    </div>
                  ) : colCards.map(card => (
                    <div key={card.id} draggable onDragStart={() => onDragStart(card.id)} onDragEnd={onDragEnd} style={{ opacity: dragging === card.id ? 0.5 : 1, cursor: 'grab' }}>
                      <CardItem card={card} estagios={estagios} onMover={mover} onSalvarNota={salvarNota} tenant={tenant?.nome || 'nossa loja'} />
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
    </div>
  );
}
