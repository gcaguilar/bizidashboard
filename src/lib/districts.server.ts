import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DISTRICTS_GEOJSON_URL, isDistrictCollection, type DistrictCollection } from '@/lib/districts';
import { parseJsonWithGuard } from '@/lib/json';

let districtCollectionCache: DistrictCollection | null = null;
let districtCollectionPromise: Promise<DistrictCollection | null> | null = null;

async function loadDistrictCollectionFromFile(): Promise<DistrictCollection | null> {
  const geoJsonPath = path.join(
    process.cwd(),
    'public',
    DISTRICTS_GEOJSON_URL.replace(/^\/+/, '')
  );
  return parseJsonWithGuard(await readFile(geoJsonPath, 'utf8'), isDistrictCollection);
}

export async function fetchDistrictCollection(): Promise<DistrictCollection | null> {
  if (districtCollectionCache) {
    return districtCollectionCache;
  }

  if (!districtCollectionPromise) {
    districtCollectionPromise = loadDistrictCollectionFromFile()
      .then((collection) => {
        districtCollectionCache = collection;
        return collection;
      })
      .catch((error) => {
        districtCollectionPromise = null;
        throw error;
      });
  }

  return districtCollectionPromise;
}
