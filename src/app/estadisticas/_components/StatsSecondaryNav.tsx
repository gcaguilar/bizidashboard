import { useLocation } from '@tanstack/react-router';

const STATS_NAV = [
  { label: 'Estadísticas', href: '/estadisticas' },
  { label: 'Estaciones', href: '/estadisticas/estaciones' },
  { label: 'Barrios', href: '/estadisticas/barrios' },
  { label: 'Horarios', href: '/estadisticas/horarios' },
  { label: 'Viajes', href: '/estadisticas/viajes' },
  { label: 'Mapa', href: '/estadisticas/mapa' },
  { label: 'Redistribución', href: '/estadisticas/redistribucion' },
] as const;

export function StatsSecondaryNav({ className }: { className?: string }) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav aria-label="Secciones de estadísticas" className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {STATS_NAV.map((item) => {
        const isActive =
          item.href === '/estadisticas'
            ? pathname === '/estadisticas' || pathname === '/estadisticas/'
            : pathname.startsWith(item.href);
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
      })}
    </nav>
  );
}
