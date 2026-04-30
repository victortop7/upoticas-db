-- UpÓticas — Schema D1 (SQLite)

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'otica',        -- otica | lab
  plano TEXT NOT NULL DEFAULT 'trial',
  trial_expira TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'admin',
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  apelido TEXT,
  cpf TEXT,
  telefone TEXT,
  celular TEXT,
  email TEXT,
  data_nascimento TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  observacao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  numero INTEGER NOT NULL,
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  tipo TEXT NOT NULL DEFAULT 'oculos_grau',
  situacao TEXT NOT NULL DEFAULT 'orcamento',
  -- Grau longe
  longe_od_esf REAL, longe_od_cil REAL, longe_od_eixo REAL,
  longe_oe_esf REAL, longe_oe_cil REAL, longe_oe_eixo REAL,
  -- Grau perto
  perto_od_esf REAL, perto_od_cil REAL, perto_od_eixo REAL,
  perto_oe_esf REAL, perto_oe_cil REAL, perto_oe_eixo REAL,
  -- Medidas
  dp REAL, altura REAL, adicao REAL,
  -- Produtos
  armacao_desc TEXT,
  lente_desc TEXT,
  -- Financeiro
  valor_total REAL NOT NULL DEFAULT 0,
  valor_entrada REAL NOT NULL DEFAULT 0,
  valor_restante REAL NOT NULL DEFAULT 0,
  -- Info
  data_entrega TEXT,
  medico TEXT,
  observacao TEXT,
  funcionario_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, numero)
);

CREATE TABLE IF NOT EXISTS vendas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  numero INTEGER NOT NULL,
  cliente_id TEXT REFERENCES clientes(id),
  os_id TEXT REFERENCES ordens_servico(id),
  situacao TEXT NOT NULL DEFAULT 'ativa',
  valor_total REAL NOT NULL DEFAULT 0,
  desconto REAL NOT NULL DEFAULT 0,
  valor_final REAL NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  observacao TEXT,
  funcionario_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, numero)
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  fantasia TEXT,
  cnpj TEXT,
  ie TEXT,
  telefone TEXT,
  celular TEXT,
  email TEXT,
  contato TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  observacao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medicos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  crm TEXT,
  especialidade TEXT DEFAULT 'Oftalmologia',
  telefone TEXT,
  celular TEXT,
  email TEXT,
  clinica TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  observacao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  codigo TEXT,
  descricao TEXT NOT NULL,
  grupo TEXT,
  unidade TEXT NOT NULL DEFAULT 'UN',
  preco_custo REAL NOT NULL DEFAULT 0,
  preco_venda REAL NOT NULL DEFAULT 0,
  margem REAL GENERATED ALWAYS AS (
    CASE WHEN preco_custo > 0 THEN ROUND((preco_venda - preco_custo) / preco_custo * 100, 2) ELSE 0 END
  ) VIRTUAL,
  fornecedor_id TEXT REFERENCES fornecedores(id),
  observacao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos_precos_especiais (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  produto_id TEXT NOT NULL REFERENCES produtos(id),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  preco REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(produto_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS estoque (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  produto_id TEXT NOT NULL REFERENCES produtos(id),
  quantidade REAL NOT NULL DEFAULT 0,
  quantidade_minima REAL NOT NULL DEFAULT 0,
  quantidade_maxima REAL,
  localizacao TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, produto_id)
);

CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  produto_id TEXT NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL,
  quantidade REAL NOT NULL,
  quantidade_anterior REAL,
  quantidade_nova REAL,
  motivo TEXT,
  documento TEXT,
  fornecedor_id TEXT REFERENCES fornecedores(id),
  preco_unitario REAL,
  usuario_id TEXT REFERENCES usuarios(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faturas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  numero INTEGER NOT NULL,
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  situacao TEXT NOT NULL DEFAULT 'aberta',   -- aberta | paga | vencida | cancelada
  valor_total REAL NOT NULL DEFAULT 0,
  data_vencimento TEXT,
  data_pagamento TEXT,
  forma_pagamento TEXT,
  observacao TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, numero)
);

