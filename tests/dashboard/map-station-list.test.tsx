// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapStationList, pickNearbyStations } from '@/app/dashboard/_components/MapStationList';
import type { StationSnapshot } from '@/lib/api-types';

function station(id: string, lat: number, bikes = 5): StationSnapshot {
  return {
    id,
    name: `Estacion ${id}`,
    lat,
    lon: -0.88,
    bikesAvailable: bikes,
    anchorsFree: 5,
    capacity: 10,
  } as unknown as StationSnapshot;
}

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return { ...actual, useLocation: () => ({ pathname: '/', publicHref: '/' }) };
});

afterEach(cleanup);

describe('MapStationList', () => {
  const stations = [station('a', 41.7), station('b', 41.65), station('c', 41.66, 0)];

  it('sorts by proximity and keeps the selected station', () => {
    const picked = pickNearbyStations(stations, { latitude: 41.65, longitude: -0.88 }, 'a', 2);
    expect(picked.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('selects a station when its button is activated', () => {
    const onSelect = vi.fn();
    render(<MapStationList stations={stations} onSelect={onSelect} />);
    expect(screen.getByText('Ver estaciones del mapa')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Estacion b/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('moves focus with arrow keys and marks the selected station', () => {
    render(<MapStationList stations={stations} selectedStationId="b" onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button', { hidden: true });
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[1].getAttribute('aria-current')).toBe('true');
  });
});
