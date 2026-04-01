import type { StationSnapshot } from '@/lib/api';
import type { DataState } from '@/lib/data-state';
import { buildStationDistrictMap, type DistrictCollection } from '@/lib/districts';

export const PERIODS = [
  { key: 'all', label: 'Todo el dia', from: 0, to: 23 },
  { key: 'morning', label: 'Mañana', from: 6, to: 11 },
  { key: 'midday', label: 'Mediodia', from: 12, to: 16 },
  { key: 'evening', label: 'Tarde', from: 17, to: 21 },
  { key: 'night', label: 'Noche', from: 22, to: 5 },
] as const;

export type PeriodKey = (typeof PERIODS)[number]['key'];

export type MobilitySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

export type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

export type MobilityResponse = {
  mobilityDays: number;
  demandDays: number;
  selectedMonth?: string | null;
  methodology: string;
  hourlySignals: MobilitySignalRow[];
  dailyDemand: DailyDemandRow[];
  generatedAt: string;
  dataState?: DataState;
};

export type DistrictTotals = {
  district: string;
  outbound: number;
  inbound: number;
  volume: number;
  net: number;
};

export type PeriodInsights = {
  key: PeriodKey;
  label: string;
  districts: DistrictTotals[];
  matrix: number[][];
  maxFlow: number;
  totalFlow: number;
};

export type RouteSummary = {
  origin: string;
  destination: string;
  flow: number;
};

export type ChordNode = {
  district: string;
  x: number;
  y: number;
};

export type DailyCurvePoint = {
  day: string;
  label: string;
  demandScore: number;
  avgOccupancyRatio: number;
};

export function getPeriodByHour(hour: number): PeriodKey {
  if (hour >= 6 && hour <= 11) {
    return 'morning';
  }

  if (hour >= 12 && hour <= 16) {
    return 'midday';
  }

  if (hour >= 17 && hour <= 21) {
    return 'evening';
  }

  return 'night';
}

export function isPeriodKey(value: string | null): value is PeriodKey {
  if (!value) {
    return false;
  }

  return PERIODS.some((period) => period.key === value);
}

export function resolvePeriod(value: string | null): PeriodKey {
  return isPeriodKey(value) ? value : 'all';
}

export function getDayLabel(day: string): string {
  if (typeof day !== 'string' || day.length < 10) {
    return day;
  }

  const month = day.slice(5, 7);
  const date = day.slice(8, 10);
  return `${date}/${month}`;
}

