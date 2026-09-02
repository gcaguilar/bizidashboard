import { formatPercent } from '@/lib/format';
import { productTerms } from '@/lib/product-copy';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';

type SystemHealthCardProps = {
  totalStations: number;
  bikesAvailable: number;
  anchorsFree: number;
  avgOccupancy: number;
  updatedText: string;
};

export function SystemHealthCard({
  totalStations,
  bikesAvailable,
  anchorsFree,
  avgOccupancy,
  updatedText,
}: SystemHealthCardProps) {
  return (
    <article className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{productTerms.networkBalance.label}</p>
      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Disponibilidad en la última muestra</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{productTerms.networkBalance.definition}</p>

      <MetricGrid columns={2}>
        <MetricCard label="Estaciones activas" value={totalStations} />
        <MetricCard label="Bicis disponibles" value={bikesAvailable} />
        <MetricCard label="Anclajes libres" value={anchorsFree} />
        <MetricCard label="Ocupacion media" value={formatPercent(avgOccupancy)} />
      </MetricGrid>

      <p className="mt-3 text-xs text-[var(--muted)]">Actualizado {updatedText}</p>
    </article>
  );
}
