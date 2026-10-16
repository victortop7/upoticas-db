import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { listarTitulos, type FiltroTitulos } from '../../../lib/receber';

// GET /api/financeiro/receber — Contas a Receber integrado (carnês + saldo das vendas + manuais)
//   ?situacao=aberto|vencido|pendente|recebido|todos &inicio&fim (vencimento) &q &bairro &cidade &endereco &origem &cliente_id
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    const u = new URL(request.url).searchParams;
    const f: FiltroTitulos = {
      situacao: u.get('situacao') || 'aberto',
      inicio: u.get('inicio') || '', fim: u.get('fim') || '',
      q: u.get('q') || '', bairro: u.get('bairro') || '', cidade: u.get('cidade') || '', endereco: u.get('endereco') || '',
      origem: u.get('origem') || '', cliente_id: u.get('cliente_id') || '',
      loja_id: auth.perfil !== 'admin' && auth.loja_id ? auth.loja_id : null,
    };
    const titulos = await listarTitulos(env.DB, auth.tenant_id, f);
    const soma = (s: string) => titulos.filter(t => t.situacao === s).reduce((a, t) => a + t.valor, 0);
    const clientes = new Set(titulos.filter(t => t.situacao === 'vencido' && t.cliente_id).map(t => t.cliente_id));
    return json({
      titulos,
      resumo: {
        pendente: soma('pendente'), vencido: soma('vencido'), recebido: soma('recebido'),
        qtd: titulos.length, clientes_em_atraso: clientes.size,
      },
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
