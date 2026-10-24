import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Icone from './Icone';

// Linha do tempo de tudo que aconteceu com o cliente (só admin ou quem tem a permissão).
interface Evento { data: string; tipo: string; descricao: string; valor: number | null; usuario: string | null }

const TIPO: Record<string, { l: string; icone: string; cor: string }> = {
  venda: { l: 'Venda', icone: 'vendas', cor: '#2563eb' },
  pagamento: { l: 'Pagamento', icone: 'dinheiro', cor: '#16a34a' },
  pagamento_editado: { l: 'Pagamento editado', icone: 'editar', cor: '#d97706' },
  parcela: { l: 'Parcela paga', icone: 'carne', cor: '#16a34a' },
  carne: { l: 'Carnê', icone: 'carne', cor: '#7c7c8c' },
  lancamento: { l: 'A receber', icone: 'receber', cor: '#7c7c8c' },
  os: { l: 'O.S.', icone: 'os', cor: '#0f766e' },
  entrega: { l: 'Entrega', icone: 'ok', cor: '#16a34a' },
  receita: { l: 'Receita', icone: 'olho', cor: '#2563eb' },
  funil: { l: 'Funil', icone: 'crm', cor: '#7c7c8c' },
  unificacao: { l: 'Cadastro', icone: 'usuarios', cor: '#d97706' },
};
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const quando = (d: string) => {
  const [dia, hora] = d.replace('T', ' ').split(' ');
  return { dia: dia.split('-').reverse().join('/'), hora: hora ? hora.slice(0, 5) : '' };
};

export default function HistoricoCliente({ clienteId }: { clienteId: string }) {
  const [ev, setEv] = useState<Evento[] | null>(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    api.get<Evento[]>(`/clientes/${clienteId}/movimentacao`).then(setEv).catch(e => setErro(e instanceof Error ? e.message.replace(/\s*\(HTTP \d+\)$/, '') : 'Erro'));
  }, [clienteId]);

  if (erro) return <div style={{ padding: 20, fontSize: 13, color: 'var(--red)' }}>{erro}</div>;
  if (!ev) return <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>Carregando...</div>;
  const tipos = [...new Set(ev.map(e => e.tipo))];
  const lista = filtro ? ev.filter(e => e.tipo === filtro) : ev;

  return (
    <div style={{ padding: 14 }}>
      <div className="seg" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <button className={!filtro ? 'on' : ''} onClick={() => setFiltro('')}>Tudo <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{ev.length}</span></button>
        {tipos.map(t => <button key={t} className={filtro === t ? 'on' : ''} onClick={() => setFiltro(t)}>{TIPO[t]?.l || t}</button>)}
      </div>
      {!lista.length && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma movimentação.</div>}
      <div>
        {lista.map((e, i) => {
          const t = TIPO[e.tipo] || { l: e.tipo, icone: 'info', cor: '#7c7c8c' };
          const q = quando(e.data);
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '84px 28px minmax(0,1fr) auto', gap: 10, alignItems: 'start', padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.35 }}>{q.dia}<div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{q.hora}</div></div>
              <span style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${t.cor}1f`, color: t.cor }}><Icone nome={t.icone} size={14} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{e.descricao}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t.l}{e.usuario ? ` · por ${e.usuario}` : ''}</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: e.tipo === 'pagamento' || e.tipo === 'parcela' ? '#16a34a' : 'var(--text)', whiteSpace: 'nowrap' }}>{e.valor !== null && e.valor !== undefined ? brl(e.valor) : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
