import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CITY_CONFIGS, type City } from '@/lib/constants';
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

  return [
    {
      city: currentCity,
      label: CITY_CONFIGS[currentCity].name,
      statusLabel: 'Activa en esta instalacion',
      isActive: true,
    },
  ];
}

export function CitySwitcher({ className, compact = false }: CitySwitcherProps) {
  const items = getCitySwitcherItems();

  return (
    <section
      aria-label="Ciudad activa en esta instalacion"
      className={className}
    >
      <Card variant="stat" className="rounded-2xl bg-[var(--secondary)] px-3 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Ciudad
            </p>
            {!compact ? (
              <p className="text-xs text-[var(--muted)]">
                Esta instalacion publica esta operativa solo para Zaragoza y refleja aqui la ciudad
                disponible.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
              <div
                key={item.city}
                aria-label={item.isActive ? `${item.label} activa en esta instalacion` : item.label}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  item.isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]'
                }`}
              >
                <span>{item.label}</span>
                <Badge
                  variant="muted"
                  className={`rounded-full border-transparent px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] ${
                    item.isActive
                      ? 'bg-white/18 text-white'
                      : 'bg-black/5 text-[var(--muted)]'
                  }`}
                >
                  {item.isActive ? 'Activa' : 'Roadmap'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {!compact ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            {items.find((item) => item.isActive)?.statusLabel ?? 'Sin ciudad activa declarada'}.
          </p>
        ) : null}
      </Card>
    </section>
  );
}
