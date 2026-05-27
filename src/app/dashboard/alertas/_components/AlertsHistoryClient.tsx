'use client';

import { useLocation, useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StationSnapshot } from '@/lib/api-types';
import { formatAlertType } from '@/lib/format';
import { formatStatusDateTime } from '@/lib/system-status';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { fetchJson, useAbortableAsyncEffect } from '@/app/dashboard/_components/useAbortableAsyncEffect';
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';
import { getLocationSearchParams } from '@/lib/router-search';
import {
  buildDashboardAlertsViewQuery,
  parseDashboardAlertsSearch,
  type DashboardAlertsViewState,
} from '@/lib/dashboard-alerts-search';

// Dashboard sections contract: dashboard, stations, flow, conclusions, redistribucion, help.

const PAGE_SIZE = 100;
const ALL_STATIONS_VALUE = '__all_stations__';

type AlertTypeFilter = DashboardAlertsViewState['alertType'];
type AlertStateFilter = DashboardAlertsViewState['stateFilter'];
type SeverityFilter = DashboardAlertsViewState['severityFilter'];

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

function formatDateTime(value: string): string {
  return formatStatusDateTime(value);
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
): DashboardAlertsViewState {
  const parsed = parseDashboardAlertsSearch(params);
  const stationIdCandidate = parsed.stationId;
  const hasStation =
    Boolean(stationIdCandidate) &&
    (stations.length === 0 || stations.some((station) => station.id === stationIdCandidate));

  return {
    ...parsed,
    stationId: hasStation ? stationIdCandidate : '',
  };
}

