import type { Env } from '../../lib/types';
import { json } from '../../lib/auth-middleware';
import { ensureSistemas, parseSistemas, SISTEMAS } from '../../lib/sistemas';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth.replace(/^Bearer\s+/i, '').trim() === env.ADMIN_SECRET.trim();
}

// POST /api/admin/unir  { principal_id, outra_id }
// Junta duas contas do mesmo cliente (ex.: Óticas + Vision) numa só: todos os dados da "outra"
// passam pra "principal", os sistemas liberados somam e a outra conta é desativada.
// Usuário com o mesmo e-mail nas duas fica só o da principal (vale a senha da principal).
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);
  try {
    await ensureSistemas(env.DB);
    const body = await request.json() as { principal_id?: string; outra_id?: string };
    const pid = body.principal_id, oid = body.outra_id;
    if (!pid || !oid || pid === oid) return json({ error: 'Escolha duas contas diferentes' }, 400);

    const p = await env.DB.prepare('SELECT id, tipo, sistemas, dispositivos_limite FROM tenants WHERE id = ?').bind(pid).first<Record<string, unknown>>();
    const o = await env.DB.prepare('SELECT id, tipo, sistemas, dispositivos_limite FROM tenants WHERE id = ?').bind(oid).first<Record<string, unknown>>();
    if (!p || !o) return json({ error: 'Conta não encontrada' }, 404);

    // 1) usuários repetidos (mesmo e-mail): fica o da principal
    await env.DB.prepare(
      `DELETE FROM usuarios WHERE tenant_id = ? AND lower(trim(email)) IN (SELECT lower(trim(email)) FROM usuarios WHERE tenant_id = ?)`
    ).bind(oid, pid).run();

    // 2) move tudo que tem tenant_id (qualquer tabela)
    const tabelas = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' AND name <> 'tenants'`
    ).all<{ name: string }>();
    const movidos: Record<string, number> = {};
    for (const { name } of tabelas.results || []) {
      if (!/^[A-Za-z0-9_]+$/.test(name)) continue;
      const cols = await env.DB.prepare(`PRAGMA table_info(${name})`).all<{ name: string }>();
      if (!(cols.results || []).some(c => c.name === 'tenant_id')) continue;
      // OR IGNORE: se bater em chave única (ex.: configuração da conta), vale o registro da principal
      const r = await env.DB.prepare(`UPDATE OR IGNORE ${name} SET tenant_id = ? WHERE tenant_id = ?`).bind(pid, oid).run();
      const n = ((r.meta as { changes?: number } | undefined)?.changes) || 0;
      if (n) movidos[name] = n;
    }

    // 3) soma os sistemas e o limite de tablets; desativa a outra conta
    const lista = new Set<string>([
      ...(parseSistemas(p.sistemas) || [String(p.tipo)]),
      ...(parseSistemas(o.sistemas) || [String(o.tipo)]),
    ]);
    const sistemas = SISTEMAS.filter(s => lista.has(s)).join(',');
    const disp = Math.max(Number(p.dispositivos_limite) || 1, Number(o.dispositivos_limite) || 1);
    await env.DB.batch([
      env.DB.prepare('UPDATE tenants SET sistemas = ?, dispositivos_limite = ? WHERE id = ?').bind(sistemas, disp, pid),
      env.DB.prepare('UPDATE tenants SET ativo = 0 WHERE id = ?').bind(oid),
    ]);

    return json({ ok: true, sistemas, movidos });
  } catch (err) {
    return json({ error: 'Erro ao unir contas', detail: String(err) }, 500);
  }
};
