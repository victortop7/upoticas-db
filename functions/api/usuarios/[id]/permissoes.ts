import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureLojaCols } from '../../../lib/lojas';

const PERFIS = ['admin', 'vendedor', 'caixa', 'marketing', 'financeiro'];

// PUT /api/usuarios/:id/permissoes  { perfil, loja_id, permissoes: { menus, todas_lojas } | null }
// O administrador da ótica define cargo, loja e telas de cada pessoa da própria conta.
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas o administrador define permissões' }, 403);
  try {
    await ensureLojaCols(env.DB);
    try { await env.DB.prepare('ALTER TABLE usuarios ADD COLUMN permissoes TEXT').run(); } catch { /* já existe */ }
    const id = String(params.id);
    const alvo = await env.DB.prepare('SELECT id FROM usuarios WHERE id = ? AND tenant_id = ?').bind(id, auth.tenant_id).first();
    if (!alvo) return json({ error: 'Usuário não encontrado' }, 404);

    const b = await request.json() as { perfil?: string; loja_id?: string | null; permissoes?: { menus?: string[] | null; todas_lojas?: boolean } | null };
    const perfil = b.perfil && PERFIS.includes(b.perfil) ? b.perfil : null;
    if (!perfil) return json({ error: 'Cargo inválido' }, 400);
    // o administrador não pode tirar o próprio acesso de admin (ficaria sem como voltar)
    if (id === auth.usuario_id && perfil !== 'admin') return json({ error: 'Você não pode tirar o seu próprio acesso de administrador' }, 400);

    let loja: string | null = perfil === 'admin' ? null : (b.loja_id || null);
    if (loja) {
      const ok = await env.DB.prepare('SELECT id FROM lojas WHERE id = ? AND tenant_id = ?').bind(loja, auth.tenant_id).first();
      if (!ok) loja = null;
    }
    const p = perfil === 'admin' ? null : b.permissoes;
    const limpo = p ? {
      menus: Array.isArray(p.menus) ? p.menus.filter(m => typeof m === 'string' && m.startsWith('/')).slice(0, 60) : null,
      todas_lojas: Boolean(p.todas_lojas),
    } : null;

    await env.DB.prepare('UPDATE usuarios SET perfil = ?, loja_id = ?, permissoes = ? WHERE id = ? AND tenant_id = ?')
      .bind(perfil, loja, limpo ? JSON.stringify(limpo) : null, id, auth.tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
