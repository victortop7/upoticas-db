import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureClienteExtra, registrarHistorico } from '../../lib/clienteExtra';
import { recalcularFunil } from '../../lib/crmFluxo';

// POST /api/clientes/unificar { principal_id, outros: [ids], dados?: { nome, cpf, celular, telefone, email, data_nascimento } }
// Junta cadastros repetidos num só: vendas, OS, carnês, contas, receitas, histórico e funil passam pro principal.
// Campos vazios do principal são completados com os dos outros. Os repetidos ficam inativos (não somem do banco).
const NAO_COPIAR = new Set(['id', 'tenant_id', 'created_at', 'updated_at', 'ativo', 'codigo', 'loja_id']);
const DADOS = ['nome', 'apelido', 'cpf', 'celular', 'telefone', 'email', 'data_nascimento'];
const TABELAS = ['vendas', 'ordens_servico', 'carnes', 'contas_receber', 'faturas', 'marketing_historico', 'kommo_sync', 'cliente_receitas', 'cliente_historico'];

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Só o admin unifica cadastros' }, 403);
  try {
    await ensureClienteExtra(env.DB);
    const b = await request.json() as { principal_id?: string; outros?: string[]; dados?: Record<string, string> };
    const principal = String(b.principal_id || '');
    const outros = [...new Set((b.outros || []).map(String))].filter(x => x && x !== principal);
    if (!principal || !outros.length) return json({ error: 'Escolha o cadastro principal e os repetidos' }, 400);
    const t = auth.tenant_id;
    const todos = [principal, ...outros];
    const achados = await env.DB.prepare(`SELECT * FROM clientes WHERE tenant_id = ? AND id IN (${todos.map(() => '?').join(', ')})`).bind(t, ...todos).all<Record<string, unknown>>();
    const rows = achados.results || [];
    if (rows.length !== todos.length) return json({ error: 'Algum cadastro não foi encontrado' }, 404);
    const p = rows.find(r => r.id === principal)!;
    const resto = outros.map(id => rows.find(r => r.id === id)!);

    // completa o que está vazio no principal + aplica o que a pessoa conferiu na tela
    const sets: string[] = []; const vals: unknown[] = [];
    const vazio = (v: unknown) => v === null || v === undefined || String(v).trim() === '';
    for (const col of Object.keys(p)) {
      if (NAO_COPIAR.has(col) || !/^[a-z_0-9]+$/.test(col)) continue;
      let novo: unknown = undefined;
      if (b.dados && DADOS.includes(col) && b.dados[col] !== undefined) novo = String(b.dados[col]).trim() || null;
      else if (vazio(p[col])) { const d = resto.find(r => !vazio(r[col])); if (d) novo = d[col]; }
      if (novo !== undefined && novo !== p[col]) { sets.push(`${col} = ?`); vals.push(novo); }
    }
    if (sets.length) await env.DB.prepare(`UPDATE clientes SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`).bind(...vals, principal, t).run();

    const oph = outros.map(() => '?').join(', ');
    const movidos: Record<string, number> = {};
    for (const tab of TABELAS) {
      try {
        const r = await env.DB.prepare(`UPDATE ${tab} SET cliente_id = ? WHERE tenant_id = ? AND cliente_id IN (${oph})`).bind(principal, t, ...outros).run();
        movidos[tab] = r.meta.changes || 0;
      } catch { /* tabela não existe nesta base */ }
    }
    try {
      await env.DB.prepare(`UPDATE OR IGNORE produtos_precos_especiais SET cliente_id = ? WHERE cliente_id IN (${oph})`).bind(principal, ...outros).run();
      await env.DB.prepare(`DELETE FROM produtos_precos_especiais WHERE cliente_id IN (${oph})`).bind(...outros).run();
    } catch { /* ok */ }
    // funil: fica o card do principal (se ele não tem, herda um dos repetidos)
    try {
      await env.DB.prepare(`UPDATE OR IGNORE crm_cards SET cliente_id = ? WHERE tenant_id = ? AND cliente_id IN (${oph})`).bind(principal, t, ...outros).run();
      await env.DB.prepare(`DELETE FROM crm_cards WHERE tenant_id = ? AND cliente_id IN (${oph})`).bind(t, ...outros).run();
    } catch { /* ok */ }

    const hoje = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
    await env.DB.batch(resto.map(r => env.DB.prepare(`UPDATE clientes SET ativo = 0, observacao = TRIM(COALESCE(observacao, '') || ?), updated_at = datetime('now') WHERE id = ? AND tenant_id = ?`)
      .bind(` [Unificado em ${hoje} no cadastro de ${String(p.nome)}]`, r.id, t)));
    const resumo = Object.entries(movidos).filter(([, n]) => n).map(([k, n]) => `${n} ${k.replace(/_/g, ' ')}`).join(', ');
    await registrarHistorico(env.DB, {
      tenant: t, clienteId: principal, tipo: 'unificacao', usuarioId: auth.usuario_id,
      descricao: `Cadastro unificado com ${resto.map(r => String(r.nome)).join(', ')}${resumo ? ` (trouxe ${resumo})` : ''}`,
    });
    try { await recalcularFunil(env.DB, t, principal); } catch { /* ok */ }
    return json({ ok: true, movidos });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