export function AlertsHistoryClient({ stations }: AlertsHistoryClientProps) {
  const router = useRouter();
  const location = useLocation();
  const pathname = location.pathname;
  const searchParams = useMemo(() => getLocationSearchParams(location), [location]);

  const [stationId, setStationId] = useState('');
  const [alertType, setAlertType] = useState<AlertTypeFilter>('all');
  const [stateFilter, setStateFilter] = useState<AlertStateFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [isUrlReady, setIsUrlReady] = useState(false);
  const lastSyncedUrlRef = useRef<string | null>(null);
  const prevStationsLengthRef = useRef(-1);
  const [rows, setRows] = useState<AlertHistoryRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

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
      buildDashboardAlertsViewQuery({
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
    const serialized = searchParams.toString();
    const urlChanged = lastSyncedUrlRef.current === null || serialized !== lastSyncedUrlRef.current;
    const stationsJustHydrated =
      prevStationsLengthRef.current === 0 && stations.length > 0 && !urlChanged;

    if (!urlChanged && !stationsJustHydrated) {
      prevStationsLengthRef.current = stations.length;
       
      setIsUrlReady(true);
      return;
    }

    const nextParsedState = parseViewStateFromSearchParams(
      new URLSearchParams(serialized),
      stations
    );

    setStationId(nextParsedState.stationId);
    setAlertType(nextParsedState.alertType);
    setStateFilter(nextParsedState.stateFilter);
    setSeverityFilter(nextParsedState.severityFilter);
    setFromDate(nextParsedState.fromDate);
    setToDate(nextParsedState.toDate);
    setPage(nextParsedState.page);

    if (urlChanged) {
      lastSyncedUrlRef.current = serialized;
    }
    prevStationsLengthRef.current = stations.length;
    setIsUrlReady(true);
  }, [searchParams, stations]);

  useEffect(() => {
    if (!isUrlReady) {
      return;
    }

    const currentViewQuery = buildDashboardAlertsViewQuery(
      parseViewStateFromSearchParams(new URLSearchParams(searchParams.toString()), stations)
    );

    if (currentViewQuery === viewQueryString) {
      return;
    }

    const currentUrl = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
    const navUrl = viewQueryString.length > 0 ? `${pathname}?${viewQueryString}` : pathname;
    if (navUrl === currentUrl) {
      return;
    }
    const [navPath, navSearch] = navUrl.split('?');
    void router.navigate({
      to: navPath,
      search: navSearch ? Object.fromEntries(new URLSearchParams(navSearch)) : {},
      replace: true,
    });
  }, [isUrlReady, pathname, router, searchParams, stations, viewQueryString]);

  useAbortableAsyncEffect(
    async (signal, isActive) => {
      try {
        const payload = await fetchJson<AlertsHistoryApiResponse>(
          `${appRoutes.api.alertsHistory()}?${apiQueryString}`,
          {
            signal,
            cache: 'no-store',
            errorMessage: 'No hemos podido cargar el historial de alertas.',
          }
        );

        if (!isActive()) {
          return;
        }

        setRows(Array.isArray(payload.alerts) ? payload.alerts : []);
        setTotalRows(Number(payload.pagination?.total ?? 0));
      } catch (error) {
        if (!isActive()) {
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
        setRows([]);
        setTotalRows(0);
        setErrorMessage('No hemos podido cargar el historial de alertas.');
      }
    },
    [apiQueryString],
    {
      onStart: () => {
        setIsLoading(true);
        setErrorMessage(null);
      },
      onSettled: () => {
        setIsLoading(false);
      },
    }
  );

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

  const copyToClipboard = useCallback(async () => {
    const headers = ['Fecha', 'Estación', 'ID', 'Tipo', 'Severidad', 'Estado', 'Valor', 'Ventana'];
    const textRows = rows.map((row) => [
      formatDateTime(row.generatedAt),
      row.stationName,
      row.stationId,
      formatAlertType(row.alertType),
      row.severity >= 2 ? 'Crítica' : 'Media',
      row.isActive ? 'Activa' : 'Resuelta',
      row.metricValue.toFixed(1),
      `${row.windowHours}h`,
    ]);
    const text = [headers, ...textRows].map((row) => row.join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
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
    <PageShell>
      <PageHeaderCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Historial de alertas</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <TrackedLink href={appRoutes.dashboard()} className="ui-icon-button" aria-label="Volver al mapa avanzado">
              Inicio
            </TrackedLink>
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <Select
            value={stationId || ALL_STATIONS_VALUE}
            onValueChange={(value) => {
              setStationId(!value || value === ALL_STATIONS_VALUE ? '' : value);
              setPage(0);
            }}
          >
            <SelectTrigger aria-label="Filtrar por estación" className="w-full bg-[var(--secondary)]">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATIONS_VALUE}>Todas las estaciones</SelectItem>
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={alertType}
            onValueChange={(value) => {
              setAlertType((value as AlertTypeFilter) ?? 'all');
              setPage(0);
            }}
          >
            <SelectTrigger aria-label="Filtrar por tipo de alerta" className="w-full bg-[var(--secondary)]">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="LOW_BIKES">Pocas bicis</SelectItem>
              <SelectItem value="LOW_ANCHORS">Pocos anclajes</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={stateFilter}
            onValueChange={(value) => {
              setStateFilter((value as AlertStateFilter) ?? 'all');
              setPage(0);
            }}
          >
            <SelectTrigger aria-label="Filtrar por estado" className="w-full bg-[var(--secondary)]">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="resolved">Resueltas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={severityFilter}
            onValueChange={(value) => {
              setSeverityFilter((value as SeverityFilter) ?? 'all');
              setPage(0);
            }}
          >
            <SelectTrigger aria-label="Filtrar por severidad" className="w-full bg-[var(--secondary)]">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="1">Media</SelectItem>
              <SelectItem value="2">Critica</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(0);
            }}
            aria-label="Fecha desde"
            className="bg-[var(--secondary)]"
          />

          <Input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(0);
            }}
            aria-label="Fecha hasta"
            className="bg-[var(--secondary)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Fechas rápidas
          </span>
          <Button
            onClick={() => applyQuickRange(1)}
            variant={activeQuickRange === 'today' ? 'default' : 'outline'}
            size="sm"
          >
            Hoy
          </Button>
          <Button
            onClick={() => applyQuickRange(7)}
            variant={activeQuickRange === 'last7' ? 'default' : 'outline'}
            size="sm"
          >
            7 días
          </Button>
          <Button
            onClick={() => applyQuickRange(30)}
            variant={activeQuickRange === 'last30' ? 'default' : 'outline'}
            size="sm"
          >
            30 días
          </Button>
          <Button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            variant="outline"
            size="sm"
          >
            Limpiar filtros
          </Button>

          <span className="ml-auto text-xs text-[var(--muted)]">Puedes compartir esta URL: conserva los filtros actuales.</span>
        </div>
      </PageHeaderCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="ui-section-card">
          <p className="stat-label">Total filtrado</p>
          <p className="stat-value">{totalRows}</p>
        </Card>
        <Card className="ui-section-card">
          <p className="stat-label">Activas en esta página</p>
          <p className="stat-value">{stats.active}</p>
        </Card>
        <Card className="ui-section-card">
          <p className="stat-label">Críticas en esta página</p>
          <p className="stat-value">{stats.critical}</p>
        </Card>
        <Card className="ui-section-card">
          <p className="stat-label">Exportar</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={copyToClipboard}
              disabled={rows.length === 0}
              variant="outline"
              size="sm"
              className="px-3 py-2 text-xs"
            >
              Copiar
            </Button>
            <a
              href={downloadCsvHref}
              className="ui-inline-action"
            >
              CSV
            </a>
          </div>
          {copyState !== 'idle' ? (
            <p className="mt-2 text-xs text-[var(--muted)]" role="status">
              {copyState === 'copied'
                ? 'Alertas copiadas al portapapeles.'
                : 'No se pudo copiar automáticamente. Usa el CSV como alternativa.'}
            </p>
          ) : null}
        </Card>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">Registros de alertas</p>
          <p className="text-xs text-[var(--muted)]">
            Página {page + 1}/{pageCount} · {rows.length} filas
          </p>
        </header>

        {isLoading ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">Cargando alertas...</p>
        ) : errorMessage ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">{errorMessage}</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">No hay alertas para los filtros actuales. Limpia filtros o amplía el rango de fechas.</p>
        ) : (
          <ScrollArea className="overflow-x-auto max-h-[600px]">
            <Table className="min-w-full border-collapse text-sm">
              <TableHeader className="sticky top-0 z-10 bg-[var(--secondary)]">
                <TableRow className="text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  <TableHead className="h-auto px-4 py-3">Fecha</TableHead>
                  <TableHead className="h-auto px-4 py-3">Estacion</TableHead>
                  <TableHead className="h-auto px-4 py-3">Tipo</TableHead>
                  <TableHead className="h-auto px-4 py-3">Severidad</TableHead>
                  <TableHead className="h-auto px-4 py-3">Estado</TableHead>
                  <TableHead className="h-auto px-4 py-3">Valor</TableHead>
                  <TableHead className="h-auto px-4 py-3">Ventana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                    <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]">
                      {formatDateTime(row.generatedAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-semibold">{row.stationName}</p>
                      <p className="text-xs text-[var(--muted)]">{row.stationId}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3">{formatAlertType(row.alertType)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={row.severity >= 2 ? 'danger' : 'warning'}>
                        {row.severity >= 2 ? 'Critica' : 'Media'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={row.isActive ? 'success' : 'muted'}>
                        {row.isActive ? 'Activa' : 'Resuelta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-xs">{row.metricValue.toFixed(1)}</TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted)]">
                      {row.windowHours}h
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <footer className="flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
          <p className="text-xs text-[var(--muted)]">Muestra de {PAGE_SIZE} filas por pagina</p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => hasPreviousPage && setPage((current) => current - 1)}
              disabled={!hasPreviousPage || isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Anterior
            </Button>
            <Button
              onClick={() => hasNextPage && setPage((current) => current + 1)}
              disabled={!hasNextPage || isLoading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Siguiente
            </Button>
          </div>
        </footer>
      </section>
    </PageShell>
  );
}
