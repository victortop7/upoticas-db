import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

// GET /api/lab/bancario/contas — retorna bancos cadastrados em configurações
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;

    // Busca todas as chaves tab_banco_XX_nome nas configurações
    const rows = await env.DB.prepare(
      `SELECT chave, valor FROM lab_configuracoes WHERE tenant_id = ? AND chave LIKE 'tab_banco_%_nome' AND valor IS NOT NULL AND valor != '' ORDER BY chave ASC`
    ).bind(tenant_id).all<{ chave: string; valor: string }>();

    const contas = rows.results.map(r => {
      const codigo = r.chave.replace('tab_banco_', '').replace('_nome', '');
      return { codigo, nome: r.valor };
    });

    // Se não houver contas cadastradas, retorna defaults
    if (contas.length === 0) {
      return json([
        { codigo: '01', nome: 'CAIXA' },
        { codigo: '02', nome: 'BANCO' },
        { codigo: '03', nome: 'PIX' },
      ]);
    }

    return json(contas);
  } catch (err) { return json({ error: String(err) }, 500); }
};
