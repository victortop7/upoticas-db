import type { Env } from '../../../lib/types';
import { requireAuth, json } from '../../../lib/auth-middleware';

async function ensureTable(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lab_bancario (
        id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, numero INTEGER NOT NULL,
        conta_codigo TEXT NOT NULL, conta_nome TEXT,
        tipo TEXT NOT NULL, descricao TEXT NOT NULL,
        valor REAL NOT NULL, data_movimento TEXT NOT NULL,
        data_emissao TEXT, forma_pgto TEXT, observacoes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch {}
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);
    const url = new URL(request.url);
    const conta   = url.searchParams.get('conta');
    const tipo    = url.searchParams.get('tipo');
    const dataIni = url.searchParams.get('data_ini');
    const dataFim = url.searchParams.get('data_fim');

    let query = 'SELECT * FROM lab_bancario WHERE tenant_id = ?';
    const params: unknown[] = [tenant_id];
    if (conta)   { query += ' AND conta_codigo = ?'; params.push(conta); }
    if (tipo)    { query += ' AND tipo = ?'; params.push(tipo); }
    if (dataIni) { query += ' AND date(data_movimento) >= ?'; params.push(dataIni); }
    if (dataFim) { query += ' AND date(data_movimento) <= ?'; params.push(dataFim); }
    query += ' ORDER BY data_movimento ASC, created_at ASC LIMIT 500';

    const rows = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>();

    // Calc saldo parcial
    let saldo = 0;
    const result = rows.results.map(r => {
      const v = Number(r.valor);
      saldo += r.tipo === 'C' ? v : -v;
      return { ...r, saldo_parcial: saldo };
    });
    return json(result);
  } catch (err) { return json({ error: String(err) }, 500); }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;
    const { tenant_id } = auth;
    await ensureTable(env);
    const b = await request.json() as Record<string, unknown>;
    if (!b.conta_codigo || !b.tipo || !b.descricao || !b.valor || !b.data_movimento) return json({ error: 'Campos obrigatórios ausentes' }, 400);

    // Get conta name from configurações
    const cfgRow = await env.DB.prepare(`SELECT valor FROM lab_configuracoes WHERE tenant_id = ? AND chave = ?`).bind(tenant_id, `tab_banco_${String(b.conta_codigo).padStart(2,'0')}_nome`).first<{ valor: string }>();
    const conta_nome = cfgRow?.valor || String(b.conta_codigo);

    const numRow = await env.DB.prepare('SELECT COALESCE(MAX(numero),0)+1 as next FROM lab_bancario WHERE tenant_id=?').bind(tenant_id).first<{ next: number }>();
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO lab_bancario (id,tenant_id,numero,conta_codigo,conta_nome,tipo,descricao,valor,data_movimento,data_emissao,forma_pgto,observacoes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,tenant_id,numRow?.next??1,b.conta_codigo,conta_nome,b.tipo,b.descricao,b.valor,b.data_movimento,b.data_emissao??null,b.forma_pgto??null,b.observacoes??null).run();
    return json({ id }, 201);
  } catch (err) { return json({ error: String(err) }, 500); }
};
