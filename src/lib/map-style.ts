import type { StyleSpecification } from 'react-map-gl/maplibre';

export type MapTheme = 'light' | 'dark';

/**
 * Configuración de teselas del mapa. Los valores por defecto evitan el servicio
 * raster 1× sin política de producción de OSM:
 *
 * - claro: teselas de OpenStreetMap (degradado razonable, sin clave).
 * - oscuro: teselas oscuras reales de CARTO (`@2x` → soporte retina), no una
 *   copia de la fuente clara como ocurría antes.
 *
 * En producción conviene fijar un proveedor con clave propia (MapTiler, Stadia,
 * Protomaps…) mediante las variables `VITE_MAP_TILE_URLS_*`, ya contempladas en
 * `connect-src`/`img-src` de la CSP. Acepta varias URLs separadas por comas para
 * rotar subdominios.
 */
type MapEnv = {
  VITE_MAP_TILE_URLS_LIGHT?: string;
  VITE_MAP_TILE_URLS_DARK?: string;
  VITE_MAP_TILE_ATTRIBUTION_LIGHT?: string;
  VITE_MAP_TILE_ATTRIBUTION_DARK?: string;
  VITE_MAP_GLYPHS_URL?: string;
};

const DEFAULT_LIGHT_TILES = ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
const DEFAULT_DARK_TILES = [
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
];

const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const DARK_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';

// Los glifos son necesarios para la capa `symbol` que dibuja el recuento de
// estaciones dentro de cada clúster.
const DEFAULT_GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

const DEFAULT_THEME_ENV: MapEnv = {
  VITE_MAP_TILE_URLS_LIGHT: undefined,
  VITE_MAP_TILE_URLS_DARK: undefined,
  VITE_MAP_TILE_ATTRIBUTION_LIGHT: undefined,
  VITE_MAP_TILE_ATTRIBUTION_DARK: undefined,
  VITE_MAP_GLYPHS_URL: undefined,
};

function parseTileUrls(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) {
    return fallback;
  }

  const urls = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return urls.length > 0 ? urls : fallback;
}

export function buildMapStyle(theme: MapTheme, env: MapEnv = DEFAULT_THEME_ENV): StyleSpecification {
  const isDark = theme === 'dark';
  const tiles = parseTileUrls(
    isDark ? env.VITE_MAP_TILE_URLS_DARK : env.VITE_MAP_TILE_URLS_LIGHT,
    isDark ? DEFAULT_DARK_TILES : DEFAULT_LIGHT_TILES
  );
  const attribution = isDark
    ? env.VITE_MAP_TILE_ATTRIBUTION_DARK?.trim() || DARK_ATTRIBUTION
    : env.VITE_MAP_TILE_ATTRIBUTION_LIGHT?.trim() || OSM_ATTRIBUTION;
  const glyphs = env.VITE_MAP_GLYPHS_URL?.trim() || DEFAULT_GLYPHS_URL;
  const sourceId = isDark ? 'basemapDark' : 'basemapLight';

  return {
    version: 8,
    glyphs,
    sources: {
      [sourceId]: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: sourceId,
        type: 'raster',
        source: sourceId,
      },
    ],
  };
}

export function resolveMapStyle(theme: MapTheme): StyleSpecification {
  const env = import.meta.env as unknown as MapEnv;
  return buildMapStyle(theme, env);
}
