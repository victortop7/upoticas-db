import type { PagesFunction, D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../lib/types';
import { requireAuth, json } from '../../lib/auth-middleware';
import { ensureClienteCols } from '../../lib/ensure-cliente-cols';

type D1PreparedStatement = ReturnType<D1Database['prepare']>;

// Normaliza nome para casar (maiúsculas, sem acento, espaços colapsados)
function norm(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// DD/MM/YYYY -> YYYY-MM-DD (valida faixa de datas de CADASTRO)
function toISO(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dd = +d, mm = +mo, yy = +y;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  // CADASTRO real fica entre 2022 e 2030 — descarta nascimento (1899, anos antigos) e lixo
  if (yy < 2022 || yy > 2030) return null;
  return `${y}-${mo}-${d}`;
}

const LABELS = /^(NOME|APELIDO|CPF|RG|NASCIMENTO|CADASTRO|ENDERE|BAIRRO|CIDADE|TELEFONE|EMAIL|FILIA|CONJUGE|C[ÓO]DIGO|RAZ[ÃA]O|FANTASIA|CNPJ|IE|FUNDA)/i;

// Extrai [{nome, data(ISO)}] da ficha cadastral colada
function parseFicha(texto: string): { nome: string; data: string }[] {
  const out: { nome: string; data: string }[] = [];
  const seen = new Set<string>();

  const push = (nomeRaw: string, dataBr: string) => {
    const nome = (nomeRaw || '').replace(/\s+/g, ' ').trim();
    if (!nome || nome.length < 3) return;
    if (LABELS.test(nome)) return;
    if (!/[A-Za-zÀ-ÿ]{2,}/.test(nome)) return; // precisa ter letras
    const iso = toISO(dataBr);
    if (!iso) return;
    const key = norm(nome);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ nome, data: iso });
  };

  // Estratégia 1 (camada de texto real da ficha): 1ª linha do registro = "NOME COMPLETO DD/MM/YYYY"
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^\s*(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s*$/);
    if (m) push(m[1], m[2]);
  }

  // Estratégia 2 (fallback layout renderizado): bloco por CÓDIGO com "NOME x" e "CADASTRO data"
  const blocos = texto.split(/C[ÓO]DIGO/i);
  for (const b of blocos) {
    let nome = '';
    const n1 = b.match(/(?:NOME|RAZ[ÃA]O SOCIAL)[ \t]+(\S[^\n\r]*)/i);
    if (n1 && !LABELS.test(n1[1].trim())) nome = n1[1];
    const c1 = b.match(/CADASTRO[ \t\r\n]+(\d{2}\/\d{2}\/\d{4})/i);
    if (nome && c1) push(nome, c1[1]);
  }

  return out;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    await ensureClienteCols(env.DB);

    const body = await request.json() as { texto?: string; registros?: { nome: string; data: string }[]; sobrescrever?: boolean };

    let registros: { nome: string; data: string }[] = [];
    if (Array.isArray(body.registros) && body.registros.length) {
      registros = body.registros
        .map(r => ({ nome: r.nome, data: /^\d{4}-\d{2}-\d{2}$/.test(r.data) ? r.data : (toISO(r.data) || '') }))
        .filter(r => r.nome && r.data);
    } else if (body.texto) {
      registros = parseFicha(body.texto);
    } else {
      return json({ error: 'Envie "texto" (ficha colada) ou "registros".' }, 400);
    }

    if (!registros.length) {
      return json({ error: 'Nenhuma data reconhecida no texto. Confira se colou a ficha cadastral completa.' }, 400);
    }

    // Mapa nome_normalizado -> id (clientes ativos da ótica)
    const clientes = await env.DB.prepare(
      'SELECT id, nome, data_compra FROM clientes WHERE tenant_id = ? AND ativo = 1'
    ).bind(auth.tenant_id).all<{ id: string; nome: string; data_compra: string | null }>();

    const mapa = new Map<string, { id: string; data_compra: string | null }>();
    for (const c of clientes.results) {
      const k = norm(c.nome);
      if (k && !mapa.has(k)) mapa.set(k, { id: c.id, data_compra: c.data_compra });
    }

    const now = new Date().toISOString();
    const stmts: D1PreparedStatement[] = [];
    let atualizados = 0, jaTinham = 0;
    const naoEncontrados: string[] = [];

    for (const r of registros) {
      const alvo = mapa.get(norm(r.nome));
      if (!alvo) { naoEncontrados.push(r.nome); continue; }
      if (alvo.data_compra && !body.sobrescrever) { jaTinham++; continue; }
      stmts.push(
        env.DB.prepare('UPDATE clientes SET data_compra = ?, updated_at = ? WHERE id = ? AND tenant_id = ?')
          .bind(r.data, now, alvo.id, auth.tenant_id)
      );
      atualizados++;
    }

    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
    }

    return json({
      ok: true,
      lidos: registros.length,
      atualizados,
      jaTinham,
      naoEncontrados: naoEncontrados.length,
      amostraNaoEncontrados: naoEncontrados.slice(0, 30),
    });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
