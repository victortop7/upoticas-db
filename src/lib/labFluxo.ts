// Etapas do funil de produção do laboratório (compartilhado entre o Kanban e a tela de detalhe da OS)

export type Etapa = { key: string; label: string; icon: string; color: string };

export const FLUXOS: Record<'simples' | 'progressiva', Etapa[]> = {
  simples: [
    { key: 'digitacao', label: 'Digitação', icon: '⌨️', color: '#a07500' },
    { key: 'estoque', label: 'Estoque', icon: '📦', color: '#1069c0' },
    { key: 'montagem', label: 'Montagem', icon: '🔧', color: '#7a3fb5' },
    { key: 'pronto', label: 'Pronto', icon: '✅', color: '#0a8a2a' },
    { key: 'entregue', label: 'Entregue', icon: '🚚', color: '#6b7280' },
  ],
  progressiva: [
    { key: 'digitacao', label: 'Digitação', icon: '⌨️', color: '#a07500' },
    { key: 'estoque', label: 'Estoque', icon: '📦', color: '#1069c0' },
    { key: 'surfacagem', label: 'Surfaçagem', icon: '🪚', color: '#c05a1a' },
    { key: 'antirrisco', label: 'Antirrisco', icon: '🛡️', color: '#0e9488' },
    { key: 'antirreflexo', label: 'Antirreflexo', icon: '💠', color: '#2563c7' },
    { key: 'montagem', label: 'Montagem', icon: '🔧', color: '#7a3fb5' },
    { key: 'pronto', label: 'Pronto', icon: '✅', color: '#0a8a2a' },
    { key: 'entregue', label: 'Entregue', icon: '🚚', color: '#6b7280' },
  ],
};

type OrdemLike = { tipo_lente?: string | null; status?: string; setor_atual?: string | null };

// Define o funil da OS pelo tipo de lente (02/progressiva vs. demais)
export function flowOf(o: OrdemLike): 'simples' | 'progressiva' {
  const t = (o.tipo_lente || '').toUpperCase().trim();
  return (t.includes('PROGRESS') || t === '02' || t.startsWith('02 ')) ? 'progressiva' : 'simples';
}

// Etapa em que a OS está agora, a partir do status/setor
export function cardStage(o: OrdemLike, etapas: Etapa[]): string {
  if (o.status === 'entregue') return 'entregue';
  if (o.status === 'pronto') return 'pronto';
  const s = o.setor_atual;
  if (s && etapas.some(e => e.key === s)) return s;
  return etapas[0].key; // default: primeira etapa (digitação)
}
