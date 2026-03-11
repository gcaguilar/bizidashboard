import { ApiCatalogCard } from './ApiCatalogCard';
import Link from 'next/link';
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
      path: '/api/stations',
      format: 'JSON / CSV',
      description: 'Devuelve el estado actual de las estaciones con bicis, anclajes, capacidad y timestamp.',
    },
    {
      label: 'Salud del sistema',
      path: '/api/status',
      format: 'JSON / CSV',
      description: 'Resume la salud del pipeline, la frescura de los datos y el volumen reciente.',
    },
    {
      label: 'Movilidad agregada',
      path: '/api/mobility',
      format: 'JSON',
      description: 'Entrega curvas de demanda, señales horarias y, si existe, impacto del transporte publico.',
    },
    {
      label: 'Historico agregado',
      path: '/api/history',
      format: 'JSON / CSV',
      description: 'Ofrece demanda, ocupacion y balance diario para analisis y auditoria.',
    },
    {
      label: 'Alertas historicas',
      path: '/api/alerts/history',
      format: 'JSON / CSV',
      description: 'Sirve para estudiar incidencias activas y resueltas con filtros por estado y limite.',
    },
    {
      label: 'Predicciones base',
      path: '/api/predictions?stationId=101',
      format: 'JSON',
      description: 'Devuelve la estructura preparada para futuras predicciones a corto plazo por estacion.',
    },
  ];

  return (
    <section id="mode-panel-data" role="tabpanel" aria-labelledby="mode-tab-data" className="space-y-6">
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
        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Metodologia y origen</h3>
          <p className="text-sm text-[var(--muted)]">
            Los datos proceden del sistema GBFS de Bizi Zaragoza y del pipeline interno de agregacion para rankings, patrones y conclusiones.
          </p>
          <Link
            href="/dashboard/ayuda"
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Revisar metodologia
          </Link>
        </article>
        <PredictionHooksCard />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Estado del modo datos</p>
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Esta vista ya centraliza exportaciones, metodologia y trazabilidad. Los siguientes pasos del roadmap son conectar predicciones reales y ampliar descargas por periodo o modo.
        </p>
      </section>
    </section>
  );
}
