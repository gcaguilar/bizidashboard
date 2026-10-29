import { describe, expect, it } from 'vitest';

import { getRecentSpotlightDistricts } from '@/jobs/social/shared';
import type { SocialContentMetadata } from '@/lib/social/types';

function deps(recent: readonly SocialContentMetadata[]) {
  return { recentContent: async () => recent };
}

describe('recent spotlight districts', () => {
  it('ignores districts that only appeared in rankings', async () => {
    const names = await getRecentSpotlightDistricts(
      deps([
        { districtNames: ['Centro', 'Delicias', 'Universidad'] },
        { spotlightDistrict: 'Delicias' },
      ])
    );

    expect(names).toEqual(['Delicias']);
  });

  it('keeps the most recent order and deduplicates case and accents', async () => {
    const names = await getRecentSpotlightDistricts(
      deps([
        { spotlightDistrict: 'Delicias' },
        { spotlightDistrict: 'Casco Histórico' },
        { spotlightDistrict: '  delicias ' },
        { spotlightDistrict: 'centro' },
      ])
    );

    expect(names).toEqual(['Delicias', 'Casco Histórico', 'centro']);
  });

  it('works without state, as in the local preview', async () => {
    expect(await getRecentSpotlightDistricts({})).toEqual([]);
  });
});
