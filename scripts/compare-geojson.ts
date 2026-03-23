import fs from 'fs';

type DistrictFeature = {
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: { distrito: string };
};

type DistrictCollection = {
  features: DistrictFeature[];
};

const NEW_GEOJSON: DistrictCollection = JSON.parse(
  fs.readFileSync('public/data/distritos-zaragoza.geojson', 'utf-8')
);

const OLD_GEOJSON_URL =
  'https://raw.githubusercontent.com/bislai/bislai/master/mapas/distritos-ciudadanos-zaragoza.geojson';

function isPointInRing(point: [number, number], ring: number[][]): boolean {
  const [lng, lat] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-10) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!isPointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (isPointInRing(point, polygon[i])) return false;
  }
  return true;
}

function findDistrict(point: [number, number], features: DistrictFeature[]): string | null {
  for (const f of features) {
    const coords = f.geometry.coordinates;
    const isInDistrict =
      f.geometry.type === 'Polygon'
        ? isPointInPolygon(point, coords as number[][][])
        : (coords as number[][][][]).some((poly) => isPointInPolygon(point, poly));
    if (isInDistrict) return f.properties.distrito;
  }
  return null;
}

async function main() {
  console.log('Descargando GeoJSON antiguo...');
  const response = await fetch(OLD_GEOJSON_URL);
  const oldGeojson = (await response.json()) as DistrictCollection;

  console.log(`\nDistritos GeoJSON ANTIGUO (${oldGeojson.features.length}):`);
  oldGeojson.features.forEach((f) => console.log(`  - ${f.properties.distrito}`));

  console.log(`\nDistritos GeoJSON NUEVO (${NEW_GEOJSON.features.length}):`);
  NEW_GEOJSON.features.forEach((f) => console.log(`  - ${f.properties.distrito}`));

  const oldNames = new Set(oldGeojson.features.map((f) => f.properties.distrito));
  const newNames = new Set(NEW_GEOJSON.features.map((f) => f.properties.distrito));

  console.log('\n' + '='.repeat(50));
  console.log('\nDistritos que CAMBIAN de nombre:');
  for (const name of oldNames) {
    if (!newNames.has(name)) {
      console.log(`  - "${name}" ya no existe`);
    }
  }
  for (const name of newNames) {
    if (!oldNames.has(name)) {
      console.log(`  + "${name}" es nuevo`);
    }
  }

  const stations = [
    { id: '200', name: 'Actur - Celine', lon: -0.8677, lat: 41.6879 },
    { id: '210', name: 'Arrabal - Compromiso', lon: -0.8746, lat: 41.6749 },
  ];

  console.log('\n' + '='.repeat(50));
  console.log('\nEjemplo de asignación para estaciones de Actur/Arrabal:');
  for (const s of stations) {
    const oldDist = findDistrict([s.lon, s.lat], oldGeojson.features);
    const newDist = findDistrict([s.lon, s.lat], NEW_GEOJSON.features);
    console.log(`  ${s.name}:`);
    console.log(`    ANTIGUO: ${oldDist}`);
    console.log(`    NUEVO: ${newDist}`);
  }
}

main().catch(console.error);