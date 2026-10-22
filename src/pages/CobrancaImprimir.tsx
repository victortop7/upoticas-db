import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

type Titulo = {
  origem: 'carne' | 'venda' | 'manual'; id: string;
  cliente_id: string | null; cliente_nome: string | null; apelido: string | null; cpf: string | null;
  celular: string | null; telefone: string | null; endereco: string | null; bairro: string | null; cidade: string | null; uf: string | null; referencia: string | null;
  venda_numero: number | null; descricao: string; parcela: string | null; vencimento: string; valor: number;
  situacao: string; dias_atraso: number;
};
type Grupo = { chave: string; t0: Titulo; titulos: Titulo[]; total: number; atraso: number };

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtD = (s?: string | null) => { if (!s) return ''; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const SIT: Record<string, string> = { aberto: 'Em aberto', vencido: 'Atrasados', pendente: 'A vencer', recebido: 'Recebidos', todos: 'Todos' };

const CSS = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cb { font-family: 'Segoe UI', system-ui, sans-serif; color: #111; font-size: 11px; }
  .cb .num { font-variant-numeric: tabular-nums; font-family: ui-monospace, Consolas, monospace; }
  .cb .hdr { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
  .cb h1 { margin: 0; font-size: 18px; }
  .cb .cli { border: 1.5px solid #333; border-radius: 6px; margin-bottom: 9px; break-inside: avoid; page-break-inside: avoid; }
  .cb .top { display: flex; justify-content: space-between; gap: 10px; padding: 7px 10px; background: #f1f1f1; border-bottom: 1px solid #999; border-radius: 5px 5px 0 0; }
  .cb .nome { font-size: 13px; font-weight: 800; }
  .cb .end { padding: 6px 10px; line-height: 1.5; border-bottom: 1px dashed #bbb; }
  .cb table { width: 100%; border-collapse: collapse; }
  .cb th { font-size: 9px; text-transform: uppercase; color: #555; text-align: left; padding: 3px 10px; border-bottom: 1px solid #ccc; }
  .cb td { padding: 3px 10px; border-bottom: 1px solid #eee; }
  .cb .r { text-align: right; }
  .cb .atr { color: #b91c1c; font-weight: 700; }
  .cb .anot { display: grid; grid-template-columns: 1.1fr 0.9fr 1.6fr; gap: 10px; padding: 8px 10px 9px; }
  .cb .anot div { border-bottom: 1px solid #555; padding-top: 14px; font-size: 9px; color: #555; }
  @media print { .no-print { display: none !important; } body { background: #fff !important; } .folha { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; } }
  @page { size: A4 portrait; margin: 9mm; }
`;

export default function CobrancaImprimir() {
  const { tenant } = useAuth();
  const qs = typeof window !== 'undefined' ? window.location.search : '';
  const filtros = useMemo(() => Object.fromEntries(new URLSearchParams(qs)), [qs]);
  const [titulos, setTitulos] = useState<Titulo[] | null>(null);
  const [erro, setErro] = useState('');
  const [ordem, setOrdem] = useState<'rota' | 'nome' | 'atraso'>('rota');

  useEffect(() => {
    document.title = 'Relatório do cobrador';
    api.get<{ titulos: Titulo[] }>(`/financeiro/receber${qs}`)
      .then(r => setTitulos(r.titulos.filter(t => t.situacao !== 'recebido')))
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar'));
  }, [qs]);

  const grupos = useMemo(() => {
    const m = new Map<string, Grupo>();
    for (const t of titulos || []) {
      const k = t.cliente_id || `sem-${t.id}`;
      const g = m.get(k) || { chave: k, t0: t, titulos: [], total: 0, atraso: 0 };
      g.titulos.push(t); g.total += t.valor; g.atraso = Math.max(g.atraso, t.dias_atraso);
      m.set(k, g);
    }
    const lista = [...m.values()];
    const s = (v?: string | null) => (v || '').toLowerCase();
    if (ordem === 'rota') lista.sort((a, b) => s(a.t0.cidade).localeCompare(s(b.t0.cidade)) || s(a.t0.bairro).localeCompare(s(b.t0.bairro)) || s(a.t0.endereco).localeCompare(s(b.t0.endereco)));
    if (ordem === 'nome') lista.sort((a, b) => s(a.t0.cliente_nome).localeCompare(s(b.t0.cliente_nome)));
    if (ordem === 'atraso') lista.sort((a, b) => b.atraso - a.atraso || b.total - a.total);
    return lista;
  }, [titulos, ordem]);

  const total = grupos.reduce((s, g) => s + g.total, 0);
  const desc = [
    SIT[filtros.situacao || 'aberto'],
    filtros.inicio || filtros.fim ? `venc. ${fmtD(filtros.inicio) || '…'} a ${fmtD(filtros.fim) || '…'}` : '',
    filtros.bairro ? `bairro: ${filtros.bairro}` : '', filtros.cidade ? `cidade: ${filtros.cidade}` : '',
    filtros.endereco ? `rua: ${filtros.endereco}` : '', filtros.q ? `busca: ${filtros.q}` : '',
  ].filter(Boolean).join(' · ');
  let bairroAnt = '';

  return (
    <div style={{ background: '#e5e7eb', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <div className="no-print" style={{ position: 'sticky', top: 0, background: '#111827', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, fontFamily: 'system-ui', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Relatório do cobrador</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>Ordem:</span>
          {([['rota', 'Rota (bairro/rua)'], ['nome', 'Nome'], ['atraso', 'Mais atrasado']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setOrdem(v)} style={{ padding: '6px 11px', fontSize: 12.5, borderRadius: 6, border: '1px solid #374151', cursor: 'pointer', background: ordem === v ? '#374151' : 'transparent', color: '#fff' }}>{l}</button>
          ))}
          <button onClick={() => window.print()} style={{ marginLeft: 6, padding: '8px 18px', fontSize: 13.5, fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Imprimir</button>
        </div>
      </div>

      <div className="cb folha" style={{ background: '#fff', maxWidth: 794, margin: '20px auto', padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}>
        <div className="hdr">
          <div>
            <h1>Cobrança · {tenant?.nome || ''}</h1>
            <div style={{ color: '#555', marginTop: 2 }}>{desc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 16, fontWeight: 800 }}>{brl(total)}</div>
            <div style={{ color: '#555' }}>{grupos.length} cliente{grupos.length === 1 ? '' : 's'} · emitido {new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        {erro && <div style={{ color: '#b91c1c' }}>{erro}</div>}
        {!titulos && !erro && <div>Carregando…</div>}
        {titulos && !grupos.length && <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>Nenhum título em aberto com esses filtros.</div>}

        {grupos.map(g => {
          const c = g.t0;
          const bairro = `${c.cidade || ''}|${c.bairro || ''}`;
          const novoBairro = ordem === 'rota' && bairro !== bairroAnt;
          bairroAnt = bairro;
          return (
            <div key={g.chave}>
              {novoBairro && <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', margin: '10px 0 4px', color: '#333' }}>{c.bairro || 'Sem bairro'}{c.cidade ? ` · ${c.cidade}` : ''}</div>}
              <div className="cli">
                <div className="top">
                  <div>
                    <div className="nome">{c.cliente_nome || '-'}{c.apelido ? <span style={{ fontWeight: 400, color: '#555' }}> ({c.apelido})</span> : null}</div>
                    <div style={{ color: '#444' }}>{c.cpf ? `CPF ${c.cpf}` : ''}{c.celular ? `  ·  ${c.celular}` : ''}{c.telefone && c.telefone !== c.celular ? `  ·  ${c.telefone}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 14, fontWeight: 800 }}>{brl(g.total)}</div>
                    {g.atraso > 0 && <div className="atr">{g.atraso} dia{g.atraso > 1 ? 's' : ''} de atraso</div>}
                  </div>
                </div>
                <div className="end">
                  <b>Endereço:</b> {c.endereco || '-'}{c.bairro ? `, ${c.bairro}` : ''}{c.cidade ? ` · ${c.cidade}${c.uf ? '/' + c.uf : ''}` : ''}
                  {c.referencia && <><br /><b>Referência:</b> {c.referencia}</>}
                </div>
                <table>
                  <thead><tr><th>Referente</th><th>Parcela</th><th>Vencimento</th><th>Atraso</th><th className="r">Valor</th></tr></thead>
                  <tbody>
                    {g.titulos.map(t => (
                      <tr key={t.origem + t.id}>
                        <td>{t.venda_numero ? `Venda #${t.venda_numero}` : t.descricao}{t.origem === 'venda' ? ' (saldo)' : ''}</td>
                        <td className="num">{t.parcela || '-'}</td>
                        <td className="num">{fmtD(t.vencimento)}</td>
                        <td className={t.dias_atraso ? 'atr' : ''}>{t.dias_atraso ? `${t.dias_atraso}d` : 'a vencer'}</td>
                        <td className="r num">{brl(t.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="anot"><div>Valor recebido R$</div><div>Data</div><div>Assinatura / observação</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
