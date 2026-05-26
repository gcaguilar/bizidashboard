'use client';

import { useEffect, useState } from 'react';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { PUBLIC_MAIN_NAV_ITEMS, PUBLIC_MORE_NAV_ITEMS } from '@/lib/public-navigation';

export default function Header() {
  const [moreOpen, setMoreOpen] = useState(false);

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
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4 md:gap-6">
            <TrackedLink href={appRoutes.home()} className="text-lg font-bold text-[var(--foreground)]">
              DatosBizi
            </TrackedLink>

            <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
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
          </div>
        </div>
      </header>
    </>
  );
}
