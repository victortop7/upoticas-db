import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCrmTable } from './setup';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);

  // Garante cards para clientes que não têm ainda
  await env.DB.prepare(`
    INSERT OR IGNORE INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at)
    SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
      c.tenant_id, c.id, 'novo', datetime('now'), datetime('now')
    FROM clientes c
    WHERE c.tenant_id = ? AND c.ativo = 1
    AND NOT EXISTS (SELECT 1 FROM crm_cards cc WHERE cc.cliente_id = c.id AND cc.tenant_id = c.tenant_id)
  `).bind(auth.tenant_id).run();

  const cards = await env.DB.prepare(`
    SELECT
      cc.id, cc.estagio, cc.prioridade, cc.notas, cc.created_at, cc.updated_at,
      c.id as cliente_id, c.nome, c.celular, c.telefone, c.email,
      c.cidade, c.uf, c.data_nascimento,
      (SELECT MAX(os.created_at) FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id) as ultima_os,
      (SELECT MAX(v.created_at) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id) as ultima_venda,
      (SELECT COUNT(*) FROM ordens_servico os WHERE os.cliente_id = c.id AND os.tenant_id = cc.tenant_id) as total_os,
      (SELECT COALESCE(SUM(v.valor_final),0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = cc.tenant_id AND v.situacao='ativa') as total_gasto
    FROM crm_cards cc
    JOIN clientes c ON c.id = cc.cliente_id
    WHERE cc.tenant_id = ? AND c.ativo = 1
    ORDER BY cc.updated_at DESC
  `).bind(auth.tenant_id).all();

  return json(cards.results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCrmTable(env.DB);

  const body = await request.json() as { cliente_id: string };
  if (!body.cliente_id) return json({ error: 'cliente_id obrigatório' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id FROM crm_cards WHERE cliente_id = ? AND tenant_id = ?'
  ).bind(body.cliente_id, auth.tenant_id).first();
  if (existing) return json(existing);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO crm_cards (id, tenant_id, cliente_id, estagio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, auth.tenant_id, body.cliente_id, 'novo', now, now).run();

  return json({ id }, 201);
};
