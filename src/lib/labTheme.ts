import type { CSSProperties } from 'react';

// Paleta compartilhada do Connect Lab — aponta para variáveis CSS.
// O modo noturno troca as variáveis de uma vez (via atributo data-lab-theme no <html>),
// então TODAS as páginas que usam este R mudam juntas.
// Cobre os dois padrões de nome de chave usados nas páginas (curtos e longos).
export const R = {
  bg:        'var(--lab-bg)',
  panel:     'var(--lab-panel)',
  alt:       'var(--lab-alt)',
  panelAlt:  'var(--lab-alt)',
  bdr:       'var(--lab-bdr)',
  border:    'var(--lab-bdr)',
  hdr:       'var(--lab-hdr)',
  hdrBg:     'var(--lab-hdr)',
  hdrTxt:    'var(--lab-hdr-txt)',
  hdrBdr:    'var(--lab-hdr-bdr)',
  hdrBorder: 'var(--lab-hdr-bdr)',
  txt:       'var(--lab-txt)',
  accent:    'var(--lab-accent)',
  dim:       'var(--lab-dim)',
  inp:       'var(--lab-inp)',
  inpBg:     'var(--lab-inp)',
  inpBdr:    '1px solid var(--lab-inp-bdr)',
} as const;

// Aplica o tema (claro/escuro) globalmente via atributo no <html>.
export function applyLabTheme(dark: boolean) {
  document.documentElement.setAttribute('data-lab-theme', dark ? 'dark' : 'light');
}

// Estilos base reutilizáveis (opcional, já ligados ao tema)
export const INP_BASE: CSSProperties = {
  background: R.inp, border: R.inpBdr, color: R.txt,
};
