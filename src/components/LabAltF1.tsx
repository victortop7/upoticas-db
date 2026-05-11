import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

type Categoria = {
  key: string; label: string; shortcut: string;
  endpoint: string; colunas: { label: string; field: string; mono?: boolean }[];
};

const CATEGORIAS: Categoria[] = [
  {
    key: 'oticas_nome', label: 'ÓTICAS/NOME', shortcut: 'C',
    endpoint: '/lab/oticas',
    colunas: [
      { label: 'CÓDIGO', field: 'codigo', mono: true },
      { label: 'NOME', field: 'nome' },
      { label: 'NOME REDUZIDO', field: 'nome_reduzido' },
      { label: 'CNPJ', field: 'cnpj', mono: true },
      { label: 'UF', field: 'uf' },
    ],
  },
  {
    key: 'oticas_reduzido', label: 'ÓTICAS/REDUZIDO', shortcut: 'R',
    endpoint: '/lab/oticas',
    colunas: [
      { label: 'CÓDIGO', field: 'codigo', mono: true },
      { label: 'NOME REDUZIDO', field: 'nome_reduzido' },
      { label: 'NOME', field: 'nome' },
      { label: 'UF', field: 'uf' },
    ],
  },
  {
    key: 'oticas_cnpj', label: 'ÓTICAS/CNPJ', shortcut: 'J',
    endpoint: '/lab/oticas',
    colunas: [
      { label: 'CÓDIGO', field: 'codigo', mono: true },
      { label: 'CNPJ', field: 'cnpj', mono: true },
      { label: 'NOME', field: 'nome' },
    ],
  },
  {
    key: 'fornecedores_nome', label: 'FORNECEDORES/NOME', shortcut: 'F',
    endpoint: '/lab/fornecedores',
    colunas: [
      { label: 'CÓDIGO', field: 'codigo', mono: true },
      { label: 'NOME', field: 'nome' },
      { label: 'CNPJ', field: 'cnpj', mono: true },
      { label: 'UF', field: 'uf' },
    ],
  },
  {
    key: 'vendedores_nome', label: 'VENDEDORES/NOME', shortcut: 'V',
    endpoint: '/lab/vendedores',
    colunas: [
      { label: 'CÓDIGO', field: 'codigo', mono: true },
      { label: 'NOME', field: 'nome' },
      { label: 'COMISSÃO', field: 'comissao', mono: true },
    ],
  },
  {
    key: 'servicos_codigo', label: 'PRODUTO/CÓDIGO', shortcut: '7',
    endpoint: '/lab/servicos',
    colunas: [
      { label: 'CÓDIGO',    field: 'codigo',        mono: true },
      { label: 'DESCRIÇÃO', field: 'nome' },
      { label: 'UN',        field: 'unidade',       mono: true },
      { label: 'PREÇO 1',   field: 'valor_padrao',  mono: true },
      { label: 'PREÇO 2',   field: 'valor_lista2',  mono: true },
    ],
  },
  {
    key: 'servicos_desc', label: 'PRODUTO/DESCRIÇÃO', shortcut: 'D',
    endpoint: '/lab/servicos',
    colunas: [
      { label: 'CÓDIGO',    field: 'codigo',        mono: true },
      { label: 'DESCRIÇÃO', field: 'nome' },
      { label: 'UN',        field: 'unidade',       mono: true },
      { label: 'PREÇO 1',   field: 'valor_padrao',  mono: true },
      { label: 'PREÇO 2',   field: 'valor_lista2',  mono: true },
    ],
  },
];

interface Props { onClose: () => void; }

