import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Servico {
  id: string; codigo: string; nome: string;
  unidade: string; valor_padrao: number; valor_lista2: number; ativo: number;
}

const SEED_PRODUTOS = [
  { codigo:'0300', nome:'ACCLIMATES UHD DIGITAL',                   unidade:'UN', preco1:0,      preco2:0 },
  { codigo:'0260', nome:'ALTERAÇÃO DE MODELO',                      unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0012', nome:'ANTIRREFLEXO',                             unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0007', nome:'ANTIRRISCO',                               unidade:'',   preco1:10.00,  preco2:10.00 },
  { codigo:'0276', nome:'ARMAÇÃO',                                  unidade:'',   preco1:75.00,  preco2:0 },
  { codigo:'0309', nome:'ARMAÇÃO ACETATO',                          unidade:'',   preco1:20.00,  preco2:20.00 },
  { codigo:'0206', nome:'BF FLAT TOP CR39 INCOLOR',                 unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0207', nome:'BF FLAT TOP FOTO CR39',                    unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0120', nome:'BF FLATTOP CR39',                          unidade:'',   preco1:33.60,  preco2:0 },
  { codigo:'0229', nome:'BF FLATTOP CR39 FOTO',                     unidade:'',   preco1:72.00,  preco2:0 },
  { codigo:'0147', nome:'BF FLATTOP CR39 FOTO',                     unidade:'',   preco1:32.00,  preco2:0 },
  { codigo:'0135', nome:'BF KRIPTOK CR39 INCOLOR',                  unidade:'',   preco1:107.00, preco2:0 },
  { codigo:'0205', nome:'BF KRIPTOK FOTO',                          unidade:'UN', preco1:71.00,  preco2:69.50 },
  { codigo:'0122', nome:'BF KRIPTOK FOTO AR',                       unidade:'UN', preco1:39.00,  preco2:38.22 },
  { codigo:'0203', nome:'BF KRIPTOK INCOLOR',                       unidade:'UN', preco1:55.00,  preco2:0 },
  { codigo:'0116', nome:'BF KRIPTOK INCOLOR LENTE PRONTA',          unidade:'',   preco1:67.00,  preco2:0 },
  { codigo:'0146', nome:'BF KRIPTOK LENTE PRONTA',                  unidade:'',   preco1:20.00,  preco2:0 },
  { codigo:'0233', nome:'BF OMEGA ORMA',                            unidade:'',   preco1:0,      preco2:0 },
  { codigo:'0094', nome:'BF ULTEX CR39 FOTO',                       unidade:'',   preco1:53.00,  preco2:0 },
  { codigo:'0093', nome:'BF ULTEX CR39 INCOLOR',                    unidade:'UN', preco1:280.00, preco2:280.00 },
  { codigo:'0204', nome:'BF ULTEX FOTO',                            unidade:'UN', preco1:71.00,  preco2:69.50 },
  { codigo:'0202', nome:'BF ULTEX INCOLOR',                         unidade:'',   preco1:39.00,  preco2:38.22 },
  { codigo:'0174', nome:'BF ULTEX INCOLOR LENTE PRONTA',            unidade:'',   preco1:55.00,  preco2:0 },
  { codigo:'0145', nome:'BF ULTEX LENTE PRONTA',                    unidade:'',   preco1:20.00,  preco2:0 },
  { codigo:'0259', nome:'BF. KRIPTOK INCOLOR CRISTAL',              unidade:'',   preco1:20.00,  preco2:0 },
  { codigo:'0069', nome:'BS CR39 FOTO',                             unidade:'',   preco1:53.00,  preco2:0 },
  { codigo:'0272', nome:'BUS 1.60 INCOLOR',                         unidade:'UN', preco1:80.00,  preco2:53.90 },
  { codigo:'0235', nome:'BUS 1.60 INCOLOR BLUE',                    unidade:'',   preco1:100.00, preco2:100.00 },
  { codigo:'0271', nome:'BUS 1.61 ALTO INDICE INCOLOR',             unidade:'',   preco1:120.00, preco2:120.00 },
  { codigo:'0148', nome:'BUS 1.67 FOTO C/ AR',                      unidade:'',   preco1:410.00, preco2:0 },
  { codigo:'0155', nome:'BUS 1.67 FOTO COM AR LUZ AZUL',            unidade:'',   preco1:437.00, preco2:0 },
  { codigo:'0138', nome:'BUS 1.67 INCOLOR',                         unidade:'',   preco1:224.00, preco2:0 },
  { codigo:'0074', nome:'BUS 1.67 INCOLOR C/ AR EXTERNO',           unidade:'',   preco1:220.00, preco2:0 },
  { codigo:'0141', nome:'BUS 1.67 PHOTO FUSION',                    unidade:'',   preco1:242.00, preco2:0 },
  { codigo:'0142', nome:'BUS 1.67 TRANSITIONS',                     unidade:'',   preco1:407.00, preco2:0 },
  { codigo:'0281', nome:'BUS 1.74 INCOLOR',                         unidade:'',   preco1:617.00, preco2:0 },
  { codigo:'0149', nome:'BUS ALTO INDICE BLUE CUT 1.67',            unidade:'',   preco1:560.00, preco2:0 },
  { codigo:'0185', nome:'BUS ALTO INDICE FOTO 1.67',                unidade:'UN', preco1:345.00, preco2:330.10 },
  { codigo:'0186', nome:'BUS ALTO INDICE FOTO BLUE CUT 1.67',       unidade:'UN', preco1:396.00, preco2:361.62 },
  { codigo:'0076', nome:'BUS ALTO INDICE INCOLOR 1.74',             unidade:'',   preco1:301.00, preco2:0 },
  { codigo:'0184', nome:'BUS ALTO INDICE INCOLOR ANTIRREFLEXO',     unidade:'UN', preco1:175.00, preco2:171.50 },
  { codigo:'0177', nome:'BUS CR39 ANTIRREFLEXO',                    unidade:'UN', preco1:47.00,  preco2:41.74 },
  { codigo:'0140', nome:'BUS CR39 BLUE CUT',                        unidade:'',   preco1:59.00,  preco2:0 },
  { codigo:'0179', nome:'BUS CR39 FOTO BLUE CUT',                   unidade:'UN', preco1:62.00,  preco2:60.76 },
  { codigo:'0131', nome:'BUS CR39 FOTO BLUE CUT 125',               unidade:'UN', preco1:125.00, preco2:122.50 },
  { codigo:'0117', nome:'BUS CR39 INCOLOR 75MM',                    unidade:'UN', preco1:41.00,  preco2:40.18 },
  { codigo:'0180', nome:'BUS CR39 TRANSITIONS',                     unidade:'UN', preco1:222.00, preco2:197.96 },
  { codigo:'0078', nome:'BUS FOTO C/ AR EXTERNO',                   unidade:'',   preco1:53.00,  preco2:0 },
  { codigo:'0126', nome:'BUS INCOLOR 1.67',                         unidade:'',   preco1:168.00, preco2:0 },
  { codigo:'0072', nome:'BUS POLI C/ AR EXTERNO',                   unidade:'',   preco1:90.00,  preco2:0 },
  { codigo:'0158', nome:'BUS POLI FOTO C/ AR EXTERNO',              unidade:'',   preco1:210.00, preco2:0 },
  { codigo:'0182', nome:'BUS POLICARBONATO ANTIRREFLEXO OPTO',      unidade:'',   preco1:73.00,  preco2:0 },
  { codigo:'0073', nome:'BUS POLICARBONATO FOTO (MASSA)',            unidade:'',   preco1:192.00, preco2:0 },
  { codigo:'0183', nome:'BUS POLICARBONATO FOTO INSTYLE PELICULA',  unidade:'',   preco1:286.00, preco2:0 },
  { codigo:'0071', nome:'BUS POLICARBONATO INCOLOR',                unidade:'',   preco1:48.00,  preco2:0 },
  { codigo:'0293', nome:'BUS POLICARBONATO INCOLOR (120)',           unidade:'',   preco1:120.00, preco2:120.00 },
  { codigo:'0181', nome:'BUS POLY INC. (1.59) BASES 050/2/4/6/8',   unidade:'',   preco1:40.00,  preco2:0 },
  { codigo:'0218', nome:'BUS POLY TRANSITIONS VIII',                 unidade:'',   preco1:450.00, preco2:0 },
];

