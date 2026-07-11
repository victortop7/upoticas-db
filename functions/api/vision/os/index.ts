import { requireAuth, json } from '../../../lib/auth-middleware';
import type { Env } from '../../../lib/types';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const tipo = url.searchParams.get('tipo') ?? '';
  const busca = url.searchParams.get('q') ?? '';
  const limit = Number(url.searchParams.get('limit') ?? 50);

  let query = `SELECT v.*, vl.marca, vl.nome as lente_nome
    FROM vision_os v
    LEFT JOIN vision_lentes vl ON v.lente_id = vl.id
    WHERE v.tenant_id = ?`;
  const params: unknown[] = [auth.tenant_id];

  if (tipo) { query += ` AND v.tipo = ?`; params.push(tipo); }
  if (busca) {
    query += ` AND (v.cliente_nome LIKE ? OR v.cliente_cpf LIKE ? OR CAST(v.numero AS TEXT) LIKE ?)`;
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  query += ` ORDER BY v.created_at DESC LIMIT ?`;
  params.push(limit);

  const rows = await env.DB.prepare(query).bind(...params).all();
  return json(rows.results);
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, unknown>;

  const last = await env.DB.prepare(
    `SELECT COALESCE(MAX(numero), 0) as max FROM vision_os WHERE tenant_id = ?`
  ).bind(auth.tenant_id).first<{ max: number }>();

  const numero = (last?.max ?? 0) + 1;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO vision_os (
      id, tenant_id, numero, tipo,
      cliente_nome, cliente_cpf, cliente_tel,
      od_esf, od_cil, od_eixo, od_adicao, od_dnp, od_alt, od_prisma, od_base,
      oe_esf, oe_cil, oe_eixo, oe_adicao, oe_dnp, oe_alt, oe_prisma, oe_base,
      medico_nome, medico_crm, data_receita,
      arm_dnp, arm_vertical, arm_ponte, arm_aro, arm_alt_pupilar,
      lente_id, tratamento_id, lente_desc,
      itens_vistos, itens_vendidos, acessorios,
      valor_lente, valor_armacao, desconto, valor_total, parcelas, forma_pagamento,
      status, created_at, updated_at
    ) VALUES (
      ?,?,?,?,
      ?,?,?,
      ?,?,?,?,?,?,?,?,
      ?,?,?,?,?,?,?,?,
      ?,?,?,
      ?,?,?,?,?,
      ?,?,?,
      ?,?,?,
      ?,?,?,?,?,?,
      ?,?,?
    )
  `).bind(
    id, auth.tenant_id, numero, body.tipo ?? 'orcamento',
    body.cliente_nome ?? null, body.cliente_cpf ?? null, body.cliente_tel ?? null,
    body.od_esf ?? null, body.od_cil ?? null, body.od_eixo ?? null,
    body.od_adicao ?? null, body.od_dnp ?? null, body.od_alt ?? null,
    body.od_prisma ?? null, body.od_base ?? null,
    body.oe_esf ?? null, body.oe_cil ?? null, body.oe_eixo ?? null,
    body.oe_adicao ?? null, body.oe_dnp ?? null, body.oe_alt ?? null,
    body.oe_prisma ?? null, body.oe_base ?? null,
    body.medico_nome ?? null, body.medico_crm ?? null, body.data_receita ?? null,
    body.arm_dnp ?? null, body.arm_vertical ?? null, body.arm_ponte ?? null,
    body.arm_aro ?? null, body.arm_alt_pupilar ?? null,
    body.lente_id ?? null, body.tratamento_id ?? null, body.lente_desc ?? null,
    JSON.stringify(body.itens_vistos ?? []),
    JSON.stringify(body.itens_vendidos ?? []),
    JSON.stringify(body.acessorios ?? []),
    body.valor_lente ?? 0, body.valor_armacao ?? 0,
    body.desconto ?? 0, body.valor_total ?? 0,
    body.parcelas ?? 1, body.forma_pagamento ?? null,
    body.status ?? 'aberto', now, now
  ).run();

  // ── Espelha automaticamente na Conexão Óticas (ordens_servico) ──
  // Falha aqui NÃO quebra o save do Vision (try/catch isolado).
  let osOticasId: string | null = null;
  try {
    try { await env.DB.prepare('ALTER TABLE vision_os ADD COLUMN os_id TEXT').run(); } catch { /* já existe */ }

    const num = (v: unknown): number | null => {
      if (v == null || v === '') return null;
      const n = parseFloat(String(v).replace(',', '.'));
      return isNaN(n) ? null : n;
    };
    const cpf = (body.cliente_cpf as string) || '';
    const nome = (body.cliente_nome as string) || 'Cliente';

    // 1) Acha o cliente (por CPF, senão por nome) ou cria
    const cli = cpf
      ? await env.DB.prepare('SELECT id FROM clientes WHERE tenant_id = ? AND cpf = ? LIMIT 1').bind(auth.tenant_id, cpf).first<{ id: string }>()
      : await env.DB.prepare('SELECT id FROM clientes WHERE tenant_id = ? AND nome = ? LIMIT 1').bind(auth.tenant_id, nome).first<{ id: string }>();
    let clienteId = cli?.id;
    if (!clienteId) {
      clienteId = crypto.randomUUID();
      const tel = (body.cliente_tel as string) || null;
      await env.DB.prepare(
        'INSERT INTO clientes (id, tenant_id, nome, cpf, telefone, celular, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)'
      ).bind(clienteId, auth.tenant_id, nome, cpf || null, tel, tel, now, now).run();
    }

    // 2) Número sequencial da O.S. na Conexão Óticas
    const lastOs = await env.DB.prepare('SELECT COALESCE(MAX(numero),0) as max FROM ordens_servico WHERE tenant_id = ?').bind(auth.tenant_id).first<{ max: number }>();
    const osNum = (lastOs?.max ?? 0) + 1;
    osOticasId = crypto.randomUUID();
    const situacao = (body.tipo ?? 'orcamento') === 'orcamento' ? 'orcamento' : 'aberta';
    const valorTotal = num(body.valor_total) ?? 0;

    await env.DB.prepare(`
      INSERT INTO ordens_servico (
        id, tenant_id, numero, cliente_id, tipo, situacao,
        longe_od_esf, longe_od_cil, longe_od_eixo,
        longe_oe_esf, longe_oe_cil, longe_oe_eixo,
        perto_od_esf, perto_od_cil, perto_od_eixo,
        perto_oe_esf, perto_oe_cil, perto_oe_eixo,
        dp, altura, adicao,
        armacao_desc, lente_desc,
        valor_total, valor_entrada, valor_restante,
        data_entrega, medico, observacao, funcionario_id,
        created_at, updated_at
      ) VALUES (?,?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?, ?,?,?, ?,?,?,?, ?,?)
    `).bind(
      osOticasId, auth.tenant_id, osNum, clienteId, 'oculos_grau', situacao,
      num(body.od_esf), num(body.od_cil), num(body.od_eixo),
      num(body.oe_esf), num(body.oe_cil), num(body.oe_eixo),
      null, null, null,
      null, null, null,
      num(body.arm_dnp), num(body.arm_alt_pupilar ?? body.od_alt), num(body.od_adicao ?? body.oe_adicao),
      null, (body.lente_desc as string) || null,
      valorTotal, 0, valorTotal,
      null, (body.medico_nome as string) || null, `Connect Vision · O.S. #${numero}`, auth.usuario_id,
      now, now
    ).run();

    // 3) Marca a O.S. do Vision como já espelhada
    await env.DB.prepare('UPDATE vision_os SET os_id = ? WHERE id = ?').bind(osOticasId, id).run();
  } catch {
    osOticasId = null; // não interrompe o save do Vision
  }

  return json({ ok: true, id, numero, os_oticas_id: osOticasId });
};
