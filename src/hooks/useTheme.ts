import { useState, useEffect } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('tema') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('tema', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}
