import { useSearchParams } from 'react-router-dom';
import Vendas from './Vendas';
import OrdensServico from './OrdensServico';
import Icone from '../components/Icone';

// Vendas e Ordens de Serviço na mesma tela, em abas. A venda nova já gera a OS junto.
export default function VendasOS() {
  const [sp, setSp] = useSearchParams();
  const aba = sp.get('aba') === 'os' ? 'os' : 'vendas';
  const ir = (a: 'vendas' | 'os') => setSp(a === 'os' ? { aba: 'os' } : {}, { replace: true });

  return (
    <div>
      <div style={{ padding: '28px 32px 0' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Vendas e OS</h1>
        <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-dim)' }}>Registre a venda e a ordem de serviço do óculos na mesma tela.</p>
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)' }}>
          <button className={'aba-linha' + (aba === 'vendas' ? ' on' : '')} onClick={() => ir('vendas')}><Icone nome="vendas" size={15} />Vendas</button>
          <button className={'aba-linha' + (aba === 'os' ? ' on' : '')} onClick={() => ir('os')}><Icone nome="os" size={15} />Ordens de Serviço</button>
        </div>
      </div>
      {aba === 'os' ? <OrdensServico embutido /> : <Vendas embutido />}
    </div>
  );
}
