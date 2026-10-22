import { TrackedLink } from '@/app/_components/TrackedLink';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';

const QUICK_FAQ = [
  {
    question: '¿Cómo se detecta una alerta activa?',
    answer: `Miramos las últimas ${ANALYTICS_WINDOWS.alertWindowHours} horas. Si la media de bicis baja de ${ALERT_THRESHOLDS.lowBikes} o la media de anclajes libres baja de ${ALERT_THRESHOLDS.lowAnchors}, entra en alerta.`,
  },
  {
    question: '¿Qué significa horas problema?',
    answer:
      'Es el tiempo acumulado con riesgo operativo: pocas bicis o pocos anclajes. Más horas problema = más necesidad de actuar.',
  },
  {
    question: '¿Cómo se estima la matriz O-D?',
    answer:
      'Se estima con cambios de disponibilidad por hora y se agrupa por distritos. Sirve para ver tendencias, no viajes individuales exactos.',
  },
  {
    question: '¿Cómo se calculan las rutas destacadas?',
    answer:
      'Se reparte el flujo saliente de cada distrito entre destinos según su peso de entradas en esa franja. Son rutas probables, no trazas GPS.',
  },
  {
    question: '¿Qué significa predicción en el dashboard?',
    answer:
      'Las predicciones (+30/+60 min) anticipan disponibilidad con histórico + estado reciente. Ayudan a prevenir, pero no garantizan el valor final.',
  },
];

export function MethodologyPanel() {
  return (
    <section className="ui-section-card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Centro de ayuda rápido</h2>
          <p className="text-xs text-[var(--muted)]">
            Metodología, interpretación de métricas y preguntas frecuentes.
          </p>
        </div>
        <Button asChild variant="cta" size="sm" className="rounded-full">
          <TrackedLink href={appRoutes.dashboardHelp()}>Ir a la ayuda completa</TrackedLink>
        </Button>
      </header>

      <div className="grid gap-3">
        {QUICK_FAQ.map((item) => (
          <article
            key={item.question}
            className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{item.answer}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Si una sección todavía no tiene histórico suficiente o una capacidad avanzada activa, el dashboard muestra el bloque igualmente y explica por que falta ese dato.
      </p>
    </section>
  );
}
