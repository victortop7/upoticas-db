import type { Env } from '../../lib/types';
import { requireAuthBasic, json } from '../../lib/auth-middleware';

let jaGarantiu = false;
export async function ensureFotoUsuario(db: Env['DB']) {
  if (jaGarantiu) return;
  try { await db.prepare('ALTER TABLE usuarios ADD COLUMN foto TEXT').run(); } catch { /* já existe */ }
  jaGarantiu = true;
}

// PUT /api/auth/foto  { foto: dataURL | null }: foto de perfil do próprio usuário (aparece no menu)
export const onRequestPut = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuthBasic(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureFotoUsuario(env.DB);
    const b = await request.json() as { foto?: string | null };
    const foto = b.foto || null;
    if (foto && !/^data:image\/(png|jpeg|webp);base64,/.test(foto)) return json({ error: 'Imagem inválida' }, 400);
    if (foto && foto.length > 200_000) return json({ error: 'Foto muito grande' }, 400);
    await env.DB.prepare('UPDATE usuarios SET foto = ? WHERE id = ?').bind(foto, auth.usuario_id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
