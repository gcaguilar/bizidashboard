import { formatPercent } from '@/lib/format';
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
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Resumen</p>
      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">Salud general del sistema</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Resumen rapido para entender cuantas estaciones hay, cuantas bicis quedan y como de equilibrada esta la red.</p>

      <MetricGrid>
        <MetricCard label="Estaciones activas" value={totalStations} />
        <MetricCard label="Bicis disponibles" value={bikesAvailable} />
        <MetricCard label="Anclajes libres" value={anchorsFree} />
        <MetricCard label="Ocupacion media" value={formatPercent(avgOccupancy)} />
      </MetricGrid>

      <p className="mt-3 text-xs text-[var(--muted)]">Actualizado {updatedText}</p>
    </article>
  );
}
