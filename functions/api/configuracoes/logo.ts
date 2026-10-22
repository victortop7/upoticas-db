import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

async function ensureLogo(db: Env['DB']) {
  try { await db.prepare('ALTER TABLE tenants ADD COLUMN logo TEXT').run(); } catch { /* já existe */ }
}

// GET /api/configuracoes/logo: logo da loja (data URL) ou null
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  await ensureLogo(env.DB);
  const t = await env.DB.prepare('SELECT logo FROM tenants WHERE id = ?').bind(auth.tenant_id).first<{ logo: string | null }>();
  return json({ logo: t?.logo || null });
};

// PUT { logo: "data:image/png;base64,..." | null }: só admin
export const onRequestPut = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Apenas o administrador altera a logo' }, 403);
  try {
    await ensureLogo(env.DB);
    const body = await request.json() as { logo?: string | null };
    const logo = body.logo || null;
    if (logo) {
      if (!/^data:image\/(png|jpeg|webp);base64,/.test(logo)) return json({ error: 'Envie uma imagem PNG ou JPG' }, 400);
      if (logo.length > 700_000) return json({ error: 'Imagem muito grande (máx. ~500 KB)' }, 400);
    }
    await env.DB.prepare('UPDATE tenants SET logo = ? WHERE id = ?').bind(logo, auth.tenant_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
