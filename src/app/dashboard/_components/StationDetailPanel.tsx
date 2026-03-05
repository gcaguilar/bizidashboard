'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  AlertsResponse,
  HeatmapCell,
  RankingsResponse,
  StationPatternRow,
  StationSnapshot,
} from '@/lib/api';
import {
  buildStationDistrictMap,
  DISTRICTS_GEOJSON_URL,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';
import { formatPercent } from '@/lib/format';

type MobilitySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type MobilityResponse = {
  mobilityDays: number;
  demandDays: number;
  methodology: string;
  hourlySignals: MobilitySignalRow[];
};

type StationDetailPanelProps = {
  station: StationSnapshot | null;
  stations: StationSnapshot[];
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  alerts: AlertsResponse;
  patterns: StationPatternRow[];
  heatmap: HeatmapCell[];
  mobilityDays?: number;
  demandDays?: number;
};

function toOccupancy(station: StationSnapshot | null): number {
  if (!station || !Number.isFinite(station.capacity) || station.capacity <= 0) {
    return 0;
  }

  return station.bikesAvailable / station.capacity;
}

function getDayTypeForToday(): string {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKDAY';
}

function getAverageOccupancy(
  rows: Array<{ occupancyAvg: number }>,
  fallback: number
): number {
  if (rows.length === 0) {
    return fallback;
  }

  const total = rows.reduce((sum, row) => sum + (Number.isFinite(row.occupancyAvg) ? row.occupancyAvg : 0), 0);
  return total / rows.length;
}

export function StationDetailPanel({
  station,
  stations,
  rankings,
  alerts,
  patterns,
  heatmap,
  mobilityDays = 14,
  demandDays = 30,
}: StationDetailPanelProps) {
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [mobility, setMobility] = useState<MobilityResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadExtraData = async () => {
      try {
        const params = new URLSearchParams({
          mobilityDays: String(mobilityDays),
          demandDays: String(demandDays),
        });

        const [districtResponse, mobilityResponse] = await Promise.all([
          fetch(DISTRICTS_GEOJSON_URL, {
            signal: controller.signal,
          }),
          fetch(`/api/mobility?${params.toString()}`, {
            signal: controller.signal,
          }),
        ]);

        if (!districtResponse.ok || !mobilityResponse.ok) {
          throw new Error('No se pudieron cargar datos auxiliares de estacion.');
        }

        const [districtPayload, mobilityPayload] = (await Promise.all([
          districtResponse.json(),
          mobilityResponse.json(),
        ])) as [unknown, unknown];

        if (!isActive) {
          return;
        }

        if (isDistrictCollection(districtPayload)) {
          setDistricts(districtPayload);
        }

        const typedMobility = mobilityPayload as MobilityResponse;
        if (Array.isArray(typedMobility.hourlySignals)) {
          setMobility(typedMobility);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Dashboard] Error cargando detalle de estacion', error);
      }
    };

    void loadExtraData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [demandDays, mobilityDays]);

  const stationDistrictMap = useMemo(() => {
    if (!districts) {
      return new Map<string, string>();
    }

    return buildStationDistrictMap(stations, districts);
  }, [districts, stations]);

  const selectedDistrict = station ? stationDistrictMap.get(station.id) ?? null : null;

  const cityAverage = useMemo(() => {
    const occupancies = stations
      .map((row) => toOccupancy(row))
      .filter((value) => Number.isFinite(value));

    if (occupancies.length === 0) {
      return 0;
    }

    return occupancies.reduce((sum, value) => sum + value, 0) / occupancies.length;
  }, [stations]);

  const districtAverage = useMemo(() => {
    if (!selectedDistrict) {
      return null;
    }

    const districtStations = stations.filter(
      (stationRow) => stationDistrictMap.get(stationRow.id) === selectedDistrict
    );

    if (districtStations.length === 0) {
      return null;
    }

    const values = districtStations.map((districtStation) => toOccupancy(districtStation));
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [selectedDistrict, stationDistrictMap, stations]);

  const districtSnapshot = useMemo(() => {
    if (!selectedDistrict) {
      return null;
    }

    const districtStations = stations.filter(
      (stationRow) => stationDistrictMap.get(stationRow.id) === selectedDistrict
    );

    if (districtStations.length === 0) {
      return null;
    }

    const bikesAvg =
      districtStations.reduce((sum, row) => sum + Math.max(0, row.bikesAvailable), 0) /
      districtStations.length;
    const anchorsAvg =
      districtStations.reduce((sum, row) => sum + Math.max(0, row.anchorsFree), 0) /
      districtStations.length;

    return {
      bikesAvg,
      anchorsAvg,
    };
  }, [selectedDistrict, stationDistrictMap, stations]);

  const turnoverRow = useMemo(() => {
    if (!station) {
      return null;
    }

    return (
      rankings.turnover.rankings.find((row) => row.stationId === station.id) ??
      rankings.availability.rankings.find((row) => row.stationId === station.id) ??
      null
    );
  }, [rankings.availability.rankings, rankings.turnover.rankings, station]);

  const availabilityRow = useMemo(() => {
    if (!station) {
      return null;
    }

    return (
      rankings.availability.rankings.find((row) => row.stationId === station.id) ??
      rankings.turnover.rankings.find((row) => row.stationId === station.id) ??
      null
    );
  }, [rankings.availability.rankings, rankings.turnover.rankings, station]);

  const stationAlerts = station
    ? alerts.alerts.filter((alert) => alert.stationId === station.id && alert.isActive)
    : [];

  const projection = useMemo(() => {
    const currentOccupancy = toOccupancy(station);
    const dayType = getDayTypeForToday();
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const nextTwoHours = (now.getHours() + 2) % 24;

    const nextHourRow = patterns.find(
      (row) => String(row.dayType) === dayType && Number(row.hour) === nextHour
    );

    const nextTwoHoursRow = patterns.find(
      (row) => String(row.dayType) === dayType && Number(row.hour) === nextTwoHours
    );

    const patternFallback = getAverageOccupancy(patterns, currentOccupancy);
    const heatmapFallback = getAverageOccupancy(heatmap, patternFallback);

    const next30 = nextHourRow?.occupancyAvg ?? patternFallback;
    const next60 = nextTwoHoursRow?.occupancyAvg ?? heatmapFallback;

    const sampleBase = (nextHourRow?.sampleCount ?? 0) + (nextTwoHoursRow?.sampleCount ?? 0);
    const confidence = Math.max(30, Math.min(94, 35 + sampleBase * 4));

    return {
      next30,
      next60,
      confidence,
    };
  }, [heatmap, patterns, station]);

  const estimatedDestinations = useMemo(() => {
    if (!mobility || !selectedDistrict) {
      return [] as Array<{ district: string; flow: number }>;
    }

    const districtTotals = new Map<string, { inbound: number; outbound: number }>();

    for (const row of mobility.hourlySignals) {
      const district = stationDistrictMap.get(row.stationId);

      if (!district) {
        continue;
      }

      const current = districtTotals.get(district) ?? { inbound: 0, outbound: 0 };
      current.inbound += Math.max(0, Number(row.arrivals));
      current.outbound += Math.max(0, Number(row.departures));
      districtTotals.set(district, current);
    }

    const selected = districtTotals.get(selectedDistrict);

    if (!selected || selected.outbound <= 0) {
      return [];
    }

    const totalInbound = Array.from(districtTotals.values()).reduce(
      (sum, districtRow) => sum + districtRow.inbound,
      0
    );

    if (totalInbound <= 0) {
      return [];
    }

    return Array.from(districtTotals.entries())
      .filter(([district]) => district !== selectedDistrict)
      .map(([district, districtRow]) => ({
        district,
        flow: selected.outbound * (districtRow.inbound / totalInbound),
      }))
      .sort((left, right) => right.flow - left.flow)
      .slice(0, 4);
  }, [mobility, selectedDistrict, stationDistrictMap]);

  const selectedDistrictNet = useMemo(() => {
    if (!mobility || !selectedDistrict) {
      return null;
    }

    let inbound = 0;
    let outbound = 0;

    for (const row of mobility.hourlySignals) {
      const district = stationDistrictMap.get(row.stationId);

      if (district !== selectedDistrict) {
        continue;
      }

      inbound += Math.max(0, Number(row.arrivals));
      outbound += Math.max(0, Number(row.departures));
    }

    return inbound - outbound;
  }, [mobility, selectedDistrict, stationDistrictMap]);

  if (!station) {
    return (
      <section className="dashboard-card">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Detalle de estacion</h2>
        <p className="text-sm text-[var(--muted)]">
          Selecciona una estacion para ver KPIs, benchmarking y proyecciones.
        </p>
      </section>
    );
  }

  const currentOccupancy = toOccupancy(station);
  const isCritical =
    station.bikesAvailable === 0 || station.anchorsFree === 0 || stationAlerts.length > 0;
  const statusLabel = isCritical ? 'Critica - accion requerida' : 'Estable';
  const problemHours =
    (availabilityRow?.emptyHours ?? turnoverRow?.emptyHours ?? 0) +
    (availabilityRow?.fullHours ?? turnoverRow?.fullHours ?? 0);

  return (
    <section className="dashboard-card gap-5">
      <header className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg border border-[var(--accent)]/35 bg-gradient-to-br from-[var(--accent)]/30 to-[var(--surface-soft)]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Analitica de estacion</p>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{station.name}</h2>
              <p className="text-xs text-[var(--muted)]">
                ID #{station.id}
                {selectedDistrict ? ` · ${selectedDistrict}` : ''}
              </p>
              <span
                className={`mt-2 inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  isCritical
                    ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[#ffb9be]'
                    : 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-xs text-[var(--muted)]">
              Actualizado {new Date(station.recordedAt).toLocaleString('es-ES')}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="icon-button" aria-label="Compartir estacion">
                Compartir
              </button>
              <button type="button" className="icon-button" aria-label="Marcar favorita">
                Favorita
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="stat-card border-[var(--accent)]/35 bg-[var(--accent)]/12">
          <p className="stat-label">Bicis disponibles</p>
          <p className="stat-value">{station.bikesAvailable}</p>
          <p className="text-[10px] text-[var(--muted)]">
            Avg distrito: {districtSnapshot ? districtSnapshot.bikesAvg.toFixed(1) : 'N/A'}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Anclajes libres</p>
          <p className="stat-value">{station.anchorsFree}</p>
          <p className="text-[10px] text-[var(--muted)]">
            Avg distrito: {districtSnapshot ? districtSnapshot.anchorsAvg.toFixed(1) : 'N/A'}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Rotacion 14d</p>
          <p className="stat-value">
            {turnoverRow ? turnoverRow.turnoverScore.toFixed(1) : 'Sin datos'}
          </p>
          <p className="text-[10px] text-[var(--muted)]">Metrica real de ranking operativo</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Horas problema 14d</p>
          <p className="stat-value">{problemHours}</p>
          <p className="text-[10px] text-[var(--muted)]">Alertas activas: {stationAlerts.length}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Benchmark de barrio
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Estacion</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {formatPercent(currentOccupancy)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Distrito</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {districtAverage === null ? 'Sin datos' : formatPercent(districtAverage)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Ciudad</p>
              <p className="text-lg font-semibold text-[var(--foreground)]">{formatPercent(cityAverage)}</p>
            </div>
          </div>
          <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--muted)]">
            Insight:{' '}
            {districtAverage === null
              ? 'sin datos de distrito para comparar.'
              : `esta estacion esta ${
                  currentOccupancy >= districtAverage ? 'por encima' : 'por debajo'
                } de la media distrital en ${formatPercent(
                  Math.abs(currentOccupancy - districtAverage)
                )}.`}
          </p>
        </article>

        <article className="rounded-xl border border-[var(--accent)] bg-[var(--accent)] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
            Prediccion (estimado)
          </p>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/75">En 30 min</p>
              <p className="text-lg font-semibold">{formatPercent(projection.next30)}</p>
            </div>
            <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/75">En 60 min</p>
              <p className="text-lg font-semibold">{formatPercent(projection.next60)}</p>
            </div>
            <p className="text-xs text-white/80">Confianza estimada: {Math.round(projection.confidence)}%</p>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Destinos principales (estimado)
          </p>
          <span className="kpi-chip">Balance neto {selectedDistrictNet?.toFixed(1) ?? 'N/A'}</span>
        </div>
        {estimatedDestinations.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Sin datos suficientes para estimar destinos desde el distrito actual.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {estimatedDestinations.map((destination, index) => (
              <div
                key={destination.district}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {index + 1}. {destination.district}
                </p>
                <p className="text-xs font-semibold text-[var(--muted)]">{destination.flow.toFixed(1)}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
