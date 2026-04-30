import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const MODULOS = [
  { letra: 'A', nome: 'CONFIGURAÇÕES', icon: '⚙', to: null },
  { letra: 'B', nome: 'ÓTICAS CLIENTES', icon: '🏪', to: '/lab/oticas' },
  { letra: 'C', nome: 'FORNECEDORES/OFTALMOS', icon: '🏭', to: '/lab/fornecedores' },
  { letra: 'D', nome: 'CADASTRO DE PRODUTOS', icon: '📦', to: '/lab/produtos' },
  { letra: 'E', nome: 'CADASTRO DE ESTOQUE', icon: '🗂️', to: '/lab/estoque' },
  { letra: 'F', nome: 'MOVIMENTAÇÃO DE ESTOQUE', icon: '🔄', to: '/lab/estoque' },
  { letra: 'G', nome: 'PEDIDOS / ORDENS DE SERVIÇO', icon: '📋', to: '/lab/ordens' },
  { letra: 'H', nome: 'NOTAS FISCAIS/FECHAMENTOS', icon: '🧾', to: null },
  { letra: 'I', nome: 'FATURAMENTO', icon: '💰', to: '/lab/faturamento' },
  { letra: 'J', nome: 'CONTAS A RECEBER', icon: '📥', to: null },
  { letra: 'K', nome: 'CONTAS A PAGAR', icon: '📤', to: null },
  { letra: 'L', nome: 'CONTROLE BANCÁRIO', icon: '🏛️', to: '/lab/bancario' },
];

export default function LabDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAuth();

  return (
    <div style={{
      minHeight: '100%',
      background: '#c8c4b0',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Courier New', Courier, monospace",
    }}>
      <div style={{ display: 'flex', gap: '24px', width: '100%', maxWidth: '800px' }}>

        {/* ===== PAINEL DE MÓDULOS ===== */}
        <div style={{ flex: 1 }}>
          {/* Header do painel */}
          <div style={{
            background: 'linear-gradient(90deg, #000080, #0000aa)',
            color: '#ffffff',
            textAlign: 'center',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            border: '2px outset #8080ff',
            borderBottom: 'none',
          }}>
            MÓDULOS
          </div>

          {/* Lista de módulos */}
          <div style={{ border: '2px inset #808080', background: '#d4d0c8' }}>
            {MODULOS.map((m, i) => (
              <div
                key={m.letra}
                onClick={() => m.to && navigate(m.to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderBottom: i < MODULOS.length - 1 ? '1px solid #b0acA4' : 'none',
                  background: i % 2 === 0 ? '#d4d0c8' : '#dedad2',
                  cursor: m.to ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                  opacity: m.to ? 1 : 0.55,
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (m.to) (e.currentTarget as HTMLDivElement).style.background = '#000080'; }}
                onMouseLeave={e => { if (m.to) (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? '#d4d0c8' : '#dedad2'; }}
                onMouseOver={e => {
                  if (m.to) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.querySelectorAll('span').forEach(s => { (s as HTMLElement).style.color = '#ffffff'; });
                  }
                }}
                onMouseOut={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.querySelectorAll('span').forEach(s => { (s as HTMLElement).style.color = ''; });
                }}
              >
                {/* Ícone */}
                <span style={{ fontSize: '16px', width: '28px', textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>

                {/* Nome */}
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 'bold', color: '#000000', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {m.nome}
                </span>

                {/* Letra */}
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000080', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                  {m.letra}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== PAINEL LATERAL (INFO) ===== */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          {/* Logo/Empresa */}
          <div style={{
            background: 'linear-gradient(135deg, #000080, #0000cc)',
            border: '2px outset #8080ff',
            padding: '16px 12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>🔬</div>
            <div style={{ color: '#ffff00', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>UpÓticas</div>
            <div style={{ color: '#c0c0ff', fontSize: '11px', letterSpacing: '2px' }}>LAB</div>
            <div style={{ borderTop: '1px solid #4040aa', marginTop: '8px', paddingTop: '8px', color: '#a0a0ff', fontSize: '10px', lineHeight: '1.6' }}>
              {tenant?.nome}
            </div>
          </div>

          {/* Acesso rápido OS */}
          <div style={{
            background: '#d4d0c8',
            border: '2px outset #808080',
            padding: '10px 12px',
            marginBottom: '8px',
          }}>
            <div style={{ background: '#000080', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '3px 6px', marginBottom: '8px', letterSpacing: '1px' }}>
              ACESSO RÁPIDO
            </div>
            {[
              { label: 'Nova OS', to: '/lab/ordens/nova', icon: '➕' },
              { label: 'Ver Ordens', to: '/lab/ordens', icon: '📋' },
              { label: 'Óticas', to: '/lab/oticas', icon: '🏪' },
            ].map(item => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  width: '100%', padding: '4px 6px', marginBottom: '4px',
                  background: '#c8c4b0', border: '1px outset #a0a098',
                  fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer',
                  color: '#000000', textAlign: 'left',
                  fontWeight: 'bold',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#000080'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#c8c4b0'; (e.currentTarget as HTMLButtonElement).style.color = '#000000'; }}
              >
                <span>{item.icon}</span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Versão */}
          <div style={{ background: '#d4d0c8', border: '2px inset #808080', padding: '8px 10px', fontSize: '10px', color: '#404040', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#000080', marginBottom: '4px' }}>UpÓticas Lab</div>
            <div>Versão 1.0</div>
            <div style={{ marginTop: '4px', color: '#606060' }}>Soluções Ópticas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
