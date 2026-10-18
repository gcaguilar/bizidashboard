import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeStatusHero } from '@/app/_components/HomeStatusHero';
import { buildNetworkBriefing } from '@/lib/network-briefing';
import { buildNetworkHealth } from '@/lib/network-health';
import { formatInteger } from '@/lib/format';
import type { CriticalDistrictCount } from '@/server-functions/home';

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const NOW = new Date('2026-04-01T12:00:00.000Z');
const LAST_UPDATED_AT = '2026-04-01T11:59:00.000Z';

function buildStations(saturatedCount: number) {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `station-${index + 1}`,
    name: `Estación ${index + 1}`,
    lat: 41.65,
    lon: -0.88,
    capacity: 24,
    bikesAvailable: index < saturatedCount ? 0 : 10,
    anchorsFree: index < saturatedCount ? 24 : 14,
    recordedAt: LAST_UPDATED_AT,
  }));
}

const briefingInput = {
  stations: buildStations(3),
  activeAlertsCount: 4,
  coverageDays: 141,
  lastUpdatedAt: LAST_UPDATED_AT,
  pipelineHealthy: true,
};

function buildHealthWithNowIso(stations: ReturnType<typeof buildStations>) {
  return buildNetworkHealth({
    stations,
    pipelineHealthy: true,
    lastUpdatedAt: LAST_UPDATED_AT,
    nowIso: NOW.toISOString(),
  });
}

const topCriticalDistricts: CriticalDistrictCount[] = [
  { name: 'Centro', slug: 'centro', criticalCount: 2 },
  { name: 'Delicias', slug: 'delicias', criticalCount: 1 },
];

describe('home status hero', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the health traffic light, the four KPI values and the citizen reading', () => {
    const briefing = buildNetworkBriefing(briefingInput);
    const health = buildHealthWithNowIso(briefingInput.stations);
    const html = renderToStaticMarkup(
      <HomeStatusHero
        briefing={briefing}
        health={health}
        bikesAvailable={148}
        anchorsFreeTotal={352}
        activeStationsCount={20}
        criticalStationsCount={3}
        topCriticalDistricts={topCriticalDistricts}
        generatedAt={LAST_UPDATED_AT}
      />
    );

    expect(health.level).toBe('yellow');
    expect(health.label).toBe('Afectaciones moderadas');
    expect(html).toContain('Afectaciones moderadas');
    expect(html).toContain('La lectura de hoy');
    expect(html).toContain(formatInteger(148));
    expect(html).toContain(formatInteger(352));
    expect(html).toContain(formatInteger(20));
    expect(html).toContain(formatInteger(3));
    expect(html).toContain(briefing.current);
    expect(html).toContain('Se concentra sobre todo en Centro y Delicias.');
    expect(html).toContain('conviene revisarlas');
    expect(html).toContain(health.description);
    expect(html).toContain('Actualizado');
    expect(html).toContain('href="/dashboard/alertas"');
    expect(html).toContain('href="/comparar"');
    expect(html).toContain('href="/metodologia"');
  });

  it('joins one and three district names naturally in the reading', () => {
    const briefing = buildNetworkBriefing(briefingInput);
    const health = buildHealthWithNowIso(briefingInput.stations);
    const baseProps = {
      briefing,
      health,
      bikesAvailable: 148,
      anchorsFreeTotal: 352,
      activeStationsCount: 20,
      criticalStationsCount: 3,
      generatedAt: LAST_UPDATED_AT,
    };

    const single = renderToStaticMarkup(
      <HomeStatusHero
        {...baseProps}
        topCriticalDistricts={[{ name: 'Centro', slug: 'centro', criticalCount: 3 }]}
      />
    );
    expect(single).toContain('Se concentra sobre todo en Centro.');

    const triple = renderToStaticMarkup(
      <HomeStatusHero
        {...baseProps}
        topCriticalDistricts={[
          { name: 'Centro', slug: 'centro', criticalCount: 2 },
          { name: 'Delicias', slug: 'delicias', criticalCount: 2 },
          { name: 'Actur', slug: 'actur', criticalCount: 1 },
        ]}
      />
    );
    expect(triple).toContain('Se concentra sobre todo en Centro, Delicias y Actur.');
  });

  it('omits the district line when no station is critical', () => {
    const stations = buildStations(0);
    const briefing = buildNetworkBriefing({ ...briefingInput, stations });
    const health = buildHealthWithNowIso(stations);
    const html = renderToStaticMarkup(
      <HomeStatusHero
        briefing={briefing}
        health={health}
        bikesAvailable={200}
        anchorsFreeTotal={280}
        activeStationsCount={20}
        criticalStationsCount={0}
        topCriticalDistricts={[]}
        generatedAt={LAST_UPDATED_AT}
      />
    );

    expect(health.level).toBe('green');
    expect(html).toContain('Red en estado óptimo');
    expect(html).toContain(briefing.current);
    expect(html).not.toContain('Se concentra');
    expect(html).not.toContain('Repartidas');
    expect(html).toContain('ninguna ahora mismo');
  });

  it('falls back to a city-wide sentence when critical stations have no districts', () => {
    const briefing = buildNetworkBriefing(briefingInput);
    const health = buildHealthWithNowIso(briefingInput.stations);
    const html = renderToStaticMarkup(
      <HomeStatusHero
        briefing={briefing}
        health={health}
        bikesAvailable={148}
        anchorsFreeTotal={352}
        activeStationsCount={20}
        criticalStationsCount={3}
        topCriticalDistricts={[]}
        generatedAt={LAST_UPDATED_AT}
      />
    );

    expect(html).toContain('Repartidas por toda la ciudad.');
    expect(html).toContain('conviene revisarlas');
  });
});
