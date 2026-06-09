import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

const DEFAULT_LOCK_TTL_MS = 55 * 60 * 1000;

export interface JobLockHandle {
  name: string;
  ownerId: string;
  expiresAt: Date;
  refresh: () => Promise<boolean>;
  release: () => Promise<void>;
}

export async function acquireJobLock(
  name: string,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<JobLockHandle | null> {
  try {
    const now = new Date();
    const ownerId = `${process.pid}-${randomUUID()}`;
    const expiresAt = new Date(now.getTime() + ttlMs);

    const result = await prisma.$executeRaw`
      INSERT INTO "JobLock" (name, "lockedAt", "lockExpiresAt", "lockedBy")
      VALUES (${name}, ${now}, ${expiresAt}, ${ownerId})
      ON CONFLICT(name) DO UPDATE SET
        "lockedAt" = excluded."lockedAt",
        "lockExpiresAt" = excluded."lockExpiresAt",
        "lockedBy" = excluded."lockedBy"
      WHERE "JobLock"."lockExpiresAt" IS NULL OR "JobLock"."lockExpiresAt" <= ${now};
    `;

    if (Number(result) === 0) {
      return null;
    }

    const refresh = async (): Promise<boolean> => {
      try {
        const refreshedAt = new Date();
        const refreshedUntil = new Date(refreshedAt.getTime() + ttlMs);
        const refreshed = await prisma.$executeRaw`
          UPDATE "JobLock"
          SET "lockedAt" = ${refreshedAt}, "lockExpiresAt" = ${refreshedUntil}
          WHERE name = ${name} AND "lockedBy" = ${ownerId};
        `;
        return Number(refreshed) > 0;
      } catch (error) {
        captureExceptionWithContext(error, { area: 'job-lock', operation: 'refresh', extra: { lockName: name } });
        logger.error('job-lock.refresh_failed', { error, lockName: name });
        return false;
      }
    };

    const release = async (): Promise<void> => {
      try {
        await prisma.$executeRaw`
          UPDATE "JobLock"
          SET "lockExpiresAt" = NULL, "lockedAt" = NULL, "lockedBy" = NULL
          WHERE name = ${name} AND "lockedBy" = ${ownerId};
        `;
      } catch (error) {
        captureExceptionWithContext(error, { area: 'job-lock', operation: 'release', extra: { lockName: name } });
        logger.error('job-lock.release_failed', { error, lockName: name });
      }
    };

    return {
      name,
      ownerId,
      expiresAt,
      refresh,
      release,
    };
  } catch (error) {
    captureExceptionWithContext(error, { area: 'job-lock', operation: 'acquire', extra: { lockName: name } });
    logger.error('job-lock.acquire_failed', { error, lockName: name });
    return null;
  }
}
