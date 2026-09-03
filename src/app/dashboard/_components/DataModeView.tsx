import { ApiCatalogCard } from './ApiCatalogCard';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { buildPanelOpenEvent } from '@/lib/umami';
import { DataHistoryCard } from './DataHistoryCard';
import { DataModeCard } from './DataModeCard';
import { MethodologyPanel } from './MethodologyPanel';
import { PredictionHooksCard } from './PredictionHooksCard';

type DataModeViewProps = {
  stationsCsvUrl: string;
  frictionCsvUrl: string;
  historyJsonUrl: string;
  historyCsvUrl: string;
  alertsCsvUrl: string;
  statusCsvUrl: string;
};

export function DataModeView({
  stationsCsvUrl,
  frictionCsvUrl,
  historyJsonUrl,
  historyCsvUrl,
  alertsCsvUrl,
  statusCsvUrl,
}: DataModeViewProps) {
  const apiItems = [
    {
      label: 'Estado actual de estaciones',
      path: appRoutes.api.stations(),
      format: 'JSON / CSV',
      description: 'Devuelve el estado actual de las estaciones: bicis, huecos, capacidad y hora de actualización.',
    },
    {
      label: 'Estado de los datos',
      path: appRoutes.api.status(),
      format: 'JSON / CSV',
      description: 'Indica si los datos se están actualizando bien, su cobertura y el volumen reciente.',
    },
    {
      label: 'Movilidad agregada',
      path: appRoutes.api.mobility(),
      format: 'JSON',
      description: 'Muestra actividad por hora y, si hay datos, su relación con el transporte público.',
    },
    {
      label: 'Histórico resumido',
      path: appRoutes.api.history(),
      format: 'JSON / CSV',
      description: 'Ofrece movimiento estimado, ocupación y equilibrio diario para análisis y revisión.',
    },
    {
      label: 'Histórico de alertas',
      path: appRoutes.api.alertsHistory(),
      format: 'JSON / CSV',
      description: 'Permite consultar incidencias activas y resueltas por estado y número de resultados.',
    },
    {
      label: 'Predicciones por estacion',
      path: appRoutes.api.predictions(),
      format: 'JSON',
      description: 'Calcula una estimación a corto plazo a partir del estado actual y los patrones por hora.',
    },
  ];

  return (
    <section className="space-y-6">
      <DataModeCard
        stationsCsvUrl={stationsCsvUrl}
        frictionCsvUrl={frictionCsvUrl}
        historyJsonUrl={historyJsonUrl}
        historyCsvUrl={historyCsvUrl}
        alertsCsvUrl={alertsCsvUrl}
        statusCsvUrl={statusCsvUrl}
      />
      <DataHistoryCard />
      <ApiCatalogCard items={apiItems} />
      <MethodologyPanel />
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="ui-section-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Origen y método</h3>
          <p className="text-sm text-[var(--muted)]">
            Los datos proceden del sistema oficial de Bizi Zaragoza y se resumen para crear listas, patrones y conclusiones.
          </p>
          <Button asChild variant="cta" size="sm" className="mt-auto">
            <TrackedLink
              href={appRoutes.dashboardHelp()}
              trackingEvent={buildPanelOpenEvent({
                surface: 'dashboard',
                routeKey: 'dashboard_home',
                module: 'help',
                source: 'data_mode',
              })}
            >
              Ver cómo se calculan
            </TrackedLink>
          </Button>
        </article>
        <PredictionHooksCard />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Estado del modo datos</p>
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Aquí puedes descargar datos, consultar cómo se calculan y revisar las previsiones. Algunas funciones necesitan suficiente histórico.
        </p>
      </section>
    </section>
  );
}
