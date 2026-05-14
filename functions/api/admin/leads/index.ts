import type { Env } from '../../../lib/types';
import { json } from '../../../lib/auth-middleware';
import { hashPassword } from '../../../lib/jwt';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

// GET /api/admin/leads — lista todos os leads
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const result = await env.DB.prepare(
      `SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`
    ).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// POST /api/admin/leads — cria conta a partir de um lead
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json() as {
      lead_id: string;
      nome_lab: string;
      nome_responsavel: string;
      email: string;
      senha: string;
      plano: string;        // 'trial' | 'mensal' | 'anual' | 'vitalicio'
      dias_trial?: number;
      licenca_expira?: string;
    };

    if (!body.lead_id || !body.nome_lab || !body.nome_responsavel || !body.email || !body.senha) {
      return json({ error: 'Campos obrigatórios: lead_id, nome_lab, nome_responsavel, email, senha' }, 400);
    }
    if (body.senha.length < 6) {
      return json({ error: 'Senha deve ter no mínimo 6 caracteres' }, 400);
    }

    const existing = await env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(body.email.toLowerCase()).first();
    if (existing) return json({ error: 'Este e-mail já possui uma conta' }, 409);

    const tenantId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();
    const senhaHash = await hashPassword(body.senha);

    const plano = body.plano || 'trial';
    const dias = body.dias_trial ?? 14;
    const trialExpira = plano === 'trial'
      ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const licencaExpira = plano !== 'trial' && plano !== 'vitalicio' && body.licenca_expira
      ? body.licenca_expira
      : null;

    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO tenants (id, nome, email, tipo, plano, trial_expira, licenca_expira, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
      ).bind(tenantId, body.nome_lab.trim(), body.email.toLowerCase().trim(), 'lab', plano, trialExpira, licencaExpira),

      env.DB.prepare(
        'INSERT INTO usuarios (id, tenant_id, nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)'
      ).bind(usuarioId, tenantId, body.nome_responsavel.trim(), body.email.toLowerCase().trim(), senhaHash, 'admin'),

      env.DB.prepare(
        `UPDATE leads SET status = 'convertido' WHERE id = ?`
      ).bind(body.lead_id),
    ]);

    return json({
      ok: true,
      tenant_id: tenantId,
      usuario_id: usuarioId,
      email: body.email.toLowerCase().trim(),
      nome_lab: body.nome_lab.trim(),
      nome_responsavel: body.nome_responsavel.trim(),
      plano,
      trial_expira: trialExpira,
      licenca_expira: licencaExpira,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PATCH /api/admin/leads — atualiza status do lead
export const onRequestPatch = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json() as { id: string; status: string };
    if (!body.id || !body.status) return json({ error: 'id e status obrigatórios' }, 400);

    await env.DB.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(body.status, body.id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
