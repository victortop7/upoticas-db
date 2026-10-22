import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Cliente } from '../types';
import ClienteModal from '../components/ClienteModal';
import VendaModal from '../components/VendaModal';
import OSModal from '../components/OSModal';
import { BaixaModal, type Titulo } from './financeiro/ContasReceber';

type ClientePerfilData = Cliente & { foto?: string | null; referencia?: string | null; loja_id?: string | null; created_at?: string };
type VendaP = { id: string; numero: number; situacao: string; valor_total: number; desconto: number; valor_final: number; forma_pagamento?: string; valor_entrada: number; saldo_restante: number; created_at: string; vendedor?: string; loja?: string; itens?: string };
type OSP = { id: string; numero: number; tipo: string; situacao: string; valor_total: number; valor_restante: number; data_entrega?: string; armacao_desc?: string; lente_desc?: string; created_at: string };
type CarneP = { id: string; descricao: string; valor_total: number; num_parcelas: number; venda_id?: string; venda_numero?: number; created_at: string };
type Resumo = { total_comprado: number; qtd_vendas: number; ticket_medio: number; em_aberto: number; em_atraso: number; parcelas_atraso: number; atraso_medio_dias: number | null; primeira_compra: string | null; ultima_compra: string | null };
type Perfil = { cliente: ClientePerfilData; vendas: VendaP[]; os: OSP[]; carnes: CarneP[]; titulos: Titulo[]; resumo: Resumo };
type Conta = { id: string; nome: string };