export default function LabAltF1({ onClose }: Props) {
  const [cat, setCat] = useState(CATEGORIAS[0]);
  const [busca, setBusca] = useState('');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [rowIdx, setRowIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const buscar = useCallback((q: string, categoria: Categoria) => {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    api.get<Record<string, unknown>[]>(`${categoria.endpoint}${params}`)
      .then(r => { setRows(Array.isArray(r) ? r : []); setRowIdx(0); })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { buscar('', cat); }, [cat, buscar]);
  useEffect(() => {
    const t = setTimeout(() => buscar(busca, cat), 200);
    return () => clearTimeout(t);
  }, [busca, cat, buscar]);

  useEffect(() => { inputRef.current?.focus(); }, [cat]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { setRowIdx(i => Math.min(i + 1, rows.length - 1)); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setRowIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === 'Enter' && rows[rowIdx]) { selectRow(rows[rowIdx]); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, rowIdx, onClose]);

  // Scroll selected row into view
  useEffect(() => {
    const tr = tbodyRef.current?.children[rowIdx] as HTMLElement | undefined;
    tr?.scrollIntoView({ block: 'nearest' });
  }, [rowIdx]);

  function selectRow(row: Record<string, unknown>) {
    setSelected(row);
    const code = String(row.codigo || row.id || '');
    if (code) {
      navigator.clipboard.writeText(code).catch(() => {});
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  const bg = '#1a1a2e'; const panel = '#16213e'; const accent = '#880000';
  const colCat: React.CSSProperties = { padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontFamily: "'Courier New', monospace", fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2a3e', whiteSpace: 'nowrap' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ background: bg, border: '2px solid #3a3a6e', borderRadius: '4px', width: '90vw', maxWidth: '1100px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

        {/* Título */}
        <div style={{ background: accent, padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontFamily: "'Courier New', monospace", fontWeight: '700', fontSize: '13px', letterSpacing: '1px' }}>
            🔍 PESQUISA — ALT+F1
          </span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #ff6666', color: '#ff9999', padding: '1px 8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', borderRadius: '2px' }}>ESC</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Categorias */}
          <div style={{ background: panel, width: '200px', flexShrink: 0, borderRight: '1px solid #2a2a4e', overflowY: 'auto' }}>
            {CATEGORIAS.map(c => (
              <div key={c.key} onClick={() => { setCat(c); setBusca(''); }}
                style={{ ...colCat, background: cat.key === c.key ? accent : 'transparent', color: cat.key === c.key ? '#fff' : '#aaaacc' }}>
                <span>{c.label}</span>
                <span style={{ background: cat.key === c.key ? 'rgba(255,255,255,0.2)' : '#2a2a4e', padding: '1px 5px', borderRadius: '2px', fontSize: '10px' }}>{c.shortcut}</span>
              </div>
            ))}
          </div>

          {/* Conteúdo */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Resultado selecionado */}
            {selected && (
              <div style={{ background: '#0a2a0a', border: '1px solid #2a6a2a', padding: '8px 14px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#88aa88', fontFamily: "'Courier New', monospace", textTransform: 'uppercase' }}>Selecionado</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#44ff44', fontFamily: "'Courier New', monospace" }}>
                    {String(selected.codigo || selected.id || '—')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#ccffcc', fontWeight: '700' }}>{String(selected.nome || '—')}</div>
                  {selected.nome_reduzido ? <div style={{ fontSize: '11px', color: '#88aa88' }}>{String(selected.nome_reduzido)}</div> : null}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '11px', color: copiado ? '#44ff44' : '#88aa88', fontFamily: "'Courier New', monospace" }}>
                  {copiado ? '✓ CÓDIGO COPIADO!' : 'Clique para copiar'}
                </div>
              </div>
            )}

            {/* Tabela de resultados */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6666aa', fontFamily: "'Courier New', monospace" }}>Buscando...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr style={{ background: accent }}>
                      {cat.colunas.map(col => (
                        <th key={col.field} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#ffcccc', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody ref={tbodyRef}>
                    {rows.length === 0 ? (
                      <tr><td colSpan={cat.colunas.length} style={{ padding: '30px', textAlign: 'center', color: '#4444aa', fontFamily: "'Courier New', monospace" }}>Nenhum resultado</td></tr>
                    ) : rows.map((row, i) => (
                      <tr key={i}
                        onClick={() => { selectRow(row); setRowIdx(i); }}
                        style={{ background: i === rowIdx ? '#880000' : i % 2 === 0 ? '#0e0e1e' : '#131325', cursor: 'pointer', borderBottom: '1px solid #1a1a2e' }}>
                        {cat.colunas.map(col => {
                          const val = row[col.field];
                          let display = '';
                          if (val != null && val !== '' && val !== 0) {
                            if ((col.field === 'valor_padrao' || col.field === 'valor_lista2') && Number(val) > 0) {
                              display = Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            } else {
                              display = String(val);
                            }
                          }
                          return (
                            <td key={col.field} style={{ padding: '5px 10px', fontSize: '12px', color: i === rowIdx ? '#fff' : (col.field.includes('preco') || col.field.includes('valor') ? '#aaffaa' : '#ccccee'), fontFamily: col.mono ? "'Courier New', monospace" : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', textAlign: col.field.includes('valor') ? 'right' : 'left' }}>
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Barra de busca — "DÍGITOS DESEJADOS" */}
            <div style={{ background: '#0a0a1a', borderTop: '2px solid #2a2a5e', padding: '8px 14px' }}>
              <div style={{ fontSize: '10px', color: '#6666aa', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Dígitos Desejados — {rows.length} resultado(s)
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Digite para filtrar... (↑↓ navegar, Enter selecionar)"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '13px', background: '#1a1a3e', border: '1px solid #4444aa', borderRadius: '2px', color: '#ddddff', outline: 'none', fontFamily: "'Courier New', monospace" }}
                />
                <div style={{ fontSize: '10px', color: '#6666aa', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap' }}>
                  ↑↓ Nav &nbsp; Enter Sel &nbsp; Esc Fechar
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
