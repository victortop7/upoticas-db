import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureCols(env: Env) {
  for (const col of [
    'codigo TEXT', 'unidade TEXT',
    'valor_lista2 REAL', 'valor_lista3 REAL', 'valor_lista4 REAL', 'valor_lista5 REAL',
  ]) {
    try { await env.DB.prepare(`ALTER TABLE lab_servicos_catalogo ADD COLUMN ${col}`).run(); } catch {}
  }
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureCols(env);

    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    let query = `SELECT id, codigo, nome, unidade, valor_padrao, valor_lista2,
                        COALESCE(valor_lista3,0) as valor_lista3,
                        COALESCE(valor_lista4,0) as valor_lista4,
                        COALESCE(valor_lista5,0) as valor_lista5,
                        ativo
                 FROM lab_servicos_catalogo WHERE tenant_id = ?`;
    const params: unknown[] = [tenant_id];
    if (q) {
      query += ' AND (nome LIKE ? OR codigo LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    query += ' ORDER BY codigo ASC, nome ASC';

    const result = await env.DB.prepare(query).bind(...params).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

const ALLOWED_LISTA_FIELDS = new Set(['valor_padrao','valor_lista2','valor_lista3','valor_lista4','valor_lista5']);

export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const field = url.searchParams.get('field');

    if (action === 'clear-lista' && field && ALLOWED_LISTA_FIELDS.has(field)) {
      await env.DB.prepare(
        `UPDATE lab_servicos_catalogo SET ${field} = 0 WHERE tenant_id = ?`
      ).bind(tenant_id).run();
      return json({ ok: true });
    }

    return json({ error: 'Parâmetros inválidos' }, 400);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureCols(env);

    const body = await request.json() as Record<string, unknown>;

    // Seed bulk insert
    if (body.seed && Array.isArray(body.items)) {
      type Item = { codigo: string; nome: string; unidade: string; preco1: number; preco2: number };
      const items = body.items as Item[];
      const stmts = items.map(it =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO lab_servicos_catalogo (id, tenant_id, codigo, nome, unidade, valor_padrao, valor_lista2, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
        ).bind(crypto.randomUUID(), tenant_id, it.codigo, it.nome, it.unidade || null, it.preco1 || 0, it.preco2 || null)
      );
      for (let i = 0; i < stmts.length; i += 100) {
        await env.DB.batch(stmts.slice(i, i + 100));
      }
      return json({ ok: true, inserted: items.length }, 201);
    }

    if (!body.nome) return json({ error: 'Nome é obrigatório' }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO lab_servicos_catalogo
       (id, tenant_id, codigo, nome, unidade, valor_padrao, valor_lista2, valor_lista3, valor_lista4, valor_lista5, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).bind(
      id, tenant_id,
      body.codigo ?? null, body.nome, body.unidade ?? null,
      body.valor_padrao ?? 0, body.valor_lista2 ?? null,
      body.valor_lista3 ?? null, body.valor_lista4 ?? null, body.valor_lista5 ?? null
    ).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
