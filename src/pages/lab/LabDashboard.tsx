import { useNavigate } from 'react-router-dom';
import { R } from '../../lib/labTheme';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface OrdemRef { numero?: number; otica_nome?: string | null; created_at?: string; data?: string }
interface Dash {
  total: number; entregues: number; emProducao: number; aguardando: number; pronto: number;
  abertasHoje: number; entreguesHoje: number;
  ultimoCliente: OrdemRef | null; ultimaEntrega: OrdemRef | null;
  lentes: { simples: number; progressiva: number; semTipo: number };
  serie: { dia: string; qtd: number }[];
}

const VAZIO: Dash = {
  total: 0, entregues: 0, emProducao: 0, aguardando: 0, pronto: 0,
  abertasHoje: 0, entreguesHoje: 0, ultimoCliente: null, ultimaEntrega: null,
  lentes: { simples: 0, progressiva: 0, semTipo: 0 }, serie: [],
};

function fmtDataHora(s?: string | null) {
  if (!s) return '—';
  const iso = s.replace(' ', 'T');
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  if (isNaN(d.getTime())) return s.slice(0, 16).replace('T', ' ');
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}
function diaCurto(s: string) {
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
}

export default function LabDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('lab_dark') === '1');
  const [d, setD] = useState<Dash>(VAZIO);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get<Dash>('/lab/dashboard')
      .then(r => setD({ ...VAZIO, ...r }))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    const handler = () => setDark(localStorage.getItem('lab_dark') === '1');
    window.addEventListener('labtheme', handler);
    return () => window.removeEventListener('labtheme', handler);
  }, []);

  function toggleDark() {
    localStorage.setItem('lab_dark', dark ? '0' : '1');
    window.dispatchEvent(new Event('labtheme'));
  }

  const card: React.CSSProperties = {
    background: R.panelGrad, border: '1px solid var(--lab-bdr)',
    borderRadius: '10px', padding: '14px 16px', boxShadow: R.sh,
  };
  const rotulo: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, color: R.dim,
    textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px',
  };

  const maxSerie = Math.max(1, ...d.serie.map(s => s.qtd));
  const totalLentes = d.lentes.simples + d.lentes.progressiva;
  const pctProg = totalLentes ? (d.lentes.progressiva / totalLentes) * 100 : 0;

  // rosca visão simples x progressiva
  const raio = 54, esp = 16, circ = 2 * Math.PI * raio;
  const dashProg = (pctProg / 100) * circ;

  const etapas = [
    { k: 'Aguardando',  v: d.aguardando,  c: '#a07500' },
    { k: 'Em Produção', v: d.emProducao,  c: '#1069c0' },
    { k: 'Pronto',      v: d.pronto,      c: '#0a8a2a' },
    { k: 'Entregue',    v: d.entregues,   c: '#6b7280' },
  ];
  const maxEtapa = Math.max(1, ...etapas.map(e => e.v));

  return (
    <div style={{ minHeight: '100%', background: R.bg, padding: '20px 24px', fontFamily: "'Montserrat', sans-serif" }}>

      {/* cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: R.txt, letterSpacing: '0.3px' }}>Painel do Laboratório</h1>
          <div style={{ fontSize: '12px', color: R.dim, marginTop: '2px' }}>{tenant?.nome}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/lab/ordens/nova')}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, background: R.accent, color: R.onAccent, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: R.shSm }}>
            ➕ Nova OS
          </button>
          <button onClick={toggleDark}
            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 700, background: R.alt, color: R.txt, border: '1px solid var(--lab-bdr)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {dark ? '☀️ Claro' : '🌙 Noturno'}
          </button>
        </div>
      </div>

      {carregando ? (
        <div style={{ ...card, textAlign: 'center', color: R.dim, fontSize: '13px' }}>Carregando métricas...</div>
      ) : (
      <>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div style={card}>
            <div style={rotulo}>Clientes atendidos</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{d.total}</div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px' }}>Total de OS (sem canceladas)</div>
          </div>
          <div style={card}>
            <div style={rotulo}>Atendidos hoje</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: R.accent, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{d.abertasHoje}</div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px' }}>{d.entreguesHoje} entregue(s) hoje</div>
          </div>
          <div style={card}>
            <div style={rotulo}>Último cliente</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: R.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.ultimoCliente?.otica_nome ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px', fontFamily: "'Courier New', monospace" }}>
              {d.ultimoCliente ? `OS #${String(d.ultimoCliente.numero).padStart(4, '0')} · ${fmtDataHora(d.ultimoCliente.created_at)}` : 'Nenhuma OS'}
            </div>
          </div>
          <div style={card}>
            <div style={rotulo}>Última entrega</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: R.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.ultimaEntrega?.otica_nome ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: R.dim, marginTop: '5px', fontFamily: "'Courier New', monospace" }}>
              {d.ultimaEntrega ? `OS #${String(d.ultimaEntrega.numero).padStart(4, '0')} · ${fmtDataHora(d.ultimaEntrega.data)}` : 'Nenhuma entrega'}
            </div>
          </div>
        </div>

        {/* gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '12px', marginBottom: '12px' }}>

          {/* OS por dia — barras */}
          <div style={card}>
            <div style={rotulo}>Atendimentos nos últimos 14 dias</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '150px', marginTop: '10px' }}>
              {d.serie.map(s => (
                <div key={s.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }} title={`${diaCurto(s.dia)} — ${s.qtd} OS`}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%', height: `${(s.qtd / maxSerie) * 100}%`, minHeight: s.qtd > 0 ? '3px' : '0',
                      background: `linear-gradient(180deg, ${R.accent}, ${R.accent2})`,
                      borderRadius: '4px 4px 0 0', boxShadow: R.shSm, transition: 'height .3s',
                    }} />
                  </div>
                  <span style={{ fontSize: '9px', color: R.dim, fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap' }}>{diaCurto(s.dia)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* visão simples x progressiva — rosca */}
          <div style={card}>
            <div style={rotulo}>Tipo de lente</div>
            {totalLentes === 0 ? (
              <div style={{ fontSize: '12px', color: R.dim, padding: '30px 0', textAlign: 'center' }}>Sem lentes registradas</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
                  <circle cx="65" cy="65" r={raio} fill="none" stroke={R.accent} strokeWidth={esp} opacity="0.85" />
                  <circle cx="65" cy="65" r={raio} fill="none" stroke={R.accent2} strokeWidth={esp}
                    strokeDasharray={`${dashProg} ${circ - dashProg}`} transform="rotate(-90 65 65)" />
                  <text x="65" y="61" textAnchor="middle" fontSize="21" fontWeight="800" fill={R.txt} fontFamily="'Courier New', monospace">{totalLentes}</text>
                  <text x="65" y="78" textAnchor="middle" fontSize="9" fill={R.dim} letterSpacing="1">LENTES</text>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {[
                    { nome: 'Visão Simples', v: d.lentes.simples,     c: R.accent },
                    { nome: 'Progressiva',   v: d.lentes.progressiva, c: R.accent2 },
                  ].map(i => (
                    <div key={i.nome} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: i.c, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', color: R.dim, fontWeight: 600 }}>{i.nome}</span>
                      </div>
                      <div style={{ fontSize: '19px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace" }}>
                        {i.v}
                        <span style={{ fontSize: '11px', color: R.dim, fontWeight: 600, marginLeft: '5px' }}>
                          {totalLentes ? Math.round((i.v / totalLentes) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {d.lentes.semTipo > 0 && (
                    <div style={{ fontSize: '10px', color: R.dim }}>{d.lentes.semTipo} sem tipo informado</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* situação da produção */}
        <div style={card}>
          <div style={rotulo}>Situação da produção</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '8px' }}>
            {etapas.map(e => (
              <div key={e.k} onClick={() => navigate('/lab/fluxo')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ width: '96px', fontSize: '11px', color: R.dim, fontWeight: 600, flexShrink: 0 }}>{e.k}</span>
                <div style={{ flex: 1, height: '18px', background: R.alt, borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--lab-bdr)' }}>
                  <div style={{ width: `${(e.v / maxEtapa) * 100}%`, height: '100%', background: e.c, borderRadius: '4px', transition: 'width .3s' }} />
                </div>
                <span style={{ width: '38px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: R.txt, fontFamily: "'Courier New', monospace", flexShrink: 0 }}>{e.v}</span>
              </div>
            ))}
          </div>
        </div>
      </>
      )}
    </div>
  );
}
