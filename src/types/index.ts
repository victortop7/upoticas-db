export interface Tenant {
  id: string;
  nome: string;
  email: string;
  tipo: 'otica' | 'lab';
  plano: 'trial' | 'basico' | 'pro';
  trial_expira?: string;
  ativo: boolean;
  created_at: string;
}

export interface Usuario {
  id: string;
  tenant_id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'vendedor' | 'caixa' | 'marketing';
  ativo: boolean;
}

export interface Cliente {
  id: string;
  tenant_id: string;
  nome: string;
  apelido?: string;
  cpf?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  data_nascimento?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  observacao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrdemServico {
  id: string;
  tenant_id: string;
  numero: number;
  cliente_id: string;
  cliente_nome?: string;
  tipo: 'oculos_grau' | 'oculos_sol' | 'lente_contato' | 'conserto' | 'outro';
  situacao: 'orcamento' | 'aprovado' | 'em_producao' | 'pronto' | 'entregue' | 'cancelado';
  longe_od_esf?: number;
  longe_od_cil?: number;
  longe_od_eixo?: number;
  longe_oe_esf?: number;
  longe_oe_cil?: number;
  longe_oe_eixo?: number;
  perto_od_esf?: number;
  perto_od_cil?: number;
  perto_od_eixo?: number;
  perto_oe_esf?: number;
  perto_oe_cil?: number;
  perto_oe_eixo?: number;
  dp?: number;
  altura?: number;
  adicao?: number;
  armacao_desc?: string;
  lente_desc?: string;
  valor_total: number;
  valor_entrada: number;
  valor_restante: number;
  data_entrega?: string;
  medico?: string;
  observacao?: string;
  funcionario_id?: string;
  funcionario_nome?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  tenant: Tenant | null;
}
