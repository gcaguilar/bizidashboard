'use client';

import { useState, useCallback, useTransition } from 'react';
import { appRoutes } from '@/lib/routes';
import type { RebalancingReport } from '@/types/rebalancing';
import { ClassificationLegend } from './ClassificationLegend';
import { RebalancingSummaryCards } from './RebalancingSummaryCards';
import { RebalancingTable } from './RebalancingTable';
import { TransferTable } from './TransferTable';
import { KpiCards } from './KpiCards';

type Tab = 'estaciones' | 'transferencias' | 'kpis' | 'metodologia';

type Props = {
  initialReport: RebalancingReport;
  districtNames: string[];
};

export function RedistribucionClient({ initialReport, districtNames }: Props) {
  const [report, setReport] = useState<RebalancingReport>(initialReport);
  const [activeTab, setActiveTab] = useState<Tab>('estaciones');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(15);
  const [isPending, startTransition] = useTransition();

  const fetchReport = useCallback(
    (district: string, days: number) => {
      startTransition(async () => {
        const res = await fetch(
          appRoutes.api.rebalancingReport({
            district: district || null,
            days,
          })
        );
        if (res.ok) {
          const data = (await res.json()) as RebalancingReport;
          setReport(data);
        }
      });
    },
    []
  );

  function handleDistrictChange(value: string) {
    setSelectedDistrict(value);
    fetchReport(value, selectedDays);
  }

  function handleDaysChange(value: number) {
    setSelectedDays(value);
    fetchReport(selectedDistrict, value);
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'estaciones', label: `Estaciones (${report.summary.totalStations})` },
    { id: 'transferencias', label: `Transferencias (${report.transfers.length})` },
    { id: 'kpis', label: 'KPIs e impacto' },
    { id: 'metodologia', label: 'Metodología' },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6">
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
          <a
            href={appRoutes.api.rebalancingReport({
              district: selectedDistrict || null,
              days: selectedDays,
              format: 'csv',
            })}
            download
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover,var(--surface))]"
          >
            Descargar CSV
          </a>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)]"
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
          >
            <option value="">Todos los barrios</option>
            {districtNames.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)]"
            value={selectedDays}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
          >
            {[7, 15, 30, 60].map((d) => (
              <option key={d} value={d}>
                Últimos {d} días
              </option>
            ))}
          </select>

          {isPending && (
            <span className="self-center text-xs text-[var(--muted)] animate-pulse">
              Actualizando…
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        <RebalancingSummaryCards summary={report.summary} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border border-b-0 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === 'estaciones' && (
          <>
            <ClassificationLegend />
            <RebalancingTable diagnostics={report.diagnostics} />
          </>
        )}

        {activeTab === 'transferencias' && (
          <TransferTable transfers={report.transfers} />
        )}

        {activeTab === 'kpis' && (
          <KpiCards kpis={report.kpis} baseline={report.baselineComparison} />
        )}

        {activeTab === 'metodologia' && <MetodologiaPanel />}
      </div>
    </main>
  );
}

// ─── Methodology tab ─────────────────────────────────────────────────────────

function MetodologiaPanel() {
  return (
    <div className="prose prose-sm max-w-none rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)]">
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
