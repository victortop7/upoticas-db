import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; nome: string; }
interface Servico { id: string; nome: string; valor_padrao: number; }
interface Usuario { id: string; nome: string; }

const OLHO_VAZIO = {
  esf_longe: '', cil_longe: '', eixo_longe: '', dnp: '', alt: '', adicao: '', prisma: '',
};

const COND_PGTO = [
  { code: 'VV', label: 'VV - PAGAMENTO À VISTA' },
  { code: 'F',  label: 'F - VENDA FATURADA' },
];

const INP: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: '13px',
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
  borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--mono)',
};

function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0];
}

function FieldLabel({ text }: { text: string }) {
  return (
    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {text}
    </label>
  );
}

function calcEsfPerto(esf: string, adicao: string): string {
  const e = parseFloat(esf.replace(',', '.'));
  const a = parseFloat(adicao.replace(',', '.'));
  if (isNaN(e) || isNaN(a)) return '';
  const v = e + a;
  return (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',');
}

type OlhoVal = typeof OLHO_VAZIO;

function OlhoForm({ title, val, setVal }: { title: string; val: OlhoVal; setVal: (v: OlhoVal) => void }) {
  const esfPerto = calcEsfPerto(val.esf_longe, val.adicao);
  const LABELS: Record<string, string> = { esf_longe: 'ESF', cil_longe: 'CIL', eixo_longe: 'EIXO', adicao: 'ADIÇÃO', dnp: 'DNP', alt: 'ALT', prisma: 'PRISMA' };
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
        {(['esf_longe', 'cil_longe', 'eixo_longe', 'adicao'] as const).map(k => (
          <div key={k}>
            <FieldLabel text={LABELS[k]} />
            <input
              value={val[k]}
              onChange={e => setVal({ ...val, [k]: e.target.value })}
              style={INP}
              placeholder={k === 'eixo_longe' ? '0' : '+0,00'}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {(['dnp', 'alt', 'prisma'] as const).map(k => (
          <div key={k}>
            <FieldLabel text={LABELS[k]} />
            <input value={val[k]} onChange={e => setVal({ ...val, [k]: e.target.value })} style={INP} />
          </div>
        ))}
        <div>
          <FieldLabel text="ESF PERTO" />
          <input value={esfPerto} readOnly style={{ ...INP, color: 'var(--text-dim)', background: 'var(--surface)' }} />
        </div>
      </div>
    </div>
  );
}

export default function LabNovaOrdem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [catalogo, setCatalogo] = useState<Servico[]>([]);
  const [operadores, setOperadores] = useState<Usuario[]>([]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const [oticaId, setOticaId] = useState(searchParams.get('otica') ?? '');
  const [operador, setOperador] = useState('');
  const [refOtica, setRefOtica] = useState('');
  const [previsao, setPrevisao] = useState(() => toYMD(addBusinessDays(new Date(), 5)));
  const [condPgto, setCondPgto] = useState('VV');
  const [textoGravura, setTextoGravura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [od, setOd] = useState({ ...OLHO_VAZIO });
  const [oe, setOe] = useState({ ...OLHO_VAZIO });
  const [armacao, setArmacao] = useState({ material: '', estojo: false, ponte: '', diametro: '', dplip: '', informacoes: '' });
  const [servicos, setServicos] = useState([{ descricao: '', qtd: '1', valor_unit: '', desconto: '0' }]);

  useEffect(() => {
    api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => {});
    api.get<Servico[]>('/lab/servicos').then(setCatalogo).catch(() => {});
    api.get<{ usuarios: Usuario[] }>('/usuarios').then(d => setOperadores(d.usuarios)).catch(() => {});
  }, []);

  function totalServico(s: typeof servicos[0]) {
    const qtd = parseFloat(s.qtd.replace(',', '.')) || 0;
    const val = parseFloat(s.valor_unit.replace(',', '.')) || 0;
    const desc = parseFloat(s.desconto.replace(',', '.')) || 0;
    return Math.max(0, qtd * val - desc);
  }

  const totalGeral = servicos.reduce((acc, s) => acc + totalServico(s), 0);

  function addServico() { setServicos(s => [...s, { descricao: '', qtd: '1', valor_unit: '', desconto: '0' }]); }
  function removeServico(i: number) { setServicos(s => s.filter((_, idx) => idx !== i)); }

  function applyServicoCatalogo(i: number, sv: Servico) {
    setServicos(s => s.map((item, idx) =>
      idx === i ? { ...item, descricao: sv.nome, valor_unit: sv.valor_padrao.toFixed(2).replace('.', ',') } : item
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!oticaId) { setErro('Selecione a ótica'); return; }

    const receitaPayload = (['D', 'E'] as const).map((olho, idx) => {
      const dados = idx === 0 ? od : oe;
      return {
        olho,
        esf_longe: parseFloat(dados.esf_longe.replace(',', '.')) || null,
        cil_longe: parseFloat(dados.cil_longe.replace(',', '.')) || null,
        eixo_longe: parseInt(dados.eixo_longe) || null,
        dnp: parseFloat(dados.dnp.replace(',', '.')) || null,
        alt: parseFloat(dados.alt.replace(',', '.')) || null,
        adicao: parseFloat(dados.adicao.replace(',', '.')) || null,
        esf_perto: parseFloat(calcEsfPerto(dados.esf_longe, dados.adicao).replace(',', '.')) || null,
        prisma: dados.prisma || null,
      };
    });

    const servicosPayload = servicos
      .filter(s => s.descricao.trim())
      .map(s => ({
        descricao: s.descricao,
        qtd: parseFloat(s.qtd.replace(',', '.')) || 1,
        valor_unit: parseFloat(s.valor_unit.replace(',', '.')) || 0,
        desconto: parseFloat(s.desconto.replace(',', '.')) || 0,
        total: totalServico(s),
      }));

    setSaving(true);
    try {
      const { id } = await api.post<{ id: string; numero: number }>('/lab/ordens', {
        otica_id: oticaId, operador: operador || null, ref_otica: refOtica || null,
        previsao_entrega: previsao || null, condicao_pgto: condPgto || null,
        texto_gravura: textoGravura || null, observacoes: observacoes || null,
        total: totalGeral, receita: receitaPayload,
        armacao: {
          material: armacao.material || null, estojo: armacao.estojo ? 1 : 0,
          ponte: parseFloat(armacao.ponte.replace(',', '.')) || null,
          diametro: parseFloat(armacao.diametro.replace(',', '.')) || null,
          dplip: parseFloat(armacao.dplip.replace(',', '.')) || null,
          informacoes: armacao.informacoes || null,
        },
        servicos: servicosPayload,
      });
      navigate(`/lab/ordens/${id}`);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/lab/ordens')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text)' }}>Nova Ordem de Serviço</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-dim)' }}>Preencha os dados da OS do laboratório</p>
        </div>
      </div>

      {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--red)' }}>{erro}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Informações da OS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '14px' }}>Informações da OS</div>

          {/* Linha 1: Ótica | Ref. Ótica | Previsão de Entrega */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <FieldLabel text="Ótica *" />
              <select value={oticaId} onChange={e => setOticaId(e.target.value)} required style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">Selecionar ótica...</option>
                {oticas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel text="Ref. Ótica" />
              <input value={refOtica} onChange={e => setRefOtica(e.target.value)} style={INP} placeholder="Nº na ótica" />
            </div>
            <div>
              <FieldLabel text="Previsão de Entrega (mín. 5 dias úteis)" />
              <input type="date" value={previsao} onChange={e => setPrevisao(e.target.value)} style={INP} />
            </div>
          </div>

          {/* Linha 2: Operador | Condição de Pagamento | Texto de Gravura */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <FieldLabel text="Operador" />
              <select value={operador} onChange={e => setOperador(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">— Selecionar operador</option>
                {operadores.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel text="Condição de Pagamento" />
              <select value={condPgto} onChange={e => setCondPgto(e.target.value)} style={{ ...INP, fontFamily: 'var(--sans)' }}>
                <option value="">—</option>
                {COND_PGTO.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel text="Texto de Gravura" />
              <input value={textoGravura} onChange={e => setTextoGravura(e.target.value)} style={INP} />
            </div>
          </div>
        </div>

        {/* Receita */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>Receita das Lentes</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <OlhoForm title="Olho Direito (OD)" val={od} setVal={setOd} />
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <OlhoForm title="Olho Esquerdo (OE)" val={oe} setVal={setOe} />
          </div>
        </div>

        {/* Armação */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '14px' }}>Armação</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div><FieldLabel text="Material" /><input value={armacao.material} onChange={e => setArmacao(a => ({ ...a, material: e.target.value }))} style={INP} /></div>
            <div><FieldLabel text="Ponte" /><input value={armacao.ponte} onChange={e => setArmacao(a => ({ ...a, ponte: e.target.value }))} style={INP} placeholder="mm" /></div>
            <div><FieldLabel text="Diâmetro" /><input value={armacao.diametro} onChange={e => setArmacao(a => ({ ...a, diametro: e.target.value }))} style={INP} placeholder="mm" /></div>
            <div><FieldLabel text="DPLIP" /><input value={armacao.dplip} onChange={e => setArmacao(a => ({ ...a, dplip: e.target.value }))} style={INP} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '7px' }}>
                <input type="checkbox" checked={armacao.estojo} onChange={e => setArmacao(a => ({ ...a, estojo: e.target.checked }))} />
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>Estojo</span>
              </label>
            </div>
          </div>
          <div>
            <FieldLabel text="Informações adicionais" />
            <input value={armacao.informacoes} onChange={e => setArmacao(a => ({ ...a, informacoes: e.target.value }))} style={INP} placeholder="Observações sobre a armação..." />
          </div>
        </div>

        {/* Serviços */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Serviços</div>
            <button type="button" onClick={addServico} style={{ fontSize: '12px', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>+ Adicionar linha</button>
          </div>
          {catalogo.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {catalogo.map(sv => (
                <button key={sv.id} type="button"
                  onClick={() => {
                    const idx = servicos.findIndex(s => !s.descricao);
                    if (idx >= 0) applyServicoCatalogo(idx, sv);
                    else setServicos(s => [...s, { descricao: sv.nome, qtd: '1', valor_unit: sv.valor_padrao.toFixed(2).replace('.', ','), desconto: '0' }]);
                  }}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  + {sv.nome}
                </button>
              ))}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Descrição', 'Qtd', 'Valor Unit.', 'Desconto', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicos.map((s, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 8px 6px 0' }}>
                    <input value={s.descricao} onChange={e => setServicos(sv => sv.map((x, j) => j === i ? { ...x, descricao: e.target.value } : x))} style={{ ...INP, width: '100%' }} placeholder="Nome do serviço..." />
                  </td>
                  <td style={{ padding: '6px 8px', width: '60px' }}>
                    <input value={s.qtd} onChange={e => setServicos(sv => sv.map((x, j) => j === i ? { ...x, qtd: e.target.value } : x))} style={{ ...INP, width: '100%', textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '6px 8px', width: '100px' }}>
                    <input value={s.valor_unit} onChange={e => setServicos(sv => sv.map((x, j) => j === i ? { ...x, valor_unit: e.target.value } : x))} style={{ ...INP, width: '100%', textAlign: 'right' }} placeholder="0,00" />
                  </td>
                  <td style={{ padding: '6px 8px', width: '90px' }}>
                    <input value={s.desconto} onChange={e => setServicos(sv => sv.map((x, j) => j === i ? { ...x, desconto: e.target.value } : x))} style={{ ...INP, width: '100%', textAlign: 'right' }} placeholder="0,00" />
                  </td>
                  <td style={{ padding: '6px 8px', width: '90px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text)', textAlign: 'right' }}>
                    R$ {totalServico(s).toFixed(2).replace('.', ',')}
                  </td>
                  <td style={{ padding: '6px 0 6px 8px', width: '30px' }}>
                    {servicos.length > 1 && <button type="button" onClick={() => removeServico(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--mono)' }}>Total: R$ {totalGeral.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>

        {/* Observações */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <FieldLabel text="Observações" />
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
            style={{ ...INP, fontFamily: 'var(--sans)', resize: 'vertical', width: '100%' }} placeholder="Observações gerais da OS..." />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/lab/ordens')} style={{ padding: '11px 24px', fontSize: '14px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '11px 28px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--text-muted)' : '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'Criar OS →'}
          </button>
        </div>
      </form>
    </div>
  );
}
