'use client';

import { useMemo } from 'react';
import type { AlertsResponse, RankingsResponse, StationSnapshot, StatusResponse } from '@/lib/api';

type SystemMetricsInput = {
  stations: StationSnapshot[];
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  alerts: AlertsResponse;
  status: StatusResponse;
};

function occupancyRatio(station: StationSnapshot): number {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}

export function calculateFrictionScore(emptyHours: number, fullHours: number): number {
  return Math.max(0, emptyHours) + Math.max(0, fullHours);
}

export function calculateBalanceIndex(stations: StationSnapshot[]): number {
  const valid = stations.filter((station) => Number.isFinite(station.capacity) && station.capacity > 0);

  if (valid.length === 0) {
    return 0;
  }

  const deviation = valid.reduce((sum, station) => sum + Math.abs(occupancyRatio(station) - 0.5), 0);
  return Math.max(0, Math.min(1, 1 - (2 / valid.length) * deviation));
}

export function useSystemMetrics({ stations, rankings, alerts, status }: SystemMetricsInput) {
  return useMemo(() => {
    const totalStations = stations.length;
    const bikesAvailable = stations.reduce((sum, station) => sum + Math.max(0, station.bikesAvailable), 0);
    const anchorsFree = stations.reduce((sum, station) => sum + Math.max(0, station.anchorsFree), 0);
    const avgOccupancy =
      totalStations > 0 ? stations.reduce((sum, station) => sum + occupancyRatio(station), 0) / totalStations : 0;
    const balanceIndex = calculateBalanceIndex(stations);
    const criticalStations = stations.filter(
      (station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0
    );
    const frictionRanking = rankings.availability.rankings.slice(0, 10).map((row) => ({
      ...row,
      frictionScore: calculateFrictionScore(row.emptyHours, row.fullHours),
    }));
    const topFriction = frictionRanking[0] ?? null;
    const activeAlerts = alerts.alerts.filter((alert) => alert.isActive);

    const dailyInsight = (() => {
      if (status.pipeline.healthStatus === 'down') {
        return 'El sistema necesita atencion: la ultima ingesta o la calidad de datos muestran un problema claro.';
      }

      if (criticalStations.length >= 10) {
        return 'Hay muchas estaciones en estado critico. Conviene priorizar redistribucion en las zonas mas saturadas o vacias.';
      }

      if (balanceIndex >= 0.82) {
        return 'El sistema esta bastante equilibrado ahora mismo y la ocupacion media se mueve en una zona saludable.';
      }

      if (avgOccupancy < 0.3) {
        return 'La red muestra una ocupacion media baja. Puede haber tension por falta de bicis en zonas clave.';
      }

      if (avgOccupancy > 0.7) {
        return 'La red muestra una ocupacion media alta. Puede haber riesgo de falta de anclajes en estaciones populares.';
      }

      return 'La situacion global es estable, pero conviene vigilar las estaciones con mas horas problema para evitar friccion.';
    })();

    return {
      totalStations,
      bikesAvailable,
      anchorsFree,
      avgOccupancy,
      balanceIndex,
      criticalStations,
      activeAlerts,
      frictionRanking,
      topFriction,
      dailyInsight,
    };
  }, [alerts.alerts, rankings.availability.rankings, stations, status.pipeline.healthStatus]);
}
