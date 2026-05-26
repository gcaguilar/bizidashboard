import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDistrictCollection } from '@/lib/districts.server';

describe('fetchDistrictCollection', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as Record<string, unknown>).window;
  });

  it('loads the bundled district geojson on the server runtime', async () => {
    const collection = await fetchDistrictCollection();

    expect(collection?.type).toBe('FeatureCollection');
    expect(collection?.features.length ?? 0).toBeGreaterThan(0);
  });
});
