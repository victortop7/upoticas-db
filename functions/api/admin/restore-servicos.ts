import type { Env } from '../../lib/types';
import { json } from '../../lib/auth-middleware';

function isAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('authorization') || '';
  return !!env.ADMIN_SECRET && auth === `Bearer ${env.ADMIN_SECRET}`;
}

// Seed com os preços originais para restauração
const SEED = [
  { codigo:'0300', nome:'ACCLIMATES UHD DIGITAL',                   p1:0,      p2:0 },
  { codigo:'0260', nome:'ALTERAÇÃO DE MODELO',                      p1:0,      p2:0 },
  { codigo:'0012', nome:'ANTIRREFLEXO',                             p1:0,      p2:0 },
  { codigo:'0007', nome:'ANTIRRISCO',                               p1:10.00,  p2:10.00 },
  { codigo:'0276', nome:'ARMAÇÃO',                                  p1:75.00,  p2:0 },
  { codigo:'0309', nome:'ARMAÇÃO ACETATO',                          p1:20.00,  p2:20.00 },
  { codigo:'0206', nome:'BF FLAT TOP CR39 INCOLOR',                 p1:0,      p2:0 },
  { codigo:'0207', nome:'BF FLAT TOP FOTO CR39',                    p1:0,      p2:0 },
  { codigo:'0120', nome:'BF FLATTOP CR39',                          p1:33.60,  p2:0 },
  { codigo:'0229', nome:'BF FLATTOP CR39 FOTO',                     p1:72.00,  p2:0 },
  { codigo:'0147', nome:'BF FLATTOP CR39 FOTO',                     p1:32.00,  p2:0 },
  { codigo:'0135', nome:'BF KRIPTOK CR39 INCOLOR',                  p1:107.00, p2:0 },
  { codigo:'0205', nome:'BF KRIPTOK FOTO',                          p1:71.00,  p2:69.50 },
  { codigo:'0122', nome:'BF KRIPTOK FOTO AR',                       p1:39.00,  p2:38.22 },
  { codigo:'0203', nome:'BF KRIPTOK INCOLOR',                       p1:55.00,  p2:0 },
  { codigo:'0116', nome:'BF KRIPTOK INCOLOR LENTE PRONTA',          p1:67.00,  p2:0 },
  { codigo:'0146', nome:'BF KRIPTOK LENTE PRONTA',                  p1:20.00,  p2:0 },
  { codigo:'0233', nome:'BF OMEGA ORMA',                            p1:0,      p2:0 },
  { codigo:'0094', nome:'BF ULTEX CR39 FOTO',                       p1:53.00,  p2:0 },
  { codigo:'0093', nome:'BF ULTEX CR39 INCOLOR',                    p1:280.00, p2:280.00 },
  { codigo:'0204', nome:'BF ULTEX FOTO',                            p1:71.00,  p2:69.50 },
  { codigo:'0202', nome:'BF ULTEX INCOLOR',                         p1:39.00,  p2:38.22 },
  { codigo:'0174', nome:'BF ULTEX INCOLOR LENTE PRONTA',            p1:55.00,  p2:0 },
  { codigo:'0145', nome:'BF ULTEX LENTE PRONTA',                    p1:20.00,  p2:0 },
  { codigo:'0259', nome:'BF. KRIPTOK INCOLOR CRISTAL',              p1:20.00,  p2:0 },
  { codigo:'0069', nome:'BS CR39 FOTO',                             p1:53.00,  p2:0 },
  { codigo:'0272', nome:'BUS 1.60 INCOLOR',                         p1:80.00,  p2:53.90 },
  { codigo:'0235', nome:'BUS 1.60 INCOLOR BLUE',                    p1:100.00, p2:100.00 },
  { codigo:'0271', nome:'BUS 1.61 ALTO INDICE INCOLOR',             p1:120.00, p2:120.00 },
  { codigo:'0148', nome:'BUS 1.67 FOTO C/ AR',                      p1:410.00, p2:0 },
  { codigo:'0155', nome:'BUS 1.67 FOTO COM AR LUZ AZUL',            p1:437.00, p2:0 },
  { codigo:'0138', nome:'BUS 1.67 INCOLOR',                         p1:224.00, p2:0 },
  { codigo:'0074', nome:'BUS 1.67 INCOLOR C/ AR EXTERNO',           p1:220.00, p2:0 },
  { codigo:'0141', nome:'BUS 1.67 PHOTO FUSION',                    p1:242.00, p2:0 },
  { codigo:'0142', nome:'BUS 1.67 TRANSITIONS',                     p1:407.00, p2:0 },
  { codigo:'0281', nome:'BUS 1.74 INCOLOR',                         p1:617.00, p2:0 },
  { codigo:'0149', nome:'BUS ALTO INDICE BLUE CUT 1.67',            p1:560.00, p2:0 },
  { codigo:'0185', nome:'BUS ALTO INDICE FOTO 1.67',                p1:345.00, p2:330.10 },
  { codigo:'0186', nome:'BUS ALTO INDICE FOTO BLUE CUT 1.67',       p1:396.00, p2:361.62 },
  { codigo:'0076', nome:'BUS ALTO INDICE INCOLOR 1.74',             p1:301.00, p2:0 },
  { codigo:'0184', nome:'BUS ALTO INDICE INCOLOR ANTIRREFLEXO',     p1:175.00, p2:171.50 },
  { codigo:'0177', nome:'BUS CR39 ANTIRREFLEXO',                    p1:47.00,  p2:41.74 },
  { codigo:'0140', nome:'BUS CR39 BLUE CUT',                        p1:59.00,  p2:0 },
  { codigo:'0179', nome:'BUS CR39 FOTO BLUE CUT',                   p1:62.00,  p2:60.76 },
  { codigo:'0131', nome:'BUS CR39 FOTO BLUE CUT 125',               p1:125.00, p2:122.50 },
  { codigo:'0117', nome:'BUS CR39 INCOLOR 75MM',                    p1:41.00,  p2:40.18 },
  { codigo:'0180', nome:'BUS CR39 TRANSITIONS',                     p1:222.00, p2:197.96 },
  { codigo:'0078', nome:'BUS FOTO C/ AR EXTERNO',                   p1:53.00,  p2:0 },
  { codigo:'0126', nome:'BUS INCOLOR 1.67',                         p1:168.00, p2:0 },
  { codigo:'0072', nome:'BUS POLI C/ AR EXTERNO',                   p1:90.00,  p2:0 },
  { codigo:'0158', nome:'BUS POLI FOTO C/ AR EXTERNO',              p1:210.00, p2:0 },
  { codigo:'0182', nome:'BUS POLICARBONATO ANTIRREFLEXO OPTO',      p1:73.00,  p2:0 },
  { codigo:'0073', nome:'BUS POLICARBONATO FOTO (MASSA)',            p1:192.00, p2:0 },
  { codigo:'0183', nome:'BUS POLICARBONATO FOTO INSTYLE PELICULA',  p1:286.00, p2:0 },
  { codigo:'0071', nome:'BUS POLICARBONATO INCOLOR',                p1:48.00,  p2:0 },
  { codigo:'0293', nome:'BUS POLICARBONATO INCOLOR (120)',           p1:120.00, p2:120.00 },
  { codigo:'0181', nome:'BUS POLY INC. (1.59) BASES 050/2/4/6/8',   p1:40.00,  p2:0 },
  { codigo:'0218', nome:'BUS POLY TRANSITIONS VIII',                 p1:450.00, p2:0 },
];

