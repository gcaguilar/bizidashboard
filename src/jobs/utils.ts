export type RefreshableLock = { refresh: () => Promise<boolean> };

export async function ensureLockRefreshed(
  lock: RefreshableLock,
  stage: string,
  context: 'collection' | 'analytics'
): Promise<void> {
  const refreshed = await lock.refresh();
  if (!refreshed) {
    throw new Error(`${context} lock refresh failed at stage: ${stage}`);
  }
}