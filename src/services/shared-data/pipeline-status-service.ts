import 'server-only';

import { withCache } from '@/lib/cache/cache';
import { getStatus } from '@/lib/metrics';
import type { PipelineStatusSummary } from './types';

const CACHE_KEY = 'shared-data:pipeline-status';
const CACHE_TTL_SECONDS = 60;

function serializeStatus(status: Awaited<ReturnType<typeof getStatus>>): PipelineStatusSummary {
  return JSON.parse(JSON.stringify(status)) as PipelineStatusSummary;
}

export async function getPipelineStatusSummary(): Promise<PipelineStatusSummary> {
  return withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
    const status = await getStatus();
    return serializeStatus(status);
  });
}
