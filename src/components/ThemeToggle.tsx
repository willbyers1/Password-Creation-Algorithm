import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from './icons';

type Theme = 'dark' | 'light';

/** Ground colors per theme, for the browser UI (theme-color). Mirrors --color-ground in index.css. */
const THEME_COLOR: Record<Theme, string> = { dark: '#22271F', light: '#E2E5E0' };

/**
 * Dark is the default. The choice lives in memory only: the app stores nothing (no localStorage
 * or cookies), so a reload returns to dark.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  }, [theme]);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="flex min-h-[44px] items-center gap-2 text-base underline decoration-1 underline-offset-4 hover:decoration-2"
    >
      {next === 'light' ? <IconSun size={18} /> : <IconMoon size={18} />}
      {next === 'light' ? 'Light theme' : 'Dark theme'}
    </button>
  );
}
