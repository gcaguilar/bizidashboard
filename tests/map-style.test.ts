import { describe, expect, it } from 'vitest';
import { buildMapStyle } from '@/lib/map-style';

type RasterSource = { tiles?: string[]; attribution?: string };

function firstSource(style: ReturnType<typeof buildMapStyle>): RasterSource {
  return Object.values(style.sources)[0] as RasterSource;
}

describe('buildMapStyle', () => {
  it('uses a genuinely different basemap for the dark theme', () => {
    const light = firstSource(buildMapStyle('light'));
    const dark = firstSource(buildMapStyle('dark'));

    expect(light.tiles?.[0]).toContain('tile.openstreetmap.org');
    expect(dark.tiles?.[0]).toContain('basemaps.cartocdn.com');
    expect(dark.tiles?.[0]).not.toBe(light.tiles?.[0]);
  });

  it('serves retina tiles and exposes glyphs for the cluster count layer', () => {
    const dark = buildMapStyle('dark');

    expect(firstSource(dark).tiles?.join(',')).toContain('@2x');
    expect(dark.glyphs).toContain('{fontstack}');
  });

  it('honours comma-separated tile urls from configuration', () => {
    const style = buildMapStyle('dark', {
      VITE_MAP_TILE_URLS_DARK:
        'https://tiles.example.com/a/{z}/{x}/{y}.png, https://tiles.example.com/b/{z}/{x}/{y}.png',
    });

    expect(firstSource(style).tiles).toHaveLength(2);
  });
});
