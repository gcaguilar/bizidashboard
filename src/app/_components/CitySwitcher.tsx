import { CITY_CONFIGS, CITIES, type City } from '@/lib/constants';
import { getCurrentCityKey } from '@/lib/site';

type CitySwitcherProps = {
  className?: string;
  compact?: boolean;
};

type CitySwitcherItem = {
  city: City;
  label: string;
  statusLabel: string;
  isActive: boolean;
};

function getCitySwitcherItems(): CitySwitcherItem[] {
  const currentCity = getCurrentCityKey();

  return CITIES.map((city) => ({
    city,
    label: CITY_CONFIGS[city].name,
    statusLabel:
      city === currentCity ? 'Activa en esta instalacion' : 'Pendiente en esta instalacion',
    isActive: city === currentCity,
  }));
}

export function CitySwitcher({ className, compact = false }: CitySwitcherProps) {
  const items = getCitySwitcherItems();

  return (
    <section
      aria-label="Selector de ciudad"
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3 ${className ?? ''}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Ciudad
          </p>
          {!compact ? (
            <p className="text-xs text-[var(--muted)]">
              La navegacion publica usa rutas canonicas comunes y muestra aqui la ciudad activa de
              esta instalacion.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <div
              key={item.city}
              aria-current={item.isActive ? 'true' : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                item.isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  item.isActive
                    ? 'bg-white/18 text-white'
                    : 'bg-black/5 text-[var(--muted)]'
                }`}
              >
                {item.isActive ? 'Activa' : 'Roadmap'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!compact ? (
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          {items.find((item) => item.isActive)?.statusLabel ?? 'Sin ciudad activa declarada'}.
        </p>
      ) : null}
    </section>
  );
}
