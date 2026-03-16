import { getCachedJson, setCachedJson } from '@/lib/cache/cache';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type GeoSearchResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: 'address' | 'place' | 'station';
};

export type GeoReverseResult = {
  address: string;
  city: string;
  district?: string;
  lat: number;
  lon: number;
};

export async function searchLocations(
  query: string,
  limit = 10,
  locale = 'es'
): Promise<GeoSearchResult[]> {
  const cacheKey = `geo:search:${query}:${limit}:${locale}`;
  
  const cached = await getCachedJson<GeoSearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('accept-language', locale);
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'BiziDashboard/1.0 (contact@example.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      neighbourhood?: string;
      suburb?: string;
    };
  }>;

  const results: GeoSearchResult[] = data.map((item) => ({
    id: String(item.place_id),
    name: item.display_name.split(',')[0] || item.display_name,
    address: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type === 'house' || item.type === 'building' ? 'address' : 'place',
  }));

  await setCachedJson(cacheKey, results, CACHE_TTL_SECONDS);

  return results;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  locale = 'es'
): Promise<GeoReverseResult> {
  const cacheKey = `geo:reverse:${lat.toFixed(4)}:${lon.toFixed(4)}:${locale}`;
  
  const cached = await getCachedJson<GeoReverseResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');
  url.searchParams.set('accept-language', locale);
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'BiziDashboard/1.0 (contact@example.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    display_name: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      neighbourhood?: string;
      suburb?: string;
    };
  };

  const city = data.address?.city || data.address?.town || data.address?.village || '';
  const district = data.address?.neighbourhood || data.address?.suburb;

  const result: GeoReverseResult = {
    address: data.display_name,
    city,
    district,
    lat,
    lon,
  };

  await setCachedJson(cacheKey, result, CACHE_TTL_SECONDS);

  return result;
}
