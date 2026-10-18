export const BICIRADAR_BANNER_DISMISSED_STORAGE_KEY = 'bizidashboard-beta-banner-dismissed';
export const BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY =
  'bizidashboard-biciradar-welcome-dismissed';
export const FEEDBACK_BANNER_DISMISSED_STORAGE_KEY = 'bizidashboard-feedback-banner-dismissed';
export const FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY =
  'bizidashboard-feedback-modal-last-dismissed-visit';
export const FEEDBACK_VISIT_COUNT_STORAGE_KEY = 'bizidashboard-feedback-visit-count';
export const DEFAULT_FEEDBACK_URL = 'https://tally.so/r/ZjRAXz';
export const FEEDBACK_MODAL_FIRST_ELIGIBLE_VISIT = 2;
export const FEEDBACK_MODAL_REAPPEAR_INTERVAL = 5;

export type FeedbackBannerVariant = 'biciradar' | 'feedback' | 'hidden';
export type FeedbackRating = 'positive' | 'negative';

export type FeedbackEmbedOptions = {
  rating?: FeedbackRating;
  source?: string;
};

const TALLY_FORM_URL_PATTERN =
  /^https?:\/\/(?:www\.)?tally\.so\/(?:r|embed)\/([A-Za-z0-9]+)\/?(?:\?.*)?$/;
export type FeedbackBannerState = {
  variant: FeedbackBannerVariant;
  visitCount: number;
};
export type FeedbackModalState = {
  isEligible: boolean;
  isOpen: boolean;
  lastDismissedVisit: number | null;
  visitCount: number;
};

type ResolveFeedbackBannerVariantInput = {
  visitCount: number;
  biciradarDismissed: boolean;
  feedbackDismissed: boolean;
};

type ResolveFeedbackModalStateInput = {
  visitCount: number;
  lastDismissedVisit: number | null;
};

export function getStoredVisitCount(rawValue: string | null | undefined): number {
  if (!rawValue) {
    return 0;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

export function getNextVisitCount(rawValue: string | null | undefined): number {
  return getStoredVisitCount(rawValue) + 1;
}

export function getStoredDismissedVisit(rawValue: string | null | undefined): number | null {
  const storedVisit = getStoredVisitCount(rawValue);
  return storedVisit > 0 ? storedVisit : null;
}

export function resolveFeedbackBannerVariant({
  visitCount,
  biciradarDismissed,
  feedbackDismissed,
}: ResolveFeedbackBannerVariantInput): FeedbackBannerVariant {
  if (visitCount >= 2) {
    return feedbackDismissed ? 'hidden' : 'feedback';
  }

  return biciradarDismissed ? 'hidden' : 'biciradar';
}

export function resolveFeedbackModalState({
  visitCount,
  lastDismissedVisit,
}: ResolveFeedbackModalStateInput): FeedbackModalState {
  const isEligible = visitCount >= FEEDBACK_MODAL_FIRST_ELIGIBLE_VISIT;

  if (!isEligible) {
    return {
      isEligible,
      isOpen: false,
      lastDismissedVisit,
      visitCount,
    };
  }

  const isOpen =
    lastDismissedVisit === null ||
    visitCount - lastDismissedVisit >= FEEDBACK_MODAL_REAPPEAR_INTERVAL;

  return {
    isEligible,
    isOpen,
    lastDismissedVisit,
    visitCount,
  };
}

export function resolveInitialFeedbackBannerState(
  readStorageItem: (key: string) => string | null
): FeedbackBannerState {
  try {
    const visitCount = getNextVisitCount(readStorageItem(FEEDBACK_VISIT_COUNT_STORAGE_KEY));

    return {
      visitCount,
      variant: resolveFeedbackBannerVariant({
        visitCount,
        biciradarDismissed: readStorageItem(BICIRADAR_BANNER_DISMISSED_STORAGE_KEY) === '1',
        feedbackDismissed: readStorageItem(FEEDBACK_BANNER_DISMISSED_STORAGE_KEY) === '1',
      }),
    };
  } catch {
    return {
      variant: 'biciradar',
      visitCount: 1,
    };
  }
}

export function resolveInitialFeedbackModalState(
  visitCount: number,
  readStorageItem: (key: string) => string | null
): FeedbackModalState {
  try {
    return resolveFeedbackModalState({
      visitCount,
      lastDismissedVisit: getStoredDismissedVisit(
        readStorageItem(FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY)
      ),
    });
  } catch {
    return resolveFeedbackModalState({
      visitCount,
      lastDismissedVisit: null,
    });
  }
}

/**
 * Builds the Tally iframe URL so the form can be answered without leaving the app.
 * Returns null when the configured URL is not a Tally form (e.g. a custom form provider).
 */
export function buildTallyEmbedUrl(
  feedbackUrl: string | null | undefined,
  { rating, source }: FeedbackEmbedOptions = {}
): string | null {
  if (!feedbackUrl) {
    return null;
  }

  const match = feedbackUrl.trim().match(TALLY_FORM_URL_PATTERN);
  if (!match) {
    return null;
  }

  const params = new URLSearchParams({
    alignLeft: '1',
    hideTitle: '1',
    transparentBackground: '1',
  });

  if (rating) {
    params.set('rating', rating);
  }

  if (source) {
    params.set('source', source);
  }

  return `https://tally.so/embed/${match[1]}?${params.toString()}`;
}

/**
 * Records that the visitor already engaged with the feedback prompt during the
 * current visit, so the automatic modal does not reappear too soon.
 */
export function markFeedbackModalSeenForCurrentVisit(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const visitCount = getStoredVisitCount(
      window.localStorage.getItem(FEEDBACK_VISIT_COUNT_STORAGE_KEY)
    );

    if (visitCount <= 0) {
      return;
    }

    window.localStorage.setItem(
      FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY,
      String(visitCount)
    );
  } catch {
    // ignore storage errors
  }
}

export function getFeedbackUrl(): string | null {
  const feedbackUrl =
    import.meta.env.VITE_FEEDBACK_URL?.trim() ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FEEDBACK_URL?.trim());
  return feedbackUrl || DEFAULT_FEEDBACK_URL;
}

export function isFeedbackEnabled(): boolean {
  return getFeedbackUrl() !== null;
}
