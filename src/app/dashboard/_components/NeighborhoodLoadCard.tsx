'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { StationSnapshot } from '@/lib/api';
import {
  buildStationDistrictMap,
  fetchDistrictCollection,
  type DistrictCollection,
} from '@/lib/districts';
import { WidgetEmptyState } from './WidgetEmptyState';

type NeighborhoodLoadCardProps = {
  stations: StationSnapshot[];
};

type DistrictSlice = {
  district: string;
  stationCount: number;
};

const SLICE_BASE_RED = 234;
const SLICE_BASE_GREEN = 6;
const SLICE_BASE_BLUE = 21;

function getSliceColor(index: number, total: number): string {
  if (index === 0 || total <= 1) {
    return `rgb(${SLICE_BASE_RED}, ${SLICE_BASE_GREEN}, ${SLICE_BASE_BLUE})`;
  }

  const ratio = index / Math.max(1, total - 1);
  const alpha = 0.9 - ratio * 0.65;
  return `rgba(${SLICE_BASE_RED}, ${SLICE_BASE_GREEN}, ${SLICE_BASE_BLUE}, ${Math.max(0.2, alpha).toFixed(2)})`;
}

function getOccupancy(station: StationSnapshot): number {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}

export function NeighborhoodLoadCard({ stations }: NeighborhoodLoadCardProps) {
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadDistricts = async () => {
      try {
        const payload = await fetchDistrictCollection(controller.signal);

        if (!payload || !isActive) {
          return;
        }

        setDistricts(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Dashboard] No se pudo cargar distritos para el donut.', error);
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

  const slices = useMemo<DistrictSlice[]>(() => {
    const counter = new Map<string, number>();

    for (const feature of districts?.features ?? []) {
      const district = feature.properties?.distrito ?? 'Distrito sin nombre';
      if (!counter.has(district)) {
        counter.set(district, 0);
      }
    }

    for (const station of stations) {
      const district = stationDistrictMap.get(station.id) ?? 'Sin distrito';
      counter.set(district, (counter.get(district) ?? 0) + 1);
    }

    return Array.from(counter.entries())
      .map(([district, stationCount]) => ({ district, stationCount }))
      .sort((left, right) => {
        if (right.stationCount !== left.stationCount) {
          return right.stationCount - left.stationCount;
        }

        return left.district.localeCompare(right.district, 'es');
      });
  }, [districts, stationDistrictMap, stations]);

  const totalStations = stations.length;

  const donutSlices = useMemo(() => {
    const slicesWithStations = slices.filter((slice) => slice.stationCount > 0);

    if (totalStations <= 0 || slicesWithStations.length === 0) {
      return [] as Array<{ color: string; size: number; offset: number }>;
    }

    let currentOffset = 0;

    return slicesWithStations.map((slice, index) => {
      const size = (slice.stationCount / totalStations) * 100;
      const arc = {
        color: getSliceColor(index, slicesWithStations.length),
        size,
        offset: currentOffset,
      };
      currentOffset += size;
      return arc;
    });
  }, [slices, totalStations]);

  const avgOccupancy = useMemo(() => {
    if (stations.length === 0) {
      return 0;
    }

    return stations.reduce((sum, station) => sum + getOccupancy(station), 0) / stations.length;
  }, [stations]);

  return (
    <section className="dashboard-card h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
            Carga por barrio
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Distribucion de estaciones por distrito y ocupacion media actual de ciudad.
          </p>
        </div>
        <div className="text-right text-xs text-[var(--muted)]">
          <span>Barrios: {slices.length}</span>
          <div>
            <Link
              href="/dashboard/ayuda#estados-mapa"
              className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Como leerlo
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(234, 6, 21, 0.12)"
              strokeWidth="4"
            />
            {donutSlices.map((slice, index) => (
              <path
                key={index}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={slice.color}
                strokeDasharray={`${slice.size}, 100`}
                strokeDashoffset={`${-slice.offset}`}
                strokeLinecap="round"
                strokeWidth="4"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-[var(--foreground)]">{totalStations}</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Estaciones
            </span>
          </div>
        </div>

        <div className="max-h-44 space-y-2 overflow-y-auto pr-1 text-[11px]">
          {slices.length === 0 || totalStations === 0 ? (
            <WidgetEmptyState
              title="Sin datos de distritos"
              description="El mapa de barrios necesita el cruce entre estaciones y distritos. Si ese cruce no esta disponible, el reparto por barrio no puede calcularse."
              helpHref="/dashboard/ayuda#estados-mapa"
              helpLabel="Ver ayuda sobre barrios"
            />
          ) : (
            slices.map((slice, index) => (
              <div key={slice.district} className="flex items-center gap-2 text-[var(--foreground)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      slice.stationCount > 0
                        ? getSliceColor(index, slices.length)
                        : 'rgba(100, 116, 139, 0.45)',
                  }}
                />
                <span className="font-semibold">{slice.district}</span>
                <span className="text-[var(--muted)]">
                  ({Math.round((slice.stationCount / totalStations) * 100)}%)
                </span>
              </div>
            ))
          )}
          <p className="pt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            Ocupacion media ciudad: {Math.round(avgOccupancy * 100)}%
          </p>
        </div>
      </div>
    </section>
  );
}
