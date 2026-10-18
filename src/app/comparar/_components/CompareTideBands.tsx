import type { ComparisonBand, InteractiveComparisonOption } from '@/lib/comparison-hub';

const STATUS_META: Record<ComparisonBand['status'], { emoji: string; label: string; short: string }> = {
  green: { emoji: '🟢', label: 'Disponibilidad holgada', short: 'Holgado' },
  amber: { emoji: '🟠', label: 'Disponibilidad ajustada', short: 'Ajustado' },
  red: { emoji: '🔴', label: 'Saturación o estación vacía', short: 'Saturado' },
  unknown: { emoji: '⚪', label: 'Sin datos suficientes', short: 'Sin datos' },
};

const numberFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

function BandRow({ option }: { option: InteractiveComparisonOption }) {
  if (!option.bands || option.bands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-[var(--foreground)]">{option.label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {option.bands.map((band) => {
          const meta = STATUS_META[band.status];
          const showPeakHour =
            band.peakHour !== null && (band.status === 'red' || band.status === 'amber');
          return (
            <div
              key={band.id}
              className="compare-band"
              data-status={band.status}
              title={meta.label}
            >
              <span className="compare-band-label">
                {band.label} · {band.rangeLabel}
              </span>
              <span className="compare-band-value">
                {meta.emoji} {meta.short}
              </span>
              {band.avgBikes !== null && band.avgAnchors !== null ? (
                <span className="text-xs text-[var(--muted)]">
                  {numberFormatter.format(band.avgBikes)} bicis · {numberFormatter.format(band.avgAnchors)} huecos
                </span>
              ) : null}
              {showPeakHour ? (
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Crítico ~{String(band.peakHour).padStart(2, '0')}:00
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Comparativa horaria visual ("efecto marea"): franjas de mañana, mediodía,
 * tarde y noche con semáforo de disponibilidad para cada lado. Sustituye la
 * lectura de líneas superpuestas por un código de color legible de un vistazo.
 */
export function CompareTideBands({
  left,
  right,
}: {
  left: InteractiveComparisonOption;
  right: InteractiveComparisonOption;
}) {
  const hasBands = (left.bands?.length ?? 0) > 0 || (right.bands?.length ?? 0) > 0;
  if (!hasBands) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Efecto marea por franjas
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          🟢 holgado · 🟠 ajustado · 🔴 saturación o estación vacía. Así cambia la disponibilidad a lo
          largo del día.
        </p>
      </div>
      <BandRow option={left} />
      <BandRow option={right} />
    </div>
  );
}
