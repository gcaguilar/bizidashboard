// ─── Time and context ──────────────────────────────────────────────────────

/** Hour-range buckets used to segment metrics and define target bands. */
export type TimeBand = 'morning_peak' | 'valley' | 'evening_peak' | 'night';

/** Weekday vs. weekend segmentation. */
export type DayCategory = 'weekday' | 'weekend';

/**
 * Station usage typology inferred from historical patterns.
 * Each type has different target occupancy bands per time band.
 */
export type StationType =
  | 'residential'  // empties in the morning, fills in the evening
  | 'offices'      // fills in the morning, empties in the evening
  | 'intermodal'   // high rotation all day, needs consistent availability
  | 'tourist'      // high weekend activity, variable intra-day
  | 'leisure'      // evening/night peak activity
  | 'mixed';       // no dominant pattern

// ─── Classification ─────────────────────────────────────────────────────────

/**
 * Structural classification of a station based on 15-day metrics.
 * Maps directly to the A-F system in the decision rules.
 */
export type StationClassification =
  | 'overstock'        // A: chronically too full, bikes not moving
  | 'deficit'          // B: chronically too empty, high departure pressure
  | 'peak_saturation'  // C: only full during specific peak hours
  | 'peak_emptying'    // D: only empty during specific peak hours
  | 'balanced'         // E: self-regulating within target band
  | 'data_review';     // F: anomalous data, exclude from logistics decisions

/**
 * Recommended operational action for a station.
 * Drives the transfers matching algorithm.
 */
export type ActionGroup =
  | 'donor'        // can supply bikes to others
  | 'receptor'     // needs bikes from others
  | 'peak_remove'  // preventive removal before saturation peak
  | 'peak_fill'    // preventive fill before emptying peak
  | 'stable'       // no intervention needed
  | 'review';      // data quality issue, skip logistics

/** Operational urgency level for prioritising interventions. */
export type Urgency = 'critical' | 'high' | 'medium' | 'low' | 'none';

// ─── Target band ────────────────────────────────────────────────────────────

/** Min/max occupancy ratio (0–1) defining the acceptable range for a station. */
export type TargetBand = {
  min: number;
  max: number;
};

// ─── Metrics ────────────────────────────────────────────────────────────────

/** Aggregate metrics for a station over the analysis window. */
export type StationBaseMetrics = {
  /** Average occupancy ratio (bikesAvailable / capacity). 0–1. */
  occupancyAvg: number;
  /** Fraction of hours where bikesAvailable = 0. 0–1. */
  pctTimeEmpty: number;
  /** Fraction of hours where anchorsFree = 0. 0–1. */
  pctTimeFull: number;
  /** Total rotation score: SUM(bikesMax - bikesMin + anchorsMax - anchorsMin). Proxy for uses. */
  rotation: number;
  /** Rotation per average bike available. Proxy for demand efficiency. */
  rotationPerBike: number;
  /**
   * Fraction of hours where bikesMax = bikesMin (no movement detected).
   * Proxy for bike persistence / immobility.
   */
  persistenceProxy: number;
  /** Average duration in minutes of critical episodes (empty or full runs). */
  criticalEpisodeAvgMinutes: number;
  /**
   * Net imbalance: arrivals minus departures (positive = more arrivals than departures).
   * Estimated from LAG delta on hourly bikes count.
   */
  netImbalance: number;
  /** Standard deviation of hourly occupancyAvg. Proxy for volatility. */
  variability: number;
  /**
   * Unsatisfied demand proxy: hours at 0 bikes × avg demand for that time band.
   * Underestimates true lost demand since we have no trip-level data.
   */
  unsatisfiedDemandProxy: number;
};

/** Metrics segmented by time band and day category. */
export type TimeBandMetrics = StationBaseMetrics & {
  timeBand: TimeBand;
  dayCategory: DayCategory;
};

// ─── Prediction ─────────────────────────────────────────────────────────────

/** Risk and demand forecast for a station at a specific moment. */
export type RiskAssessment = {
  /** Probability of reaching 0 bikes within 1 hour. 0–1. */
  riskEmptyAt1h: number;
  /** Probability of reaching 0 bikes within 3 hours. 0–1. */
  riskEmptyAt3h: number;
  /** Probability of reaching 0 free anchors within 1 hour. 0–1. */
  riskFullAt1h: number;
  /** Probability of reaching 0 free anchors within 3 hours. 0–1. */
  riskFullAt3h: number;
  /** Estimated demand score for the next 1 hour (rotation proxy). */
  demandNextHour: number;
  /** Estimated demand score for the next 3 hours. */
  demandNext3Hours: number;
  /**
   * Estimated probability that the station returns to target band without intervention.
   * Based on comparing future hourly patterns against current deviation.
   */
  selfCorrectionProbability: number;
  /**
   * Estimated minutes until occupancy returns to target band based on patterns.
   * Null if no recovery predicted within 6 hours.
   */
  estimatedRecoveryMinutes: number | null;
  /** Confidence in the prediction (0–1), based on historical sample count. */
  confidence: number;
};

// ─── Network ────────────────────────────────────────────────────────────────

/** A nearby station and its current availability context. */
export type NearbyStation = {
  stationId: string;
  distanceMeters: number;
  /** Estimated walking time assuming 4.5 km/h and 1.3× haversine detour factor. */
  walkingTimeMinutes: number;
  currentOccupancy: number;
  /**
   * Historical robustness: how reliably the station stays within its target band.
   * Computed as 1 - pctTimeEmpty - pctTimeFull. 0–1.
   */
  historicalRobustness: number;
};

