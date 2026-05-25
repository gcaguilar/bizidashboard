'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const THEME_STORAGE_KEY = 'bizidashboard-theme';
const LEGACY_THEME_STORAGE_KEY = 'theme';

type Theme = 'light' | 'dark';

function getPreferredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  const isDark = theme === 'dark';
  const root = document.documentElement;

  root.classList.toggle('dark', isDark);
  root.dataset.theme = isDark ? 'dark' : 'light';
}

type ThemeToggleButtonProps = {
  className?: string;
};

export function ThemeToggleButton({ className = 'ui-icon-button !h-10 !w-10 !min-h-10 !min-w-10 !p-0' }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const resolved: Theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : root.classList.contains('dark')
          ? 'dark'
          : 'light';

    setTheme(resolved);
  }, []);

  if (theme === null) {
    return (
      <Button type="button" className={className} aria-label="Cambiar tema" variant="icon-button" disabled>
        <span aria-hidden="true" className="text-sm leading-none">◌</span>
        <span className="sr-only">Cambiar tema</span>
      </Button>
    );
  }

  const nextThemeLabel = theme === 'dark' ? 'claro' : 'oscuro';
  const icon = theme === 'dark' ? '☀' : '☾';

  return (
    <Button
      type="button"
      variant="icon-button"
      className={className}
      onClick={() => {
        const activeTheme = theme ?? getPreferredTheme();
        const nextTheme: Theme = activeTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        applyTheme(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }}
      aria-label={`Cambiar tema a ${nextThemeLabel}`}
      title={`Cambiar tema a ${nextThemeLabel}`}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {icon}
      </span>
      <span className="sr-only">{`Cambiar tema a ${nextThemeLabel}`}</span>
    </Button>
  );
}
