import type { AlertsResponse } from '@/lib/api';

type AlertsPanelProps = {
  alerts: AlertsResponse;
};

function formatAlertType(value: string): string {
  return value.replaceAll('_', ' ').toLowerCase();
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const topAlerts = alerts.alerts.slice(0, 4);

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
          {alerts.alerts.length} alertas
        </span>
      </header>

      {topAlerts.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Sin alertas activas.</p>
      ) : (
        <ul className="flex flex-col gap-3 text-sm">
          {topAlerts.map((alert) => (
            <li
              key={alert.id}
              className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-4 py-3"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {formatAlertType(String(alert.alertType))}
              </p>
              <p className="font-semibold text-[var(--foreground)]">
                Estacion {alert.stationId}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Severidad {alert.severity} · Valor {alert.metricValue.toFixed(1)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
