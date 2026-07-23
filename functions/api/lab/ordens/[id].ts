import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const [ordem, receita, armacao, servicos] = await Promise.all([
      env.DB.prepare(`
        SELECT o.*, ot.nome as otica_nome, ot.cnpj as otica_cnpj, ot.telefone as otica_telefone,
               ot.cidade as otica_cidade, ot.uf as otica_uf,
               ot.endereco as otica_endereco, ot.bairro as otica_bairro, ot.cep as otica_cep,
               ot.codigo as otica_codigo, ot.condicao_pgto as otica_cond_pgto
        FROM lab_ordens o
        LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
        WHERE o.id = ? AND o.tenant_id = ?
      `).bind(id, tenant_id).first<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_receita WHERE ordem_id = ? ORDER BY olho ASC')
        .bind(id).all<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_armacao WHERE ordem_id = ?')
        .bind(id).first<Record<string, unknown>>().catch(() => null),

      env.DB.prepare('SELECT * FROM lab_servicos_os WHERE ordem_id = ? ORDER BY rowid ASC')
        .bind(id).all<Record<string, unknown>>(),
    ]);

    if (!ordem) return json({ error: 'Ordem não encontrada' }, 404);

    return json({ ordem, receita: receita.results, armacao, servicos: servicos.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    // Verifica se a OS pertence ao tenant
    const ordem = await env.DB.prepare(
      'SELECT id FROM lab_ordens WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenant_id).first();

    if (!ordem) return json({ error: 'Ordem não encontrada' }, 404);

    // Exclui cascata
    await env.DB.batch([
      env.DB.prepare('DELETE FROM lab_servicos_os WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_receita WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_armacao WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_ordens WHERE id = ? AND tenant_id = ?').bind(id, tenant_id),
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const body = await request.json() as { status?: string; previsao_entrega?: string; total?: number };
    const VALID = ['aguardando', 'em_producao', 'pronto', 'entregue', 'cancelado'];

    if (body.status !== undefined && !VALID.includes(body.status)) {
      return json({ error: 'Status inválido' }, 400);
    }
    if (body.previsao_entrega !== undefined && body.previsao_entrega !== null
        && !/^\d{4}-\d{2}-\d{2}$/.test(body.previsao_entrega)) {
      return json({ error: 'Data de entrega inválida (use AAAA-MM-DD)' }, 400);
    }
    if (body.total !== undefined && (typeof body.total !== 'number' || body.total < 0 || isNaN(body.total))) {
      return json({ error: 'Total inválido' }, 400);
    }
    if (body.status === undefined && body.previsao_entrega === undefined && body.total === undefined) {
      return json({ error: 'Informe status, previsao_entrega e/ou total' }, 400);
    }

    // garante a coluna de data de entrega
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN entregue_em TEXT').run(); } catch {}

    // monta o UPDATE só com os campos enviados
    const sets: string[] = [`updated_at = datetime('now')`];
    const vals: unknown[] = [];
    if (body.status !== undefined) {
      sets.push('status = ?', `entregue_em = CASE WHEN ? = 'entregue' THEN datetime('now') ELSE entregue_em END`);
      vals.push(body.status, body.status);
    }
    if (body.previsao_entrega !== undefined) {
      sets.push('previsao_entrega = ?');
      vals.push(body.previsao_entrega);
    }
    if (body.total !== undefined) {
      sets.push('total = ?');
      vals.push(body.total);
    }

    const result = await env.DB.prepare(
      `UPDATE lab_ordens SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`
    ).bind(...vals, id, tenant_id).run();

    if (!result.success) return json({ error: 'Ordem não encontrada' }, 404);

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