// POST /api/admin/restore-servicos
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!isAdmin(request, env)) return json({ error: 'Não autorizado' }, 401);

  try {
    const body = await request.json() as {
      tenant_id: string;
      lista1?: string;
      lista2?: string;
      lista3?: string;
      restore_precos?: boolean;
    };

    if (!body.tenant_id) return json({ error: 'tenant_id obrigatório' }, 400);
    const tid = body.tenant_id;

    const stmts: ReturnType<typeof env.DB.prepare>[] = [];

    // 1. Restaurar nomes das listas em lab_configuracoes
    const configEntries: [string, string][] = [];
    if (body.lista1) configEntries.push(['tab_lista_1', body.lista1]);
    if (body.lista2) configEntries.push(['tab_lista_2', body.lista2]);
    if (body.lista3) configEntries.push(['tab_lista_3', body.lista3]);

    for (const [chave, valor] of configEntries) {
      stmts.push(
        env.DB.prepare(
          `INSERT INTO lab_configuracoes (tenant_id, chave, valor)
           VALUES (?, ?, ?)
           ON CONFLICT(tenant_id, chave) DO UPDATE SET valor = excluded.valor`
        ).bind(tid, chave, valor)
      );
    }

    if (stmts.length > 0) await env.DB.batch(stmts);

    // 2. Restaurar preços dos produtos (se solicitado)
    let updated = 0;
    if (body.restore_precos) {
      const updateStmts = SEED.map(item =>
        env.DB.prepare(
          `UPDATE lab_servicos_catalogo
           SET valor_padrao = ?, valor_lista2 = ?
           WHERE tenant_id = ? AND nome = ? AND COALESCE(codigo,'') = ?`
        ).bind(item.p1, item.p2 || null, tid, item.nome, item.codigo)
      );

      for (let i = 0; i < updateStmts.length; i += 100) {
        await env.DB.batch(updateStmts.slice(i, i + 100));
      }
      updated = SEED.length;
    }

    return json({ ok: true, config_restored: configEntries.length, products_updated: updated });
  } catch (err) {
    return json({ error: 'Erro interno', detail: String(err) }, 500);
  }
};
