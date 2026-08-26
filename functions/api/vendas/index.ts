import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const busca = url.searchParams.get('busca') || '';
    const situacao = url.searchParams.get('situacao') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ?
    `;
    let countQuery = `
      SELECT COUNT(*) as total FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ?
    `;
    const params: unknown[] = [auth.tenant_id];

    if (busca) {
      const cond = ' AND (c.nome LIKE ? OR CAST(v.numero AS TEXT) LIKE ? OR v.forma_pagamento LIKE ?)';
      query += cond;
      countQuery += cond;
      const like = `%${busca}%`;
      params.push(like, like, like);
    }
    if (situacao) {
      query += ' AND v.situacao = ?';
      countQuery += ' AND v.situacao = ?';
      params.push(situacao);
    }

    query += ' ORDER BY v.numero DESC LIMIT ? OFFSET ?';

    // inclui nome do vendedor no retorno
    query = query.replace(
      'SELECT v.*',
      'SELECT v.*, u.nome as vendedor_nome, u.perfil as vendedor_perfil'
    ).replace(
      'FROM vendas v',
      'FROM vendas v LEFT JOIN usuarios u ON u.id = v.funcionario_id'
    );

    const [results, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params, limit, offset).all(),
      env.DB.prepare(countQuery).bind(...params).first<{ total: number }>(),
    ]);

    return json({
      vendas: results.results,
      total: countResult?.total || 0,
      page,
      pages: Math.ceil((countResult?.total || 0) / limit),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    const last = await env.DB.prepare(
      'SELECT MAX(numero) as max_num FROM vendas WHERE tenant_id = ?'
    ).bind(auth.tenant_id).first<{ max_num: number | null }>();
    const numero = (last?.max_num || 0) + 1;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const valorTotal = parseFloat(body.valor_total) || 0;
    const desconto = parseFloat(body.desconto) || 0;
    const valorFinal = valorTotal - desconto;
    const valorEntrada = body.valor_entrada !== undefined && body.valor_entrada !== ''
      ? parseFloat(body.valor_entrada)
      : valorFinal; // sem entrada = pagamento integral
    const saldoRestante = Math.max(0, valorFinal - valorEntrada);
    const situacao = saldoRestante > 0 ? 'pendente' : (body.situacao || 'ativa');

    // Pessoas adicionais na MESMA venda (mesmo pagamento, mas cada uma é uma venda própria)
    const adicionais = Array.isArray((body as Record<string, unknown>).adicionais)
      ? ((body as Record<string, unknown>).adicionais as Record<string, string>[]).filter(a => (parseFloat(a.valor_total) || 0) > 0)
      : [];
    const grupoId = adicionais.length > 0 ? crypto.randomUUID() : null;
    const funcionarioId = (auth.perfil === 'admin' && body.funcionario_id) ? body.funcionario_id : auth.usuario_id;

    // Garante colunas novas
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch {}
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN saldo_restante REAL NOT NULL DEFAULT 0').run(); } catch {}
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN grupo_venda_id TEXT').run(); } catch {}

    await env.DB.prepare(`
      INSERT INTO vendas (id, tenant_id, numero, cliente_id, os_id, situacao,
        valor_total, desconto, valor_final, valor_entrada, saldo_restante,
        forma_pagamento, observacao, funcionario_id, grupo_venda_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, auth.tenant_id, numero,
      body.cliente_id || null,
      body.os_id || null,
      situacao,
      valorTotal, desconto, valorFinal,
      valorEntrada, saldoRestante,
      body.forma_pagamento || null,
      body.observacao || null,
      funcionarioId, grupoId,
      now, now
    ).run();

    // Itens da venda (produtos comprados) — opcional
    const itens = Array.isArray((body as Record<string, unknown>).itens) ? (body as Record<string, unknown>).itens as Record<string, unknown>[] : [];
    if (itens.length) {
      try { await env.DB.prepare(`CREATE TABLE IF NOT EXISTS venda_itens (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, venda_id TEXT NOT NULL, produto_id TEXT, descricao TEXT NOT NULL, quantidade REAL NOT NULL DEFAULT 1, valor_unitario REAL NOT NULL DEFAULT 0, desconto REAL NOT NULL DEFAULT 0, valor_total REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`).run(); } catch {}
      const stmts = itens
        .filter(it => String(it.descricao || '').trim())
        .map(it => {
          const qtd = parseFloat(String(it.quantidade)) || 0;
          const vu = parseFloat(String(it.valor_unitario)) || 0;
          const desc = parseFloat(String(it.desconto)) || 0;
          const vt = Math.round((qtd * vu - desc) * 100) / 100;
          return env.DB.prepare(
            'INSERT INTO venda_itens (id, tenant_id, venda_id, produto_id, descricao, quantidade, valor_unitario, desconto, valor_total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(crypto.randomUUID(), auth.tenant_id, id, (it.produto_id as string) || null, String(it.descricao).slice(0, 200), qtd, vu, desc, vt, now);
        });
      if (stmts.length) await env.DB.batch(stmts);
    }

    // Vendas das pessoas adicionais (mesmo grupo/pagamento) — cada uma quitada (ativa)
    if (adicionais.length > 0) {
      let proxNumero = numero;
      for (const ad of adicionais) {
        const adVt = parseFloat(ad.valor_total) || 0;
        const adDesc = parseFloat(ad.desconto) || 0;
        const adFinal = Math.max(0, adVt - adDesc);
        proxNumero += 1;
        await env.DB.prepare(`
          INSERT INTO vendas (id, tenant_id, numero, cliente_id, os_id, situacao,
            valor_total, desconto, valor_final, valor_entrada, saldo_restante,
            forma_pagamento, observacao, funcionario_id, grupo_venda_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'ativa', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), auth.tenant_id, proxNumero,
          ad.cliente_id || null, null,
          adVt, adDesc, adFinal, adFinal,
          body.forma_pagamento || null,
          ad.observacao || null,
          funcionarioId, grupoId,
          now, now
        ).run();
      }
    }

    // Se há saldo pendente e tem cliente, move card CRM para "A Receber"
    if (saldoRestante > 0 && body.cliente_id) {
      try {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO crm_estagios (id, tenant_id, key, label, icon, color, ordem, sistema) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), auth.tenant_id, 'a_receber', 'A Receber', '💳', '#dc2626', 5, 1).run();

        // Garante o card do cliente e move para A Receber
        await env.DB.prepare(
          `INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at)
           VALUES (?, ?, ?, 'a_receber', datetime('now'), datetime('now'))`
        ).bind(crypto.randomUUID(), auth.tenant_id, body.cliente_id).run();

        await env.DB.prepare(
          `UPDATE crm_cards SET estagio = 'a_receber', updated_at = datetime('now')
           WHERE cliente_id = ? AND tenant_id = ?`
        ).bind(body.cliente_id, auth.tenant_id).run();
      } catch {}
    }

    const venda = await env.DB.prepare(`
      SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?
    `).bind(id).first();
    return json(venda, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
