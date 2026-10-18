import type { InteractiveComparisonOption } from '@/lib/comparison-hub';

function MetricColumn({ option }: { option: InteractiveComparisonOption }) {
  if (!option.metrics || option.metrics.length === 0) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        {option.label}
      </p>
      <div className="mt-3 space-y-2">
        {option.metrics.map((metric) => (
          <div key={metric.key} className="ui-metric-card">
            <p className="stat-label">{metric.label}</p>
            <p className="stat-value">{metric.value}</p>
            {metric.hint ? (
              <p className="text-xs text-[var(--muted)]">{metric.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Tarjetas de métricas lado a lado: disponibilidad media de bicis y huecos,
 * horas sin servicio y tensión por anclaje, contextualizadas por entidad.
 */
export function CompareMetricColumns({
  left,
  right,
}: {
  left: InteractiveComparisonOption;
  right: InteractiveComparisonOption;
}) {
  const hasMetrics = (left.metrics?.length ?? 0) > 0 || (right.metrics?.length ?? 0) > 0;
  if (!hasMetrics) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricColumn option={left} />
      <MetricColumn option={right} />
    </div>
  );
}
