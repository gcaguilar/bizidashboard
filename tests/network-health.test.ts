import { describe, expect, it } from 'vitest';
import type { StationSnapshot } from '@/lib/api-types';
import {
  buildNetworkHealth,
  hasNoAvailability,
  NETWORK_HEALTH_THRESHOLDS,
} from '@/lib/network-health';

const NOW_ISO = '2026-04-01T12:00:00.000Z';
const UPDATED_A_MINUTE_AGO = '2026-04-01T11:59:00.000Z';
const UPDATED_31_MINUTES_AGO = '2026-04-01T11:29:00.000Z';
const UPDATED_29_MINUTES_AGO = '2026-04-01T11:31:00.000Z';
const UPDATED_30_MINUTES_AGO = '2026-04-01T11:30:00.000Z';

function station(overrides: Partial<StationSnapshot> = {}): StationSnapshot {
  return {
    id: 'station-1',
    name: 'Plaza Aragón',
    lat: 0,
    lon: 0,
    capacity: 20,
    bikesAvailable: 10,
    anchorsFree: 10,
    recordedAt: UPDATED_A_MINUTE_AGO,
    ...overrides,
  };
}

function buildStations(saturatedCount: number, totalCount: number): StationSnapshot[] {
  return Array.from({ length: totalCount }, (_, index) =>
    station({
      id: `station-${index + 1}`,
      name: `Estación ${index + 1}`,
      bikesAvailable: index < saturatedCount ? 0 : 10,
      anchorsFree: index < saturatedCount ? 0 : 10,
    })
  );
}

describe('network health', () => {
  it('marks a station as saturated when it has no bikes or no free anchors', () => {
    expect(hasNoAvailability(station({ bikesAvailable: 0, anchorsFree: 5 }))).toBe(true);
    expect(hasNoAvailability(station({ bikesAvailable: 5, anchorsFree: 0 }))).toBe(true);
    expect(hasNoAvailability(station())).toBe(false);
  });

  it('stays green with a low share of stations without availability', () => {
    const health = buildNetworkHealth({
      stations: buildStations(2, 20),
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_A_MINUTE_AGO,
      nowIso: NOW_ISO,
    });

    expect(health.level).toBe('green');
    expect(health.label).toBe('Red en estado óptimo');
    expect(health.unavailableShare).toBe(0.1);
    expect(health.criticalStationsCount).toBe(2);
    expect(health.totalStations).toBe(20);
    expect(health.description).toBe('2 de 20 estaciones sin bicis o sin huecos libres (10%)');
  });

  it('turns yellow exactly at the green threshold', () => {
    const health = buildNetworkHealth({
      stations: buildStations(3, 20),
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_A_MINUTE_AGO,
      nowIso: NOW_ISO,
    });

    expect(health.unavailableShare).toBeGreaterThanOrEqual(NETWORK_HEALTH_THRESHOLDS.greenUnavailableShare);
    expect(health.level).toBe('yellow');
    expect(health.label).toBe('Afectaciones moderadas');
    expect(health.description).toContain('3 de 20 estaciones sin bicis o sin huecos libres (15%)');
  });

  it('turns red exactly at the red threshold', () => {
    const health = buildNetworkHealth({
      stations: buildStations(7, 20),
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_A_MINUTE_AGO,
      nowIso: NOW_ISO,
    });

    expect(health.unavailableShare).toBeGreaterThanOrEqual(NETWORK_HEALTH_THRESHOLDS.redUnavailableShare);
    expect(health.level).toBe('red');
    expect(health.label).toBe('Incidencia generalizada');
    expect(health.description).toContain('7 de 20 estaciones sin bicis o sin huecos libres (35%)');
  });

  it('turns red when the pipeline is down even without saturated stations', () => {
    const health = buildNetworkHealth({
      stations: buildStations(0, 20),
      pipelineHealthy: false,
      lastUpdatedAt: UPDATED_A_MINUTE_AGO,
      nowIso: NOW_ISO,
    });

    expect(health.level).toBe('red');
    expect(health.description).toContain('0 de 20 estaciones sin bicis o sin huecos libres (0%)');
    expect(health.description).toContain('la recogida de datos no está funcionando');
  });

  it('turns red with stale data but stays green just below the limit', () => {
    const stale = buildNetworkHealth({
      stations: buildStations(0, 20),
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_31_MINUTES_AGO,
      nowIso: NOW_ISO,
    });

    expect(stale.level).toBe('red');
    expect(stale.description).toContain('la última actualización fue hace más de 30 minutos');

    const fresh = buildNetworkHealth({
      stations: buildStations(0, 20),
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_29_MINUTES_AGO,
      nowIso: NOW_ISO,
    });

    expect(fresh.level).toBe('green');

    const atTheExactLimit = buildNetworkHealth({
      stations: buildStations(0, 20),
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_30_MINUTES_AGO,
      nowIso: NOW_ISO,
    });

    expect(atTheExactLimit.level).toBe('green');
  });

  it('ignores staleness when there is no lastUpdatedAt', () => {
    const health = buildNetworkHealth({
      stations: buildStations(2, 20),
      pipelineHealthy: true,
      lastUpdatedAt: null,
      nowIso: NOW_ISO,
    });

    expect(health.level).toBe('green');
    expect(health.description).not.toContain('la última actualización fue');
  });

  it('reports unknown health without stations, regardless of the pipeline', () => {
    const withHealthyPipeline = buildNetworkHealth({
      stations: [],
      pipelineHealthy: true,
      lastUpdatedAt: UPDATED_A_MINUTE_AGO,
      nowIso: NOW_ISO,
    });
    const withBrokenPipeline = buildNetworkHealth({
      stations: [],
      pipelineHealthy: false,
      lastUpdatedAt: null,
      nowIso: NOW_ISO,
    });

    for (const health of [withHealthyPipeline, withBrokenPipeline]) {
      expect(health.level).toBe('unknown');
      expect(health.label).toBe('Sin datos ahora mismo');
      expect(health.description).toBe('Todavía no hay estaciones con datos para evaluar la red.');
      expect(health.unavailableShare).toBe(0);
      expect(health.criticalStationsCount).toBe(0);
      expect(health.totalStations).toBe(0);
    }
  });
});
