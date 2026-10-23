import { useState } from 'react';
import { MENU_GRUPOS, TODOS_MENUS, menusPadrao } from '../lib/permissoes';
import Icone from './Icone';

// Editor de permissões de um usuário: cargo, loja, ver todas as lojas e telas liberadas.
// Usado pelo administrador da ótica (tela Usuários).
export type PermUsuario = { menus?: string[] | null; todas_lojas?: boolean } | null;
export type UsuarioPerm = { id: string; nome: string; perfil: string; loja_id?: string | null; permissoes?: PermUsuario };
export type LojaPerm = { id: string; nome: string };
export type DadosPermissoes = { perfil: string; loja_id: string | null; permissoes: PermUsuario };

export const CARGOS = [
  { v: 'admin', l: 'Administrador (vê tudo)' },
  { v: 'vendedor', l: 'Vendedor' },
  { v: 'caixa', l: 'Caixa' },
  { v: 'financeiro', l: 'Financeiro' },
  { v: 'marketing', l: 'Marketing' },
];

const GRUPO_NOME: Record<string, string> = { Menu: 'Principal' };

export default function EditorPermissoes({ u, lojas, euMesmo, onSalvar, onCancelar }: {
  u: UsuarioPerm; lojas: LojaPerm[]; euMesmo?: boolean;
  onSalvar: (d: DadosPermissoes) => Promise<void>; onCancelar: () => void;
}) {
  const [perfil, setPerfil] = useState(u.perfil);
  const [loja, setLoja] = useState(u.loja_id || '');
  const [todas, setTodas] = useState(Boolean(u.permissoes?.todas_lojas));
  const [menus, setMenus] = useState<string[]>(Array.isArray(u.permissoes?.menus) ? u.permissoes!.menus! : menusPadrao(u.perfil));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const isAdm = perfil === 'admin';
  const alternar = (to: string) => setMenus(m => (m.includes(to) ? m.filter(x => x !== to) : [...m, to]));

  async function salvar() {
    if (!isAdm && !menus.length) { setErro('Libere pelo menos uma tela.'); return; }
    setSalvando(true); setErro('');
    try {
      await onSalvar({
        perfil, loja_id: isAdm ? null : (loja || null),
        permissoes: isAdm ? null : { menus: TODOS_MENUS.filter(m => menus.includes(m)), todas_lojas: todas },
      });
    } catch (e) { setErro(e instanceof Error ? e.message.replace(/\s*\(HTTP \d+\)$/, '') : 'Erro ao salvar'); setSalvando(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 13.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 };
  const chip = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, padding: '6px 9px', borderRadius: 6,
    color: on ? 'var(--text)' : 'var(--text-muted)', border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary-dim)' : 'transparent',
  });
  const link: React.CSSProperties = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'var(--primary)' };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Cargo</label>
          <select style={inp} value={perfil} disabled={euMesmo} onChange={e => { setPerfil(e.target.value); setMenus(menusPadrao(e.target.value)); }}>
            {CARGOS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            {!CARGOS.some(o => o.v === perfil) && <option value={perfil}>{perfil}</option>}
          </select>
          {euMesmo && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Você não pode mudar o seu próprio cargo.</div>}
        </div>
        <div>
          <label style={lbl}>Loja</label>
          <select style={inp} value={isAdm ? '' : loja} disabled={isAdm} onChange={e => setLoja(e.target.value)}>
            <option value="">{lojas.length ? 'Sem loja definida' : 'Conta sem lojas'}</option>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
      </div>

      {isAdm ? (
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>O administrador vê todas as telas e todas as lojas.</div>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={todas} onChange={e => setTodas(e.target.checked)} />
            Ver dados de <b>todas as lojas</b>
            {loja && !todas && <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>(desmarcado: só a loja dela)</span>}
          </label>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={lbl}>Telas que pode acessar</span>
              <span style={{ display: 'flex', gap: 12 }}>
                <button type="button" style={link} onClick={() => setMenus(TODOS_MENUS)}>todas</button>
                <button type="button" style={link} onClick={() => setMenus(menusPadrao(perfil))}>padrão do cargo</button>
                <button type="button" style={{ ...link, color: 'var(--text-muted)' }} onClick={() => setMenus([])}>nenhuma</button>
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {MENU_GRUPOS.map(g => (
                <div key={g.label}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 5 }}>{GRUPO_NOME[g.label] || g.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {g.items.map(i => (
                      <label key={i.to} style={chip(menus.includes(i.to))}>
                        <input type="checkbox" checked={menus.includes(i.to)} onChange={() => alternar(i.to)} style={{ margin: 0 }} />
                        <Icone nome={i.icon} size={14} /> {i.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {erro && <div style={{ color: 'var(--red)', fontSize: 13 }}>{erro}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancelar} style={{ padding: '9px 16px', fontSize: 13.5, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
        <button type="button" onClick={salvar} disabled={salvando} style={{ padding: '9px 18px', fontSize: 13.5, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>{salvando ? 'Salvando...' : 'Salvar permissões'}</button>
      </div>
    </div>
  );
}
