import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

type ModuleKey = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';

const MODULOS: { letra: ModuleKey; nome: string; icon: string; ativo: boolean }[] = [
  { letra: 'A', nome: 'CONFIGURAÇÕES',              icon: '⚙',  ativo: true  },
  { letra: 'B', nome: 'ÓTICAS CLIENTES',             icon: '🏪', ativo: true  },
  { letra: 'C', nome: 'FORNECEDORES/OFTALMOS',       icon: '🏭', ativo: true  },
  { letra: 'D', nome: 'CADASTRO DE PRODUTOS',        icon: '📦', ativo: true  },
  { letra: 'E', nome: 'CADASTRO DE ESTOQUE',         icon: '🗂️', ativo: true  },
  { letra: 'F', nome: 'MOVIMENTAÇÃO DE ESTOQUE',     icon: '🔄', ativo: true  },
  { letra: 'G', nome: 'PEDIDOS / ORDENS DE SERVIÇO', icon: '📋', ativo: true  },
  { letra: 'H', nome: 'NOTAS FISCAIS/FECHAMENTOS',   icon: '🧾', ativo: false },
  { letra: 'I', nome: 'FATURAMENTO',                 icon: '💰', ativo: true  },
  { letra: 'J', nome: 'CONTAS A RECEBER',            icon: '📥', ativo: false },
  { letra: 'K', nome: 'CONTAS A PAGAR',              icon: '📤', ativo: false },
  { letra: 'L', nome: 'CONTROLE BANCÁRIO',           icon: '🏛️', ativo: true  },
];

type Opcao = { num: number; label: string; to?: string; disabled?: boolean };

const OPCOES: Record<ModuleKey, Opcao[]> = {
  A: [
    { num: 1, label: 'NUMERAÇÃO DE DOCUMENTOS',    to: '/lab/configuracoes' },
    { num: 3, label: 'PARÂMETROS DO SISTEMA',      disabled: true },
    { num: 4, label: 'TABELAS DO SISTEMA',         disabled: true },
    { num: 5, label: 'CADASTRO DE TRANSPORTADORAS',disabled: true },
    { num: 6, label: 'CADASTRO DE VENDEDORES',     disabled: true },
  ],
  B: [
    { num: 1, label: 'INCLUIR ÓTICA',      to: '/lab/oticas' },
    { num: 2, label: 'ALTERAR DADOS',      to: '/lab/oticas' },
    { num: 4, label: 'CONSULTA/LISTAGEM',  to: '/lab/oticas' },
  ],
  C: [
    { num: 1, label: 'INCLUIR FORNECEDOR', to: '/lab/fornecedores' },
    { num: 2, label: 'ALTERAR DADOS',      to: '/lab/fornecedores' },
    { num: 4, label: 'CONSULTA/LISTAGEM',  to: '/lab/fornecedores' },
  ],
  D: [
    { num: 1, label: 'INCLUIR PRODUTO',    to: '/lab/produtos' },
    { num: 2, label: 'ALTERAR DADOS',      to: '/lab/produtos' },
    { num: 4, label: 'CONSULTA/LISTAGEM',  to: '/lab/produtos' },
  ],
  E: [
    { num: 1, label: 'INCLUIR ITEM DE ESTOQUE', to: '/lab/estoque' },
    { num: 2, label: 'ALTERAR DADOS',           to: '/lab/estoque' },
    { num: 4, label: 'CONSULTA/LISTAGEM',       to: '/lab/estoque' },
  ],
  F: [
    { num: 1, label: 'ENTRADA DE MERCADORIA',   to: '/lab/estoque' },
    { num: 2, label: 'SAÍDA DE MERCADORIA',     to: '/lab/estoque' },
    { num: 3, label: 'CONSULTA/LISTAGEM',       to: '/lab/estoque' },
  ],
  G: [
    { num: 1, label: 'INCLUIR PEDIDO / OS',     to: '/lab/ordens/nova' },
    { num: 2, label: 'CONSULTA/LISTAGEM',       to: '/lab/ordens' },
    { num: 3, label: 'ALTERAR / CONSULTAR OS',  to: '/lab/ordens' },
  ],
  H: [],
  I: [
    { num: 1, label: 'FATURAMENTO',             to: '/lab/faturamento' },
    { num: 2, label: 'CONSULTA/LISTAGEM',       to: '/lab/faturamento' },
  ],
  J: [],
  K: [],
  L: [
    { num: 1, label: 'CONTROLE BANCÁRIO',       to: '/lab/bancario' },
    { num: 2, label: 'LANÇAMENTOS',             to: '/lab/bancario' },
    { num: 3, label: 'CONSULTA/LISTAGEM',       to: '/lab/bancario' },
  ],
};