CREATE TABLE IF NOT EXISTS fatura_itens (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  fatura_id TEXT NOT NULL REFERENCES faturas(id),
  venda_id TEXT REFERENCES vendas(id),
  os_id TEXT REFERENCES ordens_servico(id),
  descricao TEXT NOT NULL,
  valor REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contas_bancarias (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo TEXT NOT NULL DEFAULT 'corrente',   -- corrente | poupanca | caixa | investimento
  saldo_inicial REAL NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lancamentos_bancarios (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  conta_id TEXT NOT NULL REFERENCES contas_bancarias(id),
  tipo TEXT NOT NULL,                       -- credito | debito
  valor REAL NOT NULL,
  historico TEXT NOT NULL,
  documento TEXT,
  data_lancamento TEXT NOT NULL,
  conciliado INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_tenant ON contas_bancarias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta ON lancamentos_bancarios(conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos_bancarios(tenant_id, data_lancamento);
CREATE INDEX IF NOT EXISTS idx_faturas_tenant ON faturas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON faturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fatura_itens ON fatura_itens(fatura_id);
CREATE INDEX IF NOT EXISTS idx_estoque_tenant ON estoque(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estoque_produto ON estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_tenant ON estoque_movimentacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_tenant ON produtos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produtos_grupo ON produtos(tenant_id, grupo);
CREATE INDEX IF NOT EXISTS idx_precos_especiais_produto ON produtos_precos_especiais(produto_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_tenant ON fornecedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medicos_tenant ON medicos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_os_tenant ON ordens_servico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_tenant ON vendas(tenant_id);

-- =============================================================
-- UpÓticas Lab — tabelas exclusivas para laboratórios ópticos
-- =============================================================

-- Óticas que são clientes do laboratório
CREATE TABLE IF NOT EXISTS lab_oticas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  observacao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Catálogo de serviços do laboratório (montagem, surfacagem, etc.)
CREATE TABLE IF NOT EXISTS lab_servicos_catalogo (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  valor_padrao REAL NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ordens de serviço do laboratório
CREATE TABLE IF NOT EXISTS lab_ordens (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  numero INTEGER NOT NULL,
  otica_id TEXT NOT NULL REFERENCES lab_oticas(id),
  vendedor TEXT,
  ref_otica TEXT,                              -- nº de referência da ótica
  status TEXT NOT NULL DEFAULT 'aguardando',   -- aguardando | producao | pronto | entregue | cancelado
  previsao_entrega TEXT,
  condicao_pgto TEXT,
  texto_gravura TEXT,
  observacoes TEXT,
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, numero)
);

-- Receita das lentes (OD e OE separados)
CREATE TABLE IF NOT EXISTS lab_receita (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  ordem_id TEXT NOT NULL REFERENCES lab_ordens(id),
  olho TEXT NOT NULL,       -- D | E
  esf_longe REAL,
  cil_longe REAL,
  eixo_longe INTEGER,
  dnp REAL,
  alt REAL,
  prisma TEXT,
  adicao REAL,
  esf_perto REAL,
  cil_perto REAL,
  eixo_perto INTEGER
);

-- Dados da armação
CREATE TABLE IF NOT EXISTS lab_armacao (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  ordem_id TEXT NOT NULL REFERENCES lab_ordens(id),
  material TEXT,
  estojo INTEGER NOT NULL DEFAULT 0,
  ponte REAL,
  diametro REAL,
  dplip REAL,
  informacoes TEXT
);

-- Serviços incluídos em cada OS (montagem, surfacagem, etc.)
CREATE TABLE IF NOT EXISTS lab_servicos_os (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  ordem_id TEXT NOT NULL REFERENCES lab_ordens(id),
  descricao TEXT NOT NULL,
  qtd REAL NOT NULL DEFAULT 1,
  valor_unit REAL NOT NULL DEFAULT 0,
  desconto REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);

-- Estoque de lentes do laboratório
CREATE TABLE IF NOT EXISTS lab_estoque (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  marca TEXT NOT NULL,
  tratamento TEXT NOT NULL DEFAULT 'Sem tratamento',
  indice TEXT NOT NULL,                         -- '1.50', '1.56', '1.61', '1.67', '1.74'
  tipo TEXT NOT NULL DEFAULT 'monofocal',       -- monofocal | bifocal | progressivo
  descricao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 5,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Movimentações de estoque (entrada/saída)
CREATE TABLE IF NOT EXISTS lab_estoque_movimentacoes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  produto_id TEXT NOT NULL REFERENCES lab_estoque(id),
  tipo TEXT NOT NULL,                           -- entrada | saida
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  ordem_id TEXT REFERENCES lab_ordens(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices Lab
CREATE INDEX IF NOT EXISTS idx_lab_oticas_tenant ON lab_oticas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lab_ordens_tenant ON lab_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lab_ordens_otica ON lab_ordens(otica_id);
CREATE INDEX IF NOT EXISTS idx_lab_ordens_status ON lab_ordens(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_receita_ordem ON lab_receita(ordem_id);
CREATE INDEX IF NOT EXISTS idx_lab_armacao_ordem ON lab_armacao(ordem_id);
CREATE INDEX IF NOT EXISTS idx_lab_servicos_ordem ON lab_servicos_os(ordem_id);
CREATE INDEX IF NOT EXISTS idx_lab_estoque_tenant ON lab_estoque(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lab_estoque_mov_produto ON lab_estoque_movimentacoes(produto_id);
