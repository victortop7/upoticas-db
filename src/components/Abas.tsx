import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { MENU_GRUPOS } from '../lib/permissoes';
import Icone from './Icone';

// Abas no topo, como janelas do navegador: cada tela aberta vira uma aba.
// A tela de uma aba em segundo plano continua montada (não perde o que estava digitado).

type Aba = { chave: string; path: string; titulo: string; icone: string; usadoEm: number };

const MAX_ABAS = 10;
const CHAVE_STORAGE = 'abas_abertas';
const INICIO = '/dashboard';

const ITENS = MENU_GRUPOS.flatMap(g => g.items);

// Telas que trocam de registro dentro da mesma aba (ex.: ficha do cliente com as setas)
function chaveDaRota(path: string) {
  if (/^\/clientes\/[^/]+$/.test(path)) return '/clientes/:id';
  return path;
}

function infoDaRota(path: string): { titulo: string; icone: string } {
  if (path === '/clientes/novo') return { titulo: 'Novo cliente', icone: 'novo' };
  if (/^\/clientes\/[^/]+$/.test(path)) return { titulo: 'Cliente', icone: 'usuario' };
  if (path === '/relatorios/exportar') return { titulo: 'Relatório personalizado', icone: 'relatorios' };
  const exato = ITENS.find(i => i.to === path);
  if (exato) return { titulo: exato.label, icone: exato.icon };
  const pai = ITENS.filter(i => path.startsWith(i.to + '/')).sort((a, b) => b.to.length - a.to.length)[0];
  if (pai) return { titulo: pai.label, icone: pai.icon };
  return { titulo: 'Tela', icone: 'painel' };
}

function lerAbas(): Aba[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAVE_STORAGE) || '[]');
    return Array.isArray(v) ? v.filter(a => a && a.chave && a.path) : [];
  } catch { return []; }
}

const TituloCtx = createContext<(chave: string, titulo: string) => void>(() => {});

// A tela pode dar um nome melhor à própria aba (ex.: nome do cliente)
export function useTituloAba(titulo: string | undefined | null) {
  const set = useContext(TituloCtx);
  const { pathname } = useLocation();
  const chave = useRef(chaveDaRota(pathname)).current; // fixa na aba onde a tela nasceu
  useEffect(() => { if (titulo) set(chave, titulo); }, [titulo, chave, set]);
}

export default function AreaComAbas({ topo }: { topo?: React.ReactNode }) {
  const outlet = useOutlet();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [abas, setAbas] = useState<Aba[]>(lerAbas);
  const telas = useRef(new Map<string, { path: string; el: React.ReactNode }>());
  const chaveAtual = chaveDaRota(pathname);

  // guarda a tela da rota atual (troca o conteúdo se a mesma aba mudou de registro)
  const guardada = telas.current.get(chaveAtual);
  if (outlet && (!guardada || guardada.path !== pathname)) telas.current.set(chaveAtual, { path: pathname, el: outlet });

  // abre/atualiza a aba da rota atual
  useEffect(() => {
    setAbas(lista => {
      const agora = Date.now();
      const existe = lista.find(a => a.chave === chaveAtual);
      let nova: Aba[];
      if (existe) {
        nova = lista.map(a => a.chave === chaveAtual
          ? { ...a, path: pathname + search, usadoEm: agora, ...(a.path.split('?')[0] !== pathname ? { titulo: infoDaRota(pathname).titulo } : {}) }
          : a);
      } else {
        nova = [...lista, { chave: chaveAtual, path: pathname + search, ...infoDaRota(pathname), usadoEm: agora }];
      }
      // limite de abas: fecha a usada há mais tempo (nunca a atual)
      while (nova.length > MAX_ABAS) {
        const velha = nova.filter(a => a.chave !== chaveAtual).sort((a, b) => a.usadoEm - b.usadoEm)[0];
        if (!velha) break;
        telas.current.delete(velha.chave);
        nova = nova.filter(a => a.chave !== velha.chave);
      }
      return nova;
    });
  }, [chaveAtual, pathname, search]);

  useEffect(() => {
    try { sessionStorage.setItem(CHAVE_STORAGE, JSON.stringify(abas)); } catch { /* sem storage */ }
  }, [abas]);

  const mudarTitulo = useCallback((chave: string, titulo: string) => {
    setAbas(lista => lista.map(a => (a.chave === chave && a.titulo !== titulo ? { ...a, titulo } : a)));
  }, []);

  // a aba da rota atual entra na lista já neste render (evita montar a tela duas vezes)
  const lista: Aba[] = abas.some(a => a.chave === chaveAtual)
    ? abas
    : [...abas, { chave: chaveAtual, path: pathname + search, ...infoDaRota(pathname), usadoEm: Date.now() }];

  function fechar(chave: string) {
    const idx = abas.findIndex(a => a.chave === chave);
    const resto = abas.filter(a => a.chave !== chave);
    telas.current.delete(chave);
    setAbas(resto);
    if (chave === chaveAtual) {
      const vizinha = resto[Math.min(idx, resto.length - 1)];
      navigate(vizinha ? vizinha.path : INICIO);
    }
  }

  return (
    <TituloCtx.Provider value={mudarTitulo}>
      <div style={{ position: 'sticky', top: 0, zIndex: 60 }}>
        {topo}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, padding: '6px 10px 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {lista.map(a => {
            const ativa = a.chave === chaveAtual;
            return (
              <div key={a.chave}
                onClick={() => { if (!ativa) navigate(a.path); }}
                onAuxClick={e => { if (e.button === 1 && lista.length > 1) { e.preventDefault(); fechar(a.chave); } }}
                title={a.titulo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, height: 32, padding: '0 6px 0 11px',
                  minWidth: 110, maxWidth: 210, flexShrink: 0, cursor: ativa ? 'default' : 'pointer', userSelect: 'none',
                  borderRadius: '7px 7px 0 0', marginBottom: -1,
                  background: ativa ? 'var(--bg)' : 'transparent',
                  border: `1px solid ${ativa ? 'var(--border)' : 'transparent'}`, borderBottom: ativa ? '1px solid var(--bg)' : '1px solid transparent',
                  color: ativa ? 'var(--text)' : 'var(--text-muted)', fontSize: 12.5, fontWeight: ativa ? 600 : 500,
                }}
                onMouseEnter={e => { if (!ativa) e.currentTarget.style.background = 'var(--surface-alt)'; }}
                onMouseLeave={e => { if (!ativa) e.currentTarget.style.background = 'transparent'; }}>
                <Icone nome={a.icone} size={14} color={ativa ? 'var(--primary)' : undefined} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titulo}</span>
                {lista.length > 1 && (
                  <button title="Fechar aba" onClick={e => { e.stopPropagation(); fechar(a.chave); }}
                    style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 4, color: 'var(--text-muted)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    <Icone nome="fechar" size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* todas as telas abertas ficam montadas; só a da aba ativa aparece */}
      {lista.map(a => {
        const tela = telas.current.get(a.chave);
        if (!tela) return null;
        return (
          <div key={a.chave + '|' + tela.path} style={{ display: a.chave === chaveAtual ? 'block' : 'none' }}>
            {tela.el}
          </div>
        );
      })}
    </TituloCtx.Provider>
  );
}
