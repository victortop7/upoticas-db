import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { lojaParaGravar } from '../../lib/lojas';
import { ensureFicha, proximoCodigo, valoresFicha, CAMPOS_FICHA } from '../../lib/clienteFicha';

// CPF/CNPJ só com dígitos, pra comparar cadastros repetidos
export const SQL_DOC = `REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(cpf, ''), '.', ''), '-', ''), '/', ''), ' ', '')`;

export async function docRepetido(env: Env, tenant: string, cpf: string | null, ignorarId?: string) {
  const doc = (cpf || '').replace(/\D/g, '');
  if (doc.length < 11) return null;
  return await env.DB.prepare(
    `SELECT id, nome, codigo FROM clientes WHERE tenant_id = ? AND ativo = 1 AND ${SQL_DOC} = ? AND id != ? LIMIT 1`
  ).bind(tenant, doc, ignorarId || '').first<{ id: string; nome: string; codigo: number | null }>();
}

// POST /api/clientes/ficha: cadastra cliente com a ficha completa
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureFicha(env.DB);
    const b = await request.json() as Record<string, unknown>;
    const v = valoresFicha(b);
    if (!v.nome) return json({ error: 'Informe o nome' }, 400);
    const dup = await docRepetido(env, auth.tenant_id, v.cpf);
    if (dup) return json({ error: `Este ${v.pessoa === 'J' ? 'CNPJ' : 'CPF'} já é do cliente ${dup.codigo ? String(dup.codigo).padStart(6, '0') + ' ' : ''}${dup.nome}`, duplicado_id: dup.id }, 409);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const codigo = await proximoCodigo(env.DB, auth.tenant_id);
    const loja = lojaParaGravar(auth, (b.loja_id as string) || null);
    const cols = [...CAMPOS_FICHA];
    await env.DB.prepare(
      `INSERT INTO clientes (id, tenant_id, loja_id, codigo, ${cols.join(', ')}, ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ${cols.map(() => '?').join(', ')}, 1, ?, ?)`
    ).bind(id, auth.tenant_id, loja, codigo, ...cols.map(c => (v as Record<string, unknown>)[c] ?? null), now, now).run();
    return json({ id, codigo }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
