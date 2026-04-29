'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { TrackedAnchor } from '@/app/_components/TrackedAnchor';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import type { RebalancingReport } from '@/types/rebalancing';
import {
  buildExportClickEvent,
  buildFilterChangeEvent,
  buildPanelOpenEvent,
  trackUmamiEvent,
} from '@/lib/umami';
import { DashboardPageViewTracker } from '../../_components/DashboardPageViewTracker';
import { PageShell } from '@/components/layout/page-shell';
import { ClassificationLegend } from './ClassificationLegend';
import { RebalancingSummaryCards } from './RebalancingSummaryCards';
import { RebalancingTable } from './RebalancingTable';
import { TransferTable } from './TransferTable';
import { KpiCards } from './KpiCards';

type Tab = 'estaciones' | 'transferencias' | 'kpis' | 'metodologia';

type TableParams = {
  sort?: string;
  filter?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type Props = {
  initialReport: RebalancingReport;
  districtNames: string[];
  tableParams?: TableParams;
};

const ANALYSIS_WINDOWS = [7, 15, 30, 60] as const;
const ALL_DISTRICTS_VALUE = '__all_districts__';

export function RedistribucionClient({ initialReport, districtNames, tableParams }: Props) {
  const [report, setReport] = useState<RebalancingReport>(initialReport);
  const [activeTab, setActiveTab] = useState<Tab>('estaciones');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialReport.districtFilter ?? ''
  );
  const [selectedDays, setSelectedDays] = useState<number>(initialReport.analysisWindowDays);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const refreshReport = async () => {
      setLoadError(null);
      setIsReportLoading(true);

      try {
        const response = await fetch(
          appRoutes.api.rebalancingReport({
            district: selectedDistrict || null,
            days: selectedDays,
          }),
          {
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const nextReport: RebalancingReport = await response.json();

        if (!isActive) {
          return;
        }

        startTransition(() => {
          setReport(nextReport);
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.redistribucion',
          operation: 'refreshReport',
          extra: {
            days: selectedDays,
            district: selectedDistrict || null,
          },
        });

        if (!isActive) {
          return;
        }

        setLoadError('No se pudo actualizar el informe. Mostramos la ultima version disponible.');
      } finally {
        if (isActive) {
          setIsReportLoading(false);
        }
      }
    };

    void refreshReport();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedDays, selectedDistrict, startTransition]);

  function handleDistrictChange(value: string) {
    setSelectedDistrict(value);
  }

  function handleDaysChange(value: number) {
    setSelectedDays(value);
  }

  const isUpdatingReport = isReportLoading || isPending;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'estaciones', label: `Estaciones (${report.summary.totalStations})` },
    { id: 'transferencias', label: `Transferencias (${report.transfers.length})` },
    { id: 'kpis', label: 'KPIs e impacto' },
    { id: 'metodologia', label: 'Metodología' },
  ];

  return (
    <PageShell maxWidthClassName="max-w-[1280px]" className="bg-[var(--background)] sm:px-6">
      <DashboardPageViewTracker
        routeKey="dashboard_redistribucion"
        pageType="dashboard"
        template="redistribucion_report"
      />
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)]">Redistribución</h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Diagnóstico operativo de estaciones · ventana {report.analysisWindowDays} días ·{' '}
              <time dateTime={report.generatedAt}>
                {new Date(report.generatedAt).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </time>
            </p>
          </div>
          <TrackedAnchor
            href={appRoutes.api.rebalancingReport({
              district: selectedDistrict || null,
              days: selectedDays,
              format: 'csv',
            })}
            download
            trackingEvent={buildExportClickEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_redistribucion',
              source: 'redistribucion_header',
              ctaId: 'rebalancing_csv',
              entityType: 'api',
              module: 'redistribucion_export',
            })}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover,var(--card))]"
          >
            Descargar CSV
          </TrackedAnchor>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Select
            value={selectedDistrict || ALL_DISTRICTS_VALUE}
            onValueChange={(value) => {
              const nextValue = value === ALL_DISTRICTS_VALUE ? '' : value ?? '';
              trackUmamiEvent(
                buildFilterChangeEvent({
                  surface: 'dashboard',
                  routeKey: 'dashboard_redistribucion',
                  module: 'district_filter',
                  source: 'redistribucion_filters',
                  destination: nextValue ? 'filtered' : 'all',
                })
              );
              handleDistrictChange(nextValue);
            }}
          >
            <SelectTrigger
              aria-label="Filtrar redistribucion por barrio"
              className="min-h-9 min-w-[230px] bg-[var(--card)]"
            >
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DISTRICTS_VALUE}>Todos los barrios</SelectItem>
              {districtNames.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(selectedDays)}
            onValueChange={(value) => {
              const nextValue = Number(value);
              trackUmamiEvent(
                buildFilterChangeEvent({
                  surface: 'dashboard',
                  routeKey: 'dashboard_redistribucion',
                  module: 'analysis_window',
                  source: 'redistribucion_filters',
                  period: `${nextValue}_days`,
                })
              );
              handleDaysChange(nextValue);
            }}
          >
            <SelectTrigger
              aria-label="Cambiar ventana temporal del informe"
              className="min-h-9 min-w-[190px] bg-[var(--card)]"
            >
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              {ANALYSIS_WINDOWS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Últimos {d} días
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isUpdatingReport && (
            <span className="self-center text-xs text-[var(--muted)] animate-pulse">
              Actualizando…
            </span>
          )}
        </div>

        {loadError ? (
          <p className="mt-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            {loadError}
          </p>
        ) : null}
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        <RebalancingSummaryCards summary={report.summary} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const isTab = tabs.some((tab) => tab.id === value);
          if (!isTab || value === activeTab) {
            return;
          }

          const nextTab = value as Tab;
          trackUmamiEvent(
            buildPanelOpenEvent({
              surface: 'dashboard',
              routeKey: 'dashboard_redistribucion',
              module: nextTab,
              source: 'redistribucion_tabs',
            })
          );
          setActiveTab(nextTab);
        }}
      >
        <TabsList className="mb-4 gap-1 border-b border-[var(--border)]" aria-label="Secciones del informe de redistribucion">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-t-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent className="space-y-6" value="estaciones">
          <ClassificationLegend />
          <RebalancingTable diagnostics={report.diagnostics} initialParams={tableParams} />
        </TabsContent>

        <TabsContent className="space-y-6" value="transferencias">
          <TransferTable transfers={report.transfers} />
        </TabsContent>

        <TabsContent className="space-y-6" value="kpis">
          <KpiCards kpis={report.kpis} baseline={report.baselineComparison} />
        </TabsContent>

        <TabsContent className="space-y-6" value="metodologia">
          <MetodologiaPanel />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

