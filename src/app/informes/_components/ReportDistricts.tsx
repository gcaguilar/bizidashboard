import { formatInteger, formatPercent } from '@/lib/format';
import type { DistrictMonthSummary, MonthlyReport } from '@/lib/monthly-report';

type ReportDistrictsProps = {
  report: MonthlyReport;
};

function maxOf(districts: DistrictMonthSummary[], selector: (district: DistrictMonthSummary) => number): number {
  return Math.max(1, ...districts.map((district) => selector(district)));
}

function DistrictList({
  districts,
  metric,
  metricLabel,
  tone,
}: {
  districts: DistrictMonthSummary[];
  metric: (district: DistrictMonthSummary) => number;
  metricLabel: (district: DistrictMonthSummary) => string;
  tone: 'primary' | 'muted' | 'warning';
}) {
  const max = maxOf(districts, metric);
  const indicatorClass =
    tone === 'primary' ? 'bg-[var(--primary)]' : tone === 'warning' ? 'bg-[var(--warning)]' : 'bg-[var(--muted)]';

  if (districts.length === 0) {
    return <p className="mt-4 text-sm text-[var(--muted)]">Sin datos suficientes por barrio para este mes.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {districts.map((district) => (
        <div key={district.district}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[var(--foreground)]">{district.district}</span>
            <span className="font-bold text-[var(--muted)]">{metricLabel(district)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
            <div
              className={`h-full rounded-full ${indicatorClass}`}
              style={{ width: `${Math.max(6, Math.round((metric(district) / max) * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            {district.stations} estaciones · ocupación media {formatPercent(district.avgOccupancy)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReportDistricts({ report }: ReportDistrictsProps) {
  const { mostActive, leastActive, undersupplied } = report.districts;

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Barrios más dinámicos</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Dónde se concentró más movimiento estimado este mes.</p>
        <DistrictList
          districts={mostActive}
          metric={(district) => district.demandScore}
          metricLabel={(district) => `${formatInteger(district.demandScore)} pts`}
          tone="primary"
        />
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Barrios menos usados</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Zonas con menor actividad estimada durante el mes.</p>
        <DistrictList
          districts={leastActive}
          metric={(district) => district.demandScore}
          metricLabel={(district) => `${formatInteger(district.demandScore)} pts`}
          tone="muted"
        />
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Barrios con más desabastecimiento</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Proporción de horas con estaciones vacías o sin huecos sobre el total observado.
        </p>
        <DistrictList
          districts={undersupplied}
          metric={(district) => district.frictionRate}
          metricLabel={(district) => `${formatPercent(district.frictionRate)} de horas problema`}
          tone="warning"
        />
      </article>
    </section>
  );
}
