import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AlertsResponse, StationSnapshot } from '@/lib/api';
import { formatAlertType } from '@/lib/format';
import { appRoutes } from '@/lib/routes';

type AlertsPanelProps = {
  alerts: AlertsResponse;
  stations?: StationSnapshot[];
  density?: 'normal' | 'compact';
};

function severityLabel(severity: number): string {
  return severity >= 2 ? 'critica' : 'media';
}

export function AlertsPanel({ alerts, stations, density = 'normal' }: AlertsPanelProps) {
  const activeAlerts = alerts.alerts.filter((alert) => alert.isActive);
  const stationMap = new Map(stations?.map((station) => [station.id, station]) ?? []);
  const compact = density === 'compact';

  return (
    <section className="h-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
      <header className={`flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)]/8 px-4 ${compact ? 'py-3' : 'py-4'}`}>
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
          Estaciones criticas
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--primary)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
            {activeAlerts.length} accion requerida
          </span>
          <Link
            href={appRoutes.dashboardAlerts()}
            className="rounded-full border border-[var(--primary)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
          >
            Historial
          </Link>
        </div>
      </header>

      {activeAlerts.length === 0 ? (
        <div className="space-y-3 p-4">
          <p className="text-sm text-[var(--muted)]">No hay alertas activas en este momento.</p>
          <Link
            href={appRoutes.dashboardAlerts()}
            className="w-full rounded-lg border border-[var(--primary)] px-3 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
          >
            Ver historial de alertas
          </Link>
        </div>
      ) : (
        <ScrollArea className={`max-h-[500px] p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
          <ul className={compact ? 'space-y-2' : 'space-y-3'}>
            {activeAlerts.map((alert) => {
            const station = stationMap.get(alert.stationId);
            const stationName = station?.name ?? `Estacion ${alert.stationId}`;
            const occupancy =
              station && station.capacity > 0 ? (station.bikesAvailable / station.capacity) * 100 : 0;
            const isEmptyLike = alert.alertType === 'LOW_BIKES';
            const progressValue = Math.max(0, Math.min(100, occupancy));
            const toneClass = isEmptyLike
              ? 'border-[var(--primary)]/30 bg-[var(--primary)]/8'
              : 'border-amber-500/30 bg-amber-500/10';

            return (
              <li
                key={alert.id}
                className={`rounded-lg border px-3 py-3 ${toneClass} shadow-[var(--shadow-soft)]`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">{stationName}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      #{alert.stationId} · {formatAlertType(alert.alertType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--primary)] animate-pulse" aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                      {isEmptyLike ? 'VACIA' : 'LLENA'}
                    </span>
                  </div>
                </div>

                <Progress
                  className="bg-black/20"
                  value={progressValue}
                  indicatorClassName={isEmptyLike ? 'bg-[var(--primary)]' : 'bg-amber-400'}
                />

                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>{severityLabel(alert.severity)}</span>
                  <span>{isEmptyLike ? 'Vacia' : 'Llena'} desde aprox. {alert.windowHours}h</span>
                  <span>Valor {alert.metricValue.toFixed(1)}</span>
                </div>
                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  {isEmptyLike
                    ? 'Poca bici disponible de forma sostenida en la ventana reciente.'
                    : 'Pocos anclajes libres de forma sostenida en la ventana reciente.'}
                </p>
              </li>
            );
            })}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
