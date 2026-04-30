import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const conta_id = url.searchParams.get('conta_id');
    const de = url.searchParams.get('de');
    const ate = url.searchParams.get('ate');

    let query = `
      SELECT l.*, cb.nome as conta_nome
      FROM lancamentos_bancarios l
      JOIN contas_bancarias cb ON cb.id = l.conta_id
      WHERE l.tenant_id = ?
    `;
    const params: unknown[] = [tenant_id];

    if (conta_id) { query += ' AND l.conta_id = ?'; params.push(conta_id); }
    if (de) { query += ' AND l.data_lancamento >= ?'; params.push(de); }
    if (ate) { query += ' AND l.data_lancamento <= ?'; params.push(ate); }

    query += ' ORDER BY l.data_lancamento DESC, l.created_at DESC LIMIT 200';

    const result = await env.DB.prepare(query).bind(...params).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as {
      conta_id: string; tipo: 'credito' | 'debito';
      valor: number; historico: string;
      documento?: string; data_lancamento: string;
    };

    if (!body.conta_id || !body.tipo || !body.valor || !body.historico || !body.data_lancamento) {
      return json({ error: 'Campos obrigatórios: conta_id, tipo, valor, historico, data_lancamento' }, 400);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO lancamentos_bancarios (id, tenant_id, conta_id, tipo, valor, historico, documento, data_lancamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, body.conta_id, body.tipo, body.valor, body.historico, body.documento ?? null, body.data_lancamento).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id é obrigatório' }, 400);

    await env.DB.prepare('DELETE FROM lancamentos_bancarios WHERE id=? AND tenant_id=?').bind(id, tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
