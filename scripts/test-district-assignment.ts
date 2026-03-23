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

const geojson: DistrictCollection = JSON.parse(
  fs.readFileSync('public/data/distritos-zaragoza.geojson', 'utf-8')
);

const stations = [
  { id: '1', name: 'Plaza del Pilar', lon: -0.8769, lat: 41.6567 },
  { id: '10', name: 'Paseo Echegaray', lon: -0.8765, lat: 41.6515 },
  { id: '20', name: 'Gran Via 27', lon: -0.8761, lat: 41.6534 },
  { id: '101', name: 'Av. Cataluña', lon: -0.8835, lat: 41.6621 },
  { id: '105', name: 'Plaza Europa', lon: -0.8902, lat: 41.6645 },
  { id: '200', name: 'Actur - Celine', lon: -0.8677, lat: 41.6879 },
  { id: '201', name: 'Actur - Bulevar', lon: -0.8707, lat: 41.6919 },
  { id: '202', name: 'Actur - Siglo XXI', lon: -0.8683, lat: 41.6929 },
  { id: '203', name: 'Actur - Fernando el Católico', lon: -0.8638, lat: 41.6846 },
  { id: '210', name: 'Arrabal - Compromiso', lon: -0.8746, lat: 41.6749 },
  { id: '211', name: 'Arrabal - San Juan', lon: -0.8723, lat: 41.6738 },
  { id: '212', name: 'Arrabal - Mayor', lon: -0.8719, lat: 41.6709 },
  { id: '301', name: 'Delicias', lon: -0.8918, lat: 41.6458 },
  { id: '302', name: 'Universidad', lon: -0.8951, lat: 41.6368 },
];

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

console.log('Asignación de estaciones a distritos:\n');
const acturStations: { id: string; name: string; lon: number; lat: number; distrito: string }[] = [];
const rabalStations: { id: string; name: string; lon: number; lat: number; distrito: string }[] = [];

for (const s of stations) {
  const distrito = findDistrict([s.lon, s.lat], geojson.features);
  console.log(`${s.id.padEnd(4)} ${s.name.padEnd(30)} -> ${distrito || 'SIN ASIGNAR'}`);
  if (distrito?.includes('Actur')) acturStations.push({ ...s, distrito });
  if (distrito?.includes('Rabal')) rabalStations.push({ ...s, distrito });
}

console.log('\n' + '='.repeat(50));
console.log(`\nEstaciones en Actur-Rey Fernando: ${acturStations.length}`);
console.log(`Estaciones en El Rabal: ${rabalStations.length}`);