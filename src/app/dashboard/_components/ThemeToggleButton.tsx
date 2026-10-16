'use client';

import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { subscribeToStorage, writeStorageText } from '@/lib/use-storage-value';

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

function getResolvedTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerTheme(): null {
  return null;
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  const root = document.documentElement;

  root.classList.toggle('dark', isDark);
  root.dataset.theme = isDark ? 'dark' : 'light';
}

type ThemeToggleButtonProps = {
  className?: string;
};

export function ThemeToggleButton({ className = 'ui-icon-button !h-10 !w-10 !min-h-10 !min-w-10 !p-0' }: ThemeToggleButtonProps) {
  const theme = useSyncExternalStore(subscribeToStorage, getResolvedTheme, getServerTheme);

  const resolvedTheme = theme ?? 'light';
  const nextThemeLabel = resolvedTheme === 'dark' ? 'claro' : 'oscuro';

  return (
    <Button
      type="button"
      variant="icon-button"
      className={className}
      disabled={theme === null}
      onClick={() => {
        const activeTheme = theme ?? getPreferredTheme();
        const nextTheme: Theme = activeTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        writeStorageText(THEME_STORAGE_KEY, nextTheme);
      }}
      aria-label={theme === null ? 'Cambiar tema' : `Cambiar tema a ${nextThemeLabel}`}
      title={`Cambiar tema a ${nextThemeLabel}`}
    >
      <span aria-hidden="true" className="text-sm leading-none" suppressHydrationWarning>
        {theme === null ? '◌' : (resolvedTheme === 'dark' ? '☀' : '☾')}
      </span>
      <span className="sr-only" suppressHydrationWarning>
        {theme === null ? 'Cambiar tema' : `Cambiar tema a ${nextThemeLabel}`}
      </span>
    </Button>
  );
}
