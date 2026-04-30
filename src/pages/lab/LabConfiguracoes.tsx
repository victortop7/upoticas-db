import { useState, useEffect, useCallback } from 'react';

type Opcao = 'numeracao' | 'parametros' | 'tabelas' | 'transportadoras' | 'vendedores' | null;
type TabNum = 'pedidos' | 'fechamentos' | 'notas' | 'faturas' | 'outros';

const OPCOES = [
  { num: 1, label: 'NUMERAÇÃO DE DOCUMENTOS', key: 'numeracao' as Opcao },
  { num: 3, label: 'PARÂMETROS DO SISTEMA',    key: 'parametros' as Opcao },
  { num: 4, label: 'TABELAS DO SISTEMA',        key: 'tabelas' as Opcao },
  { num: 5, label: 'CADASTRO DE TRANSPORTADORAS', key: 'transportadoras' as Opcao },
  { num: 6, label: 'CADASTRO DE VENDEDORES',    key: 'vendedores' as Opcao },
];

const TABS_NUM: { num: number; label: string; key: TabNum }[] = [
  { num: 1, label: 'PEDIDOS/OSS',   key: 'pedidos' },
  { num: 2, label: 'FECHAMENTOS',   key: 'fechamentos' },
  { num: 3, label: 'NOTAS FISCAIS', key: 'notas' },
  { num: 4, label: 'FATURAS',       key: 'faturas' },
  { num: 5, label: 'OUTROS',        key: 'outros' },
];

type Config = Record<string, string>;

const S = {
  panelHeader: (color = '#000080'): React.CSSProperties => ({
    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
    color: '#ffffff',
    textAlign: 'center' as const,
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    border: '2px outset #8080ff',
    borderBottom: 'none',
  }),
  panelBody: (): React.CSSProperties => ({
    border: '2px inset #808080',
    background: '#d4d0c8',
  }),
  row: (active: boolean, i: number): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: '5px 8px',
    cursor: 'pointer',
    background: active ? '#000080' : (i % 2 === 0 ? '#d4d0c8' : '#dedad2'),
    color: active ? '#ffffff' : '#000000',
    borderBottom: '1px solid #b0acA4',
    userSelect: 'none' as const,
  }),
  label: (): React.CSSProperties => ({
    flex: 1, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px',
  }),
  num: (active: boolean): React.CSSProperties => ({
    fontSize: '12px', fontWeight: 'bold',
    color: active ? '#ffff00' : '#000080',
    width: '16px', textAlign: 'right' as const, flexShrink: 0,
  }),
};

function DotField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: '#000000', whiteSpace: 'nowrap', fontWeight: 'bold', minWidth: '220px', letterSpacing: '0.3px' }}>
        {label}
      </span>
      <span style={{ flex: 1, borderBottom: '1px dotted #606060', minWidth: '20px', height: '1px', margin: '0 4px 4px' }} />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: type === 'date' ? '120px' : '80px',
          padding: '1px 4px',
          fontSize: '11px',
          fontFamily: "'Courier New', monospace",
          background: '#ffffff',
          border: '2px inset #808080',
          color: '#000000',
          textAlign: 'right',
        }}
      />
    </div>
  );
}

