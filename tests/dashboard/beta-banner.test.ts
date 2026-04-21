import { describe, expect, it } from 'vitest';
import {
  BICIRADAR_BANNER_DISMISSED_STORAGE_KEY,
  FEEDBACK_BANNER_DISMISSED_STORAGE_KEY,
  FEEDBACK_VISIT_COUNT_STORAGE_KEY,
  resolveInitialFeedbackBannerState,
} from '@/lib/feedback';

describe('feedback banner state', () => {
  it('shows the biciradar banner on the first visit', () => {
    const state = resolveInitialFeedbackBannerState(() => null);

    expect(state).toEqual({
      variant: 'biciradar',
      visitCount: 1,
    });
  });

  it('shows the feedback banner from the second visit onwards', () => {
    const storage = new Map<string, string>([[FEEDBACK_VISIT_COUNT_STORAGE_KEY, '1']]);

    const state = resolveInitialFeedbackBannerState((key) => storage.get(key) ?? null);

    expect(state).toEqual({
      variant: 'feedback',
      visitCount: 2,
    });
  });

  it('hides the feedback banner when it was dismissed already', () => {
    const storage = new Map<string, string>([
      [FEEDBACK_VISIT_COUNT_STORAGE_KEY, '4'],
      [FEEDBACK_BANNER_DISMISSED_STORAGE_KEY, '1'],
    ]);

    const state = resolveInitialFeedbackBannerState((key) => storage.get(key) ?? null);

    expect(state).toEqual({
      variant: 'hidden',
      visitCount: 5,
    });
  });

  it('falls back safely when storage access throws', () => {
    const state = resolveInitialFeedbackBannerState(() => {
      throw new Error('storage blocked');
    });

    expect(state).toEqual({
      variant: 'biciradar',
      visitCount: 1,
    });
  });

  it('still hides the first banner when biciradar was dismissed before a second visit', () => {
    const storage = new Map<string, string>([
      [BICIRADAR_BANNER_DISMISSED_STORAGE_KEY, '1'],
    ]);

    const state = resolveInitialFeedbackBannerState((key) => storage.get(key) ?? null);

    expect(state).toEqual({
      variant: 'hidden',
      visitCount: 1,
    });
  });
});
