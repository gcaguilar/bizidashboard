'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'bizidashboard-beta-banner-dismissed';
const WELCOME_MODAL_STORAGE_KEY = 'bizidashboard-biciradar-welcome-dismissed';
const BICIRADAR_URL = 'https://biciradar.es';

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

function getInitialWelcomeModalOpen(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return !window.localStorage.getItem(WELCOME_MODAL_STORAGE_KEY);
  } catch {
    return false;
  }
}

export function BetaBanner() {
  const [visible, setVisible] = useState(getInitialVisible);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(getInitialWelcomeModalOpen);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const closeWelcomeModal = useCallback(() => {
    setWelcomeModalOpen(false);
    try {
      window.localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!welcomeModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeWelcomeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [welcomeModalOpen, closeWelcomeModal]);

  if (!visible) {
    return welcomeModalOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        onClick={closeWelcomeModal}
      >
        <div
          className="relative w-full max-w-2xl rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 shadow-2xl md:p-8"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={closeWelcomeModal}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--foreground)]/8 hover:text-[var(--foreground)]"
            aria-label="Cerrar dialogo de bienvenida"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Nuevo</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--foreground)] md:text-4xl">BiciRadar ya esta disponible</h2>
          <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
            Ya puedes abrir la web oficial de BiciRadar para ver la app y acceder a sus enlaces de descarga.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={BICIRADAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Ir a biciradar.es
            </a>
            <button
              type="button"
              onClick={closeWelcomeModal}
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <>
      {welcomeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={closeWelcomeModal}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeWelcomeModal}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--foreground)]/8 hover:text-[var(--foreground)]"
              aria-label="Cerrar dialogo de bienvenida"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Nuevo</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--foreground)] md:text-4xl">BiciRadar ya esta disponible</h2>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Ya puedes abrir la web oficial de BiciRadar para ver la app y acceder a sus enlaces de descarga.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={BICIRADAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
              >
                Ir a biciradar.es
              </a>
              <button
                type="button"
                onClick={closeWelcomeModal}
                className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto mb-2 w-full max-w-[1280px] animate-[fadeSlideIn_0.3s_ease-out]">
        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/6 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="hidden shrink-0 text-sm sm:inline" aria-hidden="true">📱</span>
            <p className="min-w-0 text-xs text-[var(--foreground)]">
              <span className="font-bold">BiciRadar ya esta disponible</span>
              <span className="text-[var(--muted)]"> &mdash; Descubre la app completa en su web oficial.</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={BICIRADAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-95"
            >
              Ir a biciradar.es
            </a>
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
    </>
  );
}
