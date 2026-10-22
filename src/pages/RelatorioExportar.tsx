import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {
  type DadosRel, type ConfigRel, type TabelaRel, type SecaoKey,
  SECOES, COLS_VENDAS, COLS_PAGTOS, COLS_ITENS, CFG_PADRAO,
  montarTabelas, abasDasTabelas, baixarXLSX, gerarCSV, baixar, fmtTela,
} from '../lib/relatorioExport';

const CFG_KEY = 'rel_export_cfg';
const PAYLOAD_KEY = 'rel_export_payload';

function lerCfg(): ConfigRel {
  try {
    const s = localStorage.getItem(CFG_KEY);
    if (s) return { ...CFG_PADRAO(), ...JSON.parse(s), inicio: CFG_PADRAO().inicio, fim: CFG_PADRAO().fim };
  } catch { /* sem storage */ }
  return CFG_PADRAO();
}

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 14 };
const h3: React.CSSProperties = { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '.5px' };
const inp: React.CSSProperties = { padding: '8px 10px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)' };
const chk: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text)', cursor: 'pointer', padding: '5px 0' };
const btn = (cor: string, preenchido = true): React.CSSProperties => ({
  padding: '9px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
  background: preenchido ? cor : 'transparent', color: preenchido ? '#fff' : cor, border: `1px solid ${cor}`,
});

