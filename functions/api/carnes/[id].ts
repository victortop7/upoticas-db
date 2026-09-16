import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCarneTables } from './index';

// GET /api/carnes/:id — carnê completo (parcelas + cliente + loja) para visualizar/imprimir
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCarneTables(env.DB);

  const carne = await env.DB.prepare('SELECT * FROM carnes WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).first<Record<string, unknown>>();
  if (!carne) return json({ error: 'Carnê não encontrado' }, 404);

  const [parcelas, cliente, loja] = await Promise.all([
    env.DB.prepare('SELECT * FROM carne_parcelas WHERE carne_id = ? AND tenant_id = ? ORDER BY numero ASC')
      .bind(params.id, auth.tenant_id).all(),
    carne.cliente_id
      ? env.DB.prepare('SELECT nome, celular, telefone, email, cpf FROM clientes WHERE id = ?').bind(carne.cliente_id).first()
      : Promise.resolve(null),
    env.DB.prepare('SELECT nome, cidade, uf, telefone, cnpj, pix_chave, pix_beneficiario FROM tenants WHERE id = ?')
      .bind(auth.tenant_id).first(),
  ]);

  return json({ carne, parcelas: parcelas.results, cliente, loja });
};

// DELETE /api/carnes/:id — exclui o carnê e suas parcelas
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureCarneTables(env.DB);

  const carne = await env.DB.prepare('SELECT id FROM carnes WHERE id = ? AND tenant_id = ?')
    .bind(params.id, auth.tenant_id).first();
  if (!carne) return json({ error: 'Carnê não encontrado' }, 404);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM carne_parcelas WHERE carne_id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id),
    env.DB.prepare('DELETE FROM carnes WHERE id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id),
  ]);
  return json({ ok: true });
};
