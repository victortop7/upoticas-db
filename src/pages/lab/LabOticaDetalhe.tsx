import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';

const STATUS_COLOR: Record<string, string> = {
  aguardando: 'var(--amber)', em_producao: 'var(--accent)',
  pronto: 'var(--green)', entregue: 'var(--text-dim)', cancelado: 'var(--red)',
};
const STATUS_LABEL: Record<string, string> = {
  aguardando: 'Aguardando', em_producao: 'Em Produção',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

function brl(v: number) {
  return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Contato {
  departamento: string; contato: string; telefone: string;
  ramal: string; fax: string; celular: string; sms: boolean; email: string;
}
const CONTATO_INI: Contato = { departamento: '', contato: '', telefone: '', ramal: '', fax: '', celular: '', sms: false, email: '' };

const INP: React.CSSProperties = {
  width: '100%', padding: '5px 7px', fontSize: '12px', background: 'var(--surface-alt)',
  border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--mono)',
};
const LBL: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px',
};
const SEC: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
  padding: '12px 14px',
};
const SEC_TITLE: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', color: '#880000', textTransform: 'uppercase',
  letterSpacing: '1px', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '5px',
};
const TH: React.CSSProperties = {
  padding: '5px 6px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)',
  textTransform: 'uppercase', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap', textAlign: 'center',
};
const TD: React.CSSProperties = { padding: '2px 3px', verticalAlign: 'middle' };
const TINP: React.CSSProperties = {
  width: '100%', padding: '3px 5px', fontSize: '11px', background: 'var(--surface-alt)',
  border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)',
  outline: 'none', fontFamily: 'var(--mono)',
};

function Field({ l, v }: { l: string; v: unknown }) {
  const val = v != null && v !== '' ? String(v) : null;
  if (!val) return null;
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{l}</div>
      <div style={{ fontSize: '12px', color: 'var(--text)' }}>{val}</div>
    </div>
  );
}

