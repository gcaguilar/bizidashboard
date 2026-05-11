import type { HealthStatus } from '@/lib/metrics';

export type CoverageSummary = {
  firstRecordedAt: string | null;
  lastRecordedAt: string | null;
  totalSamples: number;
  totalStations: number;
  totalDays: number;
  generatedAt: string | null;
};

export type SharedDataSource = {
  provider: string;
  gbfsDiscoveryUrl: string;
};

export type LastUpdatedSummary = {
  lastSampleAt: string | null;
  generatedAt: string | null;
};

export type DatasetStatsSummary = {
  totalSamples: number;
  totalStations: number;
  totalDays: number;
  generatedAt: string | null;
};

export type PipelineStatusSummary = {
  pipeline: {
    lastSuccessfulPoll: string | null;
    totalRowsCollected: number;
    pollsLast24Hours: number;
    validationErrors: number;
    consecutiveFailures: number;
    lastDataFreshness: boolean;
    lastStationCount: number;
    averageStationsPerPoll: number;
    healthStatus: HealthStatus;
    healthReason: string | null;
  };
  quality: {
    freshness: {
      isFresh: boolean;
      lastUpdated: string | null;
      maxAgeSeconds: number;
    };
    volume: {
      recentStationCount: number;
      averageStationsPerPoll: number;
      expectedRange: { min: number; max: number };
    };
    lastCheck: string | null;
  };
  system: {
    uptime: string;
    version: string;
    environment: string;
  };
  operations: {
    cache: {
      configured: boolean;
      available: boolean;
      backend: 'redis' | 'disabled';
    };
    recentCollections: Array<{
      collectionId: string;
      trigger: string;
      status: string;
      requestId: string;
      snapshotRecordedAt: string | null;
      insertedCount: number;
      duplicateCount: number;
      warningCount: number;
      errorCount: number;
      startedAt: string;
      finishedAt: string | null;
    }>;
    security: {
      failedAuthLast24Hours: number;
      rateLimitedLast24Hours: number;
      refreshTokenReuseLast24Hours: number;
    };
  };
  timestamp: string;
};

export type HistoryMetadata = {
  source: SharedDataSource;
  coverage: CoverageSummary;
  generatedAt: string | null;
};

export type SharedDatasetSnapshot = {
  source: SharedDataSource;
  coverage: CoverageSummary;
  lastUpdated: LastUpdatedSummary;
  stats: DatasetStatsSummary;
  pipeline: PipelineStatusSummary;
};
