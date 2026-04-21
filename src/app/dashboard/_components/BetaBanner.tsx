'use client';

import { useCallback, useEffect, useState } from 'react';
import { FeedbackCta } from '@/app/_components/FeedbackCta';
import {
  BICIRADAR_BANNER_DISMISSED_STORAGE_KEY,
  BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY,
  FEEDBACK_BANNER_DISMISSED_STORAGE_KEY,
  FEEDBACK_VISIT_COUNT_STORAGE_KEY,
  resolveInitialFeedbackBannerState,
  type FeedbackBannerVariant,
  type FeedbackBannerState,
} from '@/lib/feedback';

const BICIRADAR_URL = 'https://biciradar.es';
const DISABLE_WELCOME_MODAL =
  process.env.NEXT_PUBLIC_DISABLE_BETA_WELCOME_MODAL === '1';

function getInitialBannerState(): FeedbackBannerState {
  if (typeof window === 'undefined') {
    return {
      variant: 'biciradar',
      visitCount: 1,
    };
  }

  return resolveInitialFeedbackBannerState((key) => window.localStorage.getItem(key));
}

function getInitialWelcomeModalOpen(): boolean {
  if (DISABLE_WELCOME_MODAL || typeof window === 'undefined') {
    return false;
  }

  try {
    return !window.localStorage.getItem(BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY);
  } catch {
    return false;
  }
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function WelcomeModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 shadow-2xl md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--foreground)]/8 hover:text-[var(--foreground)]"
          aria-label="Cerrar dialogo de bienvenida"
        >
          <CloseIcon />
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
            onClick={onClose}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function renderBannerContent(variant: Exclude<FeedbackBannerVariant, 'hidden'>, onDismiss: () => void) {
  if (variant === 'feedback') {
    return (
      <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/6 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="hidden shrink-0 text-sm sm:inline" aria-hidden="true">📝</span>
          <p className="min-w-0 text-xs text-[var(--foreground)]">
            <span className="font-bold">Ya conoces la web</span>
            <span className="text-[var(--muted)]"> {' '}Cuéntanos qué te falta, qué te sobra o qué mejorarías en DatosBizi.</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FeedbackCta
            source="global_feedback_banner"
            ctaId="feedback_banner_open"
            module="global_banner"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-95"
            pendingClassName="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]"
          >
            Dar feedback
          </FeedbackCta>
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--foreground)]/8 hover:text-[var(--foreground)]"
            aria-label="Cerrar banner de feedback"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/6 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden shrink-0 text-sm sm:inline" aria-hidden="true">📱</span>
        <p className="min-w-0 text-xs text-[var(--foreground)]">
          <span className="font-bold">BiciRadar ya esta disponible</span>
          <span className="text-[var(--muted)]"> {' '}Descubre la app completa en su web oficial.</span>
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
          onClick={onDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--foreground)]/8 hover:text-[var(--foreground)]"
          aria-label="Cerrar banner"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export function BetaBanner() {
  const [{ variant, visitCount }] = useState(getInitialBannerState);
  const [bannerVariant, setBannerVariant] = useState(variant);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(getInitialWelcomeModalOpen);

  const dismissBanner = useCallback(() => {
    setBannerVariant('hidden');

    try {
      window.localStorage.setItem(
        bannerVariant === 'feedback'
          ? FEEDBACK_BANNER_DISMISSED_STORAGE_KEY
          : BICIRADAR_BANNER_DISMISSED_STORAGE_KEY,
        '1'
      );
    } catch {
      // ignore storage errors
    }
  }, [bannerVariant]);

  const closeWelcomeModal = useCallback(() => {
    setWelcomeModalOpen(false);

    try {
      window.localStorage.setItem(BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FEEDBACK_VISIT_COUNT_STORAGE_KEY, String(visitCount));
    } catch {
      // ignore storage errors
    }
  }, [visitCount]);

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

  return (
    <>
      {welcomeModalOpen ? <WelcomeModal onClose={closeWelcomeModal} /> : null}

      {bannerVariant !== 'hidden' ? (
        <div className="mx-auto mb-2 w-full max-w-[1280px] animate-[fadeSlideIn_0.3s_ease-out]">
          {renderBannerContent(bannerVariant, dismissBanner)}
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
      ) : null}
    </>
  );
}