const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtD = (s?: string | null) => { if (!s) return '-'; const [y, m, d] = s.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
function idade(s?: string) { if (!s) return null; const n = new Date(s); if (isNaN(n.getTime())) return null; const h = new Date(); let a = h.getFullYear() - n.getFullYear(); if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) a--; return a; }
function haQuanto(s?: string | null) {
  if (!s) return '';
  const dias = Math.floor((Date.now() - new Date(s.slice(0, 10) + 'T12:00:00').getTime()) / 86_400_000);
  if (dias < 1) return 'hoje';
  if (dias < 30) return `há ${dias} dia${dias > 1 ? 's' : ''}`;
  if (dias < 365) { const m = Math.floor(dias / 30); return `há ${m} ${m > 1 ? 'meses' : 'mês'}`; }
  const a = Math.floor(dias / 365); return `há ${a} ano${a > 1 ? 's' : ''}`;
}
const SIT_OS: Record<string, string> = { orcamento: 'Orçamento', aprovado: 'Aprovado', em_producao: 'Produção', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' };

// Foto: reduz para 360px (JPEG) antes de enviar
function reduzirFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const esc = Math.min(1, 360 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

export default function ClientePerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Perfil | null>(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<'vendas' | 'crediario' | 'os' | 'receita'>('vendas');
  const [editar, setEditar] = useState(false);
  const [novaVenda, setNovaVenda] = useState(false);
  const [novaOS, setNovaOS] = useState(false);
  const [baixa, setBaixa] = useState<Titulo | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [ref, setRef] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Perfil>(`/clientes/${id}/perfil`).then(r => { setP(r); setRef(null); }).catch(e => setErro(e instanceof Error ? e.message : 'Erro'));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get<Conta[]>('/financeiro/contas').then(setContas).catch(() => {}); }, []);

  async function trocarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { await api.put(`/clientes/${id}/perfil`, { foto: await reduzirFoto(f) }); load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Erro ao enviar a foto'); }
  }
  async function salvarRef() {
    if (ref === null) return;
    await api.put(`/clientes/${id}/perfil`, { referencia: ref }); load();
  }

  if (erro) return <div style={{ padding: 32, color: 'var(--red)' }}>{erro}</div>;
  if (!p) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Carregando…</div>;

  const c = p.cliente; const r = p.resumo;
  const atrasados = p.titulos.filter(t => t.situacao === 'vencido');
  const abertos = p.titulos.filter(t => t.situacao !== 'recebido');
  const wa = (c.celular || c.telefone || '').replace(/\D/g, '');
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 };
  const btn = (bg: string, fg = '#fff'): React.CSSProperties => ({ width: '100%', padding: '10px 12px', fontSize: 14, fontWeight: 600, background: bg, color: fg, border: bg === 'transparent' ? '1px solid var(--border)' : 'none', borderRadius: 9, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block', boxSizing: 'border-box' });
  const linha = (rot: string, val: React.ReactNode) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, padding: '5px 0', fontSize: 13.5 }}>
      <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{rot}</span><span style={{ color: 'var(--text)' }}>{val || '-'}</span>
    </div>
  );
  const abaBtn = (k: typeof aba, l: string, n?: number) => (
    <button onClick={() => setAba(k)} style={{ padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: 'none', border: 'none', borderBottom: `2px solid ${aba === k ? 'var(--primary)' : 'transparent'}`, color: aba === k ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer' }}>
      {l}{n !== undefined && <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 7px', borderRadius: 10, background: 'var(--surface-alt)', fontFamily: 'var(--mono)' }}>{n}</span>}
    </button>
  );
  const nascIdade = idade(c.data_nascimento);

  // crediário agrupado por carnê / saldo de venda
  const grupos = new Map<string, { titulo: string; itens: Titulo[] }>();
  for (const t of p.titulos) {
    const k = t.carne_id || `${t.origem}-${t.venda_id || t.id}`;
    const nome = t.origem === 'carne' ? `${t.venda_numero ? `Venda #${t.venda_numero} · ` : ''}${t.descricao.replace(/^Venda #\d+\s*[—·-]\s*/, '') || 'Carnê'}` : t.origem === 'venda' ? `Venda #${t.venda_numero} · saldo em aberto` : t.descricao;
    const g = grupos.get(k) || { titulo: nome, itens: [] };
    g.itens.push(t); grupos.set(k, g);
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1180 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 10 }}>← Voltar</button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          {/* Cabeçalho */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{c.nome}</h1>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                  {c.apelido ? `${c.apelido} · ` : ''}cliente desde {fmtD(r.primeira_compra || c.created_at)} {r.primeira_compra || c.created_at ? `(${haQuanto(r.primeira_compra || c.created_at)})` : ''}
                </div>
              </div>
              {!c.ativo && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text-muted)' }}>Inativo</span>}
            </div>

            {atrasados.length > 0 && (
              <div style={{ marginTop: 14, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>Este cliente tem {atrasados.length} parcela{atrasados.length > 1 ? 's' : ''} em atraso · {brl(r.em_atraso)}</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 3 }}>
                  {atrasados.slice(0, 6).map(t => (
                    <div key={t.origem + t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-dim)', gap: 10 }}>
                      <span>{t.venda_numero ? `Venda #${t.venda_numero}` : t.descricao}{t.parcela ? ` · parc. ${t.parcela}` : ''} · venceu {fmtD(t.vencimento)} ({t.dias_atraso} dias)</span>
                      <b style={{ fontFamily: 'var(--mono)', color: '#dc2626' }}>{brl(t.valor)}</b>
                    </div>
                  ))}
                  {atrasados.length > 6 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+ {atrasados.length - 6} parcela(s) · veja na aba Crediário</div>}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0 24px', marginTop: 14 }}>
              <div>
                {linha('CPF', <span style={{ fontFamily: 'var(--mono)' }}>{c.cpf}</span>)}
                {linha('Nascimento', c.data_nascimento ? `${fmtD(c.data_nascimento)}${nascIdade !== null ? ` · ${nascIdade} anos` : ''}` : '')}
                {linha('Celular', c.celular && <span style={{ fontFamily: 'var(--mono)' }}>{c.celular}</span>)}
                {linha('Telefone', c.telefone && <span style={{ fontFamily: 'var(--mono)' }}>{c.telefone}</span>)}
                {linha('E-mail', c.email)}
              </div>
              <div>
                {linha('Endereço', c.endereco)}
                {linha('Bairro', c.bairro)}
                {linha('Cidade', [c.cidade, c.uf].filter(Boolean).join('/'))}
                {linha('CEP', c.cep)}
                {linha('Referência', ref !== null
                  ? <span style={{ display: 'flex', gap: 6 }}><input autoFocus value={ref} onChange={e => setRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarRef()} style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-alt)', color: 'var(--text)' }} placeholder="Ex: casa azul, ao lado da padaria" /><button onClick={salvarRef} style={{ fontSize: 12, padding: '4px 10px', border: 'none', borderRadius: 6, background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}>OK</button></span>
                  : <span>{c.referencia || <span style={{ color: 'var(--text-muted)' }}>-</span>} <button onClick={() => setRef(c.referencia || '')} style={{ fontSize: 11.5, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>editar</button></span>)}
              </div>
            </div>
            {c.observacao && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)', background: 'var(--surface-alt)', borderRadius: 8, padding: '9px 12px', whiteSpace: 'pre-wrap', maxHeight: 140, overflowY: 'auto' }}>{c.observacao}</div>
            )}
          </div>

          {/* Números */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {[
              { l: 'Total comprado', v: brl(r.total_comprado), cor: 'var(--primary)' },
              { l: 'Vendas', v: String(r.qtd_vendas), s: r.ultima_compra ? `última ${haQuanto(r.ultima_compra)}` : '' },
              { l: 'Ticket médio', v: brl(r.ticket_medio) },
              { l: 'Em aberto', v: brl(r.em_aberto), cor: r.em_aberto > 0 ? '#d97706' : undefined },
              { l: 'Em atraso', v: brl(r.em_atraso), cor: r.em_atraso > 0 ? '#dc2626' : '#16a34a', s: r.atraso_medio_dias !== null ? `paga c/ média de ${r.atraso_medio_dias.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dia(s) de atraso` : '' },
            ].map(k => (
              <div key={k.l} style={{ ...card, padding: '12px 14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '.4px' }}>{k.l}</div>
                <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'var(--mono)', color: k.cor || 'var(--text)', marginTop: 2 }}>{k.v}</div>
                {k.s && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.s}</div>}
              </div>
            ))}
          </div>

          {/* Histórico */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', padding: '0 10px', flexWrap: 'wrap' }}>
              {abaBtn('vendas', 'Vendas', p.vendas.length)}
              {abaBtn('crediario', 'Crediário', abertos.length)}
              {abaBtn('os', 'O.S.', p.os.length)}
              {abaBtn('receita', 'Receita')}
            </div>

            {aba === 'vendas' && (
              <div>
                {!p.vendas.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma venda.</div>}
                {p.vendas.map(v => (
                  <div key={v.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, alignItems: 'center', opacity: v.situacao === 'cancelada' ? 0.5 : 1 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>#{v.numero}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{fmtD(v.created_at)}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.itens || '-'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {[v.vendedor, v.loja, v.forma_pagamento].filter(Boolean).join(' · ')}{v.situacao === 'cancelada' ? ' · CANCELADA' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{brl(v.valor_final)}</div>
                      {v.desconto > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>desc. {brl(v.desconto)}</div>}
                      {v.saldo_restante > 0.009 && v.situacao !== 'cancelada' && <div style={{ fontSize: 11, color: '#d97706' }}>falta {brl(v.saldo_restante)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === 'crediario' && (
              <div style={{ padding: 14, display: 'grid', gap: 12 }}>
                {!grupos.size && <div style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum crediário / boleto.</div>}
                {[...grupos.entries()].map(([k, g]) => {
                  const aberto = g.itens.filter(t => t.situacao !== 'recebido').reduce((s, t) => s + t.valor, 0);
                  const temAtraso = g.itens.some(t => t.situacao === 'vencido');
                  return (
                    <div key={k} style={{ border: `1px solid ${temAtraso ? 'rgba(220,38,38,.4)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '9px 14px', background: temAtraso ? 'rgba(220,38,38,.08)' : 'var(--surface-alt)', display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
                        <b style={{ color: 'var(--text)' }}>{g.titulo}</b>
                        <span style={{ fontFamily: 'var(--mono)', color: aberto > 0 ? (temAtraso ? '#dc2626' : '#d97706') : '#16a34a', fontWeight: 700 }}>{aberto > 0 ? `aberto ${brl(aberto)}` : 'quitado'}</span>
                      </div>
                      {g.itens.map(t => {
                        const cor = t.situacao === 'recebido' ? '#16a34a' : t.situacao === 'vencido' ? '#dc2626' : '#d97706';
                        return (
                          <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '92px 70px 1fr 110px 90px', gap: 10, padding: '7px 14px', borderTop: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: cor }}>{t.situacao === 'recebido' ? 'Pago' : t.situacao === 'vencido' ? 'Em atraso' : 'A vencer'}</span>
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{t.parcela || '-'}</span>
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{fmtD(t.vencimento)} <span style={{ fontSize: 11, color: cor }}>{t.situacao === 'vencido' ? `${t.dias_atraso}d atraso` : t.situacao === 'recebido' ? `pago ${fmtD(t.recebido_em)}` : ''}</span></span>
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', color: 'var(--text)' }}>{brl(t.valor)}</span>
                            <span style={{ textAlign: 'right' }}>
                              {t.situacao !== 'recebido' && <button onClick={() => setBaixa(t)} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Baixar</button>}
                            </span>
                          </div>
                        );
                      })}
                      {g.itens[0]?.carne_id && <div style={{ padding: '7px 14px', borderTop: '1px solid var(--border)', textAlign: 'right' }}><a href={`/carnes/${g.itens[0].carne_id}/imprimir`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--primary)' }}>Imprimir carnê</a></div>}
                    </div>
                  );
                })}
              </div>
            )}

            {aba === 'os' && (
              <div>
                {!p.os.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma O.S.</div>}
                {p.os.map(o => (
                  <div key={o.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 14, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--primary)' }}>OS {o.numero}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{fmtD(o.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', minWidth: 0 }}>
                      {[o.armacao_desc, o.lente_desc].filter(Boolean).join(' · ') || '-'}
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{SIT_OS[o.situacao] || o.situacao}{o.data_entrega ? ` · entrega ${fmtD(o.data_entrega)}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{brl(o.valor_total)}</span>
                      <a href={`/os/${o.id}/imprimir`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>imprimir</a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === 'receita' && (
              <div style={{ padding: 18 }}>
                <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 14 }}>
                  <thead><tr>{['', 'Esférico', 'Cilíndrico', 'Eixo'].map(h => <th key={h} style={{ padding: '6px 16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--sans)' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    <tr><td style={{ padding: '6px 16px', fontWeight: 700 }}>OD</td><td style={{ padding: '6px 16px' }}>{c.rec_od_esf || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_od_cil || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_od_eixo || '-'}</td></tr>
                    <tr><td style={{ padding: '6px 16px', fontWeight: 700 }}>OE</td><td style={{ padding: '6px 16px' }}>{c.rec_oe_esf || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_oe_cil || '-'}</td><td style={{ padding: '6px 16px' }}>{c.rec_oe_eixo || '-'}</td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>Adição: <b style={{ fontFamily: 'var(--mono)' }}>{c.rec_adicao || '-'}</b> · DP: <b style={{ fontFamily: 'var(--mono)' }}>{c.rec_dp || '-'}</b>{c.rec_obs ? ` · ${c.rec_obs}` : ''}</div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna da direita: foto e ações */}
        <div style={{ display: 'grid', gap: 10, position: 'sticky', top: 20 }}>
          <label style={{ ...card, aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} title="Trocar foto">
            {c.foto
              ? <img src={c.foto} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}><div style={{ fontSize: 46 }}></div><div style={{ fontSize: 12.5 }}>Sem foto</div></div>}
            <input type="file" accept="image/*" capture="user" onChange={trocarFoto} style={{ display: 'none' }} />
          </label>
          <label style={{ ...btn('var(--primary)'), cursor: 'pointer' }}>{c.foto ? 'Trocar foto' : 'Capturar foto'}<input type="file" accept="image/*" capture="user" onChange={trocarFoto} style={{ display: 'none' }} /></label>
          <button onClick={() => setEditar(true)} style={btn('var(--primary)')}>Alterar dados</button>
          <button onClick={() => setNovaVenda(true)} style={btn('#16a34a')}>Iniciar venda</button>
          <button onClick={() => setNovaOS(true)} style={btn('#7c3aed')}>Abrir O.S.</button>
          {wa && <a href={`https://wa.me/55${wa.replace(/^55/, '')}`} target="_blank" rel="noreferrer" style={btn('#25D366')}>WhatsApp</a>}
          {abertos.length > 0 && <a href={`/financeiro/cobranca/imprimir?cliente_id=${c.id}&situacao=aberto`} target="_blank" rel="noreferrer" style={btn('transparent', 'var(--text)')}>Ficha de cobrança</a>}
          <button onClick={() => navigate('/clientes')} style={btn('transparent', 'var(--text-dim)')}>← Voltar aos clientes</button>
        </div>
      </div>

      {editar && <ClienteModal cliente={c} onClose={() => setEditar(false)} onSaved={() => { setEditar(false); load(); }} />}
      {novaVenda && <VendaModal venda={null} clienteInicial={{ id: c.id, nome: c.nome }} onClose={() => setNovaVenda(false)} onSaved={() => { setNovaVenda(false); load(); }} />}
      {novaOS && <OSModal os={null} clienteInicial={{ id: c.id, nome: c.nome }} onClose={() => setNovaOS(false)} onSaved={() => { setNovaOS(false); load(); }} />}
      {baixa && <BaixaModal t={baixa} contas={contas} onClose={() => setBaixa(null)} onSaved={() => { setBaixa(null); load(); }} />}
    </div>
  );
}
