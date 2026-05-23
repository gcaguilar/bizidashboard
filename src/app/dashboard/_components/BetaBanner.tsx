'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { FeedbackCta } from '@/app/_components/FeedbackCta';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  BICIRADAR_BANNER_DISMISSED_STORAGE_KEY,
  BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY,
  FEEDBACK_BANNER_DISMISSED_STORAGE_KEY,
  FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY,
  FEEDBACK_VISIT_COUNT_STORAGE_KEY,
  resolveInitialFeedbackBannerState,
  resolveInitialFeedbackModalState,
  type FeedbackBannerState,
  type FeedbackModalState,
} from '@/lib/feedback';
import { buildCtaClickEvent, resolveRouteKeyFromPathname, trackUmamiEvent } from '@/lib/umami';

const BICIRADAR_URL = 'https://biciradar.es';
const DISABLE_WELCOME_MODAL =
  process.env.NEXT_PUBLIC_DISABLE_BETA_WELCOME_MODAL === '1';

export type BiciRadarBannerAction = 'open' | 'dismiss_icon';
export type BiciRadarModalAction =
  | 'open'
  | 'dismiss_button'
  | 'dismiss_icon'
  | 'dismiss_overlay'
  | 'dismiss_escape';

type BiciRadarTrackingSurface = 'banner' | 'modal';

const BICIRADAR_TRACKING_METADATA: Record<
  BiciRadarTrackingSurface,
  {
    source: string;
    module: string;
  }
> = {
  banner: {
    source: 'biciradar_banner',
    module: 'global_banner',
  },
  modal: {
    source: 'biciradar_modal',
    module: 'global_modal',
  },
};

const BICIRADAR_CTA_ID_BY_ACTION: Record<
  BiciRadarBannerAction | BiciRadarModalAction,
  string
> = {
  open: 'biciradar_open',
  dismiss_button: 'biciradar_dismiss_button',
  dismiss_icon: 'biciradar_dismiss_icon',
  dismiss_overlay: 'biciradar_dismiss_overlay',
  dismiss_escape: 'biciradar_dismiss_escape',
};

export function buildBiciRadarTrackingEvent({
  routeKey,
  surface,
  action,
}: {
  routeKey: string;
  surface: BiciRadarTrackingSurface;
  action: BiciRadarBannerAction | BiciRadarModalAction;
}) {
  const metadata = BICIRADAR_TRACKING_METADATA[surface];
  const isOpenAction = action === 'open';

  return buildCtaClickEvent({
    surface: 'dashboard',
    routeKey,
    source: metadata.source,
    module: metadata.module,
    ctaId: BICIRADAR_CTA_ID_BY_ACTION[action],
    destination: isOpenAction ? 'biciradar_web' : action,
    isExternal: isOpenAction,
  });
}

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

function getInitialFeedbackModalState(visitCount: number): FeedbackModalState {
  if (typeof window === 'undefined') {
    return resolveInitialFeedbackModalState(visitCount, () => null);
  }

  return resolveInitialFeedbackModalState(visitCount, (key) => window.localStorage.getItem(key));
}

