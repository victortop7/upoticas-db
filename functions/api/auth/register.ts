import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { hashPassword, signJWT } from '../../lib/jwt';
import { json } from '../../lib/auth-middleware';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { nome_otica: string; nome: string; email: string; senha: string };

    if (!body.nome_otica || !body.nome || !body.email || !body.senha) {
      return json({ error: 'Todos os campos são obrigatórios' }, 400);
    }
    if (body.senha.length < 6) {
      return json({ error: 'Senha deve ter no mínimo 6 caracteres' }, 400);
    }

    const existing = await env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(body.email).first();
    if (existing) {
      return json({ error: 'Este e-mail já está em uso' }, 409);
    }

    const tenantId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();
    const senhaHash = await hashPassword(body.senha);
    const trialExpira = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.batch([
      env.DB.prepare('INSERT INTO tenants (id, nome, email, plano, trial_expira) VALUES (?, ?, ?, ?, ?)')
        .bind(tenantId, body.nome_otica, body.email, 'trial', trialExpira),
      env.DB.prepare('INSERT INTO usuarios (id, tenant_id, nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(usuarioId, tenantId, body.nome, body.email, senhaHash, 'admin'),
    ]);

    const token = await signJWT({
      usuario_id: usuarioId,
      tenant_id: tenantId,
      email: body.email,
      perfil: 'admin',
    }, env.JWT_SECRET);

    const tenant = { id: tenantId, nome: body.nome_otica, email: body.email, plano: 'trial', trial_expira: trialExpira, ativo: true };
    const usuario = { id: usuarioId, tenant_id: tenantId, nome: body.nome, email: body.email, perfil: 'admin', ativo: true };

    const response = json({ token, usuario, tenant });
    const headers = new Headers(response.headers);
    headers.set('Set-Cookie', `up_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${86400 * 7}`);

    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