/** Network context for a station: nearby alternatives and their collective impact on urgency. */
export type NetworkContext = {
  nearbyStations: NearbyStation[];
  /** Total capacity of all nearby stations within radius. */
  clusterCapacity: number;
  /** Weighted average bikes/capacity across nearby stations. */
  clusterAvailability: number;
  /**
   * Multiplier (0–1) applied to urgency based on availability of alternatives.
   * 1.0 = no alternatives (full urgency), 0.5 = robust alternatives exist.
   */
  urgencyAdjustment: number;
};

// ─── Transfers ──────────────────────────────────────────────────────────────

/** Expected impact of a single origin→destination transfer. */
export type TransferImpact = {
  /** Estimated empty-station episodes avoided at destination. */
  emptiesAvoided: number;
  /** Estimated full-station episodes avoided at origin. */
  fullsAvoided: number;
  /** Estimated uses recovered (rides enabled) by the transfer. */
  usesRecovered: number;
  /** Logistics cost score (0–1, higher = cheaper/closer). */
  costScore: number;
};

/** A concrete recommended transfer between two stations. */
export type TransferRecommendation = {
  originStationId: string;
  originStationName: string;
  destinationStationId: string;
  destinationStationName: string;
  /** Number of bikes to move. */
  bikesToMove: number;
  /** Recommended time window for the intervention (local time strings). */
  timeWindow: { start: string; end: string };
  expectedImpact: TransferImpact;
  /** Higher = better match (combines urgency, distance, compatibility). */
  matchScore: number;
  /** Confidence in the recommendation (0–1). */
  confidence: number;
  /** Human-readable traceability: why this transfer was recommended. */
  reasons: string[];
};

// ─── Logistics config ───────────────────────────────────────────────────────

/** Configurable parameters for the logistics/matching engine. */
export type LogisticsConfig = {
  vehicleCapacity: number;
  maxTransferDistanceMeters: number;
  operationalWindows: Array<{ start: string; end: string }>;
  costPerKm: number;
  costPerBike: number;
  minBikesToMove: number;
};

// ─── Station diagnostic ─────────────────────────────────────────────────────

/** Full diagnostic row for a single station. This is the central output type. */
export type StationDiagnostic = {
  stationId: string;
  stationName: string;
  districtName: string | null;
  capacity: number;
  currentBikes: number;
  currentAnchors: number;
  currentOccupancy: number;

  /** Inferred station type from usage patterns. */
  inferredType: StationType;
  /** Confidence in the typology inference (0–1). */
  inferredTypeConfidence: number;

  /** Structural classification (A-F). */
  classification: StationClassification;
  /** Human-readable reasons why this classification was assigned. */
  classificationReasons: string[];

  /** Aggregate metrics over the full analysis window. */
  globalMetrics: StationBaseMetrics;
  /** Metrics segmented by time band + day category. */
  timeBandMetrics: TimeBandMetrics[];

  /** Target occupancy band for the current time band. */
  targetBand: TargetBand;
  /** Current time band based on local time. */
  currentTimeBand: TimeBand;

  /** Risk and demand forecast. */
  risk: RiskAssessment;
  /** Network context: nearby alternatives and urgency adjustment. */
  network: NetworkContext;

  /** Recommended operational action. */
  actionGroup: ActionGroup;
  /** Human-readable reasons why this action was chosen. */
  actionReasons: string[];
  urgency: Urgency;
  /** Composite priority score (0–1) for sorting intervention queue. */
  priorityScore: number;
};

// ─── KPIs and baseline ──────────────────────────────────────────────────────

export type ServiceKPIs = {
  systemPctTimeEmpty: number;
  systemPctTimeFull: number;
  avgCriticalEpisodeMinutes: number;
  totalRotation: number;
  estimatedLostUses: number;
};

export type OperationKPIs = {
  suggestedTransfers: number;
  totalBikesMoved: number;
  totalCostScore: number;
  avgCostPerTransfer: number;
};

export type ImpactKPIs = {
  totalEmptiesAvoided: number;
  totalFullsAvoided: number;
  totalUsesRecovered: number;
  costPerIncidentAvoided: number | null;
  improvementVsBaselinePct: number | null;
};

export type ReportKPIs = {
  service: ServiceKPIs;
  operation: OperationKPIs;
  impact: ImpactKPIs;
};

export type BaselineScenario = {
  label: string;
  emptiesAvoided: number;
  fullsAvoided: number;
  totalMoves: number;
  totalCostScore: number;
  costPerIncidentAvoided: number | null;
};

export type BaselineComparison = {
  doNothing: BaselineScenario;
  simpleRules: BaselineScenario;
  recommended: BaselineScenario;
};

// ─── Report summary ─────────────────────────────────────────────────────────

export type ReportSummary = {
  totalStations: number;
  byClassification: Record<StationClassification, number>;
  byAction: Record<ActionGroup, number>;
  criticalUrgencyCount: number;
  highUrgencyCount: number;
  stationsWithTransfer: number;
};

// ─── Full report ────────────────────────────────────────────────────────────

/** The complete rebalancing report returned by the API and displayed in the dashboard. */
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
