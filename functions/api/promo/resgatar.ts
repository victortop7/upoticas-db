import type { Env } from '../../lib/types';
import { hashPassword, verifyPassword, signJWT } from '../../lib/jwt';
import { json } from '../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS codigos_teste (
        id TEXT PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        dias INTEGER DEFAULT 15,
        usado INTEGER DEFAULT 0,
        usado_por TEXT,
        usado_em TEXT,
        nome_contato TEXT,
        criado_em TEXT DEFAULT (datetime('now'))
      )`
    ).run();
  } catch { /* ok */ }
}

// POST /api/promo/resgatar — resgata código de teste grátis (cria ou estende conta)
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    await ensureTable(env);
    const body = await request.json() as {
      codigo?: string; nome_otica?: string; nome?: string; email?: string; senha?: string;
    };

    const codigo = (body.codigo || '').trim().toUpperCase();
    const email = (body.email || '').trim().toLowerCase();
    const senha = body.senha || '';
    if (!codigo || !email || !senha) return json({ error: 'Preencha o código, e-mail e senha.' }, 400);

    const code = await env.DB.prepare('SELECT * FROM codigos_teste WHERE codigo = ?')
      .bind(codigo).first<Record<string, unknown>>();
    if (!code) return json({ error: 'Código inválido.' }, 400);
    if (code.usado) return json({ error: 'Este código já foi utilizado.' }, 400);

    const dias = Number(code.dias) || 15;
    const trialExpira = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    let usuarioId: string, tenantId: string, perfil: string, tenantNome: string;

    const existing = await env.DB.prepare(
      'SELECT id, tenant_id, senha_hash, perfil FROM usuarios WHERE email = ?'
    ).bind(email).first<Record<string, unknown>>();

    if (existing) {
      // Conta já existe → valida senha e ESTENDE o trial
      const ok = await verifyPassword(senha, existing.senha_hash as string);
      if (!ok) return json({ error: 'E-mail já cadastrado. Senha incorreta.' }, 401);
      usuarioId = existing.id as string;
      tenantId = existing.tenant_id as string;
      perfil = (existing.perfil as string) || 'admin';
      await env.DB.prepare(
        "UPDATE tenants SET trial_expira = ?, plano = 'trial', bloqueado = 0 WHERE id = ?"
      ).bind(trialExpira, tenantId).run();
      const t = await env.DB.prepare('SELECT nome FROM tenants WHERE id = ?').bind(tenantId).first<Record<string, unknown>>();
      tenantNome = (t?.nome as string) || 'Minha Ótica';
    } else {
      // Conta nova
      if (!body.nome_otica || !body.nome) return json({ error: 'Preencha o nome da ótica e o seu nome.' }, 400);
      if (senha.length < 6) return json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, 400);
      tenantId = crypto.randomUUID();
      usuarioId = crypto.randomUUID();
      perfil = 'admin';
      tenantNome = body.nome_otica;
      const senhaHash = await hashPassword(senha);
      await env.DB.batch([
        env.DB.prepare('INSERT INTO tenants (id, nome, email, tipo, plano, trial_expira) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(tenantId, body.nome_otica, email, 'otica', 'trial', trialExpira),
        env.DB.prepare('INSERT INTO usuarios (id, tenant_id, nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(usuarioId, tenantId, body.nome, email, senhaHash, 'admin'),
      ]);
    }

    // Marca o código como usado
    await env.DB.prepare("UPDATE codigos_teste SET usado = 1, usado_por = ?, usado_em = datetime('now') WHERE id = ?")
      .bind(email, code.id).run();

    const token = await signJWT({ usuario_id: usuarioId, tenant_id: tenantId, email, perfil }, env.JWT_SECRET);
    const usuario = { id: usuarioId, tenant_id: tenantId, nome: body.nome || email, email, perfil, ativo: true };
    const tenant = { id: tenantId, nome: tenantNome, email, tipo: 'otica', plano: 'trial', trial_expira: trialExpira, ativo: true };

    const resp = json({ token, usuario, tenant, dias });
    const headers = new Headers(resp.headers);
    headers.set('Set-Cookie', `up_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${86400 * 7}`);
    return new Response(resp.body, { status: 200, headers });
  } catch (err) {
    return json({ error: 'Erro ao resgatar o código', detail: String(err) }, 500);
  }
};
