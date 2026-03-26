'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CitySwitcher } from '@/app/_components/CitySwitcher';
import type { StationSnapshot } from '@/lib/api';
import { formatAlertType } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { DashboardRouteLinks } from '../../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../../_components/GitHubRepoButton';
import { ThemeToggleButton } from '../../_components/ThemeToggleButton';

const PAGE_SIZE = 100;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type AlertTypeFilter = 'all' | 'LOW_BIKES' | 'LOW_ANCHORS';
type AlertStateFilter = 'all' | 'active' | 'resolved';
type SeverityFilter = 'all' | '1' | '2';

type AlertHistoryRow = {
  id: number;
  stationId: string;
  stationName: string;
  alertType: string;
  severity: number;
  metricValue: number;
  windowHours: number;
  generatedAt: string;
  isActive: boolean;
};

type AlertsHistoryApiResponse = {
  pagination?: {
    total?: number;
    limit?: number;
    offset?: number;
    returned?: number;
  };
  alerts?: AlertHistoryRow[];
};

type AlertsHistoryClientProps = {
  stations: StationSnapshot[];
};

type ViewFilterState = {
  stationId: string;
  alertType: AlertTypeFilter;
  stateFilter: AlertStateFilter;
  severityFilter: SeverityFilter;
  fromDate: string;
  toDate: string;
  page: number;
};

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('es-ES');
}

function parseAlertTypeFilter(value: string | null): AlertTypeFilter {
  if (value === 'LOW_BIKES' || value === 'LOW_ANCHORS') {
    return value;
  }

  return 'all';
}

function parseStateFilter(value: string | null): AlertStateFilter {
  if (value === 'active' || value === 'resolved') {
    return value;
  }

  return 'all';
}

function parseSeverityFilter(value: string | null): SeverityFilter {
  if (value === '1' || value === '2') {
    return value;
  }

  return 'all';
}

function parseDateInput(value: string | null): string {
  if (!value || !DATE_INPUT_PATTERN.test(value)) {
    return '';
  }

  return value;
}

function parsePageIndex(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 0;
  }

  return parsed - 1;
}

function toLocalDateInputValue(date: Date): string {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}

function getRangeForLastDays(days: number): { fromDate: string; toDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(days - 1, 0));

  return {
    fromDate: toLocalDateInputValue(start),
    toDate: toLocalDateInputValue(end),
  };
}

function parseViewStateFromSearchParams(
  params: URLSearchParams,
  stations: StationSnapshot[]
): ViewFilterState {
  const stationIdCandidate = (params.get('stationId') ?? '').trim();
  const hasStation = stations.some((station) => station.id === stationIdCandidate);

  return {
    stationId: stationIdCandidate && hasStation ? stationIdCandidate : '',
    alertType: parseAlertTypeFilter(params.get('alertType')),
    stateFilter: parseStateFilter(params.get('state')),
    severityFilter: parseSeverityFilter(params.get('severity')),
    fromDate: parseDateInput(params.get('from')),
    toDate: parseDateInput(params.get('to')),
    page: parsePageIndex(params.get('page')),
  };
}

function buildViewQueryFromState(state: ViewFilterState): string {
  const params = new URLSearchParams();

  if (state.stationId) {
    params.set('stationId', state.stationId);
  }

  if (state.alertType !== 'all') {
    params.set('alertType', state.alertType);
  }

  if (state.stateFilter !== 'all') {
    params.set('state', state.stateFilter);
  }

  if (state.severityFilter !== 'all') {
    params.set('severity', state.severityFilter);
  }

  if (state.fromDate) {
    params.set('from', state.fromDate);
  }

  if (state.toDate) {
    params.set('to', state.toDate);
  }

  if (state.page > 0) {
    params.set('page', String(state.page + 1));
  }

  return params.toString();
}

