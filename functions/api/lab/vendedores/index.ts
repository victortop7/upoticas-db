import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_vendedores (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, codigo INTEGER NOT NULL,
        nome TEXT NOT NULL, cpf_cnpj TEXT, rg_insc TEXT,
        endereco TEXT, complemento TEXT, bairro TEXT, cidade TEXT, estado TEXT, cep TEXT,
        pct_comissao REAL, observacoes TEXT, telefone TEXT, celular TEXT, email TEXT,
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
    let query = 'SELECT * FROM lab_vendedores WHERE tenant_id = ?';
    const params: unknown[] = [tenant_id];
    if (q) { query += ' AND nome LIKE ?'; params.push(`%${q}%`); }
    query += ' ORDER BY codigo ASC';
    const r = await env.DB.prepare(query).bind(...params).all();
    return json(r.results);
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);
    const b = await request.json() as Record<string, unknown>;
    if (!b.nome) return json({ error: 'Nome obrigatório' }, 400);
    const numRow = await env.DB.prepare('SELECT COALESCE(MAX(codigo),0)+1 as next FROM lab_vendedores WHERE tenant_id=?').bind(tenant_id).first<{ next: number }>();
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO lab_vendedores (id,tenant_id,codigo,nome,cpf_cnpj,rg_insc,endereco,complemento,bairro,cidade,estado,cep,pct_comissao,observacoes,telefone,celular,email) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,tenant_id,numRow?.next??1,b.nome,b.cpf_cnpj??null,b.rg_insc??null,b.endereco??null,b.complemento??null,b.bairro??null,b.cidade??null,b.estado??null,b.cep??null,b.pct_comissao??null,b.observacoes??null,b.telefone??null,b.celular??null,b.email??null).run();
    return json({ id }, 201);
  } catch (err) { return json({ error: String(err) }, 500); }
};
