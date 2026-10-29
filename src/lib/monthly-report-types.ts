import type {
  MonthlyCriticalEpisodeRow,
  MonthlyNetworkHeatmapRow,
  MonthlyStationMetricRow,
} from '@/analytics/queries/monthly-report';
import type { MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import type { ServiceAnomaly } from '@/lib/service-anomalies';
import type { PeriodCoverage } from '@/lib/temporal-comparison';

export type ReportTrend = 'mejora' | 'empeora' | 'estable' | 'sin-datos';

export type ReportBalance = {
  tone: 'up' | 'down' | 'neutral' | 'unknown';
  headline: string;
  detail: string;
};

export type MonthlyReportComparison = {
  isComparable: boolean;
  periodLabel: string;
  reason: string;
  normalizedDemandRatio: number | null;
  trend: ReportTrend;
  previousMonthKey: string | null;
};

export type MonthlyReportHeadline = {
  demandScore: number;
  avgOccupancy: number;
  activeStations: number;
  sampleCount: number;
  demandDeltaRatio: number | null;
  occupancyDeltaRatio: number | null;
  peakHour: number | null;
  coveredDays: number;
  expectedDays: number;
};

export type DistrictMonthSummary = {
  district: string;
  demandScore: number;
  avgOccupancy: number;
  stations: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  frictionRate: number;
};

export type StationFrictionSpot = {
  stationId: string;
  stationName: string;
  district: string | null;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  frictionHours: number;
  frictionRate: number;
};

export type StationMorningSpot = {
  stationId: string;
  stationName: string;
  district: string | null;
  morningEmptyHours: number;
  morningFullHours: number;
  morningHours: number;
  morningEmptyRate: number;
  morningFullRate: number;
  morningFrictionRate: number;
};

export type StationEpisodeSpot = {
  stationId: string;
  stationName: string;
  district: string | null;
  avgEmptyEpisodeMinutes: number;
  avgFullEpisodeMinutes: number;
  maxEmptyEpisodeMinutes: number;
  maxFullEpisodeMinutes: number;
  episodeCount: number;
};

export type StationRedistributionSpot = {
  stationId: string;
  stationName: string;
  district: string | null;
  rotation: number;
  frictionHours: number;
  frictionRate: number;
};

export type MonthlyRedistribution = {
  networkFrictionRate: number;
  emptyHours: number;
  fullHours: number;
  rotation: number;
  ineffectiveStations: StationRedistributionSpot[];
  note: string;
};

export type MonthlySeasonality = {
  sameMonthYears: number;
  previousYearsAvgDemand: number | null;
  ratioVsPreviousYears: number | null;
  seriesAvgDemand: number;
  ratioVsSeries: number | null;
  label: string;
};

export type MonthlyReportTrends = {
  monthly: Array<{
    monthKey: string;
    demandScore: number;
    avgOccupancy: number;
    activeStations: number;
    sampleCount: number;
  }>;
  daily: Array<{ day: string; demandScore: number; avgOccupancy: number; sampleCount: number }>;
  hourly: Array<{ hour: number; avgOccupancy: number; avgBikesAvailable: number; sampleCount: number }>;
};

export type MonthlyReport = {
  monthKey: string;
  generatedAt: string;
  hasReport: boolean;
  coverage: PeriodCoverage;
  comparison: MonthlyReportComparison;
  balance: ReportBalance;
  headline: MonthlyReportHeadline;
  summary: string;
  highlights: MobilityConclusionsPayload['highlights'];
  recommendations: string[];
  monthlyConclusions: string[];
  peakDemandHours: MobilityConclusionsPayload['peakDemandHours'];
  weekdayWeekendProfile: MobilityConclusionsPayload['weekdayWeekendProfile'];
  trends: MonthlyReportTrends;
  seasonality: MonthlySeasonality;
  districts: {
    mostActive: DistrictMonthSummary[];
    leastActive: DistrictMonthSummary[];
    undersupplied: DistrictMonthSummary[];
    /** Todos los barrios con datos, para rankings propios (p. ej. por estación). */
    all: DistrictMonthSummary[];
  };
  heatmap: MonthlyNetworkHeatmapRow[];
  problemSpots: {
    worstFriction: StationFrictionSpot[];
    worstMorning: StationMorningSpot[];
    longestEpisodes: StationEpisodeSpot[];
  };
  redistribution: MonthlyRedistribution;
  topStations: MobilityConclusionsPayload['topStationsByDemand'];
  leastUsedStations: MobilityConclusionsPayload['leastUsedStations'];
  anomalies: ServiceAnomaly[];
};

export const EMPTY_WEEKDAY_WEEKEND: MobilityConclusionsPayload['weekdayWeekendProfile'] = {
  weekday: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
  weekend: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
  demandGapRatio: null,
  dominantPeriod: null,
};

export const EMPTY_SEASONALITY: MonthlySeasonality = {
  sameMonthYears: 0,
  previousYearsAvgDemand: null,
  ratioVsPreviousYears: null,
  seriesAvgDemand: 0,
  ratioVsSeries: null,
  label: 'Sin serie histórica suficiente para leer estacionalidad.',
};

export type { MonthlyCriticalEpisodeRow, MonthlyNetworkHeatmapRow, MonthlyStationMetricRow };
