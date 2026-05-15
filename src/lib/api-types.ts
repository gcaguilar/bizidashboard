import type { AlertType, DayType } from '@/analytics/types';
import type { DataState } from '@/lib/data-state';
import type {
  CoverageSummary,
  HistoryMetadata as HistoryMetadataBase,
  PipelineStatusSummary,
  SharedDatasetSnapshot as SharedDatasetSnapshotBase,
} from '@/services/shared-data/types';

export type StationSnapshot = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  bikesAvailable: number;
  anchorsFree: number;
  recordedAt: string;
};

export type StationsResponse = {
  stations: StationSnapshot[];
  generatedAt: string;
  dataState: DataState;
};

export type PeakFullHourSlot = {
  dayType: string;
  hour: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type RawRankingRow = {
  id: number;
  stationId: string;
  turnoverScore: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  windowStart: string;
  windowEnd: string;
};

export type EnrichedRankingRow = RawRankingRow & {
  stationName: string;
  districtName: string | null;
  problemHours: number;
  emptyHourShare: number;
  demandVsStressedHint:
    | 'huecos_con_rotacion_alta'
    | 'huecos_con_rotacion_media'
    | 'mucho_vacio_baja_demanda_estimada'
    | 'poco_estres_disponibilidad'
    | 'datos_incompletos';
  peakFullHours: PeakFullHourSlot[];
};

export type DistrictSpotlightRow = {
  districtName: string;
  stationId: string;
  stationName: string;
  turnoverScore: number;
  emptyHours: number;
  fullHours: number;
  problemHours: number;
  emptyHourShare: number;
  demandVsStressedHint: EnrichedRankingRow['demandVsStressedHint'];
  peakFullHours: PeakFullHourSlot[];
};

/** Fila de ranking con nombre, barrio y lectura demanda vs huecos (API /api/rankings). */
export type RankingRow = EnrichedRankingRow;

export type RankingsResponse = {
  type: 'turnover' | 'availability';
  limit: number;
  rankings: EnrichedRankingRow[];
  districtSpotlight: DistrictSpotlightRow[];
  generatedAt: string;
  dataState: DataState;
};

export type StationPatternRow = {
  stationId: string;
  dayType: DayType | string;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type HeatmapCell = {
  stationId: string;
  dayOfWeek: number;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type AlertRow = {
  id: number;
  stationId: string;
  alertType: AlertType | string;
  severity: number;
  metricValue: number;
  windowHours: number;
  generatedAt: string;
  isActive: boolean;
};

export type AlertsResponse = {
  limit: number;
  alerts: AlertRow[];
  generatedAt: string;
};

export type AvailableMonthsResponse = {
  months: string[];
  generatedAt: string;
};

export type StatusResponse = PipelineStatusSummary & {
  dataState: DataState;
};

export type HistoryMetadata = HistoryMetadataBase & {
  dataState: DataState;
};

export type SharedDatasetSnapshot = SharedDatasetSnapshotBase & {
  dataState: DataState;
};

export type { CoverageSummary };
