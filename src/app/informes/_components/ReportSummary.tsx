import { MetricEvidence } from '@/app/_components/MetricEvidence';
import { formatMonthLabel } from '@/lib/months';
import type { MonthlyReport } from '@/lib/monthly-report';

type ReportSummaryProps = {
  report: MonthlyReport;
};

const TONE_CLASSES: Record<MonthlyReport['balance']['tone'], string> = {
  up: 'border-[var(--success)]/40 bg-[var(--success)]/10',
  down: 'border-[var(--warning)]/40 bg-[var(--warning)]/10',
  neutral: 'border-[var(--border)] bg-[var(--secondary)]',
  unknown: 'border-[var(--border)] bg-[var(--secondary)]',
};

export function ReportSummary({ report }: ReportSummaryProps) {
  const monthLabel = formatMonthLabel(report.monthKey);
  const { balance, comparison, coverage } = report;
  const coverageNote =
    coverage.expectedDays > 0
      ? `${coverage.coveredDays} de ${coverage.expectedDays} días con datos (${coverage.label}).`
      : 'Sin días de cobertura registrados.';

  return (
    <section className="ui-section-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
        Resumen ejecutivo
      </p>
      <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">
        Qué ha pasado en {monthLabel}
      </h2>

      <div className={`mt-4 rounded-xl border px-4 py-3 ${TONE_CLASSES[balance.tone]}`}>
        <p className="text-base font-bold text-[var(--foreground)]">{balance.headline}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{balance.detail}</p>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{report.summary}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {coverageNote}
        {comparison.isComparable ? ` Comparación: ${comparison.periodLabel}.` : ''}
      </p>

      <MetricEvidence
        type="estimado"
        coverage={`${coverage.coveredDays} de ${coverage.expectedDays} días`}
        window={monthLabel}
        limitation="Índice para comparar actividad entre meses; no equivale a viajes oficiales."
      />
    </section>
  );
}