function GrupoColunas({ titulo, defs, sel, onChange }: { titulo: string; defs: { key: string; label: string }[]; sel: string[]; onChange: (v: string[]) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-dim)' }}>{titulo}</span>
        <span style={{ fontSize: 12 }}>
          <button type="button" onClick={() => onChange(defs.map(d => d.key))} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>todas</button>
          ·
          <button type="button" onClick={() => onChange([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>nenhuma</button>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0 12px' }}>
        {defs.map(d => (
          <label key={d.key} style={chk}>
            <input type="checkbox" checked={sel.includes(d.key)}
              onChange={e => onChange(e.target.checked ? [...sel, d.key] : sel.filter(k => k !== d.key))} />
            {d.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function Previa({ t }: { t: TabelaRel }) {
  if (t.kpis) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {t.kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{fmtTela(k.valor, k.fmt)}</div>
          </div>
        ))}
      </div>
    );
  }
  const LIM = 30;
  const alinha = (f: string) => (f === 'brl' || f === 'num' || f === 'int' || f === 'pct') ? 'right' as const : 'left' as const;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead><tr>{t.cols.map(c => (
          <th key={c.label} style={{ textAlign: alinha(c.fmt), padding: '7px 8px', fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)', whiteSpace: 'nowrap' }}>{c.label}</th>
        ))}</tr></thead>
        <tbody>
          {t.linhas.slice(0, LIM).map((l, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              {l.map((v, j) => <td key={j} style={{ padding: '6px 8px', textAlign: alinha(t.cols[j].fmt), fontFamily: alinha(t.cols[j].fmt) === 'right' ? 'var(--mono)' : undefined, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmtTela(v, t.cols[j].fmt)}</td>)}
            </tr>
          ))}
          {t.total && (
            <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
              {t.total.map((v, j) => <td key={j} style={{ padding: '7px 8px', textAlign: alinha(t.cols[j].fmt), fontFamily: 'var(--mono)', color: 'var(--text)', whiteSpace: 'nowrap' }}>{j === 0 ? String(v ?? '') : fmtTela(v, t.cols[j].fmt)}</td>)}
            </tr>
          )}
        </tbody>
      </table>
      {t.linhas.length > LIM && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Prévia mostrando {LIM} de {t.linhas.length} linhas · a exportação sai completa.</div>}
    </div>
  );
}

export default function RelatorioExportar() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'admin';
  const [cfg, setCfg] = useState<ConfigRel>(lerCfg);
  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([]);
  const [dados, setDados] = useState<DadosRel | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isAdmin) api.get<{ usuarios: { id: string; nome: string; ativo: boolean }[] }>('/usuarios')
      .then(r => setVendedores(r.usuarios)).catch(() => {});
  }, [isAdmin]);

  useEffect(() => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch { /* ok */ } }, [cfg]);

  const set = (patch: Partial<ConfigRel>) => { setCfg(c => ({ ...c, ...patch })); setDados(null); };
  const temSecao = (k: SecaoKey) => cfg.secoes.includes(k);
  const toggleSecao = (k: SecaoKey, on: boolean) => set({ secoes: on ? [...cfg.secoes, k] : cfg.secoes.filter(s => s !== k) });

  function atalho(tipo: 'mes' | 'mes_ant' | '30d') {
    const h = new Date(); const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (tipo === 'mes') set({ inicio: iso(new Date(h.getFullYear(), h.getMonth(), 1)), fim: iso(h) });
    if (tipo === 'mes_ant') set({ inicio: iso(new Date(h.getFullYear(), h.getMonth() - 1, 1)), fim: iso(new Date(h.getFullYear(), h.getMonth(), 0)) });
    if (tipo === '30d') { const d = new Date(h); d.setDate(d.getDate() - 29); set({ inicio: iso(d), fim: iso(h) }); }
  }

  async function gerar() {
    if (!cfg.secoes.length) { setErro('Marque pelo menos uma seção.'); return; }
    setLoading(true); setErro('');
    try {
      const q = new URLSearchParams({ inicio: cfg.inicio, fim: cfg.fim, canceladas: cfg.canceladas ? '1' : '0' });
      if (cfg.vendedor) q.set('vendedor', cfg.vendedor);
      setDados(await api.get<DadosRel>(`/relatorios/dados?${q}`));
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao gerar'); }
    setLoading(false);
  }

  const tabelas = dados ? montarTabelas(dados, cfg) : [];
  const nomeBase = `relatorio-vendas_${cfg.inicio}_a_${cfg.fim}`;

  function exportarPDF() {
    if (!dados) return;
    try { localStorage.setItem(PAYLOAD_KEY, JSON.stringify({ cfg, dados })); } catch { alert('Não consegui preparar o PDF (armazenamento do navegador bloqueado).'); return; }
    window.open('/relatorios/exportar/imprimir', '_blank');
  }
  async function exportarXLSX() {
    if (!dados) return;
    await baixarXLSX(abasDasTabelas(tabelas), `${nomeBase}.xlsx`);
  }
  function exportarCSV(qual: 'vendas' | 'pagamentos' | 'itens') {
    if (!dados) return;
    const txt = qual === 'vendas' ? gerarCSV(COLS_VENDAS.filter(c => cfg.colsVendas.includes(c.key)), dados.vendas)
      : qual === 'pagamentos' ? gerarCSV(COLS_PAGTOS.filter(c => cfg.colsPagtos.includes(c.key)), dados.pagamentos)
      : gerarCSV(COLS_ITENS.filter(c => cfg.colsItens.includes(c.key)), dados.itens);
    baixar(txt, `${nomeBase}_${qual}.csv`, 'text/csv;charset=utf-8');
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Relatório personalizado</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-dim)' }}>Escolha o que entra, gere e exporte em PDF, Excel (XLSX) ou CSV.</p>
        </div>
        <Link to="/relatorios" style={{ fontSize: 13.5, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← Voltar aos relatórios</Link>
      </div>

      {/* 1. Período e filtros */}
      <div style={card}>
        <h3 style={h3}>1 · Período e filtros</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" style={inp} value={cfg.inicio} onChange={e => set({ inicio: e.target.value })} />
          <span style={{ color: 'var(--text-muted)' }}>até</span>
          <input type="date" style={inp} value={cfg.fim} onChange={e => set({ fim: e.target.value })} />
          <button type="button" onClick={() => atalho('mes')} style={btn('var(--text-dim)', false)}>Este mês</button>
          <button type="button" onClick={() => atalho('mes_ant')} style={btn('var(--text-dim)', false)}>Mês passado</button>
          <button type="button" onClick={() => atalho('30d')} style={btn('var(--text-dim)', false)}>30 dias</button>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
          {isAdmin && (
            <select style={{ ...inp, fontFamily: 'inherit' }} value={cfg.vendedor} onChange={e => set({ vendedor: e.target.value })}>
              <option value="">Todos os vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          )}
          <label style={chk}><input type="checkbox" checked={cfg.canceladas} onChange={e => set({ canceladas: e.target.checked })} /> Incluir vendas canceladas na lista</label>
        </div>
      </div>

      {/* 2. Seções */}
      <div style={card}>
        <h3 style={h3}>2 · O que entra no relatório</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0 16px' }}>
          {SECOES.map(s => (
            <label key={s.key} style={chk}>
              <input type="checkbox" checked={temSecao(s.key)} onChange={e => toggleSecao(s.key, e.target.checked)} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {/* 3. Colunas */}
      {(temSecao('vendas') || temSecao('pagamentos') || temSecao('itens')) && (
        <div style={card}>
          <h3 style={h3}>3 · Colunas das listas</h3>
          {temSecao('vendas') && <GrupoColunas titulo="Lista de vendas" defs={COLS_VENDAS} sel={cfg.colsVendas} onChange={v => set({ colsVendas: v })} />}
          {temSecao('pagamentos') && <GrupoColunas titulo="Pagamentos" defs={COLS_PAGTOS} sel={cfg.colsPagtos} onChange={v => set({ colsPagtos: v })} />}
          {temSecao('itens') && <GrupoColunas titulo="Itens" defs={COLS_ITENS} sel={cfg.colsItens} onChange={v => set({ colsItens: v })} />}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <button type="button" onClick={gerar} disabled={loading} style={{ ...btn('var(--primary)'), padding: '11px 24px', fontSize: 14.5 }}>
          {loading ? 'Gerando…' : 'Gerar relatório'}
        </button>
        {erro && <span style={{ color: 'var(--red)', fontSize: 13.5 }}>{erro}</span>}
      </div>

      {/* Resultado */}
      {dados && (
        <>
          <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 5 }}>
            <div style={{ fontSize: 13.5, color: 'var(--text-dim)' }}>
              <b style={{ color: 'var(--text)' }}>{dados.vendas.length}</b> vendas · <b style={{ color: 'var(--text)' }}>{dados.pagamentos.length}</b> pagamentos · <b style={{ color: 'var(--text)' }}>{dados.itens.length}</b> itens
              {dados.canceladas.qtd > 0 && <> · <span style={{ color: '#d97706' }}>{dados.canceladas.qtd} cancelada(s): #{dados.canceladas.numeros.join(', #')}</span></>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={exportarPDF} style={btn('#dc2626')}>PDF</button>
              <button type="button" onClick={exportarXLSX} style={btn('#16a34a')}>Excel (XLSX)</button>
              {temSecao('vendas') && <button type="button" onClick={() => exportarCSV('vendas')} style={btn('var(--text-dim)', false)}>CSV vendas</button>}
              {temSecao('pagamentos') && <button type="button" onClick={() => exportarCSV('pagamentos')} style={btn('var(--text-dim)', false)}>CSV pagamentos</button>}
              {temSecao('itens') && <button type="button" onClick={() => exportarCSV('itens')} style={btn('var(--text-dim)', false)}>CSV itens</button>}
            </div>
          </div>

          {tabelas.map(t => (
            <div key={t.key} style={card}>
              <h3 style={h3}>{t.titulo}</h3>
              <Previa t={t} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
