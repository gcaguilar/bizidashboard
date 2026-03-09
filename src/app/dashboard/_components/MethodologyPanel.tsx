import Link from 'next/link';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';

const QUICK_FAQ = [
  {
    question: 'Como se detecta una alerta activa?',
    answer: `Miramos las ultimas ${ANALYTICS_WINDOWS.alertWindowHours} horas. Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, entra en alerta.`,
  },
  {
    question: 'Que significa horas problema?',
    answer:
      'Es el tiempo acumulado con riesgo operativo: pocas bicis o pocos anclajes. Mas horas problema = mas necesidad de actuar.',
  },
  {
    question: 'Como se estima la matriz O-D?',
    answer:
      'Se estima con cambios de disponibilidad por hora y se agrupa por distritos. Sirve para ver tendencias, no viajes individuales exactos.',
  },
  {
    question: 'Como se calculan las rutas destacadas?',
    answer:
      'Se reparte el flujo saliente de cada distrito entre destinos segun su peso de entradas en esa franja. Son rutas probables, no trazas GPS.',
  },
  {
    question: 'Que significa prediccion en el dashboard?',
    answer:
      'Las predicciones (+30/+60 min) anticipan disponibilidad con historico + estado reciente. Ayudan a prevenir, pero no garantizan el valor final.',
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
          Ir a la ayuda completa
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