export default function LabOticaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<any>({});
  const [contatos, setContatos] = useState<Contato[]>(Array.from({ length: 8 }, () => ({ ...CONTATO_INI })));
  const [contatosMfe, setContatosMfe] = useState<Contato[]>(Array.from({ length: 3 }, () => ({ ...CONTATO_INI })));
  const [condicoes, setCondicoes] = useState<string[]>(Array(9).fill(''));
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.get<any>(`/lab/oticas/${id}`)
      .then(d => {
        setData(d);
        const o = d.otica;
        setForm(o);
        // parse contatos JSON
        try {
          const c = typeof o.contatos === 'string' ? JSON.parse(o.contatos) : (o.contatos ?? []);
          const normal = c.slice(0, 8);
          const mfe = c.slice(8, 11);
          setContatos([...Array.from({ length: 8 }, (_, i) => normal[i] ?? { ...CONTATO_INI })] as Contato[]);
          setContatosMfe([...Array.from({ length: 3 }, (_, i) => mfe[i] ?? { ...CONTATO_INI })] as Contato[]);
        } catch { setContatos(Array.from({ length: 8 }, () => ({ ...CONTATO_INI }))); }
        // parse condicoes
        try {
          const cp = typeof o.condicoes_pgto === 'string' ? JSON.parse(o.condicoes_pgto) : (o.condicoes_pgto ?? []);
          setCondicoes([...Array.from({ length: 9 }, (_, i) => cp[i] ?? '')] as string[]);
        } catch { setCondicoes(Array(9).fill('')); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  function setF(k: string, v: unknown) { setForm((f: Record<string, unknown>) => ({ ...f, [k]: v })); }
  function setCont(arr: Contato[], i: number, k: keyof Contato, v: unknown) {
    return arr.map((c, j) => j === i ? { ...c, [k]: v } : c);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/lab/oticas/${id}`, {
        ...form,
        contatos: [...contatos, ...contatosMfe],
        condicoes_pgto: condicoes,
      });
      setEditando(false);
      load();
    } catch {}
    setSaving(false);
  }

  if (loading) return <div style={{ padding: '48px', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '48px', color: 'var(--red)', fontSize: '14px' }}>Ótica não encontrada.</div>;

  const [filtroOS, setFiltroOS] = useState('');
  const { otica, ordens, stats } = data;

  // ===== MODO EDIÇÃO =====
  if (editando) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '16px', background: 'var(--bg)' }}>

        {/* Topo: código + nome + nome reduzido + datas */}
        <div style={{ ...SEC, marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 200px 160px', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={LBL}>Código</label>
              <input value={form.codigo ?? ''} onChange={e => setF('codigo', e.target.value)} style={INP} placeholder="001" />
            </div>
            <div>
              <label style={LBL}>Nome Completo *</label>
              <input value={form.nome ?? ''} onChange={e => setF('nome', e.target.value)} style={INP} required />
            </div>
            <div>
              <label style={LBL}>Nome Reduzido</label>
              <input value={form.nome_reduzido ?? ''} onChange={e => setF('nome_reduzido', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Data Cadastro</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                {otica.created_at ? new Date(otica.created_at).toLocaleDateString('pt-BR') : '—'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>Atualização</div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
        </div>

        {/* Corpo: 3 colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>

          {/* Coluna 1: Endereço */}
          <div style={SEC}>
            <div style={SEC_TITLE}>Endereço</div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={LBL}>CEP</label>
                <input value={form.cep ?? ''} onChange={e => setF('cep', e.target.value)} style={INP} placeholder="00000-000" />
              </div>
              <div>
                <label style={LBL}>Endereço</label>
                <input value={form.endereco ?? ''} onChange={e => setF('endereco', e.target.value)} style={INP} />
              </div>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Complemento</label>
              <input value={form.complemento ?? ''} onChange={e => setF('complemento', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Bairro</label>
              <input value={form.bairro ?? ''} onChange={e => setF('bairro', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px', gap: '8px', marginBottom: '6px' }}>
              <div><label style={LBL}>Cidade</label><input value={form.cidade ?? ''} onChange={e => setF('cidade', e.target.value)} style={INP} /></div>
              <div><label style={LBL}>UF</label><input value={form.uf ?? ''} onChange={e => setF('uf', e.target.value)} style={INP} maxLength={2} /></div>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Código Município/IBGE</label>
              <input value={form.codigo_ibge ?? ''} onChange={e => setF('codigo_ibge', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>CNPJ</label>
              <input value={form.cnpj ?? ''} onChange={e => setF('cnpj', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Inscrição Estadual</label>
              <input value={form.inscricao_estadual ?? ''} onChange={e => setF('inscricao_estadual', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={LBL}>Inscrição Municipal</label>
              <input value={form.inscricao_municipal ?? ''} onChange={e => setF('inscricao_municipal', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '8px', marginBottom: '6px' }}>
              <div><label style={LBL}>Área</label><input value={form.area ?? ''} onChange={e => setF('area', e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Vendedor</label><input value={form.vendedor_id ?? ''} onChange={e => setF('vendedor_id', e.target.value)} style={INP} /></div>
              <div>
                <label style={LBL}>Vias Pedido</label>
                <select value={form.vias_pedido ?? 1} onChange={e => setF('vias_pedido', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                  {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '8px' }}>
              <div><label style={LBL}>Rota</label><input value={form.rota_entrega ?? ''} onChange={e => setF('rota_entrega', e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Comissão (%)</label><input type="number" step="0.01" value={form.comissao ?? ''} onChange={e => setF('comissao', e.target.value)} style={INP} /></div>
              <div>
                <label style={LBL}>Vias OS</label>
                <select value={form.vias_os ?? 0} onChange={e => setF('vias_os', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                  {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Coluna 2: Parâmetros */}
          <div style={SEC}>
            <div style={SEC_TITLE}>Parâmetros Comerciais</div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Lista de Preços</label>
              <select value={form.lista_preco ?? 1} onChange={e => setF('lista_preco', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>Lista {n}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Classificação</label>
              <select value={form.classificacao_cli ?? ''} onChange={e => setF('classificacao_cli', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">—</option>
                <option value="A">A</option><option value="B">B</option>
                <option value="C">C</option><option value="D">D</option>
                <option value="E">E - Especial</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Tipo de Fechamento</label>
              <select value={form.tipo_fechamento ?? ''} onChange={e => setF('tipo_fechamento', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">—</option>
                <option value="1">1 - Mensal</option>
                <option value="2">2 - Quinzenal</option>
                <option value="3">3 - Semanal</option>
                <option value="4">4 - Diário</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Tipo de Faturamento</label>
              <select value={form.tipo_faturamento ?? ''} onChange={e => setF('tipo_faturamento', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">—</option>
                <option value="1">1 - Normal</option>
                <option value="2">2 - Contrato</option>
                <option value="3">3 - Convênio</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Via de Transporte</label>
              <select value={form.via_transporte ?? '0'} onChange={e => setF('via_transporte', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="0">0 - Própria</option>
                <option value="1">1 - Transportadora</option>
                <option value="2">2 - Motoboy</option>
                <option value="3">3 - Correios</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Tipo de ICMS</label>
              <select value={form.tipo_icms ?? ''} onChange={e => setF('tipo_icms', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">—</option>
                <option value="1">1 - Contribuinte</option>
                <option value="2">2 - Não Contribuinte</option>
                <option value="3">3 - Isento</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', marginBottom: '12px' }}>
              <input type="checkbox" checked={!!form.banco_cobranca} onChange={e => setF('banco_cobranca', e.target.checked ? 1 : 0)} />
              Banco de Cobrança
            </label>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <div style={SEC_TITLE}>Crédito / Situação</div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Limite de Crédito (R$)</label>
                <input type="number" step="0.01" value={form.limite_credito ?? ''} onChange={e => setF('limite_credito', e.target.value)} style={INP} />
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Dias em Débito p/ Aceitar Vendas</label>
                <input type="number" value={form.dias_debito ?? ''} onChange={e => setF('dias_debito', e.target.value)} style={INP} />
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Situação</label>
                <select value={form.situacao ?? ''} onChange={e => setF('situacao', e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                  <option value="">—</option>
                  <option value="A">A - Ativo</option>
                  <option value="I">I - Inativo</option>
                  <option value="B">B - Bloqueado</option>
                </select>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Ramo de Atividade</label>
                <input value={form.ramo_atividade ?? ''} onChange={e => setF('ramo_atividade', e.target.value)} style={INP} />
              </div>
              <div>
                <label style={LBL}>Matriz / Rede / Grupo</label>
                <input value={form.matriz_rede_grupo ?? ''} onChange={e => setF('matriz_rede_grupo', e.target.value)} style={INP} />
              </div>
            </div>
          </div>

          {/* Coluna 3: Contato + Observações */}
          <div style={SEC}>
            <div style={SEC_TITLE}>Contato / Comunicação</div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Telefone Principal</label>
              <input value={form.telefone ?? ''} onChange={e => setF('telefone', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>E-mail</label>
              <input type="email" value={form.email ?? ''} onChange={e => setF('email', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Cond. Pagamento Padrão</label>
              <input value={form.condicao_pgto ?? ''} onChange={e => setF('condicao_pgto', e.target.value)} style={INP} placeholder="VV, F30..." />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Desconto Padrão (%)</label>
              <input type="number" step="0.01" value={form.desconto_padrao ?? ''} onChange={e => setF('desconto_padrao', e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Observações</label>
              <textarea value={form.observacao ?? ''} onChange={e => setF('observacao', e.target.value)} rows={6}
                style={{ ...INP, fontFamily: 'var(--sans)', resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Tabela de Contatos */}
        <div style={{ ...SEC, marginBottom: '12px', overflowX: 'auto' }}>
          <div style={SEC_TITLE}>Departamentos / Contatos</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr>
                {['Departamento','Contato','Telefone','Ramal','Fax','Celular','SMS','E-mail'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contatos.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={TD}><input value={c.departamento} onChange={e => setContatos(setCont(contatos, i, 'departamento', e.target.value))} style={TINP} /></td>
                  <td style={TD}><input value={c.contato} onChange={e => setContatos(setCont(contatos, i, 'contato', e.target.value))} style={TINP} /></td>
                  <td style={TD}><input value={c.telefone} onChange={e => setContatos(setCont(contatos, i, 'telefone', e.target.value))} style={{ ...TINP, width: '110px' }} /></td>
                  <td style={TD}><input value={c.ramal} onChange={e => setContatos(setCont(contatos, i, 'ramal', e.target.value))} style={{ ...TINP, width: '55px' }} /></td>
                  <td style={TD}><input value={c.fax} onChange={e => setContatos(setCont(contatos, i, 'fax', e.target.value))} style={{ ...TINP, width: '90px' }} /></td>
                  <td style={TD}><input value={c.celular} onChange={e => setContatos(setCont(contatos, i, 'celular', e.target.value))} style={{ ...TINP, width: '110px' }} /></td>
                  <td style={{ ...TD, textAlign: 'center' }}><input type="checkbox" checked={c.sms} onChange={e => setContatos(setCont(contatos, i, 'sms', e.target.checked))} /></td>
                  <td style={TD}><input value={c.email} onChange={e => setContatos(setCont(contatos, i, 'email', e.target.value))} style={TINP} /></td>
                </tr>
              ))}
              {contatosMfe.map((c, i) => (
                <tr key={`mfe${i}`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                  <td style={{ ...TD, fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', paddingLeft: '6px', whiteSpace: 'nowrap' }}>ENVIO DE MFE</td>
                  <td style={TD}><input value={c.contato} onChange={e => setContatosMfe(setCont(contatosMfe, i, 'contato', e.target.value))} style={TINP} /></td>
                  <td style={TD}><input value={c.telefone} onChange={e => setContatosMfe(setCont(contatosMfe, i, 'telefone', e.target.value))} style={{ ...TINP, width: '110px' }} /></td>
                  <td style={TD}></td><td style={TD}></td>
                  <td style={TD}><input value={c.celular} onChange={e => setContatosMfe(setCont(contatosMfe, i, 'celular', e.target.value))} style={{ ...TINP, width: '110px' }} /></td>
                  <td style={{ ...TD, textAlign: 'center' }}><input type="checkbox" checked={c.sms} onChange={e => setContatosMfe(setCont(contatosMfe, i, 'sms', e.target.checked))} /></td>
                  <td style={TD}><input value={c.email} onChange={e => setContatosMfe(setCont(contatosMfe, i, 'email', e.target.value))} style={TINP} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Condições de Pagamento */}
        <div style={{ ...SEC, marginBottom: '12px' }}>
          <div style={SEC_TITLE}>Condições de Pagamento</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {condicoes.map((c, i) => (
              <div key={i}>
                <label style={{ ...LBL, textAlign: 'center' }}>{i + 1}</label>
                <input value={c} onChange={e => setCondicoes(cd => cd.map((x, j) => j === i ? e.target.value : x))}
                  style={{ ...INP, width: '80px', textAlign: 'center' }} placeholder="Ex: 30" />
              </div>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '24px' }}>
          <button onClick={() => setEditando(false)} style={{ padding: '9px 22px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)} style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '600', background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Imprimir
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 28px', fontSize: '13px', fontWeight: '700', background: saving ? 'var(--text-muted)' : '#880000', color: '#fff', border: 'none', borderRadius: '7px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'Gravar'}
          </button>
        </div>
      </div>
    );
  }

  // ===== MODO VISUALIZAÇÃO =====
  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/lab/oticas')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {otica.codigo && <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', background: 'var(--surface-alt)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>{otica.codigo}</span>}
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>{otica.nome}</h1>
              {otica.nome_reduzido && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({otica.nome_reduzido})</span>}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
              {[otica.cidade, otica.uf].filter(Boolean).join('/') || 'Ótica Cliente'}
              {otica.lista_preco ? ` · Lista ${otica.lista_preco}` : ''}
              {otica.condicao_pgto ? ` · ${otica.condicao_pgto}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditando(true)} style={{ padding: '8px 16px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Editar
          </button>
          <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '600', background: '#880000', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nova OS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Total de OS', value: stats?.total_ordens ?? 0, color: 'var(--text)' },
          { label: 'Em Aberto', value: stats?.em_aberto ?? 0, color: 'var(--amber)' },
          { label: 'Prontos', value: stats?.prontos ?? 0, color: 'var(--green)' },
          { label: 'Valor Total', value: brl(stats?.valor_total ?? 0), color: 'var(--accent)', mono: true },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{k.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '14px' }}>
        {/* Info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', alignSelf: 'start' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Informações</div>
          <Field l="Código" v={otica.codigo} />
          <Field l="Lista de Preços" v={otica.lista_preco ? `Lista ${otica.lista_preco}` : null} />
          <Field l="Cond. Pagamento" v={otica.condicao_pgto} />
          <Field l="Classificação" v={otica.classificacao_cli} />
          <Field l="Tipo Fechamento" v={otica.tipo_fechamento} />
          <Field l="Via Transporte" v={otica.via_transporte} />
          <Field l="CNPJ" v={otica.cnpj} />
          <Field l="Insc. Estadual" v={otica.inscricao_estadual} />
          <Field l="Telefone" v={otica.telefone} />
          <Field l="E-mail" v={otica.email} />
          <Field l="Endereço" v={otica.endereco} />
          <Field l="Bairro" v={otica.bairro} />
          <Field l="Cidade/UF" v={[otica.cidade, otica.uf].filter(Boolean).join('/')} />
          <Field l="CEP" v={otica.cep} />
          <Field l="Observação" v={otica.observacao} />
          {otica.limite_credito && <Field l="Limite Crédito" v={brl(Number(otica.limite_credito))} />}
        </div>

        {/* OS History */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Histórico de Ordens — {ordens.length} OS</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={filtroOS}
                onChange={e => setFiltroOS(e.target.value)}
                placeholder="Buscar Nº OS, ref., cont. interno..."
                style={{ padding: '5px 10px', fontSize: '12px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', outline: 'none', fontFamily: 'var(--mono)', width: '220px' }}
              />
              {filtroOS && (
                <button onClick={() => setFiltroOS('')}
                  style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              )}
              <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)}
                style={{ fontSize: '12px', color: '#880000', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', whiteSpace: 'nowrap' }}>
                + Nova OS →
              </button>
            </div>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(() => {
            const f = filtroOS.trim().toLowerCase();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filtradas = f ? ordens.filter((o: any) =>
              String(o.numero).padStart(4,'0').includes(f) ||
              String(o.numero).includes(f) ||
              (o.ref_otica ?? '').toLowerCase().includes(f) ||
              (o.cont_interno ?? '').toLowerCase().includes(f)
            ) : ordens;
            if (filtradas.length === 0) return (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                {filtroOS ? `Nenhuma OS encontrada para "${filtroOS}"` : 'Nenhuma OS para esta ótica.'}
              </div>
            );
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nº OS', 'Data', 'Ref.', 'Cont. Int.', 'Serviços', 'Total', 'Previsão', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {filtradas.map((o: any) => (
                    <tr key={o.id} onClick={() => navigate(`/lab/ordens/${o.id}`)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '9px 10px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: '#880000' }}>#{String(o.numero).padStart(4, '0')}</td>
                      <td style={{ padding: '9px 10px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.created_at ? o.created_at.slice(0,10).split('-').reverse().join('/') : '—'}</td>
                      <td style={{ padding: '9px 10px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.ref_otica ?? '—'}</td>
                      <td style={{ padding: '9px 10px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.cont_interno ?? '—'}</td>
                      <td style={{ padding: '9px 10px', fontSize: '11px', color: 'var(--text-dim)' }}>{o.servicos_count} serv.</td>
                      <td style={{ padding: '9px 10px', fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: '600' }}>{brl(o.total)}</td>
                      <td style={{ padding: '9px 10px', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>{o.previsao_entrega ? o.previsao_entrega.slice(0,10).split('-').reverse().join('/') : '—'}</td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: STATUS_COLOR[o.status] ?? 'var(--text-dim)', background: `${STATUS_COLOR[o.status] ?? 'var(--text-dim)'}18`, padding: '2px 7px', borderRadius: '20px' }}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
