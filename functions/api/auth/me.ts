import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const usuario = await env.DB.prepare(
      'SELECT u.id, u.tenant_id, u.nome, u.email, u.perfil, u.ativo, t.nome as tenant_nome, t.tipo as tenant_tipo, t.plano, t.trial_expira, t.ativo as tenant_ativo FROM usuarios u JOIN tenants t ON t.id = u.tenant_id WHERE u.id = ?'
    ).bind(auth.usuario_id).first<Record<string, unknown>>();

    if (!usuario) return json({ error: 'Usuário não encontrado' }, 404);

    return json({
      token: null,
      usuario: {
        id: usuario.id,
        tenant_id: usuario.tenant_id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: Boolean(usuario.ativo),
      },
      tenant: {
        id: usuario.tenant_id,
        nome: usuario.tenant_nome,
        tipo: usuario.tenant_tipo,
        email: usuario.email,
        plano: usuario.plano,
        trial_expira: usuario.trial_expira,
        ativo: Boolean(usuario.tenant_ativo),
      },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
