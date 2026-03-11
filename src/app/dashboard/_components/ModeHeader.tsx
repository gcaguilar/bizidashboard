'use client';

import type { DashboardViewMode } from '@/lib/dashboard-modes';

type ModeHeaderProps = {
  activeMode: DashboardViewMode;
  onChangeMode: (mode: DashboardViewMode) => void;
};

const MODE_OPTIONS: Array<{ id: DashboardViewMode; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Vision ejecutiva y estado global' },
  { id: 'operations', label: 'Operations', description: 'Friccion, alertas y accion operativa' },
  { id: 'research', label: 'Research', description: 'Patrones, demanda y flujo urbano' },
  { id: 'data', label: 'Data', description: 'Metodologia, trazabilidad y acceso' },
];

export function ModeHeader({ activeMode, onChangeMode }: ModeHeaderProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">View mode</p>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Panel multi-rol</h2>
          <p className="text-sm text-[var(--muted)]">Cambia entre vistas segun si quieres un resumen, operar, investigar o revisar metodologia.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Modos del dashboard">
          {MODE_OPTIONS.map((mode) => {
            const isActive = activeMode === mode.id;
            const tabId = `mode-tab-${mode.id}`;
            const panelId = `mode-panel-${mode.id}`;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeMode(mode.id)}
                role="tab"
                id={tabId}
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[var(--shadow-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]/35 hover:bg-[var(--surface)]'
                }`}
              >
                <p className={`text-sm font-bold ${isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>{mode.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{mode.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
