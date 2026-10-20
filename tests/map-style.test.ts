import { describe, expect, it } from 'vitest';
import { DEFAULT_DARK_STYLE_URL, buildMapStyle, type MapStyle } from '@/lib/map-style';

type RasterSource = { tiles?: string[]; attribution?: string };

function rasterSource(style: MapStyle): RasterSource {
  if (typeof style === 'string') {
    throw new Error(`Se esperaba un estilo raster, se recibio la URL ${style}`);
  }

  return Object.values(style.sources)[0] as RasterSource;
}

describe('buildMapStyle', () => {
  it('keeps the raster OpenStreetMap basemap for the light theme', () => {
    const style = buildMapStyle('light');

    expect(rasterSource(style).tiles?.[0]).toContain('tile.openstreetmap.org');
    expect(typeof style).not.toBe('string');
  });

  it('uses a key-free vector style for the dark theme', () => {
    const style = buildMapStyle('dark');

    expect(style).toBe(DEFAULT_DARK_STYLE_URL);
    expect(DEFAULT_DARK_STYLE_URL).toContain('tiles.openfreemap.org');
    expect(DEFAULT_DARK_STYLE_URL).not.toContain('cartocdn');
  });

  it('exposes glyphs the cluster count layer can resolve', () => {
    const light = buildMapStyle('light');

    if (typeof light === 'string') {
      throw new Error('El tema claro debe seguir siendo raster');
    }

    expect(light.glyphs).toContain('{fontstack}');
    expect(light.glyphs).toContain('openfreemap');
  });

  it('honours a custom dark style url from configuration', () => {
    const style = buildMapStyle('dark', {
      VITE_MAP_STYLE_URL_DARK: 'https://tiles.example.com/styles/dark',
    });

    expect(style).toBe('https://tiles.example.com/styles/dark');
  });

  it('falls back to configurable raster tiles when given explicitly', () => {
    const style = buildMapStyle('dark', {
      VITE_MAP_TILE_URLS_DARK:
        'https://tiles.example.com/a/{z}/{x}/{y}.png, https://tiles.example.com/b/{z}/{x}/{y}.png',
      VITE_MAP_TILE_ATTRIBUTION_DARK: '&copy; Example',
    });

    expect(rasterSource(style).tiles).toHaveLength(2);
    expect(rasterSource(style).attribution).toBe('&copy; Example');
  });
});
