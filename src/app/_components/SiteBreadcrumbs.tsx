'use client';

import { useLocation } from '@tanstack/react-router';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbListItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildBreadcrumbClickEvent, resolveRouteKeyFromPathname } from '@/lib/analytics';
import type { BreadcrumbItem as SiteBreadcrumbItem } from '@/lib/breadcrumbs';

type SiteBreadcrumbsProps = {
  items: SiteBreadcrumbItem[];
  className?: string;
};

export function SiteBreadcrumbs({ items, className }: SiteBreadcrumbsProps) {
  const pathname = useLocation().pathname;

  if (items.length === 0) {
    return null;
  }

  const routeKey = resolveRouteKeyFromPathname(pathname);
  const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';

  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <BreadcrumbListItem key={`${item.href}-${item.label}`}>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <TrackedLink
                    href={item.href ?? undefined}
                    trackingEvent={buildBreadcrumbClickEvent({
                      surface,
                      routeKey,
                      source: 'breadcrumbs',
                      destination: resolveRouteKeyFromPathname(item.href ?? null),
                      section: 'contextual_navigation',
                    })}
                    className="rounded-sm transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                  >
                    {item.label}
                  </TrackedLink>
                )}
                {!isLast ? <BreadcrumbSeparator /> : null}
              </BreadcrumbListItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
