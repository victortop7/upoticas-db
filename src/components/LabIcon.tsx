// Ícones do Connect Lab — SVG de traço, herdam a cor do texto (currentColor).
// Substituem os emojis: ficam nítidos, alinhados e mudam de cor junto com o tema.

export type IconName =
  | 'home' | 'store' | 'factory' | 'box' | 'layers' | 'transfer' | 'clipboard'
  | 'flow' | 'invoice' | 'billing' | 'wallet' | 'bank' | 'settings'
  | 'search' | 'power' | 'plus' | 'sun' | 'moon'
  | 'alert' | 'calendar' | 'hourglass'
  | 'keyboard' | 'disc' | 'shield' | 'sparkle' | 'wrench' | 'check' | 'truck'
  | 'printer' | 'download' | 'mail' | 'lens';

const P: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 10.2 12 3l9 7.2" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9.5 21v-6h5v6" /></>,
  store: <><path d="M3.5 4.5h17l1 4.2a3 3 0 0 1-5.9.8 3 3 0 0 1-5.9 0 3 3 0 0 1-5.9-.8Z" /><path d="M5 12v9h14v-9" /><path d="M9.5 21v-5.5h5V21" /></>,
  factory: <><path d="M3 21V9l6 4V9l6 4V3h6v18Z" /><path d="M7 17h2M13 17h2M18 17h1" /></>,
  box: <><path d="M21 8.5 12 3.5 3 8.5v7L12 20.5l9-5Z" /><path d="M3 8.5 12 13l9-4.5" /><path d="M12 13v7.5" /></>,
  layers: <><path d="M12 3 3 7.5 12 12l9-4.5Z" /><path d="M3 12.5 12 17l9-4.5" /><path d="M3 17 12 21.5 21 17" /></>,
  transfer: <><path d="M4 8h13l-3.2-3.2" /><path d="M20 16H7l3.2 3.2" /></>,
  clipboard: <><path d="M9 4.5h6v-1a1.5 1.5 0 0 0-3 0 1.5 1.5 0 0 0-3 0Z" /><path d="M9 4.5H6.5v16h11v-16H15" /><path d="M9 10h6M9 14h6M9 18h3" /></>,
  flow: <><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12Z" /></>,
  invoice: <><path d="M5.5 3h9l4.5 4.5V21h-13.5Z" /><path d="M14.5 3v4.5H19" /><path d="M9 12h6M9 16h6" /></>,
  billing: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 10v4M18 10v4" /></>,
  wallet: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3" /><path d="M3 7.5V19h18V9H5.5A2.5 2.5 0 0 1 3 7.5Z" /><circle cx="16.5" cy="14" r="1.3" /></>,
  bank: <><path d="M3 9.5 12 4l9 5.5" /><path d="M5.5 10.5v8M10 10.5v8M14 10.5v8M18.5 10.5v8" /><path d="M3 21h18" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  power: <><path d="M12 3v9" /><path d="M6.8 6.8a8 8 0 1 0 10.4 0" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  moon: <><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></>,
  alert: <><path d="M12 4 2.5 20.5h19Z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.6" r=".6" fill="currentColor" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  hourglass: <><path d="M6.5 3h11M6.5 21h11" /><path d="M7.5 3c0 5 4.5 6.2 4.5 9s-4.5 4-4.5 9" /><path d="M16.5 3c0 5-4.5 6.2-4.5 9s4.5 4 4.5 9" /></>,
  keyboard: <><rect x="2.5" y="6.5" width="19" height="11" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M8 13.8h8" /></>,
  disc: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>,
  shield: <><path d="M12 3 4.5 6v6c0 4.6 3.2 8 7.5 9 4.3-1 7.5-4.4 7.5-9V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  sparkle: <><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" /><path d="M18.5 16.5 19.4 19l2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9Z" /></>,
  wrench: <><path d="M15.5 3a5.5 5.5 0 0 0-5 7.7L3 18.2 5.8 21l7.5-7.5A5.5 5.5 0 1 0 15.5 3Z" /><circle cx="16.5" cy="7.5" r="1.6" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.2 2.7 2.7L16 9.5" /></>,
  truck: <><path d="M2.5 6.5h11v10h-11Z" /><path d="M13.5 10h4l3 3v3.5h-7Z" /><circle cx="7" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></>,
  printer: <><path d="M7 8V3.5h10V8" /><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M7 13h10v7.5H7Z" /></>,
  download: <><path d="M12 3v11" /><path d="m7.5 10 4.5 4.5L16.5 10" /><path d="M4 19.5h16" /></>,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m3 7 9 6.5L21 7" /></>,
  // marca: lente com brilho
  lens: <><ellipse cx="12" cy="12" rx="9.2" ry="7.2" /><ellipse cx="12" cy="12" rx="4.6" ry="3.6" /><path d="M6.6 8.6c1-1 2.3-1.6 3.4-1.7" /></>,
};

export default function LabIcon({ name, size = 16, strokeWidth = 1.8, style }: {
  name: IconName; size?: number; strokeWidth?: number; style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }} aria-hidden="true">
      {P[name]}
    </svg>
  );
}
