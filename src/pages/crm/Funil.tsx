import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { whatsappLink, foneValido, aplicarVariaveis } from '../../lib/whatsapp';
import { useAuth } from '../../hooks/useAuth';

interface Card {
  id: string; estagio: string; prioridade: string; notas: string | null;
  cliente_id: string; nome: string; celular?: string; telefone?: string;
  email?: string; cidade?: string; uf?: string; data_nascimento?: string;
  ultima_os?: string; ultima_venda?: string; total_os: number; total_gasto: number;
  updated_at: string;
}

const ESTAGIOS = [
  { key: 'novo',       label: 'Novos',      icon: '🆕', color: '#64748b' },
  { key: 'contato',    label: 'Contato',    icon: '📞', color: '#2563eb' },
  { key: 'pos_venda',  label: 'Pós-venda',  icon: '💰', color: '#16a34a' },
  { key: 'aniversario',label: 'Aniversário',icon: '🎂', color: '#d97706' },
  { key: 'indicacao',  label: 'Indicação',  icon: '👥', color: '#7c3aed' },
  { key: 'reativacao', label: 'Reativação', icon: '🔄', color: '#dc2626' },
  { key: 'vip',        label: 'VIP',        icon: '⭐', color: '#b45309' },
];

const MSG_PADRAO: Record<string, string> = {
  novo:        'Olá {nome}! Seja bem-vindo à {loja}! 😊 Qualquer dúvida, estamos à disposição.',
  contato:     'Olá {nome}, tudo bem? Passando para saber se posso te ajudar com algo na {loja}.',
  pos_venda:   'Olá {nome}! Espero que esteja satisfeito com sua compra na {loja}. Precisando de ajuste ou dúvida, é só falar! 😊',
  aniversario: 'Olá {nome}! 🎂 Feliz aniversário! Temos uma surpresa especial para você na {loja}. Venha nos visitar!',
  indicacao:   'Olá {nome}! Que tal indicar um amigo para a {loja}? Por cada indicação você ganha um desconto especial na próxima compra! 👥',
  reativacao:  'Olá {nome}, sentimos sua falta! 😊 Temos novidades esperando por você na {loja}. Venha conferir!',
  vip:         'Olá {nome}! Como nosso cliente especial, você tem acesso antecipado às nossas novas coleções. Entre em contato! ⭐',
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
function proximoAniversario(dataNasc?: string): string | null {
  if (!dataNasc) return null;
  const [, m, d] = dataNasc.split('-');
  const hoje = new Date();
  const aniv = new Date(hoje.getFullYear(), parseInt(m) - 1, parseInt(d));
  if (aniv < hoje) aniv.setFullYear(hoje.getFullYear() + 1);
  const diff = Math.ceil((aniv.getTime() - hoje.getTime()) / 86400000);
  if (diff === 0) return '🎂 Hoje!';
  if (diff <= 7) return `🎂 Em ${diff} dias`;
  if (diff <= 30) return `🎂 Em ${diff} dias`;
  return null;
}

function CardItem({ card, onMover, onSalvarNota, tenant }: {
  card: Card;
  onMover: (id: string, estagio: string) => void;
  onSalvarNota: (id: string, nota: string) => void;
  tenant: string;
}) {
  const [expandido, setExpandido] = useState(false);
  const [nota, setNota] = useState(card.notas || '');
  const [movMenu, setMovMenu] = useState(false);

  const fone = card.celular || card.telefone || '';
  const temFone = foneValido(fone);
  const aniv = proximoAniversario(card.data_nascimento);
  const ultimaAtiv = card.ultima_os || card.ultima_venda;
  const estagio = ESTAGIOS.find(e => e.key === card.estagio);

  function abrirWhatsApp() {
    const msg = aplicarVariaveis(MSG_PADRAO[card.estagio] || MSG_PADRAO.novo, {
      nome: card.nome.split(' ')[0],
      loja: tenant,
    });
    window.open(whatsappLink(fone, msg), '_blank');
  }

  function salvarNota() {
    onSalvarNota(card.id, nota);
  }

  const priorCor: Record<string, string> = { alta: '#dc2626', normal: '#64748b', baixa: '#94a3b8' };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', marginBottom: '8px',
      borderLeft: `3px solid ${estagio?.color || 'var(--border)'}`,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ padding: '12px 14px' }}>
        {/* Nome + prioridade */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <button
            onClick={() => setExpandido(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          >
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{card.nome}</span>
          </button>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {aniv && (
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#d97706', background: 'rgba(217,119,6,0.1)', padding: '1px 6px', borderRadius: '10px' }}>{aniv}</span>
            )}
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorCor[card.prioridade] }} title={`Prioridade: ${card.prioridade}`} />
          </div>
        </div>

        {/* Info rápida */}
        {card.cidade && (
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            📍 {card.cidade}{card.uf ? `/${card.uf}` : ''}
          </p>
        )}
        {temFone && (
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            {fone}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          {card.total_os > 0 && (
            <span style={{ fontSize: '10px', background: 'rgba(37,99,235,0.08)', color: '#2563eb', padding: '1px 6px', borderRadius: '10px' }}>
              {card.total_os} OS
            </span>
          )}
          {card.total_gasto > 0 && (
            <span style={{ fontSize: '10px', background: 'rgba(22,163,74,0.08)', color: '#16a34a', padding: '1px 6px', borderRadius: '10px' }}>
              {brl(card.total_gasto)}
            </span>
          )}
          {ultimaAtiv && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {diasAtras(ultimaAtiv)}
            </span>
          )}
        </div>

        {/* Nota prévia */}
        {card.notas && !expandido && (
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            💬 {card.notas}
          </p>
        )}

        {/* Ações */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', alignItems: 'center' }}>
          {temFone ? (
            <button onClick={abrirWhatsApp} style={{
              flex: 1, padding: '6px 0', fontSize: '12px', fontWeight: '600',
              background: '#25D366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.296 19.935l.646-2.352a9.15 9.15 0 01-1.225-4.61C4.72 7.867 8.572 4 13.28 4a8.549 8.549 0 016.073 2.513 8.633 8.633 0 012.511 6.109c-.002 4.767-3.854 8.634-8.562 8.634a8.57 8.57 0 01-4.097-1.04L5.296 19.935zm2.454-1.414l.261.155a7.11 7.11 0 003.441.893c3.938 0 7.141-3.217 7.143-7.172a7.18 7.18 0 00-2.088-5.085 7.112 7.112 0 00-5.052-2.106c-3.942 0-7.145 3.217-7.145 7.17 0 1.356.375 2.68 1.084 3.829l.169.267-.714 2.601 2.901-.552z"/></svg>
              WhatsApp
            </button>
          ) : (
            <span style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>Sem telefone</span>
          )}

          {/* Mover */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMovMenu(m => !m)} style={{
              padding: '6px 8px', fontSize: '12px', background: 'var(--surface-alt)',
              color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
            }} title="Mover para estágio">
              ⇄
            </button>
            {movMenu && (
              <div style={{
                position: 'absolute', bottom: '100%', right: 0, marginBottom: '4px',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
                padding: '6px', minWidth: '160px', zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
                {ESTAGIOS.filter(e => e.key !== card.estagio).map(e => (
                  <button key={e.key} onClick={() => { onMover(card.id, e.key); setMovMenu(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '7px 10px', fontSize: '13px', background: 'none', border: 'none',
                    borderRadius: '6px', cursor: 'pointer', color: 'var(--text-dim)', textAlign: 'left',
                  }}
                    onMouseEnter={e2 => (e2.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e2 => (e2.currentTarget.style.background = 'none')}
                  >
                    <span>{e.icon}</span> {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Expandir */}
          <button onClick={() => setExpandido(e => !e)} style={{
            padding: '6px 8px', fontSize: '12px', background: 'var(--surface-alt)',
            color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
          }} title="Notas">
            {expandido ? '▲' : '▼'}
          </button>
        </div>

        {/* Expansão: notas + prioridade */}
        {expandido && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            {/* Prioridade */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prioridade:</span>
              {(['baixa', 'normal', 'alta'] as const).map(p => (
                <button key={p} onClick={() => onSalvarNota(card.id, nota)} style={{
                  padding: '2px 8px', fontSize: '11px', borderRadius: '10px', cursor: 'pointer', border: 'none',
                  background: card.prioridade === p ? priorCor[p] : 'var(--surface-alt)',
                  color: card.prioridade === p ? 'white' : 'var(--text-muted)',
                }}>{p}</button>
              ))}
            </div>

            {/* Nota */}
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Adicionar nota..."
              style={{
                width: '100%', minHeight: '70px', padding: '8px', fontSize: '12px',
                border: '1px solid var(--border)', borderRadius: '6px',
                background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none',
                resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5',
              }}
              onBlur={salvarNota}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Atualizado {diasAtras(card.updated_at)}
              </span>
              <button onClick={salvarNota} style={{
                padding: '4px 10px', fontSize: '11px', fontWeight: '600',
                background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
              }}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Funil() {
  const { tenant } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCards(await api.get<Card[]>('/crm')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function mover(id: string, estagio: string) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, estagio, updated_at: new Date().toISOString() } : c));
    await api.put(`/crm/${id}`, { estagio, prioridade: card.prioridade, notas: card.notas }).catch(() => load());
  }

  async function salvarNota(id: string, notas: string) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, notas, updated_at: new Date().toISOString() } : c));
    await api.put(`/crm/${id}`, { estagio: card.estagio, prioridade: card.prioridade, notas }).catch(() => {});
  }

  // Drag and drop handlers
  function onDragStart(cardId: string) { setDragging(cardId); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  function onDragOver(e: React.DragEvent, estagio: string) { e.preventDefault(); setDragOver(estagio); }
  function onDrop(estagio: string) {
    if (dragging) mover(dragging, estagio);
    setDragging(null);
    setDragOver(null);
  }

  const buscaLower = busca.toLowerCase();
  const cardsFiltrados = cards.filter(c =>
    !busca || c.nome.toLowerCase().includes(buscaLower) ||
    c.celular?.includes(busca) || c.telefone?.includes(busca)
  );

  const totalPorEstagio = Object.fromEntries(
    ESTAGIOS.map(e => [e.key, cards.filter(c => c.estagio === e.key).length])
  );

  return (
    <div style={{ padding: '24px 32px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Funil CRM</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>
            {cards.length} clientes · arraste ou use ⇄ para mover entre estágios
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              padding: '8px 12px', fontSize: '13px', width: '200px',
              border: '1px solid var(--border)', borderRadius: '8px',
              background: 'var(--surface)', color: 'var(--text)', outline: 'none',
            }}
          />
          <button onClick={load} style={{
            padding: '8px 14px', fontSize: '13px', background: 'var(--surface)',
            color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
          }}>↺ Atualizar</button>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Carregando funil...
        </div>
      ) : (
        /* Kanban Board */
        <div style={{
          flex: 1, display: 'flex', gap: '12px',
          overflowX: 'auto', overflowY: 'hidden',
          paddingBottom: '8px',
        }}>
          {ESTAGIOS.map(estagio => {
            const colCards = cardsFiltrados.filter(c => c.estagio === estagio.key);
            const isOver = dragOver === estagio.key;

            return (
              <div
                key={estagio.key}
                onDragOver={e => onDragOver(e, estagio.key)}
                onDrop={() => onDrop(estagio.key)}
                style={{
                  width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column',
                  background: isOver ? `${estagio.color}10` : 'var(--surface-alt)',
                  border: `1px solid ${isOver ? estagio.color : 'var(--border)'}`,
                  borderRadius: '12px', transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {/* Header da coluna */}
                <div style={{
                  padding: '12px 14px 10px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontSize: '16px' }}>{estagio.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{estagio.label}</span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', minWidth: '22px', height: '22px',
                    borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: totalPorEstagio[estagio.key] > 0 ? estagio.color : 'var(--surface)',
                    color: totalPorEstagio[estagio.key] > 0 ? 'white' : 'var(--text-muted)',
                  }}>
                    {totalPorEstagio[estagio.key]}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 4px' }}>
                  {colCards.length === 0 ? (
                    <div style={{
                      padding: '20px 10px', textAlign: 'center', fontSize: '12px',
                      color: 'var(--text-muted)', border: '1px dashed var(--border)',
                      borderRadius: '8px', margin: '4px 0',
                    }}>
                      {isOver ? 'Soltar aqui' : 'Nenhum cliente'}
                    </div>
                  ) : (
                    colCards.map(card => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => onDragStart(card.id)}
                        onDragEnd={onDragEnd}
                        style={{ opacity: dragging === card.id ? 0.5 : 1, cursor: 'grab' }}
                      >
                        <CardItem
                          card={card}
                          onMover={mover}
                          onSalvarNota={salvarNota}
                          tenant={tenant?.nome || 'nossa loja'}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
