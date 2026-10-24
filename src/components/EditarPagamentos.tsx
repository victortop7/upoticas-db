import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Icone from './Icone';

// Editar o que o cliente já pagou de UMA venda (só aquela compra muda).
// Abre direto numa venda (vendaId) ou, a partir do cliente (clienteId), mostra as compras pra escolher qual.

interface Venda { id: string; numero: number; created_at: string; valor_final: number; valor_entrada: number; saldo_restante: number; situacao: string; cliente_nome?: string | null }
interface Linha { forma: string; valor: string; data_recebimento: string; bandeira?: string | null; parcelas?: string | number | null; conta?: string | null }
interface VendaCli { id: string; numero: number; created_at: string; valor_final: number; saldo_restante: number; situacao: string; itens?: string | null }

const FORMAS = [
  { v: 'dinheiro', l: 'Dinheiro' }, { v: 'pix', l: 'Pix' }, { v: 'credito', l: 'Crédito' },
  { v: 'debito', l: 'Débito' }, { v: 'outro', l: 'Outro' },
];
const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtD = (s?: string | null) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '');
const hoje = () => new Date().toISOString().slice(0, 10);
const num = (s: string) => parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;

export default function EditarPagamentos({ vendaId, clienteId, onClose, onSaved }: { vendaId?: string | null; clienteId?: string | null; onClose: () => void; onSaved: () => void }) {
  const [escolhida, setEscolhida] = useState<string | null>(vendaId || null);
  const [compras, setCompras] = useState<VendaCli[] | null>(null);
  const [venda, setVenda] = useState<Venda | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [boletos, setBoletos] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // a partir do cliente: lista as compras (em aberto primeiro)
  useEffect(() => {
    if (vendaId || !clienteId) return;
    api.get<{ vendas: VendaCli[] }>(`/clientes/${clienteId}/perfil`).then(r => {
      const vs = (r.vendas || []).filter(v => v.situacao !== 'cancelada');
      vs.sort((a, b) => Number(b.saldo_restante > 0.009) - Number(a.saldo_restante > 0.009) || String(b.created_at).localeCompare(String(a.created_at)));
      setCompras(vs);
      const abertas = vs.filter(v => v.saldo_restante > 0.009);
      if (abertas.length === 1) setEscolhida(abertas[0].id);
    }).catch(e => setErro(e instanceof Error ? e.message : 'Erro'));
  }, [vendaId, clienteId]);

  useEffect(() => {
    if (!escolhida) return;
    setErro(''); setVenda(null);
    api.get<{ venda: Venda; linhas: Record<string, unknown>[] }>(`/vendas/${escolhida}/pagamentos`).then(r => {
      setVenda(r.venda);
      const todas = r.linhas || [];
      setBoletos(todas.filter(l => l.forma === 'boleto').reduce((s, l) => s + (Number(l.valor) || 0), 0));
      setLinhas(todas.filter(l => l.forma !== 'boleto').map(l => ({
        forma: String(l.forma || 'outro'), valor: String(Number(l.valor) || 0).replace('.', ','),
        data_recebimento: String(l.data_recebimento || '').slice(0, 10) || hoje(),
        bandeira: (l.bandeira as string) || null, parcelas: (l.parcelas as number) || null, conta: (l.conta as string) || null,
      })));
    }).catch(e => setErro(e instanceof Error ? e.message : 'Erro'));
  }, [escolhida]);

  const pago = linhas.reduce((s, l) => s + num(l.valor), 0);
  const falta = venda ? Math.max(0, Math.round((venda.valor_final - pago) * 100) / 100) : 0;
  const passou = venda ? pago > venda.valor_final + 0.009 : false;
  const upd = (i: number, p: Partial<Linha>) => setLinhas(ls => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));

  async function salvar() {
    if (!venda || passou) return;
    setSalvando(true); setErro('');
    try {
      await api.put(`/vendas/${venda.id}/pagamentos`, { linhas: linhas.map(l => ({ ...l, valor: num(l.valor) })) });
      onSaved();
    } catch (e) { setErro(e instanceof Error ? e.message.replace(/\s*\(HTTP \d+\)$/, '') : 'Erro ao salvar'); }
    setSalvando(false);
  }

  const inp: React.CSSProperties = { width: '100%', height: 34, padding: '0 9px', fontSize: 13.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-largo" style={{ maxWidth: 640, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: 'var(--text)' }}>{venda ? `Pagamentos da venda #${venda.numero}` : 'Editar pagamento'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              {venda ? `${venda.cliente_nome || 'Sem cliente'} · ${fmtD(venda.created_at)} · só esta compra é alterada` : 'Escolha a compra'}
            </p>
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label="Fechar"><Icone nome="fechar" size={15} /></button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {erro && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{erro}</div>}

          {!vendaId && compras && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Compras do cliente</div>
              {!compras.length && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma compra.</div>}
              <div style={{ display: 'grid', gap: 6, maxHeight: 190, overflowY: 'auto' }}>
                {compras.map(c => (
                  <button key={c.id} type="button" onClick={() => setEscolhida(c.id)}
                    style={{ display: 'grid', gridTemplateColumns: '70px 86px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '8px 10px', textAlign: 'left', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                      background: escolhida === c.id ? 'var(--primary-dim)' : 'var(--surface-alt)', border: `1px solid ${escolhida === c.id ? 'var(--primary)' : 'var(--border)'}` }}>
                    <b style={{ fontFamily: 'var(--mono)' }}>#{c.numero}</b>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 12 }}>{fmtD(c.created_at)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>{c.itens || brl(c.valor_final)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: c.saldo_restante > 0.009 ? '#dc2626' : '#16a34a' }}>{c.saldo_restante > 0.009 ? `falta ${brl(c.saldo_restante)}` : 'quitada'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {escolhida && !venda && !erro && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>}

          {venda && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 14 }}>
                {[
                  { l: 'Valor da venda', v: brl(venda.valor_final), c: 'var(--text)' },
                  { l: 'Pago', v: brl(pago), c: passou ? 'var(--red)' : '#16a34a' },
                  { l: 'Falta', v: brl(falta), c: falta > 0 ? '#dc2626' : 'var(--text-muted)' },
                ].map(k => (
                  <div key={k.l} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted)' }}>{k.l}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--mono)', color: k.c, marginTop: 2 }}>{k.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>O que o cliente já pagou</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {linhas.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 130px minmax(0,1fr) 34px', gap: 6, alignItems: 'center' }}>
                    <input type="date" style={{ ...inp, fontFamily: 'var(--mono)' }} value={l.data_recebimento} onChange={e => upd(i, { data_recebimento: e.target.value })} />
                    <select style={inp} value={l.forma} onChange={e => upd(i, { forma: e.target.value })}>
                      {FORMAS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                    </select>
                    <input inputMode="decimal" style={{ ...inp, fontFamily: 'var(--mono)', textAlign: 'right' }} value={l.valor} onChange={e => upd(i, { valor: e.target.value })} placeholder="0,00" />
                    <button type="button" className="btn btn-sm" style={{ padding: 0, width: 34 }} title="Tirar este pagamento" onClick={() => setLinhas(ls => ls.filter((_, j) => j !== i))}>
                      <Icone nome="excluir" size={14} color="var(--red)" />
                    </button>
                  </div>
                ))}
                {!linhas.length && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum pagamento lançado. A venda inteira está em aberto.</div>}
              </div>
              <button type="button" className="btn btn-sm" style={{ marginTop: 8, borderStyle: 'dashed' }}
                onClick={() => setLinhas(ls => [...ls, { forma: 'pix', valor: falta > 0 ? String(falta).replace('.', ',') : '', data_recebimento: hoje() }])}>
                <Icone nome="mais" size={13} strokeWidth={2.2} />Adicionar pagamento
              </button>
              {boletos > 0 && <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Esta venda tem {brl(boletos)} em carnê. As parcelas do carnê são baixadas em Contas a Receber e não mudam aqui.</p>}
              {passou && <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--red)' }}>Os pagamentos passam do valor da venda.</p>}
            </>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-prim" disabled={!venda || salvando || passou} onClick={salvar}>{salvando ? 'Salvando...' : 'Salvar pagamentos'}</button>
        </div>
      </div>
    </div>
  );
}
