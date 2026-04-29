import { TrackedAnchor } from '@/app/_components/TrackedAnchor';
import { Button } from '@/components/ui/button';
import { buildExportClickEvent } from '@/lib/umami';

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
      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Estado actual de estaciones</h3>
        <p className="text-sm text-[var(--muted)]">Descarga una foto actual del sistema con bicis, anclajes, capacidad y marca temporal.</p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
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
          >
            Exportar CSV
          </TrackedAnchor>
        </Button>
      </article>

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Ranking de friccion</h3>
        <p className="text-sm text-[var(--muted)]">Exporta las estaciones con mas horas problema para revisar vacios, llenos y cuellos de botella.</p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
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
          >
            Exportar CSV
          </TrackedAnchor>
        </Button>
      </article>

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Historico agregado</h3>
        <p className="text-sm text-[var(--muted)]">Accede al historico agregado de demanda, ocupacion y balance para analisis externo o auditoria.</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button asChild variant="cta" size="sm">
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
            >
              Abrir JSON
            </TrackedAnchor>
          </Button>
          <Button asChild variant="outline" size="sm">
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
            >
              Descargar CSV
            </TrackedAnchor>
          </Button>
        </div>
      </article>

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Alertas historicas</h3>
        <p className="text-sm text-[var(--muted)]">Exporta alertas activas y resueltas para revisar incidencia, severidad y ventana temporal.</p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
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
          >
            Exportar CSV
          </TrackedAnchor>
        </Button>
      </article>

      <article className="ui-section-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Resumen del sistema</h3>
        <p className="text-sm text-[var(--muted)]">Descarga el estado del pipeline, la frescura de datos y la salud general del sistema en un CSV simple.</p>
        <Button asChild variant="cta" size="sm" className="mt-auto">
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
          >
            Exportar CSV
          </TrackedAnchor>
        </Button>
      </article>
    </section>
  );
}
