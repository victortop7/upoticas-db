import { requireAuth, json } from '../../../lib/auth-middleware';
import type { Env } from '../../../lib/types';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const rows = await env.DB.prepare(
    `SELECT * FROM vision_lentes
     WHERE (tenant_id IS NULL OR tenant_id = ?) AND ativo = 1
     ORDER BY marca, nome`
  ).bind(auth.tenant_id).all();

  return json(rows.results);
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as {
    marca: string; nome: string; material?: string; indice?: number;
    tipo?: string; cor?: string; grau_max?: number; cil_max?: number; adicao_max?: number;
  };

  if (!body.marca || !body.nome) return json({ error: 'marca e nome obrigatórios' }, 400);

  const id = `${auth.tenant_id}-${Date.now()}`;
  await env.DB.prepare(
    `INSERT INTO vision_lentes (id, tenant_id, marca, nome, material, indice, tipo, cor, grau_max, cil_max, adicao_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, auth.tenant_id, body.marca, body.nome,
    body.material ?? null, body.indice ?? null,
    body.tipo ?? 'monofocal', body.cor ?? '#3b82f6',
    body.grau_max ?? null, body.cil_max ?? null, body.adicao_max ?? null
  ).run();

  return json({ ok: true, id });
};
