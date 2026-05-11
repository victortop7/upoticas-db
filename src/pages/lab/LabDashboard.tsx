import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function LabDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');
  const [stats, setStats] = useState({ aguardando: 0, em_producao: 0, pronto: 0, hoje: 0 });

  useEffect(() => {
    api.get<{ status: string; created_at: string }[]>('/lab/ordens').then(ordens => {
      const hoje = new Date().toISOString().split('T')[0];
      setStats({
        aguardando:  ordens.filter(o => o.status === 'aguardando').length,
        em_producao: ordens.filter(o => o.status === 'em_producao').length,
        pronto:      ordens.filter(o => o.status === 'pronto').length,
        hoje:        ordens.filter(o => o.created_at?.startsWith(hoje)).length,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  const panelBg   = dark ? '#1c1c1c' : '#d4d0c8';
  const rowBg     = dark ? '#2a2a2a' : '#c8c4b0';
  const txtMain   = dark ? '#d8d8d8' : '#000000';
  const accentTxt = dark ? '#ff6666' : '#880000';
  const hdrBg     = 'linear-gradient(90deg, #880000, #cc0000)';
  const hdrBorder = '#aa2222';

  function toggleDark() {
    const next = dark ? '0' : '1';
    localStorage.setItem('lab_dark', next);
    window.dispatchEvent(new Event('labtheme'));
  }

  return (
    <div style={{ minHeight: '100%', background: dark ? '#111' : '#c8c4b0', padding: '16px', fontFamily: "'Montserrat', sans-serif", display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* Logo */}
      <div style={{ background: hdrBg, border: `2px outset ${hdrBorder}`, padding: '16px 20px', textAlign: 'center', minWidth: '180px' }}>
        <img src="/logo-lab.svg" alt="UpÓticas Lab" style={{ width: '130px', marginBottom: '8px' }} />
        <div style={{ borderTop: '1px solid #6a1a1a', marginTop: '8px', paddingTop: '8px', color: '#d0a0a0', fontSize: '11px', lineHeight: '1.6' }}>
          {tenant?.nome}
        </div>
      </div>

      {/* Stats Produção */}
      <div style={{ background: panelBg, border: `2px inset ${dark ? '#444' : '#808080'}`, padding: '8px 10px', minWidth: '180px' }}>
        <div style={{ background: '#880000', color: '#ffcccc', fontSize: '10px', fontWeight: '700', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>PRODUÇÃO</div>
        {[
          { label: 'Hoje',        val: stats.hoje,        color: '#60a5fa' },
          { label: 'Aguardando',  val: stats.aguardando,  color: '#f59e0b' },
          { label: 'Em Produção', val: stats.em_producao, color: '#3b82f6' },
          { label: 'Prontos',     val: stats.pronto,      color: '#22c55e' },
        ].map(({ label, val, color }) => (
          <div key={label} onClick={() => navigate('/lab/ordens')}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 6px', marginBottom: '2px', cursor: 'pointer', borderRadius: '2px' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#880000'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <span style={{ fontSize: '11px', color: dark ? '#aaa' : '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            <span style={{ fontSize: '15px', fontWeight: '900', color, fontFamily: 'monospace' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Acesso Rápido */}
      <div style={{ background: panelBg, border: `2px outset ${dark ? '#555' : '#808080'}`, padding: '8px 10px', minWidth: '180px' }}>
        <div style={{ background: '#880000', color: '#ffcccc', fontSize: '10px', fontWeight: '700', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>ACESSO RÁPIDO</div>
        {[
          { label: 'Nova OS',       to: '/lab/ordens/nova', icon: '➕' },
          { label: 'Fila Produção', to: '/lab/fluxo',       icon: '⚡' },
          { label: 'Ver Ordens',    to: '/lab/ordens',      icon: '📋' },
          { label: 'Óticas',        to: '/lab/oticas',      icon: '🏪' },
        ].map(item => (
          <button key={item.to} onClick={() => navigate(item.to)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '5px 6px', marginBottom: '4px', background: rowBg, border: `1px outset ${dark ? '#555' : '#a0a098'}`, fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer', color: txtMain, textAlign: 'left', fontWeight: '700' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#880000'; (e.currentTarget as HTMLElement).style.color = '#ffcccc'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; (e.currentTarget as HTMLElement).style.color = txtMain; }}>
            <span>{item.icon}</span>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Dark mode + versão */}
      <div style={{ background: panelBg, border: `2px inset ${dark ? '#444' : '#808080'}`, padding: '10px 12px', fontSize: '10px', color: dark ? '#aaa' : '#404040', textAlign: 'center', minWidth: '160px' }}>
        <button onClick={toggleDark}
          style={{ width: '100%', padding: '5px 8px', marginBottom: '10px', background: rowBg, border: `1px outset ${dark ? '#555' : '#a0a098'}`, fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer', color: dark ? '#ffcccc' : '#000', fontWeight: '700' }}>
          {dark ? '☀️ MODO CLARO' : '🌙 MODO NOTURNO'}
        </button>
        <div style={{ fontWeight: '700', color: accentTxt, marginBottom: '4px' }}>UpÓticas Lab</div>
        <div>Versão 1.0</div>
        <div style={{ marginTop: '4px', color: dark ? '#666' : '#606060' }}>Soluções Ópticas</div>
      </div>
    </div>
  );
}
