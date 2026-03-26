import Link from 'next/link';
import { PUBLIC_NAV_ITEMS } from '@/lib/public-navigation';

type PublicSectionNavProps = {
  activeHref: string;
  className?: string;
};

export function PublicSectionNav({ activeHref, className }: PublicSectionNavProps) {
  return (
    <nav aria-label="Secciones globales" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {PUBLIC_NAV_ITEMS.map((item) => {
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
