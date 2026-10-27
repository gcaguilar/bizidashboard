import { activityIndexUnits } from '@/lib/product-copy';
import { formatDateLabel, formatInteger } from '@/lib/format';
import { getServiceCauseLabel } from '@/lib/service-calendar';
import type { MonthlyReport } from '@/lib/monthly-report';

type ReportAnomaliesProps = {
  report: MonthlyReport;
};

export function ReportAnomalies({ report }: ReportAnomaliesProps) {
  const { anomalies } = report;

  if (anomalies.length === 0) {
    return (
      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Picos anómalos del mes</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          No se han detectado días con un uso claramente fuera de lo habitual en este mes.
        </p>
      </section>
    );
  }

  return (
    <section className="ui-section-card">
      <h2 className="text-xl font-black text-[var(--foreground)]">Picos anómalos del mes</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Días con un uso muy por encima o por debajo de lo normal para ese día de la semana. Puede coincidir con festivos, eventos, huelgas, obras o meteo adversa.
      </p>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {anomalies.map((anomaly) => {
          const isUp = anomaly.direction === 'up';

          return (
            <li
              key={anomaly.day}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  <span className={isUp ? 'text-[var(--primary)]' : 'text-[var(--warning)]'} aria-hidden="true">
                    {isUp ? '▲' : '▼'}
                  </span>{' '}
                  <span className="sr-only">{isUp ? 'Sube' : 'Baja'}</span>
                  {formatDateLabel(anomaly.day)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {formatInteger(anomaly.demandScore)} {activityIndexUnits.perDay} frente a {formatInteger(anomaly.baseline)} habituales
                  {anomaly.cause ? ` · ${getServiceCauseLabel(anomaly.cause.kind)}: ${anomaly.cause.label}` : ' · sin causa identificada'}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-bold ${isUp ? 'text-[var(--primary)]' : 'text-[var(--warning)]'}`}
              >
                {anomaly.deviationRatio >= 0 ? '+' : ''}
                {Math.round(anomaly.deviationRatio * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
