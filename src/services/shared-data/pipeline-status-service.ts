import 'server-only';

import { getRecentCollectionRuns } from '@/lib/collection-runs';
import { getRedisHealthSummary } from '@/lib/cache/redis';
import { withCache } from '@/lib/cache/cache';
import { getStatus } from '@/lib/metrics';
import { getSecurityEventSummary } from '@/lib/security/audit';
import type { PipelineStatusSummary } from './types';

const CACHE_KEY = 'shared-data:pipeline-status';
const CACHE_TTL_SECONDS = 60;

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function serializeStatus(
  status: Awaited<ReturnType<typeof getStatus>>
): Omit<PipelineStatusSummary, 'operations'> {
  return {
    pipeline: {
      ...status.pipeline,
      lastSuccessfulPoll: toIsoString(status.pipeline.lastSuccessfulPoll),
    },
    quality: {
      freshness: {
        ...status.quality.freshness,
        lastUpdated: toIsoString(status.quality.freshness.lastUpdated),
      },
      volume: {
        ...status.quality.volume,
      },
      lastCheck: toIsoString(status.quality.lastCheck),
    },
    system: {
      ...status.system,
      uptime: toIsoString(status.system.uptime) ?? new Date(0).toISOString(),
    },
    timestamp: toIsoString(status.timestamp) ?? new Date(0).toISOString(),
  };
}

export async function getPipelineStatusSummary(): Promise<PipelineStatusSummary> {
  return withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
    const [status, cache, recentCollections, security] = await Promise.all([
      getStatus(),
      getRedisHealthSummary(),
      getRecentCollectionRuns(),
      getSecurityEventSummary(),
    ]);
    return {
      ...serializeStatus(status),
      operations: {
        cache,
        recentCollections,
        security,
      },
    };
  });
}