export default function LabDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');
  const [selected, setSelected] = useState<ModuleKey | null>(null);

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  const bg        = dark ? '#111111' : '#c8c4b0';
  const panelBg   = dark ? '#1c1c1c' : '#d4d0c8';
  const rowEven   = dark ? '#1c1c1c' : '#d4d0c8';
  const rowOdd    = dark ? '#222222' : '#dedad2';
  const rowBorder = dark ? '#333333' : '#b0aca4';
  const txtMain   = dark ? '#d8d8d8' : '#000000';
  const hdrBg     = 'linear-gradient(90deg, #880000, #cc0000)';
  const hdrTxt    = '#ffcccc';
  const hdrBorder = '#aa2222';
  const accentTxt = dark ? '#ff6666' : '#880000';

  function toggleDark() {
    const next = dark ? '0' : '1';
    localStorage.setItem('lab_dark', next);
    window.dispatchEvent(new Event('labtheme'));
  }

  function handleModulo(letra: ModuleKey, ativo: boolean) {
    if (!ativo) return;
    setSelected(prev => prev === letra ? null : letra);
  }

  function handleOpcao(to?: string) {
    if (to) navigate(to);
  }

  const opcoes = selected ? OPCOES[selected] : [];

  return (
    <div style={{
      minHeight: '100%',
      background: bg,
      padding: '16px',
      fontFamily: "'Montserrat', sans-serif",
      transition: 'background 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>

        {/* ===== PAINEL DE MÓDULOS (esquerda) ===== */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{
            background: hdrBg, color: hdrTxt,
            textAlign: 'center', padding: '5px 12px',
            fontSize: '12px', fontWeight: '700', letterSpacing: '2px',
            border: `2px outset ${hdrBorder}`, borderBottom: 'none',
          }}>
            MÓDULOS
          </div>
          <div style={{ border: `2px inset ${dark ? '#444' : '#808080'}`, background: panelBg }}>
            {MODULOS.map((m, i) => {
              const isSelected = selected === m.letra;
              return (
                <div
                  key={m.letra}
                  onClick={() => handleModulo(m.letra, m.ativo)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '6px 10px',
                    borderBottom: i < MODULOS.length - 1 ? `1px solid ${rowBorder}` : 'none',
                    background: isSelected ? '#880000' : (i % 2 === 0 ? rowEven : rowOdd),
                    color: isSelected ? '#ffcccc' : txtMain,
                    cursor: m.ativo ? 'pointer' : 'default',
                    opacity: m.ativo ? 1 : 0.4,
                    userSelect: 'none',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={e => { if (m.ativo && !isSelected) (e.currentTarget as HTMLElement).style.background = '#660000'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? rowEven : rowOdd; }}
                >
                  <span style={{ fontSize: '15px', width: '26px', textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    {m.nome}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#ffaaaa' : accentTxt, width: '18px', textAlign: 'right', flexShrink: 0 }}>
                    {m.letra}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== PAINEL OPÇÕES (centro, aparece ao selecionar módulo) ===== */}
        {selected && opcoes.length > 0 && (
          <div style={{ width: '260px', flexShrink: 0 }}>
            <div style={{
              background: hdrBg, color: hdrTxt,
              textAlign: 'center', padding: '5px 12px',
              fontSize: '12px', fontWeight: '700', letterSpacing: '2px',
              border: `2px outset ${hdrBorder}`, borderBottom: 'none',
            }}>
              OPÇÕES
            </div>
            <div style={{ border: `2px inset ${dark ? '#444' : '#808080'}`, background: panelBg }}>
              {opcoes.map((op, i) => (
                <div
                  key={op.num}
                  onClick={() => !op.disabled && handleOpcao(op.to)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '6px 10px',
                    borderBottom: i < opcoes.length - 1 ? `1px solid ${rowBorder}` : 'none',
                    background: i % 2 === 0 ? rowEven : rowOdd,
                    color: op.disabled ? (dark ? '#555' : '#aaa') : txtMain,
                    cursor: op.disabled ? 'default' : 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={e => { if (!op.disabled) (e.currentTarget as HTMLElement).style.background = '#880000'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? rowEven : rowOdd; }}
                  onMouseOver={e => { if (!op.disabled) e.currentTarget.querySelectorAll('span').forEach(s => (s as HTMLElement).style.color = '#ffcccc'); }}
                  onMouseOut={e => { e.currentTarget.querySelectorAll('span').forEach(s => (s as HTMLElement).style.color = ''); }}
                >
                  <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {op.label}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: accentTxt, width: '16px', textAlign: 'right', flexShrink: 0 }}>
                    {op.num}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PAINEL LATERAL (direita — info quando sem seleção) ===== */}
        {!selected && (
          <div style={{ width: '200px', flexShrink: 0 }}>
            <div style={{
              background: hdrBg,
              border: `2px outset ${hdrBorder}`,
              padding: '16px 12px',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              <img src="/logo-lab.svg" alt="UpÓticas Lab" style={{ width: '130px', marginBottom: '8px' }} />
              <div style={{ borderTop: '1px solid #6a1a1a', marginTop: '8px', paddingTop: '8px', color: '#d0a0a0', fontSize: '10px', lineHeight: '1.6' }}>
                {tenant?.nome}
              </div>
            </div>

            <div style={{ background: panelBg, border: `2px outset ${dark ? '#555' : '#808080'}`, padding: '10px 12px', marginBottom: '8px' }}>
              <div style={{ background: '#880000', color: '#ffcccc', fontSize: '10px', fontWeight: '700', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>
                ACESSO RÁPIDO
              </div>
              {[
                { label: 'Nova OS',    to: '/lab/ordens/nova', icon: '➕' },
                { label: 'Ver Ordens', to: '/lab/ordens',      icon: '📋' },
                { label: 'Óticas',     to: '/lab/oticas',      icon: '🏪' },
              ].map(item => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    width: '100%', padding: '4px 6px', marginBottom: '4px',
                    background: dark ? '#2a2a2a' : '#c8c4b0',
                    border: `1px outset ${dark ? '#555' : '#a0a098'}`,
                    fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer',
                    color: txtMain, textAlign: 'left', fontWeight: '700',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#880000'; (e.currentTarget as HTMLElement).style.color = '#ffcccc'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = dark ? '#2a2a2a' : '#c8c4b0'; (e.currentTarget as HTMLElement).style.color = txtMain; }}
                >
                  <span>{item.icon}</span>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
                </button>
              ))}
            </div>

            <div style={{ background: panelBg, border: `2px inset ${dark ? '#444' : '#808080'}`, padding: '8px 10px', fontSize: '10px', color: dark ? '#aaa' : '#404040', textAlign: 'center' }}>
              <button
                onClick={toggleDark}
                style={{
                  width: '100%', padding: '4px 6px', marginBottom: '8px',
                  background: dark ? '#333' : '#c8c4b0',
                  border: `1px outset ${dark ? '#555' : '#a0a098'}`,
                  fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer',
                  color: dark ? '#ffcccc' : '#000', fontWeight: '700',
                }}
              >
                {dark ? '☀️ MODO CLARO' : '🌙 MODO NOTURNO'}
              </button>
              <div style={{ fontWeight: '700', color: accentTxt, marginBottom: '4px' }}>UpÓticas Lab</div>
              <div>Versão 1.0</div>
              <div style={{ marginTop: '4px', color: dark ? '#666' : '#606060' }}>Soluções Ópticas</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
