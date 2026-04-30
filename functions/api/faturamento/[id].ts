import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const [fatura, itens] = await Promise.all([
      env.DB.prepare(`
        SELECT f.*, c.nome as cliente_nome, c.cpf as cliente_cpf,
               c.telefone as cliente_telefone, c.email as cliente_email,
               c.endereco as cliente_endereco, c.cidade as cliente_cidade, c.uf as cliente_uf
        FROM faturas f JOIN clientes c ON c.id = f.cliente_id
        WHERE f.id = ? AND f.tenant_id = ?
      `).bind(params.id, tenant_id).first<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM fatura_itens WHERE fatura_id = ? AND tenant_id = ? ORDER BY rowid ASC')
        .bind(params.id, tenant_id).all<Record<string, unknown>>(),
    ]);

    if (!fatura) return json({ error: 'Fatura não encontrada' }, 404);
    return json({ fatura, itens: itens.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as {
      situacao?: string;
      data_pagamento?: string;
      forma_pagamento?: string;
    };

    const VALID = ['aberta', 'paga', 'vencida', 'cancelada'];
    if (body.situacao && !VALID.includes(body.situacao)) {
      return json({ error: 'Situação inválida' }, 400);
    }

    await env.DB.prepare(
      "UPDATE faturas SET situacao=COALESCE(?, situacao), data_pagamento=COALESCE(?, data_pagamento), forma_pagamento=COALESCE(?, forma_pagamento), updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(body.situacao ?? null, body.data_pagamento ?? null, body.forma_pagamento ?? null, params.id, tenant_id).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    await env.DB.batch([
      env.DB.prepare('DELETE FROM fatura_itens WHERE fatura_id = ? AND tenant_id = ?').bind(params.id, tenant_id),
      env.DB.prepare("UPDATE faturas SET situacao='cancelada', updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(params.id, tenant_id),
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
