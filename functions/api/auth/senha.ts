import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { hashPassword, verifyPassword } from '../../lib/jwt';

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json() as { senha_atual: string; nova_senha: string };
    if (!body.senha_atual) return json({ error: 'Senha atual é obrigatória' }, 400);
    if (!body.nova_senha || body.nova_senha.length < 6) return json({ error: 'Nova senha deve ter pelo menos 6 caracteres' }, 400);

    const usuario = await env.DB.prepare(
      'SELECT senha_hash FROM usuarios WHERE id = ?'
    ).bind(auth.usuario_id).first<{ senha_hash: string }>();

    if (!usuario) return json({ error: 'Usuário não encontrado' }, 404);

    const ok = await verifyPassword(body.senha_atual, usuario.senha_hash);
    if (!ok) return json({ error: 'Senha atual incorreta' }, 400);

    const nova_hash = await hashPassword(body.nova_senha);
    await env.DB.prepare(
      'UPDATE usuarios SET senha_hash = ? WHERE id = ?'
    ).bind(nova_hash, auth.usuario_id).run();

    return json({ success: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
