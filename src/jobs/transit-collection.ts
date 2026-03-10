import { schedule, ScheduledTask } from 'node-cron';
import { prisma } from '@/lib/db';
import { runTransitCollection } from '@/services/transit-collection';

interface CronOptions {
  scheduled?: boolean;
  timezone?: string;
  runOnInit?: boolean;
  name?: string;
  recoverMissedExecutions?: boolean;
}

export interface TransitCollectionResult {
  success: boolean;
  providers: Awaited<ReturnType<typeof runTransitCollection>>['providers'];
  warnings: string[];
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface TransitJobState {
  lastRun: Date | null;
  lastSuccess: Date | null;
  consecutiveFailures: number;
  totalRuns: number;
  totalSuccesses: number;
}

let cronJob: ScheduledTask | null = null;
let isScheduled = false;

const jobState: TransitJobState = {
  lastRun: null,
  lastSuccess: null,
  consecutiveFailures: 0,
  totalRuns: 0,
  totalSuccesses: 0,
};

export function getTransitJobState(): TransitJobState {
  return { ...jobState };
}

export async function runTransitCollectionJob(): Promise<TransitCollectionResult> {
  const startTime = Date.now();
  jobState.lastRun = new Date();
  jobState.totalRuns += 1;

  try {
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      select: { id: true, lat: true, lon: true },
    });

    const summary = await runTransitCollection(stations);
    jobState.lastSuccess = new Date();
    jobState.totalSuccesses += 1;
    jobState.consecutiveFailures = 0;

    console.log(
      `[Transit] Collected ${summary.providers.reduce((sum, provider) => sum + provider.snapshotsStored, 0)} snapshots across ${summary.providers.length} providers`
    );

    return {
      success: true,
      providers: summary.providers,
      warnings: summary.warnings,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  } catch (error) {
    jobState.consecutiveFailures += 1;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Transit] Collection failed:', error);

    return {
      success: false,
      providers: [],
      warnings: [],
      duration: Date.now() - startTime,
      timestamp: new Date(),
      error: errorMessage,
    };
  }
}

export function startTransitCollectionJob(): void {
  if (cronJob) {
    console.log('[Cron] Transit collection job already running');
    return;
  }

  cronJob = schedule(
    '*/2 * * * *',
    async () => {
      await runTransitCollectionJob();
    },
    {
      scheduled: true,
      timezone: 'Europe/Madrid',
      runOnInit: true,
    } as CronOptions
  );

  isScheduled = true;
  console.log('[Cron] Transit collection scheduled every 2 minutes');
}

export function stopTransitCollectionJob(): void {
  if (!cronJob) {
    return;
  }

  cronJob.stop();
  cronJob = null;
  isScheduled = false;
  console.log('[Cron] Transit collection job stopped');
}

export function isTransitCollectionScheduled(): boolean {
  return isScheduled;
}
