import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureFicha, valoresFicha, CAMPOS_FICHA } from '../../../lib/clienteFicha';
import { docRepetido } from '../ficha';

// PUT /api/clientes/:id/ficha: salva todos os campos da ficha
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureFicha(env.DB);
    const id = String(params.id);
    const existe = await env.DB.prepare('SELECT id FROM clientes WHERE id = ? AND tenant_id = ?').bind(id, auth.tenant_id).first();
    if (!existe) return json({ error: 'Cliente não encontrado' }, 404);
    const v = valoresFicha(await request.json() as Record<string, unknown>);
    if (!v.nome) return json({ error: 'Informe o nome' }, 400);
    const dup = await docRepetido(env as unknown as Env, auth.tenant_id, v.cpf, id);
    if (dup) return json({ error: `Este ${v.pessoa === 'J' ? 'CNPJ' : 'CPF'} já é do cliente ${dup.codigo ? String(dup.codigo).padStart(6, '0') + ' ' : ''}${dup.nome}`, duplicado_id: dup.id }, 409);
    const cols = [...CAMPOS_FICHA];
    await env.DB.prepare(
      `UPDATE clientes SET ${cols.map(c => `${c} = ?`).join(', ')}, updated_at = ? WHERE id = ? AND tenant_id = ?`
    ).bind(...cols.map(c => (v as Record<string, unknown>)[c] ?? null), new Date().toISOString(), id, auth.tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
