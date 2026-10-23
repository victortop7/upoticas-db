import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureReceber, listarTitulos } from '../../../lib/receber';
import { ensureFicha, numerarClientes } from '../../../lib/clienteFicha';

// GET /api/clientes/:id/perfil: tudo do cliente: dados, vendas (cada uma separada), OS, crediário e resumo
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureReceber(env.DB);
    await ensureFicha(env.DB);
    try { await numerarClientes(env.DB, auth.tenant_id); } catch { /* segue */ }
    const id = String(params.id);
    const cliente = await env.DB.prepare('SELECT c.*, l.nome AS loja_nome FROM clientes c LEFT JOIN lojas l ON l.id = c.loja_id WHERE c.id = ? AND c.tenant_id = ?')
      .bind(id, auth.tenant_id).first<Record<string, unknown>>();
    if (!cliente) return json({ error: 'Cliente não encontrado' }, 404);

    const [vendas, os, carnes, titulos] = await Promise.all([
      env.DB.prepare(`
        SELECT v.id, v.numero, v.situacao, v.valor_total, v.desconto, v.valor_final, v.forma_pagamento,
               COALESCE(v.valor_entrada, 0) AS valor_entrada, COALESCE(v.saldo_restante, 0) AS saldo_restante,
               v.created_at, v.os_id, u.nome AS vendedor, l.nome AS loja,
               (SELECT GROUP_CONCAT(i.descricao, ' · ') FROM venda_itens i WHERE i.venda_id = v.id) AS itens
        FROM vendas v
        LEFT JOIN usuarios u ON u.id = v.funcionario_id
        LEFT JOIN lojas l ON l.id = v.loja_id
        WHERE v.cliente_id = ? AND v.tenant_id = ?
        ORDER BY v.created_at DESC, v.numero DESC`).bind(id, auth.tenant_id).all<Record<string, unknown>>(),
      env.DB.prepare(`
        SELECT id, numero, tipo, situacao, valor_total, valor_entrada, valor_restante, data_entrega, armacao_desc, lente_desc, created_at,
               longe_od_esf, longe_od_cil, longe_od_eixo, longe_oe_esf, longe_oe_cil, longe_oe_eixo,
               perto_od_esf, perto_od_cil, perto_od_eixo, perto_oe_esf, perto_oe_cil, perto_oe_eixo,
               dp, altura, adicao, medico
        FROM ordens_servico WHERE cliente_id = ? AND tenant_id = ? ORDER BY numero DESC`).bind(id, auth.tenant_id).all(),
      env.DB.prepare(`
        SELECT c.id, c.descricao, c.valor_total, c.num_parcelas, c.venda_id, c.created_at, v.numero AS venda_numero
        FROM carnes c LEFT JOIN vendas v ON v.id = c.venda_id
        WHERE c.cliente_id = ? AND c.tenant_id = ? ORDER BY c.created_at DESC`).bind(id, auth.tenant_id).all(),
      listarTitulos(env.DB, auth.tenant_id, { cliente_id: id, situacao: 'todos' }),
    ]);

    let crm: { id: string; estagio: string; quitado_em?: string | null } | null = null;
    try {
      crm = await env.DB.prepare('SELECT id, estagio, quitado_em FROM crm_cards WHERE cliente_id = ? AND tenant_id = ?')
        .bind(id, auth.tenant_id).first<{ id: string; estagio: string; quitado_em?: string | null }>();
    } catch { /* funil ainda não usado */ }
    const ativas = (vendas.results || []).filter(v => v.situacao !== 'cancelada');
    const total = ativas.reduce((s, v) => s + Number(v.valor_final || 0), 0);
    const soma = (s: string) => titulos.filter(t => t.situacao === s).reduce((a, t) => a + t.valor, 0);
    const vencidos = titulos.filter(t => t.situacao === 'vencido');
    const pagos = titulos.filter(t => t.origem === 'carne' && t.situacao === 'recebido' && t.recebido_em);
    // atraso médio no pagamento das parcelas pagas
    const atrasoMedio = pagos.length
      ? pagos.reduce((s, t) => s + Math.max(0, (new Date(String(t.recebido_em).slice(0, 10)).getTime() - new Date(t.vencimento).getTime()) / 86_400_000), 0) / pagos.length
      : null;

    const { foto, ...resto } = cliente;
    return json({
      cliente: { ...resto, tem_foto: !!foto, foto: foto || null },
      vendas: vendas.results || [],
      os: os.results || [],
      carnes: carnes.results || [],
      titulos,
      crm,
      resumo: {
        total_comprado: total,
        qtd_vendas: ativas.length,
        ticket_medio: ativas.length ? total / ativas.length : 0,
        em_aberto: soma('pendente') + soma('vencido'),
        em_atraso: soma('vencido'),
        parcelas_atraso: vencidos.length,
        atraso_medio_dias: atrasoMedio,
        primeira_compra: ativas.length ? String(ativas[ativas.length - 1].created_at).slice(0, 10) : null,
        ultima_compra: ativas.length ? String(ativas[0].created_at).slice(0, 10) : null,
      },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};

// PUT /api/clientes/:id/perfil  { foto?: dataURL|null, referencia?: string }
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureReceber(env.DB);
    const b = await request.json() as { foto?: string | null; referencia?: string | null };
    const sets: string[] = []; const vals: unknown[] = [];
    if (b.foto !== undefined) {
      if (b.foto && !/^data:image\/(png|jpeg|webp);base64,/.test(b.foto)) return json({ error: 'Imagem inválida' }, 400);
      if (b.foto && b.foto.length > 400_000) return json({ error: 'Foto muito grande' }, 400);
      sets.push('foto = ?'); vals.push(b.foto || null);
    }
    if (b.referencia !== undefined) { sets.push('referencia = ?'); vals.push((b.referencia || '').trim() || null); }
    if (!sets.length) return json({ error: 'Nada para atualizar' }, 400);
    vals.push(new Date().toISOString(), params.id, auth.tenant_id);
    await env.DB.prepare(`UPDATE clientes SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND tenant_id = ?`).bind(...vals).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
