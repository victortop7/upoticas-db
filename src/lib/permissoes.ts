// Permissões por usuário do Connect Óticas.
// Sem permissões personalizadas, vale o padrão do perfil (como sempre foi).

export type ItemMenu = { to: string; label: string; icon: string };
export type GrupoMenu = { label: string; items: ItemMenu[] };

export const MENU_GRUPOS: GrupoMenu[] = [
  { label: 'Menu', items: [
    { to: '/dashboard', label: 'Painel', icon: '◉' },
    { to: '/clientes', label: 'Clientes', icon: '👤' },
    { to: '/os', label: 'Ordens de Serviço', icon: '🔧' },
    { to: '/vendas', label: 'Vendas', icon: '🛒' },
    { to: '/crm', label: 'Funil CRM', icon: '🎯' },
    { to: '/relatorios', label: 'Relatórios', icon: '📊' },
  ] },
  { label: 'Financeiro', items: [
    { to: '/financeiro/caixa', label: 'Caixa', icon: '💵' },
    { to: '/faturamento', label: 'Faturamento', icon: '🧾' },
    { to: '/financeiro/contas-pagar', label: 'Contas a Pagar', icon: '📤' },
    { to: '/financeiro/contas-receber', label: 'Contas a Receber', icon: '📥' },
    { to: '/carnes', label: 'Carnês / Boletos', icon: '🧾' },
    { to: '/financeiro/fluxo', label: 'Fluxo Financeiro', icon: '📈' },
    { to: '/financeiro/contas', label: 'Contas', icon: '🏦' },
    { to: '/bancario', label: 'Controle Bancário', icon: '🏛️' },
  ] },
  { label: 'Marketing', items: [
    { to: '/marketing/campanhas', label: 'Campanhas', icon: '📢' },
    { to: '/marketing/aniversariantes', label: 'Aniversariantes', icon: '🎂' },
    { to: '/marketing/modelos', label: 'Modelos', icon: '💬' },
    { to: '/marketing/historico', label: 'Histórico', icon: '📋' },
  ] },
  { label: 'Cadastros', items: [
    { to: '/fornecedores', label: 'Fornecedores', icon: '🏭' },
    { to: '/medicos', label: 'Médicos / Oftalmos', icon: '👨‍⚕️' },
    { to: '/produtos', label: 'Produtos / Serviços', icon: '📦' },
    { to: '/estoque', label: 'Estoque', icon: '🗂️' },
  ] },
  { label: 'Sistema', items: [
    { to: '/vendedores', label: 'Vendedores / Ranking', icon: '🏆' },
    { to: '/lojas', label: 'Lojas & Acessos', icon: '🏬' },
    { to: '/usuarios', label: 'Usuários', icon: '👥' },
    { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
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
