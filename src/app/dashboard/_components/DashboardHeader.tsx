'use client';

import { CitySwitcher } from '@/app/_components/CitySwitcher';
import { FeedbackCta } from '@/app/_components/FeedbackCta';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { PageHeaderCard } from '@/components/layout/page-header-card';
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
  datasetSummaryLabel: string;
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
  datasetSummaryLabel,
  onUseGeolocation,
  canUseGeolocation,
  onJumpToNearest,
  canJumpToNearest,
  refreshCountdownLabel,
  refreshProgress,
}: DashboardHeaderProps) {
  const hasAvailabilityFilter = filteredOutCount > 0;

  return (
    <PageHeaderCard>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <div className="flex items-center gap-3 text-[var(--primary)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white">
              B
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Bizi Zaragoza</h1>
          </div>

          <div className="hidden xl:block">
            <CitySwitcher compact className="min-w-[320px]" />
          </div>

          <div className="hidden items-center gap-2 rounded-lg bg-[var(--primary)]/10 p-1 lg:flex">
            {timeWindows.map((window) => (
              <Button
                key={window.id}
                onClick={() => onChangeWindow(window.id)}
                aria-pressed={activeWindowId === window.id}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                  activeWindowId === window.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--foreground)]'
                }`}
                variant="ghost"
                size="sm"
              >
                {window.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <FeedbackCta
            source="dashboard_header"
            ctaId="feedback_header_open"
            module="dashboard_header"
            className="ui-icon-button hidden sm:inline-flex"
            pendingClassName="ui-icon-button hidden cursor-not-allowed opacity-70 sm:inline-flex"
          >
            Feedback
          </FeedbackCta>
          <ThemeToggleButton />
          <GitHubRepoButton />
        </div>
      </div>

      <div className="mt-3 xl:hidden">
        <CitySwitcher compact />
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-[var(--border)]/70 pt-3">
        <DashboardRouteLinks
          activeRoute="dashboard"
          routes={['stations', 'flow', 'conclusions', 'help']}
          variant="chips"
          className="flex flex-wrap items-center gap-2 sm:hidden"
        />

        <div className="w-full">
          <label htmlFor="dashboard-search" className="sr-only">
            Buscar estacion, identificador o barrio
          </label>
          <Input
            id="dashboard-search"
            type="text"
            className="min-h-11 border-[var(--border)] bg-[var(--secondary)] py-2"
            placeholder="Buscar estacion, ID o barrio..."
            value={searchQuery}
            onChange={(event) => onChangeSearch(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2 py-1.5">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]">
            <Checkbox
              checked={onlyWithBikes}
              onChange={(event) => onToggleOnlyWithBikes(event.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            Solo con bicis
          </label>

          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]">
            <Checkbox
              checked={onlyWithAnchors}
              onChange={(event) => onToggleOnlyWithAnchors(event.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
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
          <p>{datasetSummaryLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--primary)]/10 p-1 lg:hidden">
          {timeWindows.map((window) => (
            <Button
              key={window.id}
              onClick={() => onChangeWindow(window.id)}
              aria-pressed={activeWindowId === window.id}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeWindowId === window.id ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              variant="ghost"
              size="sm"
            >
              {window.label}
            </Button>
          ))}
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2">
          <p className="text-xs text-[var(--foreground)]">{nearestMessage}</p>

          {canJumpToNearest ? (
            <Button
              onClick={onJumpToNearest}
              className="rounded-lg border border-[var(--primary)] px-2 py-1 text-[11px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
              variant="ghost"
              size="sm"
            >
              Ir a la mas cercana
            </Button>
          ) : canUseGeolocation ? (
            <Button
              onClick={onUseGeolocation}
              className="rounded-lg border border-[var(--primary)] px-2 py-1 text-[11px] font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
              variant="ghost"
              size="sm"
            >
              Usar mi ubicacion
            </Button>
          ) : null}
        </div>

        <div className="w-full">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>Proxima actualizacion automatica en menos de 2 min</span>
            <span>{isRefreshingData ? 'actualizando...' : `siguiente en ${refreshCountdownLabel}`}</span>
          </div>
          <Progress
            className="bg-black/15"
            value={Math.max(0, Math.min(100, refreshProgress))}
            indicatorClassName="bg-[var(--primary)] duration-500"
          />
        </div>
      </div>
    </PageHeaderCard>
  );
}
