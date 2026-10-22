// Permissões por usuário do Connect Óticas.
// Sem permissões personalizadas, vale o padrão do perfil (como sempre foi).

export type ItemMenu = { to: string; label: string; icon: string };
export type GrupoMenu = { label: string; items: ItemMenu[] };

export const MENU_GRUPOS: GrupoMenu[] = [
  { label: 'Menu', items: [
    { to: '/dashboard', label: 'Painel', icon: 'painel' },
    { to: '/clientes', label: 'Clientes', icon: 'clientes' },
    { to: '/os', label: 'Ordens de Serviço', icon: 'os' },
    { to: '/vendas', label: 'Vendas', icon: 'vendas' },
    { to: '/crm', label: 'Funil CRM', icon: 'crm' },
    { to: '/relatorios', label: 'Relatórios', icon: 'relatorios' },
  ] },
  { label: 'Financeiro', items: [
    { to: '/financeiro/caixa', label: 'Caixa', icon: 'caixa' },
    { to: '/faturamento', label: 'Faturamento', icon: 'faturamento' },
    { to: '/financeiro/contas-pagar', label: 'Contas a Pagar', icon: 'pagar' },
    { to: '/financeiro/contas-receber', label: 'Contas a Receber', icon: 'receber' },
    { to: '/carnes', label: 'Carnês / Boletos', icon: 'carne' },
    { to: '/financeiro/fluxo', label: 'Fluxo Financeiro', icon: 'fluxo' },
    { to: '/financeiro/contas', label: 'Contas', icon: 'contas' },
    { to: '/bancario', label: 'Controle Bancário', icon: 'bancario' },
  ] },
  { label: 'Marketing', items: [
    { to: '/marketing/campanhas', label: 'Campanhas', icon: 'campanhas' },
    { to: '/marketing/aniversariantes', label: 'Aniversariantes', icon: 'aniversario' },
    { to: '/marketing/modelos', label: 'Modelos', icon: 'modelos' },
    { to: '/marketing/historico', label: 'Histórico', icon: 'historico' },
  ] },
  { label: 'Cadastros', items: [
    { to: '/fornecedores', label: 'Fornecedores', icon: 'fornecedores' },
    { to: '/medicos', label: 'Médicos / Oftalmos', icon: 'medicos' },
    { to: '/produtos', label: 'Produtos / Serviços', icon: 'produtos' },
    { to: '/estoque', label: 'Estoque', icon: 'estoque' },
  ] },
  { label: 'Sistema', items: [
    { to: '/vendedores', label: 'Vendedores / Ranking', icon: 'ranking' },
    { to: '/lojas', label: 'Lojas & Acessos', icon: 'lojas' },
    { to: '/usuarios', label: 'Usuários', icon: 'usuarios' },
    { to: '/configuracoes', label: 'Configurações', icon: 'config' },
  ] },
];

export const TODOS_MENUS = MENU_GRUPOS.flatMap(g => g.items.map(i => i.to));

export interface Permissoes {
  menus?: string[] | null;     // telas liberadas; null/ausente = padrão do perfil
  todas_lojas?: boolean;       // enxerga todas as lojas mesmo sem ser admin
}

// O que cada perfil vê quando não há permissão personalizada (comportamento antigo)
export function menusPadrao(perfil?: string | null): string[] {
  if (perfil === 'admin') return TODOS_MENUS;
  if (perfil === 'marketing') return ['/vendas', '/crm'];
  return [...MENU_GRUPOS[0].items.map(i => i.to), '/vendedores', ...MENU_GRUPOS[2].items.map(i => i.to)];
}

export function menusDo(usuario: { perfil?: string; permissoes?: Permissoes | null } | null | undefined): string[] {
  if (usuario?.perfil === 'admin') return TODOS_MENUS;
  const m = usuario?.permissoes?.menus;
  return Array.isArray(m) ? m.filter(x => TODOS_MENUS.includes(x)) : menusPadrao(usuario?.perfil);
}

// A rota atual está liberada? (/relatorios/exportar entra em /relatorios)
export function rotaLiberada(path: string, menus: string[]): boolean {
  return menus.some(m => path === m || path.startsWith(m + '/'));
}
