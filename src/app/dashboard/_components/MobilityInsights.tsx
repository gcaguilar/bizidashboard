'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StationSnapshot } from '@/lib/api';
import { formatPercent } from '@/lib/format';

const DISTRICTS_GEOJSON_URL =
  'https://raw.githubusercontent.com/bislai/bislai/master/mapas/distritos-ciudadanos-zaragoza.geojson';

const PERIODS = [
  { key: 'morning', label: 'Manana', from: 6, to: 11 },
  { key: 'midday', label: 'Mediodia', from: 12, to: 16 },
  { key: 'evening', label: 'Tarde', from: 17, to: 21 },
  { key: 'night', label: 'Noche', from: 22, to: 5 },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

type MobilitySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type MobilityResponse = {
  mobilityDays: number;
  demandDays: number;
  methodology: string;
  hourlySignals: MobilitySignalRow[];
  dailyDemand: DailyDemandRow[];
  generatedAt: string;
};

type Coordinate = number[];

type DistrictGeometry =
  | {
      type: 'Polygon';
      coordinates: Coordinate[][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: Coordinate[][][];
    };

type DistrictFeature = {
  type: 'Feature';
  geometry: DistrictGeometry;
  properties?: {
    distrito?: string;
    [key: string]: unknown;
  };
};

type DistrictCollection = {
  type: 'FeatureCollection';
  features: DistrictFeature[];
};

type DistrictTotals = {
  district: string;
  outbound: number;
  inbound: number;
  volume: number;
  net: number;
};

type PeriodInsights = {
  key: PeriodKey;
  label: string;
  districts: DistrictTotals[];
  matrix: number[][];
  maxFlow: number;
  totalFlow: number;
};

type MobilityInsightsProps = {
  stations: StationSnapshot[];
};

function toLngLatPair(coordinate: Coordinate | undefined): [number, number] | null {
  if (!coordinate || coordinate.length < 2) {
    return null;
  }

  const lng = coordinate[0];
  const lat = coordinate[1];

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return [lng, lat];
}

function isDistrictCollection(value: unknown): value is DistrictCollection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeCollection = value as {
    type?: unknown;
    features?: unknown;
  };

  if (maybeCollection.type !== 'FeatureCollection') {
    return false;
  }

  if (!Array.isArray(maybeCollection.features)) {
    return false;
  }

  return maybeCollection.features.every((feature: unknown) => {
    if (!feature || typeof feature !== 'object') {
      return false;
    }

    const maybeFeature = feature as {
      type?: unknown;
      geometry?: { type?: unknown };
    };

    if (maybeFeature.type !== 'Feature') {
      return false;
    }

    const geometryType = maybeFeature.geometry?.type;
    return geometryType === 'Polygon' || geometryType === 'MultiPolygon';
  });
}

function isPointInRing(point: [number, number], ring: Coordinate[]): boolean {
  if (ring.length < 3) {
    return false;
  }

  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const current = toLngLatPair(ring[i]);
    const previous = toLngLatPair(ring[j]);

    if (!current || !previous) {
      continue;
    }

    const [xi, yi] = current;
    const [xj, yj] = previous;

    const intersects =
      (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInPolygon(point: [number, number], polygon: Coordinate[][]): boolean {
  if (polygon.length === 0) {
    return false;
  }

  if (!isPointInRing(point, polygon[0] ?? [])) {
    return false;
  }

  for (let i = 1; i < polygon.length; i += 1) {
    if (isPointInRing(point, polygon[i] ?? [])) {
      return false;
    }
  }

  return true;
}

function isPointInDistrict(point: [number, number], district: DistrictFeature): boolean {
  if (district.geometry.type === 'Polygon') {
    return isPointInPolygon(point, district.geometry.coordinates);
  }

  return district.geometry.coordinates.some((polygon: Coordinate[][]) =>
    isPointInPolygon(point, polygon)
  );
}

function getPeriodByHour(hour: number): PeriodKey {
  if (hour >= 6 && hour <= 11) {
    return 'morning';
  }

  if (hour >= 12 && hour <= 16) {
    return 'midday';
  }

  if (hour >= 17 && hour <= 21) {
    return 'evening';
  }

  return 'night';
}

function getMatrixCellColor(value: number, maxValue: number): string {
  if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) {
    return 'rgba(227, 219, 208, 0.35)';
  }

  const ratio = Math.min(1, Math.max(0, value / maxValue));
  return `rgba(31, 122, 140, ${0.18 + ratio * 0.74})`;
}

function getDayLabel(day: string): string {
  if (typeof day !== 'string' || day.length < 10) {
    return day;
  }

  const month = day.slice(5, 7);
  const date = day.slice(8, 10);
  return `${date}/${month}`;
}

export function MobilityInsights({ stations }: MobilityInsightsProps) {
  const [mobilityData, setMobilityData] = useState<MobilityResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('morning');

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [mobilityResponse, districtsResponse] = await Promise.all([
          fetch('/api/mobility', {
            signal: controller.signal,
          }),
          fetch(DISTRICTS_GEOJSON_URL, {
            signal: controller.signal,
          }),
        ]);

        if (!mobilityResponse.ok || !districtsResponse.ok) {
          throw new Error('No se pudieron cargar los datos de movilidad.');
        }

        const [mobilityPayload, districtsPayload] = (await Promise.all([
          mobilityResponse.json(),
          districtsResponse.json(),
        ])) as [unknown, unknown];

        if (!isActive) {
          return;
        }

        const typedMobility = mobilityPayload as MobilityResponse;

        if (
          !typedMobility ||
          !Array.isArray(typedMobility.hourlySignals) ||
          !Array.isArray(typedMobility.dailyDemand)
        ) {
          throw new Error('Respuesta de movilidad invalida.');
        }

        if (!isDistrictCollection(districtsPayload)) {
          throw new Error('GeoJSON de distritos invalido.');
        }

        setMobilityData(typedMobility);
        setDistricts(districtsPayload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Dashboard] Error cargando insights de movilidad', error);
        if (isActive) {
          setErrorMessage('No se pudieron cargar los insights de movilidad.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const stationDistrictMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!districts) {
      return map;
    }

    for (const station of stations) {
      if (!Number.isFinite(station.lon) || !Number.isFinite(station.lat)) {
        continue;
      }

      const point: [number, number] = [station.lon, station.lat];

      for (const district of districts.features) {
        if (!isPointInDistrict(point, district)) {
          continue;
        }

        map.set(station.id, district.properties?.distrito ?? 'Distrito desconocido');
        break;
      }
    }

    return map;
  }, [districts, stations]);

  const periodInsights = useMemo<PeriodInsights[]>(() => {
    if (!mobilityData) {
      return [];
    }

    const periodMaps = new Map<PeriodKey, Map<string, { outbound: number; inbound: number }>>();

    PERIODS.forEach((period) => {
      periodMaps.set(period.key, new Map());
    });

    for (const row of mobilityData.hourlySignals) {
      const district = stationDistrictMap.get(row.stationId);

      if (!district) {
        continue;
      }

      const periodKey = getPeriodByHour(Number(row.hour));
      const districtMap = periodMaps.get(periodKey);

      if (!districtMap) {
        continue;
      }

      const current = districtMap.get(district) ?? { outbound: 0, inbound: 0 };
      current.outbound += Math.max(0, Number(row.departures));
      current.inbound += Math.max(0, Number(row.arrivals));
      districtMap.set(district, current);
    }

    return PERIODS.map((period) => {
      const districtMap = periodMaps.get(period.key) ?? new Map();
      const districtRows = Array.from(districtMap.entries())
        .map(([district, values]) => ({
          district,
          outbound: values.outbound,
          inbound: values.inbound,
          volume: values.outbound + values.inbound,
          net: values.inbound - values.outbound,
        }))
        .filter((row) => row.volume > 0)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 8);

      const totalInbound = districtRows.reduce((sum, row) => sum + row.inbound, 0);
      const matrix = districtRows.map((origin) =>
        districtRows.map((destination) => {
          if (totalInbound <= 0) {
            return 0;
          }

          return origin.outbound * (destination.inbound / totalInbound);
        })
      );

      const maxFlow = matrix.reduce(
        (max, values) =>
          Math.max(max, values.reduce((innerMax, value) => Math.max(innerMax, value), 0)),
        0
      );

      const totalFlow = districtRows.reduce((sum, row) => sum + row.outbound, 0);

      return {
        key: period.key,
        label: period.label,
        districts: districtRows,
        matrix,
        maxFlow,
        totalFlow,
      };
    });
  }, [mobilityData, stationDistrictMap]);

  const activeInsights =
    periodInsights.find((insights) => insights.key === activePeriod) ?? periodInsights[0];

  const topRoutes = useMemo(() => {
    if (!activeInsights) {
      return [] as Array<{ origin: string; destination: string; flow: number }>;
    }

    const candidates: Array<{ origin: string; destination: string; flow: number }> = [];

    activeInsights.matrix.forEach((originRow, originIndex) => {
      originRow.forEach((value, destinationIndex) => {
        if (value <= 0 || originIndex === destinationIndex) {
          return;
        }

        const origin = activeInsights.districts[originIndex]?.district;
        const destination = activeInsights.districts[destinationIndex]?.district;

        if (!origin || !destination) {
          return;
        }

        candidates.push({
          origin,
          destination,
          flow: value,
        });
      });
    });

    return candidates.sort((a, b) => b.flow - a.flow).slice(0, 5);
  }, [activeInsights]);

  const dailyCurveData = useMemo(() => {
    if (!mobilityData) {
      return [] as Array<{
        day: string;
        label: string;
        demandScore: number;
        avgOccupancyPercent: number;
        sampleCount: number;
      }>;
    }

    return mobilityData.dailyDemand.map((row) => ({
      day: row.day,
      label: getDayLabel(row.day),
      demandScore: Number(row.demandScore),
      avgOccupancyPercent: Number(row.avgOccupancy) * 100,
      sampleCount: Number(row.sampleCount),
    }));
  }, [mobilityData]);

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Matriz Origen-Destino y demanda diaria
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Flujos estimados por barrio segun variaciones netas horarias de bicis.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-[var(--muted)]">Cargando insights de movilidad...</p>
      ) : errorMessage ? (
        <p className="text-sm text-[var(--muted)]">{errorMessage}</p>
      ) : !mobilityData ? (
        <p className="text-sm text-[var(--muted)]">Sin datos de movilidad disponibles.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {periodInsights.map((period) => (
              <button
                key={period.key}
                type="button"
                className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                  activePeriod === period.key
                    ? 'border-transparent bg-[var(--foreground)] text-[var(--surface)]'
                    : 'border-[var(--border)] text-[var(--muted)]'
                }`}
                onClick={() => setActivePeriod(period.key)}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="uppercase tracking-[0.16em]">Matriz O-D estimada</span>
                <span>Flujo total: {activeInsights?.totalFlow.toFixed(1) ?? '0.0'}</span>
              </div>

              {!activeInsights || activeInsights.districts.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Sin volumen suficiente para construir matriz.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-semibold text-[var(--muted)]">
                          Origen \ Destino
                        </th>
                        {activeInsights.districts.map((district) => (
                          <th
                            key={`dest-${district.district}`}
                            className="px-2 py-2 text-left font-semibold text-[var(--muted)]"
                          >
                            {district.district}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeInsights.districts.map((origin, originIndex) => (
                        <tr key={`origin-${origin.district}`}>
                          <td className="sticky left-0 bg-white px-2 py-2 font-semibold text-[var(--foreground)]">
                            {origin.district}
                          </td>
                          {activeInsights.matrix[originIndex]?.map((value, destinationIndex) => {
                            const ratio =
                              activeInsights.maxFlow > 0
                                ? value / activeInsights.maxFlow
                                : 0;

                            return (
                              <td
                                key={`${originIndex}-${destinationIndex}`}
                                className="border border-[#f1ece4] px-2 py-2 text-right"
                                style={{
                                  backgroundColor: getMatrixCellColor(
                                    value,
                                    activeInsights.maxFlow
                                  ),
                                  color: ratio > 0.55 ? '#ffffff' : 'var(--foreground)',
                                }}
                              >
                                {value.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="space-y-1 text-xs text-[var(--muted)]">
                <p className="uppercase tracking-[0.14em]">Rutas estimadas mas intensas</p>
                {topRoutes.length === 0 ? (
                  <p>Sin rutas destacadas para este periodo.</p>
                ) : (
                  topRoutes.map((route) => (
                    <p key={`${route.origin}-${route.destination}`}>
                      {route.origin} → {route.destination}: {route.flow.toFixed(1)}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="uppercase tracking-[0.16em]">Curva de Demanda Diaria</span>
                <span>{mobilityData.demandDays} dias</span>
              </div>

              {dailyCurveData.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Sin datos para construir curva diaria.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={dailyCurveData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece3d6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} />
                    <YAxis tick={{ fontSize: 11 }} width={44} />
                    <Tooltip
                      formatter={(
                        value: number | string | Array<number | string> | undefined,
                        name: string | undefined
                      ) => {
                        const numericValue = Array.isArray(value)
                          ? Number(value[0])
                          : Number(value);

                        if (name === 'Demanda') {
                          return [numericValue.toFixed(1), 'Demanda'];
                        }

                        return [formatPercent(numericValue), 'Ocupacion media'];
                      }}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="demandScore"
                      name="Demanda"
                      stroke="#c85c2d"
                      fill="#e07a3f55"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span>
                  Ultima fecha: {dailyCurveData[dailyCurveData.length - 1]?.day ?? 'sin datos'}
                </span>
                <span>
                  Ocupacion media actual:{' '}
                  {formatPercent(
                    dailyCurveData[dailyCurveData.length - 1]?.avgOccupancyPercent ?? 0
                  )}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[var(--muted)]">{mobilityData.methodology}</p>
        </>
      )}
    </section>
  );
}
