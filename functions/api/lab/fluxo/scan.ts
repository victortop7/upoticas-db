import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_fluxo_scans (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        ordem_id TEXT NOT NULL,
        numero INTEGER NOT NULL,
        setor INTEGER NOT NULL,
        setor_nome TEXT,
        status_anterior TEXT,
        status_novo TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch {}
  try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN setor_atual TEXT').run(); } catch {}
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    await ensureTable(env);

    const body = await request.json() as { numero: string; setor: number };
    if (!body.numero || !body.setor) return json({ error: 'numero e setor obrigatórios' }, 400);

    const numeroInt = parseInt(String(body.numero).trim(), 10);
    if (isNaN(numeroInt) || numeroInt <= 0) return json({ error: 'Código inválido' }, 400);

    const ordem = await env.DB.prepare(
      `SELECT o.id, o.numero, o.status, ot.nome as otica_nome
       FROM lab_ordens o LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
       WHERE o.tenant_id = ? AND o.numero = ?`
    ).bind(tenant_id, numeroInt).first() as { id: string; numero: number; status: string; otica_nome: string } | null;

    if (!ordem) return json({ error: `OS #${String(numeroInt).padStart(4, '0')} não encontrada` }, 404);

    // Get sector config
    const cfg = await env.DB.prepare(
      `SELECT chave, valor FROM lab_configuracoes WHERE tenant_id = ? AND chave IN (?, ?)`
    ).bind(
      tenant_id,
      `param_setor_${body.setor}_status`,
      `param_setor_${body.setor}_nome`
    ).all();

    const cfgMap: Record<string, string> = {};
    (cfg.results as { chave: string; valor: string }[]).forEach(r => { cfgMap[r.chave] = r.valor; });

    const statusNovo = cfgMap[`param_setor_${body.setor}_status`] || null;
    const setorNome = cfgMap[`param_setor_${body.setor}_nome`] || `Setor ${body.setor}`;
    const statusAnterior = ordem.status;
    const mudou = Boolean(statusNovo && statusNovo !== statusAnterior);

    if (mudou && statusNovo) {
      await env.DB.prepare(
        `UPDATE lab_ordens SET status = ?, setor_atual = ? WHERE id = ? AND tenant_id = ?`
      ).bind(statusNovo, setorNome, ordem.id, tenant_id).run();
    } else {
      await env.DB.prepare(
        `UPDATE lab_ordens SET setor_atual = ? WHERE id = ? AND tenant_id = ?`
      ).bind(setorNome, ordem.id, tenant_id).run();
    }

    await env.DB.prepare(`
      INSERT INTO lab_fluxo_scans (id, tenant_id, ordem_id, numero, setor, setor_nome, status_anterior, status_novo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), tenant_id, ordem.id, numeroInt,
      body.setor, setorNome, statusAnterior, statusNovo || statusAnterior
    ).run();

    return json({
      ok: true,
      ordem: {
        id: ordem.id,
        numero: ordem.numero,
        otica_nome: ordem.otica_nome,
        status_anterior: statusAnterior,
        status_novo: statusNovo || statusAnterior,
        setor_nome: setorNome,
        mudou,
      }
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
