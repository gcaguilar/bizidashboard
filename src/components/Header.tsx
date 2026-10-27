'use client';

import { useState } from 'react';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { HeaderSearch } from '@/components/HeaderSearch';
import { HeaderSession } from '@/components/HeaderSession';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { translateNavLabel } from '@/lib/i18n/nav-labels';
import { useT } from '@/lib/i18n/use-locale';
import { appRoutes } from '@/lib/routes';
import { PUBLIC_MAIN_NAV_ITEMS, PUBLIC_MORE_NAV_ITEMS, PUBLIC_NAV_ITEMS } from '@/lib/public-navigation';
import { useDismissOnOutsideClick } from '@/lib/use-dismiss-on-outside-click';

function buildNavEvent(source: string, ctaId: string) {
  return {
    source,
    ctaId,
    destination: ctaId,
    sourceRole: 'utility' as const,
    destinationRole: 'hub' as const,
    transitionKind: 'within_public' as const,
  };
}

export default function Header() {
  const { locale, t } = useT();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useDismissOnOutsideClick(moreOpen, '[data-more-dropdown]', () => setMoreOpen(false));
  useDismissOnOutsideClick(mobileOpen, '[data-mobile-nav]', () => setMobileOpen(false));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2 px-3 py-3 md:gap-3 md:px-4">
        <TrackedLink
          href={appRoutes.home()}
          className="shrink-0 whitespace-nowrap text-lg font-bold text-[var(--foreground)]"
        >
          DatosBizi
        </TrackedLink>

        <nav
          aria-label={t('nav.mainAriaLabel')}
          className="hidden min-w-0 flex-1 items-center gap-x-3 text-sm md:flex"
        >
          {PUBLIC_MAIN_NAV_ITEMS.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              ctaEvent={buildNavEvent('header_main', link.ctaId)}
              className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              {translateNavLabel(locale, link)}
            </TrackedLink>
          ))}

          <div className="relative ml-auto" data-more-dropdown>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className="min-h-0 px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {t('nav.more')}
            </Button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 flex min-w-[10rem] flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg"
              >
                {PUBLIC_MORE_NAV_ITEMS.map((link) => (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    ctaEvent={buildNavEvent('header_more', link.ctaId)}
                    className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    {translateNavLabel(locale, link)}
                  </TrackedLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-0 px-2 py-1 text-base font-bold text-[var(--muted)] hover:text-[var(--foreground)] md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span aria-hidden="true">{mobileOpen ? '✕' : '☰'}</span>
          </Button>
          <LanguageSwitcher />
          <HeaderSearch />
          <ThemeToggleButton />
          <HeaderSession />
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          data-mobile-nav
          className="border-t border-[var(--border)] bg-[var(--card)] md:hidden"
        >
          <nav
            aria-label={t('nav.mainAriaLabel')}
            className="mx-auto grid max-w-[1280px] grid-cols-2 gap-1 px-3 py-3 text-sm"
          >
            {PUBLIC_NAV_ITEMS.map((link) => (
              <TrackedLink
                key={link.href}
                href={link.href}
                ctaEvent={buildNavEvent('header_mobile', link.ctaId)}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-[var(--muted)] transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                {translateNavLabel(locale, link)}
              </TrackedLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
