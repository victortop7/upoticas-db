import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// Etapas terminais (não abrem novo registro de setor)
const TERMINAIS = new Set(['pronto', 'entregue', 'cancelado']);

function statusDoSetor(setor: string): string {
  if (setor === 'entregue') return 'entregue';
  if (setor === 'pronto') return 'pronto';
  if (setor === 'cancelado') return 'cancelado';
  return 'em_producao';
}

// POST /api/lab/fluxo/mover — move a OS para uma etapa do funil (Kanban)
// Fecha a saída (termino) da etapa aberta atual e abre a entrada (inicio) da nova.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as { ordem_id: string; setor: string; setor_num?: number };
    if (!body.ordem_id || !body.setor) {
      return json({ error: 'ordem_id e setor são obrigatórios' }, 400);
    }

    const now = new Date();
    const data = now.toISOString().slice(0, 10);
    const hora = now.toTimeString().slice(0, 5);

    const stmts = [
      // fecha a etapa aberta atual (registra a hora de saída)
      env.DB.prepare(
        `UPDATE lab_fluxo SET termino_data = ?, termino_hora = ?
         WHERE tenant_id = ? AND ordem_id = ? AND termino_data IS NULL`
      ).bind(data, hora, tenant_id, body.ordem_id),
    ];

    // abre a entrada da nova etapa (exceto terminais)
    if (!TERMINAIS.has(body.setor)) {
      stmts.push(
        env.DB.prepare(
          `INSERT INTO lab_fluxo (id, tenant_id, ordem_id, setor, setor_num, inicio_data, inicio_hora)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(crypto.randomUUID(), tenant_id, body.ordem_id, body.setor, body.setor_num ?? null, data, hora)
      );
    }

    // atualiza a OS: etapa atual + status coerente (marca a data de entrega)
    stmts.push(
      env.DB.prepare(
        `UPDATE lab_ordens SET setor_atual = ?, status = ?,
           entregue_em = CASE WHEN ? = 'entregue' THEN datetime('now') ELSE entregue_em END
         WHERE id = ? AND tenant_id = ?`
      ).bind(body.setor, statusDoSetor(body.setor), body.setor, body.ordem_id, tenant_id)
    );

    await env.DB.batch(stmts);
    return json({ ok: true, setor: body.setor, data, hora });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
