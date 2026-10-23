// De onde veio o cliente da venda (marcado na tela de Venda)
export const ORIGENS: { v: string; l: string }[] = [
  { v: 'trafego_pago', l: 'Tráfego pago' },
  { v: 'indicacao', l: 'Indicação' },
  { v: 'fluxo_loja', l: 'Fluxo de loja' },
  { v: 'instagram', l: 'Instagram' },
  { v: 'google', l: 'Google' },
  { v: 'site', l: 'Site' },
  { v: 'cliente_antigo', l: 'Cliente antigo' },
  { v: 'outro', l: 'Outro' },
];

export function nomeOrigem(v?: string | null) {
  if (!v || v === 'nao_informado') return 'Não informado';
  return ORIGENS.find(o => o.v === v)?.l || v;
}
