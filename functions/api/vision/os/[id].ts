import { requireAuth, json } from '../../../lib/auth-middleware';
import type { Env } from '../../../lib/types';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const row = await env.DB.prepare(
    `SELECT v.*, vl.marca, vl.nome as lente_nome, vl.cor as lente_cor,
            vt.nome as tratamento_nome
     FROM vision_os v
     LEFT JOIN vision_lentes vl ON v.lente_id = vl.id
     LEFT JOIN vision_tratamentos vt ON v.tratamento_id = vt.id
     WHERE v.id = ? AND v.tenant_id = ?`
  ).bind(params.id, auth.tenant_id).first();

  if (!row) return json({ error: 'OS não encontrada' }, 404);
  return json(row);
};

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json() as Record<string, unknown>;
  const now = new Date().toISOString();

  const allowed = [
    'tipo', 'cliente_nome', 'cliente_cpf', 'cliente_tel', 'cliente_foto_url',
    'od_esf', 'od_cil', 'od_eixo', 'od_adicao', 'od_dnp', 'od_alt', 'od_prisma', 'od_base',
    'oe_esf', 'oe_cil', 'oe_eixo', 'oe_adicao', 'oe_dnp', 'oe_alt', 'oe_prisma', 'oe_base',
    'medico_nome', 'medico_crm', 'data_receita',
    'arm_dnp', 'arm_vertical', 'arm_ponte', 'arm_aro', 'arm_alt_pupilar',
    'lente_id', 'tratamento_id', 'lente_desc',
    'itens_vistos', 'itens_vendidos', 'acessorios',
    'valor_lente', 'valor_armacao', 'desconto', 'valor_total', 'parcelas', 'forma_pagamento',
    'status',
  ];

  const updates: string[] = [];
  const vals: unknown[] = [];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      const val = body[key];
      vals.push(Array.isArray(val) ? JSON.stringify(val) : val);
    }
  }

  if (!updates.length) return json({ error: 'Nada para atualizar' }, 400);

  updates.push('updated_at = ?');
  vals.push(now, params.id, auth.tenant_id);

  await env.DB.prepare(
    `UPDATE vision_os SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`
  ).bind(...vals).run();

  return json({ ok: true });
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare(
    `DELETE FROM vision_os WHERE id = ? AND tenant_id = ?`
  ).bind(params.id, auth.tenant_id).run();

  return json({ ok: true });
};
