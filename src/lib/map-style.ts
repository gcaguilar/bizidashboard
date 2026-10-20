import type { StyleSpecification } from 'react-map-gl/maplibre';

export type MapTheme = 'light' | 'dark';

/**
 * Estilo listo para `mapStyle`: una especificación local (teselas raster) o la
 * URL de un estilo vectorial alojado (MapLibre la descarga en cliente).
 */
export type MapStyle = StyleSpecification | string;

/**
 * Configuración del mapa base. Los valores por defecto no necesitan clave:
 *
 * - claro: teselas raster de OpenStreetMap.
 * - oscuro: estilo vectorial de OpenFreeMap (gratuito, sin registro).
 *
 * CARTO dejó de servir sus teselas oscuras sin clave (`a.basemaps.cartocdn.com`
 * devuelve una tesela con el texto "API KEY REQUIRED"), así que no se usa por
 * defecto. Para usar un proveedor con clave propia (CARTO, MapTiler, Stadia…)
 * basta con definir `VITE_MAP_STYLE_URL_DARK` con su URL de estilo, o
 * `VITE_MAP_TILE_URLS_DARK` para forzar teselas raster. Acepta varias URLs
 * separadas por comas para rotar subdominios.
 */
type MapEnv = {
  VITE_MAP_STYLE_URL_DARK?: string;
  VITE_MAP_TILE_URLS_LIGHT?: string;
  VITE_MAP_TILE_URLS_DARK?: string;
  VITE_MAP_TILE_ATTRIBUTION_LIGHT?: string;
  VITE_MAP_TILE_ATTRIBUTION_DARK?: string;
  VITE_MAP_GLYPHS_URL?: string;
};

const DEFAULT_LIGHT_TILES = ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];

// OpenFreeMap sirve estilos vectoriales completos (claros y oscuros) sin clave
// ni límite de peticiones. Solo usamos el oscuro: el claro sigue en OSM para no
// cambiar el aspecto del tema diurno.
export const DEFAULT_DARK_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';

// Los glifos son necesarios para la capa `symbol` que dibuja el recuento de
// estaciones dentro de cada clúster. OpenFreeMap expone "Noto Sans Regular",
// que es la fuente que usa la capa de recuento.
const DEFAULT_GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

export const MAP_FONT_STACK = ['Noto Sans Regular'];

const DEFAULT_THEME_ENV: MapEnv = {
  VITE_MAP_STYLE_URL_DARK: undefined,
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

function buildRasterStyle(
  theme: MapTheme,
  tiles: string[],
  attribution: string,
  glyphs: string
): StyleSpecification {
  const sourceId = theme === 'dark' ? 'basemapDark' : 'basemapLight';

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

export function buildMapStyle(theme: MapTheme, env: MapEnv = DEFAULT_THEME_ENV): MapStyle {
  const isDark = theme === 'dark';
  const glyphs = env.VITE_MAP_GLYPHS_URL?.trim() || DEFAULT_GLYPHS_URL;
  // Una lista de teselas explícita tiene prioridad: permite seguir usando un
  // proveedor raster con clave propia sin tocar el resto de la configuración.
  const explicitTiles = env.VITE_MAP_TILE_URLS_DARK?.trim();

  if (isDark && !explicitTiles) {
    return env.VITE_MAP_STYLE_URL_DARK?.trim() || DEFAULT_DARK_STYLE_URL;
  }

  const tiles = parseTileUrls(isDark ? explicitTiles : env.VITE_MAP_TILE_URLS_LIGHT, DEFAULT_LIGHT_TILES);
  const attribution = isDark
    ? env.VITE_MAP_TILE_ATTRIBUTION_DARK?.trim() || OSM_ATTRIBUTION
    : env.VITE_MAP_TILE_ATTRIBUTION_LIGHT?.trim() || OSM_ATTRIBUTION;

  return buildRasterStyle(theme, tiles, attribution, glyphs);
}

export function resolveMapStyle(theme: MapTheme): MapStyle {
  const env = import.meta.env as unknown as MapEnv;
  return buildMapStyle(theme, env);
}
