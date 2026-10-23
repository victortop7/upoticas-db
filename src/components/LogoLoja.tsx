import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Reduz a imagem (máx. 600px) e mantém o fundo transparente do PNG
function reduzir(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 600;
      const esc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc);
      c.height = Math.round(img.height * esc);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem')); };
    img.src = url;
  });
}

// Bloco de Configurações: enviar / trocar / remover a logo da loja
export default function LogoLoja() {
  const [logo, setLogo] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { api.get<{ logo: string | null }>('/configuracoes/logo').then(r => setLogo(r.logo)).catch(() => {}); }, []);

  async function salvar(nova: string | null) {
    setSalvando(true); setMsg('');
    try {
      await api.put('/configuracoes/logo', { logo: nova });
      setLogo(nova);
      setMsg(nova ? 'Logo salva' : 'Logo removida');
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro ao salvar'); }
    setSalvando(false);
  }

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { setMsg('Use uma imagem PNG ou JPG'); return; }
    try { await salvar(await reduzir(f)); } catch (err) { setMsg(err instanceof Error ? err.message : 'Erro'); }
  }

  return (
    <div style={{ marginTop: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Logo da loja</h3>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
        Aparece no carnê / boleto impresso. Use PNG (de preferência com fundo transparente).
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 160, height: 90, borderRadius: 10, border: '1px dashed var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {logo ? <img src={logo} alt="Logo" style={{ maxWidth: '92%', maxHeight: '84%', objectFit: 'contain' }} /> : <span style={{ fontSize: 12, color: '#999' }}>sem logo</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '600', background: 'var(--primary)', color: 'white', borderRadius: '8px', cursor: salvando ? 'default' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
            {salvando ? 'Enviando...' : logo ? 'Trocar logo' : 'Enviar logo'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolher} disabled={salvando} style={{ display: 'none' }} />
          </label>
          {logo && <button type="button" onClick={() => confirm('Remover a logo?') && salvar(null)} style={{ padding: '9px 14px', fontSize: '13px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-light)', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>Remover</button>}
          {msg && <span style={{ fontSize: 13, color: msg === 'Logo salva' ? 'var(--green)' : 'var(--text-muted)' }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
