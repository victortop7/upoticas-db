import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    const body = await request.json() as { venda_id: string };
    if (!body.venda_id) return json({ error: 'venda_id é obrigatório' }, 400);

    // Buscar dados da venda + tenant
    const [venda, tenant] = await Promise.all([
      env.DB.prepare(`
        SELECT v.*, c.nome as cliente_nome, c.cpf as cliente_cpf,
               c.email as cliente_email, c.telefone as cliente_telefone
        FROM vendas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.id = ? AND v.tenant_id = ?
      `).bind(body.venda_id, tenant_id).first<Record<string, unknown>>(),

      env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
        .bind(tenant_id).first<Record<string, unknown>>(),
    ]);

    if (!venda) return json({ error: 'Venda não encontrada' }, 404);

    // Verificar se já emitiu
    if (venda.nfce_status === 'emitida') {
      return json({ error: 'NFC-e já emitida para esta venda' }, 400);
    }

    // Verificar chave API configurada
    const apiKey = tenant?.nfce_api_key as string | null;
    if (!apiKey) {
      return json({ error: 'Chave API da NFC-e não configurada. Configure em Configurações.' }, 400);
    }

    // =====================================================
    // PAYLOAD PRONTO PARA FOCUS NF-E
    // Descomentar quando for ativar a integração
    // =====================================================
    const _payload = {
      natureza_operacao: 'Venda ao Consumidor',
      forma_pagamento: venda.forma_pagamento === 'dinheiro' ? 0 :
                       venda.forma_pagamento === 'credito' ? 3 :
                       venda.forma_pagamento === 'debito' ? 4 : 1,
      emitente: {
        cnpj: tenant?.cnpj,
        nome: tenant?.nome,
        logradouro: tenant?.endereco,
        municipio: tenant?.cidade,
        uf: tenant?.uf,
      },
      destinatario: venda.cliente_cpf ? {
        cpf: String(venda.cliente_cpf).replace(/\D/g, ''),
        nome: venda.cliente_nome,
        email: venda.cliente_email,
      } : undefined,
      itens: [{
        numero_item: 1,
        codigo_produto: '001',
        descricao: 'Serviços ópticos / produtos',
        cfop: '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: 1,
        valor_unitario_comercial: Number(venda.valor_final),
        valor_bruto: Number(venda.valor_final),
        icms_origem: 0,
        icms_modalidade: 102, // Simples Nacional sem permissão de crédito
        valor_total_tributos: 0,
      }],
      valor_total: Number(venda.valor_final),
      forma_emissao: tenant?.nfce_ambiente === 'producao' ? 1 : 2, // 1=produção, 2=homologação
    };

    // =====================================================
    // TODO: Integração Focus NF-e (descomentar para ativar)
    // =====================================================
    // const ambiente = tenant?.nfce_ambiente === 'producao' ? 'producao' : 'homologacao';
    // const resp = await fetch(`https://api.focusnfe.com.br/v2/nfce?ref=${body.venda_id}`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${btoa(apiKey + ':')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(_payload),
    // });
    // const result = await resp.json() as any;
    // if (!resp.ok) return json({ error: result.mensagem || 'Erro ao emitir NFC-e' }, 400);
    //
    // await env.DB.prepare(
    //   "UPDATE vendas SET nfce_status='emitida', nfce_numero=?, nfce_chave=?, updated_at=datetime('now') WHERE id=?"
    // ).bind(result.numero, result.chave_nfe, body.venda_id).run();
    //
    // return json({ ok: true, numero: result.numero, danfe_url: result.danfe_url });
    // =====================================================

    // Resposta temporária (modo gatilho)
    await env.DB.prepare(
      "UPDATE vendas SET nfce_status='pendente', updated_at=datetime('now') WHERE id=? AND tenant_id=?"
    ).bind(body.venda_id, tenant_id).run();

    return json({
      ok: true,
      status: 'pendente',
      mensagem: 'Integração NFC-e em configuração. Dados validados e prontos para emissão.',
      payload_pronto: true,
    });

  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