// ─── Methodology tab ─────────────────────────────────────────────────────────

function MetodologiaPanel() {
  return (
    <div className="prose prose-sm max-w-none rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--foreground)]">
      <h2>Cómo funciona el sistema de redistribución</h2>

      <h3>1. Diagnóstico estructural (clasificación A-F)</h3>
      <p>
        Cada estación se clasifica según su comportamiento histórico en los últimos N días. La clasificación
        se basa en ocupación media, porcentaje de tiempo vacía/llena, rotación relativa e immobilidad.
        El sistema tiene 6 clases: <strong>A Sobrestock</strong>, <strong>B Déficit</strong>,{' '}
        <strong>C Saturación puntual</strong>, <strong>D Vaciado puntual</strong>,{' '}
        <strong>E Equilibrada</strong> y <strong>F Revisar dato</strong>.
      </p>

      <h3>2. Tipología inferida</h3>
      <p>
        El tipo de estación (residencial, oficinas, intermodal, turística, ocio, mixta) se infiere
        automáticamente de los patrones horarios históricos. Esto define la <em>banda objetivo</em>:
        el rango de ocupación aceptable para cada tipo y franja horaria.
      </p>

      <h3>3. Predicción de riesgo (1h/3h)</h3>
      <p>
        Se estima la probabilidad de vaciado o llenado en las próximas 1 y 3 horas mezclando el estado
        actual con el patrón histórico esperado. La influencia del estado actual decrece con el horizonte.
      </p>

      <h3>4. Red y elasticidad</h3>
      <p>
        Antes de urgir una intervención, el sistema evalúa si las estaciones cercanas (radio 500m) pueden
        absorber la demanda. Si existen alternativas robustas, la urgencia se reduce hasta un 50%.
      </p>

      <h3>5. Origen-destino y logística</h3>
      <p>
        El algoritmo de matching empareja donantes (exceso) con receptoras (déficit) considerando
        distancia, urgencia relativa y zona. Cada transferencia incluye número de bicis, ventana horaria
        sugerida, impacto esperado y coste logístico normalizado.
      </p>

      <h3>Limitaciones</h3>
      <ul>
        <li>No hay datos de viajes individuales ni ID de bicicleta.</li>
        <li>El clima y eventos no se modelan explícitamente (solo a través del patrón histórico).</li>
        <li>Las predicciones son estimaciones estadísticas, no certezas.</li>
        <li>Los umbrales son configurables y deben calibrarse tras observar resultados reales.</li>
      </ul>
    </div>
  );
}
