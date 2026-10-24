import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { ensureClienteExtra, podeVerHistorico } from '../../../lib/clienteExtra';
import { ensurePagamentos } from '../../../lib/pagamentos';

// GET /api/clientes/:id/movimentacao: tudo que aconteceu com o cliente, do mais recente pro mais antigo.
// Só admin, ou quem o admin liberou ("Histórico do cliente" nas permissões).
interface Evento { data: string; tipo: string; descricao: string; valor: number | null; usuario: string | null }
const FORMA: Record<string, string> = { dinheiro: 'Dinheiro', pix: 'Pix', credito: 'Crédito', debito: 'Débito', boleto: 'Boleto', outro: 'Outro', misto: 'Várias formas' };

export const onRequestGet = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!podeVerHistorico(auth)) return json({ error: 'Sem permissão para ver o histórico do cliente' }, 403);
  await ensureClienteExtra(env.DB);
  await ensurePagamentos(env.DB);
  const t = auth.tenant_id, c = params.id;
  const ev: Evento[] = [];
  const tenta = async (f: () => Promise<void>) => { try { await f(); } catch { /* tabela/coluna ausente: ignora a fonte */ } };

  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT v.created_at, v.numero, v.valor_final, v.situacao, v.forma_pagamento, u.nome AS usuario,
        (SELECT GROUP_CONCAT(i.descricao, ', ') FROM venda_itens i WHERE i.venda_id = v.id) AS itens
      FROM vendas v LEFT JOIN usuarios u ON u.id = v.funcionario_id WHERE v.tenant_id = ? AND v.cliente_id = ?`).bind(t, c).all<Record<string, string | number | null>>();
    for (const v of r.results || []) {
      ev.push({ data: String(v.created_at), tipo: 'venda', valor: Number(v.valor_final) || 0, usuario: v.usuario as string | null,
        descricao: `Venda #${v.numero}${v.itens ? ` · ${v.itens}` : ''}${v.situacao === 'cancelada' ? ' · CANCELADA' : ''}` });
    }
  });
  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT p.data_recebimento, p.created_at, p.forma, p.valor, p.parcelas, v.numero FROM venda_pagamentos p JOIN vendas v ON v.id = p.venda_id
      WHERE p.tenant_id = ? AND v.cliente_id = ?`).bind(t, c).all<Record<string, string | number | null>>();
    for (const p of r.results || []) {
      if (p.forma === 'boleto') continue; // aparece no carnê e nas parcelas pagas
      ev.push({ data: String(p.data_recebimento || p.created_at), tipo: 'pagamento', valor: Number(p.valor) || 0, usuario: null,
        descricao: `Pagamento da venda #${p.numero} · ${FORMA[String(p.forma)] || p.forma}${Number(p.parcelas) > 1 ? ` em ${p.parcelas}x` : ''}` });
    }
  });
  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT entregue_em, numero FROM vendas WHERE tenant_id = ? AND cliente_id = ? AND entregue_em IS NOT NULL AND situacao != 'cancelada'`).bind(t, c).all<{ entregue_em: string; numero: number }>();
    for (const v of r.results || []) ev.push({ data: String(v.entregue_em), tipo: 'entrega', valor: null, usuario: null, descricao: `Óculos entregue (venda #${v.numero})` });
  });
  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT o.created_at, o.numero, o.situacao, o.armacao_desc, o.lente_desc, u.nome AS usuario FROM ordens_servico o LEFT JOIN usuarios u ON u.id = o.funcionario_id
      WHERE o.tenant_id = ? AND o.cliente_id = ?`).bind(t, c).all<Record<string, string | number | null>>();
    for (const o of r.results || []) {
      ev.push({ data: String(o.created_at), tipo: 'os', valor: null, usuario: o.usuario as string | null,
        descricao: `OS ${o.numero} aberta${[o.armacao_desc, o.lente_desc].filter(Boolean).length ? ` · ${[o.armacao_desc, o.lente_desc].filter(Boolean).join(' · ')}` : ''}` });
    }
  });
  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT created_at, descricao, valor_total, num_parcelas FROM carnes WHERE tenant_id = ? AND cliente_id = ?`).bind(t, c).all<Record<string, string | number>>();
    for (const k of r.results || []) ev.push({ data: String(k.created_at), tipo: 'carne', valor: Number(k.valor_total) || 0, usuario: null, descricao: `Carnê criado · ${k.num_parcelas}x · ${k.descricao}` });
    const p = await env.DB.prepare(`SELECT p.pago_em, p.numero, p.valor, k.num_parcelas, k.descricao FROM carne_parcelas p JOIN carnes k ON k.id = p.carne_id
      WHERE p.tenant_id = ? AND k.cliente_id = ? AND p.status = 'pago' AND p.pago_em IS NOT NULL`).bind(t, c).all<Record<string, string | number>>();
    for (const x of p.results || []) ev.push({ data: String(x.pago_em), tipo: 'parcela', valor: Number(x.valor) || 0, usuario: null, descricao: `Parcela ${x.numero}/${x.num_parcelas} paga · ${x.descricao}` });
  });
  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT created_at, data_recebimento, situacao, descricao, valor FROM contas_receber WHERE tenant_id = ? AND cliente_id = ?`).bind(t, c).all<Record<string, string | number | null>>();
    for (const x of r.results || []) {
      ev.push({ data: String(x.created_at), tipo: 'lancamento', valor: Number(x.valor) || 0, usuario: null, descricao: `Lançamento a receber · ${x.descricao}` });
      if (x.situacao === 'recebido' && x.data_recebimento) ev.push({ data: String(x.data_recebimento), tipo: 'pagamento', valor: Number(x.valor) || 0, usuario: null, descricao: `Recebido · ${x.descricao}` });
    }
  });
  await tenta(async () => {
    const r = await env.DB.prepare(`SELECT h.created_at, h.tipo, h.descricao, h.valor, u.nome AS usuario FROM cliente_historico h LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.tenant_id = ? AND h.cliente_id = ?`).bind(t, c).all<Record<string, string | number | null>>();
    for (const h of r.results || []) ev.push({ data: String(h.created_at), tipo: String(h.tipo), valor: h.valor === null ? null : Number(h.valor), usuario: h.usuario as string | null, descricao: String(h.descricao) });
  });

  // datas com e sem hora no mesmo formato pra ordenar
  const chave = (d: string) => (d.length <= 10 ? `${d}T12:00:00` : d.replace(' ', 'T'));
  ev.sort((a, b) => chave(b.data).localeCompare(chave(a.data)));
  return json(ev.slice(0, 600));
};
