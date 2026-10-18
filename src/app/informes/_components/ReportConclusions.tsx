import type { MonthlyReport } from '@/lib/monthly-report';

type ReportConclusionsProps = {
  report: MonthlyReport;
};

export function ReportConclusions({ report }: ReportConclusionsProps) {
  const { recommendations, highlights, weekdayWeekendProfile, monthlyConclusions } = report;

  const weekPattern =
    weekdayWeekendProfile.dominantPeriod === 'weekday'
      ? `Entre semana hay más actividad media por día (${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts) que en fin de semana (${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts).`
      : weekdayWeekendProfile.dominantPeriod === 'weekend'
        ? `En fin de semana hay más actividad media por día (${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts) que entre semana (${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts).`
        : null;

  // Primero las conclusiones concretas del mes (franja, barrio, día atípico),
  // después el patrón semanal y por último las recomendaciones generales.
  const conclusions = [
    ...monthlyConclusions,
    ...(weekPattern ? [weekPattern] : []),
    ...recommendations,
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Conclusiones prácticas</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Lecturas pensadas para planificar mejor los trayectos, no solo para leer cifras.
        </p>

        {conclusions.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Todavía no hay conclusiones para este mes.</p>
        ) : (
          <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            {conclusions.map((conclusion, index) => (
              <li
                key={`${conclusion}-${index}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[10px] font-bold text-[var(--primary)]">
                  {index + 1}
                </span>
                {conclusion}
              </li>
            ))}
          </ol>
        )}
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Hallazgos del mes</h2>
        {highlights.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Sin hallazgos destacados para este mes.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {highlights.map((item) => (
              <article
                key={`${item.title}-${item.detail}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.detail}</p>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
