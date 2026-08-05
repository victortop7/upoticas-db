import type { Env } from '../../../lib/types';
import { json } from '../../../lib/auth-middleware';
import { hashPassword } from '../../../lib/jwt';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

// POST /api/admin/clientes — cria um novo cliente (tenant + usuário admin) direto, sem lead
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json() as {
      nome: string;             // nome da empresa/ótica/lab
      responsavel?: string;     // nome do usuário (default = nome)
      email: string;
      senha: string;
      tipo?: string;            // 'otica' | 'lab' | 'vision'
      plano?: string;           // 'trial' | 'mensal' | 'anual' | 'vitalicio'
      dias_trial?: number;
      licenca_expira?: string | null;
      dispositivos_limite?: number;
      valor_mensal?: number;
    };

    if (!body.nome?.trim() || !body.email?.trim() || !body.senha) {
      return json({ error: 'Campos obrigatórios: nome, email, senha' }, 400);
    }
    if (body.senha.length < 6) {
      return json({ error: 'Senha deve ter no mínimo 6 caracteres' }, 400);
    }

    const email = body.email.toLowerCase().trim();
    const existing = await env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first();
    if (existing) return json({ error: 'Este e-mail já possui uma conta' }, 409);
    const existingTenant = await env.DB.prepare('SELECT id FROM tenants WHERE email = ?').bind(email).first();
    if (existingTenant) return json({ error: 'Este e-mail já está em uso por outro cliente' }, 409);

    const tipo = ['lab', 'vision', 'otica'].includes(body.tipo || '') ? body.tipo! : 'otica';
    const dispositivos = Math.max(1, Number(body.dispositivos_limite) || 1);
    const valorMensal = Math.max(0, Number(body.valor_mensal) || 0);
    const plano = body.plano || 'trial';
    const dias = body.dias_trial ?? 14;
    const trialExpira = plano === 'trial'
      ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const licencaExpira = plano !== 'trial' && plano !== 'vitalicio' && body.licenca_expira
      ? body.licenca_expira
      : null;

    const tenantId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();
    const senhaHash = await hashPassword(body.senha);

    // Garante colunas de licença (mesma proteção do endpoint de licenças)
    try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN bloqueado INTEGER DEFAULT 0').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN licenca_expira TEXT').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN dispositivos_limite INTEGER DEFAULT 1').run(); } catch { /* já existe */ }
    try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN valor_mensal REAL').run(); } catch { /* já existe */ }

    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO tenants (id, nome, email, tipo, plano, trial_expira, licenca_expira, dispositivos_limite, valor_mensal, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
      ).bind(tenantId, body.nome.trim(), email, tipo, plano, trialExpira, licencaExpira, dispositivos, valorMensal || null),

      env.DB.prepare(
        'INSERT INTO usuarios (id, tenant_id, nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)'
      ).bind(usuarioId, tenantId, (body.responsavel || body.nome).trim(), email, senhaHash, 'admin'),
    ]);

    return json({
      ok: true,
      tenant_id: tenantId,
      usuario_id: usuarioId,
      nome: body.nome.trim(),
      email,
      tipo,
      plano,
      trial_expira: trialExpira,
      licenca_expira: licencaExpira,
    }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
