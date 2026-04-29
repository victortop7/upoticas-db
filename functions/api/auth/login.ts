import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { verifyPassword, signJWT } from '../../lib/jwt';
import { json } from '../../lib/auth-middleware';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { email: string; senha: string };

    if (!body.email || !body.senha) {
      return json({ error: 'E-mail e senha são obrigatórios' }, 400);
    }

    const usuario = await env.DB.prepare(
      'SELECT u.*, t.nome as tenant_nome, t.tipo as tenant_tipo, t.plano, t.trial_expira, t.ativo as tenant_ativo FROM usuarios u JOIN tenants t ON t.id = u.tenant_id WHERE u.email = ? AND u.ativo = 1'
    ).bind(body.email).first<Record<string, unknown>>();

    if (!usuario) {
      return json({ error: 'E-mail ou senha incorretos' }, 401);
    }

    const valid = await verifyPassword(body.senha, usuario.senha_hash as string);
    if (!valid) {
      return json({ error: 'E-mail ou senha incorretos' }, 401);
    }

    const token = await signJWT({
      usuario_id: usuario.id,
      tenant_id: usuario.tenant_id,
      email: usuario.email,
      perfil: usuario.perfil,
    }, env.JWT_SECRET);

    const tenant = {
      id: usuario.tenant_id,
      nome: usuario.tenant_nome,
      tipo: usuario.tenant_tipo,
      email: usuario.email,
      plano: usuario.plano,
      trial_expira: usuario.trial_expira,
      ativo: Boolean(usuario.tenant_ativo),
    };

    const usuarioResp = {
      id: usuario.id,
      tenant_id: usuario.tenant_id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: Boolean(usuario.ativo),
    };

    const response = json({ token, usuario: usuarioResp, tenant });
    const headers = new Headers(response.headers);
    headers.set('Set-Cookie', `up_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${86400 * 7}`);

    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
