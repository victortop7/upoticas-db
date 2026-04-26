import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return json({ clientes: [], os: [], vendas: [] });

  const like = `%${q}%`;

  const [clientes, os, vendas] = await Promise.all([
    env.DB.prepare(`
      SELECT id, nome, cpf, celular, cidade, uf FROM clientes
      WHERE tenant_id = ? AND ativo = 1
        AND (nome LIKE ? OR cpf LIKE ? OR celular LIKE ? OR email LIKE ?)
      ORDER BY nome ASC LIMIT 5
    `).bind(auth.tenant_id, like, like, like, like).all(),

    env.DB.prepare(`
      SELECT os.id, os.numero, os.situacao, os.valor_total, c.nome as cliente_nome
      FROM ordens_servico os
      LEFT JOIN clientes c ON c.id = os.cliente_id
      WHERE os.tenant_id = ?
        AND (c.nome LIKE ? OR CAST(os.numero AS TEXT) LIKE ? OR os.armacao_desc LIKE ?)
      ORDER BY os.numero DESC LIMIT 5
    `).bind(auth.tenant_id, like, like, like).all(),

    env.DB.prepare(`
      SELECT v.id, v.numero, v.valor_final, v.forma_pagamento, c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.tenant_id = ? AND v.situacao = 'ativa'
        AND (c.nome LIKE ? OR CAST(v.numero AS TEXT) LIKE ?)
      ORDER BY v.numero DESC LIMIT 5
    `).bind(auth.tenant_id, like, like).all(),
  ]);

  return json({
    clientes: clientes.results,
    os: os.results,
    vendas: vendas.results,
  });
};
