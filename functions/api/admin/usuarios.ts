import type { Env } from '../../lib/types';
import { json } from '../../lib/auth-middleware';
import { ensureLojaCols } from '../../lib/lojas';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth.replace(/^Bearer\s+/i, '').trim() === env.ADMIN_SECRET.trim();
}

async function ensurePermissoes(env: Env) {
  await ensureLojaCols(env.DB);
  try { await env.DB.prepare('ALTER TABLE usuarios ADD COLUMN permissoes TEXT').run(); } catch { /* já existe */ }
}

const PERFIS = ['admin', 'vendedor', 'caixa', 'marketing', 'financeiro', 'digitador'];

// GET /api/admin/usuarios?tenant_id=xxx: usuários (sem senha) + lojas da conta
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  const tenantId = new URL(request.url).searchParams.get('tenant_id');
  if (!tenantId) return json({ error: 'tenant_id obrigatório' }, 400);
  try {
    await ensurePermissoes(env);
    const u = await env.DB.prepare(
      `SELECT id, nome, email, perfil, ativo, loja_id, permissoes FROM usuarios WHERE tenant_id = ?
       ORDER BY perfil = 'admin' DESC, nome ASC`
    ).bind(tenantId).all<Record<string, unknown>>();
    const l = await env.DB.prepare('SELECT id, nome FROM lojas WHERE tenant_id = ? AND ativo = 1 ORDER BY nome')
      .bind(tenantId).all();
    const usuarios = (u.results || []).map(r => {
      let permissoes = null;
      try { permissoes = r.permissoes ? JSON.parse(String(r.permissoes)) : null; } catch { /* inválido */ }
      return { ...r, permissoes };
    });
    return json({ usuarios, lojas: l.results || [] });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PATCH /api/admin/usuarios  { id, perfil?, loja_id?, permissoes? (null = padrão do perfil) }
export const onRequestPatch = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  try {
    await ensurePermissoes(env);
    const body = await request.json() as {
      id?: string; perfil?: string; loja_id?: string | null;
      permissoes?: { menus?: string[] | null; todas_lojas?: boolean } | null;
    };
    if (!body.id) return json({ error: 'id obrigatório' }, 400);
    const atual = await env.DB.prepare('SELECT id, tenant_id, perfil FROM usuarios WHERE id = ?')
      .bind(body.id).first<{ id: string; tenant_id: string; perfil: string }>();
    if (!atual) return json({ error: 'Usuário não encontrado' }, 404);

    const sets: string[] = [];
    const vals: unknown[] = [];
    const perfil = body.perfil !== undefined ? body.perfil : atual.perfil;
    if (body.perfil !== undefined) {
      if (!PERFIS.includes(body.perfil)) return json({ error: 'Perfil inválido' }, 400);
      sets.push('perfil = ?'); vals.push(body.perfil);
    }
    if (body.loja_id !== undefined || perfil === 'admin') {
      let loja: string | null = perfil === 'admin' ? null : (body.loja_id || null);
      if (loja) {
        const ok = await env.DB.prepare('SELECT id FROM lojas WHERE id = ? AND tenant_id = ?').bind(loja, atual.tenant_id).first();
        if (!ok) loja = null;
      }
      sets.push('loja_id = ?'); vals.push(loja);
    }
    if (body.permissoes !== undefined) {
      const p = body.permissoes;
      const limpo = p ? {
        menus: Array.isArray(p.menus) ? p.menus.filter(m => typeof m === 'string' && m.startsWith('/')).slice(0, 60) : null,
        todas_lojas: Boolean(p.todas_lojas),
      } : null;
      sets.push('permissoes = ?'); vals.push(limpo ? JSON.stringify(limpo) : null);
    }
    if (!sets.length) return json({ error: 'Nada para atualizar' }, 400);
    vals.push(body.id);
    await env.DB.prepare(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
