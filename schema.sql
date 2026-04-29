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

-- Índices Lab
CREATE INDEX IF NOT EXISTS idx_lab_oticas_tenant ON lab_oticas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lab_ordens_tenant ON lab_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lab_ordens_otica ON lab_ordens(otica_id);
CREATE INDEX IF NOT EXISTS idx_lab_ordens_status ON lab_ordens(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_receita_ordem ON lab_receita(ordem_id);
CREATE INDEX IF NOT EXISTS idx_lab_armacao_ordem ON lab_armacao(ordem_id);
CREATE INDEX IF NOT EXISTS idx_lab_servicos_ordem ON lab_servicos_os(ordem_id);
