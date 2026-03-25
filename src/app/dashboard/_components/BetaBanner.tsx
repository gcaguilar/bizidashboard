'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { appRoutes } from '@/lib/routes';

const STORAGE_KEY = 'bizidashboard-beta-banner-dismissed';

function getInitialVisible(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    return !window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function BetaBanner() {
  const [visible, setVisible] = useState(getInitialVisible);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="mx-auto mb-2 w-full max-w-[1280px] animate-[fadeSlideIn_0.3s_ease-out]">
      <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/6 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="hidden shrink-0 text-sm sm:inline" aria-hidden="true">📱</span>
          <p className="min-w-0 text-xs text-[var(--foreground)]">
            <span className="font-bold">Nueva app Bici Radar en beta</span>
            <span className="text-[var(--muted)]"> &mdash; Disponible en Android e iOS.</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={appRoutes.beta()}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-95"
          >
            Unirse a la beta
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--foreground)]/8 hover:text-[var(--foreground)]"
            aria-label="Cerrar banner"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
