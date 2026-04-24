import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BetaBanner } from '@/app/dashboard/_components/BetaBanner';
import {
  BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY,
  FEEDBACK_BANNER_DISMISSED_STORAGE_KEY,
  FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY,
  FEEDBACK_VISIT_COUNT_STORAGE_KEY,
} from '@/lib/feedback';

vi.mock('@/app/_components/FeedbackCta', () => ({
  FeedbackCta: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <a href="https://tally.so/r/ZjRAXz" className={className}>
      {children}
    </a>
  ),
}));

function renderBannerWithStorage(entries: Array<[string, string]>) {
  const storage = new Map<string, string>(entries);
  const windowStub = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  };

  vi.stubGlobal('window', windowStub);

  return {
    html: renderToStaticMarkup(<BetaBanner />),
    storage,
  };
}

describe('BetaBanner client feedback behavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the feedback modal and banner together from the second visit', () => {
    const { html, storage } = renderBannerWithStorage([
      [BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY, '1'],
      [FEEDBACK_VISIT_COUNT_STORAGE_KEY, '1'],
    ]);

    expect(html).toContain('Ayudanos a mejorar DatosBizi');
    expect(html).toContain('Cerrar dialogo de feedback');
    expect(html).toContain('Cerrar banner de feedback');
    expect(html.match(/Dar feedback/g)?.length).toBe(2);
    expect(storage.get(FEEDBACK_VISIT_COUNT_STORAGE_KEY)).toBe('1');
  });

  it('closing the feedback modal leaves the banner eligible on following visits', () => {
    const { html } = renderBannerWithStorage([
      [BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY, '1'],
      [FEEDBACK_VISIT_COUNT_STORAGE_KEY, '2'],
      [FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY, '2'],
    ]);

    expect(html).not.toContain('Ayudanos a mejorar DatosBizi');
    expect(html).toContain('Cerrar banner de feedback');
  });

  it('closing the feedback banner does not block the modal from reopening on schedule', () => {
    const { html } = renderBannerWithStorage([
      [BICIRADAR_WELCOME_MODAL_DISMISSED_STORAGE_KEY, '1'],
      [FEEDBACK_VISIT_COUNT_STORAGE_KEY, '6'],
      [FEEDBACK_MODAL_LAST_DISMISSED_VISIT_STORAGE_KEY, '2'],
      [FEEDBACK_BANNER_DISMISSED_STORAGE_KEY, '1'],
    ]);

    expect(html).toContain('Ayudanos a mejorar DatosBizi');
    expect(html).not.toContain('Cerrar banner de feedback');
  });
});
