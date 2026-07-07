import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';

async function ensureSchema(env: Env) {
  try { await env.DB.prepare('ALTER TABLE tenants ADD COLUMN dispositivos_limite INTEGER DEFAULT 1').run(); } catch { /* já existe */ }
  try { await env.DB.prepare("ALTER TABLE tenants ADD COLUMN dispositivo_modo TEXT DEFAULT 'bloquear'").run(); } catch { /* já existe */ }
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

// POST /api/vision/checkin
//   claim=true  → reivindica uma vaga (usado ao abrir/logar; pode deslogar outro no modo rotacionar)
//   claim=false → só verifica se este tablet ainda está válido (checagem periódica)
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureSchema(env);
    const body = await request.json().catch(() => ({})) as { device_id?: string; nome?: string; claim?: boolean };
    const deviceId = (body.device_id || '').trim();
    const claim = body.claim !== false; // default true
    if (!deviceId) return json({ error: 'device_id requerido' }, 400);

    const tenant = await env.DB.prepare(
      "SELECT COALESCE(dispositivos_limite, 1) as limite, COALESCE(dispositivo_modo, 'bloquear') as modo FROM tenants WHERE id = ?"
    ).bind(auth.tenant_id).first<Record<string, unknown>>();
    const limite = Number(tenant?.limite ?? 1) || 1;
    const modo = String(tenant?.modo ?? 'bloquear');

    const existente = await env.DB.prepare('SELECT id FROM dispositivos WHERE tenant_id = ? AND device_id = ?')
      .bind(auth.tenant_id, deviceId).first();

    // Já registrado → mantém e atualiza o acesso
    if (existente) {
      await env.DB.prepare("UPDATE dispositivos SET ultimo_acesso = datetime('now') WHERE tenant_id = ? AND device_id = ?")
        .bind(auth.tenant_id, deviceId).run();
      return json({ ok: true, limite, modo });
    }

    // Não registrado + verificação periódica → este tablet foi deslogado em outro lugar
    if (!claim) {
      return json({ ok: false, kicked: true });
    }

    // Não registrado + reivindicando vaga
    const cnt = await env.DB.prepare('SELECT COUNT(*) as n FROM dispositivos WHERE tenant_id = ?')
      .bind(auth.tenant_id).first<Record<string, unknown>>();
    const usados = Number(cnt?.n ?? 0);

    if (usados >= limite) {
      if (modo === 'rotacionar') {
        // Desloga os mais antigos até abrir 1 vaga
        const remover = usados - limite + 1;
        const antigos = await env.DB.prepare(
          'SELECT id FROM dispositivos WHERE tenant_id = ? ORDER BY ultimo_acesso ASC LIMIT ?'
        ).bind(auth.tenant_id, remover).all();
        for (const row of (antigos.results as Record<string, unknown>[])) {
          await env.DB.prepare('DELETE FROM dispositivos WHERE id = ?').bind(row.id).run();
        }
      } else {
        // modo bloquear
        return json({ ok: false, limite_atingido: true, limite, usados });
      }
    }

    await env.DB.prepare("INSERT INTO dispositivos (id, tenant_id, device_id, nome, ultimo_acesso) VALUES (?, ?, ?, ?, datetime('now'))")
      .bind(crypto.randomUUID(), auth.tenant_id, deviceId, body.nome || null).run();
    return json({ ok: true, limite, modo, rotacionado: modo === 'rotacionar' && usados >= limite });
  } catch (err) {
    return json({ error: 'Erro no check-in', detail: String(err) }, 500);
  }
};
