import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

const NEW_COLS = [
  'codigo TEXT', 'nome_reduzido TEXT', 'lista_preco INTEGER',
  'classificacao_cli TEXT', 'tipo_fechamento TEXT', 'tipo_faturamento TEXT',
  'via_transporte TEXT', 'tipo_icms TEXT', 'banco_cobranca INTEGER',
  'limite_credito REAL', 'dias_debito INTEGER', 'situacao TEXT',
  'ramo_atividade TEXT', 'matriz_rede_grupo TEXT',
  'condicao_pgto TEXT', 'desconto_padrao REAL',
  'complemento TEXT', 'bairro TEXT', 'codigo_ibge TEXT',
  'inscricao_estadual TEXT', 'inscricao_municipal TEXT',
  'area TEXT', 'rota_entrega TEXT', 'comissao REAL',
  'vias_pedido INTEGER', 'vias_os INTEGER',
  'vendedor_id TEXT', 'contatos TEXT',
  'condicoes_pgto TEXT',
];

async function ensureCols(env: Env) {
  for (const col of NEW_COLS) {
    try { await env.DB.prepare(`ALTER TABLE lab_oticas ADD COLUMN ${col}`).run(); } catch {}
  }
}

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    const { id } = params;

    const [otica, ordens, stats] = await Promise.all([
      env.DB.prepare('SELECT * FROM lab_oticas WHERE id = ? AND tenant_id = ?').bind(id, tenant_id).first<Record<string, unknown>>(),
      env.DB.prepare(`
        SELECT o.id, o.numero, o.status, o.ref_otica, o.previsao_entrega, o.total, o.created_at,
               (SELECT COUNT(*) FROM lab_servicos_os WHERE ordem_id = o.id) as servicos_count
        FROM lab_ordens o WHERE o.otica_id = ? AND o.tenant_id = ? ORDER BY o.created_at DESC LIMIT 50
      `).bind(id, tenant_id).all<Record<string, unknown>>(),
      env.DB.prepare(`
        SELECT COUNT(*) as total_ordens,
          SUM(CASE WHEN status NOT IN ('entregue','cancelado') THEN 1 ELSE 0 END) as em_aberto,
          SUM(CASE WHEN status = 'pronto' THEN 1 ELSE 0 END) as prontos,
          SUM(total) as valor_total
        FROM lab_ordens WHERE otica_id = ? AND tenant_id = ?
      `).bind(id, tenant_id).first<Record<string, number>>(),
    ]);

    if (!otica) return json({ error: 'Ótica não encontrada' }, 404);
    return json({ otica, ordens: ordens.results, stats });
  } catch (err) { return json({ error: 'Erro interno', detail: String(err) }, 500); }
};

export const onRequestPut = async ({ request, env, params }: { request: Request; env: Env; params: Record<string, string> }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureCols(env);

    const b = await request.json() as Record<string, unknown>;
    if (!b.nome) return json({ error: 'Nome é obrigatório' }, 400);

    await env.DB.prepare(`
      UPDATE lab_oticas SET
        codigo=?, nome=?, nome_reduzido=?, cnpj=?, inscricao_estadual=?, inscricao_municipal=?,
        cep=?, endereco=?, complemento=?, bairro=?, cidade=?, uf=?, codigo_ibge=?,
        telefone=?, email=?, observacao=?,
        lista_preco=?, classificacao_cli=?, tipo_fechamento=?, tipo_faturamento=?,
        via_transporte=?, tipo_icms=?, banco_cobranca=?,
        limite_credito=?, dias_debito=?, situacao=?, ramo_atividade=?, matriz_rede_grupo=?,
        condicao_pgto=?, desconto_padrao=?, condicoes_pgto=?,
        area=?, rota_entrega=?, comissao=?, vias_pedido=?, vias_os=?,
        vendedor_id=?, contatos=?,
        updated_at=datetime('now')
      WHERE id=? AND tenant_id=?
    `).bind(
      b.codigo ?? null, b.nome, b.nome_reduzido ?? null,
      b.cnpj ?? null, b.inscricao_estadual ?? null, b.inscricao_municipal ?? null,
      b.cep ?? null, b.endereco ?? null, b.complemento ?? null, b.bairro ?? null,
      b.cidade ?? null, b.uf ?? null, b.codigo_ibge ?? null,
      b.telefone ?? null, b.email ?? null, b.observacao ?? null,
      b.lista_preco ? parseInt(String(b.lista_preco)) : 1,
      b.classificacao_cli ?? null, b.tipo_fechamento ?? null, b.tipo_faturamento ?? null,
      b.via_transporte ?? '0', b.tipo_icms ?? null, b.banco_cobranca ? 1 : 0,
      b.limite_credito ? parseFloat(String(b.limite_credito)) : null,
      b.dias_debito ? parseInt(String(b.dias_debito)) : null,
      b.situacao ?? null, b.ramo_atividade ?? null, b.matriz_rede_grupo ?? null,
      b.condicao_pgto ?? null,
      b.desconto_padrao ? parseFloat(String(b.desconto_padrao)) : null,
      b.condicoes_pgto ? JSON.stringify(b.condicoes_pgto) : null,
      b.area ?? null, b.rota_entrega ?? null,
      b.comissao ? parseFloat(String(b.comissao)) : null,
      b.vias_pedido ? parseInt(String(b.vias_pedido)) : 1,
      b.vias_os ? parseInt(String(b.vias_os)) : 0,
      b.vendedor_id ?? null,
      b.contatos ? JSON.stringify(b.contatos) : null,
      params.id, tenant_id,
    ).run();

    return json({ ok: true });
  } catch (err) { return json({ error: 'Erro interno', detail: String(err) }, 500); }
};
