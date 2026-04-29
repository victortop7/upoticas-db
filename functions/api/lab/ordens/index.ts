import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q');

    let query = `
      SELECT o.id, o.numero, o.status, o.ref_otica, o.previsao_entrega, o.total, o.created_at,
             ot.nome as otica_nome
      FROM lab_ordens o
      LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
      WHERE o.tenant_id = ?
    `;
    const params: unknown[] = [tenant_id];

    if (status) { query += ' AND o.status = ?'; params.push(status); }
    if (q) { query += ' AND (ot.nome LIKE ? OR CAST(o.numero AS TEXT) LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

    query += ' ORDER BY o.created_at DESC LIMIT 100';

    const result = await env.DB.prepare(query).bind(...params).all();
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

    const body = await request.json() as {
      otica_id: string;
      vendedor?: string;
      ref_otica?: string;
      previsao_entrega?: string;
      condicao_pgto?: string;
      texto_gravura?: string;
      observacoes?: string;
      total?: number;
      receita?: { olho: string; esf_longe?: number; cil_longe?: number; eixo_longe?: number; dnp?: number; alt?: number; prisma?: string; adicao?: number; esf_perto?: number }[];
      armacao?: { material?: string; estojo?: number; ponte?: number; diametro?: number; dplip?: number; informacoes?: string };
      servicos?: { descricao: string; qtd: number; valor_unit: number; desconto: number; total: number }[];
    };

    if (!body.otica_id) return json({ error: 'Ótica é obrigatória' }, 400);

    const numRow = await env.DB.prepare(
      'SELECT COALESCE(MAX(numero), 0) + 1 as next FROM lab_ordens WHERE tenant_id = ?'
    ).bind(tenant_id).first<{ next: number }>();

    const id = crypto.randomUUID();
    const numero = numRow?.next ?? 1;

    const stmts = [
      env.DB.prepare(
        'INSERT INTO lab_ordens (id, tenant_id, numero, otica_id, vendedor, ref_otica, previsao_entrega, condicao_pgto, texto_gravura, observacoes, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, tenant_id, numero, body.otica_id, body.vendedor ?? null, body.ref_otica ?? null, body.previsao_entrega ?? null, body.condicao_pgto ?? null, body.texto_gravura ?? null, body.observacoes ?? null, body.total ?? 0),
    ];

    for (const r of body.receita ?? []) {
      stmts.push(env.DB.prepare(
        'INSERT INTO lab_receita (id, tenant_id, ordem_id, olho, esf_longe, cil_longe, eixo_longe, dnp, alt, prisma, adicao, esf_perto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), tenant_id, id, r.olho, r.esf_longe ?? null, r.cil_longe ?? null, r.eixo_longe ?? null, r.dnp ?? null, r.alt ?? null, r.prisma ?? null, r.adicao ?? null, r.esf_perto ?? null));
    }

    if (body.armacao) {
      const a = body.armacao;
      stmts.push(env.DB.prepare(
        'INSERT INTO lab_armacao (id, tenant_id, ordem_id, material, estojo, ponte, diametro, dplip, informacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), tenant_id, id, a.material ?? null, a.estojo ?? 0, a.ponte ?? null, a.diametro ?? null, a.dplip ?? null, a.informacoes ?? null));
    }

    for (const s of body.servicos ?? []) {
      stmts.push(env.DB.prepare(
        'INSERT INTO lab_servicos_os (id, tenant_id, ordem_id, descricao, qtd, valor_unit, desconto, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), tenant_id, id, s.descricao, s.qtd, s.valor_unit, s.desconto, s.total));
    }

    await env.DB.batch(stmts);

    return json({ id, numero }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
