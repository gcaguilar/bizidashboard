'use client';

import { Component, type ReactNode } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AlertsResponse } from '@/lib/api-types';
import { formatAlertType } from '@/lib/format';
import { appRoutes } from '@/lib/routes';

type AlertsTopListProps = {
  alerts: AlertsResponse;
  limit?: number;
};

function severityLabel(severity: number): string {
  return severity >= 2 ? 'critica' : 'media';
}

export function AlertsTopList({ alerts, limit = 5 }: AlertsTopListProps) {
  const activeAlerts = alerts.alerts.filter((alert) => alert.isActive).slice(0, limit);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary)]/8 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
          Alertas activas
        </h2>
        <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[11px] font-bold text-white">
          {activeAlerts.length}
        </span>
      </header>

      {activeAlerts.length === 0 ? (
        <div className="space-y-3 p-4">
          <p className="text-sm text-[var(--muted)]">No hay alertas activas en este momento.</p>
          <TrackedLink href={appRoutes.dashboardAlerts()} className="ui-inline-action">
            Ver historial de alertas
          </TrackedLink>
        </div>
      ) : (
        <ScrollArea className="max-h-[420px] flex-1 p-3">
          <ul className="space-y-2">
            {activeAlerts.map((alert) => {
              const isEmptyLike = alert.alertType === 'LOW_BIKES';
              const toneClass = isEmptyLike
                ? 'border-[var(--primary)]/30 bg-[var(--primary)]/8'
                : 'border-[var(--warning)]/30 bg-[var(--warning)]/10';

              return (
                <li
                  key={alert.id}
                  className={`rounded-lg border px-3 py-2 ${toneClass} shadow-[var(--shadow-soft)]`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      Estacion #{alert.stationId}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                      {isEmptyLike ? 'VACIA' : 'LLENA'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {formatAlertType(alert.alertType)} · severidad {severityLabel(alert.severity)} ·{' '}
                    {alert.windowHours}h
                  </p>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}

      <div className="border-t border-[var(--border)] bg-[var(--secondary)]/40 p-3">
        <Button asChild variant="cta" size="sm" className="w-full">
          <TrackedLink href={appRoutes.dashboardAlerts()}>Ver todas las alertas</TrackedLink>
        </Button>
      </div>
    </section>
  );
}

export class QuickViewErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
