import { describe, expect, it } from 'vitest';
import { fetchDistrictCollection } from '@/lib/districts';

describe('fetchDistrictCollection', () => {
  it('loads the bundled district geojson on the server runtime', async () => {
    const collection = await fetchDistrictCollection();

    expect(collection?.type).toBe('FeatureCollection');
    expect(collection?.features.length ?? 0).toBeGreaterThan(0);
  });
});
