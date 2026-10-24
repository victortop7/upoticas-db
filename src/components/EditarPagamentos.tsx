import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import Icone from './Icone';

// Corrigir o que o cliente já pagou. Só a compra escolhida muda.
// - vendaId: abre direto naquela venda
// - clienteId: mostra tudo que o cliente deve (vendas, OS em aberto e parcelas de carnê) pra escolher

interface Venda { id: string; numero: number; created_at: string; valor_final: number; valor_entrada: number; saldo_restante: number; situacao: string; cliente_nome?: string | null }
interface Linha { forma: string; valor: string; data_recebimento: string; bandeira?: string | null; parcelas?: string | number | null; conta?: string | null }
interface VendaCli { id: string; numero: number; created_at: string; valor_final: number; saldo_restante: number; situacao: string; itens?: string | null }
interface OSCli { id: string; numero: number; created_at: string; situacao: string; valor_total: number; valor_entrada: number; valor_restante: number; armacao_desc?: string | null; lente_desc?: string | null }
interface Parcela { origem: string; id: string; carne_id: string | null; venda_numero: number | null; descricao: string; parcela: string | null; vencimento: string; valor: number; situacao: string; dias_atraso: number }
type Alvo = { tipo: 'venda'; id: string } | { tipo: 'os'; os: OSCli };

const FORMAS = [
  { v: 'dinheiro', l: 'Dinheiro' }, { v: 'pix', l: 'Pix' }, { v: 'credito', l: 'Crédito' },
  { v: 'debito', l: 'Débito' }, { v: 'outro', l: 'Outro' },
];
const brl = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtD = (s?: string | null) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '');
const hoje = () => new Date().toISOString().slice(0, 10);
const num = (s: string) => parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;
const virg = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',');

