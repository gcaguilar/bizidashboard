import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  getPublicNavItem,
  PUBLIC_NAV_ITEMS,
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
const MOBILE_COMPACT_NAV_LIMIT = 3;

export function getMobileCompactNav(activeItemId: PublicNavItemId) {
  const activeItem = getPublicNavItem(activeItemId);
  const mobilePrimaryNavItems = MOBILE_PRIMARY_NAV_IDS.map((id) => getPublicNavItem(id));

  if (activeItem.id === 'home') {
    return {
      visibleItems: [
        getPublicNavItem('home'),
        getPublicNavItem('explore'),
        getPublicNavItem('reports'),
      ],
      overflowItems: [getPublicNavItem('dashboard'), ...PUBLIC_UTILITY_NAV_ITEMS],
      isOverflowActive: false,
    };
  }

  if (activeItem.section === 'utility') {
    const visibleItems = [
      getPublicNavItem('explore'),
      getPublicNavItem('reports'),
      activeItem,
    ];

    return {
      visibleItems,
      overflowItems: PUBLIC_NAV_ITEMS.filter((item) => !visibleItems.some((visible) => visible.id === item.id)),
      isOverflowActive: false,
    };
  }

  return {
    visibleItems: mobilePrimaryNavItems,
    overflowItems: [getPublicNavItem('home'), ...PUBLIC_UTILITY_NAV_ITEMS],
    isOverflowActive: false,
  };
}

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
  const mobileCompactNav = getMobileCompactNav(activeItemId);

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
        {mobileCompactNav.visibleItems.slice(0, MOBILE_COMPACT_NAV_LIMIT).map((item) =>
          renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)
        )}

        <Accordion className="relative">
          <AccordionItem value="mobile-overflow" className="border-none bg-transparent">
            <AccordionTrigger
            className={`inline-flex cursor-pointer list-none rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              mobileCompactNav.isOverflowActive
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
            }`}
          >
            Mas
            </AccordionTrigger>
            <AccordionContent keepMounted className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-[200px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-2">
                {mobileCompactNav.overflowItems.map((item) =>
                  renderNavLink(item, item.id === activeItemId, activeItem.trackingRole)
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </nav>
  );
}
