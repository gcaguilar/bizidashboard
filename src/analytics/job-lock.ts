import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';

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
  const now = new Date();
  const ownerId = `${process.pid}-${randomUUID()}`;
  const expiresAt = new Date(now.getTime() + ttlMs);

  const result = await prisma.$executeRaw`
    INSERT INTO JobLock (name, lockedAt, lockExpiresAt, lockedBy)
    VALUES (${name}, ${now}, ${expiresAt}, ${ownerId})
    ON CONFLICT(name) DO UPDATE SET
      lockedAt = excluded.lockedAt,
      lockExpiresAt = excluded.lockExpiresAt,
      lockedBy = excluded.lockedBy
    WHERE JobLock.lockExpiresAt IS NULL OR JobLock.lockExpiresAt <= ${now};
  `;

  if (Number(result) === 0) {
    return null;
  }

  const refresh = async (): Promise<boolean> => {
    const refreshedAt = new Date();
    const refreshedUntil = new Date(refreshedAt.getTime() + ttlMs);
    const refreshed = await prisma.$executeRaw`
      UPDATE JobLock
      SET lockedAt = ${refreshedAt}, lockExpiresAt = ${refreshedUntil}
      WHERE name = ${name} AND lockedBy = ${ownerId};
    `;

    return Number(refreshed) > 0;
  };

  const release = async (): Promise<void> => {
    await prisma.$executeRaw`
      UPDATE JobLock
      SET lockExpiresAt = ${new Date(0)}, lockedBy = NULL
      WHERE name = ${name} AND lockedBy = ${ownerId};
    `;
  };

  return {
    name,
    ownerId,
    expiresAt,
    refresh,
    release,
  };
}
