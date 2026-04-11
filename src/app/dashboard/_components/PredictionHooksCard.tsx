import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { buildPanelOpenEvent } from '@/lib/umami';

export function PredictionHooksCard() {
  const predictionExamplePath = `${appRoutes.api.predictions().replace('101', '')}...`;

  return (
    <article className="dashboard-card">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Predicciones futuras</h3>
      <p className="text-sm text-[var(--muted)]">
        El endpoint de predicciones ya combina el estado actual con patrones historicos por franja horaria para estimar ocupacion en +30 y +60 minutos.
      </p>
      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-xs text-[var(--muted)]">
        <p><span className="font-semibold text-[var(--foreground)]">Endpoint activo:</span> <code>{predictionExamplePath}</code></p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Horizontes:</span> T+30 min y T+60 min</p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Modelo:</span> baseline historico con confianza por cobertura muestral</p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Campos:</span> bicis, anclajes y confianza</p>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Es un primer modelo interpretable pensado para exponer una senal util sin introducir infraestructura extra de ML en esta fase.
      </p>
      <TrackedLink
        href={appRoutes.dashboardHelp('prediccion-dashboard')}
        trackingEvent={buildPanelOpenEvent({
          surface: 'dashboard',
          routeKey: 'dashboard_home',
          module: 'prediction_help',
          source: 'prediction_hooks',
        })}
        className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
      >
        Ver contexto metodologico
      </TrackedLink>
    </article>
  );
}
