import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// GET /lab/vendedores/:id — dados do vendedor + vendas (OS) e regiões que ele fez
export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const vendedor = await env.DB.prepare(
      'SELECT * FROM lab_vendedores WHERE id = ? AND tenant_id = ?'
    ).bind(params.id, tenant_id).first();
    if (!vendedor) return json({ error: 'Vendedor não encontrado' }, 404);

    // Garante colunas de vínculo (bases antigas podem não ter)
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN vendedor1_id TEXT').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN vendedor2_id TEXT').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN rota TEXT').run(); } catch { /* já existe */ }

    const vendas = await env.DB.prepare(`
      SELECT o.id, o.numero, o.status, o.tipo, o.ref_otica, o.rota, o.total, o.created_at, o.previsao_entrega,
             ot.nome as otica_nome, ot.codigo as otica_codigo, ot.cidade as otica_cidade, ot.uf as otica_uf
      FROM lab_ordens o
      LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
      WHERE o.tenant_id = ? AND (o.vendedor1_id = ? OR o.vendedor2_id = ?)
      ORDER BY o.created_at DESC
      LIMIT 1000
    `).bind(tenant_id, params.id, params.id).all();

    return json({ vendedor, vendas: vendas.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const b = await request.json() as Record<string, unknown>;
    await env.DB.prepare(`UPDATE lab_vendedores SET nome=?,cpf_cnpj=?,rg_insc=?,endereco=?,complemento=?,bairro=?,cidade=?,estado=?,cep=?,pct_comissao=?,observacoes=?,telefone=?,celular=?,email=? WHERE id=? AND tenant_id=?`)
      .bind(b.nome,b.cpf_cnpj??null,b.rg_insc??null,b.endereco??null,b.complemento??null,b.bairro??null,b.cidade??null,b.estado??null,b.cep??null,b.pct_comissao??null,b.observacoes??null,b.telefone??null,b.celular??null,b.email??null,params.id,tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await env.DB.prepare('DELETE FROM lab_vendedores WHERE id=? AND tenant_id=?').bind(params.id, tenant_id).run();
    return json({ ok: true });
  } catch (err) { return json({ error: String(err) }, 500); }
};
