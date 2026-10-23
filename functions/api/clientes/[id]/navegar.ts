import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';
import { filtroLojaComLegado } from '../../../lib/lojas';

// GET /api/clientes/:id/navegar?dir=primeiro|anterior|proximo|ultimo
// Anda pelos clientes em ordem alfabética (como as setas do cadastro). :id pode ser "novo".
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  try {
    const dir = new URL(request.url).searchParams.get('dir') || 'proximo';
    const fl = filtroLojaComLegado(auth);
    const base = `FROM clientes WHERE tenant_id = ? AND ativo = 1${fl.sql}`;
    let r: { id: string } | null = null;
    if (dir === 'primeiro' || dir === 'ultimo' || params.id === 'novo') {
      const ordem = dir === 'ultimo' || dir === 'anterior' ? 'DESC' : 'ASC';
      r = await env.DB.prepare(`SELECT id ${base} ORDER BY nome ${ordem}, id ${ordem} LIMIT 1`).bind(auth.tenant_id, ...fl.params).first();
    } else {
      const atual = await env.DB.prepare('SELECT nome, id FROM clientes WHERE id = ? AND tenant_id = ?').bind(params.id, auth.tenant_id).first<{ nome: string; id: string }>();
      if (!atual) return json({ id: null });
      r = dir === 'anterior'
        ? await env.DB.prepare(`SELECT id ${base} AND (nome < ? OR (nome = ? AND id < ?)) ORDER BY nome DESC, id DESC LIMIT 1`).bind(auth.tenant_id, ...fl.params, atual.nome, atual.nome, atual.id).first()
        : await env.DB.prepare(`SELECT id ${base} AND (nome > ? OR (nome = ? AND id > ?)) ORDER BY nome ASC, id ASC LIMIT 1`).bind(auth.tenant_id, ...fl.params, atual.nome, atual.nome, atual.id).first();
    }
    return json({ id: r?.id || null });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
