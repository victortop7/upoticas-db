import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { whatsappLink, foneValido, aplicarVariaveis } from '../../lib/whatsapp';
import { useAuth } from '../../hooks/useAuth';

interface Cliente { id: string; nome: string; celular?: string; telefone?: string; data_nascimento: string; cidade?: string; uf?: string; }
interface Modelo { id: string; nome: string; categoria: string; corpo: string; }

function fmtAniversario(s: string) {
  const [, m, d] = s.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d} ${meses[parseInt(m) - 1]}`;
}

export default function Aniversariantes() {
  const { tenant } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [periodo, setPeriodo] = useState('mes');
  const [modeloSel, setModeloSel] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      api.get<Cliente[]>(`/marketing/aniversariantes?periodo=${periodo}`),
      api.get<Modelo[]>('/marketing/modelos?categoria=aniversario'),
    ]).then(([c, m]) => {
      setClientes(c);
      setModelos(m);
      if (m.length > 0 && !modeloSel) setModeloSel(m[0].id);
    }).finally(() => setLoading(false));
  }, [periodo]);

  const modeloAtual = modelos.find(m => m.id === modeloSel);

  function getMensagem(cliente: Cliente): string {
    const corpo = modeloAtual?.corpo || 'Olá {nome}! 🎂 Feliz aniversário! Venha nos visitar!';
    return aplicarVariaveis(corpo, {
      nome: cliente.nome.split(' ')[0],
      loja: tenant?.nome || 'nossa loja',
      data: fmtAniversario(cliente.data_nascimento),
    });
  }

  async function enviarWhatsApp(cliente: Cliente) {
    const fone = cliente.celular || cliente.telefone || '';
    const msg = getMensagem(cliente);
    window.open(whatsappLink(fone, msg), '_blank');
    setEnviados(s => new Set([...s, cliente.id]));
    await api.post('/marketing/historico', {
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      celular: fone,
      mensagem: msg,
      tipo: 'aniversario',
    }).catch(() => {});
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', fontSize: '13px', fontWeight: '500', border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '20px', cursor: 'pointer', background: active ? 'var(--primary)' : 'var(--surface)', color: active ? 'white' : 'var(--text-dim)' });

  const comFone = clientes.filter(c => foneValido(c.celular || c.telefone));
  const semFone = clientes.filter(c => !foneValido(c.celular || c.telefone));

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Aniversariantes 🎂</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>{clientes.length} aniversariante{clientes.length !== 1 ? 's' : ''} no período</p>
      </div>

      {/* Filtros de período */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['hoje', 'Hoje'], ['7d', '7 dias'], ['mes', 'Este mês']].map(([val, label]) => (
            <button key={val} style={filterBtn(periodo === val)} onClick={() => setPeriodo(val)}>{label}</button>
          ))}
        </div>

        {modelos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Modelo:</span>
            <select value={modeloSel} onChange={e => setModeloSel(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Preview da mensagem */}
      {modeloAtual && (
        <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Preview da mensagem</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>
            {aplicarVariaveis(modeloAtual.corpo, { nome: 'João', loja: tenant?.nome || 'nossa loja', data: '26 Abr' })}
          </p>
        </div>
      )}

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</p> : (
        <>
          {clientes.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nenhum aniversariante no período selecionado.
            </div>
          ) : (
            <>
              {comFone.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Com WhatsApp ({comFone.length})</h3>
                    <span style={{ fontSize: '12px', color: '#16a34a' }}>{enviados.size} enviado{enviados.size !== 1 ? 's' : ''}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {comFone.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: i < comFone.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{c.nome}</div>
                            {c.cidade && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.cidade}{c.uf ? `/${c.uf}` : ''}</div>}
                          </td>
                          <td style={{ padding: '12px 20px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-dim)' }}>
                            {c.celular || c.telefone}
                          </td>
                          <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                            <span style={{ fontSize: '15px', fontWeight: '600', fontFamily: 'var(--mono)', color: 'var(--primary)' }}>
                              🎂 {fmtAniversario(c.data_nascimento)}
                            </span>
                          </td>
                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => enviarWhatsApp(c)}
                              style={{
                                padding: '7px 14px', fontSize: '13px', fontWeight: '600',
                                background: enviados.has(c.id) ? 'rgba(34,197,94,0.12)' : '#25D366',
                                color: enviados.has(c.id) ? '#16a34a' : 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}
                            >
                              {enviados.has(c.id) ? '✓ Enviado' : (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.296 19.935l.646-2.352a9.15 9.15 0 01-1.225-4.61C4.72 7.867 8.572 4 13.28 4a8.549 8.549 0 016.073 2.513 8.633 8.633 0 012.511 6.109c-.002 4.767-3.854 8.634-8.562 8.634a8.57 8.57 0 01-4.097-1.04L5.296 19.935zm2.454-1.414l.261.155a7.11 7.11 0 003.441.893c3.938 0 7.141-3.217 7.143-7.172a7.18 7.18 0 00-2.088-5.085 7.112 7.112 0 00-5.052-2.106c-3.942 0-7.145 3.217-7.145 7.17 0 1.356.375 2.68 1.084 3.829l.169.267-.714 2.601 2.901-.552z"/></svg> WhatsApp</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {semFone.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Sem telefone cadastrado ({semFone.length})</h3>
                  </div>
                  <div style={{ padding: '12px 20px' }}>
                    {semFone.map((c, i) => (
                      <span key={c.id} style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                        {c.nome}{i < semFone.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
