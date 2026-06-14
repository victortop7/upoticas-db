import type { Env } from '../../lib/types';
import { json } from '../../lib/auth-middleware';

async function ensureTable(db: Env['DB']) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS leads (
      id         TEXT PRIMARY KEY,
      tipo       TEXT NOT NULL DEFAULT 'lab',
      nome       TEXT NOT NULL,
      laboratorio TEXT,
      email      TEXT NOT NULL,
      whatsapp   TEXT,
      cidade     TEXT,
      mensagem   TEXT,
      status     TEXT NOT NULL DEFAULT 'novo',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const body = await request.json() as Record<string, string>;

    if (!body.nome?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
    if (!body.email?.trim()) return json({ error: 'E-mail é obrigatório' }, 400);
    if (!body.whatsapp?.trim()) return json({ error: 'WhatsApp é obrigatório' }, 400);

    await ensureTable(env.DB);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO leads (id, tipo, nome, laboratorio, email, whatsapp, cidade, mensagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, body.tipo || 'lab',
      body.nome.trim(), body.laboratorio?.trim() || null,
      body.email.trim().toLowerCase(), body.whatsapp.trim(),
      body.cidade?.trim() || null, body.mensagem?.trim() || null,
    ).run();

    // Envia email de notificação via Resend (quando configurado)
    const resendKey = (env as unknown as Record<string, string>).RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Connect LAB <onboarding@resend.dev>',
          to: ['victormarketing093@gmail.com'],
          subject: `🔬 Novo interesse Connect LAB — ${body.laboratorio || body.nome}`,
          html: `
            <h2>Novo lead Connect LAB</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;font-weight:bold">Nome</td><td style="padding:8px">${body.nome}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Laboratório</td><td style="padding:8px">${body.laboratorio || '—'}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">E-mail</td><td style="padding:8px">${body.email}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">WhatsApp</td><td style="padding:8px">${body.whatsapp}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">Cidade</td><td style="padding:8px">${body.cidade || '—'}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Mensagem</td><td style="padding:8px">${body.mensagem || '—'}</td></tr>
            </table>
            <p style="margin-top:20px;color:#666">Lead salvo em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          `,
        }),
      }).catch(() => {}); // não quebra se falhar
    }

    return json({ ok: true, id });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// Lista de leads (para você ver os contatos)
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    // Simples proteção por query param secret
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const jwtSecret = (env as unknown as Record<string, string>).JWT_SECRET;
    if (secret !== jwtSecret) return json({ error: 'Não autorizado' }, 401);

    await ensureTable(env.DB);
    const result = await env.DB.prepare(
      'SELECT * FROM leads ORDER BY created_at DESC LIMIT 100'
    ).all();
    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
