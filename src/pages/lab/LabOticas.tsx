import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Otica { id: string; codigo?: string; nome: string; cnpj?: string; telefone?: string; email?: string; cidade?: string; uf?: string; ativo: number; }

const R = { bg:'#c8c4b0', panel:'#d4d0c8', alt:'#dedad2', bdr:'#b0aca4', hdr:'linear-gradient(90deg,#005500,#008800)', hdrTxt:'#ccffcc', hdrBdr:'#007700', txt:'#000', inp:'#fff' };
const INP: React.CSSProperties = { width:'100%', padding:'5px 8px', fontSize:'12px', background:R.inp, border:'1px solid #999', color:R.txt, outline:'none', boxSizing:'border-box', fontFamily:"'Courier New', monospace" };

export default function LabOticas() {
  const navigate = useNavigate();
  const [oticas, setOticas] = useState<Otica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get<Otica[]>('/lab/oticas').then(setOticas).catch(() => setOticas([])).finally(() => setLoading(false));
  }, []);

  const filtradas = oticas.filter(o => !busca || o.nome.toLowerCase().includes(busca.toLowerCase()) || (o.codigo || '').includes(busca));

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', background: R.bg, fontFamily: "'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ background: R.hdr, color: R.hdrTxt, padding: '5px 14px', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', border: `2px outset ${R.hdrBdr}` }}>
          ÓTICAS CLIENTES — {filtradas.length} cadastrada(s)
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou código..." style={{ ...INP, width: '220px' }} />
          <button onClick={() => navigate('/lab/oticas/new')}
            style={{ padding: '5px 16px', fontSize: '12px', fontWeight: '700', background: '#005500', color: R.hdrTxt, border: `1px outset ${R.hdrBdr}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>
            + NOVA ÓTICA
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', border: `2px inset ${R.bdr}` }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#444', fontFamily: "'Courier New', monospace" }}>Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>Nenhuma ótica cadastrada.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: R.hdr }}>
                {['CÓD', 'NOME', 'CNPJ', 'TELEFONE', 'E-MAIL', 'CIDADE/UF', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: R.hdrTxt, letterSpacing: '0.5px', border: `1px solid ${R.hdrBdr}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o, i) => (
                <tr key={o.id} onClick={() => navigate(`/lab/oticas/${o.id}`)}
                  style={{ background: i % 2 === 0 ? R.panel : R.alt, cursor: 'pointer', borderBottom: `1px solid ${R.bdr}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#d0f0d0')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? R.panel : R.alt)}>
                  <td style={{ padding: '7px 12px', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#555' }}>{o.codigo || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '12px', fontWeight: '700', color: R.txt }}>{o.nome}</td>
                  <td style={{ padding: '7px 12px', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#333' }}>{o.cnpj || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#333' }}>{o.telefone || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#333' }}>{o.email || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: '11px', color: '#333' }}>{o.cidade && o.uf ? `${o.cidade}/${o.uf}` : o.cidade || '—'}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: o.ativo ? '#006600' : '#880000', background: o.ativo ? '#ccffcc' : '#ffdddd', padding: '2px 7px', border: `1px solid ${o.ativo ? '#006600' : '#880000'}` }}>
                      {o.ativo ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
