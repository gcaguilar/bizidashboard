'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { configureAnalytics } from '@/lib/analytics/client';
import type { PostHogRuntimeConfig } from '@/lib/analytics/config';
import {
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  subscribeToAnalyticsPreferences,
  writeAnalyticsConsent,
  type AnalyticsConsent,
  type AnalyticsConsentChoice,
} from '@/lib/analytics/consent';
import { appRoutes } from '@/lib/routes';
import { useT } from '@/lib/i18n/use-locale';

type ConsentBannerProps = {
  posthog: PostHogRuntimeConfig | null;
};

/** Minimal first-party consent UI. It never loads analytics before a choice. */
export function ConsentBanner({ posthog }: ConsentBannerProps) {
  const { t } = useT();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Available to `trackEvent` before any route tracker's effect runs.
  configureAnalytics(posthog);

  const subscribe = useCallback(
    (onChange: () => void) => subscribeToAnalyticsConsent(() => onChange()),
    [],
  );
  const consent = useSyncExternalStore(
    subscribe,
    readAnalyticsConsent,
    (): AnalyticsConsent => 'unknown',
  );

  useEffect(() => {
    return subscribeToAnalyticsPreferences(() => setSettingsOpen(true));
  }, []);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen]);

  const choose = useCallback((choice: AnalyticsConsentChoice) => {
    writeAnalyticsConsent(choice);
    setSettingsOpen(false);
  }, []);

  if (!posthog) {
    return null;
  }

  return (
    <>
      {consent === 'unknown' && !settingsOpen ? (
        <section
          data-analytics-consent="banner"
          aria-label={t('consent.banner.ariaLabel')}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/95 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-sm font-black text-[var(--foreground)]">{t('consent.banner.title')}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {t('consent.banner.description')}{' '}
                <a
                  href={appRoutes.privacidad()}
                  className="underline underline-offset-2 hover:text-[var(--foreground)]"
                >
                  {t('nav.item.privacidad')}
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ui-inline-action" onClick={() => choose('granted')}>
                {t('consent.banner.accept')}
              </button>
              <button type="button" className="ui-inline-action" onClick={() => choose('denied')}>
                {t('consent.banner.reject')}
              </button>
              <button type="button" className="ui-inline-action" onClick={() => setSettingsOpen(true)}>
                {t('consent.banner.settings')}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {settingsOpen ? (
        <div data-analytics-consent="dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="analytics-consent-title"
            className="ui-section-card w-full max-w-lg bg-[var(--background)]"
          >
            <h2 id="analytics-consent-title" className="text-xl font-black text-[var(--foreground)]">
              {t('consent.settings.title')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {t('consent.settings.description')}
            </p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">{t('consent.settings.analytics')}</p>
                <p className="text-xs text-[var(--muted)]">
                  {consent === 'granted'
                    ? t('consent.settings.enabled')
                    : t('consent.settings.disabled')}
                </p>
              </div>
              {consent === 'granted' ? (
                <button type="button" className="ui-inline-action" onClick={() => choose('denied')}>
                  {t('consent.settings.revoke')}
                </button>
              ) : (
                <button type="button" className="ui-inline-action" onClick={() => choose('granted')}>
                  {t('consent.settings.save')}
                </button>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="ui-inline-action" onClick={() => setSettingsOpen(false)}>
                {t('consent.settings.close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
