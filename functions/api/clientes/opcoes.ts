import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureFicha } from '../../lib/clienteFicha';

// GET /api/clientes/opcoes: sugestões para os campos da ficha (regiões, localidades, bairros, cidades já usados)
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    await ensureFicha(env.DB);
    const lista = async (col: string) => {
      const r = await env.DB.prepare(
        `SELECT ${col} AS v, COUNT(*) AS n FROM clientes WHERE tenant_id = ? AND ${col} IS NOT NULL AND trim(${col}) != '' GROUP BY lower(trim(${col})) ORDER BY n DESC LIMIT 300`
      ).bind(auth.tenant_id).all<{ v: string }>();
      return (r.results || []).map(x => x.v).sort((a, b) => a.localeCompare(b));
    };
    const [regiao, localidade, bairro, cidade] = await Promise.all([lista('regiao'), lista('localidade'), lista('bairro'), lista('cidade')]);
    return json({ regiao, localidade, bairro, cidade });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