function WelcomeModal({
  onOpen,
  onClose,
}: {
  onOpen: () => void;
  onClose: (reason: BiciRadarModalAction) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={() => onClose('dismiss_overlay')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo</DialogTitle>
        </DialogHeader>
        <div className="mt-6 text-sm">
          <h3 className="text-2xl font-black text-[var(--foreground)] md:text-4xl">
            Pedalea con menos sorpresas con BiciRadar
          </h3>
          <p className="mt-3 text-[var(--muted)] md:text-base">
            Mira incidencias, cortes y avisos utiles antes de salir en bici desde la web oficial de la app.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={BICIRADAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpen}
            className="ui-primary-button"
          >
            Ver BiciRadar
          </a>
          <Button
            variant="outline"
            onClick={() => onClose('dismiss_button')}
            className="h-auto min-h-0 rounded-xl px-4 py-2 text-sm font-bold text-[var(--foreground)]"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeedbackModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
        </DialogHeader>
        <div className="mt-6 text-sm">
          <h3 className="text-2xl font-black text-[var(--foreground)] md:text-4xl">
            Ayudanos a mejorar DatosBizi
          </h3>
          <p className="mt-3 text-[var(--muted)] md:text-base">
            Ya conoces la web. Cuéntanos qué te falta, qué te sobra o qué cambiarías para que el
            dashboard te resulte más útil.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <FeedbackCta
            source="global_feedback_modal"
            ctaId="feedback_modal_open"
            module="global_modal"
            className=""
            pendingClassName="min-h-10 px-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)]"
          >
            Dar feedback
          </FeedbackCta>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-auto min-h-0 rounded-xl px-4 py-2 text-sm font-bold text-[var(--foreground)]"
          >
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function renderFeedbackBanner(onDismiss: () => void) {
  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/6 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden shrink-0 text-sm sm:inline" aria-hidden="true">📝</span>
        <p className="min-w-0 text-xs text-[var(--foreground)]">
          <span className="font-bold">Ya conoces la web</span>
          <span className="text-[var(--muted)]"> {' '}Cuéntanos qué te falta, qué te sobra o qué mejorarías en DatosBizi.</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
<FeedbackCta
          source="feedback_banner"
          ctaId="feedback_banner_open"
          module="global_banner"
          className=""
          pendingClassName="min-h-8 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]"
        >
          Dar feedback
        </FeedbackCta>
        <Button
          variant="icon-button"
          size="default"
          onClick={onDismiss}
          aria-label="Cerrar banner de feedback"
        >
          <CloseIcon />
        </Button>
      </div>
    </div>
  );
}

function renderBiciRadarBanner(onOpen: () => void, onDismiss: () => void) {
  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/6 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden shrink-0 text-sm sm:inline" aria-hidden="true">📱</span>
        <p className="min-w-0 text-xs text-[var(--foreground)]">
          <span className="font-bold">BiciRadar te ayuda a evitar sorpresas en ruta</span>
          <span className="text-[var(--muted)]"> {' '}Consulta incidencias y avisos utiles antes de salir.</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={BICIRADAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className="ui-primary-button text-xs px-3 py-1.5"
        >
          Ver BiciRadar
        </a>
        <Button
          variant="icon-button"
          size="default"
          onClick={onDismiss}
          aria-label="Cerrar banner"
        >
          <CloseIcon />
        </Button>
      </div>
    </div>
  );
}

export function BetaBanner() {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const [{ variant, visitCount }] = useState(getInitialBannerState);
  const [bannerVariant, setBannerVariant] = useState(variant);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(getInitialWelcomeModalOpen);
  const [{ isOpen: initialFeedbackModalOpen }] = useState(() => getInitialFeedbackModalState(visitCount));
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(initialFeedbackModalOpen);

  const trackBiciRadarBanner = useCallback(
    (action: BiciRadarBannerAction) => {
      trackUmamiEvent(buildBiciRadarTrackingEvent({ routeKey, surface: 'banner', action }));
    },
    [routeKey]
  );

  const trackBiciRadarModal = useCallback(
    (action: BiciRadarModalAction) => {
      trackUmamiEvent(buildBiciRadarTrackingEvent({ routeKey, surface: 'modal', action }));
    },
    [routeKey]
  );

  const dismissBanner = useCallback(() => {
    if (bannerVariant === 'biciradar') {
      trackBiciRadarBanner('dismiss_icon');
    }

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
  }, [bannerVariant, trackBiciRadarBanner]);

  const openBiciRadarFromBanner = useCallback(() => {
    trackBiciRadarBanner('open');
  }, [trackBiciRadarBanner]);

  const closeWelcomeModal = useCallback((reason: BiciRadarModalAction) => {
    trackBiciRadarModal(reason);
    setWelcomeModalOpen(false);

    try {
      window.localStorage.setItem(BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, [trackBiciRadarModal]);

  const openBiciRadarFromModal = useCallback(() => {
    trackBiciRadarModal('open');
  }, [trackBiciRadarModal]);

  const closeFeedbackModal = useCallback(() => {
    setFeedbackModalOpen(false);

    try {
      window.localStorage.setItem(
        FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY,
        String(visitCount)
      );
    } catch {
      // ignore storage errors
    }
  }, [visitCount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FEEDBACK_VISIT_COUNT_STORAGE_KEY, String(visitCount));
    } catch {
      // ignore storage errors
    }
  }, [visitCount]);

  useEffect(() => {
    if (!welcomeModalOpen && !feedbackModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (feedbackModalOpen) {
          closeFeedbackModal();
          return;
        }

        closeWelcomeModal('dismiss_escape');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [feedbackModalOpen, welcomeModalOpen, closeFeedbackModal, closeWelcomeModal]);

  return (
    <>
      {welcomeModalOpen ? <WelcomeModal onOpen={openBiciRadarFromModal} onClose={closeWelcomeModal} /> : null}
      {!welcomeModalOpen && feedbackModalOpen ? <FeedbackModal onClose={closeFeedbackModal} /> : null}

      {bannerVariant !== 'hidden' ? (
        <div className="mx-auto mb-2 w-full max-w-[1280px] animate-[fadeSlideIn_0.3s_ease-out]">
          {bannerVariant === 'biciradar' ? (
            renderBiciRadarBanner(openBiciRadarFromBanner, dismissBanner)
          ) : (
            renderFeedbackBanner(dismissBanner)
          )}
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
