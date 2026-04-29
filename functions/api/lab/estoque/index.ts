import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const marca = url.searchParams.get('marca');
    const indice = url.searchParams.get('indice');
    const tratamento = url.searchParams.get('tratamento');
    const tipo = url.searchParams.get('tipo');

    let query = 'SELECT * FROM lab_estoque WHERE tenant_id = ? AND ativo = 1';
    const params: unknown[] = [tenant_id];

    if (marca) { query += ' AND marca = ?'; params.push(marca); }
    if (indice) { query += ' AND indice = ?'; params.push(indice); }
    if (tratamento) { query += ' AND tratamento = ?'; params.push(tratamento); }
    if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }

    query += ' ORDER BY marca ASC, indice ASC, tratamento ASC';

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
      marca: string; tratamento: string; indice: string; tipo: string;
      descricao?: string; quantidade?: number; quantidade_minima?: number;
    };

    if (!body.marca || !body.indice) {
      return json({ error: 'Marca e índice são obrigatórios' }, 400);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO lab_estoque (id, tenant_id, marca, tratamento, indice, tipo, descricao, quantidade, quantidade_minima) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, tenant_id,
      body.marca, body.tratamento ?? 'Sem tratamento',
      body.indice, body.tipo ?? 'monofocal',
      body.descricao ?? null,
      body.quantidade ?? 0,
      body.quantidade_minima ?? 5,
    ).run();

    return json({ id }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
