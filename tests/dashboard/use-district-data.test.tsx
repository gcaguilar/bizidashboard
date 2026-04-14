import { describe, expect, it, vi, beforeEach } from 'vitest';

const { fetchDistrictCollectionMock, captureExceptionWithContextMock } = vi.hoisted(() => ({
  fetchDistrictCollectionMock: vi.fn(),
  captureExceptionWithContextMock: vi.fn(),
}));

vi.mock('@/lib/districts', () => ({
  fetchDistrictCollection: fetchDistrictCollectionMock,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useMemo: vi.fn((fn) => fn()),
  };
});

import { useDistrictMap } from '@/app/dashboard/_components/useDistrictData';
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

describe('useDistrictMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds map from districts', () => {
    const result = useDistrictMap(mockDistricts);

    expect(result).toBeInstanceOf(Map);
    expect(result?.get('1')).toBe('Centro');
    expect(result?.get('2')).toBe('Delicias');
  });

  it('returns null when districts is null', () => {
    const result = useDistrictMap(null);

    expect(result).toBeNull();
  });

  it('returns empty map when districts is empty', () => {
    const emptyCollection: DistrictCollection = { type: 'FeatureCollection', features: [] };
    const result = useDistrictMap(emptyCollection);

    expect(result).toBeInstanceOf(Map);
    expect(result?.size).toBe(0);
  });

  it('uses distrito as key when id is not present', () => {
    const districtsWithoutId: DistrictCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
          properties: { distrito: 'Centro' },
        },
      ],
    };

    const result = useDistrictMap(districtsWithoutId);

    expect(result?.get('Centro')).toBe('Centro');
  });
});