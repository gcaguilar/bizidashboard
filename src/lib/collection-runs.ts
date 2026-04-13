import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export type CollectionRunStatus = 'running' | 'succeeded' | 'failed' | 'skipped';
export type CollectionRunTrigger = 'manual' | 'cron';

export type CollectionRunRecordInput = {
  collectionId: string;
  requestId: string;
  city: string;
  trigger: CollectionRunTrigger;
  sourceUrl: string;
  status?: CollectionRunStatus;
};

export type CollectionRunUpdateInput = {
  status: CollectionRunStatus;
  snapshotRecordedAt?: Date | null;
  gbfsVersion?: string | null;
  expectedStationCount?: number | null;
  insertedCount?: number | null;
  duplicateCount?: number | null;
  warningCount?: number | null;
  errorCount?: number | null;
  warnings?: string[];
  errors?: string[];
  durationMs?: number | null;
  finishedAt?: Date | null;
};

export class CollectionRunError extends Error {
  constructor(
    message: string,
    public readonly collectionId: string,
    public readonly cause: unknown
  ) {
    super(message);
    this.name = 'CollectionRunError';
  }
}

export async function createCollectionRun(
  input: CollectionRunRecordInput
): Promise<void> {
  try {
    await prisma.collectionRun.create({
      data: {
        collectionId: input.collectionId,
        requestId: input.requestId,
        city: input.city,
        trigger: input.trigger,
        sourceUrl: input.sourceUrl,
        status: input.status ?? 'running',
      },
    });
  } catch (error) {
    logger.warn('collection_run.create_failed', {
      collectionId: input.collectionId,
      error,
    });
    throw new CollectionRunError(
      `Failed to create collection run: ${input.collectionId}`,
      input.collectionId,
      error
    );
  }
}

export async function updateCollectionRun(
  collectionId: string,
  input: CollectionRunUpdateInput
): Promise<void> {
  try {
    await prisma.collectionRun.update({
      where: { collectionId },
      data: {
        status: input.status,
        snapshotRecordedAt: input.snapshotRecordedAt ?? undefined,
        gbfsVersion: input.gbfsVersion ?? undefined,
        expectedStationCount: input.expectedStationCount ?? undefined,
        insertedCount: input.insertedCount ?? undefined,
        duplicateCount: input.duplicateCount ?? undefined,
        warningCount: input.warningCount ?? undefined,
        errorCount: input.errorCount ?? undefined,
        warnings: input.warnings ?? undefined,
        errors: input.errors ?? undefined,
        durationMs: input.durationMs ?? undefined,
        finishedAt: input.finishedAt ?? undefined,
      },
    });
  } catch (error) {
    logger.warn('collection_run.update_failed', {
      collectionId,
      error,
    });
    throw new CollectionRunError(
      `Failed to update collection run: ${collectionId}`,
      collectionId,
      error
    );
  }
}

export async function getRecentCollectionRuns(limit = 5): Promise<
  Array<{
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
  }>
> {
  try {
    const rows = await prisma.collectionRun.findMany({
      orderBy: [{ startedAt: 'desc' }],
      take: limit,
    });

    return rows.map((row) => ({
      collectionId: row.collectionId,
      trigger: row.trigger,
      status: row.status,
      requestId: row.requestId,
      snapshotRecordedAt: row.snapshotRecordedAt?.toISOString() ?? null,
      insertedCount: row.insertedCount,
      duplicateCount: row.duplicateCount,
      warningCount: row.warningCount,
      errorCount: row.errorCount,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
    }));
  } catch (error) {
    logger.warn('collection_run.list_failed', { error });
    return [];
  }
}

