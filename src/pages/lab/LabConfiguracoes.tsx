import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type Opcao = 'numeracao' | 'dados_lab' | 'parametros' | 'tabelas' | 'transportadoras' | 'vendedores' | null;
type TabNum = 'pedidos' | 'fechamentos' | 'notas' | 'faturas' | 'outros';
type TabParam = 'estoque' | 'pedidos' | 'fluxo' | 'recibos' | 'notas' | 'faturamento' | 'contas_receber' | 'contas_pagar' | 'bancario' | 'limites';
type TabTabela = 'movimentos_estoque' | 'fornecedores' | 'cobrancas' | 'despesas' | 'movimentos' | 'documentos' | 'bancos' | 'quebras_perdas' | 'listas' | 'taxas_icms' | 'feriados' | 'remarcacoes';
type Config = Record<string, string>;


const TABS_NUM: { num: number; label: string; key: TabNum }[] = [
  { num: 1, label: 'PEDIDOS/OSS',   key: 'pedidos'     },
  { num: 2, label: 'FECHAMENTOS',   key: 'fechamentos'  },
  { num: 3, label: 'NOTAS FISCAIS', key: 'notas'       },
  { num: 4, label: 'FATURAS',       key: 'faturas'     },
  { num: 5, label: 'OUTROS',        key: 'outros'      },
];

const TABS_PARAM: { num: number | string; label: string; key: TabParam }[] = [
  { num: 1,   label: 'ESTOQUE/MOVIMENTAÇÃO',        key: 'estoque'        },
  { num: 2,   label: 'PEDIDOS/ORDENS DE SERVIÇOS',  key: 'pedidos'        },
  { num: 3,   label: 'FLUXO DE PRODUÇÃO',           key: 'fluxo'          },
  { num: 5,   label: 'RECIBOS',                     key: 'recibos'        },
  { num: 6,   label: 'NOTAS FISCAIS',               key: 'notas'          },
  { num: 7,   label: 'FATURAMENTO',                 key: 'faturamento'    },
  { num: 'R', label: 'CONTAS A RECEBER',            key: 'contas_receber' },
  { num: 'P', label: 'CONTAS A PAGAR',              key: 'contas_pagar'   },
  { num: 'B', label: 'CONTROLE BANCÁRIO',           key: 'bancario'       },
  { num: 0,   label: 'LIMITES/DATAS DE PESQUISA',   key: 'limites'        },
];

const CADASTRO_DESEJADO: { num: number | string; label: string; key: TabTabela }[] = [
  { num: 2,   label: 'MOVIMENTOS DE ESTOQUE',     key: 'movimentos_estoque' },
  { num: 3,   label: 'TIPOS DE FORNECEDORES',     key: 'fornecedores'       },
  { num: 4,   label: 'TIPOS DE COBRANÇAS',        key: 'cobrancas'          },
  { num: 5,   label: 'TIPOS DE DESPESAS',         key: 'despesas'           },
  { num: 6,   label: 'TIPOS DE MOVIMENTOS',       key: 'movimentos'         },
  { num: 7,   label: 'TIPOS DE DOCUMENTOS',       key: 'documentos'         },
  { num: 8,   label: 'CADASTRO DE BANCOS',        key: 'bancos'             },
  { num: 0,   label: 'TIPOS DE QUEBRAS/PERDAS',   key: 'quebras_perdas'     },
  { num: 'L', label: 'LISTAS DE PREÇOS',          key: 'listas'             },
  { num: 1,   label: 'TAXAS DE ICMS',             key: 'taxas_icms'         },
  { num: 'Z', label: 'FERIADOS/DIAS NÃO ÚTEIS',   key: 'feriados'           },
  { num: 'R', label: 'TIPOS DE REMARCAÇÕES',      key: 'remarcacoes'        },
];

const S = {
  panelHeader: (color = '#005500'): React.CSSProperties => ({
    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
    color: '#ffffff',
    textAlign: 'center' as const,
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    border: '2px outset #007700',
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
    background: active ? '#005500' : (i % 2 === 0 ? '#d4d0c8' : '#dedad2'),
    color: active ? '#ffffff' : '#000000',
    borderBottom: '1px solid #b0acA4',
    userSelect: 'none' as const,
  }),
  label: (): React.CSSProperties => ({
    flex: 1, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px',
  }),
  num: (active: boolean): React.CSSProperties => ({
    fontSize: '12px', fontWeight: 'bold',
    color: active ? '#ffff00' : '#005500',
    width: '16px', textAlign: 'right' as const, flexShrink: 0,
  }),
};

const SN = [{ value: 'S', label: 'S - SIM' }, { value: 'N', label: 'N - NÃO' }];
const DEC_OPTS = [
  { value: '0', label: '0 - SEM CASAS' }, { value: '1', label: '1 - UMA' },
  { value: '2', label: '2 - DUAS' }, { value: '3', label: '3 - TRÊS' },
];
const VIAS_OPTS = ['0','1','2','3','4'].map(v => ({ value: v, label: v }));

function SelectField({ label, value, onChange, options, minW = 220 }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; minW?: number;
}) {
  const inp: React.CSSProperties = { padding: '1px 2px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#ffffff', border: '2px inset #808080', color: '#000000' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: '#000', whiteSpace: 'nowrap', fontWeight: 'bold', minWidth: `${minW}px` }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #606060', minWidth: '10px', height: '1px', margin: '0 4px 4px' }} />
      <select value={value} onChange={e => onChange(e.target.value)} style={inp}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function LimiteField({ label, neg, pos, onNeg, onPos, minW = 220 }: {
  label: string; neg: string; pos: string;
  onNeg: (v: string) => void; onPos: (v: string) => void; minW?: number;
}) {
  const inp: React.CSSProperties = { width: '52px', padding: '1px 4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#ffffff', border: '2px inset #808080', color: '#000', textAlign: 'right' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: '#000', whiteSpace: 'nowrap', fontWeight: 'bold', minWidth: `${minW}px` }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #606060', minWidth: '10px', height: '1px', margin: '0 4px 4px' }} />
      <input type="number" value={neg} onChange={e => onNeg(e.target.value)} style={inp} />
      <input type="number" value={pos} onChange={e => onPos(e.target.value)} style={inp} />
    </div>
  );
}

