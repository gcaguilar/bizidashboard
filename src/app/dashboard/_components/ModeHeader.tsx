'use client';

import { useCallback, type KeyboardEvent } from 'react';
import { DASHBOARD_MODE_META, type DashboardViewMode } from '@/lib/dashboard-modes';

type ModeHeaderProps = {
  activeMode: DashboardViewMode;
  onChangeMode: (mode: DashboardViewMode) => void;
};

const MODE_OPTIONS: Array<{ id: DashboardViewMode; label: string; description: string }> = [
  { id: 'overview', label: DASHBOARD_MODE_META.overview.label, description: DASHBOARD_MODE_META.overview.description },
  { id: 'operations', label: DASHBOARD_MODE_META.operations.label, description: DASHBOARD_MODE_META.operations.description },
  { id: 'research', label: DASHBOARD_MODE_META.research.label, description: DASHBOARD_MODE_META.research.description },
  { id: 'data', label: DASHBOARD_MODE_META.data.label, description: DASHBOARD_MODE_META.data.description },
];

export function ModeHeader({ activeMode, onChangeMode }: ModeHeaderProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
        return;
      }

      event.preventDefault();

      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % MODE_OPTIONS.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + MODE_OPTIONS.length) % MODE_OPTIONS.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = MODE_OPTIONS.length - 1;
      }

      onChangeMode(MODE_OPTIONS[nextIndex].id);
    },
    [onChangeMode]
  );

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Modo de vista</p>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Panel multi-rol</h2>
          <p className="text-sm text-[var(--muted)]">Cambia entre vistas segun si quieres un resumen, operar, investigar o revisar metodologia.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Modos del dashboard">
          {MODE_OPTIONS.map((mode, index) => {
            const isActive = activeMode === mode.id;
            const tabId = `mode-tab-${mode.id}`;
            const panelId = `mode-panel-${mode.id}`;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeMode(mode.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
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
