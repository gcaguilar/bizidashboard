const PRIMARY_LINK_CLASS =
  'inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white';

const SECONDARY_LINK_CLASS =
  'inline-flex rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]';

type DataModeCardProps = {
  stationsCsvUrl: string;
  frictionCsvUrl: string;
  historyJsonUrl: string;
  historyCsvUrl: string;
  alertsCsvUrl: string;
  statusCsvUrl: string;
};

export function DataModeCard({
  stationsCsvUrl,
  frictionCsvUrl,
  historyJsonUrl,
  historyCsvUrl,
  alertsCsvUrl,
  statusCsvUrl,
}: DataModeCardProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Estado actual de estaciones</h3>
        <p className="text-sm text-[var(--muted)]">Descarga una foto actual del sistema con bicis, anclajes, capacidad y marca temporal.</p>
        <a href={stationsCsvUrl} className={`mt-auto ${PRIMARY_LINK_CLASS}`}>
          Exportar CSV
        </a>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Ranking de friccion</h3>
        <p className="text-sm text-[var(--muted)]">Exporta las estaciones con mas horas problema para revisar vacios, llenos y cuellos de botella.</p>
        <a href={frictionCsvUrl} className={`mt-auto ${PRIMARY_LINK_CLASS}`}>
          Exportar CSV
        </a>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Historico agregado</h3>
        <p className="text-sm text-[var(--muted)]">Accede al historico agregado de demanda, ocupacion y balance para analisis externo o auditoria.</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <a href={historyJsonUrl} className={PRIMARY_LINK_CLASS}>
            Abrir JSON
          </a>
          <a href={historyCsvUrl} className={SECONDARY_LINK_CLASS}>
            Descargar CSV
          </a>
        </div>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Alertas historicas</h3>
        <p className="text-sm text-[var(--muted)]">Exporta alertas activas y resueltas para revisar incidencia, severidad y ventana temporal.</p>
        <a href={alertsCsvUrl} className={`mt-auto ${PRIMARY_LINK_CLASS}`}>
          Exportar CSV
        </a>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Resumen del sistema</h3>
        <p className="text-sm text-[var(--muted)]">Descarga el estado del pipeline, la frescura de datos y la salud general del sistema en un CSV simple.</p>
        <a href={statusCsvUrl} className={`mt-auto ${PRIMARY_LINK_CLASS}`}>
          Exportar CSV
        </a>
      </article>
    </section>
  );
}
