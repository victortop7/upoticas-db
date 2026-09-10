import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const [ordem, receita, armacao, servicos] = await Promise.all([
      env.DB.prepare(`
        SELECT o.*, ot.nome as otica_nome, ot.cnpj as otica_cnpj, ot.telefone as otica_telefone,
               ot.cidade as otica_cidade, ot.uf as otica_uf,
               ot.endereco as otica_endereco, ot.bairro as otica_bairro, ot.cep as otica_cep,
               ot.codigo as otica_codigo, ot.condicao_pgto as otica_cond_pgto
        FROM lab_ordens o
        LEFT JOIN lab_oticas ot ON ot.id = o.otica_id
        WHERE o.id = ? AND o.tenant_id = ?
      `).bind(id, tenant_id).first<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_receita WHERE ordem_id = ? ORDER BY olho ASC')
        .bind(id).all<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM lab_armacao WHERE ordem_id = ?')
        .bind(id).first<Record<string, unknown>>().catch(() => null),

      env.DB.prepare('SELECT * FROM lab_servicos_os WHERE ordem_id = ? ORDER BY rowid ASC')
        .bind(id).all<Record<string, unknown>>(),
    ]);

    if (!ordem) return json({ error: 'Ordem não encontrada' }, 404);

    return json({ ordem, receita: receita.results, armacao, servicos: servicos.results });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    // Verifica se a OS pertence ao tenant
    const ordem = await env.DB.prepare(
      'SELECT id FROM lab_ordens WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenant_id).first();

    if (!ordem) return json({ error: 'Ordem não encontrada' }, 404);

    // Exclui cascata
    await env.DB.batch([
      env.DB.prepare('DELETE FROM lab_servicos_os WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_receita WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_armacao WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_ordens WHERE id = ? AND tenant_id = ?').bind(id, tenant_id),
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PUT — edição COMPLETA da OS (dados + receita + armação + produtos). Vale para qualquer status.
export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const existing = await env.DB.prepare('SELECT id, numero FROM lab_ordens WHERE id = ? AND tenant_id = ?')
      .bind(id, tenant_id).first<{ id: string; numero: number }>();
    if (!existing) return json({ error: 'Ordem não encontrada' }, 404);

    const body = await request.json() as Record<string, any>;
    if (!body.otica_id) return json({ error: 'Ótica é obrigatória' }, 400);

    // Referência não pode repetir para a MESMA ótica (exceto esta própria OS)
    const refOtica = (body.ref_otica == null ? '' : String(body.ref_otica)).trim();
    if (refOtica) {
      const dup = await env.DB.prepare(
        `SELECT numero FROM lab_ordens WHERE tenant_id = ? AND otica_id = ? AND TRIM(ref_otica) = ? COLLATE NOCASE AND id != ? LIMIT 1`
      ).bind(tenant_id, body.otica_id, refOtica, id).first<{ numero: number }>();
      if (dup) return json({ error: `A referência "${refOtica}" já foi usada por esta ótica na OS #${dup.numero}.`, code: 'REF_DUPLICADA', ref: refOtica, os_existente: dup.numero }, 409);
    }

    // Garante colunas (idempotente)
    for (const col of ['medico TEXT','sinal REAL','rota TEXT','tipo TEXT','cont_interno TEXT','caixa TEXT','etiq_garantia INTEGER','usuario_receita TEXT','fluxo_lab INTEGER','classificacao TEXT','lista_preco INTEGER','vendedor1_id TEXT','vendedor2_id TEXT','num_vias INTEGER','cobranca_tipo TEXT','fechamento_ref TEXT','frete REAL','desconto_geral REAL','data_emissao TEXT']) {
      try { await env.DB.prepare(`ALTER TABLE lab_ordens ADD COLUMN ${col}`).run(); } catch {}
    }
    for (const col of ['codigo TEXT','produto_id TEXT','perc_desc REAL','total_bruto REAL']) { try { await env.DB.prepare(`ALTER TABLE lab_servicos_os ADD COLUMN ${col}`).run(); } catch {} }
    for (const col of ['tipo_material TEXT','shape TEXT','largura REAL','altura REAL','maior_diagonal REAL','eixo_maior_diagonal REAL','diametro_final REAL','tipo_lente TEXT','marca_material TEXT','lente_od TEXT','lente_oe TEXT']) { try { await env.DB.prepare(`ALTER TABLE lab_armacao ADD COLUMN ${col}`).run(); } catch {} }
    for (const col of ['cil_perto REAL','dec_h REAL']) { try { await env.DB.prepare(`ALTER TABLE lab_receita ADD COLUMN ${col}`).run(); } catch {} }

    // Atualiza o cabeçalho da OS (mantém numero, status, otica original preservados exceto o que o form envia)
    await env.DB.prepare(`
      UPDATE lab_ordens SET
        otica_id = ?, vendedor = ?, medico = ?, ref_otica = ?, previsao_entrega = ?, condicao_pgto = ?, sinal = ?, rota = ?, texto_gravura = ?, observacoes = ?, total = ?,
        tipo = ?, cont_interno = ?, caixa = ?, etiq_garantia = ?, usuario_receita = ?, fluxo_lab = ?, classificacao = ?, lista_preco = ?, vendedor1_id = ?, vendedor2_id = ?,
        num_vias = ?, cobranca_tipo = ?, fechamento_ref = ?, frete = ?, desconto_geral = ?, data_emissao = ?, updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.otica_id, body.operador ?? body.vendedor ?? null, body.medico ?? null, refOtica || null, body.previsao_entrega ?? null, body.condicao_pgto ?? null, body.sinal ?? null, body.rota ?? null, body.texto_gravura ?? null, body.observacoes ?? null, body.total ?? 0,
      body.tipo ?? 'O', body.cont_interno ?? null, body.caixa ?? null, body.etiq_garantia ?? 0, body.usuario_receita ?? null, body.fluxo_lab ?? 0, body.classificacao ?? 'N', body.lista_preco ?? 1, body.vendedor1_id ?? null, body.vendedor2_id ?? null,
      body.num_vias ?? 1, body.cobranca_tipo ?? null, body.fechamento_ref ?? null, body.frete ?? null, body.desconto_geral ?? null, body.data_emissao ?? null,
      id, tenant_id,
    ).run();

    // Substitui receita / armação / serviços
    const stmts = [
      env.DB.prepare('DELETE FROM lab_receita WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_armacao WHERE ordem_id = ?').bind(id),
      env.DB.prepare('DELETE FROM lab_servicos_os WHERE ordem_id = ?').bind(id),
    ];

    for (const r of (body.receita as any[] ?? [])) {
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_receita (id, tenant_id, ordem_id, olho, esf_longe, cil_longe, eixo_longe, dnp, alt, prisma, adicao, esf_perto, cil_perto, dec_h)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), tenant_id, id, r.olho, r.esf_longe ?? null, r.cil_longe ?? null, r.eixo_longe ?? null, r.dnp ?? null, r.alt ?? null, r.prisma ?? null, r.adicao ?? null, r.esf_perto ?? null, r.cil_perto ?? null, r.dec_h ?? null));
    }

    if (body.armacao) {
      const a = body.armacao as Record<string, unknown>;
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_armacao (id, tenant_id, ordem_id, material, estojo, ponte, diametro, dplip, informacoes, tipo_material, shape, largura, altura, maior_diagonal, eixo_maior_diagonal, diametro_final, tipo_lente, marca_material, lente_od, lente_oe)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), tenant_id, id, a.material ?? a.tipo_material ?? null, a.estojo ?? 0, a.ponte ?? null, a.diametro ?? a.diametro_final ?? null, a.dplip ?? null, a.informacoes ?? null, a.tipo_material ?? null, a.shape ?? null, a.largura ?? null, a.altura ?? null, a.maior_diagonal ?? null, a.eixo_maior_diagonal ?? null, a.diametro_final ?? null, a.tipo_lente ?? null, a.marca_material ?? null, a.lente_od ?? null, a.lente_oe ?? null));
    }

    for (const s of (body.servicos as any[] ?? [])) {
      stmts.push(env.DB.prepare(`
        INSERT INTO lab_servicos_os (id, tenant_id, ordem_id, codigo, produto_id, descricao, qtd, valor_unit, perc_desc, total_bruto, desconto, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), tenant_id, id, s.codigo ?? null, s.produto_id ?? null, s.descricao, s.qtd, s.valor_unit, s.perc_desc ?? 0, s.total_bruto ?? s.total, 0, s.total));
    }

    await env.DB.batch(stmts);
    return json({ id, numero: existing.numero });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

export const onRequestPatch = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const body = await request.json() as { status?: string; previsao_entrega?: string; total?: number };
    const VALID = ['aguardando', 'em_producao', 'pronto', 'entregue', 'cancelado'];

    if (body.status !== undefined && !VALID.includes(body.status)) {
      return json({ error: 'Status inválido' }, 400);
    }
    if (body.previsao_entrega !== undefined && body.previsao_entrega !== null
        && !/^\d{4}-\d{2}-\d{2}$/.test(body.previsao_entrega)) {
      return json({ error: 'Data de entrega inválida (use AAAA-MM-DD)' }, 400);
    }
    if (body.total !== undefined && (typeof body.total !== 'number' || body.total < 0 || isNaN(body.total))) {
      return json({ error: 'Total inválido' }, 400);
    }
    if (body.status === undefined && body.previsao_entrega === undefined && body.total === undefined) {
      return json({ error: 'Informe status, previsao_entrega e/ou total' }, 400);
    }

    // garante a coluna de data de entrega
    try { await env.DB.prepare('ALTER TABLE lab_ordens ADD COLUMN entregue_em TEXT').run(); } catch {}

    // monta o UPDATE só com os campos enviados
    const sets: string[] = [`updated_at = datetime('now')`];
    const vals: unknown[] = [];
    if (body.status !== undefined) {
      sets.push('status = ?', `entregue_em = CASE WHEN ? = 'entregue' THEN datetime('now') ELSE entregue_em END`);
      vals.push(body.status, body.status);
    }
    if (body.previsao_entrega !== undefined) {
      sets.push('previsao_entrega = ?');
      vals.push(body.previsao_entrega);
    }
    if (body.total !== undefined) {
      sets.push('total = ?');
      vals.push(body.total);
    }

    const result = await env.DB.prepare(
      `UPDATE lab_ordens SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`
    ).bind(...vals, id, tenant_id).run();

    if (!result.success) return json({ error: 'Ordem não encontrada' }, 404);

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
