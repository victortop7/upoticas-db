import { useNavigate } from 'react-router-dom';
import { R } from '../../lib/labTheme';
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

  const panelBg   = dark ? '#1c1c1c' : R.panel;
  const rowEven   = dark ? '#1c1c1c' : R.panel;
  const rowOdd    = dark ? R.txt : R.alt;
  const rowBorder = dark ? R.txt : 'var(--lab-bdr)';
  const txtMain   = dark ? '#d8d8d8' : R.txt;
  const accentTxt = dark ? '#66cc77' : R.accent;
  const hdrBg     = 'var(--lab-hdr)';
  const hdrBorder = R.accent;

  function toggleDark() {
    const next = dark ? '0' : '1';
    localStorage.setItem('lab_dark', next);
    window.dispatchEvent(new Event('labtheme'));
  }

  return (
    <div style={{ minHeight: '100%', background: dark ? '#111' : R.bg, padding: '16px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Logo */}
        <div style={{ background: hdrBg, border: `2px outset ${hdrBorder}`, padding: '16px 12px', textAlign: 'center' }}>
          <img src="/logo-lab.svg" alt="Connect LAB" style={{ width: '130px', marginBottom: '8px' }} />
          <div style={{ borderTop: '1px solid var(--lab-hdr-bdr)', marginTop: '8px', paddingTop: '8px', color: '#a0d0a8', fontSize: '10px', lineHeight: '1.6' }}>
            {tenant?.nome}
          </div>
        </div>

        {/* Stats Produção */}
        <div style={{ background: panelBg, border: `2px inset ${dark ? R.dim : R.dim}`, padding: '8px 10px' }}>
          <div style={{ background: R.accent, color: 'var(--lab-hdr-txt)', fontSize: '10px', fontWeight: '700', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>PRODUÇÃO</div>
          {[
            { label: 'Hoje',        val: stats.hoje,        color: '#60a5fa' },
            { label: 'Aguardando',  val: stats.aguardando,  color: '#f59e0b' },
            { label: 'Em Produção', val: stats.em_producao, color: '#3b82f6' },
            { label: 'Prontos',     val: stats.pronto,      color: '#22c55e' },
          ].map(({ label, val, color }) => (
            <div key={label} onClick={() => navigate('/lab/ordens')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', marginBottom: '2px', cursor: 'pointer', borderRadius: '2px' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = R.accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <span style={{ fontSize: '10px', color: dark ? '#aaa' : R.dim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              <span style={{ fontSize: '14px', fontWeight: '900', color, fontFamily: 'monospace' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Acesso Rápido */}
        <div style={{ background: panelBg, border: `2px outset ${dark ? R.dim : R.dim}`, padding: '8px 10px' }}>
          <div style={{ background: R.accent, color: 'var(--lab-hdr-txt)', fontSize: '10px', fontWeight: '700', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>ACESSO RÁPIDO</div>
          {[
            { label: 'Nova OS',       to: '/lab/ordens/nova', icon: '➕' },
            { label: 'Fila Produção', to: '/lab/fluxo',       icon: '⚡' },
            { label: 'Ver Ordens',    to: '/lab/ordens',      icon: '📋' },
            { label: 'Óticas',        to: '/lab/oticas',      icon: '🏪' },
          ].map((item, i) => (
            <button key={item.to} onClick={() => navigate(item.to)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '4px 6px', marginBottom: '4px', background: i % 2 === 0 ? rowEven : rowOdd, border: `1px outset ${dark ? R.dim : '#a0a098'}`, fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer', color: txtMain, textAlign: 'left', fontWeight: '700', borderBottom: `1px solid ${rowBorder}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = R.accent; (e.currentTarget as HTMLElement).style.color = 'var(--lab-hdr-txt)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? rowEven : rowOdd; (e.currentTarget as HTMLElement).style.color = txtMain; }}>
              <span>{item.icon}</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Dark mode + versão */}
        <div style={{ background: panelBg, border: `2px inset ${dark ? R.dim : R.dim}`, padding: '8px 10px', fontSize: '10px', color: dark ? '#aaa' : '#404040', textAlign: 'center' }}>
          <button onClick={toggleDark}
            style={{ width: '100%', padding: '4px 6px', marginBottom: '8px', background: dark ? R.txt : R.bg, border: `1px outset ${dark ? R.dim : '#a0a098'}`, fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer', color: dark ? 'var(--lab-hdr-txt)' : R.txt, fontWeight: '700' }}>
            {dark ? '☀️ MODO CLARO' : '🌙 MODO NOTURNO'}
          </button>
          <div style={{ fontWeight: '700', color: accentTxt, marginBottom: '4px' }}>Connect LAB</div>
          <div>Versão 1.0</div>
          <div style={{ marginTop: '4px', color: dark ? R.dim : R.dim }}>Soluções Ópticas</div>
        </div>

      </div>
    </div>
  );
}
