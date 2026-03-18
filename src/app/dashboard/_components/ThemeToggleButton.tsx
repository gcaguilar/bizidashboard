'use client';

import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'bizidashboard-theme';

type Theme = 'light' | 'dark';

function getPreferredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

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

export function ThemeToggleButton({ className = 'icon-button' }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  if (theme === null) {
    return (
      <button type="button" className={className} aria-label="Cambiar tema" disabled>
        <span aria-hidden="true" className="text-sm leading-none">&#8203;</span>
        <span>&#8203;</span>
      </button>
    );
  }

  const nextThemeLabel = theme === 'dark' ? 'claro' : 'oscuro';
  const buttonLabel = theme === 'dark' ? 'Claro' : 'Oscuro';
  const icon = theme === 'dark' ? '☀' : '☾';

  return (
    <button
      type="button"
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
      <span>{buttonLabel}</span>
    </button>
  );
}