function Secao({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px', border: '1px solid #a0a098' }}>
      {title && <div style={{ background: '#005500', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', letterSpacing: '1px', textAlign: 'center' }}>{title}</div>}
      <div style={{ padding: '8px 10px', background: '#d4d0c8' }}>{children}</div>
    </div>
  );
}

function ParamContent({ tab, config, onChange }: { tab: TabParam; config: Config; onChange: (k: string, v: string) => void }) {
  const c = config;
  const o = onChange;

  if (tab === 'estoque') return (
    <div>
      <Secao>
        <SelectField label="UNIDADE BASE PARA LENTES (PAR/UNIDADE)" value={c.param_unidade_base ?? 'P'} onChange={v => o('param_unidade_base', v)} options={[{ value: 'P', label: 'P - PAR' }, { value: 'U', label: 'U - UNIDADE' }]} minW={260} />
        <SelectField label="MOVIMENTAR ESTOQUE" value={c.param_movimentar_estoque ?? 'S'} onChange={v => o('param_movimentar_estoque', v)} options={SN} minW={260} />
      </Secao>
      <Secao>
        <SelectField label="DECIMAIS/QUANTIDADE" value={c.param_dec_quantidade ?? '1'} onChange={v => o('param_dec_quantidade', v)} options={DEC_OPTS} minW={260} />
        <SelectField label="DECIMAIS/PESO KGS" value={c.param_dec_peso ?? '3'} onChange={v => o('param_dec_peso', v)} options={DEC_OPTS} minW={260} />
        <SelectField label="DECIMAIS/PREÇO DE CUSTO" value={c.param_dec_preco_custo ?? '3'} onChange={v => o('param_dec_preco_custo', v)} options={DEC_OPTS} minW={260} />
        <SelectField label="DECIMAIS/PREÇO DE VENDA" value={c.param_dec_preco_venda ?? '2'} onChange={v => o('param_dec_preco_venda', v)} options={DEC_OPTS} minW={260} />
      </Secao>
      <Secao title="LIMITE DE VARIAÇÃO EM RELAÇÃO A DATA DO DIA">
        <LimiteField label="DATA DE MOVIMENTAÇÃO" neg={c.param_limite_mov_neg ?? '-999'} pos={c.param_limite_mov_pos ?? '999'} onNeg={v => o('param_limite_mov_neg', v)} onPos={v => o('param_limite_mov_pos', v)} minW={220} />
      </Secao>
    </div>
  );

  if (tab === 'pedidos') return (
    <div>
      <Secao>
        <SelectField label="COLOCAR NOME DA EMPRESA NOS PEDIDOS" value={c.param_nome_empresa_pedidos ?? 'S'} onChange={v => o('param_nome_empresa_pedidos', v)} options={SN} minW={290} />
        <SelectField label="COLOCAR NOME DA EMPRESA NAS OS" value={c.param_nome_empresa_os ?? 'S'} onChange={v => o('param_nome_empresa_os', v)} options={SN} minW={290} />
        <SelectField label="NUMERO DE VIAS NA IMPRESSÃO DE PEDIDOS" value={c.param_vias_pedidos ?? '1'} onChange={v => o('param_vias_pedidos', v)} options={VIAS_OPTS} minW={290} />
        <SelectField label="NUMERO DE VIAS NA IMPRESSÃO DE OS" value={c.param_vias_os ?? '0'} onChange={v => o('param_vias_os', v)} options={VIAS_OPTS} minW={290} />
        <SelectField label="MOMENTO LANÇAR FECHAMENTO NOS PEDIDOS" value={c.param_momento_fechamento_ped ?? 'E'} onChange={v => o('param_momento_fechamento_ped', v)} options={[{ value: 'E', label: 'E' }, { value: 'S', label: 'S' }]} minW={290} />
        <SelectField label="MOMENTO LANÇAR FECHAMENTO NAS OS" value={c.param_momento_fechamento_os ?? 'E'} onChange={v => o('param_momento_fechamento_os', v)} options={[{ value: 'E', label: 'E' }, { value: 'S', label: 'S' }]} minW={290} />
        <SelectField label="DATA DO COMPUTADOR COMO DATA DE EMISSÃO" value={c.param_data_computador ?? 'S'} onChange={v => o('param_data_computador', v)} options={SN} minW={290} />
        <SelectField label="ACEITAR ITENS COM ESTOQUE ZERADO" value={c.param_aceitar_estoque_zero ?? 'N'} onChange={v => o('param_aceitar_estoque_zero', v)} options={SN} minW={290} />
        <SelectField label="ACEITAR ITENS COM QUANTIDADE ZERADA" value={c.param_aceitar_qtd_zero ?? 'N'} onChange={v => o('param_aceitar_qtd_zero', v)} options={SN} minW={290} />
        <SelectField label="INFORMAR Nº DOCUMENTO NA GRAVAÇÃO" value={c.param_informar_ndoc ?? 'N'} onChange={v => o('param_informar_ndoc', v)} options={[{ value: 'S', label: 'S - SIM' }, { value: 'N', label: 'N - NÃO' }, { value: 'R', label: 'R - QUANDO RENUMERADO' }]} minW={290} />
        <DotField label="Nº DIAS BLOQUEAR REFERÊNCIA DO CLIENTE" value={c.param_dias_bloquear_ref ?? '995'} onChange={v => o('param_dias_bloquear_ref', v)} />
        <DotField label="Nº DIAS BLOQUEAR CONTROLE INTERNO" value={c.param_dias_bloquear_ctrl ?? ''} onChange={v => o('param_dias_bloquear_ctrl', v)} />
        <DotField label="SIGLAS DE CLASSIFICAÇÃO DE DOCUMENTOS" value={c.param_siglas_classificacao ?? 'N,E,T,'} onChange={v => o('param_siglas_classificacao', v)} />
      </Secao>
      <Secao>
        {[
          ['param_liberar_pedido_s', 'LIBERAR UTILIZAÇÃO DE PEDIDOS TIPO [S]'],
          ['param_liberar_devolucao', 'LIBERAR UTILIZAÇÃO DE PEDIDOS DE DEVOLUÇÃO'],
          ['param_liberar_mostruario', 'LIBERAR UTILIZAÇÃO DE PEDIDOS DE MOSTRUÁRIO'],
          ['param_liberar_encomendas', 'LIBERAR UTILIZAÇÃO DE ENCOMENDAS/ROMANEIOS'],
          ['param_liberar_protocolos', 'LIBERAR UTILIZAÇÃO DE PROTOCOLOS DE ENTRADA'],
          ['param_liberar_os_free', 'LIBERAR UTILIZAÇÃO DE OS FREE FORM'],
          ['param_liberar_os_garantia', 'LIBERAR UTILIZAÇÃO DE OS GARANTIA'],
        ].map(([key, label]) => (
          <SelectField key={key} label={label} value={c[key] ?? 'N'} onChange={v => o(key, v)} options={SN} minW={300} />
        ))}
      </Secao>
    </div>
  );

  if (tab === 'fluxo') return (
    <div>
      <Secao title="FLUXO DE PRODUÇÃO">
        <SelectField label="ATIVAR CAMPO PARA INFORMAR A MÁQUINA" value={c.param_fluxo_maquina ?? 'S'} onChange={v => o('param_fluxo_maquina', v)} options={SN} minW={280} />
        <SelectField label="ATIVAR CAMPO PARA INFORMAR O OPERADOR" value={c.param_fluxo_operador ?? 'S'} onChange={v => o('param_fluxo_operador', v)} options={SN} minW={280} />
        <SelectField label="USAR SENHA DO USUÁRIO COMO OPERADOR" value={c.param_fluxo_senha_oper ?? 'N'} onChange={v => o('param_fluxo_senha_oper', v)} options={SN} minW={280} />
        <SelectField label="ABRIR PRÓXIMO SETOR AO ENCERRAR SETOR" value={c.param_fluxo_prox_setor ?? 'N'} onChange={v => o('param_fluxo_prox_setor', v)} options={SN} minW={280} />
        <SelectField label="LANÇAR DATA SAÍDA EXPEDIÇÃO COMO DATA OS" value={c.param_fluxo_data_saida ?? 'N'} onChange={v => o('param_fluxo_data_saida', v)} options={SN} minW={280} />
        <SelectField label="LANÇAR DATA FECHAMENTO OS NA EXPEDIÇÃO" value={c.param_fluxo_data_fechamento ?? 'N'} onChange={v => o('param_fluxo_data_fechamento', v)} options={SN} minW={280} />
        <SelectField label="LANÇAR ROTA DE ENTREGA NA EXPEDIÇÃO" value={c.param_fluxo_rota ?? 'N'} onChange={v => o('param_fluxo_rota', v)} options={SN} minW={280} />
        <SelectField label="PERMITIR LANÇAR NÚMERO DE CAIXA" value={c.param_fluxo_num_caixa ?? 'N'} onChange={v => o('param_fluxo_num_caixa', v)} options={SN} minW={280} />
        <SelectField label="FECHAR EXPEDIÇÃO NA SAÍDA DA OS" value={c.param_fluxo_fechar_expedicao ?? 'N'} onChange={v => o('param_fluxo_fechar_expedicao', v)} options={SN} minW={280} />
      </Secao>
      <Secao title="DEFINIÇÃO DE SETORES E STATUS DE LEITURA">
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 70px 1fr', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>#</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>NOME DO SETOR</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>TEMPO</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>STATUS AO ESCANEAR</span>
        </div>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <div key={n} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 70px 1fr', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '3px', color: '#005500' }}>{n}</span>
            <input value={c[`param_setor_${n}_nome`] ?? ''} onChange={e => o(`param_setor_${n}_nome`, e.target.value)} style={{ padding: '2px 4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#fff', border: '2px inset #808080' }} />
            <input type="number" value={c[`param_setor_${n}_tempo`] ?? ''} onChange={e => o(`param_setor_${n}_tempo`, e.target.value)} style={{ padding: '2px 4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#fff', border: '2px inset #808080' }} />
            <select value={c[`param_setor_${n}_status`] ?? ''} onChange={e => o(`param_setor_${n}_status`, e.target.value)} style={{ padding: '2px 4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#fff', border: '2px inset #808080' }}>
              <option value="">— não mudar status —</option>
              <option value="aguardando">AGUARDANDO</option>
              <option value="em_producao">EM PRODUÇÃO</option>
              <option value="pronto">PRONTO</option>
              <option value="entregue">ENTREGUE</option>
            </select>
          </div>
        ))}
      </Secao>
    </div>
  );

  if (tab === 'recibos') return (
    <div>
      <Secao>
        <SelectField label="NÚMERO DE VIAS NA IMPRESSÃO" value={c.param_rec_vias ?? '2'} onChange={v => o('param_rec_vias', v)} options={VIAS_OPTS} minW={220} />
        <SelectField label="LANÇAR RECIBOS NO CONTAS A RECEBER" value={c.param_rec_contas_receber ?? 'S'} onChange={v => o('param_rec_contas_receber', v)} options={SN} minW={220} />
        <SelectField label="LANÇAR RECIBOS EM ABERTO / QUITADO" value={c.param_rec_aberto_quitado ?? 'Q'} onChange={v => o('param_rec_aberto_quitado', v)} options={[{ value: 'A', label: 'A - ABERTO' }, { value: 'Q', label: 'Q - QUITADO' }]} minW={220} />
      </Secao>
    </div>
  );

  if (tab === 'notas') return (
    <div>
      <Secao>
        <DotField label="%ISS" value={c.param_nf_pct_iss ?? '0.00'} onChange={v => o('param_nf_pct_iss', v)} type="number" />
      </Secao>
      <Secao title="OBSERVAÇÕES COMPLEMENTARES">
        <textarea value={c.param_nf_obs_compl ?? ''} onChange={e => o('param_nf_obs_compl', e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#fff', border: '2px inset #808080', resize: 'vertical' }} />
      </Secao>
      <Secao title="OBSERVAÇÕES/RESERVADO AO FISCO">
        <textarea value={c.param_nf_obs_fisco ?? ''} onChange={e => o('param_nf_obs_fisco', e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#fff', border: '2px inset #808080', resize: 'vertical' }} />
      </Secao>
    </div>
  );

  if (tab === 'faturamento') return (
    <div>
      <Secao>
        <SelectField label="VENCIMENTOS EM SÁBADOS OU DOMINGOS" value={c.param_fat_venc_sabdom ?? 'M'} onChange={v => o('param_fat_venc_sabdom', v)} options={[{ value: 'A', label: 'A - ANTECIPAR' }, { value: 'M', label: 'M - MANTER' }, { value: 'P', label: 'P - POSTERGAR' }]} minW={260} />
        <SelectField label="LANÇAR VENDAS À VISTA COMO QUITADAS" value={c.param_fat_vista_quitada ?? 'N'} onChange={v => o('param_fat_vista_quitada', v)} options={SN} minW={260} />
      </Secao>
      <Secao title="BOLETOS EMITIDOS">
        <DotField label="PASTA PDF TEMPORÁRIO" value={c.param_fat_pasta_pdf_temp ?? ''} onChange={v => o('param_fat_pasta_pdf_temp', v)} />
        <DotField label="PASTA PDF BOLETOS" value={c.param_fat_pasta_pdf_boletos ?? ''} onChange={v => o('param_fat_pasta_pdf_boletos', v)} />
      </Secao>
    </div>
  );

  if (tab === 'contas_receber') return (
    <div>
      <Secao>
        <SelectField label="INTERLIGAR CR COM CONTROLE BANCÁRIO" value={c.param_cr_interligar_bancario ?? 'N'} onChange={v => o('param_cr_interligar_bancario', v)} options={SN} minW={260} />
      </Secao>
      <Secao title="LIMITE DE VARIAÇÃO DE DATAS">
        <LimiteField label="DATA DE EMISSÃO" neg={c.param_cr_emissao_neg ?? '0'} pos={c.param_cr_emissao_pos ?? '0'} onNeg={v => o('param_cr_emissao_neg', v)} onPos={v => o('param_cr_emissao_pos', v)} />
        <LimiteField label="DATA DE VENCIMENTO" neg={c.param_cr_vencimento_neg ?? '0'} pos={c.param_cr_vencimento_pos ?? '0'} onNeg={v => o('param_cr_vencimento_neg', v)} onPos={v => o('param_cr_vencimento_pos', v)} />
        <LimiteField label="DATA DE PAGAMENTO" neg={c.param_cr_pagamento_neg ?? '0'} pos={c.param_cr_pagamento_pos ?? '0'} onNeg={v => o('param_cr_pagamento_neg', v)} onPos={v => o('param_cr_pagamento_pos', v)} />
      </Secao>
    </div>
  );

  if (tab === 'contas_pagar') return (
    <div>
      <Secao>
        <SelectField label="INTERLIGAR CP COM CONTROLE BANCÁRIO" value={c.param_cp_interligar_bancario ?? 'S'} onChange={v => o('param_cp_interligar_bancario', v)} options={SN} minW={260} />
      </Secao>
      <Secao title="LIMITE DE VARIAÇÃO DE DATAS">
        <LimiteField label="DATA DE EMISSÃO" neg={c.param_cp_emissao_neg ?? '0'} pos={c.param_cp_emissao_pos ?? '0'} onNeg={v => o('param_cp_emissao_neg', v)} onPos={v => o('param_cp_emissao_pos', v)} />
        <LimiteField label="DATA DE VENCIMENTO" neg={c.param_cp_vencimento_neg ?? '0'} pos={c.param_cp_vencimento_pos ?? '0'} onNeg={v => o('param_cp_vencimento_neg', v)} onPos={v => o('param_cp_vencimento_pos', v)} />
        <LimiteField label="DATA DE PAGAMENTO" neg={c.param_cp_pagamento_neg ?? '0'} pos={c.param_cp_pagamento_pos ?? '0'} onNeg={v => o('param_cp_pagamento_neg', v)} onPos={v => o('param_cp_pagamento_pos', v)} />
      </Secao>
    </div>
  );

  if (tab === 'bancario') return (
    <div>
      <Secao>
        <SelectField label="ACEITAR DATA MOVIMENTAÇÃO EM SÁB/DOM" value={c.param_banc_aceitar_sabdom ?? 'N'} onChange={v => o('param_banc_aceitar_sabdom', v)} options={SN} minW={260} />
      </Secao>
      <Secao title="LIMITE DE VARIAÇÃO DE DATAS">
        <LimiteField label="DATA DE EMISSÃO" neg={c.param_banc_emissao_neg ?? '-999'} pos={c.param_banc_emissao_pos ?? '999'} onNeg={v => o('param_banc_emissao_neg', v)} onPos={v => o('param_banc_emissao_pos', v)} />
        <LimiteField label="DATA DE MOVIMENTAÇÃO" neg={c.param_banc_mov_neg ?? '-999'} pos={c.param_banc_mov_pos ?? '999'} onNeg={v => o('param_banc_mov_neg', v)} onPos={v => o('param_banc_mov_pos', v)} />
      </Secao>
    </div>
  );

  return (
    <div>
      <Secao title="DATAS LIMITES P/PERÍODOS DE PESQUISAS">
        <DotField label="DATA INICIAL" value={c.param_pesquisa_data_ini ?? ''} onChange={v => o('param_pesquisa_data_ini', v)} type="date" />
        <DotField label="DATA FINAL" value={c.param_pesquisa_data_fim ?? ''} onChange={v => o('param_pesquisa_data_fim', v)} type="date" />
      </Secao>
    </div>
  );
}

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
        <DotField label="PRÓXIMO PEDIDO A EMITIR" value={config.num_proximo_pedido ?? '1'} onChange={v => onChange('num_proximo_pedido', v)} />
        <DotField label="PRÓXIMA OS PADRÃO/FREEFORM A EMITIR" value={config.num_proximo_os_padrao ?? '1'} onChange={v => onChange('num_proximo_os_padrao', v)} />
        <DotField label="PRÓXIMA OS GARANTIA A EMITIR" value={config.num_proximo_os_garantia ?? '1'} onChange={v => onChange('num_proximo_os_garantia', v)} />
        <DotField label="PRÓXIMO ENCOMENDA/ROMANEIO A EMITIR" value={config.num_proximo_encomenda ?? '1'} onChange={v => onChange('num_proximo_encomenda', v)} />
        <DotField label="ÚLTIMA DATA DE PEDIDOS" value={config.num_ultima_data_pedidos ?? ''} onChange={v => onChange('num_ultima_data_pedidos', v)} type="date" />
        <div style={{ marginTop: '14px', border: '1px solid #a0a098' }}>
          <div style={{ background: '#005500', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', letterSpacing: '1px' }}>IMPORTAÇÃO PEDIDO ON-LINE</div>
          <div style={{ padding: '8px 10px', background: '#d4d0c8' }}>
            <DotField label="PRÓXIMA PRÉ-VENDA" value={config.num_proximo_prevenda ?? '1'} onChange={v => onChange('num_proximo_prevenda', v)} />
            <DotField label="PRÓXIMO PRÉ-SERVIÇO" value={config.num_proximo_preservico ?? '1'} onChange={v => onChange('num_proximo_preservico', v)} />
          </div>
        </div>
        <div style={{ marginTop: '14px', border: '1px solid #a0a098' }}>
          <div style={{ background: '#005500', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', letterSpacing: '1px' }}>OBSERVAÇÕES EM PEDIDOS</div>
          <div style={{ padding: '8px 10px', background: '#d4d0c8' }}>
            <textarea value={config.obs_pedidos ?? ''} onChange={e => onChange('obs_pedidos', e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#ffffff', border: '2px inset #808080', color: '#000000', resize: 'vertical' }} />
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'fechamentos') {
    return (
      <div>
        <DotField label="PRÓXIMO FECHAMENTO A EMITIR" value={config.num_proximo_fechamento ?? '1'} onChange={v => onChange('num_proximo_fechamento', v)} />
        <div style={{ marginTop: '14px', border: '1px solid #a0a098' }}>
          <div style={{ background: '#005500', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', letterSpacing: '1px' }}>PRÓXIMAS DATAS DE FECHAMENTO</div>
          <div style={{ padding: '10px', background: '#d4d0c8' }}>
            <DotField label="PRÓXIMO FECHAMENTO SEMANAL" value={config.fechamento_data_semanal ?? ''} onChange={v => onChange('fechamento_data_semanal', v)} type="date" />
            <DotField label="PRÓXIMO FECHAMENTO DECENAL" value={config.fechamento_data_decenal ?? ''} onChange={v => onChange('fechamento_data_decenal', v)} type="date" />
            <DotField label="PRÓXIMO FECHAMENTO QUINZENAL" value={config.fechamento_data_quinzenal ?? ''} onChange={v => onChange('fechamento_data_quinzenal', v)} type="date" />
            <DotField label="PRÓXIMO FECHAMENTO VINTENAL" value={config.fechamento_data_vintenal ?? ''} onChange={v => onChange('fechamento_data_vintenal', v)} type="date" />
            <DotField label="PRÓXIMO FECHAMENTO MENSAL" value={config.fechamento_data_mensal ?? ''} onChange={v => onChange('fechamento_data_mensal', v)} type="date" />
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'notas') {
    return (
      <div>
        <DotField label="PRÓXIMA NF A EMITIR / SÉRIE I" value={config.num_proximo_nf ?? '1'} onChange={v => onChange('num_proximo_nf', v)} />
      </div>
    );
  }

  if (tab === 'faturas') {
    return (
      <div>
        <DotField label="PRÓXIMA FATURA A EMITIR" value={config.num_proximo_fatura ?? '1'} onChange={v => onChange('num_proximo_fatura', v)} />
        <DotField label="PRÓXIMO FESP A EMITIR" value={config.num_proximo_fesp ?? '1'} onChange={v => onChange('num_proximo_fesp', v)} />
      </div>
    );
  }

  return (
    <div>
      <DotField label="PRÓXIMO CONTRATO A EMITIR" value={config.num_proximo_contrato ?? '1'} onChange={v => onChange('num_proximo_contrato', v)} />
      <DotField label="PRÓXIMA DEVOLUÇÃO A EMITIR" value={config.num_proximo_devolucao ?? '1'} onChange={v => onChange('num_proximo_devolucao', v)} />
      <DotField label="PRÓXIMA TROCA A EMITIR" value={config.num_proximo_troca ?? '1'} onChange={v => onChange('num_proximo_troca', v)} />
      <DotField label="PRÓXIMO ORÇAMENTO A EMITIR" value={config.num_proximo_orcamento ?? '1'} onChange={v => onChange('num_proximo_orcamento', v)} />
      <DotField label="PRÓXIMO MOSTRUÁRIO A EMITIR" value={config.num_proximo_mostruario ?? '1'} onChange={v => onChange('num_proximo_mostruario', v)} />
      <DotField label="PRÓXIMO RECIBO A EMITIR" value={config.num_proximo_recibo ?? '1'} onChange={v => onChange('num_proximo_recibo', v)} />
      <DotField label="PRÓXIMO PROTOCOLO DE RECEBIMENTO A EMITIR" value={config.num_proximo_protocolo_rec ?? '1'} onChange={v => onChange('num_proximo_protocolo_rec', v)} />
      <DotField label="PRÓXIMO PROTOCOLO DE ENTREGA A EMITIR" value={config.num_proximo_protocolo_ent ?? '1'} onChange={v => onChange('num_proximo_protocolo_ent', v)} />
    </div>
  );
}

function TabelaContent({ tabela, config, onChange }: {
  tabela: TabTabela; config: Config; onChange: (k: string, v: string) => void;
}) {
  const [despGrupo, setDespGrupo] = useState(0);
  const [bancoPg, setBancoPg] = useState(0);

  useEffect(() => { setDespGrupo(0); setBancoPg(0); }, [tabela]);

  const tInp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '1px 4px', fontSize: '11px',
    fontFamily: "'Courier New', monospace", background: '#ffffff',
    border: '1px solid #a0a0a0', color: '#000',
  };
  const yCell: React.CSSProperties = {
    background: '#888800', color: '#ffff00', fontSize: '10px', fontWeight: 'bold',
    padding: '2px 4px', textAlign: 'center' as const, border: '1px solid #606000', whiteSpace: 'nowrap',
  };
  const th: React.CSSProperties = {
    background: '#005500', color: '#fff', padding: '4px 6px', fontSize: '11px', fontWeight: 'bold',
  };
  const scrl: React.CSSProperties = { overflowY: 'auto', maxHeight: '500px' };

  if (tabela === 'movimentos_estoque') {
    const defCodes = ['C','V','T','Q','D','E','F','G','H','I'];
    const defDesc  = ['COMPRA','VENDA','TRANSFERÊNCIA','QUEBRA','','','','','',''];
    return (
      <div style={scrl}>
        <div style={S.panelHeader()}>MOVIMENTOS DE ESTOQUE</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '50px', textAlign: 'center' }}>CÓD</th>
                <th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                  <td style={yCell}>
                    <input
                      value={config[`tab_mest_code_${i}`] ?? defCodes[i]}
                      onChange={e => onChange(`tab_mest_code_${i}`, e.target.value)}
                      style={{ width: '26px', textAlign: 'center', fontSize: '10px', fontFamily: "'Courier New',monospace", background: 'transparent', border: 'none', color: '#ffff00', fontWeight: 'bold' }}
                    />
                  </td>
                  <td style={{ padding: '2px 4px' }}>
                    <input value={config[`tab_mest_${i}`] ?? defDesc[i]} onChange={e => onChange(`tab_mest_${i}`, e.target.value)} style={tInp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tabela === 'fornecedores') {
    return (
      <div style={scrl}>
        <div style={S.panelHeader()}>TIPOS DE FORNECEDORES</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ ...th, width: '40px', textAlign: 'center' }}>Nº</th><th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th></tr></thead>
            <tbody>
              {Array.from({ length: 50 }, (_, i) => {
                const code = String(i + 1).padStart(2, '0');
                return (
                  <tr key={code} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={yCell}>{code}</td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_fornec_${code}`] ?? ''} onChange={e => onChange(`tab_fornec_${code}`, e.target.value)} style={tInp} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tabela === 'cobrancas') {
    return (
      <div style={scrl}>
        <div style={S.panelHeader()}>TIPOS DE COBRANÇAS</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ ...th, width: '40px', textAlign: 'center' }}>Nº</th><th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th></tr></thead>
            <tbody>
              {Array.from({ length: 20 }, (_, i) => {
                const code = String(i + 1).padStart(2, '0');
                return (
                  <tr key={code} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={yCell}>{code}</td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_cobr_${code}`] ?? ''} onChange={e => onChange(`tab_cobr_${code}`, e.target.value)} style={tInp} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tabela === 'despesas') {
    const grupoNomes = ['DESPESAS ADM','DESPESAS ADM','DEPARTAMENTO PESSOAL','CUSTOS','DEPARTAMENTO PESSOAL','','','','',''];
    const grupoStart = despGrupo * 10;
    return (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Groups panel */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={S.panelHeader()}>GRUPO DE DESPESAS</div>
          <div style={S.panelBody()}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                onClick={() => setDespGrupo(i)}
                style={{ ...S.row(despGrupo === i, i), borderBottom: i < 9 ? '1px solid #b0acA4' : 'none' }}
                onMouseEnter={e => { if (despGrupo !== i) (e.currentTarget as HTMLElement).style.background = '#004400'; }}
                onMouseLeave={e => { if (despGrupo !== i) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#d4d0c8' : '#dedad2'; }}
              >
                <span style={S.label()}>GRUPO {i} — {config[`tab_desp_grp_${i}`] ?? grupoNomes[i]}</span>
                <span style={S.num(despGrupo === i)}>{i}</span>
              </div>
            ))}
            <div style={{ ...S.row(false, 10), borderBottom: 'none', cursor: 'pointer' }} onClick={() => window.print()}>
              <span style={S.label()}>IMPRIMIR GRUPOS</span>
              <span style={S.num(false)}>I</span>
            </div>
          </div>
        </div>
        {/* Items panel */}
        <div style={{ flex: 1 }}>
          <div style={S.panelHeader()}>GRUPO {despGrupo}</div>
          <div style={{ ...S.panelBody(), padding: '8px 10px' }}>
            <div style={{ marginBottom: '8px' }}>
              <input
                value={config[`tab_desp_grp_${despGrupo}`] ?? grupoNomes[despGrupo]}
                onChange={e => onChange(`tab_desp_grp_${despGrupo}`, e.target.value)}
                placeholder="Nome do grupo..."
                style={{ ...tInp, border: '2px inset #808080' }}
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={{ ...th, width: '40px', textAlign: 'center' }}>CÓD</th><th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th></tr></thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => {
                  const code = String(grupoStart + i).padStart(2, '0');
                  return (
                    <tr key={code} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                      <td style={yCell}>{code}</td>
                      <td style={{ padding: '2px 4px' }}>
                        <input value={config[`tab_desp_${code}`] ?? ''} onChange={e => onChange(`tab_desp_${code}`, e.target.value)} style={tInp} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tabela === 'movimentos') {
    const renderPanel = (panel: 'A' | 'B') => (
      <div style={{ flex: 1 }}>
        <div style={S.panelHeader()}>MOVIMENTOS BANCÁRIOS</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '30px', textAlign: 'center' }}>M</th>
                <th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th>
                <th style={{ ...th, width: '28px', textAlign: 'center' }}>±</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }, (_, i) => {
                const idx = String(i + 1).padStart(2, '0');
                return (
                  <tr key={idx} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={yCell}>
                      <input value={config[`tab_movb${panel}_${idx}_m`] ?? ''} onChange={e => onChange(`tab_movb${panel}_${idx}_m`, e.target.value)} style={{ width: '22px', textAlign: 'center', fontSize: '10px', fontFamily: "'Courier New',monospace", background: 'transparent', border: 'none', color: '#ffff00', fontWeight: 'bold' }} />
                    </td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_movb${panel}_${idx}_desc`] ?? ''} onChange={e => onChange(`tab_movb${panel}_${idx}_desc`, e.target.value)} style={tInp} />
                    </td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_movb${panel}_${idx}_tipo`] ?? ''} onChange={e => onChange(`tab_movb${panel}_${idx}_tipo`, e.target.value)} style={{ ...tInp, width: '22px', textAlign: 'center' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
    return <div style={{ display: 'flex', gap: '12px' }}>{renderPanel('A')}{renderPanel('B')}</div>;
  }

  if (tabela === 'documentos') {
    return (
      <div style={scrl}>
        <div style={S.panelHeader()}>DOCUMENTOS BANCÁRIOS</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ ...th, width: '30px', textAlign: 'center' }}>TP</th><th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th></tr></thead>
            <tbody>
              {Array.from({ length: 15 }, (_, i) => {
                const code = String(i + 1).padStart(2, '0');
                return (
                  <tr key={code} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={yCell}>
                      <input value={config[`tab_docb_${code}_tp`] ?? ''} onChange={e => onChange(`tab_docb_${code}_tp`, e.target.value)} style={{ width: '22px', textAlign: 'center', fontSize: '10px', fontFamily: "'Courier New',monospace", background: 'transparent', border: 'none', color: '#ffff00', fontWeight: 'bold' }} />
                    </td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_docb_${code}_desc`] ?? ''} onChange={e => onChange(`tab_docb_${code}_desc`, e.target.value)} style={tInp} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tabela === 'bancos') {
    const pgStart = bancoPg * 20 + 1;
    const pgEnd = Math.min(pgStart + 19, 99);
    return (
      <div>
        <div style={S.panelHeader()}>CONTAS BANCÁRIAS</div>
        <div style={{ ...S.panelBody(), overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '30px', textAlign: 'center' }}>CT</th>
                <th style={{ ...th, textAlign: 'left', minWidth: '140px' }}>BANCO</th>
                <th style={{ ...th, width: '80px', textAlign: 'center' }}>AGÊNCIA</th>
                <th style={{ ...th, width: '80px', textAlign: 'center' }}>CONTA</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: pgEnd - pgStart + 1 }, (_, i) => {
                const num = String(pgStart + i).padStart(2, '0');
                return (
                  <tr key={num} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={yCell}>{num}</td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_banco_${num}_nome`] ?? ''} onChange={e => onChange(`tab_banco_${num}_nome`, e.target.value)} style={tInp} />
                    </td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_banco_${num}_ag`] ?? ''} onChange={e => onChange(`tab_banco_${num}_ag`, e.target.value)} style={tInp} />
                    </td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_banco_${num}_ct`] ?? ''} onChange={e => onChange(`tab_banco_${num}_ct`, e.target.value)} style={tInp} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '6px 8px', display: 'flex', gap: '4px', justifyContent: 'center', background: '#d4d0c8', border: '2px inset #808080', borderTop: 'none' }}>
          {[0,1,2,3,4].map(pg => {
            const s = pg * 20 + 1;
            const e2 = Math.min(pg * 20 + 20, 99);
            return (
              <button key={pg} onClick={() => setBancoPg(pg)} style={{ padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'inherit', background: bancoPg === pg ? '#005500' : '#d4d0c8', color: bancoPg === pg ? '#fff' : '#005500', border: bancoPg === pg ? '2px inset #808080' : '2px outset #808080', cursor: 'pointer' }}>
                {String(s).padStart(2,'0')}-{String(e2).padStart(2,'0')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (tabela === 'quebras_perdas') {
    return (
      <div>
        <div style={S.panelHeader()}>TIPOS DE PERDAS</div>
        <div style={S.panelBody()}>
          {Array.from({ length: 9 }, (_, i) => {
            const g = i + 1;
            return (
              <div key={g} style={{ ...S.row(false, i), borderBottom: i < 8 ? '1px solid #b0acA4' : 'none', cursor: 'default' }}>
                <span style={{ ...S.label(), marginRight: '8px' }}>GRUPO {g}</span>
                <input value={config[`tab_quebra_grp_${g}`] ?? ''} onChange={e => onChange(`tab_quebra_grp_${g}`, e.target.value)} style={{ flex: 2, padding: '1px 4px', fontSize: '11px', fontFamily: "'Courier New',monospace", background: '#fff', border: '1px inset #808080', color: '#000' }} onClick={e => e.stopPropagation()} />
                <span style={S.num(false)}>{g}</span>
              </div>
            );
          })}
          <div style={{ ...S.row(false, 9), borderBottom: 'none', cursor: 'pointer' }} onClick={() => window.print()}>
            <span style={S.label()}>IMPRIMIR GRUPOS</span>
            <span style={S.num(false)}>I</span>
          </div>
        </div>
      </div>
    );
  }

  if (tabela === 'listas') {
    const codes = ['1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','P'];
    return (
      <div>
        <div style={S.panelHeader()}>NOME DE LISTA DE PREÇOS</div>
        <div style={{ ...S.panelBody(), padding: '10px 12px' }}>
          {codes.map(code => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#005500', minWidth: '56px' }}>LISTA {code}</span>
              <span style={{ fontSize: '10px', color: '#808080' }}>——</span>
              <input
                value={config[`tab_lista_${code}`] ?? ''}
                onChange={e => onChange(`tab_lista_${code}`, e.target.value)}
                style={{ flex: 1, padding: '1px 4px', fontSize: '11px', fontFamily: "'Courier New', monospace", background: '#ffffff', border: '2px inset #808080', color: '#000' }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tabela === 'feriados') {
    return (
      <div>
        <div style={S.panelHeader()}>DATAS NÃO ÚTEIS</div>
        <div style={{ ...S.panelBody(), padding: '8px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Array.from({ length: 40 }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#606060', minWidth: '20px', textAlign: 'right' }}>{i + 1}</span>
                <input
                  type="date"
                  value={config[`tab_feriado_${i}`] ?? ''}
                  onChange={e => onChange(`tab_feriado_${i}`, e.target.value)}
                  style={{ flex: 1, padding: '1px 4px', fontSize: '11px', fontFamily: "'Courier New',monospace", background: '#fff', border: '2px inset #808080', color: '#000' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tabela === 'remarcacoes') {
    return (
      <div style={scrl}>
        <div style={S.panelHeader()}>REMARCAÇÕES DE ENTREGA</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ ...th, width: '30px', textAlign: 'center' }}>TP</th><th style={{ ...th, textAlign: 'left' }}>DESCRIÇÃO</th></tr></thead>
            <tbody>
              {Array.from({ length: 24 }, (_, i) => {
                const code = String(i + 1).padStart(2, '0');
                return (
                  <tr key={code} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={yCell}>{code}</td>
                    <td style={{ padding: '2px 4px' }}>
                      <input value={config[`tab_remarc_${code}`] ?? ''} onChange={e => onChange(`tab_remarc_${code}`, e.target.value)} style={tInp} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tabela === 'taxas_icms') {
    const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={S.panelHeader()}>ESTADO DE ORIGEM DO EMITENTE</div>
        <div style={S.panelBody()}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#005500', color: '#fff' }}>
                <th style={{ padding: '3px 4px', textAlign: 'center', width: '30px' }}>UF</th>
                <th style={{ padding: '3px 4px', textAlign: 'center' }}>%ICMS</th>
                <th style={{ padding: '3px 4px', textAlign: 'center' }}>%ICMS DEST</th>
                <th style={{ padding: '3px 4px', textAlign: 'center' }}>%FCP</th>
                <th style={{ padding: '3px 4px', textAlign: 'center' }}>%MVA</th>
                <th style={{ padding: '3px 4px', textAlign: 'center' }}>CONFAZ</th>
                <th style={{ padding: '3px 4px', textAlign: 'center' }}>DATA</th>
              </tr>
            </thead>
            <tbody>
              {UFS.map((uf, i) => {
                const inp2: React.CSSProperties = { width: '56px', padding: '1px 2px', fontSize: '10px', fontFamily: "'Courier New',monospace", background: '#fff', border: '1px solid #a0a0a0', color: '#000', textAlign: 'right' };
                return (
                  <tr key={uf} style={{ background: i % 2 === 0 ? '#d4d0c8' : '#dedad2' }}>
                    <td style={{ ...yCell, fontSize: '10px' }}>{uf}</td>
                    <td style={{ padding: '2px 3px' }}><input value={config[`tab_icms_${uf}_pad`] ?? ''} onChange={e => onChange(`tab_icms_${uf}_pad`, e.target.value)} style={inp2} /></td>
                    <td style={{ padding: '2px 3px' }}><input value={config[`tab_icms_${uf}_int`] ?? ''} onChange={e => onChange(`tab_icms_${uf}_int`, e.target.value)} style={inp2} /></td>
                    <td style={{ padding: '2px 3px' }}><input value={config[`tab_icms_${uf}_fcp`] ?? ''} onChange={e => onChange(`tab_icms_${uf}_fcp`, e.target.value)} style={inp2} /></td>
                    <td style={{ padding: '2px 3px' }}><input value={config[`tab_icms_${uf}_mva`] ?? ''} onChange={e => onChange(`tab_icms_${uf}_mva`, e.target.value)} style={inp2} /></td>
                    <td style={{ padding: '2px 3px' }}><input value={config[`tab_icms_${uf}_cnf`] ?? ''} onChange={e => onChange(`tab_icms_${uf}_cnf`, e.target.value)} style={inp2} /></td>
                    <td style={{ padding: '2px 3px' }}><input type="date" value={config[`tab_icms_${uf}_dt`] ?? ''} onChange={e => onChange(`tab_icms_${uf}_dt`, e.target.value)} style={{ ...inp2, width: '90px' }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', color: '#808080', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '0.5px' }}>
      EM DESENVOLVIMENTO
    </div>
  );
}

export default function LabConfiguracoes() {
  const [searchParams] = useSearchParams();
  const opcao = (searchParams.get('opcao') ?? null) as Opcao;
  const [tabNum, setTabNum] = useState<TabNum>('pedidos');
  const [tabParam, setTabParam] = useState<TabParam>('estoque');
  const [tabTabela, setTabTabela] = useState<TabTabela | null>(null);
  const [config, setConfig] = useState<Config>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/lab/configuracoes', { credentials: 'include' })
      .then(r => r.json())
      .then((d: Config) => setConfig(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setTabNum('pedidos');
    setTabParam('estoque');
    setTabTabela(null);
  }, [opcao]);

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

  const SaveBar = () => (
    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '3px 18px', fontSize: '11px', fontWeight: 'bold', background: saving ? '#808080' : '#005500', color: '#ffffff', border: '1px outset #007700', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.5px' }}
      >
        {saving ? 'SALVANDO...' : 'SALVAR'}
      </button>
      {saved && <span style={{ fontSize: '11px', color: '#006600', fontWeight: 'bold', alignSelf: 'center' }}>✔ SALVO</span>}
    </div>
  );

  function menuRows<K extends string>(
    items: { num: number | string; label: string; key: K }[],
    active: K,
    onSelect: (k: K) => void,
  ) {
    return items.map((t, i) => {
      const act = active === t.key;
      return (
        <div
          key={t.key}
          onClick={() => onSelect(t.key)}
          style={{ ...S.row(act, i), borderBottom: i < items.length - 1 ? '1px solid #b0acA4' : 'none' }}
          onMouseEnter={e => { if (!act) (e.currentTarget as HTMLElement).style.background = '#004400'; }}
          onMouseLeave={e => { if (!act) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#d4d0c8' : '#dedad2'; }}
        >
          <span style={S.label()}>{t.label}</span>
          <span style={S.num(act)}>{t.num}</span>
        </div>
      );
    });
  }

  return (
    <div style={{ ...font, padding: '16px', minHeight: '100%', background: '#c8c4b0' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* ===== NUMERAÇÃO ===== */}
        {opcao === 'numeracao' && (
          <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '180px', flexShrink: 0 }}>
              <div style={S.panelHeader()}>NUMERAÇÃO</div>
              <div style={S.panelBody()}>{menuRows(TABS_NUM, tabNum, setTabNum)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.panelHeader()}>{TABS_NUM.find(t => t.key === tabNum)?.label}</div>
              <div style={{ ...S.panelBody(), padding: '12px 14px' }}>
                <NumeracaoContent tab={tabNum} config={config} onChange={handleChange} />
                <SaveBar />
              </div>
            </div>
          </div>
        )}

        {/* ===== PARÂMETROS ===== */}
        {opcao === 'parametros' && (
          <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '200px', flexShrink: 0 }}>
              <div style={S.panelHeader()}>PARÂMETRO DESEJADO</div>
              <div style={S.panelBody()}>{menuRows(TABS_PARAM, tabParam, setTabParam)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.panelHeader()}>{TABS_PARAM.find(t => t.key === tabParam)?.label}</div>
              <div style={{ ...S.panelBody(), padding: '12px 14px', overflowY: 'auto', maxHeight: '600px' }}>
                <ParamContent tab={tabParam} config={config} onChange={handleChange} />
                <SaveBar />
              </div>
            </div>
          </div>
        )}

        {/* ===== TABELAS ===== */}
        {opcao === 'tabelas' && (
          <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* CADASTRO DESEJADO sub-menu */}
            <div style={{ width: '220px', flexShrink: 0 }}>
              <div style={S.panelHeader()}>CADASTRO DESEJADO</div>
              <div style={S.panelBody()}>
                {CADASTRO_DESEJADO.map((t, i) => {
                  const act = tabTabela === t.key;
                  return (
                    <div
                      key={t.key}
                      onClick={() => setTabTabela(act ? null : t.key)}
                      style={{ ...S.row(act, i), borderBottom: i < CADASTRO_DESEJADO.length - 1 ? '1px solid #b0acA4' : 'none' }}
                      onMouseEnter={e => { if (!act) (e.currentTarget as HTMLElement).style.background = '#004400'; }}
                      onMouseLeave={e => { if (!act) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#d4d0c8' : '#dedad2'; }}
                    >
                      <span style={S.label()}>{t.label}</span>
                      <span style={S.num(act)}>{t.num}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            {tabTabela ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <TabelaContent tabela={tabTabela} config={config} onChange={handleChange} />
                <SaveBar />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px', color: '#606060', fontSize: '11px', letterSpacing: '0.5px' }}>
                SELECIONE UM CADASTRO
              </div>
            )}
          </div>
        )}

        {/* ===== DADOS DO LABORATÓRIO ===== */}
        {opcao === 'dados_lab' && (() => {
          const lbl: React.CSSProperties = { display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#444', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' };
          const inp: React.CSSProperties = { width: '100%', padding: '4px 6px', fontSize: '12px', fontFamily: "'Courier New', monospace", background: '#ffffff', border: '2px inset #808080', color: '#000', boxSizing: 'border-box' as const };
          return (
            <div style={{ flex: 1 }}>
              <div style={S.panelHeader()}>DADOS DO LABORATÓRIO</div>
              <div style={{ ...S.panelBody(), padding: '14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Nome do Laboratório (impresso na OS)</label>
                    <input value={config.lab_nome ?? ''} onChange={e => handleChange('lab_nome', e.target.value)} style={inp} placeholder="Ex: City Lab Laboratório Óptico" />
                  </div>
                  <div>
                    <label style={lbl}>CNPJ</label>
                    <input value={config.lab_cnpj ?? ''} onChange={e => handleChange('lab_cnpj', e.target.value)} style={inp} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label style={lbl}>Telefone</label>
                    <input value={config.lab_telefone ?? ''} onChange={e => handleChange('lab_telefone', e.target.value)} style={inp} placeholder="(00) 00000-0000" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>E-mail</label>
                    <input value={config.lab_email ?? ''} onChange={e => handleChange('lab_email', e.target.value)} style={inp} placeholder="contato@lab.com.br" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Endereço (Rua, número)</label>
                    <input value={config.lab_endereco ?? ''} onChange={e => handleChange('lab_endereco', e.target.value)} style={inp} placeholder="Ex: Rua das Flores, 123" />
                  </div>
                  <div>
                    <label style={lbl}>Bairro</label>
                    <input value={config.lab_bairro ?? ''} onChange={e => handleChange('lab_bairro', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>CEP</label>
                    <input value={config.lab_cep ?? ''} onChange={e => handleChange('lab_cep', e.target.value)} style={inp} placeholder="00000-000" />
                  </div>
                  <div>
                    <label style={lbl}>Cidade</label>
                    <input value={config.lab_cidade ?? ''} onChange={e => handleChange('lab_cidade', e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>UF</label>
                    <input value={config.lab_uf ?? ''} onChange={e => handleChange('lab_uf', e.target.value)} style={{ ...inp, textTransform: 'uppercase' }} maxLength={2} />
                  </div>
                </div>
                <SaveBar />
              </div>
            </div>
          );
        })()}

        {!opcao && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px', color: '#606060', fontSize: '11px', letterSpacing: '0.5px' }}>
            SELECIONE UMA OPÇÃO
          </div>
        )}
      </div>
    </div>
  );
}
