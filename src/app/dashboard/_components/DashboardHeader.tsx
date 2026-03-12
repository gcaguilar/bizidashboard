'use client';

import Link from 'next/link';
import { DashboardRouteLinks } from './DashboardRouteLinks';
import { GitHubRepoButton } from './GitHubRepoButton';
import { ThemeToggleButton } from './ThemeToggleButton';

type TimeWindowOption = {
  id: string;
  label: string;
};

type DashboardHeaderProps = {
  timeWindows: TimeWindowOption[];
  activeWindowId: string;
  onChangeWindow: (windowId: string) => void;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  onlyWithBikes: boolean;
  onlyWithAnchors: boolean;
  onToggleOnlyWithBikes: (value: boolean) => void;
  onToggleOnlyWithAnchors: (value: boolean) => void;
  filteredStationsCount: number;
  totalStationsCount: number;
  filteredOutCount: number;
  favoriteCount: number;
  activeAlertsCount: number;
  activeWindowLabel: string;
  isMobilityPreviewLoading: boolean;
  isRefreshingData: boolean;
  nearestMessage: string;
  onUseGeolocation: () => void;
  canUseGeolocation: boolean;
  onJumpToNearest: () => void;
  canJumpToNearest: boolean;
  refreshCountdownLabel: string;
  refreshProgress: number;
};

export function DashboardHeader({
  timeWindows,
  activeWindowId,
  onChangeWindow,
  searchQuery,
  onChangeSearch,
  onlyWithBikes,
  onlyWithAnchors,
  onToggleOnlyWithBikes,
  onToggleOnlyWithAnchors,
  filteredStationsCount,
  totalStationsCount,
  filteredOutCount,
  favoriteCount,
  activeAlertsCount,
  activeWindowLabel,
  isMobilityPreviewLoading,
  isRefreshingData,
  nearestMessage,
  onUseGeolocation,
  canUseGeolocation,
  onJumpToNearest,
  canJumpToNearest,
  refreshCountdownLabel,
  refreshProgress,
}: DashboardHeaderProps) {
  const hasAvailabilityFilter = filteredOutCount > 0;

  return (
    <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <div className="flex items-center gap-3 text-[var(--accent)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
              B
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Bizi Zaragoza</h1>
          </div>

          <div className="hidden items-center gap-2 rounded-lg bg-[var(--accent)]/10 p-1 lg:flex">
            {timeWindows.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => onChangeWindow(window.id)}
                aria-pressed={activeWindowId === window.id}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  activeWindowId === window.id
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:bg-[var(--accent)]/10 hover:text-[var(--foreground)]'
                }`}
              >
                {window.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <Link href="/dashboard/conclusiones" className="icon-button hidden sm:inline-flex">
            Conclusiones
          </Link>
          <Link href="/dashboard/ayuda" className="icon-button hidden sm:inline-flex">
            Ayuda
          </Link>
          <ThemeToggleButton />
          <GitHubRepoButton />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-[var(--border)]/70 pt-3">
        <DashboardRouteLinks
          activeRoute="dashboard"
          routes={['stations', 'flow', 'conclusions', 'help']}
          variant="chips"
          className="flex flex-wrap items-center gap-2 sm:hidden"
        />

        <label htmlFor="dashboard-search" className="flex min-h-11 w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm">
          <span className="sr-only">Buscar estacion, identificador o barrio</span>
          <input
            id="dashboard-search"
            type="text"
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Buscar estacion, ID o barrio..."
            value={searchQuery}
            onChange={(event) => onChangeSearch(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1.5">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={onlyWithBikes}
              onChange={(event) => onToggleOnlyWithBikes(event.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            Solo con bicis
          </label>

          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={onlyWithAnchors}
              onChange={(event) => onToggleOnlyWithAnchors(event.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            Solo con huecos
          </label>
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-[var(--muted)]">
          <p>
            Estaciones: {filteredStationsCount}/{totalStationsCount}
            {hasAvailabilityFilter ? ` (filtradas ${filteredOutCount})` : ''} · Favoritas: {favoriteCount} · Alertas activas: {activeAlertsCount} · Ventana: {activeWindowLabel}
            {isMobilityPreviewLoading ? ' (actualizando flujo...)' : ''}
          </p>
          <p>{isRefreshingData ? 'Refrescando datos del sistema ahora...' : 'Resumen operativo disponible justo debajo.'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--accent)]/10 p-1 lg:hidden">
          {timeWindows.map((window) => (
            <button
              key={window.id}
              type="button"
              onClick={() => onChangeWindow(window.id)}
              aria-pressed={activeWindowId === window.id}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeWindowId === window.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {window.label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
          <p className="text-xs text-[var(--foreground)]">{nearestMessage}</p>

          {canJumpToNearest ? (
            <button
              type="button"
              onClick={onJumpToNearest}
              className="rounded-lg border border-[var(--accent)] px-2 py-1 text-[11px] font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            >
              Ir a la mas cercana
            </button>
          ) : canUseGeolocation ? (
            <button
              type="button"
              onClick={onUseGeolocation}
              className="rounded-lg border border-[var(--accent)] px-2 py-1 text-[11px] font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            >
              Usar mi ubicacion
            </button>
          ) : null}
        </div>

        <div className="w-full">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>Proxima actualizacion automatica en menos de 30 min</span>
            <span>{isRefreshingData ? 'actualizando...' : `siguiente en ${refreshCountdownLabel}`}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
              style={{ width: `${Math.max(0, Math.min(100, refreshProgress))}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
