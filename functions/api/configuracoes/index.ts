import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

async function ensureColumns(db: D1Database) {
  const cols = ['telefone TEXT', 'cnpj TEXT', 'endereco TEXT', 'cidade TEXT', 'uf TEXT'];
  for (const col of cols) {
    try {
      await db.prepare(`ALTER TABLE tenants ADD COLUMN ${col}`).run();
    } catch {}
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await ensureColumns(env.DB);
  const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(auth.tenant_id).first();
  if (!tenant) return json({ error: 'Tenant não encontrado' }, 404);
  return json(tenant);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as Record<string, string>;
    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

    await ensureColumns(env.DB);
    await env.DB.prepare(
      'UPDATE tenants SET nome = ?, telefone = ?, cnpj = ?, endereco = ?, cidade = ?, uf = ? WHERE id = ?'
    ).bind(
      body.nome.trim(),
      body.telefone || null,
      body.cnpj || null,
      body.endereco || null,
      body.cidade || null,
      body.uf || null,
      auth.tenant_id
    ).run();

    const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(auth.tenant_id).first();
    return json(tenant);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
