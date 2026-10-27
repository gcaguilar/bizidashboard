import { describe, expect, it } from 'vitest';
import { buildSocialImagePath } from '@/lib/social-images';

describe('buildSocialImagePath', () => {
  it('uses the station card for station pages', () => {
    expect(buildSocialImagePath({ kind: 'station', stationId: '101' })).toBe('/api/og/station?stationId=101');
  });

  it('falls back to the network card for any other page', () => {
    expect(buildSocialImagePath({ kind: 'landing' })).toBe('/api/og/network');
    expect(buildSocialImagePath({ kind: 'station' })).toBe('/api/og/network');
  });
});
