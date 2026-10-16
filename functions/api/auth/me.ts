import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';
import { ensureSistemas, parseSistemas } from '../../lib/sistemas';

function lerPermissoes(raw: unknown) {
  try { return raw ? JSON.parse(String(raw)) : null; } catch { return null; }
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureSistemas(env.DB);
    try { await env.DB.prepare('ALTER TABLE usuarios ADD COLUMN permissoes TEXT').run(); } catch { /* já existe */ }
    const usuario = await env.DB.prepare(
      `SELECT u.id, u.tenant_id, u.nome, u.email, u.perfil, u.ativo, u.permissoes,
              t.nome as tenant_nome, t.tipo as tenant_tipo, t.plano,
              t.trial_expira, t.ativo as tenant_ativo, t.sistemas,
              COALESCE(t.bloqueado, 0) as bloqueado,
              t.licenca_expira
       FROM usuarios u JOIN tenants t ON t.id = u.tenant_id WHERE u.id = ?`
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
        permissoes: lerPermissoes(usuario.permissoes),
      },
      tenant: {
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
      },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
