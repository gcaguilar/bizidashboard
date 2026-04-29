import Link from 'next/link';
import { CitySwitcher } from '@/app/_components/CitySwitcher';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbListItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as SiteBreadcrumbItem } from '@/lib/breadcrumbs';

type SiteBreadcrumbsProps = {
  items: SiteBreadcrumbItem[];
  className?: string;
};

export function SiteBreadcrumbs({ items, className }: SiteBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;

              return (
                <BreadcrumbListItem key={`${item.href}-${item.label}`}>
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <Link
                      href={item.href}
                      className="rounded-sm transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
                    >
                      {item.label}
                    </Link>
                  )}
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </BreadcrumbListItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <CitySwitcher compact className="min-w-[280px] flex-1 sm:flex-none" />
      </div>
    </div>
  );
}
