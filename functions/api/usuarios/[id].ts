import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { hashPassword } from '../../lib/jwt';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admins podem editar usuários' }, 403);

  try {
    const body = await request.json() as Record<string, string>;
    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);

    const existing = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE id = ? AND tenant_id = ?'
    ).bind(params.id, auth.tenant_id).first();
    if (!existing) return json({ error: 'Usuário não encontrado' }, 404);

    if (body.senha) {
      if (body.senha.length < 6) return json({ error: 'Senha deve ter pelo menos 6 caracteres' }, 400);
      const senha_hash = await hashPassword(body.senha);
      await env.DB.prepare(
        'UPDATE usuarios SET nome = ?, perfil = ?, senha_hash = ? WHERE id = ? AND tenant_id = ?'
      ).bind(body.nome.trim(), body.perfil || 'vendedor', senha_hash, params.id, auth.tenant_id).run();
    } else {
      await env.DB.prepare(
        'UPDATE usuarios SET nome = ?, perfil = ? WHERE id = ? AND tenant_id = ?'
      ).bind(body.nome.trim(), body.perfil || 'vendedor', params.id, auth.tenant_id).run();
    }

    const usuario = await env.DB.prepare(
      'SELECT id, nome, email, perfil, ativo FROM usuarios WHERE id = ?'
    ).bind(params.id).first();
    return json(usuario);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admins podem excluir usuários' }, 403);
  if (params.id === auth.usuario_id) return json({ error: 'Não é possível excluir seu próprio usuário' }, 400);

  const existing = await env.DB.prepare(
    'SELECT id FROM usuarios WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).first();
  if (!existing) return json({ error: 'Usuário não encontrado' }, 404);

  await env.DB.prepare(
    'UPDATE usuarios SET ativo = 0 WHERE id = ? AND tenant_id = ?'
  ).bind(params.id, auth.tenant_id).run();

  return json({ success: true });
};