export default function EditarPagamentos({ vendaId, clienteId, onClose, onSaved }: { vendaId?: string | null; clienteId?: string | null; onClose: () => void; onSaved: () => void }) {
  const [alvo, setAlvo] = useState<Alvo | null>(vendaId ? { tipo: 'venda', id: vendaId } : null);
  const [lista, setLista] = useState<{ vendas: VendaCli[]; os: OSCli[]; parcelas: Parcela[]; nome: string } | null>(null);
  const [verQuitadas, setVerQuitadas] = useState(false);
  const [venda, setVenda] = useState<Venda | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [boletos, setBoletos] = useState(0);
  const [osPago, setOsPago] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mudou, setMudou] = useState(false);

  // a partir do cliente: tudo que ele deve
  const carregarLista = useCallback(() => {
    if (vendaId || !clienteId) return;
    api.get<{ cliente: { nome: string }; vendas: VendaCli[]; os: OSCli[]; titulos: Parcela[] }>(`/clientes/${clienteId}/perfil`).then(r => {
      const vendas = (r.vendas || []).filter(v => v.situacao !== 'cancelada')
        .sort((a, b) => Number(b.saldo_restante > 0.009) - Number(a.saldo_restante > 0.009) || String(b.created_at).localeCompare(String(a.created_at)));
      const os = (r.os || []).filter(o => (o.valor_restante || 0) > 0.009 && !['cancelado', 'orcamento'].includes(o.situacao));
      const parcelas = (r.titulos || []).filter(t => t.origem === 'carne').sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      setLista({ vendas, os, parcelas, nome: r.cliente?.nome || '' });
      const abertas = vendas.filter(v => v.saldo_restante > 0.009);
      // uma dívida só: já abre nela
      if (!alvo && abertas.length + os.length === 1 && !parcelas.some(p => p.situacao !== 'recebido')) {
        setAlvo(abertas.length ? { tipo: 'venda', id: abertas[0].id } : { tipo: 'os', os: os[0] });
      }
    }).catch(e => setErro(e instanceof Error ? e.message : 'Erro'));
  }, [vendaId, clienteId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { carregarLista(); }, [carregarLista]);

  useEffect(() => {
    setErro('');
    if (alvo?.tipo === 'os') { setVenda(null); setOsPago(virg(alvo.os.valor_entrada || 0)); return; }
    if (alvo?.tipo !== 'venda') return;
    setVenda(null);
    api.get<{ venda: Venda; linhas: Record<string, unknown>[] }>(`/vendas/${alvo.id}/pagamentos`).then(r => {
      setVenda(r.venda);
      const todas = r.linhas || [];
      setBoletos(todas.filter(l => l.forma === 'boleto').reduce((s, l) => s + (Number(l.valor) || 0), 0));
      setLinhas(todas.filter(l => l.forma !== 'boleto').map(l => ({
        forma: String(l.forma || 'outro'), valor: virg(Number(l.valor) || 0),
        data_recebimento: String(l.data_recebimento || '').slice(0, 10) || hoje(),
        bandeira: (l.bandeira as string) || null, parcelas: (l.parcelas as number) || null, conta: (l.conta as string) || null,
      })));
    }).catch(e => setErro(e instanceof Error ? e.message : 'Erro'));
  }, [alvo]);

  const pago = linhas.reduce((s, l) => s + num(l.valor), 0);
  const falta = venda ? Math.max(0, Math.round((venda.valor_final - pago) * 100) / 100) : 0;
  const passou = venda ? pago > venda.valor_final + 0.009 : false;
  const osTotal = alvo?.tipo === 'os' ? alvo.os.valor_total || 0 : 0;
  const osFalta = Math.max(0, Math.round((osTotal - num(osPago)) * 100) / 100);
  const osPassou = alvo?.tipo === 'os' && num(osPago) > osTotal + 0.009;
  const upd = (i: number, p: Partial<Linha>) => setLinhas(ls => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));

  async function salvar() {
    setSalvando(true); setErro('');
    try {
      if (alvo?.tipo === 'venda' && venda && !passou) await api.put(`/vendas/${venda.id}/pagamentos`, { linhas: linhas.map(l => ({ ...l, valor: num(l.valor) })) });
      else if (alvo?.tipo === 'os' && !osPassou) await api.put(`/os/${alvo.os.id}/pagamento`, { valor_pago: num(osPago) });
      else { setSalvando(false); return; }
      onSaved();
    } catch (e) { setErro(e instanceof Error ? e.message.replace(/\s*\(HTTP \d+\)$/, '') : 'Erro ao salvar'); }
    setSalvando(false);
  }
  async function marcarParcela(p: Parcela, paga: boolean) {
    setErro('');
    try { await api.post('/carnes/parcela', { parcela_id: p.id, status: paga ? 'pago' : 'pendente' }); setMudou(true); carregarLista(); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Erro'); }
  }
  const fechar = () => (mudou ? onSaved() : onClose());

  const inp: React.CSSProperties = { width: '100%', height: 34, padding: '0 9px', fontSize: 13.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' };
  const titulo: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted)', margin: '14px 0 6px' };
  const linhaBtn = (on: boolean): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: '78px 86px minmax(0,1fr) auto', gap: 10, alignItems: 'center', width: '100%', padding: '9px 11px', textAlign: 'left', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text)', background: on ? 'var(--primary-dim)' : 'var(--surface-alt)', border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}` });

  const vendasAbertas = lista?.vendas.filter(v => v.saldo_restante > 0.009) || [];
  const vendasQuitadas = lista?.vendas.filter(v => v.saldo_restante <= 0.009) || [];
  const parcelasAbertas = lista?.parcelas.filter(p => p.situacao !== 'recebido') || [];
  const parcelasPagas = lista?.parcelas.filter(p => p.situacao === 'recebido') || [];
  const nadaDeve = lista && !vendasAbertas.length && !lista.os.length && !parcelasAbertas.length;
  const nomeCliente = venda?.cliente_nome || lista?.nome || '';
  const cabecalho = alvo?.tipo === 'os' ? `Pagamento da OS ${alvo.os.numero}` : venda ? `Pagamentos da venda #${venda.numero}` : 'Corrigir pagamento';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={e => e.target === e.currentTarget && fechar()}>
      <div className="modal-largo" style={{ maxWidth: 680, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: 'var(--text)' }}>{cabecalho}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              {nomeCliente ? `${nomeCliente} · ` : ''}{alvo ? 'só esta compra é alterada' : 'escolha abaixo o que corrigir'}
            </p>
          </div>
          <button className="btn btn-sm" onClick={fechar} aria-label="Fechar"><Icone nome="fechar" size={15} /></button>
        </div>

        <div style={{ padding: '6px 20px 16px', overflowY: 'auto', flex: 1 }}>
          {erro && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{erro}</div>}
          {!vendaId && !lista && !erro && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Carregando...</div>}

          {/* lista do que o cliente deve */}
          {!vendaId && lista && (
            <>
              {nadaDeve && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-dim)' }}>Este cliente não tem nada em aberto. As compras quitadas estão abaixo, caso precise corrigir alguma.</div>}

              {vendasAbertas.length > 0 && <div style={titulo}>Vendas com saldo em aberto</div>}
              <div style={{ display: 'grid', gap: 6 }}>
                {vendasAbertas.map(v => (
                  <button key={v.id} type="button" style={linhaBtn(alvo?.tipo === 'venda' && alvo.id === v.id)} onClick={() => setAlvo({ tipo: 'venda', id: v.id })}>
                    <b style={{ fontFamily: 'var(--mono)' }}>Venda #{v.numero}</b>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 12 }}>{fmtD(v.created_at)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>{v.itens || `total ${brl(v.valor_final)}`}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#dc2626' }}>falta {brl(v.saldo_restante)}</span>
                  </button>
                ))}
              </div>

              {lista.os.length > 0 && <div style={titulo}>OS em aberto (sem venda ligada)</div>}
              <div style={{ display: 'grid', gap: 6 }}>
                {lista.os.map(o => (
                  <button key={o.id} type="button" style={linhaBtn(alvo?.tipo === 'os' && alvo.os.id === o.id)} onClick={() => setAlvo({ tipo: 'os', os: o })}>
                    <b style={{ fontFamily: 'var(--mono)' }}>OS {o.numero}</b>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 12 }}>{fmtD(o.created_at)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>{[o.armacao_desc, o.lente_desc].filter(Boolean).join(' · ') || `total ${brl(o.valor_total)}`}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#dc2626' }}>falta {brl(o.valor_restante)}</span>
                  </button>
                ))}
              </div>

              {lista.parcelas.length > 0 && <div style={titulo}>Parcelas de carnê</div>}
              {[...parcelasAbertas, ...parcelasPagas].map(p => {
                const cor = p.situacao === 'recebido' ? '#16a34a' : p.situacao === 'vencido' ? '#dc2626' : '#d97706';
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '92px 64px minmax(0,1fr) 100px 118px', gap: 10, alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: cor }}>{p.situacao === 'recebido' ? 'Paga' : p.situacao === 'vencido' ? `${p.dias_atraso}d atraso` : 'A vencer'}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{p.parcela || '-'}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtD(p.vencimento)}{p.venda_numero ? ` · venda #${p.venda_numero}` : ''}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{brl(p.valor)}</span>
                    <span style={{ textAlign: 'right' }}>
                      {p.situacao === 'recebido'
                        ? <button className="btn btn-xs" onClick={() => marcarParcela(p, false)}><Icone nome="desfazer" size={12} />Desfazer</button>
                        : <button className="btn btn-xs" style={{ color: '#16a34a' }} onClick={() => marcarParcela(p, true)}><Icone nome="ok" size={12} />Marcar paga</button>}
                    </span>
                  </div>
                );
              })}

              {vendasQuitadas.length > 0 && (
                <button type="button" onClick={() => setVerQuitadas(v => !v)} style={{ marginTop: 14, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                  {verQuitadas ? 'Esconder' : 'Ver'} compras já quitadas ({vendasQuitadas.length})
                </button>
              )}
              {verQuitadas && (
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  {vendasQuitadas.map(v => (
                    <button key={v.id} type="button" style={linhaBtn(alvo?.tipo === 'venda' && alvo.id === v.id)} onClick={() => setAlvo({ tipo: 'venda', id: v.id })}>
                      <b style={{ fontFamily: 'var(--mono)' }}>Venda #{v.numero}</b>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 12 }}>{fmtD(v.created_at)}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>{v.itens || `total ${brl(v.valor_final)}`}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#16a34a' }}>quitada</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* venda escolhida */}
          {alvo?.tipo === 'venda' && !venda && !erro && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Carregando...</div>}
          {alvo?.tipo === 'venda' && venda && (
            <div style={{ marginTop: 16, paddingTop: !vendaId ? 14 : 0, borderTop: !vendaId ? '1px solid var(--border)' : undefined }}>
              <Resumo total={venda.valor_final} pago={pago} falta={falta} erro={passou} rotulo="Valor da venda" />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>O que o cliente já pagou desta venda</div>
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
                onClick={() => setLinhas(ls => [...ls, { forma: 'pix', valor: falta > 0 ? virg(falta) : '', data_recebimento: hoje() }])}>
                <Icone nome="mais" size={13} strokeWidth={2.2} />Adicionar pagamento
              </button>
              {boletos > 0 && <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Esta venda tem {brl(boletos)} em carnê. As parcelas aparecem na lista acima, em Parcelas de carnê.</p>}
            </div>
          )}

          {/* OS escolhida */}
          {alvo?.tipo === 'os' && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <Resumo total={osTotal} pago={num(osPago)} falta={osFalta} erro={!!osPassou} rotulo="Valor da OS" />
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Quanto o cliente já pagou desta OS
                <div style={{ display: 'flex', gap: 6, marginTop: 4, maxWidth: 360 }}>
                  <input inputMode="decimal" autoFocus style={{ ...inp, fontFamily: 'var(--mono)', textAlign: 'right' }} value={osPago} onChange={e => setOsPago(e.target.value)} placeholder="0,00" />
                  <button type="button" className="btn btn-sm" onClick={() => setOsPago(virg(osTotal))}>Quitou tudo</button>
                </div>
              </label>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={fechar}>{alvo ? 'Cancelar' : 'Fechar'}</button>
          {alvo && <button className="btn btn-prim" disabled={salvando || passou || !!osPassou || (alvo.tipo === 'venda' && !venda)} onClick={salvar}>{salvando ? 'Salvando...' : 'Salvar'}</button>}
        </div>
      </div>
    </div>
  );
}

function Resumo({ total, pago, falta, erro, rotulo }: { total: number; pago: number; falta: number; erro: boolean; rotulo: string }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { l: rotulo, v: brl(total), c: 'var(--text)' },
          { l: 'Pago', v: brl(pago), c: erro ? 'var(--red)' : '#16a34a' },
          { l: 'Falta', v: brl(falta), c: falta > 0 ? '#dc2626' : 'var(--text-muted)' },
        ].map(k => (
          <div key={k.l} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted)' }}>{k.l}</div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--mono)', color: k.c, marginTop: 2 }}>{k.v}</div>
          </div>
        ))}
      </div>
      {erro && <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--red)' }}>O valor pago passa do total.</p>}
    </>
  );
}
