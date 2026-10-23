import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureCarneTables } from './index';
import { montarPixBRCode } from '../../lib/pix';

// GET /api/carnes/:id: carnê completo (parcelas + cliente + loja) para visualizar/imprimir
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
    env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(auth.tenant_id).first<Record<string, unknown>>()
      .then(t => t && ({ nome: t.nome, cidade: t.cidade, uf: t.uf, telefone: t.telefone, cnpj: t.cnpj, pix_chave: t.pix_chave, pix_beneficiario: t.pix_beneficiario, logo: t.logo || null })),
  ]);

  // refaz o Pix das parcelas em aberto com a chave atual (carnês emitidos com a chave no formato errado)
  const lista = (parcelas.results || []) as Record<string, unknown>[];
  try {
    const t = await env.DB.prepare('SELECT nome, cidade, pix_chave, pix_beneficiario, pix_cidade FROM tenants WHERE id = ?')
      .bind(auth.tenant_id).first<{ nome: string; cidade: string; pix_chave: string; pix_beneficiario: string; pix_cidade: string }>();
    if (t?.pix_chave) {
      const upd = [];
      for (const pc of lista) {
        if (pc.status === 'pago') continue;
        const novo = montarPixBRCode({
          chave: t.pix_chave, nome: t.pix_beneficiario || t.nome || 'RECEBEDOR', cidade: t.pix_cidade || t.cidade || 'CIDADE',
          valor: Number(pc.valor) || 0, txid: String(pc.txid || ''),
        });
        if (novo !== pc.pix_copia_cola) {
          pc.pix_copia_cola = novo;
          upd.push(env.DB.prepare('UPDATE carne_parcelas SET pix_copia_cola = ? WHERE id = ? AND tenant_id = ?').bind(novo, pc.id, auth.tenant_id));
        }
      }
      if (upd.length) await env.DB.batch(upd);
    }
  } catch { /* mostra como estava */ }

  return json({ carne, parcelas: lista, cliente, loja });
};

// DELETE /api/carnes/:id: exclui o carnê e suas parcelas
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
