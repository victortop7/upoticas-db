import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const url = new URL(request.url);
    const status   = url.searchParams.get('status');
    const tipo     = url.searchParams.get('tipo');
    const q        = url.searchParams.get('q');
    const oticaId  = url.searchParams.get('otica_id');
    const dataIni  = url.searchParams.get('data_ini');
    const dataFim  = url.searchParams.get('data_fim');

    let query = `
      SELECT o.id, o.numero, o.status, o.tipo, o.ref_otica, o.previsao_entrega, o.total, o.created_at,
             o.cont_interno, o.caixa, o.vendedor,
             ot.nome as otica_nome
      FROM lab_ordens o
      LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
      WHERE o.tenant_id = ?
    `;
    const params: unknown[] = [tenant_id];

    if (status)  { query += ' AND o.status = ?'; params.push(status); }
    if (tipo)    { query += ' AND o.tipo = ?'; params.push(tipo); }
    if (oticaId) { query += ' AND o.otica_id = ?'; params.push(oticaId); }
    if (dataIni) { query += ' AND date(o.created_at) >= ?'; params.push(dataIni); }
    if (dataFim) { query += ' AND date(o.created_at) <= ?'; params.push(dataFim); }
    if (q) {
      query += ' AND (ot.nome LIKE ? OR CAST(o.numero AS TEXT) LIKE ? OR o.cont_interno LIKE ? OR o.ref_otica LIKE ? OR ot.codigo LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    query += ' ORDER BY o.created_at DESC LIMIT 500';

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

    const body = await request.json() as Record<string, unknown>;

    if (!body.otica_id) return json({ error: 'Ótica é obrigatória' }, 400);

    const numRow = await env.DB.prepare(
      'SELECT COALESCE(MAX(numero), 0) + 1 as next FROM lab_ordens WHERE tenant_id = ?'
    ).bind(tenant_id).first<{ next: number }>();

    const id = crypto.randomUUID();
    const numero = numRow?.next ?? 1;

    // Ensure all columns exist
    const newCols = [
      'medico TEXT', 'sinal REAL', 'rota TEXT',
      'tipo TEXT', 'cont_interno TEXT', 'caixa TEXT',
      'etiq_garantia INTEGER', 'usuario_receita TEXT', 'fluxo_lab INTEGER',
      'classificacao TEXT', 'lista_preco INTEGER',
      'vendedor1_id TEXT', 'vendedor2_id TEXT',
      'num_vias INTEGER', 'cobranca_tipo TEXT', 'fechamento_ref TEXT',
      'frete REAL', 'desconto_geral REAL',
    ];
    for (const col of newCols) {
      try { await env.DB.prepare(`ALTER TABLE lab_ordens ADD COLUMN ${col}`).run(); } catch {}
    }

    // Ensure lab_servicos_os extra columns
    const svcCols = ['codigo TEXT', 'produto_id TEXT', 'perc_desc REAL', 'total_bruto REAL'];
    for (const col of svcCols) {
      try { await env.DB.prepare(`ALTER TABLE lab_servicos_os ADD COLUMN ${col}`).run(); } catch {}
    }

    // Ensure baixa_estoque table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS lab_baixa_estoque (
          id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, ordem_id TEXT NOT NULL,
          codigo TEXT, produto_id TEXT, descricao TEXT NOT NULL,
          un TEXT, qtd REAL NOT NULL DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `).run();
    } catch {}

    const armCols = [
      'tipo_material TEXT', 'shape TEXT',
      'largura REAL', 'altura REAL', 'maior_diagonal REAL',
      'eixo_maior_diagonal REAL', 'diametro_final REAL',
      'tipo_lente TEXT', 'marca_material TEXT', 'lente_od TEXT', 'lente_oe TEXT',
    ];
    for (const col of armCols) {
      try { await env.DB.prepare(`ALTER TABLE lab_armacao ADD COLUMN ${col}`).run(); } catch {}
    }

    const recCols = ['cil_perto REAL', 'dec_h REAL'];
    for (const col of recCols) {
      try { await env.DB.prepare(`ALTER TABLE lab_receita ADD COLUMN ${col}`).run(); } catch {}
    }

    const stmts = [
      env.DB.prepare(`
        INSERT INTO lab_ordens (
          id, tenant_id, numero, otica_id,
          vendedor, medico, ref_otica, previsao_entrega, condicao_pgto, sinal, rota, texto_gravura, observacoes, total,
          tipo, cont_interno, caixa, etiq_garantia, usuario_receita, fluxo_lab,
          classificacao, lista_preco, vendedor1_id, vendedor2_id,
          num_vias, cobranca_tipo, fechamento_ref, frete, desconto_geral
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, tenant_id, numero, body.otica_id,
        body.operador ?? body.vendedor ?? null,
        body.medico ?? null,
        body.ref_otica ?? null,
        body.previsao_entrega ?? null,
        body.condicao_pgto ?? null,
        body.sinal ?? null,
        body.rota ?? null,
        body.texto_gravura ?? null,
        body.observacoes ?? null,
        body.total ?? 0,
        body.tipo ?? 'O',
        body.cont_interno ?? null,
        body.caixa ?? null,
        body.etiq_garantia ?? 0,
        body.usuario_receita ?? null,
        body.fluxo_lab ?? 0,
        body.classificacao ?? 'N',
        body.lista_preco ?? 1,
        body.vendedor1_id ?? null,
        body.vendedor2_id ?? null,
        body.num_vias ?? 1,
        body.cobranca_tipo ?? null,
        body.fechamento_ref ?? null,
        body.frete ?? null,
        body.desconto_geral ?? null,
      ),
    ];

    type RxItem = { olho: string; esf_longe?: number; cil_longe?: number; eixo_longe?: number; dnp?: number; alt?: number; prisma?: string; adicao?: number; esf_perto?: number; cil_perto?: number; dec_h?: number };
    for (const r of (body.receita as RxItem[] ?? [])) {
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_receita (id, tenant_id, ordem_id, olho, esf_longe, cil_longe, eixo_longe, dnp, alt, prisma, adicao, esf_perto, cil_perto, dec_h)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), tenant_id, id, r.olho,
        r.esf_longe ?? null, r.cil_longe ?? null, r.eixo_longe ?? null,
        r.dnp ?? null, r.alt ?? null, r.prisma ?? null,
        r.adicao ?? null, r.esf_perto ?? null,
        r.cil_perto ?? null, r.dec_h ?? null,
      ));
    }

    if (body.armacao) {
      const a = body.armacao as Record<string, unknown>;
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_armacao (
          id, tenant_id, ordem_id,
          material, estojo, ponte, diametro, dplip, informacoes,
          tipo_material, shape, largura, altura, maior_diagonal, eixo_maior_diagonal, diametro_final,
          tipo_lente, marca_material, lente_od, lente_oe
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), tenant_id, id,
        a.material ?? a.tipo_material ?? null,
        a.estojo ?? 0,
        a.ponte ?? null,
        a.diametro ?? a.diametro_final ?? null,
        a.dplip ?? null,
        a.informacoes ?? null,
        a.tipo_material ?? null,
        a.shape ?? null,
        a.largura ?? null,
        a.altura ?? null,
        a.maior_diagonal ?? null,
        a.eixo_maior_diagonal ?? null,
        a.diametro_final ?? null,
        a.tipo_lente ?? null,
        a.marca_material ?? null,
        a.lente_od ?? null,
        a.lente_oe ?? null,
      ));
    }

    type SvcItem = { codigo?: string; produto_id?: string; descricao: string; qtd: number; valor_unit: number; perc_desc?: number; total_bruto?: number; total: number };
    for (const s of (body.servicos as SvcItem[] ?? [])) {
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_servicos_os (id, tenant_id, ordem_id, codigo, produto_id, descricao, qtd, valor_unit, perc_desc, total_bruto, desconto, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), tenant_id, id, s.codigo ?? null, s.produto_id ?? null, s.descricao, s.qtd, s.valor_unit, s.perc_desc ?? 0, s.total_bruto ?? s.total, 0, s.total));
    }

    type EstItem = { codigo?: string; produto_id?: string; descricao: string; qtd: number };
    for (const e of (body.baixa_estoque as EstItem[] ?? [])) {
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_baixa_estoque (id, tenant_id, ordem_id, codigo, produto_id, descricao, qtd)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), tenant_id, id, e.codigo ?? null, e.produto_id ?? null, e.descricao, e.qtd));
    }

    await env.DB.batch(stmts);

    return json({ id, numero }, 201);
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
