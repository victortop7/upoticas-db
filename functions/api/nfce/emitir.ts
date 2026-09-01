import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { blingFetch } from '../../lib/bling';

// Extrai uma mensagem legível do corpo de erro da API do Bling
function blingErro(obj: any): string {
  const e = obj?.error || obj;
  const partes: string[] = [];
  if (e?.description) partes.push(String(e.description));
  else if (e?.message) partes.push(String(e.message));
  const fields = e?.fields || obj?.error?.fields;
  if (Array.isArray(fields)) {
    for (const f of fields.slice(0, 4)) {
      const m = f?.msg || f?.message || f?.description;
      if (m) partes.push(`${f?.element || f?.field || ''}: ${m}`.trim());
    }
  }
  return partes.length ? partes.join(' · ') : JSON.stringify(e).slice(0, 300);
}

// POST /api/nfce/emitir { venda_id } — cria e emite a NF-e da venda no Bling.
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as { venda_id: string };
    if (!body.venda_id) return json({ error: 'venda_id é obrigatório' }, 400);

    // Garante colunas de controle da NF-e
    for (const c of ['nfce_status TEXT', 'nfce_numero TEXT', 'nfce_chave TEXT', 'nfce_link TEXT', 'nfce_bling_id TEXT']) {
      try { await env.DB.prepare(`ALTER TABLE vendas ADD COLUMN ${c}`).run(); } catch { /* já existe */ }
    }

    const [venda, tenant] = await Promise.all([
      env.DB.prepare(`
        SELECT v.*, c.nome as cliente_nome, c.cpf as cliente_cpf,
               c.email as cliente_email, c.telefone as cliente_telefone
        FROM vendas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.id = ? AND v.tenant_id = ?
      `).bind(body.venda_id, tenant_id).first<Record<string, unknown>>(),
      env.DB.prepare('SELECT nome, cnpj, bling_natureza_id FROM tenants WHERE id = ?')
        .bind(tenant_id).first<Record<string, unknown>>(),
    ]);

    if (!venda) return json({ error: 'Venda não encontrada' }, 404);
    if (venda.nfce_status === 'emitida') return json({ error: 'NF-e já emitida para esta venda.' }, 400);

    // Cliente com CPF/CNPJ é obrigatório para a NF-e (modelo 55)
    const docCliente = String(venda.cliente_cpf || '').replace(/\D/g, '');
    if (!venda.cliente_id || !docCliente) {
      return json({ error: 'A venda precisa de um cliente com CPF/CNPJ cadastrado para emitir a NF-e.' }, 400);
    }

    // Itens: usa os itens da venda; se não houver, uma linha única com o total
    let itensVenda: { descricao: string; quantidade: number; valor_unitario: number; codigo?: string }[] = [];
    try {
      const r = await env.DB.prepare(
        'SELECT descricao, quantidade, valor_unitario, produto_id FROM venda_itens WHERE venda_id = ? AND tenant_id = ?'
      ).bind(body.venda_id, tenant_id).all<{ descricao: string; quantidade: number; valor_unitario: number; produto_id: string | null }>();
      itensVenda = (r.results || []).map(it => ({ descricao: it.descricao, quantidade: Number(it.quantidade) || 1, valor_unitario: Number(it.valor_unitario) || 0 }));
    } catch { /* sem tabela de itens */ }

    if (itensVenda.length === 0) {
      itensVenda = [{ descricao: 'Produtos ópticos', quantidade: 1, valor_unitario: Number(venda.valor_final) || 0 }];
    }

    const itens = itensVenda.map(it => ({
      codigo: it.codigo || 'OPT',
      descricao: (it.descricao || 'Produto').slice(0, 120),
      unidade: 'UN',
      quantidade: it.quantidade,
      valor: it.valor_unitario,
    }));

    const naturezaId = tenant?.bling_natureza_id ? Number(tenant.bling_natureza_id) : null;

    const contato: Record<string, unknown> = {
      nome: venda.cliente_nome || 'Consumidor',
      tipoPessoa: docCliente.length > 11 ? 'J' : 'F',
      numeroDocumento: docCliente,
      contribuinte: 9, // não contribuinte
    };
    // E-mail do cliente → o Bling envia a nota (DANFE/XML) automaticamente pra ele
    if (venda.cliente_email) contato.email = String(venda.cliente_email).trim();

    const payload: Record<string, unknown> = {
      tipo: 1,          // saída
      finalidade: 1,    // normal
      contato,
      itens,
      ...(naturezaId ? { naturezaOperacao: { id: naturezaId } } : {}),
    };

    // 1) Cria a NF-e no Bling
    let criarResp: Response;
    try {
      criarResp = await blingFetch(env, tenant_id, '/nfe', { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) {
      if (e instanceof Error && e.message === 'BLING_NAO_CONECTADO') {
        return json({ error: 'Bling não conectado. Vá em Configurações → Bling e conecte a conta.' }, 400);
      }
      throw e;
    }
    const criar = await criarResp.json().catch(() => ({})) as Record<string, any>;
    if (!criarResp.ok) {
      return json({ error: `Bling recusou a NF-e: ${blingErro(criar)}`, detalhe: criar?.error || criar }, 400);
    }
    const notaId = criar?.data?.id;
    if (!notaId) return json({ error: 'Bling não retornou o ID da nota.', detalhe: criar }, 400);

    // 2) Envia para a SEFAZ (emite de fato)
    const enviarResp = await blingFetch(env, tenant_id, `/nfe/${notaId}/enviar`, { method: 'POST' });
    const enviar = await enviarResp.json().catch(() => ({})) as Record<string, any>;
    if (!enviarResp.ok) {
      // Nota criada mas não autorizada — guarda o rascunho e devolve o motivo
      await env.DB.prepare("UPDATE vendas SET nfce_status='rascunho', nfce_bling_id=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?")
        .bind(String(notaId), body.venda_id, tenant_id).run();
      return json({ error: `NF-e criada, mas a SEFAZ recusou: ${blingErro(enviar)}`, detalhe: enviar?.error || enviar }, 400);
    }

    // 3) Lê os dados finais da nota (número, link do DANFE)
    let numero: string | null = null;
    let link: string | null = null;
    try {
      const getResp = await blingFetch(env, tenant_id, `/nfe/${notaId}`, { method: 'GET' });
      const nota = (await getResp.json() as Record<string, any>)?.data;
      numero = nota?.numero != null ? String(nota.numero) : null;
      link = nota?.linkDanfe || nota?.linkPDF || nota?.link || null;
    } catch { /* segue sem os detalhes */ }

    await env.DB.prepare(
      "UPDATE vendas SET nfce_status='emitida', nfce_numero=?, nfce_link=?, nfce_bling_id=?, updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(numero, link, String(notaId), body.venda_id, tenant_id).run();

    const telefone = String(venda.cliente_telefone || '').replace(/\D/g, '');
    return json({
      ok: true, status: 'emitida', numero, link, telefone,
      email: venda.cliente_email ? String(venda.cliente_email) : null,
      mensagem: `NF-e ${numero ? '#' + numero + ' ' : ''}emitida!${venda.cliente_email ? ' Enviada por e-mail ao cliente.' : ''}`,
    });
  } catch (err) {
    return json({ error: 'Erro interno ao emitir NF-e', detail: String(err) }, 500);
  }
};
