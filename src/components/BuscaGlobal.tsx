import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface ResultadoBusca {
  clientes: { id: string; nome: string; cpf?: string; celular?: string; cidade?: string; uf?: string }[];
  os: { id: string; numero: number; situacao: string; valor_total: number; cliente_nome: string }[];
  vendas: { id: string; numero: number; valor_final: number; forma_pagamento?: string; cliente_nome?: string }[];
}

const SITUACAO_LABEL: Record<string, string> = {
  orcamento: 'Orçamento', aprovado: 'Aprovado', em_producao: 'Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export default function BuscaGlobal() {
  const [aberto, setAberto] = useState(false);
  const [query, setQuery] = useState('');
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [loading, setLoading] = useState(false);
  const [selecionado, setSelecionado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Abre com Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAberto(a => !a);
      }
      if (e.key === 'Escape') setAberto(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Foca o input ao abrir
  useEffect(() => {
    if (aberto) {
      setQuery('');
      setResultado(null);
      setSelecionado(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [aberto]);

  // Busca com debounce
  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setResultado(null); return; }
    setLoading(true);
    try {
      const res = await api.get<ResultadoBusca>(`/busca?q=${encodeURIComponent(q)}`);
      setResultado(res);
      setSelecionado(0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscar(query), 250);
    return () => clearTimeout(t);
  }, [query, buscar]);

  // Itens navegáveis (flatten)
  const itens = resultado ? [
    ...resultado.clientes.map(c => ({ tipo: 'cliente' as const, id: c.id, label: c.nome, sub: c.celular || c.cpf || (c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ''}` : ''), path: '/clientes' })),
    ...resultado.os.map(o => ({ tipo: 'os' as const, id: o.id, label: `OS #${String(o.numero).padStart(4, '0')} — ${o.cliente_nome}`, sub: `${SITUACAO_LABEL[o.situacao]} · ${brl(o.valor_total)}`, path: '/os' })),
    ...resultado.vendas.map(v => ({ tipo: 'venda' as const, id: v.id, label: `Venda #${String(v.numero).padStart(4, '0')}${v.cliente_nome ? ` — ${v.cliente_nome}` : ''}`, sub: brl(v.valor_final), path: '/vendas' })),
  ] : [];

  // Navega com teclado
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelecionado(s => Math.min(s + 1, itens.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelecionado(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && itens[selecionado]) { navegar(itens[selecionado].path); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto, itens, selecionado]);

  function navegar(path: string) {
    navigate(path);
    setAberto(false);
  }

  const ICONE: Record<string, string> = { cliente: '👤', os: '🔧', venda: '🛒' };
  const TIPO_LABEL: Record<string, string> = { cliente: 'Cliente', os: 'OS', venda: 'Venda' };

  const totalResultados = (resultado?.clientes.length || 0) + (resultado?.os.length || 0) + (resultado?.vendas.length || 0);

  if (!aberto) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={e => e.target === e.currentTarget && setAberto(false)}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '560px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden', margin: '0 16px',
      }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: itens.length > 0 || loading ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: '18px', opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar cliente, OS, venda..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: '16px',
              background: 'transparent', color: 'var(--text)',
            }}
          />
          {loading && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>...</span>}
          <kbd style={{
            fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
            background: 'var(--surface-alt)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontFamily: 'var(--mono)',
          }}>ESC</kbd>
        </div>

        {/* Resultados */}
        {query.length >= 2 && !loading && resultado && (
          <>
            {totalResultados === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                Nenhum resultado para "<strong>{query}</strong>"
              </div>
            ) : (
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {itens.map((item, i) => {
                  const isFirst = i === 0 || itens[i - 1]?.tipo !== item.tipo;
                  return (
                    <div key={item.id}>
                      {isFirst && (
                        <div style={{ padding: '8px 20px 4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
                          {TIPO_LABEL[item.tipo]}
                        </div>
                      )}
                      <div
                        onClick={() => navegar(item.path)}
                        onMouseEnter={() => setSelecionado(i)}
                        style={{
                          padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                          background: selecionado === i ? 'var(--primary-dim)' : 'transparent',
                          borderLeft: selecionado === i ? '3px solid var(--primary)' : '3px solid transparent',
                          transition: 'background 0.1s',
                        }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{ICONE[item.tipo]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </div>
                          {item.sub && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: item.tipo !== 'cliente' ? 'var(--mono)' : 'var(--sans)' }}>
                              {item.sub}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>↵</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Dicas de teclado */}
        <div style={{
          display: 'flex', gap: '16px', padding: '10px 20px',
          borderTop: totalResultados > 0 ? '1px solid var(--border)' : 'none',
          background: 'var(--surface-alt)',
        }}>
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['ESC', 'fechar']].map(([key, label]) => (
            <span key={key} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={{ padding: '1px 5px', borderRadius: '3px', background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: '11px' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
