import Icone from './Icone';

// Bloco da OS dentro da tela de venda (Venda + OS numa tela só).
// Definido no módulo pra os campos não perderem o foco a cada tecla.

export type OSForm = Record<string, string>;
export const OS_VAZIA: OSForm = { tipo: 'oculos_grau' };

const TIPOS = [
  { value: 'oculos_grau', label: 'Óculos de grau' },
  { value: 'oculos_sol', label: 'Óculos de sol' },
  { value: 'lente_contato', label: 'Lente de contato' },
  { value: 'conserto', label: 'Conserto' },
  { value: 'outro', label: 'Outro' },
];
const LINHAS = [
  { label: 'Longe OD', p: 'longe_od' }, { label: 'Longe OE', p: 'longe_oe' },
  { label: 'Perto OD', p: 'perto_od' }, { label: 'Perto OE', p: 'perto_oe' },
];

interface Props {
  ativo: boolean;
  onAtivo: (v: boolean) => void;
  value: OSForm;
  onChange: (campo: string, valor: string) => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}

export default function OSNaVenda({ ativo, onAtivo, value, onChange, inputStyle, labelStyle }: Props) {
  const mono: React.CSSProperties = { ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'center', padding: '7px 6px' };
  const v = (k: string) => value[k] ?? '';
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginTop: 6, marginBottom: 14, overflow: 'hidden' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface-alt)', cursor: 'pointer', borderBottom: ativo ? '1px solid var(--border)' : 'none' }}>
        <input type="checkbox" checked={ativo} onChange={e => onAtivo(e.target.checked)} />
        <Icone nome="os" size={15} color="var(--text-dim)" />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Gerar ordem de serviço junto</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>receita, lente e médico. O pagamento fica na venda.</span>
      </label>

      {ativo && (
        <div className="modal-cols" style={{ padding: 14 }}>
          <div>
            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select style={inputStyle} value={v('tipo') || 'oculos_grau'} onChange={e => onChange('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Médico / clínica</label>
                <input style={inputStyle} value={v('medico')} onChange={e => onChange('medico', e.target.value)} placeholder="Nome do médico" />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Armação</label>
              <input style={inputStyle} value={v('armacao_desc')} onChange={e => onChange('armacao_desc', e.target.value)} placeholder="Preenche sozinho ao escolher do estoque" />
            </div>
            <div>
              <label style={labelStyle}>Lente</label>
              <input style={inputStyle} value={v('lente_desc')} onChange={e => onChange('lente_desc', e.target.value)} placeholder="Tipo, índice, tratamento, marca" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Receita</label>
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, minmax(0, 1fr))', gap: 6, alignItems: 'center' }}>
              <span />
              {['Esf', 'Cil', 'Eixo'].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{h}</span>)}
              {LINHAS.map(l => (
                <div key={l.p} style={{ display: 'contents' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{l.label}</span>
                  {['esf', 'cil', 'eixo'].map(c => (
                    <input key={c} type="number" step={c === 'eixo' ? '1' : '0.25'} style={mono} placeholder="-"
                      value={v(`${l.p}_${c}`)} onChange={e => onChange(`${l.p}_${c}`, e.target.value)} />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
              {[{ k: 'dp', l: 'DP (mm)', s: '0.5' }, { k: 'altura', l: 'Altura', s: '0.5' }, { k: 'adicao', l: 'Adição', s: '0.25' }].map(f => (
                <div key={f.k}>
                  <label style={labelStyle}>{f.l}</label>
                  <input type="number" step={f.s} style={mono} placeholder="-" value={v(f.k)} onChange={e => onChange(f.k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
