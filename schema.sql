-- UpÓticas — Schema D1 (SQLite)

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
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
