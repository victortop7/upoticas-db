import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

const MODULOS = [
  { letra: 'A', nome: 'CONFIGURAÇÕES',              icon: '⚙',  to: '/lab/configuracoes' },
  { letra: 'B', nome: 'ÓTICAS CLIENTES',             icon: '🏪', to: '/lab/oticas' },
  { letra: 'C', nome: 'FORNECEDORES/OFTALMOS',       icon: '🏭', to: '/lab/fornecedores' },
  { letra: 'D', nome: 'CADASTRO DE PRODUTOS',        icon: '📦', to: '/lab/produtos' },
  { letra: 'E', nome: 'CADASTRO DE ESTOQUE',         icon: '🗂️', to: '/lab/estoque' },
  { letra: 'F', nome: 'MOVIMENTAÇÃO DE ESTOQUE',     icon: '🔄', to: '/lab/estoque' },
  { letra: 'G', nome: 'PEDIDOS / ORDENS DE SERVIÇO', icon: '📋', to: '/lab/ordens' },
  { letra: 'H', nome: 'NOTAS FISCAIS/FECHAMENTOS',   icon: '🧾', to: null },
  { letra: 'I', nome: 'FATURAMENTO',                 icon: '💰', to: '/lab/faturamento' },
  { letra: 'J', nome: 'CONTAS A RECEBER',            icon: '📥', to: null },
  { letra: 'K', nome: 'CONTAS A PAGAR',              icon: '📤', to: null },
  { letra: 'L', nome: 'CONTROLE BANCÁRIO',           icon: '🏛️', to: '/lab/bancario' },
];

export default function LabDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');

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

  return (
    <div style={{
      minHeight: '100%',
      background: bg,
      padding: '16px',
      fontFamily: "'Montserrat', sans-serif",
      transition: 'background 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>

        {/* ===== PAINEL DE MÓDULOS (esquerda) ===== */}
        <div style={{ flex: 1, maxWidth: '520px' }}>

          {/* Header do painel */}
          <div style={{
            background: hdrBg,
            color: hdrTxt,
            textAlign: 'center',
            padding: '5px 12px',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            border: `2px outset ${hdrBorder}`,
            borderBottom: 'none',
          }}>
            MÓDULOS
          </div>

          {/* Lista */}
          <div style={{ border: `2px inset ${dark ? '#444' : '#808080'}`, background: panelBg }}>
            {MODULOS.map((m, i) => (
              <div
                key={m.letra}
                onClick={() => m.to && navigate(m.to)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '7px 10px',
                  borderBottom: i < MODULOS.length - 1 ? `1px solid ${rowBorder}` : 'none',
                  background: i % 2 === 0 ? rowEven : rowOdd,
                  cursor: m.to ? 'pointer' : 'default',
                  opacity: m.to ? 1 : 0.45,
                  userSelect: 'none',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={e => { if (m.to) (e.currentTarget as HTMLElement).style.background = '#880000'; }}
                onMouseLeave={e => { if (m.to) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? rowEven : rowOdd; }}
                onMouseOver={e => { if (m.to) e.currentTarget.querySelectorAll('span').forEach(s => (s as HTMLElement).style.color = '#ffffff'); }}
                onMouseOut={e => { e.currentTarget.querySelectorAll('span').forEach(s => (s as HTMLElement).style.color = ''); }}
              >
                <span style={{ fontSize: '16px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                <span style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: txtMain, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  {m.nome}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: accentTxt, width: '20px', textAlign: 'right', flexShrink: 0 }}>
                  {m.letra}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== PAINEL LATERAL (direita) ===== */}
        <div style={{ width: '200px', flexShrink: 0 }}>

          {/* Logo */}
          <div style={{
            background: hdrBg,
            border: `2px outset ${hdrBorder}`,
            padding: '16px 12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>🔬</div>
            <div style={{ color: '#ffaaaa', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>UpÓticas</div>
            <div style={{ color: hdrTxt, fontSize: '11px', letterSpacing: '2px' }}>LAB</div>
            <div style={{ borderTop: '1px solid #6a1a1a', marginTop: '8px', paddingTop: '8px', color: '#a0d0a0', fontSize: '10px', lineHeight: '1.6' }}>
              {tenant?.nome}
            </div>
          </div>

          {/* Acesso rápido */}
          <div style={{ background: panelBg, border: `2px outset ${dark ? '#555' : '#808080'}`, padding: '10px 12px', marginBottom: '8px' }}>
            <div style={{ background: '#880000', color: hdrTxt, fontSize: '10px', fontWeight: 'bold', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>
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
                  color: txtMain, textAlign: 'left', fontWeight: 'bold',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#880000'; (e.currentTarget as HTMLElement).style.color = '#ffcccc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = dark ? '#2a2a2a' : '#c8c4b0'; (e.currentTarget as HTMLElement).style.color = txtMain; }}
              >
                <span>{item.icon}</span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Modo noturno + Versão */}
          <div style={{ background: panelBg, border: `2px inset ${dark ? '#444' : '#808080'}`, padding: '8px 10px', fontSize: '10px', color: dark ? '#aaaaaa' : '#404040', textAlign: 'center' }}>
            <button
              onClick={toggleDark}
              style={{
                width: '100%', padding: '4px 6px', marginBottom: '8px',
                background: dark ? '#333' : '#c8c4b0',
                border: `1px outset ${dark ? '#555' : '#a0a098'}`,
                fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer',
                color: dark ? '#ffcccc' : '#000000', fontWeight: 'bold',
              }}
            >
              {dark ? '☀️ MODO CLARO' : '🌙 MODO NOTURNO'}
            </button>
            <div style={{ fontWeight: 'bold', color: accentTxt, marginBottom: '4px' }}>UpÓticas Lab</div>
            <div>Versão 1.0</div>
            <div style={{ marginTop: '4px', color: dark ? '#666' : '#606060' }}>Soluções Ópticas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
