import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_transportadoras (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        codigo INTEGER NOT NULL,
        nome TEXT NOT NULL,
        nome_reduzido TEXT,
        endereco TEXT, complemento TEXT, bairro TEXT,
        cidade TEXT, estado TEXT, cep TEXT,
        cnpj TEXT, insc TEXT, observacoes TEXT,
        telefone TEXT, celular TEXT, email TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch {}
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);
    const q = new URL(request.url).searchParams.get('q');
    let query = 'SELECT * FROM lab_transportadoras WHERE tenant_id = ?';
    const params: unknown[] = [tenant_id];
    if (q) { query += ' AND (nome LIKE ? OR nome_reduzido LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    query += ' ORDER BY codigo ASC';
    const result = await env.DB.prepare(query).bind(...params).all();
    return json(result.results);
  } catch (err) { return json({ error: 'Erro interno', detail: String(err) }, 500); }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);
    const body = await request.json() as Record<string, unknown>;
    if (!body.nome) return json({ error: 'Nome é obrigatório' }, 400);
    const numRow = await env.DB.prepare('SELECT COALESCE(MAX(codigo),0)+1 as next FROM lab_transportadoras WHERE tenant_id = ?').bind(tenant_id).first<{ next: number }>();
    const id = crypto.randomUUID();
    const codigo = numRow?.next ?? 1;
    await env.DB.prepare(`
      INSERT INTO lab_transportadoras (id,tenant_id,codigo,nome,nome_reduzido,endereco,complemento,bairro,cidade,estado,cep,cnpj,insc,observacoes,telefone,celular,email)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(id,tenant_id,codigo,body.nome,body.nome_reduzido??null,body.endereco??null,body.complemento??null,body.bairro??null,body.cidade??null,body.estado??null,body.cep??null,body.cnpj??null,body.insc??null,body.observacoes??null,body.telefone??null,body.celular??null,body.email??null).run();
    return json({ id, codigo }, 201);
  } catch (err) { return json({ error: 'Erro interno', detail: String(err) }, 500); }
};
