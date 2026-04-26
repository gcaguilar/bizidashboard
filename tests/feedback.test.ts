import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_FEEDBACK_URL,
  getFeedbackUrl,
  getNextVisitCount,
  getStoredDismissedVisit,
  getStoredVisitCount,
  isFeedbackEnabled,
  resolveFeedbackModalState,
  resolveFeedbackBannerVariant,
  FEEDBACK_MODAL_REAPPEAR_INTERVAL,
  resolveInitialFeedbackModalState,
} from '@/lib/feedback';

describe('feedback helpers', () => {
  const originalFeedbackUrl = process.env.NEXT_PUBLIC_FEEDBACK_URL;

  afterEach(() => {
    if (originalFeedbackUrl === undefined) {
      delete process.env.NEXT_PUBLIC_FEEDBACK_URL;
      return;
    }

    process.env.NEXT_PUBLIC_FEEDBACK_URL = originalFeedbackUrl;
  });

  it('normalizes stored visit counts and computes the next visit', () => {
    expect(getStoredVisitCount(null)).toBe(0);
    expect(getStoredVisitCount('')).toBe(0);
    expect(getStoredVisitCount('3')).toBe(3);
    expect(getStoredVisitCount('-1')).toBe(0);
    expect(getStoredDismissedVisit(null)).toBeNull();
    expect(getStoredDismissedVisit('')).toBeNull();
    expect(getStoredDismissedVisit('3')).toBe(3);
    expect(getNextVisitCount(null)).toBe(1);
    expect(getNextVisitCount('1')).toBe(2);
  });

  it('resolves biciradar, feedback and hidden banner states deterministically', () => {
    expect(
      resolveFeedbackBannerVariant({
        visitCount: 1,
        biciradarDismissed: false,
        feedbackDismissed: false,
      })
    ).toBe('biciradar');

    expect(
      resolveFeedbackBannerVariant({
        visitCount: 2,
        biciradarDismissed: true,
        feedbackDismissed: false,
      })
    ).toBe('feedback');

    expect(
      resolveFeedbackBannerVariant({
        visitCount: 4,
        biciradarDismissed: false,
        feedbackDismissed: true,
      })
    ).toBe('hidden');
  });

  it('opens the feedback modal from the second visit when it was never dismissed', () => {
    expect(
      resolveFeedbackModalState({
        visitCount: 1,
        lastDismissedVisit: null,
      })
    ).toEqual({
      isEligible: false,
      isOpen: false,
      lastDismissedVisit: null,
      visitCount: 1,
    });

    expect(
      resolveFeedbackModalState({
        visitCount: 2,
        lastDismissedVisit: null,
      })
    ).toEqual({
      isEligible: true,
      isOpen: true,
      lastDismissedVisit: null,
      visitCount: 2,
    });
  });

  it('keeps the feedback modal closed between dismissals and reopens it after five visits', () => {
    expect(
      resolveFeedbackModalState({
        visitCount: 6,
        lastDismissedVisit: 2,
      }).isOpen
    ).toBe(false);

    expect(
      resolveFeedbackModalState({
        visitCount: 2 + FEEDBACK_MODAL_REAPPEAR_INTERVAL,
        lastDismissedVisit: 2,
      }).isOpen
    ).toBe(true);
  });

  it('falls back safely when feedback modal storage access throws', () => {
    expect(
      resolveInitialFeedbackModalState(4, () => {
        throw new Error('storage blocked');
      })
    ).toEqual({
      isEligible: true,
      isOpen: true,
      lastDismissedVisit: null,
      visitCount: 4,
    });
  });

  it('uses the default tally URL and allows env overrides', () => {
    process.env.NEXT_PUBLIC_FEEDBACK_URL = '';
    expect(getFeedbackUrl()).toBe(DEFAULT_FEEDBACK_URL);
    expect(isFeedbackEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_FEEDBACK_URL = 'https://example.com/form';
    expect(getFeedbackUrl()).toBe('https://example.com/form');
    expect(isFeedbackEnabled()).toBe(true);
  });
});
