import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { buildPanelOpenEvent } from '@/lib/umami';
import { MetricEvidence } from '@/app/_components/MetricEvidence';

export function PredictionHooksCard() {
  const predictionExamplePath = `${String(appRoutes.api.predictions()).replace('101', '')}...`;

  return (
    <article className="ui-section-card">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Predicciones futuras</h3>
      <p className="text-sm text-[var(--muted)]">
        Las predicciones combinan el estado actual con patrones históricos por franja horaria para estimar la ocupación dentro de 30 y 60 minutos.
      </p>
      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-xs text-[var(--muted)]">
        <p><span className="font-semibold text-[var(--foreground)]">Endpoint activo:</span> <code>{predictionExamplePath}</code></p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Horizontes:</span> T+30 min y T+60 min</p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Modelo:</span> referencia histórica con confianza según la cobertura</p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Campos:</span> bicis, anclajes y confianza</p>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Es un modelo inicial e interpretable: ofrece una señal útil sin afirmar que el resultado sea seguro.
      </p>
      <MetricEvidence type="predicción" coverage="muestras históricas de la estación" window="+30 y +60 minutos" limitation="Es una señal orientativa, no una certeza de disponibilidad." />
      <Button asChild variant="cta" size="sm" className="mt-auto">
        <TrackedLink
          href={appRoutes.dashboardHelp('prediccion-dashboard')}
          trackingEvent={buildPanelOpenEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            module: 'prediction_help',
            source: 'prediction_hooks',
          })}
        >
          Ver contexto metodologico
        </TrackedLink>
      </Button>
    </article>
  );
}
