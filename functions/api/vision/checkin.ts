import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';

async function ensureSchema(env: Env) {
  try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN dispositivos_limite INTEGER DEFAULT 1').run(); } catch { /* já existe */ }
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS dispositivos (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        nome TEXT,
        ultimo_acesso TEXT,
        criado_em TEXT DEFAULT (datetime('now')),
        UNIQUE(tenant_id, device_id)
      )`
    ).run();
  } catch { /* ok */ }
}

// POST /api/vision/checkin — valida o tablet contra o limite de dispositivos da conta
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureSchema(env);
    const body = await request.json().catch(() => ({})) as { device_id?: string; nome?: string };
    const deviceId = (body.device_id || '').trim();
    if (!deviceId) return json({ error: 'device_id requerido' }, 400);

    const tenant = await env.DB.prepare('SELECT COALESCE(dispositivos_limite, 1) as limite FROM tenants WHERE id = ?')
      .bind(auth.tenant_id).first<Record<string, unknown>>();
    const limite = Number(tenant?.limite ?? 1) || 1;

    // Este dispositivo já está registrado? Só atualiza o acesso e libera.
    const existente = await env.DB.prepare('SELECT id FROM dispositivos WHERE tenant_id = ? AND device_id = ?')
      .bind(auth.tenant_id, deviceId).first();
    if (existente) {
      await env.DB.prepare("UPDATE dispositivos SET ultimo_acesso = datetime('now') WHERE tenant_id = ? AND device_id = ?")
        .bind(auth.tenant_id, deviceId).run();
      return json({ ok: true, limite });
    }

    // Novo dispositivo: só entra se ainda houver vaga
    const cnt = await env.DB.prepare('SELECT COUNT(*) as n FROM dispositivos WHERE tenant_id = ?')
      .bind(auth.tenant_id).first<Record<string, unknown>>();
    const usados = Number(cnt?.n ?? 0);

    if (usados >= limite) {
      return json({ ok: false, limite_atingido: true, limite, usados });
    }

    await env.DB.prepare("INSERT INTO dispositivos (id, tenant_id, device_id, nome, ultimo_acesso) VALUES (?, ?, ?, ?, datetime('now'))")
      .bind(crypto.randomUUID(), auth.tenant_id, deviceId, body.nome || null).run();
    return json({ ok: true, limite, usados: usados + 1 });
  } catch (err) {
    return json({ error: 'Erro no check-in', detail: String(err) }, 500);
  }
};
