import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureLojaCols, filtroLoja } from '../../lib/lojas';
import { ensurePagamentos } from '../../lib/pagamentos';
import { ensureCrmFluxo } from '../../lib/crmFluxo';

// GET /api/relatorios/dados?inicio=&fim=&canceladas=0|1&vendedor=<id>
// Dados "planos" do período para o relatório personalizado / exportação:
// vendas, pagamentos (1 linha por pagamento) e itens (com custo e margem).
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureLojaCols(env.DB);
    await ensureCrmFluxo(env.DB);
    await ensurePagamentos(env.DB);
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN valor_entrada REAL NOT NULL DEFAULT 0').run(); } catch {}
    try { await env.DB.prepare('ALTER TABLE vendas ADD COLUMN saldo_restante REAL NOT NULL DEFAULT 0').run(); } catch {}

    const url = new URL(request.url);
    const inicio = url.searchParams.get('inicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fim = url.searchParams.get('fim') || new Date().toISOString().split('T')[0];
    const incluirCanceladas = url.searchParams.get('canceladas') === '1';
    const vendedor = auth.perfil === 'admin' ? (url.searchParams.get('vendedor') || '') : auth.usuario_id;

    const fl = filtroLoja(auth, 'v.loja_id');
    let where = `v.tenant_id = ? AND date(v.created_at) BETWEEN ? AND ?${fl.sql}`;
    const params: unknown[] = [auth.tenant_id, inicio, fim, ...fl.params];
    if (!incluirCanceladas) where += ` AND v.situacao != 'cancelada'`;
    if (vendedor) { where += ' AND v.funcionario_id = ?'; params.push(vendedor); }

    const [vendasR, pagR, itensR, cancR, tenant, loja] = await Promise.all([
      env.DB.prepare(`
        SELECT v.id, v.numero, v.created_at, v.situacao, v.os_id, v.grupo_venda_id,
               v.valor_total, v.desconto, v.valor_final, v.valor_entrada, v.saldo_restante, v.forma_pagamento,
               v.cliente_id, c.nome as cliente_nome, c.cpf as cliente_cpf,
 v.origem,
               os.numero as os_numero
        FROM vendas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        LEFT JOIN usuarios u ON u.id = v.funcionario_id
        LEFT JOIN ordens_servico os ON os.id = v.os_id
        WHERE ${where}
        ORDER BY v.created_at ASC, v.numero ASC
      `).bind(...params).all<Record<string, any>>(),

      env.DB.prepare(`
        SELECT p.venda_id, p.forma, p.valor, p.bandeira, p.parcelas, p.data_recebimento, p.conta
        FROM venda_pagamentos p JOIN vendas v ON v.id = p.venda_id
        WHERE p.tenant_id = ? AND ${where}
        ORDER BY p.rowid
      `).bind(auth.tenant_id, ...params).all<Record<string, any>>(),

      env.DB.prepare(`
        SELECT vi.venda_id, vi.produto_id, vi.descricao, vi.quantidade, vi.valor_unitario, vi.desconto, vi.valor_total,
               pr.codigo, pr.grupo, pr.preco_custo
        FROM venda_itens vi
        JOIN vendas v ON v.id = vi.venda_id
        LEFT JOIN produtos pr ON pr.id = vi.produto_id
        WHERE vi.tenant_id = ? AND ${where}
        ORDER BY v.created_at ASC, v.numero ASC, vi.rowid ASC
      `).bind(auth.tenant_id, ...params).all<Record<string, any>>().catch(() => ({ results: [] as Record<string, any>[] })),

      // Canceladas do período (sempre informadas, mesmo quando não listadas)
      env.DB.prepare(`
        SELECT COUNT(*) as n, COALESCE(SUM(v.valor_final), 0) as total, GROUP_CONCAT(v.numero) as numeros
        FROM vendas v WHERE v.tenant_id = ? AND date(v.created_at) BETWEEN ? AND ?${fl.sql}${vendedor ? ' AND v.funcionario_id = ?' : ''} AND v.situacao = 'cancelada'
      `).bind(auth.tenant_id, inicio, fim, ...fl.params, ...(vendedor ? [vendedor] : [])).first<{ n: number; total: number; numeros: string | null }>(),

      env.DB.prepare('SELECT nome FROM tenants WHERE id = ?').bind(auth.tenant_id).first<{ nome: string }>(),
      auth.loja_id ? env.DB.prepare('SELECT nome FROM lojas WHERE id = ?').bind(auth.loja_id).first<{ nome: string }>() : Promise.resolve(null),
    ]);

    const vendasRaw = vendasR.results || [];
    const numeroPorId = new Map<string, number>(vendasRaw.map(v => [String(v.id), Number(v.numero)]));

    const vendas = vendasRaw.map(v => {
      const id = String(v.id);
      return {
        id,
        numero: Number(v.numero),
        data: String(v.created_at || ''),
        situacao: v.situacao,
        cliente_id: v.cliente_id || '',
        cliente: v.cliente_nome || '',
        cpf: v.cliente_cpf || '',
        vendedor_id: v.funcionario_id || '',
        vendedor: v.vendedor || '',
        origem: v.origem || '',
        os_id: v.os_id || '',
        os_numero: v.os_numero != null ? Number(v.os_numero) : null,
        grupo_venda_id: v.grupo_venda_id || '',
        forma: v.forma_pagamento || '',
        valor_bruto: Number(v.valor_total) || 0,
        desconto: Number(v.desconto) || 0,
        valor_final: Number(v.valor_final) || 0,
        recebido: Number(v.valor_entrada) || 0,
        saldo: Number(v.saldo_restante) || 0,
        // vendas migradas do sistema antigo têm id "cc-vnd-<nº original>"
        doc_original: id.startsWith('cc-vnd-') ? id.slice(7) : '',
      };
    });

    // Pagamentos: linhas gravadas; vendas antigas sem linhas ganham uma linha montada do registro.
    const linhasPorVenda = new Map<string, Record<string, any>[]>();
    for (const p of (pagR.results || [])) {
      const k = String(p.venda_id);
      if (!linhasPorVenda.has(k)) linhasPorVenda.set(k, []);
      linhasPorVenda.get(k)!.push(p);
    }
    const pagamentos: Record<string, unknown>[] = [];
    for (const v of vendas) {
      const linhas = linhasPorVenda.get(v.id) || [];
      let soma = 0;
      if (linhas.length) {
        for (const l of linhas) {
          const valor = Number(l.valor) || 0; soma += valor;
          pagamentos.push({
            venda_id: v.id, numero: v.numero, data_venda: v.data, cliente: v.cliente, vendedor: v.vendedor,
            forma: l.forma, valor, bandeira: l.bandeira || '', parcelas: l.parcelas || '',
            data_recebimento: l.data_recebimento || '', conta: l.conta || '', origem: 'lançado',
          });
        }
      } else if (v.recebido > 0) {
        soma = v.recebido;
        pagamentos.push({
          venda_id: v.id, numero: v.numero, data_venda: v.data, cliente: v.cliente, vendedor: v.vendedor,
          forma: v.forma || 'outro', valor: v.recebido, bandeira: '', parcelas: '',
          data_recebimento: v.data.split('T')[0].split(' ')[0], conta: '', origem: 'registro antigo',
        });
      }
      const pend = Math.round((v.valor_final - soma) * 100) / 100;
      if (pend > 0.009 && v.situacao !== 'cancelada') {
        pagamentos.push({
          venda_id: v.id, numero: v.numero, data_venda: v.data, cliente: v.cliente, vendedor: v.vendedor,
          forma: 'a_receber', valor: pend, bandeira: '', parcelas: '', data_recebimento: '', conta: '', origem: 'saldo em aberto',
        });
      }
    }

    // Itens com custo e margem
    const itens = (itensR.results || []).map(it => {
      const qtd = Number(it.quantidade) || 0;
      const total = Number(it.valor_total) || 0;
      const custoUnit = Number(it.preco_custo) || 0;
      const custoTotal = Math.round(custoUnit * qtd * 100) / 100;
      const margem = Math.round((total - custoTotal) * 100) / 100;
      const prodId = String(it.produto_id || '');
      return {
        venda_id: it.venda_id, numero: numeroPorId.get(String(it.venda_id)) ?? null,
        produto_id: prodId,
        codigo: it.codigo || (prodId.startsWith('cc-prod-') ? prodId.slice(8) : ''),
        grupo: it.grupo || '',
        descricao: it.descricao || '',
        qtd, unitario: Number(it.valor_unitario) || 0, desconto: Number(it.desconto) || 0, total,
        custo_unit: custoUnit, custo_total: custoTotal,
        margem, margem_pct: total > 0 && custoUnit > 0 ? Math.round((margem / total) * 1000) / 10 : null,
      };
    });

    return json({
      periodo: { inicio, fim },
      empresa: tenant?.nome || '',
      loja: loja?.nome || null,
      canceladas: { qtd: cancR?.n || 0, total: cancR?.total || 0, numeros: cancR?.numeros ? String(cancR.numeros).split(',').map(Number).sort((a, b) => a - b) : [] },
      vendas, pagamentos, itens,
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
