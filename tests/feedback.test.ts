import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FEEDBACK_URL,
  getFeedbackUrl,
  getNextVisitCount,
  getStoredVisitCount,
  isFeedbackEnabled,
  resolveFeedbackBannerVariant,
} from '@/lib/feedback';

describe('feedback helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes stored visit counts and computes the next visit', () => {
    expect(getStoredVisitCount(null)).toBe(0);
    expect(getStoredVisitCount('')).toBe(0);
    expect(getStoredVisitCount('3')).toBe(3);
    expect(getStoredVisitCount('-1')).toBe(0);
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

  it('uses the default tally URL and allows env overrides', () => {
    vi.stubEnv('NEXT_PUBLIC_FEEDBACK_URL', '');
    expect(getFeedbackUrl()).toBe(DEFAULT_FEEDBACK_URL);
    expect(isFeedbackEnabled()).toBe(true);

    vi.stubEnv('NEXT_PUBLIC_FEEDBACK_URL', 'https://example.com/form');
    expect(getFeedbackUrl()).toBe('https://example.com/form');
    expect(isFeedbackEnabled()).toBe(true);
  });
});