function brl(v: number) { return v > 0 ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—'; }

const INP: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '13px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--mono)' };
const LBL: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' };

export default function LabServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Servico | null>(null);
  const [form, setForm] = useState({ codigo: '', nome: '', unidade: '', valor_padrao: '', valor_lista2: '' });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  function load() {
    setLoading(true);
    api.get<Servico[]>('/lab/servicos').then(setServicos).catch(() => setServicos([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNovo() {
    setEditItem(null);
    setForm({ codigo: '', nome: '', unidade: 'UN', valor_padrao: '', valor_lista2: '' });
    setErro('');
    setModal(true);
  }

  function openEdit(s: Servico) {
    setEditItem(s);
    setForm({ codigo: s.codigo || '', nome: s.nome, unidade: s.unidade || '', valor_padrao: s.valor_padrao > 0 ? String(s.valor_padrao) : '', valor_lista2: s.valor_lista2 > 0 ? String(s.valor_lista2) : '' });
    setErro('');
    setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErro('');
    const payload = {
      codigo: form.codigo || null,
      nome: form.nome,
      unidade: form.unidade || null,
      valor_padrao: parseFloat(form.valor_padrao.replace(',', '.')) || 0,
      valor_lista2: parseFloat(form.valor_lista2.replace(',', '.')) || null,
    };
    try {
      if (editItem) { await api.put(`/lab/servicos/${editItem.id}`, payload); }
      else { await api.post('/lab/servicos', payload); }
      setModal(false); load();
    } catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao salvar'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este serviço?')) return;
    try { await api.delete(`/lab/servicos/${id}`); load(); } catch {}
  }

  async function handleSeed() {
    if (!confirm(`Importar ${SEED_PRODUTOS.length} produtos do catálogo? Produtos já existentes (mesmo código) serão ignorados.`)) return;
    setSeeding(true);
    try {
      const r = await api.post<{ ok: boolean; inserted: number }>('/lab/servicos', { seed: true, items: SEED_PRODUTOS });
      alert(`${r.inserted} produtos importados com sucesso!`);
      load();
    } catch { alert('Erro ao importar'); }
    setSeeding(false);
  }

  const filtrado = servicos.filter(s =>
    !busca || s.nome.toLowerCase().includes(busca.toLowerCase()) || (s.codigo || '').includes(busca)
  );

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Catálogo de Serviços / Produtos</h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>{servicos.length} item(s) cadastrado(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSeed} disabled={seeding}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', background: seeding ? 'var(--text-muted)' : 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '7px', cursor: seeding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {seeding ? 'Importando...' : '📥 Importar Catálogo'}
          </button>
          <button onClick={openNovo}
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '600', background: '#880000', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Novo
          </button>
        </div>
      </div>

      {/* Busca */}
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por código ou nome..."
        style={{ ...INP, marginBottom: '10px', fontFamily: 'var(--sans)' }} />

      {/* Tabela */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : filtrado.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum serviço. Use "Importar Catálogo" para carregar os produtos.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                {['CÓDIGO', 'DESCRIÇÃO', 'UN', 'PREÇO 1', 'PREÇO 2', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'PREÇO 1' || h === 'PREÇO 2' ? 'right' : 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{s.codigo || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{s.nome}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{s.unidade || '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text)', textAlign: 'right' }}>{brl(s.valor_padrao)}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', textAlign: 'right' }}>{brl(s.valor_lista2)}</td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(s)} style={{ fontSize: '11px', padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit', marginRight: '4px' }}>Editar</button>
                    <button onClick={() => handleDelete(s.id)} style={{ fontSize: '11px', padding: '2px 8px', background: 'transparent', border: '1px solid var(--red)', borderRadius: '4px', cursor: 'pointer', color: 'var(--red)', fontFamily: 'inherit' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>{editItem ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            {erro && <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '7px', padding: '9px 12px', marginBottom: '14px', fontSize: '12px', color: 'var(--red)' }}>{erro}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px', gap: '10px' }}>
                <div>
                  <label style={LBL}>Código</label>
                  <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} style={INP} placeholder="0001" />
                </div>
                <div>
                  <label style={LBL}>Descrição *</label>
                  <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={{ ...INP, fontFamily: 'var(--sans)' }} placeholder="Nome do serviço/produto" />
                </div>
                <div>
                  <label style={LBL}>UN</label>
                  <input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} style={INP} placeholder="UN" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LBL}>PREÇO 1 (Lista 1) R$</label>
                  <input value={form.valor_padrao} onChange={e => setForm(f => ({ ...f, valor_padrao: e.target.value }))} style={INP} placeholder="0,00" />
                </div>
                <div>
                  <label style={LBL}>PREÇO 2 (Lista 2) R$</label>
                  <input value={form.valor_lista2} onChange={e => setForm(f => ({ ...f, valor_lista2: e.target.value }))} style={INP} placeholder="0,00" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', fontSize: '13px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '600', background: saving ? 'var(--text-muted)' : '#880000', color: 'white', border: 'none', borderRadius: '7px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
