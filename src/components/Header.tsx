'use client';

import { useEffect, useState } from 'react';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { PUBLIC_MAIN_NAV_ITEMS, PUBLIC_MORE_NAV_ITEMS } from '@/lib/public-navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-more-dropdown]')) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [moreOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <TrackedLink href={appRoutes.home()} className="text-lg font-bold text-[var(--foreground)]">
              DatosBizi
            </TrackedLink>

            <nav aria-label="Navegación principal" className="hidden items-center gap-4 text-sm md:flex">
              {PUBLIC_MAIN_NAV_ITEMS.map(link => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  ctaEvent={{
                    source: 'header_main',
                    ctaId: link.ctaId,
                    destination: link.ctaId,
                    sourceRole: 'utility',
                    destinationRole: 'hub',
                    transitionKind: 'within_public',
                  }}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  {link.label}
                </TrackedLink>
              ))}

              <div className="relative" data-more-dropdown>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="min-h-0 px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Más
                </Button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-2 flex min-w-[10rem] flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-lg">
                    {PUBLIC_MORE_NAV_ITEMS.map(link => (
                      <TrackedLink
                        key={link.href}
                        href={link.href}
                        ctaEvent={{
                          source: 'header_more',
                          ctaId: link.ctaId,
                          destination: link.ctaId,
                          sourceRole: 'utility',
                          destinationRole: 'hub',
                          transitionKind: 'within_public',
                        }}
                        className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition"
                      >
                        {link.label}
                      </TrackedLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton />

            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="ui-icon-button md:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--background)] p-6 gap-6 md:hidden">
          <div className="flex justify-end">
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
              className="ui-icon-button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-4 mt-4">
            {PUBLIC_MAIN_NAV_ITEMS.map(link => (
              <TrackedLink
                key={link.href}
                href={link.href}
                ctaEvent={{
                  source: 'header_mobile',
                  ctaId: link.ctaId,
                  destination: link.ctaId,
                  sourceRole: 'utility',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition"
              >
                {link.label}
              </TrackedLink>
            ))}
            <div className="my-2 h-px bg-[var(--border)]" />
            {PUBLIC_MORE_NAV_ITEMS.map(link => (
              <TrackedLink
                key={link.href}
                href={link.href}
                ctaEvent={{
                  source: 'header_mobile',
                  ctaId: link.ctaId,
                  destination: link.ctaId,
                  sourceRole: 'utility',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition"
              >
                {link.label}
              </TrackedLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
