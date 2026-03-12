'use client';

import { useState } from 'react';

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

function getCurrentTheme(): Theme {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggleButton({ className = 'icon-button' }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<Theme>(() => getCurrentTheme());

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
      <span aria-hidden="true" className="text-sm leading-none" suppressHydrationWarning>
        {icon}
      </span>
      <span suppressHydrationWarning>{buttonLabel}</span>
    </button>
  );
}
