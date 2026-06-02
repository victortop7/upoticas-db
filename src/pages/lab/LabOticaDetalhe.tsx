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

const RX = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#005500,#008800)', hdrTxt:'#ccffcc', hdrBdr:'#007700', txt:'#000' };
const INP: React.CSSProperties = {
  width: '100%', padding: '5px 7px', fontSize: '12px', background: '#fff',
  border: `1px solid ${RX.bdr}`, borderRadius: '0', color: RX.txt,
  outline: 'none', boxSizing: 'border-box', fontFamily: "'Courier New', monospace",
};
const LBL: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', color: '#444',
  textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px',
};
const SEC: React.CSSProperties = {
  background: RX.panel, border: `2px inset ${RX.bdr}`,
  padding: '12px 14px',
};
const SEC_TITLE: React.CSSProperties = {
  fontSize: '10px', fontWeight: '700', color: '#005500', textTransform: 'uppercase',
  letterSpacing: '1px', marginBottom: '10px', borderBottom: `1px solid ${RX.bdr}`, paddingBottom: '5px',
};
const TH: React.CSSProperties = {
  padding: '5px 6px', fontSize: '10px', fontWeight: '700', color: RX.hdrTxt,
  textTransform: 'uppercase', background: '#005500', borderBottom: `1px solid ${RX.hdrBdr}`,
  whiteSpace: 'nowrap', textAlign: 'center',
};
const TD: React.CSSProperties = { padding: '2px 3px', verticalAlign: 'middle' };
const TINP: React.CSSProperties = {
  width: '100%', padding: '3px 5px', fontSize: '11px', background: '#fff',
  border: `1px solid ${RX.bdr}`, borderRadius: '0', color: RX.txt,
  outline: 'none', fontFamily: "'Courier New', monospace",
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
  const [confirmarGravar, setConfirmarGravar] = useState(false);
  const [filtroOS, setFiltroOS] = useState('');
  const [filtroDataIni, setFiltroDataIni] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [listaNomes, setListaNomes] = useState<string[]>(['PREÇO 1','PREÇO 2','PREÇO 3','PREÇO 4','PREÇO 5']);
  const [listasAtivas, setListasAtivas] = useState(5);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function imprimirRelatorio(oticaId: string, nomeOtica: string, lista: any[]) {
    const ST: Record<string, { label: string; color: string }> = {
      aguardando:  { label:'AGUARDANDO',   color:'#886600' },
      em_producao: { label:'EM PRODUÇÃO',  color:'#003388' },
      pronto:      { label:'PRONTO',       color:'#006600' },
      entregue:    { label:'ENTREGUE',     color:'#444' },
      cancelado:   { label:'CANCELADO',    color:'#005500' },
    };
    function fd(s: string | null) { return s ? s.slice(0,10).split('-').reverse().join('/') : '—'; }
    function mb(v: number) { return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

    // Carrega serviços detalhados
    const p = new URLSearchParams({ otica_id: oticaId });
    if (filtroDataIni) p.set('data_ini', filtroDataIni);
    if (filtroDataFim) p.set('data_fim', filtroDataFim);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let servicosPorOS: Record<string, any[]> = {};
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await api.get<{ ordens: any[]; servicos: any[] }>(`/lab/relatorios/servicos?${p}`);
      r.servicos.forEach(s => {
        if (!servicosPorOS[s.ordem_id]) servicosPorOS[s.ordem_id] = [];
        servicosPorOS[s.ordem_id].push(s);
      });
    } catch { servicosPorOS = {}; }

    const periodo = filtroDataIni||filtroDataFim
      ? `${fd(filtroDataIni)} a ${fd(filtroDataFim)}`
      : 'Todos os períodos';

    const blocos = lista.map(o => {
      const svcs = servicosPorOS[o.id] || [];
      const st = ST[o.status] || { label: String(o.status).toUpperCase(), color:'#333' };

      const svcsHtml = svcs.length > 0
        ? svcs.map(s => `
          <tr style="background:#f0ede8">
            <td style="padding:3px 8px 3px 28px;font-family:monospace;font-size:10px;color:#555">${s.codigo||''}</td>
            <td style="padding:3px 8px;font-size:10px;color:#333" colspan="2">${s.descricao||''}</td>
            <td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:center">${Number(s.qtd||0).toFixed(2)}</td>
            <td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:right">${mb(s.valor_unit||0)}</td>
            <td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:center">${s.perc_desc>0?Number(s.perc_desc).toFixed(1)+'%':'—'}</td>
            <td style="padding:3px 8px;font-family:monospace;font-size:10px;text-align:right;font-weight:700">${mb(s.total||0)}</td>
          </tr>`).join('')
        : `<tr style="background:#f0ede8"><td colspan="7" style="padding:3px 28px;font-size:10px;color:#aaa;font-style:italic">Sem serviços registrados</td></tr>`;

      return `
        <tr style="background:#005500;page-break-inside:avoid">
          <td style="padding:5px 8px;font-family:monospace;font-weight:900;color:#fff;font-size:12px">#${String(o.numero).padStart(4,'0')}</td>
          <td style="padding:5px 8px;font-family:monospace;color:#ccffcc;font-size:10px">${fd(o.created_at)}</td>
          <td style="padding:5px 8px;font-family:monospace;color:#ccffcc;font-size:10px">Ref: ${o.ref_otica||'—'}</td>
          <td style="padding:5px 8px;font-family:monospace;color:#ccffcc;font-size:10px">CI: ${o.cont_interno||'—'}</td>
          <td colspan="2" style="padding:5px 8px;font-size:10px;font-weight:700;color:${st.color};background:#fff3e0">${st.label}</td>
          <td style="padding:5px 8px;font-family:monospace;font-weight:900;color:#fff;text-align:right">${mb(o.total||0)}</td>
        </tr>
        ${svcsHtml}
        <tr><td colspan="7" style="height:4px;background:#c8c4b0"></td></tr>`;
    }).join('');

    const totalGeral = lista.reduce((a, o) => a + (o.total||0), 0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Relatório — ${nomeOtica}</title>
      <style>
        *{box-sizing:border-box}
        body{margin:12px;font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff}
        table{width:100%;border-collapse:collapse}
        .hdr th{background:#005500;color:#fff;padding:5px 8px;text-align:left;font-size:10px;letter-spacing:0.5px;white-space:nowrap}
        .hdr th.r{text-align:right}
        @page{margin:8mm}
        @media print{body{margin:0}}
      </style>
    </head><body>
      <div style="text-align:center;margin-bottom:12px;border-bottom:2px solid #005500;padding-bottom:8px">
        <div style="font-size:16px;font-weight:900;text-transform:uppercase;color:#005500">${nomeOtica}</div>
        <div style="font-size:11px;color:#333;margin-top:2px">RELATÓRIO DETALHADO DE ORDENS DE SERVIÇO</div>
        <div style="font-size:10px;color:#666">Período: ${periodo} &nbsp;|&nbsp; ${lista.length} OS &nbsp;|&nbsp; Total: ${mb(totalGeral)}</div>
        <div style="font-size:9px;color:#aaa">Emitido em ${new Date().toLocaleString('pt-BR')} — Conexão Lab</div>
      </div>
      <table>
        <thead class="hdr"><tr>
          <th>Nº OS</th><th>DATA</th><th>REF. ÓTICA</th><th>CONT. INTERNO</th>
          <th>CÓD</th><th>DESCRIÇÃO / SERVIÇO</th><th>QTD</th><th>V.UNIT</th><th>DESC%</th><th class="r">TOTAL</th>
        </tr></thead>
        <tbody>${blocos}</tbody>
        <tfoot>
          <tr style="background:#005500">
            <td colspan="9" style="padding:6px 8px;font-weight:900;color:#fff;font-size:12px">TOTAL GERAL — ${lista.length} OS</td>
            <td style="padding:6px 8px;font-family:monospace;font-weight:900;color:#fff;text-align:right;font-size:13px">${mb(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
      <script>window.onload=function(){window.print();window.close()}<\/script>
    </body></html>`;

    const w = window.open('','_blank','width=1000,height=700');
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

  useEffect(() => {
    // Carrega nomes das listas do laboratório
    api.get<Record<string, string>>('/lab/configuracoes').then(cfg => {
      const nomes = [
        cfg['tab_lista_1'] || 'PREÇO 1',
        cfg['tab_lista_2'] || 'PREÇO 2',
        cfg['tab_lista_3'] || 'PREÇO 3',
        cfg['tab_lista_4'] || 'PREÇO 4',
        cfg['tab_lista_5'] || 'PREÇO 5',
      ];
      setListaNomes(nomes);
      let ativas = 2;
      for (let i = 2; i < 5; i++) {
        if (cfg[`tab_lista_${i + 1}`]) ativas = i + 1;
      }
      setListasAtivas(Math.max(2, ativas));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (id === 'new') {
      setData({ otica: {}, ordens: [], stats: {} });
      setEditando(true);
      setLoading(false);
      // Busca próximo código disponível
      api.get<{ next: string }>('/lab/oticas?next_codigo=1').then(r => {
        setForm((f: Record<string, unknown>) => ({ ...f, codigo: r.next }));
      }).catch(() => {});
      return;
    }
    load();
  }, [id]);

  function nextField(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const container = (e.currentTarget as HTMLElement).closest('[data-form]');
    if (!container) return;
    const els = Array.from(container.querySelectorAll<HTMLElement>(
      'input:not([disabled]),select:not([disabled]),textarea:not([disabled])'
    )).filter(el => el.offsetParent !== null);
    const i = els.indexOf(e.currentTarget as HTMLElement);
    if (i >= 0 && i < els.length - 1) els[i + 1].focus();
  }

  function setF(k: string, v: unknown) { setForm((f: Record<string, unknown>) => ({ ...f, [k]: v })); }
  function setCont(arr: Contato[], i: number, k: keyof Contato, v: unknown) {
    return arr.map((c, j) => j === i ? { ...c, [k]: v } : c);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, contatos: [...contatos, ...contatosMfe], condicoes_pgto: condicoes };
      if (id === 'new') {
        const res = await api.post<{ id: string }>('/lab/oticas', payload);
        navigate(`/lab/oticas/${res.id}`);
      } else {
        await api.put(`/lab/oticas/${id}`, payload);
        setEditando(false);
        load();
      }
    } catch {}
    setSaving(false);
  }

  if (loading) return <div style={{ padding: '48px', color: '#666', fontSize: '14px' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '48px', color: '#cc0000', fontSize: '14px' }}>Ótica não encontrada.</div>;

  const { otica, ordens, stats } = data;

  // ===== MODO EDIÇÃO =====
  if (editando) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '16px', background: RX.bg, fontFamily: "'Montserrat', sans-serif" }} data-form="true">

        {/* Topo: código + nome + nome reduzido + datas */}
        <div style={{ ...SEC, marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 200px 160px', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={LBL}>Código</label>
              <input value={form.codigo ?? ''} onKeyDown={nextField} onChange={e => setF('codigo', e.target.value)} style={INP} placeholder="001" />
            </div>
            <div>
              <label style={LBL}>Razão Social *</label>
              <input value={form.nome ?? ''} onKeyDown={nextField} onChange={e => setF('nome', e.target.value)} style={INP} required />
            </div>
            <div>
              <label style={LBL}>Nome Reduzido</label>
              <input value={form.nome_reduzido ?? ''} onKeyDown={nextField} onChange={e => setF('nome_reduzido', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Data Cadastro</div>
              <div style={{ fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#555' }}>
                {otica.created_at ? new Date(otica.created_at).toLocaleDateString('pt-BR') : '—'}
              </div>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>Atualização</div>
              <div style={{ fontSize: '11px', fontFamily: "'Courier New', monospace", color: '#555' }}>{new Date().toLocaleDateString('pt-BR')}</div>
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
                <input value={form.cep ?? ''} onKeyDown={nextField} onChange={e => setF('cep', e.target.value)} style={INP} placeholder="00000-000" />
              </div>
              <div>
                <label style={LBL}>Endereço</label>
                <input value={form.endereco ?? ''} onKeyDown={nextField} onChange={e => setF('endereco', e.target.value)} style={INP} />
              </div>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Complemento</label>
              <input value={form.complemento ?? ''} onKeyDown={nextField} onChange={e => setF('complemento', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Bairro</label>
              <input value={form.bairro ?? ''} onKeyDown={nextField} onChange={e => setF('bairro', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px', gap: '8px', marginBottom: '6px' }}>
              <div><label style={LBL}>Cidade</label><input value={form.cidade ?? ''} onKeyDown={nextField} onChange={e => setF('cidade', e.target.value)} style={INP} /></div>
              <div><label style={LBL}>UF</label><input value={form.uf ?? ''} onKeyDown={nextField} onChange={e => setF('uf', e.target.value)} style={INP} maxLength={2} /></div>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Código Município/IBGE</label>
              <input value={form.codigo_ibge ?? ''} onKeyDown={nextField} onChange={e => setF('codigo_ibge', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>CNPJ</label>
              <input value={form.cnpj ?? ''} onKeyDown={nextField} onChange={e => setF('cnpj', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Inscrição Estadual</label>
              <input value={form.inscricao_estadual ?? ''} onKeyDown={nextField} onChange={e => setF('inscricao_estadual', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={LBL}>Inscrição Municipal</label>
              <input value={form.inscricao_municipal ?? ''} onKeyDown={nextField} onChange={e => setF('inscricao_municipal', e.target.value)} style={INP} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '8px', marginBottom: '6px' }}>
              <div><label style={LBL}>Área</label><input value={form.area ?? ''} onKeyDown={nextField} onChange={e => setF('area', e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Vendedor</label><input value={form.vendedor_id ?? ''} onKeyDown={nextField} onChange={e => setF('vendedor_id', e.target.value)} style={INP} /></div>
              <div>
                <label style={LBL}>Vias Pedido</label>
                <select value={form.vias_pedido ?? 1} onKeyDown={nextField} onChange={e => setF('vias_pedido', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                  {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: '8px' }}>
              <div><label style={LBL}>Rota</label><input value={form.rota_entrega ?? ''} onKeyDown={nextField} onChange={e => setF('rota_entrega', e.target.value)} style={INP} /></div>
              <div><label style={LBL}>Comissão (%)</label><input type="number" step="0.01" value={form.comissao ?? ''} onKeyDown={nextField} onChange={e => setF('comissao', e.target.value)} style={INP} /></div>
              <div>
                <label style={LBL}>Vias OS</label>
                <select value={form.vias_os ?? 0} onKeyDown={nextField} onChange={e => setF('vias_os', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
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
              <select value={form.lista_preco ?? 1} onKeyDown={nextField} onChange={e => setF('lista_preco', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                {listaNomes.slice(0, listasAtivas).map((nome, i) => (
                  <option key={i + 1} value={i + 1}>{nome}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Classificação</label>
              <select value={form.classificacao_cli ?? ''} onKeyDown={nextField} onChange={e => setF('classificacao_cli', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">—</option>
                <option value="A">A</option><option value="B">B</option>
                <option value="C">C</option><option value="D">D</option>
                <option value="E">E - Especial</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Tipo de Fechamento</label>
              <select value={form.tipo_fechamento ?? ''} onKeyDown={nextField} onChange={e => setF('tipo_fechamento', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">—</option>
                <option value="1">1 - Mensal</option>
                <option value="2">2 - Quinzenal</option>
                <option value="3">3 - Semanal</option>
                <option value="4">4 - Diário</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Tipo de Faturamento</label>
              <select value={form.tipo_faturamento ?? ''} onKeyDown={nextField} onChange={e => setF('tipo_faturamento', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">—</option>
                <option value="1">1 - Normal</option>
                <option value="2">2 - Contrato</option>
                <option value="3">3 - Convênio</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Via de Transporte</label>
              <select value={form.via_transporte ?? '0'} onKeyDown={nextField} onChange={e => setF('via_transporte', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="0">0 - Própria</option>
                <option value="1">1 - Transportadora</option>
                <option value="2">2 - Motoboy</option>
                <option value="3">3 - Correios</option>
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Tipo de ICMS</label>
              <select value={form.tipo_icms ?? ''} onKeyDown={nextField} onChange={e => setF('tipo_icms', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                <option value="">—</option>
                <option value="1">1 - Contribuinte</option>
                <option value="2">2 - Não Contribuinte</option>
                <option value="3">3 - Isento</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px', color: '#000', marginBottom: '12px' }}>
              <input type="checkbox" checked={!!form.banco_cobranca} onKeyDown={nextField} onChange={e => setF('banco_cobranca', e.target.checked ? 1 : 0)} />
              Banco de Cobrança
            </label>

            <div style={{ borderTop: '1px solid #b0aca4', paddingTop: '10px' }}>
              <div style={SEC_TITLE}>Crédito / Situação</div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Limite de Crédito (R$)</label>
                <input type="number" step="0.01" value={form.limite_credito ?? ''} onKeyDown={nextField} onChange={e => setF('limite_credito', e.target.value)} style={INP} />
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Dias em Débito p/ Aceitar Vendas</label>
                <input type="number" value={form.dias_debito ?? ''} onKeyDown={nextField} onChange={e => setF('dias_debito', e.target.value)} style={INP} />
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Situação</label>
                <select value={form.situacao ?? ''} onKeyDown={nextField} onChange={e => setF('situacao', e.target.value)} style={{ ...INP, fontFamily: "'Montserrat', sans-serif" }}>
                  <option value="">—</option>
                  <option value="A">A - Ativo</option>
                  <option value="I">I - Inativo</option>
                  <option value="B">B - Bloqueado</option>
                </select>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <label style={LBL}>Ramo de Atividade</label>
                <input value={form.ramo_atividade ?? ''} onKeyDown={nextField} onChange={e => setF('ramo_atividade', e.target.value)} style={INP} />
              </div>
              <div>
                <label style={LBL}>Matriz / Rede / Grupo</label>
                <input value={form.matriz_rede_grupo ?? ''} onKeyDown={nextField} onChange={e => setF('matriz_rede_grupo', e.target.value)} style={INP} />
              </div>
            </div>
          </div>

          {/* Coluna 3: Contato + Observações */}
          <div style={SEC}>
            <div style={SEC_TITLE}>Contato / Comunicação</div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Telefone Principal</label>
              <input value={form.telefone ?? ''} onKeyDown={nextField} onChange={e => setF('telefone', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>E-mail</label>
              <input type="email" value={form.email ?? ''} onKeyDown={nextField} onChange={e => setF('email', e.target.value)} style={INP} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Cond. Pagamento Padrão</label>
              <input value={form.condicao_pgto ?? ''} onKeyDown={nextField} onChange={e => setF('condicao_pgto', e.target.value)} style={INP} placeholder="VV, F30..." />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={LBL}>Desconto Padrão (%)</label>
              <input type="number" step="0.01" value={form.desconto_padrao ?? ''} onKeyDown={nextField} onChange={e => setF('desconto_padrao', e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Observações</label>
              <textarea value={form.observacao ?? ''} onKeyDown={nextField} onChange={e => setF('observacao', e.target.value)} rows={6}
                style={{ ...INP, fontFamily: "'Montserrat', sans-serif", resize: 'vertical' }} />
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
                <tr key={i} style={{ borderBottom: '1px solid #b0aca4' }}>
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
                <tr key={`mfe${i}`} style={{ borderBottom: '1px solid #b0aca4', background: '#dedad2' }}>
                  <td style={{ ...TD, fontSize: '10px', fontWeight: '700', color: '#666', paddingLeft: '6px', whiteSpace: 'nowrap' }}>ENVIO DE MFE</td>
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingBottom: '24px' }}>
          <button
            onClick={() => id === 'new' ? navigate('/lab/oticas') : setEditando(false)}
            style={{ padding: '7px 20px', fontSize: '12px', fontWeight: '700', background: RX.alt, color: RX.txt, border: `1px outset ${RX.bdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            CANCELAR
          </button>
          <button
            onClick={() => setConfirmarGravar(true)}
            disabled={saving}
            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
            style={{ padding: '7px 28px', fontSize: '12px', fontWeight: '700', background: '#005500', color: RX.hdrTxt, border: `1px outset ${RX.hdrBdr}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            GRAVAR
          </button>
        </div>

        {/* Modal confirmar gravar */}
        {confirmarGravar && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: RX.panel, border: `2px outset ${RX.bdr}`, width: '340px' }}>
              <div style={{ background: RX.hdr, color: RX.hdrTxt, padding: '6px 14px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>
                CONFIRMAR GRAVAÇÃO
              </div>
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', color: '#222' }}>
                  Deseja gravar os dados da ótica?
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setConfirmarGravar(false)}
                    style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', background: RX.alt, color: RX.txt, border: `2px outset ${RX.bdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                    NÃO
                  </button>
                  <button
                    onClick={() => { setConfirmarGravar(false); handleSave(); }}
                    style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', background: '#005500', color: RX.hdrTxt, border: `2px outset ${RX.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                    SIM, GRAVAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== MODO VISUALIZAÇÃO — RETRO =====
  const RV = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#005500,#008800)', hdrTxt:'#ccffcc', hdrBdr:'#007700', txt:'#000' };
  const RINP: React.CSSProperties = { padding:'5px 8px', fontSize:'12px', background:'#fff', border:'1px solid #999', color:'#000', outline:'none', fontFamily:"'Courier New', monospace", boxSizing:'border-box' };

  const ST_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    aguardando: { bg:'#fff8cc', color:'#886600', label:'AGUARDANDO' },
    em_producao:{ bg:'#cce0ff', color:'#003388', label:'EM PRODUÇÃO' },
    pronto:     { bg:'#ccffcc', color:'#006600', label:'PRONTO' },
    entregue:   { bg:'#e0e0e0', color:'#444',    label:'ENTREGUE' },
    cancelado:  { bg:'#ccffcc', color:'#005500', label:'CANCELADO' },
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
          <span style={{ fontSize:'11px', color:'#555' }}>{[otica.cidade, otica.uf].filter(Boolean).join('/')}{otica.lista_preco ? ` · ${listaNomes[otica.lista_preco - 1] || `Lista ${otica.lista_preco}`}` : ''}</span>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          <button onClick={() => setEditando(true)}
            style={{ padding:'5px 12px', fontSize:'11px', fontWeight:'700', background:RV.alt, color:RV.txt, border:`1px outset ${RV.bdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
            Editar
          </button>
          <button onClick={() => navigate(`/lab/ordens/nova?otica=${id}`)}
            style={{ padding:'5px 14px', fontSize:'12px', fontWeight:'700', background:'#005500', color:RV.hdrTxt, border:`1px outset ${RV.hdrBdr}`, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' }}>
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
          { label:'VALOR TOTAL', val: brl(stats?.valor_total ?? 0), color:'#005500', str:true },
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
            ['LISTA DE PREÇOS', otica.lista_preco ? (listaNomes[otica.lista_preco - 1] || `Lista ${otica.lista_preco}`) : null],
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
                style={{ padding:'4px 10px', fontSize:'11px', fontWeight:'700', background:RV.alt, color:'#005500', border:`1px outset ${RV.bdr}`, cursor:'pointer', fontFamily:'inherit' }}>
                ✕ LIMPAR
              </button>
            )}
            <button onClick={() => imprimirRelatorio(id!, otica.nome, ordensFiltradas)}
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
                        onMouseEnter={e => (e.currentTarget.style.background='#005500')}
                        onMouseLeave={e => (e.currentTarget.style.background= i%2===0 ? RV.panel : RV.alt)}>
                        <td style={{ padding:'6px 8px', fontFamily:"'Courier New', monospace", fontSize:'12px', fontWeight:'900', color:'#005500' }}>#{String(o.numero).padStart(4,'0')}</td>
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