export function AlertsHistoryClient({ stations }: AlertsHistoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stationId, setStationId] = useState('');
  const [alertType, setAlertType] = useState<AlertTypeFilter>('all');
  const [stateFilter, setStateFilter] = useState<AlertStateFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [isUrlReady, setIsUrlReady] = useState(false);
  const [rows, setRows] = useState<AlertHistoryRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    if (stationId) {
      params.set('stationId', stationId);
    }

    if (alertType !== 'all') {
      params.set('alertType', alertType);
    }

    if (stateFilter !== 'all') {
      params.set('state', stateFilter);
    }

    if (severityFilter !== 'all') {
      params.set('severity', severityFilter);
    }

    if (fromDate) {
      params.set('from', `${fromDate}T00:00:00.000Z`);
    }

    if (toDate) {
      params.set('to', `${toDate}T23:59:59.999Z`);
    }

    return params.toString();
  }, [alertType, fromDate, page, severityFilter, stateFilter, stationId, toDate]);

  const viewQueryString = useMemo(
    () =>
      buildViewQueryFromState({
        stationId,
        alertType,
        stateFilter,
        severityFilter,
        fromDate,
        toDate,
        page,
      }),
    [alertType, fromDate, page, severityFilter, stateFilter, stationId, toDate]
  );

  useEffect(() => {
    const parsedState = parseViewStateFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      stations
    );

    setStationId((current) => (current === parsedState.stationId ? current : parsedState.stationId));
    setAlertType((current) => (current === parsedState.alertType ? current : parsedState.alertType));
    setStateFilter((current) => (current === parsedState.stateFilter ? current : parsedState.stateFilter));
    setSeverityFilter((current) =>
      current === parsedState.severityFilter ? current : parsedState.severityFilter
    );
    setFromDate((current) => (current === parsedState.fromDate ? current : parsedState.fromDate));
    setToDate((current) => (current === parsedState.toDate ? current : parsedState.toDate));
    setPage((current) => (current === parsedState.page ? current : parsedState.page));
    setIsUrlReady(true);
  }, [searchParams, stations]);

  useEffect(() => {
    if (!isUrlReady) {
      return;
    }

    const currentViewQuery = buildViewQueryFromState(
      parseViewStateFromSearchParams(new URLSearchParams(window.location.search), stations)
    );

    if (currentViewQuery === viewQueryString) {
      return;
    }

    const nextUrl = viewQueryString.length > 0 ? `${pathname}?${viewQueryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [isUrlReady, pathname, router, stations, viewQueryString]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadHistory = async () => {
      try {
        if (isActive) {
          setIsLoading(true);
          setErrorMessage(null);
        }

        const response = await fetch(`${appRoutes.api.alertsHistory()}?${apiQueryString}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el historial de alertas.');
        }

        const payload = (await response.json()) as AlertsHistoryApiResponse;

        if (!isActive) {
          return;
        }

        setRows(Array.isArray(payload.alerts) ? payload.alerts : []);
        setTotalRows(Number(payload.pagination?.total ?? 0));
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.alerts-history',
          operation: 'loadHistory',
          extra: {
            query: apiQueryString,
          },
        });
        console.error('[Dashboard] Error cargando historial de alertas.', error);

        if (isActive) {
          setRows([]);
          setTotalRows(0);
          setErrorMessage('No se pudo cargar el historial de alertas.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [apiQueryString]);

  const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const hasNextPage = page + 1 < pageCount;
  const hasPreviousPage = page > 0;

  const stats = useMemo(() => {
    const active = rows.filter((row) => row.isActive).length;
    const critical = rows.filter((row) => row.severity >= 2).length;

    return {
      active,
      critical,
    };
  }, [rows]);

  const downloadCsvHref = useMemo(() => {
    const params = new URLSearchParams(apiQueryString);
    params.set('offset', '0');
    params.set('limit', '2000');
    params.set('format', 'csv');
    return `${appRoutes.api.alertsHistory()}?${params.toString()}`;
  }, [apiQueryString]);

  const activeQuickRange = useMemo(() => {
    if (!fromDate || !toDate) {
      return null;
    }

    const today = getRangeForLastDays(1);
    const last7Days = getRangeForLastDays(7);
    const last30Days = getRangeForLastDays(30);

    if (fromDate === today.fromDate && toDate === today.toDate) {
      return 'today';
    }

    if (fromDate === last7Days.fromDate && toDate === last7Days.toDate) {
      return 'last7';
    }

    if (fromDate === last30Days.fromDate && toDate === last30Days.toDate) {
      return 'last30';
    }

    return null;
  }, [fromDate, toDate]);

  const hasActiveFilters =
    stationId.length > 0 ||
    alertType !== 'all' ||
    stateFilter !== 'all' ||
    severityFilter !== 'all' ||
    fromDate.length > 0 ||
    toDate.length > 0 ||
    page > 0;

  const applyQuickRange = (days: number) => {
    const range = getRangeForLastDays(days);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setPage(0);
  };

  const clearFilters = () => {
    setStationId('');
    setAlertType('all');
    setStateFilter('all');
    setSeverityFilter('all');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Historial de alertas</h1>
            </div>
            <DashboardRouteLinks
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardRouteLinks
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <Link href={appRoutes.dashboard()} className="icon-button" aria-label="Volver al dashboard">
              Inicio
            </Link>
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>

        <CitySwitcher compact className="mt-3" />

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <select
            value={stationId}
            onChange={(event) => {
              setStationId(event.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="">Todas las estaciones</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>

          <select
            value={alertType}
            onChange={(event) => {
              setAlertType(event.target.value as AlertTypeFilter);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="all">Todos los tipos</option>
            <option value="LOW_BIKES">Pocas bicis</option>
            <option value="LOW_ANCHORS">Pocos anclajes</option>
          </select>

          <select
            value={stateFilter}
            onChange={(event) => {
              setStateFilter(event.target.value as AlertStateFilter);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="resolved">Resueltas</option>
          </select>

          <select
            value={severityFilter}
            onChange={(event) => {
              setSeverityFilter(event.target.value as SeverityFilter);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            <option value="all">Todas las severidades</option>
            <option value="1">Media</option>
            <option value="2">Critica</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Rangos rapidos
          </span>
          <button
            type="button"
            onClick={() => applyQuickRange(1)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeQuickRange === 'today'
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => applyQuickRange(7)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeQuickRange === 'last7'
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]'
            }`}
          >
            7 dias
          </button>
          <button
            type="button"
            onClick={() => applyQuickRange(30)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeQuickRange === 'last30'
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]'
            }`}
          >
            30 dias
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar filtros
          </button>

          <span className="ml-auto text-xs text-[var(--muted)]">La URL refleja los filtros actuales.</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Total filtrado</p>
          <p className="stat-value">{totalRows}</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Activas (pagina)</p>
          <p className="stat-value">{stats.active}</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Criticas (pagina)</p>
          <p className="stat-value">{stats.critical}</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Exportacion</p>
          <a
            href={downloadCsvHref}
            className="inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Descargar CSV
          </a>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Registros de alertas</p>
          <p className="text-xs text-[var(--muted)]">
            Pagina {page + 1}/{pageCount} · {rows.length} filas
          </p>
        </header>

        {isLoading ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">Cargando historial...</p>
        ) : errorMessage ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">{errorMessage}</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">No hay alertas para los filtros actuales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estacion</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Severidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Ventana</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]">
                      {formatDateTime(row.generatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{row.stationName}</p>
                      <p className="text-xs text-[var(--muted)]">{row.stationId}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatAlertType(row.alertType)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
                          row.severity >= 2
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {row.severity >= 2 ? 'Critica' : 'Media'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
                          row.isActive
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-slate-500/15 text-slate-300'
                        }`}
                      >
                        {row.isActive ? 'Activa' : 'Resuelta'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{row.metricValue.toFixed(1)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]">
                      {row.windowHours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
          <p className="text-xs text-[var(--muted)]">Muestra de {PAGE_SIZE} filas por pagina</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => hasPreviousPage && setPage((current) => current - 1)}
              disabled={!hasPreviousPage || isLoading}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => hasNextPage && setPage((current) => current + 1)}
              disabled={!hasNextPage || isLoading}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
