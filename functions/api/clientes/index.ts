import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCrmTable, ensureEstagiosPadrao } from '../crm/setup';
import { ensureClienteCols } from '../../lib/ensure-cliente-cols';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureClienteCols(env.DB);
    const url = new URL(request.url);
    const busca = url.searchParams.get('busca') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM clientes WHERE tenant_id = ? AND ativo = 1';
    let countQuery = 'SELECT COUNT(*) as total FROM clientes WHERE tenant_id = ? AND ativo = 1';
    const params: unknown[] = [auth.tenant_id];

    if (busca) {
      query += ' AND (nome LIKE ? OR cpf LIKE ? OR celular LIKE ? OR telefone LIKE ? OR email LIKE ?)';
      countQuery += ' AND (nome LIKE ? OR cpf LIKE ? OR celular LIKE ? OR telefone LIKE ? OR email LIKE ?)';
      const like = `%${busca}%`;
      params.push(like, like, like, like, like);
    }

    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';

    const [clientes, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params, limit, offset).all(),
      env.DB.prepare(countQuery).bind(...params).first<{ total: number }>(),
    ]);

    return json({
      clientes: clientes.results,
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

    if (!body.nome?.trim()) {
      return json({ error: 'Nome é obrigatório' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await ensureClienteCols(env.DB);
    await env.DB.prepare(`
      INSERT INTO clientes (id, tenant_id, nome, apelido, cpf, telefone, celular, email, data_nascimento, data_compra, endereco, bairro, cidade, uf, cep, observacao,
        rec_od_esf, rec_od_cil, rec_od_eixo, rec_oe_esf, rec_oe_cil, rec_oe_eixo, rec_adicao, rec_dp, rec_obs, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, auth.tenant_id,
      body.nome.trim(),
      body.apelido || null,
      body.cpf || null,
      body.telefone || null,
      body.celular || null,
      body.email || null,
      body.data_nascimento || null,
      body.data_compra || null,
      body.endereco || null,
      body.bairro || null,
      body.cidade || null,
      body.uf || null,
      body.cep || null,
      body.observacao || null,
      body.rec_od_esf || null,
      body.rec_od_cil || null,
      body.rec_od_eixo || null,
      body.rec_oe_esf || null,
      body.rec_oe_cil || null,
      body.rec_oe_eixo || null,
      body.rec_adicao || null,
      body.rec_dp || null,
      body.rec_obs || null,
      now, now
    ).run();

    // Cria card no CRM automaticamente na etapa "Cliente Cadastrado" (key 'novo')
    try {
      await ensureCrmTable(env.DB);
      await ensureEstagiosPadrao(env.DB, auth.tenant_id); // garante que a coluna "Cliente Cadastrado" exista
      await env.DB.prepare(
        'INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, prioridade, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), auth.tenant_id, id, 'novo', 'normal', now, now).run();
    } catch {}

    const cliente = await env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(id).first();
    return json(cliente, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
