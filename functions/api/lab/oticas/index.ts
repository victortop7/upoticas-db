import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const result = await env.DB.prepare(
      'SELECT * FROM lab_oticas WHERE tenant_id = ? ORDER BY nome ASC'
    ).bind(tenant_id).all();

    return json(result.results);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    // Ensure new columns exist
    for (const col of ['codigo TEXT', 'lista_preco INTEGER', 'condicao_pgto TEXT', 'desconto_padrao REAL']) {
      try { await env.DB.prepare(`ALTER TABLE lab_oticas ADD COLUMN ${col}`).run(); } catch {}
    }

    const body = await request.json() as Record<string, string>;
    if (!body.nome) return json({ error: 'Nome é obrigatório' }, 400);

    // Auto-generate codigo if not provided (next sequential number)
    let codigo = body.codigo?.trim() || null;
    if (!codigo) {
      const row = await env.DB.prepare(
        `SELECT COALESCE(MAX(CAST(codigo AS INTEGER)),0)+1 AS next FROM lab_oticas WHERE tenant_id=? AND codigo GLOB '[0-9]*'`
      ).bind(tenant_id).first<{ next: number }>();
      codigo = String(row?.next ?? 1).padStart(3, '0');
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO lab_oticas (id, tenant_id, codigo, nome, cnpj, telefone, email, endereco, cidade, uf, cep, observacao, lista_preco, condicao_pgto, desconto_padrao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, tenant_id, codigo, body.nome, body.cnpj ?? null, body.telefone ?? null, body.email ?? null, body.endereco ?? null, body.cidade ?? null, body.uf ?? null, body.cep ?? null, body.observacao ?? null, body.lista_preco ? parseInt(body.lista_preco) : 1, body.condicao_pgto ?? null, body.desconto_padrao ? parseFloat(body.desconto_padrao) : null).run();

    return json({ id, codigo }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
