import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface VendedorStat {
  vendedor: string;
  perfil: string;
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  total_desconto: number;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
}

interface ModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function brl(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const PERFIL_LABEL: Record<string, string> = { admin: 'Admin', vendedor: 'Vendedor', caixa: 'Caixa', marketing: 'Marketing' };
const PERFIL_COLOR: Record<string, { bg: string; color: string }> = {
  admin:     { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
  vendedor:  { bg: 'rgba(37,99,235,0.1)',  color: '#2563eb' },
  caixa:     { bg: 'rgba(34,197,94,0.1)',  color: '#16a34a' },
  marketing: { bg: 'rgba(236,72,153,0.1)', color: '#db2777' },
};

function NovoVendedorModal({ onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'vendedor', senha: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px' };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErro('');
    try {
      await api.post('/usuarios', form);
      onSaved();
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Novo Vendedor</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        <form onSubmit={submit} style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Nome *</label>
            <input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" autoFocus />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>E-mail *</label>
            <input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Perfil</label>
              <select style={inp} value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                <option value="vendedor">Vendedor</option>
                <option value="marketing">Marketing</option>
                <option value="caixa">Caixa</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Senha *</label>
              <input type="password" style={inp} value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mín. 6 caracteres" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            {erro && <span style={{ fontSize: '13px', color: 'var(--red)', flex: 1, alignSelf: 'center' }}>{erro}</span>}
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', fontSize: '14px', background: 'var(--surface-alt)', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: '600', background: saving ? 'var(--primary-dim)' : 'var(--primary)', color: saving ? 'var(--primary)' : 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getPeriodo(tipo: string) {
  const hoje = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  if (tipo === 'hoje') return { inicio: fmt(hoje), fim: fmt(hoje) };
  if (tipo === '7d')  { const d = new Date(hoje); d.setDate(d.getDate()-6); return { inicio: fmt(d), fim: fmt(hoje) }; }
  if (tipo === '30d') { const d = new Date(hoje); d.setDate(d.getDate()-29); return { inicio: fmt(d), fim: fmt(hoje) }; }
  if (tipo === 'mes') return { inicio: `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-01`, fim: fmt(hoje) };
  const d = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  return { inicio: fmt(d), fim: fmt(fim) };
}

export default function Vendedores() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.perfil === 'admin';
  const [tipoPeriodo, setTipoPeriodo] = useState('mes');
  const [stats, setStats] = useState<VendedorStat[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoOpen, setNovoOpen] = useState(false);

  useEffect(() => {
    if (usuario?.perfil === 'marketing') { navigate('/vendas'); return; }
  }, [usuario, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = getPeriodo(tipoPeriodo);
      const [resumo, users] = await Promise.all([
        api.get<{ por_vendedor: VendedorStat[] }>(`/relatorios/resumo?inicio=${p.inicio}&fim=${p.fim}`),
        api.get<{ usuarios: Usuario[] }>('/usuarios'),
      ]);
      setStats(resumo.por_vendedor);
      setUsuarios(users.usuarios.filter(u => u.ativo));
    } finally { setLoading(false); }
  }, [tipoPeriodo]);

  useEffect(() => { load(); }, [load]);

  const PERIODOS = [
    { key: 'hoje', label: 'Hoje' },
    { key: '7d',   label: '7 dias' },
    { key: '30d',  label: '30 dias' },
    { key: 'mes',  label: 'Este mês' },
    { key: 'mes_ant', label: 'Mês passado' },
  ];

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', fontSize: '13px', fontWeight: '500',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: '20px', cursor: 'pointer',
    background: active ? 'var(--primary)' : 'var(--surface)',
    color: active ? 'white' : 'var(--text-dim)',
  });

  // vendedores sem vendas no período também aparecem
  const todosVendedores = usuarios.map(u => {
    const s = stats.find(s => s.vendedor === u.nome);
    return s || { vendedor: u.nome, perfil: u.perfil, total_vendas: 0, valor_total: 0, ticket_medio: 0, total_desconto: 0 };
  }).sort((a, b) => b.valor_total - a.valor_total);

  const totalGeral = stats.reduce((s, v) => s + v.valor_total, 0);
  const totalVendas = stats.reduce((s, v) => s + v.total_vendas, 0);

  const MEDALHAS = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>
            {isAdmin ? 'Vendedores' : 'Ranking de Vendas'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>
            {isAdmin ? `${usuarios.length} colaboradores ativos` : 'Seu desempenho no período'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setNovoOpen(true)} style={{ padding: '9px 18px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            + Novo Vendedor
          </button>
        )}
      </div>

      {/* Filtro período */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {PERIODOS.map(p => (
          <button key={p.key} style={filterBtn(tipoPeriodo === p.key)} onClick={() => setTipoPeriodo(p.key)}>{p.label}</button>
        ))}
      </div>

      {/* KPIs gerais — só admin */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total vendido', value: brl(totalGeral), color: '#2563eb', sub: `${totalVendas} vendas no período` },
            { label: 'Ticket médio geral', value: brl(totalVendas > 0 ? totalGeral / totalVendas : 0), color: '#16a34a', sub: 'Média de todas as vendas' },
            { label: 'Vendedores ativos', value: String(usuarios.length), color: '#7c3aed', sub: 'Colaboradores cadastrados' },
          ].map((card, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
              <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: card.color, fontFamily: 'var(--mono)' }}>{card.value}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
            {isAdmin ? 'Desempenho por Colaborador' : 'Ranking do Período'}
          </h3>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {isAdmin
                  ? ['#', 'Colaborador', 'Perfil', 'Vendas', 'Total Vendido', 'Ticket Médio', 'Descontos', 'Participação']
                  : ['#', 'Vendedor', 'Vendas', 'Seu Total', 'Seu Ticket Médio']
                }.map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: ['#','Colaborador','Vendedor','Perfil'].includes(h) ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--surface-alt)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todosVendedores.map((v, i) => {
                const pc = PERFIL_COLOR[v.perfil] || PERFIL_COLOR.vendedor;
                const participacao = totalGeral > 0 ? (v.valor_total / totalGeral * 100) : 0;
                const isMe = v.vendedor === usuario?.nome;
                return (
                  <tr key={i}
                    style={{
                      borderBottom: i < todosVendedores.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isMe && !isAdmin ? 'rgba(37,99,235,0.05)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = isMe && !isAdmin ? 'rgba(37,99,235,0.08)' : 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isMe && !isAdmin ? 'rgba(37,99,235,0.05)' : 'transparent')}
                  >
                    {/* Posição / Medalha */}
                    <td style={{ padding: '14px 16px', width: '48px' }}>
                      <span style={{ fontSize: i < 3 ? '18px' : '13px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                        {i < 3 ? MEDALHAS[i] : `#${i + 1}`}
                      </span>
                    </td>
                    {/* Nome */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: pc.bg, border: `1px solid ${pc.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: pc.color, flexShrink: 0 }}>
                          {v.vendedor.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{v.vendedor}</span>
                          {isMe && !isAdmin && <span style={{ marginLeft: '6px', fontSize: '11px', background: 'rgba(37,99,235,0.12)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>Você</span>}
                        </div>
                      </div>
                    </td>
                    {/* Perfil — só admin */}
                    {isAdmin && (
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: pc.bg, color: pc.color }}>
                          {PERFIL_LABEL[v.perfil] || v.perfil}
                        </span>
                      </td>
                    )}
                    {/* Qtd vendas — visível para todos */}
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: v.total_vendas > 0 ? 'var(--text)' : 'var(--text-muted)', textAlign: 'right', fontWeight: v.total_vendas > 0 ? '600' : '400' }}>
                      {v.total_vendas}
                    </td>
                    {/* Valores — admin vê todos, vendedor só o próprio */}
                    {isAdmin ? (
                      <>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: '700', color: v.valor_total > 0 ? '#16a34a' : 'var(--text-muted)', textAlign: 'right' }}>{brl(v.valor_total)}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: v.ticket_medio > 0 ? '#2563eb' : 'var(--text-muted)', textAlign: 'right' }}>{brl(v.ticket_medio)}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '13px', color: v.total_desconto > 0 ? '#d97706' : 'var(--text-muted)', textAlign: 'right' }}>{brl(v.total_desconto)}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'var(--surface-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${participacao}%`, background: pc.color, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>{participacao.toFixed(0)}%</span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '13px', textAlign: 'right', fontWeight: '700', color: isMe ? '#16a34a' : 'var(--text-muted)' }}>
                          {isMe ? brl(v.valor_total) : '••••••'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '13px', textAlign: 'right', color: isMe ? '#2563eb' : 'var(--text-muted)' }}>
                          {isMe ? brl(v.ticket_medio) : '••••'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {isAdmin && novoOpen && (
        <NovoVendedorModal
          onClose={() => setNovoOpen(false)}
          onSaved={() => { setNovoOpen(false); load(); }}
        />
      )}
    </div>
  );
}
