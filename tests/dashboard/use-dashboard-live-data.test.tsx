// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: vi.fn(),
}));

import { useDashboardLiveData } from '@/app/dashboard/_components/useDashboardLiveData';
import type { DashboardInitialData } from '@/app/dashboard/_components/DashboardClient';
import type { RankingsResponse, StationsResponse } from '@/lib/api-types';
import {
  buildFallbackDatasetSnapshot,
  buildFallbackStations,
  buildFallbackStatus,
} from '@/lib/shared-data-fallbacks';

function makeEmptyRanking(type: 'turnover' | 'availability', nowIso: string): RankingsResponse {
  return {
    type,
    limit: 50,
    rankings: [],
    districtSpotlight: [],
    generatedAt: nowIso,
    dataState: 'no_coverage',
  };
}

function makeInitialData(nowIso = new Date().toISOString()): DashboardInitialData {
  return {
    dataset: buildFallbackDatasetSnapshot(nowIso),
    stations: buildFallbackStations(nowIso),
    status: buildFallbackStatus(nowIso),
    alerts: { limit: 20, alerts: [], generatedAt: nowIso },
    rankings: {
      turnover: makeEmptyRanking('turnover', nowIso),
      availability: makeEmptyRanking('availability', nowIso),
    },
  };
}

describe('useDashboardLiveData', () => {
  let queryClient: QueryClient;
  const fetchMock = vi.fn();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('serves loader data without firing any request on mount', () => {
    const initialData = makeInitialData();
    const { result, unmount } = renderHook(() => useDashboardLiveData(initialData), { wrapper });

    expect(result.current.data.stations).toEqual(initialData.stations);
    expect(result.current.data.alerts).toEqual(initialData.alerts);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.nextRefreshAt.getTime()).toBeGreaterThan(Date.now());
    expect(fetchMock).not.toHaveBeenCalled();

    unmount();
  });

  it('keeps the previous value per resource when a refetch partially fails', async () => {
    const initialData = makeInitialData();
    const freshStations: StationsResponse = {
      stations: [
        {
          id: 'st-1',
          name: 'Estación nueva',
          lat: 41.65,
          lon: -0.88,
          capacity: 20,
          bikesAvailable: 5,
          anchorsFree: 15,
          recordedAt: new Date().toISOString(),
        },
      ],
      generatedAt: new Date().toISOString(),
      dataState: 'ok',
    };

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/stations')) {
        return Promise.resolve(new Response(JSON.stringify(freshStations), { status: 200 }));
      }
      return Promise.resolve(new Response('rate limited', { status: 429, headers: { 'Retry-After': '120' } }));
    });

    const { result, unmount } = renderHook(() => useDashboardLiveData(initialData), { wrapper });

    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'live'] });
    });

    await waitFor(() => {
      expect(result.current.data.stations.stations[0]?.id).toBe('st-1');
    });

    expect(result.current.data.alerts).toEqual(initialData.alerts);
    expect(result.current.data.rankings).toEqual(initialData.rankings);
    expect(result.current.data.status).toEqual(initialData.status);

    unmount();
  });

  it('pushes the next refresh beyond Retry-After when every request is rate limited', async () => {
    const initialData = makeInitialData();

    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response('rate limited', { status: 429, headers: { 'Retry-After': '300' } }))
    );

    const { result, unmount } = renderHook(() => useDashboardLiveData(initialData), { wrapper });

    const before = Date.now();
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['dashboard', 'live'] });
    });

    await waitFor(() => {
      expect(result.current.nextRefreshAt.getTime()).toBeGreaterThanOrEqual(before + 300_000);
    });
    expect(result.current.data.stations).toEqual(initialData.stations);

    unmount();
  });
});
