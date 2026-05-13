import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';


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
  const [filtroOS, setFiltroOS] = useState('');
  const [filtroDataIni, setFiltroDataIni] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function imprimirRelatorio(nomeOtica: string, lista: any[]) {
    const ST: Record<string, string> = {
      aguardando:'AGUARDANDO', em_producao:'EM PRODUÇÃO',
      pronto:'PRONTO', entregue:'ENTREGUE', cancelado:'CANCELADO',
    };
    function fd(s: string | null) { return s ? s.slice(0,10).split('-').reverse().join('/') : '—'; }
    function mb(v: number) { return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

    const linhas = lista.map((o, i) => `
      <tr style="background:${i%2===0?'#d4d0c8':'#dedad2'}">
        <td style="padding:5px 8px;font-family:monospace;font-weight:900;color:#880000">#${String(o.numero).padStart(4,'0')}</td>
        <td style="padding:5px 8px;font-family:monospace">${fd(o.created_at)}</td>
        <td style="padding:5px 8px;font-family:monospace">${o.ref_otica||'—'}</td>
        <td style="padding:5px 8px;font-family:monospace">${o.cont_interno||'—'}</td>
        <td style="padding:5px 8px;text-align:center">${o.servicos_count||0}</td>
        <td style="padding:5px 8px;font-family:monospace;text-align:right;font-weight:700">${mb(o.total)}</td>
        <td style="padding:5px 8px;font-family:monospace">${fd(o.previsao_entrega)}</td>
        <td style="padding:5px 8px;font-weight:700;color:${
          o.status==='entregue'?'#444':o.status==='pronto'?'#006600':o.status==='cancelado'?'#880000':'#886600'
        }">${ST[o.status]||o.status}</td>
      </tr>`).join('');

    const total = lista.reduce((a, o) => a + (o.total||0), 0);
    const periodo = filtroDataIni||filtroDataFim
      ? `Período: ${fd(filtroDataIni)} a ${fd(filtroDataFim)}`
      : 'Todos os períodos';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>OS — ${nomeOtica}</title>
      <style>
        body{margin:16px;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#000}
        table{width:100%;border-collapse:collapse}
        th{background:#880000;color:#fff;padding:6px 8px;text-align:left;font-size:10px;letter-spacing:0.5px;white-space:nowrap}
        th.r,td.r{text-align:right}
        tr.foot{background:linear-gradient(90deg,#880000,#cc0000)}
        tr.foot td{color:#fff;font-weight:900;padding:6px 8px;font-family:monospace}
        @media print{@page{margin:10mm}}
      </style>
    </head><body>
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:15px;font-weight:900;text-transform:uppercase">${nomeOtica}</div>
        <div style="font-size:11px;color:#555">HISTÓRICO DE ORDENS DE SERVIÇO — ${lista.length} OS</div>
        <div style="font-size:10px;color:#888">${periodo}</div>
      </div>
      <table>
        <thead><tr>
          <th>Nº OS</th><th>DATA</th><th>REF. ÓTICA</th><th>CONT. INT.</th>
          <th style="text-align:center">SERV.</th><th class="r">TOTAL</th><th>PREVISÃO</th><th>STATUS</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr class="foot">
          <td colspan="5">TOTAL GERAL — ${lista.length} OS</td>
          <td class="r">${mb(total)}</td><td colspan="2"></td>
        </tr></tfoot>
      </table>
      <div style="margin-top:8px;font-size:9px;color:#aaa;text-align:right">
        Emitido em ${new Date().toLocaleString('pt-BR')} — UpÓticas Lab
      </div>
      <script>window.onload=function(){window.print();window.close()}<\/script>
    </body></html>`;

    const w = window.open('','_blank','width=900,height=650');
    if (w) { w.document.write(html); w.document.close(); }
  }

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

  // ===== MODO VISUALIZAÇÃO — RETRO =====
  const RV = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#880000,#cc0000)', hdrTxt:'#ffcccc', hdrBdr:'#aa2222', txt:'#000' };
  const RINP: React.CSSProperties = { padding:'5px 8px', fontSize:'12px', background:'#fff', border:'1px solid #999', color:'#000', outline:'none', fontFamily:"'Courier New', monospace", boxSizing:'border-box' };

  const ST_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    aguardando: { bg:'#fff8cc', color:'#886600', label:'AGUARDANDO' },
    em_producao:{ bg:'#cce0ff', color:'#003388', label:'EM PRODUÇÃO' },
    pronto:     { bg:'#ccffcc', color:'#006600', label:'PRONTO' },
    entregue:   { bg:'#e0e0e0', color:'#444',    label:'ENTREGUE' },
    cancelado:  { bg:'#ffcccc', color:'#880000', label:'CANCELADO' },
  };

  function fmtD(s: string | null) {
    if (!s) return '—';
    return s.slice(0,10).split('-').reverse().join('/');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordensFiltradas = ordens.filter((o: any) => {
    const txt = filtroOS.trim().toLowerCase();
    const data = o.created_at ? o.created_at.slice(0,10) : '';
    if (txt && !String(o.numero).padStart(4,'0').includes(txt) && !String(o.numero).includes(txt) &&
        !(o.ref_otica ?? '').toLowerCase().includes(txt) && !(o.cont_interno ?? '').toLowerCase().includes(txt)) return false;
    if (filtroDataIni && data < filtroDataIni) return false;
    if (filtroDataFim && data > filtroDataFim) return false;
    return true;
  });

  const temFiltro = filtroOS || filtroDataIni || filtroDataFim;

  return (
    <div style={{ padding:'12px', height:'100%', display:'flex', flexDirection:'column', background:RV.bg, fontFamily:"'Montserrat', sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', gap:'8px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <button onClick={() => navigate('/lab/oticas')}
            style={{ padding:'4px 10px', fontSize:'11px', fontWeight:'700', background:RV.alt, color:RV.txt, border:`1px outset ${RV.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
            ← VOLTAR
          </button>
          <div style={{ background:RV.hdr, color:RV.hdrTxt, padding:'5px 14px', fontSize:'13px', fontWeight:'700', letterSpacing:'1px', border:`2px outset ${RV.hdrBdr}` }}>
            {otica.codigo && <span style={{ fontFamily:"'Courier New', monospace", marginRight:'8px', opacity:0.8 }}>{otica.codigo}</span>}
            {otica.nome}
            {otica.nome_reduzido && <span style={{ fontSize:'11px', opacity:0.8, marginLeft:'8px' }}>({otica.nome_reduzido})</span>}
          </div>
          <span style={{ fontSize:'11px', color:'#555' }}>{[otica.cidade, otica.uf].filter(Boolean).join('/')}{otica.lista_preco ? ` · Lista ${otica.lista_preco}` : ''}</span>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          <button onClick={() => setEditando(true)}
            style={{ padding:'5px 12px', fontSize:'11px', fontWeight:'700', background:RV.alt, color:RV.txt, border:`1px outset ${RV.bdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
            Editar
          </button>
          <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)}
            style={{ padding:'5px 14px', fontSize:'12px', fontWeight:'700', background:'#880000', color:RV.hdrTxt, border:`1px outset ${RV.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
            + NOVA OS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
        {[
          { label:'TOTAL DE OS', val: stats?.total_ordens ?? 0, color:'#000' },
          { label:'EM ABERTO',   val: stats?.em_aberto ?? 0,   color:'#886600' },
          { label:'PRONTOS',     val: stats?.prontos ?? 0,      color:'#006600' },
          { label:'VALOR TOTAL', val: brl(stats?.valor_total ?? 0), color:'#880000', str:true },
        ].map(({ label, val, color, str }) => (
          <div key={label} style={{ background:RV.panel, border:`2px outset ${RV.bdr}`, padding:'6px 16px', flexShrink:0 }}>
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#666', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            <div style={{ fontSize:str ? '16px' : '22px', fontWeight:'900', color, fontFamily:"'Courier New', monospace", lineHeight:'1.2' }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'200px 1fr', gap:'8px', overflow:'hidden', minHeight:0 }}>

        {/* Info */}
        <div style={{ background:RV.panel, border:`2px inset ${RV.bdr}`, padding:'10px', overflowY:'auto', alignSelf:'start' }}>
          <div style={{ background:RV.hdr, color:RV.hdrTxt, padding:'3px 8px', fontSize:'10px', fontWeight:'700', letterSpacing:'1px', marginBottom:'8px', border:`1px outset ${RV.hdrBdr}` }}>INFORMAÇÕES</div>
          {[
            ['CÓDIGO', otica.codigo],
            ['LISTA DE PREÇOS', otica.lista_preco ? `Lista ${otica.lista_preco}` : null],
            ['COND. PAGAMENTO', otica.condicao_pgto],
            ['CNPJ', otica.cnpj],
            ['IE', otica.inscricao_estadual],
            ['TELEFONE', otica.telefone],
            ['E-MAIL', otica.email],
            ['ENDEREÇO', otica.endereco],
            ['BAIRRO', otica.bairro],
            ['CIDADE/UF', [otica.cidade, otica.uf].filter(Boolean).join('/')],
            ['CEP', otica.cep],
            ['OBSERVAÇÃO', otica.observacao],
          ].filter(([, v]) => v).map(([l, v]) => (
            <div key={String(l)} style={{ marginBottom:'6px', borderBottom:`1px solid ${RV.bdr}`, paddingBottom:'4px' }}>
              <div style={{ fontSize:'9px', fontWeight:'700', color:'#666', textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</div>
              <div style={{ fontSize:'11px', color:RV.txt, fontFamily:"'Courier New', monospace", wordBreak:'break-all' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* OS History */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>

          {/* Filtros */}
          <div className="no-print" style={{ background:RV.panel, border:`2px outset ${RV.bdr}`, padding:'7px 12px', marginBottom:'6px', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
            <input value={filtroOS} onChange={e => setFiltroOS(e.target.value)}
              placeholder="Buscar Nº OS, ref., cont. int..." style={{ ...RINP, width:'190px' }} />
            <input type="date" value={filtroDataIni} onChange={e => setFiltroDataIni(e.target.value)} style={{ ...RINP, width:'120px' }} />
            <span style={{ fontSize:'11px', color:'#555' }}>até</span>
            <input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} style={{ ...RINP, width:'120px' }} />
            {temFiltro && (
              <button onClick={() => { setFiltroOS(''); setFiltroDataIni(''); setFiltroDataFim(''); }}
                style={{ padding:'4px 10px', fontSize:'11px', fontWeight:'700', background:RV.alt, color:'#880000', border:`1px outset ${RV.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
                ✕ LIMPAR
              </button>
            )}
            <button onClick={() => imprimirRelatorio(otica.nome, ordensFiltradas)}
              style={{ padding:'4px 12px', fontSize:'11px', fontWeight:'700', background:'#003388', color:'#fff', border:'1px outset #003388', cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
              🖨️ IMPRIMIR RELATÓRIO
            </button>
          </div>

          {/* Tabela */}
          <div style={{ background:RV.hdr, color:RV.hdrTxt, padding:'4px 10px', fontSize:'11px', fontWeight:'700', letterSpacing:'0.5px', border:`2px outset ${RV.hdrBdr}`, borderBottom:'none' }}>
            HISTÓRICO DE ORDENS — {ordensFiltradas.length} OS{temFiltro ? ` (filtrado de ${ordens.length})` : ''}
          </div>
          <div style={{ flex:1, overflowY:'auto', border:`2px inset ${RV.bdr}` }}>
            {ordensFiltradas.length === 0 ? (
              <div style={{ padding:'32px', textAlign:'center', color:'#555', fontFamily:"'Courier New', monospace" }}>
                {temFiltro ? 'Nenhuma OS encontrada com esse filtro.' : 'Nenhuma OS para esta ótica.'}
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ position:'sticky', top:0 }}>
                  <tr style={{ background:RV.hdr }}>
                    {['Nº OS','DATA','REF.','CONT. INT.','SERV.','TOTAL','PREVISÃO','STATUS'].map(h => (
                      <th key={h} style={{ padding:'5px 8px', textAlign: h==='TOTAL'?'right':'left', fontSize:'10px', fontWeight:'700', color:RV.hdrTxt, border:`1px solid ${RV.hdrBdr}`, whiteSpace:'nowrap', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {ordensFiltradas.map((o: any, i: number) => {
                    const st = ST_BADGE[o.status] || { bg:'#eee', color:'#333', label: String(o.status).toUpperCase() };
                    return (
                      <tr key={o.id} onClick={() => navigate(`/lab/ordens/${o.id}`)}
                        style={{ background: i%2===0 ? RV.panel : RV.alt, borderBottom:`1px solid ${RV.bdr}`, cursor:'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background='#880000')}
                        onMouseLeave={e => (e.currentTarget.style.background= i%2===0 ? RV.panel : RV.alt)}>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'900', color:'#880000' }}>#{String(o.numero).padStart(4,'0')}</td>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:'#333', whiteSpace:'nowrap' }}>{fmtD(o.created_at)}</td>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:'#333' }}>{o.ref_otica||'—'}</td>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:'#333' }}>{o.cont_interno||'—'}</td>
                        <td style={{ padding:'6px 8px', fontSize:'11px', color:'#333', textAlign:'center' }}>{o.servicos_count}</td>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'700', color:RV.txt, textAlign:'right', whiteSpace:'nowrap' }}>{brl(o.total)}</td>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'11px', color:'#333', whiteSpace:'nowrap' }}>{fmtD(o.previsao_entrega)}</td>
                        <td style={{ padding:'6px 8px' }}>
                          <span style={{ fontSize:'10px', fontWeight:'700', color:st.color, background:st.bg, padding:'2px 6px', border:`1px solid ${st.color}`, whiteSpace:'nowrap' }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:RV.hdr }}>
                    <td colSpan={5} style={{ padding:'5px 8px', fontSize:'11px', fontWeight:'700', color:RV.hdrTxt }}>TOTAL</td>
                    <td style={{ padding:'5px 8px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'900', color:RV.hdrTxt, textAlign:'right' }}>
                      {brl(ordensFiltradas.reduce((a: number, o: any) => a + (o.total||0), 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
