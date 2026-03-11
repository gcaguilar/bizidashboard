import Link from 'next/link';

export function PredictionHooksCard() {
  return (
    <article className="dashboard-card">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Predicciones futuras</h3>
      <p className="text-sm text-[var(--muted)]">
        La estructura ya esta preparada para recibir un endpoint de predicciones con ocupacion estimada en +30 y +60 minutos sin rehacer la interfaz.
      </p>
      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-xs text-[var(--muted)]">
        <p><span className="font-semibold text-[var(--foreground)]">Endpoint previsto:</span> <code>/api/predictions?stationId=...</code></p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Horizontes:</span> T+30 min y T+60 min</p>
        <p className="mt-1"><span className="font-semibold text-[var(--foreground)]">Campos esperados:</span> bicis, anclajes y confianza</p>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Hoy este bloque ya expone un endpoint base, pero todavia no hay un modelo activo conectado en produccion.
      </p>
      <Link
        href="/dashboard/ayuda#prediccion-dashboard"
        className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
      >
        Ver contexto metodologico
      </Link>
    </article>
  );
}
