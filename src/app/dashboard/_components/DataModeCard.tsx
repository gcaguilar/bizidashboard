type DataModeCardProps = {
  stationsCsvUrl: string;
  frictionCsvUrl: string;
  historyJsonUrl: string;
};

export function DataModeCard({ stationsCsvUrl, frictionCsvUrl, historyJsonUrl }: DataModeCardProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Estado actual de estaciones</h3>
        <p className="text-sm text-[var(--muted)]">Descarga una foto actual del sistema con bicis, anclajes, capacidad y marca temporal.</p>
        <a href={stationsCsvUrl} className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white">
          Exportar CSV
        </a>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Ranking de friccion</h3>
        <p className="text-sm text-[var(--muted)]">Exporta las estaciones con mas horas problema para revisar vacios, llenos y cuellos de botella.</p>
        <a href={frictionCsvUrl} className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white">
          Exportar CSV
        </a>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Historico agregado</h3>
        <p className="text-sm text-[var(--muted)]">Accede al historico agregado de demanda y ocupacion para analisis externo o auditoria.</p>
        <a href={historyJsonUrl} className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white">
          Abrir JSON
        </a>
      </article>
    </section>
  );
}
