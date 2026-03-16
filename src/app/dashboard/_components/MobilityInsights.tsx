'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import type { StationSnapshot } from '@/lib/api';
import {
  buildStationDistrictMap,
  fetchDistrictCollection,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';
import { formatPercent } from '@/lib/format';

const PERIODS = [
  { key: 'all', label: 'Todo el dia', from: 0, to: 23 },
  { key: 'morning', label: 'Mañana', from: 6, to: 11 },
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
  selectedMonth?: string | null;
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

function isPeriodKey(value: string | null): value is PeriodKey {
  if (!value) {
    return false;
  }

  return PERIODS.some((period) => period.key === value);
}

function resolvePeriod(value: string | null): PeriodKey {
  return isPeriodKey(value) ? value : 'all';
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobilityData, setMobilityData] = useState<MobilityResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>(() =>
    resolvePeriod(searchParams.get('period'))
  );
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');
  const selectedMonth = searchParams.get('month');

  useEffect(() => {
    const periodFromUrl = resolvePeriod(searchParams.get('period'));

    setActivePeriod((current) => (current === periodFromUrl ? current : periodFromUrl));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (activePeriod === 'all') {
      if (nextParams.has('period')) {
        nextParams.delete('period');
        hasChanges = true;
      }
    } else if (nextParams.get('period') !== activePeriod) {
      nextParams.set('period', activePeriod);
      hasChanges = true;
    }

    if (!hasChanges) {
      return;
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [activePeriod, pathname, router, searchParams]);

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

        if (selectedMonth) {
          searchParams.set('month', selectedMonth);
        }

        const [mobilityResponse, districtsPayload] = await Promise.all([
          fetch(`/api/mobility?${searchParams.toString()}`, {
            signal: controller.signal,
          }),
          fetchDistrictCollection(controller.signal),
        ]);

        if (!mobilityResponse.ok || !districtsPayload) {
          throw new Error('No se pudieron cargar los datos de movilidad.');
        }

        const mobilityPayload = (await mobilityResponse.json()) as unknown;

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
  }, [demandDays, mobilityDays, selectedMonth]);

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
        .sort((left, right) => right.volume - left.volume);

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

    return candidates.sort((left, right) => right.flow - left.flow).slice(0, 12);
  }, [activeInsights]);

  const selectedDistrict = selectedStationId
    ? stationDistrictMap.get(selectedStationId) ?? null
    : null;

  useEffect(() => {
    if (!activeInsights || activeInsights.districts.length === 0) {
      setSelectedDistrictName('');
      return;
    }

    const preferredDistrict = selectedDistrict ?? activeInsights.districts[0]?.district ?? '';

    setSelectedDistrictName((current) => {
      if (current && activeInsights.districts.some((district) => district.district === current)) {
        return current;
      }

      return preferredDistrict;
    });
  }, [activeInsights, selectedDistrict]);

  const selectedDistrictFlow = activeInsights?.districts.find(
    (district) => district.district === selectedDistrictName
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

    const nodes = activeInsights.districts;
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
      .slice(0, 12);
  }, [activeInsights, chordNodes, topRoutes]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-[var(--foreground)]">
            Analisis de flujo por barrios
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Distribucion interdistrital de trayectos y metricas de balance neto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-1">
          {PERIODS.map((period) => (
            <button
              key={period.key}
              type="button"
              aria-pressed={activePeriod === period.key}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                activePeriod === period.key
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => setActivePeriod(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          Cargando insights de movilidad...
        </p>
      ) : errorMessage ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          {errorMessage}
        </p>
      ) : !mobilityData || !activeInsights ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          Sin datos de movilidad disponibles.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Diagrama chord interdistrital</h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
                  Resume de un vistazo que barrios parecen enviar o recibir mas flujo en el periodo activo. Cada nodo es un barrio y cada curva representa un corredor estimado: cuanto mas marcada, mas volumen relativo.
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <span>Barrios representados: {chordNodes.length}</span>
                <div>
                  <Link
                    href="/dashboard/ayuda#diagrama-chord"
                    className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    Como interpretarlo
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-[var(--surface-soft)] py-4">
              <svg viewBox="0 0 280 280" className="h-[260px] w-[260px]">
                <circle cx="140" cy="140" r="116" fill="none" stroke="rgba(234,6,21,0.22)" />
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
                    <circle cx={node.x} cy={node.y} r="5" fill="#ea0615" />
                    <text
                      x={node.x}
                      y={node.y - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--foreground)"
                    >
                      {node.district.slice(0, 10)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
              <span className="legend-item">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> Mayor flujo estimado
              </span>
            </div>
          </article>

          <div className="space-y-6 xl:col-span-4">
            <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">Rutas de mayor flujo</h3>
              <div className="mt-4 space-y-4">
                {topRoutes.slice(0, 4).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Sin rutas destacadas para este periodo.</p>
                ) : (
                  topRoutes.slice(0, 4).map((route) => {
                    const width = Math.max(
                      12,
                      Math.round((route.flow / (activeInsights.maxFlow || 1)) * 100)
                    );

                    return (
                      <div key={`${route.origin}-${route.destination}`} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-semibold text-[var(--foreground)]">
                            {route.origin} → {route.destination}
                          </span>
                          <span className="font-bold text-[var(--muted)]">{route.flow.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">Resumen de balance neto</h3>
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Barrio de referencia
                </label>
                <select
                  value={selectedDistrictName}
                  onChange={(event) => setSelectedDistrictName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                >
                  {activeInsights.districts.map((district) => (
                    <option key={district.district} value={district.district}>
                      {district.district}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Cambia el barrio para revisar su saldo neto sin depender de la estacion seleccionada.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-500">Mayor emisor</p>
                  <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                    {topExporter?.district ?? 'N/D'}
                  </p>
                  <p className="text-xl font-black text-rose-500">
                    {topExporter
                      ? `-${Math.max(0, topExporter.outbound - topExporter.inbound).toFixed(0)}`
                      : '0'}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-500">
                    Mayor receptor
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                    {topImporter?.district ?? 'N/D'}
                  </p>
                  <p className="text-xl font-black text-emerald-500">
                    {topImporter
                      ? `+${Math.max(0, topImporter.inbound - topImporter.outbound).toFixed(0)}`
                      : '0'}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--muted)]">
                {selectedDistrictFlow ? (
                  <>
                    <span className="font-semibold text-[var(--foreground)]">{selectedDistrictName}</span>
                    {`: ${selectedDistrictFlow.net >= 0 ? '+' : ''}${selectedDistrictFlow.net.toFixed(1)} de balance neto, ${selectedDistrictFlow.inbound.toFixed(0)} entradas estimadas y ${selectedDistrictFlow.outbound.toFixed(0)} salidas estimadas.`}
                  </>
                ) : (
                  'No hay un barrio de referencia disponible para este periodo.'
                )}
              </div>
            </article>
          </div>

          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-6">
            <h3 className="text-base font-bold text-[var(--foreground)]">Balance neto por barrio</h3>
            <div className="mt-4 space-y-5">
              {activeInsights.districts.map((district) => {
                const net = district.net;
                const maxMagnitude = Math.max(1, district.volume);
                const width = Math.min(50, (Math.abs(net) / maxMagnitude) * 100);
                const isImporter = net >= 0;

                return (
                  <div key={district.district}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--foreground)]">{district.district}</span>
                      <span className={`font-black ${isImporter ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {net >= 0 ? '+' : ''}
                        {net.toFixed(1)}
                      </span>
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-black/20">
                      {isImporter ? (
                        <div
                          className="absolute left-1/2 h-full rounded-r-full bg-emerald-500"
                          style={{ width: `${width}%` }}
                        />
                      ) : (
                        <div
                          className="absolute right-1/2 h-full rounded-l-full bg-rose-500"
                          style={{ width: `${width}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              <span>Emisor neto</span>
              <span>Neutro</span>
              <span>Receptor neto</span>
            </div>
          </article>

          <article className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--foreground)]">Matriz origen-destino</h3>
              <span className="text-[10px] text-[var(--muted)]">Datos en vivo</span>
            </div>

            {activeInsights.districts.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Sin volumen suficiente.</p>
            ) : (
              <div className="mt-3 overflow-auto">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-[var(--surface)] px-2 py-2 text-left font-semibold text-[var(--muted)]">
                        O \ D
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
                        <td className="sticky left-0 bg-[var(--surface)] px-2 py-2 font-semibold text-[var(--foreground)]">
                          {origin.district}
                        </td>
                        {activeInsights.matrix[originIndex]?.map((value, destinationIndex) => (
                          <td
                            key={`${originIndex}-${destinationIndex}`}
                            className="border border-[var(--border)] px-2 py-2 text-right"
                            style={{
                              backgroundColor: getMatrixCellColor(value, activeInsights.maxFlow),
                              color:
                                value / (activeInsights.maxFlow || 1) > 0.5
                                  ? '#ffffff'
                                  : 'var(--foreground)',
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

          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:col-span-12">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Curva diaria de demanda</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Muestra como cambia la actividad diaria y la ocupacion media en el periodo activo.
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <span>{mobilityData.demandDays} dias</span>
                <div>
                  <Link
                    href="/dashboard/ayuda#demanda-no-viajes-reales"
                    className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    Entender curva
                  </Link>
                </div>
              </div>
            </div>
            {dailyCurveData.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Sin datos de demanda diaria.</p>
            ) : (
              <>
                <ChartWrapper height="h-[260px]">
                  <div className="mt-3 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                      <AreaChart data={dailyCurveData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(234, 6, 21, 0.22)" />
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
                            value: number | string | ReadonlyArray<number | string> | undefined,
                            name: string | number | undefined
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
                          stroke="#ea0615"
                          fill="rgba(234, 6, 21, 0.26)"
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
                </ChartWrapper>
                <p className="text-[11px] text-[var(--muted)]">{mobilityData.methodology}</p>
              </>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
