export type TimeBand = 'morning_peak' | 'valley' | 'evening_peak' | 'night';
export type DayCategory = 'weekday' | 'weekend';
export type StationType = 'residential' | 'offices' | 'intermodal' | 'tourist' | 'leisure' | 'mixed';

export type StationClassification =
  | 'overstock'
  | 'deficit'
  | 'peak_saturation'
  | 'peak_emptying'
  | 'balanced'
  | 'data_review';

export type ActionGroup = 'donor' | 'receptor' | 'peak_remove' | 'peak_fill' | 'stable' | 'review';
export type Urgency = 'critical' | 'high' | 'medium' | 'low' | 'none';

export type StationBaseMetrics = {
  occupancyAvg: number;
  pctTimeEmpty: number;
  pctTimeFull: number;
  rotation: number;
  rotationPerBike: number;
  persistenceProxy: number;
  criticalEpisodeAvgMinutes: number;
  netImbalance: number;
  variability: number;
  unsatisfiedDemandProxy: number;
};

export type TimeBandMetrics = StationBaseMetrics & {
  timeBand: TimeBand;
  dayCategory: DayCategory;
};

export type RiskAssessment = {
  riskEmptyAt1h: number;
  riskEmptyAt3h: number;
  riskFullAt1h: number;
  riskFullAt3h: number;
  demandNextHour: number;
  demandNext3Hours: number;
  selfCorrectionProbability: number;
  estimatedRecoveryMinutes: number | null;
  confidence: number;
};

export type NearbyStation = {
  stationId: string;
  distanceMeters: number;
  walkingTimeMinutes: number;
  currentOccupancy: number;
  historicalRobustness: number;
};

export type NetworkContext = {
  nearbyStations: NearbyStation[];
  clusterCapacity: number;
  clusterAvailability: number;
  urgencyAdjustment: number;
};

export type TransferImpact = {
  emptiesAvoided: number;
  fullsAvoided: number;
  usesRecovered: number;
  costScore: number;
};

export type TransferRecommendation = {
  originStationId: string;
  originStationName?: string;
  destinationStationId: string;
  destinationStationName?: string;
  bikesToMove: number;
  timeWindow: { start: string; end: string };
  expectedImpact: TransferImpact;
  matchScore: number;
  logisticsScore: number;
  confidence: number;
  reasons: string[];
};

export type TargetBand = {
  min: number;
  max: number;
};

export type StationDiagnostic = {
  stationId: string;
  stationName: string;
  districtName: string | null;
  capacity: number;
  currentBikes: number;
  currentAnchors: number;
  currentOccupancy: number;

  inferredType: StationType;
  classification: StationClassification;
  classificationReasons: string[];

  globalMetrics: StationBaseMetrics;
  timeBandMetrics: TimeBandMetrics[];
  targetBand: TargetBand;
  currentTimeBand: TimeBand;

  risk: RiskAssessment;
  network: NetworkContext;
  actionGroup: ActionGroup;
  actionReasons: string[];
  urgency: Urgency;
  priorityScore: number;
};

export type ReportSummary = {
  totalStations: number;
  byClassification: {
    overstock: number;
    deficit: number;
    peak_saturation: number;
    peak_emptying: number;
    balanced: number;
    data_review: number;
  };
  byAction: {
    donor: number;
    receptor: number;
    peak_remove: number;
    peak_fill: number;
    stable: number;
    review: number;
  };
  criticalUrgencyCount: number;
  highUrgencyCount: number;
  stationsWithTransfer: number;
};

export type ReportKPIs = {
  service: {
    pctTimeEmpty: number;
    pctTimeFull: number;
    systemPctTimeEmpty: number;
    systemPctTimeFull: number;
    avgCriticalEpisodeMinutes: number;
    totalRotation: number;
    estimatedLostUses: number;
  };
  operation: {
    suggestedTransfers: number;
    totalBikesMoved: number;
    totalCostScore: number;
    avgCostPerTransfer: number;
  };
  impact: {
    totalEmptiesAvoided: number;
    totalFullsAvoided: number;
    totalUsesRecovered: number;
    costPerIncidentAvoided: number;
    improvementVsBaseline: number;
    improvementVsBaselinePct: number | null;
  };
};

export type BaselineComparison = {
  doNothing: ReportKPIs['impact'] & { label: string; totalMoves: number; emptiesAvoided: number; fullsAvoided: number };
  simpleRules: ReportKPIs['impact'] & { label: string; totalMoves: number; emptiesAvoided: number; fullsAvoided: number };
  recommended: ReportKPIs['impact'] & { label: string; totalMoves: number; emptiesAvoided: number; fullsAvoided: number };
};

export type RebalancingReport = {
  generatedAt: string;
  modelVersion: string;
  analysisWindowDays: number;
  districtFilter: string | null;

  summary: ReportSummary;
  diagnostics: StationDiagnostic[];
  transfers: TransferRecommendation[];
  kpis: ReportKPIs;
  baselineComparison: BaselineComparison;
};
