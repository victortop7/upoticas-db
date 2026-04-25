import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
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
      SELECT os.*, c.nome as cliente_nome
      FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      WHERE os.tenant_id = ?
    `;
    let countQuery = `
      SELECT COUNT(*) as total FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      WHERE os.tenant_id = ?
    `;
    const params: unknown[] = [auth.tenant_id];

    if (busca) {
      const cond = ' AND (c.nome LIKE ? OR CAST(os.numero AS TEXT) LIKE ? OR os.armacao_desc LIKE ?)';
      query += cond;
      countQuery += cond;
      const like = `%${busca}%`;
      params.push(like, like, like);
    }
    if (situacao) {
      query += ' AND os.situacao = ?';
      countQuery += ' AND os.situacao = ?';
      params.push(situacao);
    }

    query += ' ORDER BY os.numero DESC LIMIT ? OFFSET ?';

    const [results, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params, limit, offset).all(),
      env.DB.prepare(countQuery).bind(...params).first<{ total: number }>(),
    ]);

    return json({
      os: results.results,
      total: countResult?.total || 0,
      page,
      pages: Math.ceil((countResult?.total || 0) / limit),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;

    if (!body.cliente_id) return json({ error: 'Cliente é obrigatório' }, 400);

    // Auto-increment numero por tenant
    const last = await env.DB.prepare(
      'SELECT MAX(numero) as max_num FROM ordens_servico WHERE tenant_id = ?'
    ).bind(auth.tenant_id).first<{ max_num: number | null }>();
    const numero = (last?.max_num || 0) + 1;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const valorTotal = parseFloat(body.valor_total) || 0;
    const valorEntrada = parseFloat(body.valor_entrada) || 0;
    const valorRestante = valorTotal - valorEntrada;

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
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `).bind(
      id, auth.tenant_id, numero, body.cliente_id,
      body.tipo || 'oculos_grau', body.situacao || 'orcamento',
      parseFloat(body.longe_od_esf) || null, parseFloat(body.longe_od_cil) || null, parseFloat(body.longe_od_eixo) || null,
      parseFloat(body.longe_oe_esf) || null, parseFloat(body.longe_oe_cil) || null, parseFloat(body.longe_oe_eixo) || null,
      parseFloat(body.perto_od_esf) || null, parseFloat(body.perto_od_cil) || null, parseFloat(body.perto_od_eixo) || null,
      parseFloat(body.perto_oe_esf) || null, parseFloat(body.perto_oe_cil) || null, parseFloat(body.perto_oe_eixo) || null,
      parseFloat(body.dp) || null, parseFloat(body.altura) || null, parseFloat(body.adicao) || null,
      body.armacao_desc || null, body.lente_desc || null,
      valorTotal, valorEntrada, valorRestante,
      body.data_entrega || null, body.medico || null, body.observacao || null, auth.usuario_id,
      now, now
    ).run();

    const os = await env.DB.prepare(`
      SELECT os.*, c.nome as cliente_nome FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id WHERE os.id = ?
    `).bind(id).first();
    return json(os, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
