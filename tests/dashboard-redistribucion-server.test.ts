import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { fetchDistrictCollectionMock } = vi.hoisted(() => ({
  fetchDistrictCollectionMock: vi.fn(),
}));

vi.mock('@/lib/districts.server', () => ({
  fetchDistrictCollection: fetchDistrictCollectionMock,
}));

import { loadDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion.server';

describe('dashboard redistribucion server data', () => {
  beforeEach(() => {
    fetchDistrictCollectionMock.mockReset();
  });

  it('returns only the table params and the sorted district names', async () => {
    fetchDistrictCollectionMock.mockResolvedValue({
      features: [
        { properties: { distrito: 'Delicias' } },
        { properties: { distrito: 'Centro' } },
        { properties: { distrito: 'Centro' } },
        { properties: { distrito: null } },
        { properties: {} },
      ],
    });

    const data = await loadDashboardRebalancingPageData({ page: 2, pageSize: 25 });

    // El loader no promete un informe: el cliente lo pide al montar.
    expect(Object.keys(data).sort()).toEqual(['districtNames', 'tableParams']);
    expect(data.districtNames).toEqual(['Centro', 'Delicias']);
    expect(data.tableParams).toEqual({
      sort: undefined,
      filter: undefined,
      search: undefined,
      page: 2,
      pageSize: 25,
    });
  });

  it('degrades to an empty district list when the geojson is unavailable', async () => {
    fetchDistrictCollectionMock.mockRejectedValue(new Error('no geojson'));

    const data = await loadDashboardRebalancingPageData(undefined);

    expect(data.districtNames).toEqual([]);
    expect(data.tableParams).toEqual({
      sort: undefined,
      filter: undefined,
      search: undefined,
      page: undefined,
      pageSize: undefined,
    });
  });
});
