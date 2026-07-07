import type { Env } from '../../../lib/types';
import { json } from '../../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

async function ensureColumns(env: Env) {
  try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN bloqueado INTEGER DEFAULT 0').run(); } catch {}
  try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN licenca_expira TEXT').run(); } catch {}
  try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN dispositivos_limite INTEGER DEFAULT 1').run(); } catch {}
  try { await env.DB.prepare("ALTER TABLE tenants ADD COLUMN dispositivo_modo TEXT DEFAULT 'bloquear'").run(); } catch {}
}

// GET /api/admin/licencas — lista todos os tenants
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  await ensureColumns(env);

  const result = await env.DB.prepare(
    `SELECT id, nome, email, tipo, plano, ativo,
            COALESCE(bloqueado, 0) as bloqueado,
            COALESCE(dispositivos_limite, 1) as dispositivos_limite,
            COALESCE(dispositivo_modo, 'bloquear') as dispositivo_modo,
            trial_expira, licenca_expira, created_at
     FROM tenants ORDER BY created_at DESC`
  ).all();

  const now = new Date().toISOString();
  const rows = (result.results as Record<string, unknown>[]).map(t => ({
    ...t,
    status: !t.ativo ? 'desativado'
      : t.bloqueado ? 'bloqueado'
      : t.plano === 'trial' && t.trial_expira && (t.trial_expira as string) < now ? 'trial_expirado'
      : t.plano !== 'trial' && t.licenca_expira && (t.licenca_expira as string) < now ? 'expirado'
      : t.plano === 'trial' ? 'trial'
      : 'ativo',
  }));

  return json(rows);
};

// DELETE /api/admin/licencas?id=xxx — exclui tenant e seus usuários
export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id obrigatório' }, 400);

  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM usuarios WHERE tenant_id = ?').bind(id),
      env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(id),
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PATCH /api/admin/licencas — atualiza licença de um tenant
export const onRequestPatch = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  await ensureColumns(env);

  const body = await request.json() as {
    id: string;
    plano?: string;
    licenca_expira?: string | null;
    bloqueado?: boolean;
    ativo?: boolean;
    dispositivos_limite?: number;
    dispositivo_modo?: string;
  };

  if (!body.id) return json({ error: 'id obrigatório' }, 400);

  const updates: string[] = [];
  const vals: unknown[] = [];

  if (body.plano !== undefined)         { updates.push('plano = ?');          vals.push(body.plano); }
  if (body.licenca_expira !== undefined) { updates.push('licenca_expira = ?'); vals.push(body.licenca_expira); }
  if (body.bloqueado !== undefined)     { updates.push('bloqueado = ?');      vals.push(body.bloqueado ? 1 : 0); }
  if (body.ativo !== undefined)         { updates.push('ativo = ?');          vals.push(body.ativo ? 1 : 0); }
  if (body.dispositivos_limite !== undefined) { updates.push('dispositivos_limite = ?'); vals.push(Math.max(1, Number(body.dispositivos_limite) || 1)); }
  if (body.dispositivo_modo !== undefined)    { updates.push('dispositivo_modo = ?');    vals.push(body.dispositivo_modo === 'rotacionar' ? 'rotacionar' : 'bloquear'); }

  if (!updates.length) return json({ error: 'Nada para atualizar' }, 400);

  vals.push(body.id);
  await env.DB.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).bind(...vals).run();

  return json({ ok: true });
};
