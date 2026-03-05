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
import {
  buildStationDistrictMap,
  DISTRICTS_GEOJSON_URL,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';
import { formatPercent } from '@/lib/format';

const PERIODS = [
  { key: 'all', label: 'Todo el dia', from: 0, to: 23 },
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
  selectedStationId?: string;
  mobilityDays?: number;
  demandDays?: number;
};

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

function getDayLabel(day: string): string {
  if (typeof day !== 'string' || day.length < 10) {
    return day;
  }

  const month = day.slice(5, 7);
  const date = day.slice(8, 10);
  return `${date}/${month}`;
}

function getMatrixCellColor(value: number, maxValue: number): string {
  if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) {
    return 'rgba(176, 129, 135, 0.16)';
  }

  const ratio = Math.min(1, Math.max(0, value / maxValue));
  return `rgba(234, 6, 21, ${0.2 + ratio * 0.72})`;
}

export function MobilityInsights({
  stations,
  selectedStationId,
  mobilityDays = 14,
  demandDays = 30,
}: MobilityInsightsProps) {
  const [mobilityData, setMobilityData] = useState<MobilityResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('all');

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const searchParams = new URLSearchParams({
          mobilityDays: String(mobilityDays),
          demandDays: String(demandDays),
        });

        const [mobilityResponse, districtsResponse] = await Promise.all([
          fetch(`/api/mobility?${searchParams.toString()}`, {
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

        console.error('[Dashboard] Error cargando movilidad', error);
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
  }, [demandDays, mobilityDays]);

  const stationDistrictMap = useMemo(() => {
    if (!districts) {
      return new Map<string, string>();
    }

    return buildStationDistrictMap(stations, districts);
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

      const hour = Number(row.hour);
      const periodsToUpdate: PeriodKey[] = ['all'];

      if (Number.isFinite(hour)) {
        periodsToUpdate.push(getPeriodByHour(hour));
      }

      for (const periodKey of periodsToUpdate) {
        const districtMap = periodMaps.get(periodKey);

        if (!districtMap) {
          continue;
        }

        const current = districtMap.get(district) ?? { outbound: 0, inbound: 0 };
        current.outbound += Math.max(0, Number(row.departures));
        current.inbound += Math.max(0, Number(row.arrivals));
        districtMap.set(district, current);
      }
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
        .sort((left, right) => right.volume - left.volume)
        .slice(0, 10);

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

    return candidates.sort((left, right) => right.flow - left.flow).slice(0, 6);
  }, [activeInsights]);

  const selectedDistrict = selectedStationId
    ? stationDistrictMap.get(selectedStationId) ?? null
    : null;

  const selectedDistrictFlow = activeInsights?.districts.find(
    (district) => district.district === selectedDistrict
  );

  const topExporter = useMemo(() => {
    if (!activeInsights) {
      return null;
    }

    return [...activeInsights.districts].sort(
      (left, right) => right.outbound - right.inbound - (left.outbound - left.inbound)
    )[0] ?? null;
  }, [activeInsights]);

  const topImporter = useMemo(() => {
    if (!activeInsights) {
      return null;
    }

    return [...activeInsights.districts].sort(
      (left, right) => right.inbound - right.outbound - (left.inbound - left.outbound)
    )[0] ?? null;
  }, [activeInsights]);

  const dailyCurveData = useMemo(() => {
    if (!mobilityData) {
      return [] as Array<{
        day: string;
        label: string;
        demandScore: number;
        avgOccupancyRatio: number;
      }>;
    }

    return mobilityData.dailyDemand.map((row) => ({
      day: row.day,
      label: getDayLabel(row.day),
      demandScore: Number(row.demandScore),
      avgOccupancyRatio: Number(row.avgOccupancy),
    }));
  }, [mobilityData]);

  const chordNodes = useMemo(() => {
    if (!activeInsights || activeInsights.districts.length === 0) {
      return [] as Array<{ district: string; x: number; y: number }>;
    }

    const nodes = activeInsights.districts.slice(0, 6);
    const radius = 115;
    const center = 140;

    return nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
      return {
        district: node.district,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
  }, [activeInsights]);

  const chordLinks = useMemo(() => {
    if (!activeInsights || chordNodes.length === 0) {
      return [] as Array<{ origin: string; destination: string; flow: number }>;
    }

    const nodeNames = new Set(chordNodes.map((node) => node.district));

    return topRoutes
      .filter((route) => nodeNames.has(route.origin) && nodeNames.has(route.destination))
      .slice(0, 8);
  }, [activeInsights, chordNodes, topRoutes]);

  return (
    <section className="dashboard-card gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Flow analysis y demanda diaria
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Flujos por distrito inferidos desde variaciones horarias de ocupacion.
          </p>
        </div>
        {mobilityData ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="kpi-chip">Movilidad: {mobilityData.mobilityDays} dias</span>
            <span className="kpi-chip">Demanda: {mobilityData.demandDays} dias</span>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <p className="text-sm text-[var(--muted)]">Cargando insights de movilidad...</p>
      ) : errorMessage ? (
        <p className="text-sm text-[var(--muted)]">{errorMessage}</p>
      ) : !mobilityData || !activeInsights ? (
        <p className="text-sm text-[var(--muted)]">Sin datos de movilidad disponibles.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((period) => (
              <button
                key={period.key}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  activePeriod === period.key
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--accent-soft)]'
                }`}
                onClick={() => setActivePeriod(period.key)}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="stat-card">
              <p className="stat-label">Flujo total</p>
              <p className="stat-value">{activeInsights.totalFlow.toFixed(0)}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Mayor exportador</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {topExporter?.district ?? 'Sin datos'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {topExporter
                  ? `${(topExporter.outbound - topExporter.inbound).toFixed(1)} neto`
                  : 'Sin datos'}
              </p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Mayor importador</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {topImporter?.district ?? 'Sin datos'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {topImporter
                  ? `${(topImporter.inbound - topImporter.outbound).toFixed(1)} neto`
                  : 'Sin datos'}
              </p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Distrito seleccionado</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {selectedDistrict ?? 'Sin seleccion'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {selectedDistrictFlow
                  ? `${selectedDistrictFlow.outbound.toFixed(1)} salida / ${selectedDistrictFlow.inbound.toFixed(1)} entrada`
                  : 'Selecciona una estacion en el mapa'}
              </p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Matriz O-D estimada
                </p>
                <span className="text-xs text-[var(--muted)]">Top {activeInsights.districts.length}</span>
              </div>

              {activeInsights.districts.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">Sin volumen suficiente.</p>
              ) : (
                <div className="mt-3 overflow-auto">
                  <table className="min-w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-[var(--surface-soft)] px-2 py-2 text-left font-semibold text-[var(--muted)]">
                          Origen \\ Destino
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
                          <td className="sticky left-0 bg-[var(--surface-soft)] px-2 py-2 font-semibold text-[var(--foreground)]">
                            {origin.district}
                          </td>
                          {activeInsights.matrix[originIndex]?.map((value, destinationIndex) => (
                            <td
                              key={`${originIndex}-${destinationIndex}`}
                              className="border border-[var(--border)] px-2 py-2 text-right"
                              style={{
                                backgroundColor: getMatrixCellColor(value, activeInsights.maxFlow),
                                color: value / (activeInsights.maxFlow || 1) > 0.5 ? '#ffffff' : 'var(--foreground)',
                              }}
                            >
                              {value.toFixed(1)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Chord simplificado
                </p>
                <span className="text-xs text-[var(--muted)]">Rutas destacadas</span>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <svg viewBox="0 0 280 280" className="mx-auto h-[240px] w-[240px]">
                  <circle cx="140" cy="140" r="116" fill="none" stroke="rgba(255,255,255,0.08)" />
                  {chordLinks.map((link, index) => {
                    const from = chordNodes.find((node) => node.district === link.origin);
                    const to = chordNodes.find((node) => node.district === link.destination);

                    if (!from || !to) {
                      return null;
                    }

                    const controlX = 140;
                    const controlY = 140;
                    const opacity = 0.25 + Math.min(0.65, link.flow / (activeInsights.maxFlow || 1));

                    return (
                      <path
                        key={`${link.origin}-${link.destination}-${index}`}
                        d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                        fill="none"
                        stroke={`rgba(234, 6, 21, ${opacity})`}
                        strokeWidth={1.2 + (link.flow / (activeInsights.maxFlow || 1)) * 3}
                      />
                    );
                  })}
                  {chordNodes.map((node) => (
                    <g key={node.district}>
                      <circle cx={node.x} cy={node.y} r="5" fill="#ef4444" />
                      <text
                        x={node.x}
                        y={node.y - 10}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#f4d4d2"
                      >
                        {node.district.slice(0, 10)}
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="flex-1 space-y-1 text-xs text-[var(--muted)]">
                  <p className="font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
                    Top rutas estimadas
                  </p>
                  {topRoutes.length === 0 ? (
                    <p>Sin rutas destacadas para este periodo.</p>
                  ) : (
                    topRoutes.slice(0, 5).map((route) => (
                      <p key={`${route.origin}-${route.destination}`}>
                        {`${route.origin} a ${route.destination}: ${route.flow.toFixed(1)}`}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Curva diaria de demanda
              </p>
              <span className="text-xs text-[var(--muted)]">{mobilityData.demandDays} dias</span>
            </div>
            {dailyCurveData.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Sin datos de demanda diaria.</p>
            ) : (
              <>
                <div className="mt-3 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                    <AreaChart data={dailyCurveData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 213, 211, 0.24)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={14} />
                      <YAxis yAxisId="score" tick={{ fontSize: 11 }} width={42} />
                      <YAxis
                        yAxisId="occ"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        width={38}
                        tickFormatter={(value) => formatPercent(value as number)}
                      />
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
                      />
                      <Area
                        yAxisId="score"
                        type="monotone"
                        dataKey="demandScore"
                        name="Demanda"
                        stroke="#ef4444"
                        fill="rgba(239, 68, 68, 0.3)"
                        strokeWidth={2}
                      />
                      <Area
                        yAxisId="occ"
                        type="monotone"
                        dataKey="avgOccupancyRatio"
                        name="Ocupacion"
                        stroke="#14b8a6"
                        fill="rgba(20, 184, 166, 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-[var(--muted)]">{mobilityData.methodology}</p>
              </>
            )}
          </article>
        </>
      )}
    </section>
  );
}
