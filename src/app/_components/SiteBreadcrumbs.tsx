import Link from 'next/link';
import { CitySwitcher } from '@/app/_components/CitySwitcher';
import type { BreadcrumbItem } from '@/lib/breadcrumbs';

type SiteBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function SiteBreadcrumbs({ items, className }: SiteBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;

              return (
                <li key={`${item.href}-${item.label}`} className="flex items-center gap-2">
                  {isLast ? (
                    <span aria-current="page" className="font-semibold text-[var(--foreground)]">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="rounded-sm transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    >
                      {item.label}
                    </Link>
                  )}
                  {!isLast ? <span aria-hidden="true">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
        <CitySwitcher compact className="min-w-[280px] flex-1 sm:flex-none" />
      </div>
    </div>
  );
}
