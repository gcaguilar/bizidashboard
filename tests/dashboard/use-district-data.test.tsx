import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDistrictData, useDistrictMap } from '@/app/dashboard/_components/useDistrictData';

vi.mock('@/lib/districts', () => ({
  fetchDistrictCollection: vi.fn(),
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: vi.fn(),
}));

import { fetchDistrictCollection } from '@/lib/districts';
import type { DistrictCollection } from '@/lib/districts';

const mockDistricts: DistrictCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: '1',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
      properties: { distrito: 'Centro' },
    },
    {
      type: 'Feature',
      id: '2',
      geometry: { type: 'Polygon', coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]] },
      properties: { distrito: 'Delicias' },
    },
  ],
};

describe('useDistrictData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('loads districts on mount', async () => {
    vi.mocked(fetchDistrictCollection).mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useDistrictData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchDistrictCollection).toHaveBeenCalled();
    expect(result.current.districts).toEqual(mockDistricts);
  });

  it('sets loading state initially', () => {
    vi.mocked(fetchDistrictCollection).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useDistrictData());

    expect(result.current.loading).toBe(true);
  });

  it('sets error on fetch failure', async () => {
    const error = new Error('Network error');
    vi.mocked(fetchDistrictCollection).mockRejectedValue(error);

    const { result } = renderHook(() => useDistrictData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error);
  });

  it('refetch clears data and reloads', async () => {
    vi.mocked(fetchDistrictCollection).mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useDistrictData());

    await waitFor(() => {
      expect(result.current.districts).toEqual(mockDistricts);
    });

    const newDistricts = { ...mockDistricts, features: [] };
    vi.mocked(fetchDistrictCollection).mockResolvedValue(newDistricts);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.districts).toEqual(newDistricts);
    });
  });

  it('respects immediate: false option', () => {
    vi.mocked(fetchDistrictCollection).mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useDistrictData({ immediate: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.districts).toBeNull();
    expect(fetchDistrictCollection).not.toHaveBeenCalled();
  });

  it('respects enabled: false option', async () => {
    vi.mocked(fetchDistrictCollection).mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useDistrictData({ enabled: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchDistrictCollection).not.toHaveBeenCalled();
  });
});

describe('useDistrictMap', () => {
  it('builds map from districts', () => {
    const { result } = renderHook(() => useDistrictMap(mockDistricts));

    expect(result.current).toBeInstanceOf(Map);
    expect(result.current?.get('1')).toBe('Centro');
    expect(result.current?.get('2')).toBe('Delicias');
  });

  it('returns null when districts is null', () => {
    const { result } = renderHook(() => useDistrictMap(null));

    expect(result.current).toBeNull();
  });

  it('returns null when districts is empty', () => {
    const emptyCollection: DistrictCollection = { type: 'FeatureCollection', features: [] };
    const { result } = renderHook(() => useDistrictMap(emptyCollection));

    expect(result.current).toBeInstanceOf(Map);
    expect(result.current?.size).toBe(0);
  });
});