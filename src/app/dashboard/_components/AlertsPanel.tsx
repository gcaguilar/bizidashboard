import type { AlertsResponse, StationSnapshot } from '@/lib/api';
import { formatAlertType } from '@/lib/format';

type AlertsPanelProps = {
  alerts: AlertsResponse;
  stations?: StationSnapshot[];
};

export function AlertsPanel({ alerts, stations }: AlertsPanelProps) {
  const activeAlerts = alerts.alerts.filter((alert) => alert.isActive);
  const stationMap = new Map(
    stations?.map((station) => [station.id, station.name]) ?? []
  );

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Alertas activas
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Umbrales de disponibilidad en las ultimas horas.
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {activeAlerts.length} alertas
        </span>
      </header>

      {activeAlerts.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Sin alertas activas.</p>
      ) : (
        <ul className="flex flex-col gap-3 text-sm">
          {activeAlerts.map((alert) => {
            const stationName = stationMap.get(alert.stationId);
            return (
              <li
                key={alert.id}
                className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {formatAlertType(alert.alertType)}
                </p>
                <p className="font-semibold text-[var(--foreground)]">
                  {stationName ? stationName : `Estacion ${alert.stationId}`}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Severidad {alert.severity} · Valor {alert.metricValue.toFixed(1)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Ventana: {alert.windowHours} h
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
