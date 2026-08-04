import type { Env } from '../../lib/types';

// POST /api/integracoes/kommo
// O Kommo chama esta URL quando um lead entra na etapa "lead ganho".
// Fluxo: 1) cadastra o cliente (dedupe por CPF/telefone)  2) cria a OS (receita + produtos + valores)  3) cria a venda ligada à OS.
// Idempotente por lead: se o mesmo lead_id já foi processado, não duplica.

const jr = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// número → REAL (aceita "+2,50", "-1.75", vazio → null)
const numN = (v: unknown): number | null => {
  if (v == null || String(v).trim() === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
};
const numF = (v: unknown): number => numN(v) ?? 0;
const txt = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? null : s;
};

interface Receita {
  od?: { esf?: unknown; cil?: unknown; eixo?: unknown };
  oe?: { esf?: unknown; cil?: unknown; eixo?: unknown };
  perto_od?: { esf?: unknown; cil?: unknown; eixo?: unknown };
  perto_oe?: { esf?: unknown; cil?: unknown; eixo?: unknown };
  adicao?: unknown; dp?: unknown; altura?: unknown; medico?: unknown;
}
interface VendaIn {
  valor_total?: unknown; valor_entrada?: unknown; forma_pagamento?: unknown;
  observacao?: unknown; armacao?: unknown; lente?: unknown; data_entrega?: unknown;
  itens?: { descricao?: unknown; quantidade?: unknown; valor_unitario?: unknown; produto_id?: unknown }[];
}
interface Body {
  nome?: unknown; apelido?: unknown; cpf?: unknown; telefone?: unknown; celular?: unknown;
  email?: unknown; data_nascimento?: unknown; endereco?: unknown; bairro?: unknown;
  cidade?: unknown; uf?: unknown; cep?: unknown; observacao?: unknown;
  receita?: Receita; venda?: VendaIn;
  kommo_lead_id?: unknown; lead_id?: unknown;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  // 1) Segurança: exige o token compartilhado (header ou ?token=)
  if (!env.KOMMO_WEBHOOK_TOKEN) return jr({ error: 'Integração Kommo não configurada' }, 503);
  const url = new URL(request.url);
  const enviado =
    request.headers.get('x-kommo-token') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    url.searchParams.get('token') || '';
  if (enviado !== env.KOMMO_WEBHOOK_TOKEN) return jr({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json().catch(() => ({})) as Body;

    // 2) Resolve o tenant pelo e-mail configurado
    if (!env.KOMMO_TENANT_EMAIL) return jr({ error: 'KOMMO_TENANT_EMAIL não configurado' }, 503);
    const u = await env.DB.prepare('SELECT tenant_id FROM usuarios WHERE email = ? LIMIT 1')
      .bind(env.KOMMO_TENANT_EMAIL).first<{ tenant_id: string }>();
    if (!u?.tenant_id) return jr({ error: 'Tenant não encontrado' }, 404);
    const tenant_id = u.tenant_id;

    const nome = txt(body.nome);
    if (!nome) return jr({ error: 'Nome é obrigatório' }, 400);

    const leadId = txt(body.kommo_lead_id) || txt(body.lead_id);
    const now = new Date().toISOString();

    // 3) Idempotência — não processa o mesmo lead duas vezes
    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS kommo_sync (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, lead_id TEXT NOT NULL,
        cliente_id TEXT, os_id TEXT, venda_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(tenant_id, lead_id))`).run();
    } catch { /* já existe */ }
    if (leadId) {
      const done = await env.DB.prepare('SELECT cliente_id, os_id, venda_id FROM kommo_sync WHERE tenant_id = ? AND lead_id = ?')
        .bind(tenant_id, leadId).first<Record<string, string>>();
      if (done) return jr({ received: true, already: true, ...done });
    }

    const cpf = txt(body.cpf);
    const telefone = txt(body.telefone);
    const celular = txt(body.celular);
    const rec = body.receita || {};

    // Última receita → colunas rec_* do cliente (texto)
    const recCli = {
      rec_od_esf: txt(rec.od?.esf), rec_od_cil: txt(rec.od?.cil), rec_od_eixo: txt(rec.od?.eixo),
      rec_oe_esf: txt(rec.oe?.esf), rec_oe_cil: txt(rec.oe?.cil), rec_oe_eixo: txt(rec.oe?.eixo),
      rec_adicao: txt(rec.adicao), rec_dp: txt(rec.dp),
    };

    // 4) Cliente — dedupe por CPF/celular/telefone
    let clienteId: string | null = null;
    const conds: string[] = []; const bd: unknown[] = [tenant_id];
    if (cpf) { conds.push('(cpf IS NOT NULL AND cpf <> \'\' AND cpf = ?)'); bd.push(cpf); }
    if (celular) { conds.push('(celular IS NOT NULL AND celular <> \'\' AND celular = ?)'); bd.push(celular); }
    if (telefone) { conds.push('(telefone IS NOT NULL AND telefone <> \'\' AND telefone = ?)'); bd.push(telefone); }
    if (conds.length) {
      const found = await env.DB.prepare(
        `SELECT id FROM clientes WHERE tenant_id = ? AND ativo = 1 AND (${conds.join(' OR ')}) LIMIT 1`
      ).bind(...bd).first<{ id: string }>();
      if (found) clienteId = found.id;
    }

    if (clienteId) {
      // Já existe → atualiza a última receita e os contatos que vierem preenchidos
      await env.DB.prepare(`UPDATE clientes SET
        rec_od_esf = COALESCE(?, rec_od_esf), rec_od_cil = COALESCE(?, rec_od_cil), rec_od_eixo = COALESCE(?, rec_od_eixo),
        rec_oe_esf = COALESCE(?, rec_oe_esf), rec_oe_cil = COALESCE(?, rec_oe_cil), rec_oe_eixo = COALESCE(?, rec_oe_eixo),
        rec_adicao = COALESCE(?, rec_adicao), rec_dp = COALESCE(?, rec_dp),
        email = COALESCE(?, email), endereco = COALESCE(?, endereco), bairro = COALESCE(?, bairro),
        cidade = COALESCE(?, cidade), uf = COALESCE(?, uf), cep = COALESCE(?, cep),
        updated_at = ? WHERE id = ? AND tenant_id = ?`).bind(
        recCli.rec_od_esf, recCli.rec_od_cil, recCli.rec_od_eixo,
        recCli.rec_oe_esf, recCli.rec_oe_cil, recCli.rec_oe_eixo,
        recCli.rec_adicao, recCli.rec_dp,
        txt(body.email), txt(body.endereco), txt(body.bairro),
        txt(body.cidade), txt(body.uf), txt(body.cep),
        now, clienteId, tenant_id
      ).run();
    } else {
      // Novo cliente
      clienteId = crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO clientes
        (id, tenant_id, nome, apelido, cpf, telefone, celular, email, data_nascimento,
         endereco, bairro, cidade, uf, cep, observacao,
         rec_od_esf, rec_od_cil, rec_od_eixo, rec_oe_esf, rec_oe_cil, rec_oe_eixo, rec_adicao, rec_dp,
         created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        clienteId, tenant_id, nome, txt(body.apelido), cpf, telefone, celular, txt(body.email),
        txt(body.data_nascimento), txt(body.endereco), txt(body.bairro), txt(body.cidade),
        txt(body.uf), txt(body.cep), txt(body.observacao),
        recCli.rec_od_esf, recCli.rec_od_cil, recCli.rec_od_eixo,
        recCli.rec_oe_esf, recCli.rec_oe_cil, recCli.rec_oe_eixo, recCli.rec_adicao, recCli.rec_dp,
        now, now
      ).run();
      // Card no CRM (mesma lógica do cadastro manual)
      try {
        await env.DB.prepare('INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, prioridade, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), tenant_id, clienteId, 'novo', 'normal', now, now).run();
      } catch { /* opcional */ }
    }

    // 5) OS (ordem de serviço) com a receita + produtos + valores
    const venda = body.venda || {};
    const valorTotal = numF(venda.valor_total);
    const entrada = venda.valor_entrada != null && String(venda.valor_entrada).trim() !== '' ? numF(venda.valor_entrada) : valorTotal;
    const restante = Math.max(0, valorTotal - entrada);

    const osLast = await env.DB.prepare('SELECT MAX(numero) as m FROM ordens_servico WHERE tenant_id = ?')
      .bind(tenant_id).first<{ m: number | null }>();
    const osNumero = (osLast?.m || 0) + 1;
    const osId = crypto.randomUUID();

    await env.DB.prepare(`INSERT INTO ordens_servico
      (id, tenant_id, numero, cliente_id, tipo, situacao,
       longe_od_esf, longe_od_cil, longe_od_eixo, longe_oe_esf, longe_oe_cil, longe_oe_eixo,
       perto_od_esf, perto_od_cil, perto_od_eixo, perto_oe_esf, perto_oe_cil, perto_oe_eixo,
       dp, altura, adicao, armacao_desc, lente_desc,
       valor_total, valor_entrada, valor_restante, data_entrega, medico, observacao,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, 'oculos_grau', 'orcamento',
       ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      osId, tenant_id, osNumero, clienteId,
      numN(rec.od?.esf), numN(rec.od?.cil), numN(rec.od?.eixo),
      numN(rec.oe?.esf), numN(rec.oe?.cil), numN(rec.oe?.eixo),
      numN(rec.perto_od?.esf), numN(rec.perto_od?.cil), numN(rec.perto_od?.eixo),
      numN(rec.perto_oe?.esf), numN(rec.perto_oe?.cil), numN(rec.perto_oe?.eixo),
      numN(rec.dp), numN(rec.altura), numN(rec.adicao),
      txt(venda.armacao), txt(venda.lente),
      valorTotal, entrada, restante,
      txt(venda.data_entrega), txt(rec.medico), txt(venda.observacao),
      now, now
    ).run();

    // 6) Venda ligada à OS
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN saldo_restante REAL NOT NULL DEFAULT 0').run(); } catch { /* já existe */ }

    const vLast = await env.DB.prepare('SELECT MAX(numero) as m FROM vendas WHERE tenant_id = ?')
      .bind(tenant_id).first<{ m: number | null }>();
    const vNumero = (vLast?.m || 0) + 1;
    const vendaId = crypto.randomUUID();
    const situacao = restante > 0 ? 'pendente' : 'ativa';

    await env.DB.prepare(`INSERT INTO vendas
      (id, tenant_id, numero, cliente_id, os_id, situacao, valor_total, desconto, valor_final,
       valor_entrada, saldo_restante, forma_pagamento, observacao, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`).bind(
      vendaId, tenant_id, vNumero, clienteId, osId, situacao,
      valorTotal, valorTotal, entrada, restante,
      txt(venda.forma_pagamento), txt(venda.observacao), now, now
    ).run();

    // Itens da venda (opcional)
    const itens = Array.isArray(venda.itens) ? venda.itens : [];
    const stmts = itens
      .filter(it => txt(it.descricao))
      .map(it => {
        const qtd = numF(it.quantidade) || 1;
        const vu = numF(it.valor_unitario);
        const vt = Math.round(qtd * vu * 100) / 100;
        return env.DB.prepare(
          'INSERT INTO venda_itens (id, tenant_id, venda_id, produto_id, descricao, quantidade, valor_unitario, desconto, valor_total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
        ).bind(crypto.randomUUID(), tenant_id, vendaId, txt(it.produto_id), String(txt(it.descricao)).slice(0, 200), qtd, vu, vt, now);
      });
    if (stmts.length) await env.DB.batch(stmts);

    // Registra o processamento do lead (idempotência)
    if (leadId) {
      try {
        await env.DB.prepare('INSERT OR IGNORE INTO kommo_sync (id, tenant_id, lead_id, cliente_id, os_id, venda_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), tenant_id, leadId, clienteId, osId, vendaId, now).run();
      } catch { /* opcional */ }
    }

    return jr({
      received: true,
      cliente_id: clienteId,
      os_id: osId, os_numero: osNumero,
      venda_id: vendaId, venda_numero: vNumero,
    }, 201);
  } catch (err) {
    return jr({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
