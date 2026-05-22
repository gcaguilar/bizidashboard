import { useLocation } from '@tanstack/react-router';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { appRoutes } from '@/lib/routes';

const STATS_NAV = [
  { label: 'Estadísticas', href: appRoutes.statsHub() },
  { label: 'Estaciones', href: appRoutes.statsEstaciones() },
  { label: 'Barrios', href: appRoutes.statsBarrios() },
  { label: 'Horarios', href: appRoutes.statsHorarios() },
  { label: 'Viajes', href: appRoutes.statsViajes() },
  { label: 'Mapa', href: appRoutes.statsMapa() },
  { label: 'Redistribución', href: appRoutes.statsRedistribucion() },
];

type StatsNavItem = { label: string; href: string };

const MOBILE_VISIBLE_COUNT = 3;

function renderPill(item: StatsNavItem, isActive: boolean) {
  return (
    <a
      key={item.href}
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        isActive
          ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
          : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
      }`}
    >
      {item.label}
    </a>
  );
}

export function StatsSecondaryNav({ className }: { className?: string }) {
  const location = useLocation();
  const pathname = location.pathname;

  function isActive(item: StatsNavItem) {
    return item.href === appRoutes.statsHub()
      ? pathname === appRoutes.statsHub() || pathname === `${appRoutes.statsHub()}/`
      : pathname.startsWith(item.href);
  }

  const visibleItems = STATS_NAV.slice(0, MOBILE_VISIBLE_COUNT);
  const overflowItems = STATS_NAV.slice(MOBILE_VISIBLE_COUNT);
  const overflowItemIsActive = overflowItems.some((item) => isActive(item));

  return (
    <nav aria-label="Secciones de estadísticas" className={className}>
      {/* Desktop: all pills in a single row */}
      <div className="hidden flex-wrap gap-2 md:flex">
        {STATS_NAV.map((item) => renderPill(item, isActive(item)))}
      </div>

      {/* Mobile: first 3 pills + accordion overflow */}
      <div className="flex flex-wrap items-center gap-2 md:hidden">
        {visibleItems.map((item) => renderPill(item, isActive(item)))}

        <Accordion className="relative">
          <AccordionItem value="stats-overflow" className="border-none bg-transparent">
            <AccordionTrigger
              className={`inline-flex cursor-pointer list-none rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                overflowItemIsActive
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
              }`}
            >
              Más
            </AccordionTrigger>
            <AccordionContent
              keepMounted
              className="absolute left-0 top-[calc(100%+0.5rem)] z-[9999] min-w-[200px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-md)]"
            >
              <div className="flex flex-col gap-2">
                {overflowItems.map((item) => renderPill(item, isActive(item)))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </nav>
  );
}