export function getMatrixCellColor(value: number, maxValue: number): string {
  if (!Number.isFinite(value) || value <= 0 || maxValue <= 0) {
    return 'rgba(176, 129, 135, 0.16)';
  }

  const ratio = Math.min(1, Math.max(0, value / maxValue));
  return `rgba(234, 6, 21, ${0.2 + ratio * 0.72})`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isMobilityResponse(value: unknown): value is MobilityResponse {
  return (
    isObject(value) &&
    typeof value.methodology === 'string' &&
    typeof value.generatedAt === 'string' &&
    Array.isArray(value.hourlySignals) &&
    Array.isArray(value.dailyDemand)
  );
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function buildStationDistrictLookup(
  stations: StationSnapshot[],
  districts: DistrictCollection | null
): Map<string, string> {
  if (!districts) {
    return new Map<string, string>();
  }

  return buildStationDistrictMap(stations, districts);
}

export function buildPeriodInsights(
  mobilityData: MobilityResponse | null,
  stationDistrictMap: Map<string, string>
): PeriodInsights[] {
  if (!mobilityData) {
    return [];
  }

  type HourlySignal = { departures: number; arrivals: number };
  type DistrictAccumulator = {
    outbound: number;
    inbound: number;
    hourly: Map<number, HourlySignal>;
  };

  const periodMaps = new Map<PeriodKey, Map<string, DistrictAccumulator>>();

  PERIODS.forEach((period) => {
    periodMaps.set(period.key, new Map());
  });

  for (const row of mobilityData.hourlySignals) {
    const district = stationDistrictMap.get(row.stationId);

    if (!district) {
      continue;
    }

    const hour = Number(row.hour);
    const departures = Math.max(0, toSafeNumber(row.departures));
    const arrivals = Math.max(0, toSafeNumber(row.arrivals));
    const periodsToUpdate: PeriodKey[] = ['all'];

    if (Number.isFinite(hour)) {
      periodsToUpdate.push(getPeriodByHour(hour));
    }

    for (const periodKey of periodsToUpdate) {
      const districtMap = periodMaps.get(periodKey);

      if (!districtMap) {
        continue;
      }

      const current = districtMap.get(district) ?? {
        outbound: 0,
        inbound: 0,
        hourly: new Map<number, HourlySignal>(),
      };
      current.outbound += departures;
      current.inbound += arrivals;

      if (Number.isFinite(hour)) {
        const hourSignal = current.hourly.get(hour) ?? { departures: 0, arrivals: 0 };
        hourSignal.departures += departures;
        hourSignal.arrivals += arrivals;
        current.hourly.set(hour, hourSignal);
      }

      districtMap.set(district, current);
    }
  }

  return PERIODS.map((period) => {
    const districtMap = periodMaps.get(period.key) ?? new Map();
    const districtRows = Array.from(districtMap.entries())
      .map(([district, values]) => ({
        district,
        outbound: values.outbound,
        inbound: values.inbound,
        volume: values.outbound + values.inbound,
        net: values.inbound - values.outbound,
      }))
      .sort((left, right) => right.volume - left.volume);

    const matrix = districtRows.map((origin) => {
      const originHourly = districtMap.get(origin.district)?.hourly;
      return districtRows.map((destination) => {
        if (origin.district === destination.district) {
          return 0;
        }

        const destHourly = districtMap.get(destination.district)?.hourly;

        if (!originHourly || !destHourly) {
          return 0;
        }

        let affinity = 0;
        for (const [hour, originSignal] of originHourly.entries()) {
          const destSignal = destHourly.get(hour);
          if (!destSignal) {
            continue;
          }

          affinity += Math.min(originSignal.departures, destSignal.arrivals);
        }

        return affinity;
      });
    });

    const maxFlow = matrix.reduce(
      (max, values) =>
        Math.max(max, values.reduce((innerMax, value) => Math.max(innerMax, value), 0)),
      0
    );

    return {
      key: period.key,
      label: period.label,
      districts: districtRows,
      matrix,
      maxFlow,
      totalFlow: districtRows.reduce((sum, row) => sum + row.outbound, 0),
    };
  });
}

export function buildTopRoutes(activeInsights: PeriodInsights | undefined): RouteSummary[] {
  if (!activeInsights) {
    return [];
  }

  const candidates: RouteSummary[] = [];

  activeInsights.matrix.forEach((originRow, originIndex) => {
    originRow.forEach((value, destinationIndex) => {
      if (value <= 0 || originIndex === destinationIndex) {
        return;
      }

      const origin = activeInsights.districts[originIndex]?.district;
      const destination = activeInsights.districts[destinationIndex]?.district;

      if (!origin || !destination) {
        return;
      }

      candidates.push({
        origin,
        destination,
        flow: value,
      });
    });
  });

  return candidates.sort((left, right) => right.flow - left.flow).slice(0, 12);
}

export function resolveSelectedDistrictName(
  activeInsights: PeriodInsights | undefined,
  selectedDistrict: string | null,
  currentSelection: string
): string {
  if (!activeInsights || activeInsights.districts.length === 0) {
    return '';
  }

  if (
    currentSelection &&
    activeInsights.districts.some((district) => district.district === currentSelection)
  ) {
    return currentSelection;
  }

  return selectedDistrict ?? activeInsights.districts[0]?.district ?? '';
}

export function buildTopEmitterTowardReference(
  activeInsights: PeriodInsights | undefined,
  selectedDistrictName: string
): { district: string; flow: number } | null {
  if (!activeInsights || !selectedDistrictName) {
    return null;
  }

  const refIndex = activeInsights.districts.findIndex(
    (district) => district.district === selectedDistrictName
  );
  if (refIndex < 0) {
    return null;
  }

  let bestIndex = -1;
  let bestFlow = 0;

  for (let index = 0; index < activeInsights.matrix.length; index += 1) {
    if (index === refIndex) {
      continue;
    }

    const value = activeInsights.matrix[index]?.[refIndex] ?? 0;
    if (value > bestFlow) {
      bestFlow = value;
      bestIndex = index;
    }
  }

  if (bestIndex < 0 || bestFlow <= 0) {
    return null;
  }

  return {
    district: activeInsights.districts[bestIndex]!.district,
    flow: bestFlow,
  };
}

export function buildTopReceiverFromReference(
  activeInsights: PeriodInsights | undefined,
  selectedDistrictName: string
): { district: string; flow: number } | null {
  if (!activeInsights || !selectedDistrictName) {
    return null;
  }

  const refIndex = activeInsights.districts.findIndex(
    (district) => district.district === selectedDistrictName
  );
  if (refIndex < 0) {
    return null;
  }

  let bestIndex = -1;
  let bestFlow = 0;

  for (let index = 0; index < activeInsights.matrix.length; index += 1) {
    if (index === refIndex) {
      continue;
    }

    const value = activeInsights.matrix[refIndex]?.[index] ?? 0;
    if (value > bestFlow) {
      bestFlow = value;
      bestIndex = index;
    }
  }

  if (bestIndex < 0 || bestFlow <= 0) {
    return null;
  }

  return {
    district: activeInsights.districts[bestIndex]!.district,
    flow: bestFlow,
  };
}

export function buildDailyCurveData(
  mobilityData: MobilityResponse | null
): DailyCurvePoint[] {
  if (!mobilityData) {
    return [];
  }

  return mobilityData.dailyDemand.map((row) => ({
    day: row.day,
    label: getDayLabel(row.day),
    demandScore: toSafeNumber(row.demandScore),
    avgOccupancyRatio: toSafeNumber(row.avgOccupancy),
  }));
}

export function buildChordNodes(activeInsights: PeriodInsights | undefined): ChordNode[] {
  if (!activeInsights || activeInsights.districts.length === 0) {
    return [];
  }

  const radius = 115;
  const center = 140;

  return activeInsights.districts.map((district, index) => {
    const angle = (Math.PI * 2 * index) / activeInsights.districts.length - Math.PI / 2;
    return {
      district: district.district,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });
}

export function buildChordLinks(
  chordNodes: ChordNode[],
  topRoutes: RouteSummary[]
): RouteSummary[] {
  if (chordNodes.length === 0) {
    return [];
  }

  const nodeNames = new Set(chordNodes.map((node) => node.district));

  return topRoutes
    .filter((route) => nodeNames.has(route.origin) && nodeNames.has(route.destination))
    .slice(0, 12);
}
