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
  fetchDistrictCollection,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';
import { formatPercent } from '@/lib/format';
import { formatDistanceMeters, haversineDistanceMeters, type Coordinates } from '@/lib/geo';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

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
  selectedMonth?: string | null;
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
  selectedMonth?: string | null;
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
  selectedMonth = null,
}: StationDetailPanelProps) {
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [mobility, setMobility] = useState<MobilityResponse | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadExtraData = async () => {
      try {
        const params = new URLSearchParams({
          mobilityDays: String(mobilityDays),
          demandDays: String(demandDays),
        });

        if (selectedMonth) {
          params.set('month', selectedMonth);
        }

        const [districtPayload, mobilityResponse] = await Promise.all([
          fetchDistrictCollection(controller.signal),
          fetch(`${appRoutes.api.mobility()}?${params.toString()}`, {
            signal: controller.signal,
          }),
        ]);

        if (!districtPayload || !mobilityResponse.ok) {
          throw new Error('No se pudieron cargar datos auxiliares de estacion.');
        }

        const mobilityPayload = (await mobilityResponse.json()) as unknown;

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

        captureExceptionWithContext(error, {
          area: 'dashboard.station-detail',
          operation: 'loadExtraData',
          extra: {
            mobilityDays,
            demandDays,
            selectedMonth,
          },
        });
        console.error('[Dashboard] Error cargando detalle de estacion', error);
      }
    };

    void loadExtraData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [demandDays, mobilityDays, selectedMonth]);

  useEffect(() => {
    if (!isGeolocationEnabled) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 120_000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, [isGeolocationEnabled]);

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
    if (!mobility || !selectedDistrict || !station) {
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

    const stationOutbound = mobility.hourlySignals
      .filter((row) => row.stationId === station.id)
      .reduce((sum, row) => sum + Math.max(0, Number(row.departures)), 0);

    const districtOutbound = districtTotals.get(selectedDistrict)?.outbound ?? 0;
    const outboundBasis =
      stationOutbound > 0 ? stationOutbound : districtOutbound > 0 ? districtOutbound : 0;

    if (outboundBasis <= 0) {
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
        flow: outboundBasis * (districtRow.inbound / totalInbound),
      }))
      .sort((left, right) => right.flow - left.flow)
      .slice(0, 4);
  }, [mobility, selectedDistrict, station, stationDistrictMap]);

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

  const nearestDistanceMeters = useMemo(() => {
    if (!station || !userLocation) {
      return null;
    }

    if (!Number.isFinite(station.lat) || !Number.isFinite(station.lon)) {
      return null;
    }

    return haversineDistanceMeters(userLocation, {
      latitude: station.lat,
      longitude: station.lon,
    });
  }, [station, userLocation]);

  const isNearestStation = useMemo(() => {
    if (!station || !userLocation || stations.length === 0) {
      return false;
    }

    let nearestStationId: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const row of stations) {
      if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) {
        continue;
      }

      const distance = haversineDistanceMeters(userLocation, {
        latitude: row.lat,
        longitude: row.lon,
      });

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStationId = row.id;
      }
    }

    return nearestStationId === station.id;
  }, [station, stations, userLocation]);

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
  const statusLabel = isCritical
    ? station.bikesAvailable === 0
      ? 'Critica - vacia'
      : station.anchorsFree === 0
        ? 'Critica - llena'
        : 'Critica - accion requerida'
    : 'Operativa';
  const problemHours =
    (availabilityRow?.emptyHours ?? turnoverRow?.emptyHours ?? 0) +
    (availabilityRow?.fullHours ?? turnoverRow?.fullHours ?? 0);
  const totalDestinationFlow = estimatedDestinations.reduce(
    (sum, destination) => sum + destination.flow,
    0
  );

  return (
    <section className="space-y-6">
      <header className="rounded-xl border border-[var(--border)] bg-[var(--accent)]/8 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/35 to-[var(--surface-soft)] text-xs font-black uppercase tracking-[0.14em] text-[var(--foreground)]">
              #{station.id}
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{station.name}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                ID: #{station.id}
                {selectedDistrict ? ` · ${selectedDistrict}` : ''}
              </p>
              {nearestDistanceMeters !== null ? (
                <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
                  📍 A {formatDistanceMeters(nearestDistanceMeters)} de ti
                  {isNearestStation ? ' · Es la mas cercana' : ''}
                </p>
              ) : !isGeolocationEnabled ? (
                <button
                  type="button"
                  onClick={() => setIsGeolocationEnabled(true)}
                  className="mt-2 rounded-lg border border-[var(--accent)] px-2 py-1 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
                >
                  Usar mi ubicacion para calcular distancia
                </button>
              ) : null}
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                  isCritical
                    ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]'
                    : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-500'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                </span>
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                Ultima actualizacion
              </p>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {new Date(station.recordedAt).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/12 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Bicis disponibles</p>
          <p className="mt-2 text-4xl font-bold text-[var(--foreground)]">{station.bikesAvailable}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Media distrito: {districtSnapshot ? districtSnapshot.bikesAvg.toFixed(1) : 'N/D'}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Anclajes libres</p>
          <p className="mt-2 text-4xl font-bold text-[var(--foreground)]">{station.anchorsFree}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Media distrito: {districtSnapshot ? districtSnapshot.anchorsAvg.toFixed(1) : 'N/D'}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Rotacion 14d</p>
          <p className="mt-2 text-4xl font-bold text-[var(--foreground)]">
            {turnoverRow ? turnoverRow.turnoverScore.toFixed(1) : '0.0'}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Puntuacion del ranking operativo.</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Horas problema 14d</p>
          <p className="mt-2 text-4xl font-bold text-[var(--foreground)]">{problemHours}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Alertas activas: {stationAlerts.length}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Benchmark de barrio</h3>
            {selectedDistrict ? (
              <span className="rounded bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold uppercase text-[var(--accent)]">
                {selectedDistrict}
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-3 border-b border-[var(--border)] pb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              <span>Metrica</span>
              <span className="text-center">Estacion</span>
              <span className="text-right">Distrito/Ciudad</span>
            </div>
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="text-[var(--muted)]">Ocupacion media</span>
              <span className="text-center font-semibold text-[var(--foreground)]">
                {formatPercent(currentOccupancy)}
              </span>
              <span className="text-right text-[var(--muted)]">
                {districtAverage === null ? formatPercent(cityAverage) : formatPercent(districtAverage)}
              </span>
            </div>
            <div className="grid grid-cols-3 py-1 text-sm">
              <span className="text-[var(--muted)]">Horas problema</span>
              <span className="text-center font-semibold text-[var(--foreground)]">{problemHours}</span>
              <span className="text-right text-[var(--muted)]">
                {availabilityRow ? `${availabilityRow.totalHours}h muestra` : 'N/D'}
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-xs text-[var(--muted)]">
              <span className="font-bold text-[var(--accent)]">Conclusión:</span>{' '}
              {districtAverage === null
                ? 'Sin datos de distrito para comparar.'
                : `Esta estacion esta ${
                    currentOccupancy >= districtAverage ? 'por encima' : 'por debajo'
                  } de la media distrital en ${formatPercent(
                    Math.abs(currentOccupancy - districtAverage)
                  )}.`}
            </div>
          </div>
        </article>

        <article className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] p-5 text-white">
          <h3 className="text-lg font-bold">Prediccion de disponibilidad</h3>
          <p className="mt-1 text-sm text-white/80">Estimacion de disponibilidad para 60 minutos.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">En 30 min</p>
              <p className="text-base font-bold">{formatPercent(projection.next30)}</p>
            </div>
            <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">En 60 min</p>
              <p className="text-base font-bold">{formatPercent(projection.next60)}</p>
            </div>
            <div className="pt-1 text-[11px] text-white/80">
              Confianza: {Math.round(projection.confidence)}%
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[var(--foreground)]">Destinos principales</h3>
          <span className="kpi-chip">Balance neto {selectedDistrictNet?.toFixed(1) ?? 'N/D'}</span>
        </div>
        {estimatedDestinations.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Sin datos suficientes para estimar destinos desde el distrito actual.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {estimatedDestinations.map((destination, index) => {
              const share =
                totalDestinationFlow > 0
                  ? Math.round((destination.flow / totalDestinationFlow) * 100)
                  : 0;

              return (
                <div
                  key={destination.district}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-sm font-bold text-[var(--accent)]">
                      {index + 1}
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{destination.district}</p>
                  </div>
                  <p className="text-xs font-bold text-[var(--muted)]">{share}% flujo</p>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
