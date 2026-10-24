import type { Env } from '../../lib/types';
import { verifyPassword, signJWT } from '../../lib/jwt';
import { json } from '../../lib/auth-middleware';
import { ensureSistemas, parseSistemas, podeUsar } from '../../lib/sistemas';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body = await request.json() as { email: string; senha: string; sistema?: string };

    if (!body.email || !body.senha) {
      return json({ error: 'E-mail e senha são obrigatórios' }, 400);
    }

    await ensureSistemas(env.DB);
    const email = body.email.trim().toLowerCase();
    // Pode haver mais de um usuário com o mesmo e-mail (contas diferentes). Testa a senha em cada um
    // e prefere a conta que tem acesso ao sistema onde a pessoa está entrando.
    const res = await env.DB.prepare(
      `SELECT u.*, t.nome as tenant_nome, t.tipo as tenant_tipo, t.plano, t.trial_expira, t.sistemas,
              t.ativo as tenant_ativo, COALESCE(t.bloqueado, 0) as bloqueado, t.licenca_expira
       FROM usuarios u JOIN tenants t ON t.id = u.tenant_id
       WHERE lower(trim(u.email)) = ? AND u.ativo = 1
       ORDER BY t.ativo DESC, u.created_at ASC`
    ).bind(email).all<Record<string, unknown>>();

    const validos: Record<string, unknown>[] = [];
    for (const u of res.results || []) {
      if (await verifyPassword(body.senha, u.senha_hash as string)) validos.push(u);
    }
    if (!validos.length) {
      return json({ error: 'E-mail ou senha incorretos' }, 401);
    }
    const usuario = validos.find(u => podeUsar(u.sistemas, body.sistema)) || validos[0];

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
      licenca_expira: usuario.licenca_expira,
      bloqueado: Boolean(usuario.bloqueado),
      ativo: Boolean(usuario.tenant_ativo),
      sistemas: parseSistemas(usuario.sistemas),
    };

    const usuarioResp = {
      id: usuario.id,
      tenant_id: usuario.tenant_id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: Boolean(usuario.ativo),
      foto: usuario.foto || null,
      loja_id: (usuario.loja_id as string | null) ?? null,
      permissoes: (() => { try { return usuario.permissoes ? JSON.parse(String(usuario.permissoes)) : null; } catch { return null; } })(),
    };

    const response = json({ token, usuario: usuarioResp, tenant });
    const headers = new Headers(response.headers);
    headers.set('Set-Cookie', `up_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${86400 * 7}`);

    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
