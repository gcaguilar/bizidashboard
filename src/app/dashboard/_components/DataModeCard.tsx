import { TrackedAnchor } from '@/app/_components/TrackedAnchor';
import { buildExportClickEvent } from '@/lib/umami';

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
        <TrackedAnchor
          href={stationsCsvUrl}
          trackingEvent={buildExportClickEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            source: 'data_mode',
            ctaId: 'stations_csv',
            entityType: 'api',
            module: 'data_mode_card',
          })}
          className={`mt-auto ${PRIMARY_LINK_CLASS}`}
        >
          Exportar CSV
        </TrackedAnchor>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Ranking de friccion</h3>
        <p className="text-sm text-[var(--muted)]">Exporta las estaciones con mas horas problema para revisar vacios, llenos y cuellos de botella.</p>
        <TrackedAnchor
          href={frictionCsvUrl}
          trackingEvent={buildExportClickEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            source: 'data_mode',
            ctaId: 'friction_csv',
            entityType: 'api',
            module: 'data_mode_card',
          })}
          className={`mt-auto ${PRIMARY_LINK_CLASS}`}
        >
          Exportar CSV
        </TrackedAnchor>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Historico agregado</h3>
        <p className="text-sm text-[var(--muted)]">Accede al historico agregado de demanda, ocupacion y balance para analisis externo o auditoria.</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <TrackedAnchor
            href={historyJsonUrl}
            trackingEvent={buildExportClickEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              source: 'data_mode',
              ctaId: 'history_json',
              entityType: 'api',
              module: 'data_mode_card',
            })}
            className={PRIMARY_LINK_CLASS}
          >
            Abrir JSON
          </TrackedAnchor>
          <TrackedAnchor
            href={historyCsvUrl}
            trackingEvent={buildExportClickEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_home',
              source: 'data_mode',
              ctaId: 'history_csv',
              entityType: 'api',
              module: 'data_mode_card',
            })}
            className={SECONDARY_LINK_CLASS}
          >
            Descargar CSV
          </TrackedAnchor>
        </div>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Alertas historicas</h3>
        <p className="text-sm text-[var(--muted)]">Exporta alertas activas y resueltas para revisar incidencia, severidad y ventana temporal.</p>
        <TrackedAnchor
          href={alertsCsvUrl}
          trackingEvent={buildExportClickEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            source: 'data_mode',
            ctaId: 'alerts_csv',
            entityType: 'api',
            module: 'data_mode_card',
          })}
          className={`mt-auto ${PRIMARY_LINK_CLASS}`}
        >
          Exportar CSV
        </TrackedAnchor>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Resumen del sistema</h3>
        <p className="text-sm text-[var(--muted)]">Descarga el estado del pipeline, la frescura de datos y la salud general del sistema en un CSV simple.</p>
        <TrackedAnchor
          href={statusCsvUrl}
          trackingEvent={buildExportClickEvent({
            surface: 'dashboard',
            routeKey: 'dashboard_home',
            source: 'data_mode',
            ctaId: 'status_csv',
            entityType: 'api',
            module: 'data_mode_card',
          })}
          className={`mt-auto ${PRIMARY_LINK_CLASS}`}
        >
          Exportar CSV
        </TrackedAnchor>
      </article>
    </section>
  );
}
