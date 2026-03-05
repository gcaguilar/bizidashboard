import Link from 'next/link';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';

const QUICK_FAQ = [
  {
    question: 'Como se detecta una alerta activa?',
    answer: `Se analiza una ventana movil de ${ANALYTICS_WINDOWS.alertWindowHours} horas. Si bicis medias < ${ALERT_THRESHOLDS.lowBikes} o anclajes libres < ${ALERT_THRESHOLDS.lowAnchors}, se genera alerta.`,
  },
  {
    question: 'Que significa horas problema?',
    answer:
      'Es la suma de horas con disponibilidad muy baja de bicis o de anclajes, dentro de la ventana de ranking.',
  },
  {
    question: 'Como se estima la matriz O-D?',
    answer:
      'Se infiere desde variaciones netas horarias por estacion y se agrega por distrito. No representa viajes individuales observados.',
  },
];

export function MethodologyPanel() {
  return (
    <section className="dashboard-card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Centro de ayuda rapido</h2>
          <p className="text-xs text-[var(--muted)]">
            Metodologia, interpretacion de metricas y preguntas frecuentes.
          </p>
        </div>
        <Link
          href="/dashboard/ayuda"
          className="inline-flex items-center rounded-full border border-[var(--accent-soft)] bg-[var(--surface-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-white hover:bg-[var(--accent)]"
        >
          Ir al FAQ completo
        </Link>
      </header>

      <div className="grid gap-3">
        {QUICK_FAQ.map((item) => (
          <article
            key={item.question}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
