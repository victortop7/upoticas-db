import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';

// GET /api/clientes/duplicados: cadastros que parecem a mesma pessoa (mesmo CPF, mesmo telefone ou mesmo nome)
interface Cli { id: string; nome: string; cpf: string | null; celular: string | null; telefone: string | null; email: string | null; data_nascimento: string | null; cidade: string | null; bairro: string | null; created_at: string; codigo?: number | null; vendas: number; os: number; total: number; ultima: string | null }

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const chaveNome = (s: string) => semAcento(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const dig = (s: string | null) => (s || '').replace(/\D/g, '');

const RESUMO = `
  (SELECT COUNT(*) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id) AS vendas,
  (SELECT COUNT(*) FROM ordens_servico o WHERE o.cliente_id = c.id AND o.tenant_id = c.tenant_id) AS os,
  (SELECT COALESCE(SUM(v.valor_final), 0) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id AND v.situacao != 'cancelada') AS total,
  (SELECT MAX(v.created_at) FROM vendas v WHERE v.cliente_id = c.id AND v.tenant_id = c.tenant_id) AS ultima`;

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.perfil !== 'admin') return json({ error: 'Só o admin unifica cadastros' }, 403);
  const base = 'c.id, c.nome, c.cpf, c.celular, c.telefone, c.email, c.data_nascimento, c.cidade, c.bairro, c.created_at';
  let r;
  try {
    r = await env.DB.prepare(`SELECT ${base}, c.codigo, ${RESUMO} FROM clientes c WHERE c.tenant_id = ? AND c.ativo = 1`).bind(auth.tenant_id).all<Cli>();
  } catch {
    // base sem a coluna "codigo"
    r = await env.DB.prepare(`SELECT ${base}, ${RESUMO} FROM clientes c WHERE c.tenant_id = ? AND c.ativo = 1`).bind(auth.tenant_id).all<Cli>();
  }
  const lista = r.results || [];

  // junta quem compartilha CPF, telefone (últimos 8 dígitos) ou nome completo igual
  const pai = new Map<string, string>();
  const acha = (x: string): string => { const p = pai.get(x) ?? x; if (p === x) return x; const raiz = acha(p); pai.set(x, raiz); return raiz; };
  const une = (a: string, b: string) => { const ra = acha(a), rb = acha(b); if (ra !== rb) pai.set(ra, rb); };
  const motivo = new Map<string, Set<string>>();
  const porChave = new Map<string, string>();
  const marca = (k: string, id: string, m: string) => {
    const outro = porChave.get(k);
    if (!outro) { porChave.set(k, id); return; }
    if (outro === id) return;
    une(id, outro);
    for (const x of [id, outro]) { const s = motivo.get(x) || new Set<string>(); s.add(m); motivo.set(x, s); }
  };
  for (const c of lista) {
    const cpf = dig(c.cpf);
    if (cpf.length === 11 || cpf.length === 14) marca(`cpf:${cpf}`, c.id, 'mesmo CPF');
    for (const tel of new Set([dig(c.celular), dig(c.telefone)])) if (tel.length >= 8) marca(`tel:${tel.slice(-8)}`, c.id, 'mesmo telefone');
    const n = chaveNome(c.nome);
    if (n.split(' ').length >= 2) marca(`nome:${n}`, c.id, 'mesmo nome');
  }
  const grupos = new Map<string, Cli[]>();
  for (const c of lista) {
    if (!motivo.has(c.id)) continue;
    const g = acha(c.id);
    grupos.set(g, [...(grupos.get(g) || []), c]);
  }
  const saida = [...grupos.values()].filter(g => g.length > 1).map(g => ({
    motivos: [...new Set(g.flatMap(c => [...(motivo.get(c.id) || [])]))],
    // o que tem mais vendas aparece primeiro (sugestão de principal)
    clientes: g.sort((a, b) => (b.vendas - a.vendas) || String(a.created_at).localeCompare(String(b.created_at))),
  })).sort((a, b) => Number(b.motivos.includes('mesmo CPF')) - Number(a.motivos.includes('mesmo CPF')) || b.clientes.length - a.clientes.length);
  return json({ grupos: saida.slice(0, 300), total: saida.length });
};
