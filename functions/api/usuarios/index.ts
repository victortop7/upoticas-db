import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { hashPassword } from '../../lib/jwt';
import { ensureLojaCols } from '../../lib/lojas';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureLojaCols(env.DB);

  const result = await env.DB.prepare(
    'SELECT id, nome, email, perfil, ativo, loja_id, created_at FROM usuarios WHERE tenant_id = ? ORDER BY nome ASC'
  ).bind(auth.tenant_id).all();

  return json({ usuarios: result.results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas admins podem criar usuários' }, 403);
  await ensureLojaCols(env.DB);

  try {
    const body = await request.json() as Record<string, string>;
    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
    if (!body.email?.trim()) return json({ error: 'E-mail é obrigatório' }, 400);
    if (!body.senha || body.senha.length < 6) return json({ error: 'Senha deve ter pelo menos 6 caracteres' }, 400);

    const existing = await env.DB.prepare(
      'SELECT tenant_id FROM usuarios WHERE lower(trim(email)) = ?'
    ).bind(body.email.trim().toLowerCase()).first<{ tenant_id: string }>();
    // e-mail é o login dos sistemas (Óticas, Vision, LAB): não pode repetir nem em outra conta
    if (existing) return json({ error: existing.tenant_id === auth.tenant_id ? 'E-mail já cadastrado' : 'Este e-mail já é usado em outra conta. Use outro e-mail ou peça ao suporte para unir as contas.' }, 409);

    const id = crypto.randomUUID();
    const senha_hash = await hashPassword(body.senha);
    const now = new Date().toISOString();
    const perfil = body.perfil || 'vendedor';
    // admin não fica preso a loja (vê tudo); demais perfis podem ter loja
    const lojaId = perfil === 'admin' ? null : (body.loja_id || null);

    await env.DB.prepare(
      'INSERT INTO usuarios (id, tenant_id, nome, email, senha_hash, perfil, ativo, loja_id, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
    ).bind(id, auth.tenant_id, body.nome.trim(), body.email.trim().toLowerCase(), senha_hash, perfil, lojaId, now).run();

    return json({ id, nome: body.nome.trim(), email: body.email.trim().toLowerCase(), perfil, loja_id: lojaId, ativo: true }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
