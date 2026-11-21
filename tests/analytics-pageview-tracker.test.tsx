// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';

const { buildPublicPageViewEventMock, consentState, resolveRouteKeyMock, trackEventMock } =
  vi.hoisted(() => ({
    buildPublicPageViewEventMock: vi.fn((input: unknown) => ({
      name: 'public_page_view',
      payload: input,
    })),
    consentState: { value: 'unknown' as 'unknown' | 'granted' | 'denied' },
    resolveRouteKeyMock: vi.fn(() => 'explore'),
    trackEventMock: vi.fn(),
  }));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );
  return { ...actual, useLocation: () => ({ pathname: '/explorar' }) };
});

vi.mock('@/lib/analytics', () => ({
  buildPublicPageViewEvent: buildPublicPageViewEventMock,
  resolveRouteKeyFromPathname: resolveRouteKeyMock,
  trackEvent: trackEventMock,
  useAnalyticsConsent: () => consentState.value,
}));

async function flushMountEffect(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe('PublicPageViewTracker', () => {
  beforeEach(() => {
    trackEventMock.mockClear();
    buildPublicPageViewEventMock.mockClear();
    resolveRouteKeyMock.mockClear();
    consentState.value = 'unknown';
    // Force the setTimeout branch of the deferred mount-time track.
    Object.defineProperty(window, 'requestIdleCallback', { value: undefined, configurable: true });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not emit a page view while consent is unknown', async () => {
    render(<PublicPageViewTracker pageType="explore_hub" template="explore_hub" />);
    await flushMountEffect();

    expect(trackEventMock).not.toHaveBeenCalled();
    expect(resolveRouteKeyMock).not.toHaveBeenCalled();
  });

  it('does not emit a page view when consent was denied', async () => {
    consentState.value = 'denied';
    render(<PublicPageViewTracker pageType="explore_hub" template="explore_hub" />);
    await flushMountEffect();

    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it('emits exactly one page view once consent is granted', async () => {
    consentState.value = 'granted';
    const { rerender } = render(
      <PublicPageViewTracker pageType="explore_hub" template="explore_hub" />
    );

    await waitFor(() => expect(trackEventMock).toHaveBeenCalledTimes(1));
    expect(resolveRouteKeyMock).toHaveBeenCalledWith('/explorar');
    expect(trackEventMock).toHaveBeenCalledWith({
      name: 'public_page_view',
      payload: { routeKey: 'explore', pageType: 'explore_hub', template: 'explore_hub' },
    });

    rerender(<PublicPageViewTracker pageType="explore_hub" template="explore_hub" />);
    await flushMountEffect();
    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });

  it('starts tracking when consent changes from denied to granted on the same mount', async () => {
    consentState.value = 'denied';
    const { rerender } = render(
      <PublicPageViewTracker pageType="explore_hub" template="explore_hub" />
    );
    await flushMountEffect();
    expect(trackEventMock).not.toHaveBeenCalled();

    consentState.value = 'granted';
    rerender(<PublicPageViewTracker pageType="explore_hub" template="explore_hub" />);
    await waitFor(() => expect(trackEventMock).toHaveBeenCalledTimes(1));
  });
});
