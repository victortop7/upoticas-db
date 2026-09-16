import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Cliente } from '../types';

interface CarneRow {
  id: string; descricao: string; valor_total: number; num_parcelas: number;
  forma_pagamento: string; created_at: string; cliente_nome?: string;
  parcelas_pagas: number; saldo: number;
}
interface Parcela {
  id: string; numero: number; valor: number; vencimento: string;
  status: string; pix_copia_cola: string; txid: string; pago_em?: string;
}
interface CarneDetalhe {
  carne: { id: string; descricao: string; valor_total: number; num_parcelas: number; cliente_id?: string };
  parcelas: Parcela[];
  cliente: { nome: string; celular?: string; telefone?: string } | null;
}

const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (s?: string) => { if (!s) return '—'; const [y, m, d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; };

const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', fontSize: '14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' };

// ─── Modal: novo carnê ───────────────────────────────────────────────────────
function NovoCarne({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const hoje = new Date();
  const prox = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30).toISOString().split('T')[0];
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [primeiroVenc, setPrimeiroVenc] = useState(prox);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const p = new URLSearchParams({ page: '1' }); if (busca) p.set('busca', busca);
    api.get<{ clientes: Cliente[] }>(`/clientes?${p}`).then(r => setClientes(r.clientes)).catch(() => {});
  }, [busca]);

  const totalNum = parseFloat(valor.replace(',', '.')) || 0;
  const numP = Math.max(1, parseInt(parcelas) || 1);
  const valorParcela = totalNum / numP;

  async function salvar() {
    if (totalNum <= 0) { setErro('Informe o valor total'); return; }
    if (!clienteId) { setErro('Selecione o cliente'); return; }
    setSaving(true); setErro('');
    try {
      await api.post('/carnes', {
        cliente_id: clienteId, descricao: descricao || `Carnê ${numP}x`,
        valor_total: totalNum, num_parcelas: numP, primeiro_vencimento: primeiroVenc, forma_pagamento: 'boleto',
      });
      onSaved();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '480px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Novo Carnê</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Cliente *</label>
            {clienteId ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '9px 12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>✓ {clienteNome}</span>
                <button onClick={() => { setClienteId(''); setClienteNome(''); }} style={{ fontSize: 12, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>trocar</button>
              </div>
            ) : (
              <>
                <input style={inp} placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
                {clientes.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginTop: 6, maxHeight: 150, overflowY: 'auto' }}>
                    {clientes.map((c, i) => (
                      <div key={c.id} onClick={() => { setClienteId(c.id); setClienteNome(c.nome); }}
                        style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 14, borderBottom: i < clientes.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{c.nome}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Descrição</label>
            <input style={inp} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Óculos de grau — armação + lentes" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Valor total (R$) *</label>
              <input style={{ ...inp, fontFamily: 'var(--mono)', textAlign: 'right' }} inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label style={lbl}>Nº de parcelas</label>
              <input type="number" min={1} max={48} style={{ ...inp, fontFamily: 'var(--mono)', textAlign: 'center' }} value={parcelas} onChange={e => setParcelas(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>1º vencimento</label>
            <input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={primeiroVenc} onChange={e => setPrimeiroVenc(e.target.value)} />
          </div>

          {totalNum > 0 && (
            <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{numP}x de</span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--primary)' }}>{brl(valorParcela)}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          {erro && <span style={{ fontSize: 13, color: 'var(--red)', flex: 1 }}>{erro}</span>}
          <button onClick={onClose} style={{ padding: '9px 18px', fontSize: 14, background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ padding: '9px 22px', fontSize: 14, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? 'Gerando...' : 'Gerar carnê'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: detalhe (parcelas + marcar pago + imprimir) ──────────────────────
function CarneDetalheModal({ id, onClose, onChange }: { id: string; onClose: () => void; onChange: () => void }) {
  const [det, setDet] = useState<CarneDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get<CarneDetalhe>(`/carnes/${id}`).then(setDet).catch(() => setDet(null)).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function toggle(p: Parcela) {
    const novo = p.status === 'pago' ? 'pendente' : 'pago';
    try { await api.post('/carnes/parcela', { parcela_id: p.id, status: novo }); load(); onChange(); } catch {}
  }

  const pagas = det?.parcelas.filter(p => p.status === 'pago').length || 0;
  const saldo = det?.parcelas.filter(p => p.status !== 'pago').reduce((a, p) => a + p.valor, 0) || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '620px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{det?.cliente?.nome || 'Carnê'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{det?.carne.descricao} · {pagas}/{det?.carne.num_parcelas} pagas · falta {brl(saldo)}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <a href={`/carnes/${id}/imprimir`} target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', textDecoration: 'none' }}>
            🖨️ Imprimir / PDF do carnê
          </a>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</div>
            : !det ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Erro ao carregar.</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Parcela', 'Vencimento', 'Valor', 'Situação', ''].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Valor' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)', position: 'sticky', top: 0 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {det.parcelas.map((p, i) => {
                    const pago = p.status === 'pago';
                    return (
                      <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.numero}/{det.carne.num_parcelas}</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-dim)' }}>{fmtData(p.vencimento)}</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{brl(p.valor)}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pago ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.14)', color: pago ? '#16a34a' : '#d97706' }}>{pago ? '✓ Pago' : 'Pendente'}</span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <button onClick={() => toggle(p)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: pago ? 'var(--surface-alt)' : 'rgba(34,197,94,0.12)', color: pago ? 'var(--text-dim)' : '#16a34a', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer' }}>
                            {pago ? 'Desfazer' : 'Marcar pago'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function Carnes() {
  const [lista, setLista] = useState<CarneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoOpen, setNovoOpen] = useState(false);
  const [detId, setDetId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<CarneRow[]>('/carnes').then(setLista).catch(() => setLista([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function excluir(id: string) {
    if (!confirm('Excluir este carnê e todas as parcelas?')) return;
    try { await api.delete(`/carnes/${id}`); load(); } catch {}
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Carnês / Boletos</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-dim)' }}>{lista.length} carnê(s) · parcelas com Pix pra enviar/imprimir</p>
        </div>
        <button onClick={() => setNovoOpen(true)} style={{ padding: '9px 18px', fontSize: 14, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Novo Carnê</button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Cliente', 'Descrição', 'Total', 'Parcelas', 'Falta', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Total' || h === 'Falta' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando…</td></tr>
              ) : lista.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum carnê ainda. Clique em “+ Novo Carnê”.</td></tr>
              ) : lista.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < lista.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onClick={() => setDetId(c.id)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{c.cliente_nome || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-dim)' }}>{c.descricao}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--text)' }}>{brl(c.valor_total)}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-dim)' }}>{c.parcelas_pagas}/{c.num_parcelas} pagas</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, textAlign: 'right', color: c.saldo > 0 ? '#d97706' : '#16a34a' }}>{c.saldo > 0 ? brl(c.saldo) : '✓ quitado'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <a href={`/carnes/${c.id}/imprimir`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ padding: '5px 10px', fontSize: 12, marginRight: 6, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>🖨️ PDF</a>
                    <button onClick={e => { e.stopPropagation(); excluir(c.id); }} style={{ padding: '5px 10px', fontSize: 12, background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {novoOpen && <NovoCarne onClose={() => setNovoOpen(false)} onSaved={() => { setNovoOpen(false); load(); }} />}
      {detId && <CarneDetalheModal id={detId} onClose={() => setDetId(null)} onChange={load} />}
    </div>
  );
}