function NumeracaoContent({ tab, config, onChange }: {
  tab: TabNum; config: Config; onChange: (k: string, v: string) => void;
}) {
  if (tab === 'pedidos') {
    return (
      <div>
        <DotField label="PRÓXIMO PEDIDO A EMITIR"
          value={config.num_proximo_pedido ?? '1'}
          onChange={v => onChange('num_proximo_pedido', v)} />
        <DotField label="PRÓXIMA OS PADRÃO/FREEFORM A EMITIR"
          value={config.num_proximo_os_padrao ?? '1'}
          onChange={v => onChange('num_proximo_os_padrao', v)} />
        <DotField label="PRÓXIMA OS GARANTIA A EMITIR"
          value={config.num_proximo_os_garantia ?? '1'}
          onChange={v => onChange('num_proximo_os_garantia', v)} />
        <DotField label="PRÓXIMO ENCOMENDA/ROMANEIO A EMITIR"
          value={config.num_proximo_encomenda ?? '1'}
          onChange={v => onChange('num_proximo_encomenda', v)} />
        <DotField label="ÚLTIMA DATA DE PEDIDOS"
          value={config.num_ultima_data_pedidos ?? ''}
          onChange={v => onChange('num_ultima_data_pedidos', v)}
          type="date" />

        <div style={{ marginTop: '14px', border: '1px solid #a0a098' }}>
          <div style={{ background: '#000080', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', letterSpacing: '1px' }}>
            IMPORTAÇÃO PEDIDO ON-LINE
          </div>
          <div style={{ padding: '8px 10px', background: '#d4d0c8' }}>
            <DotField label="PRÓXIMA PRÉ-VENDA"
              value={config.num_proximo_prevenda ?? '1'}
              onChange={v => onChange('num_proximo_prevenda', v)} />
            <DotField label="PRÓXIMO PRÉ-SERVIÇO"
              value={config.num_proximo_preservico ?? '1'}
              onChange={v => onChange('num_proximo_preservico', v)} />
          </div>
        </div>

        <div style={{ marginTop: '14px', border: '1px solid #a0a098' }}>
          <div style={{ background: '#000080', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', letterSpacing: '1px' }}>
            OBSERVAÇÕES EM PEDIDOS
          </div>
          <div style={{ padding: '8px 10px', background: '#d4d0c8' }}>
            <textarea
              value={config.obs_pedidos ?? ''}
              onChange={e => onChange('obs_pedidos', e.target.value)}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '4px', fontSize: '11px',
                fontFamily: "'Courier New', monospace",
                background: '#ffffff', border: '2px inset #808080',
                color: '#000000', resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'fechamentos') {
    return (
      <div>
        <DotField label="PRÓXIMO FECHAMENTO A EMITIR"
          value={config.num_proximo_fechamento ?? '1'}
          onChange={v => onChange('num_proximo_fechamento', v)} />
      </div>
    );
  }

  if (tab === 'notas') {
    return (
      <div>
        <DotField label="PRÓXIMA NOTA FISCAL A EMITIR"
          value={config.num_proximo_nf ?? '1'}
          onChange={v => onChange('num_proximo_nf', v)} />
      </div>
    );
  }

  if (tab === 'faturas') {
    return (
      <div>
        <DotField label="PRÓXIMA FATURA A EMITIR"
          value={config.num_proximo_fatura ?? '1'}
          onChange={v => onChange('num_proximo_fatura', v)} />
      </div>
    );
  }

  return (
    <div>
      <DotField label="PRÓXIMO OUTRO DOCUMENTO"
        value={config.num_proximo_outro ?? '1'}
        onChange={v => onChange('num_proximo_outro', v)} />
    </div>
  );
}

export default function LabConfiguracoes() {
  const [opcao, setOpcao] = useState<Opcao>(null);
  const [tabNum, setTabNum] = useState<TabNum>('pedidos');
  const [config, setConfig] = useState<Config>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/lab/configuracoes', { credentials: 'include' })
      .then(r => r.json())
      .then((d: Config) => setConfig(d))
      .catch(() => {});
  }, []);

  const handleChange = useCallback((k: string, v: string) => {
    setConfig(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/lab/configuracoes', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const font: React.CSSProperties = { fontFamily: "'Courier New', Courier, monospace" };

  return (
    <div style={{ ...font, padding: '16px', minHeight: '100%', background: '#c8c4b0' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* ===== PAINEL OPÇÕES ===== */}
        <div style={{ width: '260px', flexShrink: 0 }}>
          <div style={S.panelHeader()}>OPÇÕES</div>
          <div style={S.panelBody()}>
            {OPCOES.map((op, i) => {
              const active = opcao === op.key;
              const enabled = op.key === 'numeracao';
              return (
                <div
                  key={op.key}
                  onClick={() => { if (enabled) { setOpcao(active ? null : op.key); setTabNum('pedidos'); } }}
                  style={{
                    ...S.row(active, i),
                    opacity: enabled ? 1 : 0.45,
                    cursor: enabled ? 'pointer' : 'default',
                    borderBottom: i < OPCOES.length - 1 ? '1px solid #b0acA4' : 'none',
                  }}
                  onMouseEnter={e => { if (enabled && !active) (e.currentTarget as HTMLElement).style.background = '#a0a4c8'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#d4d0c8' : '#dedad2'; }}
                >
                  <span style={S.label()}>{op.label}</span>
                  <span style={S.num(active)}>{op.num}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== PAINEL CONTEÚDO ===== */}
        {opcao === 'numeracao' && (
          <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* Sub-menu numeração */}
            <div style={{ width: '180px', flexShrink: 0 }}>
              <div style={S.panelHeader()}>NUMERAÇÃO</div>
              <div style={S.panelBody()}>
                {TABS_NUM.map((t, i) => {
                  const active = tabNum === t.key;
                  return (
                    <div
                      key={t.key}
                      onClick={() => setTabNum(t.key)}
                      style={{
                        ...S.row(active, i),
                        borderBottom: i < TABS_NUM.length - 1 ? '1px solid #b0acA4' : 'none',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#a0a4c8'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#d4d0c8' : '#dedad2'; }}
                    >
                      <span style={S.label()}>{t.label}</span>
                      <span style={S.num(active)}>{t.num}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo do sub-menu */}
            <div style={{ flex: 1 }}>
              <div style={S.panelHeader()}>
                {TABS_NUM.find(t => t.key === tabNum)?.label}
              </div>
              <div style={{ ...S.panelBody(), padding: '12px 14px' }}>
                <NumeracaoContent tab={tabNum} config={config} onChange={handleChange} />

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '3px 18px', fontSize: '11px', fontWeight: 'bold',
                      background: saving ? '#808080' : '#000080',
                      color: '#ffffff', border: '1px outset #8080ff',
                      cursor: saving ? 'default' : 'pointer',
                      fontFamily: 'inherit', letterSpacing: '0.5px',
                    }}
                  >
                    {saving ? 'SALVANDO...' : 'SALVAR'}
                  </button>
                  {saved && (
                    <span style={{ fontSize: '11px', color: '#006600', fontWeight: 'bold', alignSelf: 'center' }}>
                      ✔ SALVO
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!opcao && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px', color: '#606060', fontSize: '11px', letterSpacing: '0.5px' }}>
            SELECIONE UMA OPÇÃO
          </div>
        )}
      </div>
    </div>
  );
}
