import type { Env } from '../../lib/types';
import { hashPassword } from '../../lib/jwt';
import { json } from '../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth.replace(/^Bearer\s+/i, '').trim() === env.ADMIN_SECRET.trim();
}

// POST /api/admin/senha — altera a senha de qualquer usuário (por email), acesso super-admin.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json() as { email?: string; nova_senha?: string };
    const email = (body.email || '').trim().toLowerCase();
    const nova = body.nova_senha || '';
    if (!email) return json({ error: 'Email obrigatório' }, 400);
    if (nova.length < 6) return json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, 400);

    const usuario = await env.DB.prepare(
      `SELECT u.id, u.nome, u.email, u.tenant_id, t.nome AS tenant_nome
       FROM usuarios u LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = ?`
    ).bind(email).first<{ id: string; nome: string; email: string; tenant_id: string; tenant_nome: string | null }>();

    if (!usuario) return json({ error: 'Nenhum usuário encontrado com esse email' }, 404);

    const senha_hash = await hashPassword(nova);
    await env.DB.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').bind(senha_hash, usuario.id).run();

    return json({ ok: true, usuario: { nome: usuario.nome, email: usuario.email, tenant_nome: usuario.tenant_nome } });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
