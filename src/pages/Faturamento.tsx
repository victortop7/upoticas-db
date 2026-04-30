import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

interface Fatura {
  id: string; numero: number; cliente_id: string; cliente_nome: string;
  situacao: string; valor_total: number; data_vencimento?: string;
  data_pagamento?: string; forma_pagamento?: string; observacao?: string;
  total_itens: number; created_at: string;
}
interface Resumo { a_receber: number; recebido: number; vencido: number; qtd_abertas: number; qtd_vencidas: number; }
interface Pendente { id: string; numero: number; valor_final: number; forma_pagamento?: string; created_at: string; cliente_id: string; cliente_nome: string; }

const SIT_COLOR: Record<string, string> = { aberta: 'var(--accent)', paga: 'var(--green)', vencida: 'var(--red)', cancelada: 'var(--text-muted)' };
const SIT_LABEL: Record<string, string> = { aberta: 'Aberta', paga: 'Paga', vencida: 'Vencida', cancelada: 'Cancelada' };
const FORMAS = ['Dinheiro', 'Pix', 'Boleto', 'Transferência', 'Cheque', 'Crédito', 'Débito'];

function brl(v: number) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(s?: string) { if (!s) return '—'; const [y, m, d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; }

export default function Faturamento() {
  const [aba, setAba] = useState<'faturas' | 'pendentes'>('faturas');
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroSit, setFiltroSit] = useState('');

  // Modal nova fatura
  const [modalNova, setModalNova] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [novaForm, setNovaForm] = useState({ data_vencimento: '', forma_pagamento: '', observacao: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  // Modal baixa
  const [modalBaixa, setModalBaixa] = useState(false);
  const [faturaSel, setFaturaSel] = useState<Fatura | null>(null);
  const [baixaForm, setBaixaForm] = useState({ data_pagamento: '', forma_pagamento: '' });

  const loadFaturas = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filtroSit) p.set('situacao', filtroSit);
    api.get<{ faturas: Fatura[]; resumo: Resumo }>(`/faturamento?${p}`)
      .then(d => { setFaturas(d.faturas); setResumo(d.resumo); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [filtroSit]);

  const loadPendentes = useCallback(() => {
    setLoading(true);
    api.get<Pendente[]>('/faturamento/pendentes')
      .then(setPendentes).catch(() => setPendentes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (aba === 'faturas') loadFaturas();
    else loadPendentes();
  }, [aba, loadFaturas, loadPendentes]);

  async function criarFatura(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionados.length) { setErro('Selecione ao menos uma venda'); return; }
    setSaving(true); setErro('');
    const itensSel = pendentes.filter(p => selecionados.includes(p.id));
    if (!itensSel.length) { setSaving(false); return; }
    try {
      await api.post('/faturamento', {
        cliente_id: itensSel[0].cliente_id,
        data_vencimento: novaForm.data_vencimento || null,
        forma_pagamento: novaForm.forma_pagamento || null,
        observacao: novaForm.observacao || null,
        itens: itensSel.map(p => ({ venda_id: p.id, descricao: `Venda #${String(p.numero).padStart(4, '0')}`, valor: p.valor_final })),
      });
      setModalNova(false); setSelecionados([]); setNovaForm({ data_vencimento: '', forma_pagamento: '', observacao: '' });
      setAba('faturas'); loadFaturas();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao criar fatura'); }
    setSaving(false);
  }

  async function darBaixa(e: React.FormEvent) {
    e.preventDefault();
    if (!faturaSel) return;
    setSaving(true);
    try {
      await api.patch(`/faturamento/${faturaSel.id}`, { situacao: 'paga', data_pagamento: baixaForm.data_pagamento || null, forma_pagamento: baixaForm.forma_pagamento || null });
      setModalBaixa(false); loadFaturas();
    } catch {}
    setSaving(false);
  }

  async function cancelar(id: string, numero: number) {
    if (!confirm(`Cancelar fatura #${String(numero).padStart(4, '0')}?`)) return;
    await api.delete(`/faturamento/${id}`); loadFaturas();
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Faturamento</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>Gerencie faturas e cobranças por cliente</p>
        </div>
        {aba === 'pendentes' && pendentes.length > 0 && (
          <button onClick={() => { setSelecionados([]); setErro(''); setModalNova(true); }}
            style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Gerar Fatura
          </button>
        )}
      </div>

      {/* KPIs */}
      {resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'A Receber', value: brl(resumo.a_receber), color: 'var(--accent)' },
            { label: 'Recebido', value: brl(resumo.recebido), color: 'var(--green)' },
            { label: 'Vencido', value: brl(resumo.vencido), color: 'var(--red)' },
            { label: 'Faturas Abertas', value: resumo.qtd_abertas, color: resumo.qtd_vencidas > 0 ? 'var(--amber)' : 'var(--text)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {(['faturas', 'pendentes'] as const).map(t => (
          <button key={t} onClick={() => setAba(t)} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: aba === t ? '600' : '400', background: aba === t ? 'var(--surface-alt)' : 'transparent', color: aba === t ? 'var(--text)' : 'var(--text-muted)', border: aba === t ? '1px solid var(--border-light)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t === 'faturas' ? 'Faturas' : `A Faturar${pendentes.length > 0 ? ` (${pendentes.length})` : ''}`}
          </button>
        ))}
        {aba === 'faturas' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            {[{ v: '', l: 'Todas' }, { v: 'aberta', l: 'Abertas' }, { v: 'paga', l: 'Pagas' }, { v: 'vencida', l: 'Vencidas' }].map(s => (
              <button key={s.v} onClick={() => setFiltroSit(s.v)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: filtroSit === s.v ? '600' : '400', background: filtroSit === s.v ? 'var(--surface-alt)' : 'transparent', color: filtroSit === s.v ? 'var(--text)' : 'var(--text-muted)', border: filtroSit === s.v ? '1px solid var(--border-light)' : '1px solid transparent' }}>
                {s.l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TABELA FATURAS */}
      {aba === 'faturas' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          {loading ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
            : faturas.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma fatura encontrada.</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nº', 'Cliente', 'Itens', 'Total', 'Vencimento', 'Pagamento', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {faturas.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>#{String(f.numero).padStart(4, '0')}</td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', color: 'var(--text)' }}>{f.cliente_nome}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>{f.total_itens}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{brl(f.valor_total)}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{fmtDate(f.data_vencimento)}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--green)' }}>{fmtDate(f.data_pagamento)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: SIT_COLOR[f.situacao], background: `${SIT_COLOR[f.situacao]}18`, padding: '3px 8px', borderRadius: '20px' }}>
                          {SIT_LABEL[f.situacao]}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {f.situacao === 'aberta' || f.situacao === 'vencida' ? (
                          <button onClick={() => { setFaturaSel(f); setBaixaForm({ data_pagamento: new Date().toISOString().split('T')[0], forma_pagamento: f.forma_pagamento || '' }); setModalBaixa(true); }}
                            style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px', background: 'var(--green-dim)', color: 'var(--green)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                            Dar Baixa
                          </button>
                        ) : null}
                        {f.situacao !== 'cancelada' && f.situacao !== 'paga' && (
                          <button onClick={() => cancelar(f.id, f.numero)}
                            style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* TABELA PENDENTES */}
      {aba === 'pendentes' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          {loading ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
            : pendentes.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma venda pendente de faturamento.</div>
            : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Selecione as vendas do <strong>mesmo cliente</strong> para gerar uma fatura.
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 14px', width: '40px' }}></th>
                      {['Venda', 'Cliente', 'Valor', 'Pagamento', 'Data'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendentes.map(p => {
                      const checked = selecionados.includes(p.id);
                      const clienteSel = selecionados.length > 0 ? pendentes.find(x => selecionados.includes(x.id))?.cliente_id : null;
                      const disabled = clienteSel != null && p.cliente_id !== clienteSel;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', opacity: disabled ? 0.4 : 1, background: checked ? 'var(--accent-dim)' : 'transparent' }}>
                          <td style={{ padding: '11px 14px' }}>
                            <input type="checkbox" checked={checked} disabled={disabled}
                              onChange={() => setSelecionados(s => checked ? s.filter(x => x !== p.id) : [...s, p.id])} />
                          </td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>#{String(p.numero).padStart(4, '0')}</td>
                          <td style={{ padding: '11px 14px', fontSize: '13px', color: 'var(--text)' }}>{p.cliente_nome}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>{brl(p.valor_final)}</td>
                          <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-dim)' }}>{p.forma_pagamento || '—'}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{fmtDate(p.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {selecionados.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                      {selecionados.length} venda(s) selecionada(s) · Total: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{brl(pendentes.filter(p => selecionados.includes(p.id)).reduce((s, p) => s + p.valor_final, 0))}</strong>
                    </span>
                    <button onClick={() => { setErro(''); setModalNova(true); }}
                      style={{ padding: '9px 20px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Gerar Fatura →
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      )}

      {/* Modal Nova Fatura */}
      {modalNova && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Gerar Fatura</h2>
              <button onClick={() => setModalNova(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ background: 'var(--surface-alt)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-dim)' }}>
              {selecionados.length} venda(s) · Total: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                {brl(pendentes.filter(p => selecionados.includes(p.id)).reduce((s, p) => s + p.valor_final, 0))}
              </strong>
            </div>
            {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}
            <form onSubmit={criarFatura} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Data de Vencimento</label>
                <input type="date" value={novaForm.data_vencimento} onChange={e => setNovaForm(f => ({ ...f, data_vencimento: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Forma de Pagamento</label>
                <select value={novaForm.forma_pagamento} onChange={e => setNovaForm(f => ({ ...f, forma_pagamento: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>
                  <option value="">—</option>
                  {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Observação</label>
                <input value={novaForm.observacao} onChange={e => setNovaForm(f => ({ ...f, observacao: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalNova(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Gerando...' : 'Gerar Fatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dar Baixa */}
      {modalBaixa && faturaSel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Dar Baixa</h2>
              <button onClick={() => setModalBaixa(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ background: 'var(--surface-alt)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Fatura #{String(faturaSel.numero).padStart(4, '0')} — {faturaSel.cliente_nome}</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: '800', marginTop: '4px' }}>{brl(faturaSel.valor_total)}</div>
            </div>
            <form onSubmit={darBaixa} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Data do Pagamento</label>
                <input type="date" required value={baixaForm.data_pagamento} onChange={e => setBaixaForm(f => ({ ...f, data_pagamento: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Forma de Pagamento</label>
                <select value={baixaForm.forma_pagamento} onChange={e => setBaixaForm(f => ({ ...f, forma_pagamento: e.target.value }))} style={{ ...inp, fontFamily: 'inherit' }}>
                  <option value="">—</option>
                  {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModalBaixa(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Salvando...' : '✓ Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
