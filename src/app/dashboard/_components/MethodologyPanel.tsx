import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS } from '@/analytics/types';

export function MethodologyPanel() {
  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Como se calcula</h2>
        <p className="text-xs text-[var(--muted)]">
          Reglas resumidas para interpretar alertas, rankings y ocupacion.
        </p>
      </header>

      <div className="flex flex-col gap-3 text-xs text-[var(--muted)]">
        <article className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
            Alertas activas
          </p>
          <p className="mt-1">
            Se evalua una ventana movil de {ANALYTICS_WINDOWS.alertWindowHours} horas.
            <span className="text-[var(--foreground)]"> LOW_BIKES</span> salta si la media de
            bicis disponibles baja de {ALERT_THRESHOLDS.lowBikes};
            <span className="text-[var(--foreground)]"> LOW_ANCHORS</span> si la media de
            anclajes libres baja de {ALERT_THRESHOLDS.lowAnchors}. Severidad 2 cuando la media
            cae por debajo de 2.
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
            Mas problematicas
          </p>
          <p className="mt-1">
            El ranking usa las ultimas {ANALYTICS_WINDOWS.rankingDays} jornadas. Horas problema =
            horas con bicis medias {'<='} 1 + horas con anclajes medios {'<='} 1. El porcentaje de
            problemas es horas problema / total de horas en la ventana.
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3">
          <p className="font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
            Ocupacion por hora
          </p>
          <p className="mt-1">
            Cada muestra calcula ocupacion como bicisDisponibles / capacidad. Luego se promedia por
            franja horaria con ponderacion por muestras para construir curvas (laborable/fin de
            semana) y heatmap (dia/hora).
          </p>
        </article>
      </div>
    </section>
  );
}
