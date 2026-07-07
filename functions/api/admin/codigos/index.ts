import type { Env } from '../../../lib/types';
import { json } from '../../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS codigos_teste (
        id TEXT PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        dias INTEGER DEFAULT 15,
        usado INTEGER DEFAULT 0,
        usado_por TEXT,
        usado_em TEXT,
        nome_contato TEXT,
        criado_em TEXT DEFAULT (datetime('now'))
      )`
    ).run();
  } catch { /* ok */ }
}

// Gera um código legível: VISION-XXXX (sem caracteres ambíguos)
function gerarCodigo(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `VISION-${s}`;
}

// GET /api/admin/codigos — lista todos os códigos
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  await ensureTable(env);
  const { results } = await env.DB.prepare(
    'SELECT id, codigo, dias, usado, usado_por, usado_em, nome_contato, criado_em FROM codigos_teste ORDER BY criado_em DESC'
  ).all();
  return json(results || []);
};

// POST /api/admin/codigos — gera um novo código { nome_contato?, dias? }
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  await ensureTable(env);
  const body = await request.json().catch(() => ({})) as { nome_contato?: string; dias?: number };
  const dias = Number(body.dias) > 0 ? Number(body.dias) : 15;

  // tenta até achar um código único
  let codigo = gerarCodigo();
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const existe = await env.DB.prepare('SELECT id FROM codigos_teste WHERE codigo = ?').bind(codigo).first();
    if (!existe) break;
    codigo = gerarCodigo();
  }

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO codigos_teste (id, codigo, dias, nome_contato) VALUES (?, ?, ?, ?)')
    .bind(id, codigo, dias, body.nome_contato || null).run();

  return json({ id, codigo, dias, nome_contato: body.nome_contato || null, usado: 0 });
};

// DELETE /api/admin/codigos?id=xxx — exclui um código
export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  await ensureTable(env);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id requerido' }, 400);
  await env.DB.prepare('DELETE FROM codigos_teste WHERE id = ?').bind(id).run();
  return json({ ok: true });
};
