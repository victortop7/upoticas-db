// Permissões do Connect LAB por perfil de operador.
// Perfis do sistema: admin (tudo), digitador (operação), financeiro (financeiro).
// Perfis legados (vendedor/caixa/marketing) são mapeados para os novos.

export type PerfilLab = 'admin' | 'digitador' | 'financeiro';

export const PERFIS_LAB: { valor: PerfilLab; label: string; desc: string; cor: string }[] = [
  { valor: 'admin',      label: 'Administrador', desc: 'Acesso total, incluindo o painel de análise e configurações.', cor: '#0a8a2a' },
  { valor: 'digitador',  label: 'Digitador',     desc: 'Cadastra OS, move a produção e vê óticas/estoque. Sem painel nem financeiro.', cor: '#1069c0' },
  { valor: 'financeiro', label: 'Financeiro',    desc: 'Faturamento, contas e bancário. Sem painel de análise.', cor: '#a07500' },
];

// Letras de módulo (iguais às do menu). admin = tudo.
const MODULOS_POR_PERFIL: Record<PerfilLab, string[]> = {
  admin:      ['A','B','C','D','E','F','G','H','I','J','K','L'],
  digitador:  ['B','C','D','E','G','H'],
  financeiro: ['B','J','K','L'],
};

// normaliza qualquer perfil (inclusive legados) para um dos três
export function normPerfil(p?: string | null): PerfilLab {
  if (p === 'admin') return 'admin';
  if (p === 'financeiro' || p === 'caixa') return 'financeiro';
  return 'digitador'; // vendedor, marketing, digitador ou indefinido
}

export function isAdmin(p?: string | null): boolean { return normPerfil(p) === 'admin'; }

// Só o admin vê o Painel Principal (dashboard com análise/faturamento)
export function podeDashboard(p?: string | null): boolean { return normPerfil(p) === 'admin'; }

export function podeModulo(p: string | null | undefined, letra: string): boolean {
  return MODULOS_POR_PERFIL[normPerfil(p)].includes(letra);
}

// Página inicial de cada perfil (para onde vai ao logar / ao cair num lugar sem permissão)
export function homeLab(p?: string | null): string {
  const n = normPerfil(p);
  if (n === 'admin') return '/lab/dashboard';
  if (n === 'financeiro') return '/lab/faturamento-lab';
  return '/lab/fluxo';
}

export function perfilLabel(p?: string | null): string {
  return PERFIS_LAB.find(x => x.valor === normPerfil(p))?.label ?? 'Digitador';
}
export function perfilCor(p?: string | null): string {
  return PERFIS_LAB.find(x => x.valor === normPerfil(p))?.cor ?? '#1069c0';
}
