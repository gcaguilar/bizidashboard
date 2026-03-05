'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { StationSnapshot } from '@/lib/api';
import {
  buildStationDistrictMap,
  DISTRICTS_GEOJSON_URL,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';

type HourlySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type FlowPreviewPanelProps = {
  stations: StationSnapshot[];
  hourlySignals: HourlySignalRow[];
};

type RouteRow = {
  origin: string;
  destination: string;
  flow: number;
};

export function FlowPreviewPanel({ stations, hourlySignals }: FlowPreviewPanelProps) {
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadDistricts = async () => {
      try {
        const response = await fetch(DISTRICTS_GEOJSON_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as unknown;

        if (!isDistrictCollection(payload) || !isActive) {
          return;
        }

        setDistricts(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Dashboard] No se pudo cargar distritos para preview de flujo.', error);
      }
    };

    void loadDistricts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const stationDistrictMap = useMemo(() => {
    if (!districts) {
      return new Map<string, string>();
    }

    return buildStationDistrictMap(stations, districts);
  }, [districts, stations]);

  const topRoutes = useMemo<RouteRow[]>(() => {
    if (hourlySignals.length === 0 || stationDistrictMap.size === 0) {
      return [];
    }

    const districtTotals = new Map<string, { outbound: number; inbound: number }>();

    for (const row of hourlySignals) {
      const district = stationDistrictMap.get(row.stationId);

      if (!district) {
        continue;
      }

      const current = districtTotals.get(district) ?? { outbound: 0, inbound: 0 };
      current.outbound += Math.max(0, Number(row.departures));
      current.inbound += Math.max(0, Number(row.arrivals));
      districtTotals.set(district, current);
    }

    const totalInbound = Array.from(districtTotals.values()).reduce(
      (sum, row) => sum + row.inbound,
      0
    );

    if (totalInbound <= 0) {
      return [];
    }

    const routeRows: RouteRow[] = [];

    for (const [originDistrict, values] of districtTotals.entries()) {
      if (values.outbound <= 0) {
        continue;
      }

      for (const [destinationDistrict, destinationValues] of districtTotals.entries()) {
        if (originDistrict === destinationDistrict || destinationValues.inbound <= 0) {
          continue;
        }

        routeRows.push({
          origin: originDistrict,
          destination: destinationDistrict,
          flow: values.outbound * (destinationValues.inbound / totalInbound),
        });
      }
    }

    return routeRows.sort((left, right) => right.flow - left.flow).slice(0, 4);
  }, [hourlySignals, stationDistrictMap]);

  const topFlowValue = Math.max(1, ...topRoutes.map((route) => route.flow));

  return (
    <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
      <div className="relative flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--surface-soft)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #ea0615 0%, transparent 70%)' }} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-4xl text-[var(--accent)]">◎</span>
          <p className="mt-2 text-sm font-bold text-[var(--foreground)]">Modelo de distribucion espacial</p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted)]">
            Vista simplificada de la distribucion de trayectos entre los principales barrios.
          </p>
          <Link
            href="/dashboard/flujo"
            className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            Expandir vista completa
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Corredores de alto volumen
        </h4>

        {topRoutes.length === 0 ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
            Sin datos de flujo para el periodo activo.
          </p>
        ) : (
          topRoutes.map((route) => {
            const flowPct = Math.max(8, Math.round((route.flow / topFlowValue) * 100));

            return (
              <div
                key={`${route.origin}-${route.destination}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {route.origin} → {route.destination}
                  </p>
                  <p className="text-xs font-bold text-[var(--foreground)]">{route.flow.toFixed(0)}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${flowPct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
