import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  getPublicNavItem,
  PUBLIC_PRIMARY_NAV_ITEMS,
  PUBLIC_UTILITY_NAV_ITEMS,
  type PublicNavItem,
  type PublicNavItemId,
} from '@/lib/public-navigation';

type PublicSectionNavProps = {
  activeItemId: PublicNavItemId;
  className?: string;
};

const MOBILE_PRIMARY_NAV_IDS = ['explore', 'reports', 'dashboard'] as const;

function renderNavLink(
  item: PublicNavItem,
  isActive: boolean,
  sourceRole: PublicNavItem['trackingRole']
) {
  return (
    <TrackedLink
      key={item.id}
      href={item.href}
      navigationEvent={{
        source: 'public_section_nav',
        destination: item.id,
        module: `public_nav_${item.section}`,
        sourceRole,
        destinationRole: item.trackingRole,
        transitionKind: item.trackingRole === 'dashboard' ? 'to_dashboard' : 'within_public',
      }}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        isActive
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
      }`}
    >
      {item.label}
    </TrackedLink>
  );
}

export function PublicSectionNav({ activeItemId, className }: PublicSectionNavProps) {
  const activeItem = getPublicNavItem(activeItemId);
  const mobilePrimaryNavItems = MOBILE_PRIMARY_NAV_IDS.map((id) => getPublicNavItem(id));
  const mobileOverflowNavItems = [
    getPublicNavItem('home'),
    ...PUBLIC_UTILITY_NAV_ITEMS,
  ];
  const isMobileOverflowActive = activeItem.id === 'home' || activeItem.section === 'utility';

  return (
    <nav aria-label="Secciones globales" className={className}>
      <div className="hidden items-center justify-between gap-3 md:flex">
        <div className="flex flex-wrap items-center gap-2">
          {PUBLIC_PRIMARY_NAV_ITEMS.map((item) =>
            renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PUBLIC_UTILITY_NAV_ITEMS.map((item) =>
            renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:hidden">
        {mobilePrimaryNavItems.map((item) =>
          renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)
        )}

        <details className="group relative">
          <summary
            className={`inline-flex cursor-pointer list-none rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isMobileOverflowActive
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
            }`}
          >
            Mas
          </summary>
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[200px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-2">
              {mobileOverflowNavItems.map((item) =>
                renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)
              )}
            </div>
          </div>
        </details>
      </div>
    </nav>
  );
}
