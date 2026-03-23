import proj4 from 'proj4';
import fs from 'fs';
import path from 'path';

const EPSG_23030 = '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

const ZARAGOZA_API_URL = 'https://www.zaragoza.es/sede/servicio/distrito.geojson';

type Position = [number, number];
type Ring = Position[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Polygon | MultiPolygon;
  };
  properties: {
    title: string;
    id: number;
    [key: string]: unknown;
  };
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
  crs?: {
    type: string;
    properties: { code: number };
  };
}

function simplifyJuntaName(title: string): string {
  return title
    .replace('Junta Municipal ', '')
    .replace('Junta Vecinal ', '')
    .trim();
}

function convertPosition(coord: Position): Position {
  const [x, y] = coord;
  const result = proj4(EPSG_23030, WGS84, [x, y]);
  return [result[0], result[1]];
}

function convertRing(ring: Ring): Ring {
  return ring.map(convertPosition);
}

function convertPolygon(polygon: Polygon): Polygon {
  return polygon.map(convertRing);
}

function convertMultiPolygon(multiPoly: MultiPolygon): MultiPolygon {
  return multiPoly.map(convertPolygon);
}

function convertFeatureCoordinates(feature: Feature): Feature {
  const { geometry } = feature;
  
  if (geometry.type === 'Polygon') {
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: convertPolygon(geometry.coordinates as Polygon),
      },
    };
  }
  
  return {
    ...feature,
    geometry: {
      ...geometry,
      coordinates: convertMultiPolygon(geometry.coordinates as MultiPolygon),
    },
  };
}

async function fetchGeoJSON(): Promise<FeatureCollection> {
  console.log('Fetching GeoJSON from Ayuntamiento de Zaragoza...');
  
  const response = await fetch(ZARAGOZA_API_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  
  const data = (await response.json()) as FeatureCollection;
  console.log(`Fetched ${data.features.length} features`);
  
  return data;
}

function transformGeoJSON(data: FeatureCollection) {
  console.log('Converting coordinates from EPSG:23030 to WGS84...');
  
  const convertedFeatures = data.features.map((feature) => {
    const converted = convertFeatureCoordinates(feature);
    const simplifiedName = simplifyJuntaName(feature.properties.title);
    
    return {
      ...converted,
      properties: {
        distrito: simplifiedName,
        id: feature.properties.id,
        originalTitle: feature.properties.title,
      },
    };
  }).filter((f) => {
    const originalTitle = f.properties.originalTitle;
    if (originalTitle.includes('Junta Vecinal')) {
      console.log(`  Excluding rural: ${originalTitle}`);
      return false;
    }
    return true;
  });
  
  return {
    type: 'FeatureCollection' as const,
    features: convertedFeatures,
  };
}

async function main() {
  try {
    const outputDir = path.join(process.cwd(), 'public', 'data');
    const outputFile = path.join(outputDir, 'distritos-zaragoza.geojson');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const data = await fetchGeoJSON();
    const transformed = transformGeoJSON(data);
    
    console.log(`\nDistritos incluidos (${transformed.features.length}):`);
    transformed.features.forEach((f) => {
      console.log(`  - ${f.properties.distrito}`);
    });
    
    const acturArrabal = transformed.features.filter(
      (f) => f.properties.distrito.includes('Actur') || f.properties.distrito.includes('Rabal')
    );
    console.log('\nActur y Arrabal:');
    acturArrabal.forEach((f) => {
      console.log(`  - ${f.properties.distrito}: ${f.geometry.type}`);
    });
    
    fs.writeFileSync(outputFile, JSON.stringify(transformed, null, 2));
    console.log(`\nSaved to: ${outputFile}`);
    console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();