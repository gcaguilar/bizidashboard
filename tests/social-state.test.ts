import { describe, expect, it } from 'vitest';

import { MemoryStateStore } from '@/lib/social/state';
import type {
  SocialClaimOutcome,
  SocialPostRecord,
  SocialSlot,
} from '@/lib/social/types';

function claimedRecord(outcome: SocialClaimOutcome): SocialPostRecord {
  if (!outcome.claimed) {
    throw new Error(`Expected a claim, got ${outcome.reason}`);
  }
  return outcome.record;
}

async function send(
  store: MemoryStateStore,
  dateKey: string,
  slot: SocialSlot,
  bufferPostId: string
): Promise<SocialPostRecord> {
  const record = claimedRecord(await store.claimSlot(dateKey, slot));
  await store.markRendering(record.id);
  await store.markUploading(record.id);
  await store.markPublishing(record.id);
  return store.markSent(record.id, { bufferPostId });
}

describe('MemoryStateStore', () => {
  it('claims a slot once and is idempotent while it is in progress', async () => {
    let now = new Date('2026-10-27T07:00:00.000Z');
    const store = new MemoryStateStore({ now: () => now });

    const first = await store.claimSlot('2026-10-27', 'morning', {
      caption: 'Hola',
      altText: 'Alt',
    });

    expect(first.claimed).toBe(true);
    if (!first.claimed) {
      throw new Error(`Expected a claim, got ${first.reason}`);
    }
    expect(first.reclaimed).toBe(false);
    expect(first.record).toMatchObject({
      dateKey: '2026-10-27',
      slot: 'morning',
      family: 'daily-story',
      status: 'claimed',
      caption: 'Hola',
      altText: 'Alt',
      publishedAt: null,
    });

    now = new Date('2026-10-27T07:05:00.000Z');
    const second = await store.claimSlot('2026-10-27', 'morning');

    expect(second.claimed).toBe(false);
    if (second.claimed) {
      throw new Error('unreachable');
    }
    expect(second.reason).toBe('in_progress');
    expect(second.record.id).toBe(first.record.id);
  });

  it('keeps a unique row per date and slot', async () => {
    const store = new MemoryStateStore();
    const morning = claimedRecord(await store.claimSlot('2026-10-27', 'morning'));
    const afternoon = claimedRecord(await store.claimSlot('2026-10-27', 'afternoon'));
    const nextDay = claimedRecord(await store.claimSlot('2026-10-28', 'morning'));

    expect(new Set([morning.id, afternoon.id, nextDay.id]).size).toBe(3);
    expect((await store.getBySlot('2026-10-27', 'morning'))?.id).toBe(morning.id);
    expect((await store.getBySlot('2026-10-27', 'afternoon'))?.id).toBe(afternoon.id);
    expect((await store.getBySlot('2026-10-28', 'morning'))?.id).toBe(nextDay.id);
  });

  it('reclaims an active row after 15 minutes and resets its fields', async () => {
    let now = new Date('2026-10-27T07:00:00.000Z');
    const store = new MemoryStateStore({ now: () => now });

    const first = claimedRecord(
      await store.claimSlot('2026-10-27', 'morning', {
        caption: 'old',
        altText: 'old-alt',
      })
    );
    await store.markRendering(first.id);
    await store.markUploading(first.id, {
      assets: [{ pageUrl: 'page', directUrl: 'direct' }],
      error: 'partial',
    });

    now = new Date('2026-10-27T07:15:00.000Z');
    const exactlyFifteen = await store.claimSlot('2026-10-27', 'morning');
    expect(exactlyFifteen.claimed).toBe(false);

    now = new Date('2026-10-27T07:15:01.000Z');
    const reclaimed = await store.claimSlot('2026-10-27', 'morning', {
      caption: 'new',
      altText: 'new-alt',
    });

    expect(reclaimed.claimed).toBe(true);
    if (!reclaimed.claimed) {
      throw new Error('unreachable');
    }
    expect(reclaimed.reclaimed).toBe(true);
    expect(reclaimed.record.id).toBe(first.id);
    expect(reclaimed.record).toMatchObject({
      status: 'claimed',
      caption: 'new',
      altText: 'new-alt',
      assetUrls: [],
      bufferPostId: null,
      error: null,
      publishedAt: null,
      updatedAt: '2026-10-27T07:15:01.000Z',
    });
    expect(reclaimed.record.createdAt).toBe('2026-10-27T07:00:00.000Z');
  });

  it('never reclaims a stale publishing row', async () => {
    let now = new Date('2026-10-27T07:00:00.000Z');
    const store = new MemoryStateStore({ now: () => now });

    const first = claimedRecord(await store.claimSlot('2026-10-27', 'morning'));
    await store.markRendering(first.id);
    await store.markUploading(first.id);
    await store.markPublishing(first.id, {
      assets: [{ pageUrl: 'page', directUrl: 'direct' }],
    });

    now = new Date('2026-10-27T07:15:01.000Z');
    const stale = await store.claimSlot('2026-10-27', 'morning', {
      caption: 'retry',
    });

    expect(stale.claimed).toBe(false);
    if (stale.claimed) {
      throw new Error('unreachable');
    }
    expect(stale.reason).toBe('stale_publishing');
    expect(stale.record).toMatchObject({
      id: first.id,
      status: 'publishing',
      caption: null,
    });

    const unchanged = await store.getBySlot('2026-10-27', 'morning');
    expect(unchanged).toMatchObject({
      id: first.id,
      status: 'publishing',
      updatedAt: '2026-10-27T07:00:00.000Z',
    });
    expect(unchanged?.assetUrls).toHaveLength(1);
  });

  it('walks the happy-path transitions and records the Buffer post', async () => {
    const now = new Date('2026-10-27T07:00:00.000Z');
    const store = new MemoryStateStore({ now: () => now });
    const record = claimedRecord(await store.claimSlot('2026-10-27', 'morning'));

    expect((await store.markRendering(record.id)).status).toBe('rendering');
    expect(
      (
        await store.markUploading(record.id, {
          assets: [{ pageUrl: 'https://tmpfiles/1', directUrl: 'https://tmpfiles/dl/1' }],
        })
      ).status
    ).toBe('uploading');
    expect((await store.markPublishing(record.id)).status).toBe('publishing');

    const sent = await store.markSent(record.id, { bufferPostId: 'buffer-1' });
    expect(sent).toMatchObject({
      status: 'sent',
      bufferPostId: 'buffer-1',
      publishedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(sent.assetUrls).toHaveLength(1);

    await expect(store.markError(record.id, { error: 'late' })).rejects.toThrow(
      /Invalid social status transition/
    );

    const retry = await store.claimSlot('2026-10-27', 'morning');
    expect(retry.claimed).toBe(false);
    if (retry.claimed) {
      throw new Error('unreachable');
    }
    expect(retry.reason).toBe('terminal');
  });

  it('rejects skipping transitions', async () => {
    const store = new MemoryStateStore();
    const record = claimedRecord(await store.claimSlot('2026-10-27', 'morning'));

    await expect(store.markUploading(record.id)).rejects.toThrow(
      /Invalid social status transition: claimed -> uploading/
    );
    await expect(store.markSent(record.id, { bufferPostId: 'x' })).rejects.toThrow(
      /Invalid social status transition/
    );
  });

  it('records skipped and error outcomes as terminal', async () => {
    const store = new MemoryStateStore();
    const skipped = claimedRecord(await store.claimSlot('2026-10-27', 'morning'));
    const markedSkipped = await store.markSkipped(skipped.id, {
      error: 'stale data',
    });
    expect(markedSkipped).toMatchObject({
      status: 'skipped',
      error: 'stale data',
      publishedAt: null,
    });

    const failed = claimedRecord(await store.claimSlot('2026-10-27', 'afternoon'));
    const markedError = await store.markError(failed.id, { error: 'boom' });
    expect(markedError).toMatchObject({ status: 'error', error: 'boom' });

    const skippedRetry = await store.claimSlot('2026-10-27', 'morning');
    const errorRetry = await store.claimSlot('2026-10-27', 'afternoon');
    expect(skippedRetry.claimed).toBe(false);
    expect(errorRetry.claimed).toBe(false);

    await expect(store.markRendering(failed.id)).rejects.toThrow(
      /Invalid social status transition/
    );
    await expect(store.markError(failed.id, { error: ' ' })).rejects.toThrow(
      /requires an error message/
    );
  });

  it('lists recent published families without duplicates', async () => {
    let now = new Date('2026-10-26T07:30:00.000Z');
    const store = new MemoryStateStore({ now: () => now });

    await send(store, '2026-10-26', 'morning', 'buffer-morning');

    now = new Date('2026-10-26T17:30:00.000Z');
    await send(store, '2026-10-26', 'afternoon', 'buffer-afternoon');

    now = new Date('2026-10-27T08:00:00.000Z');
    await send(store, '2026-10-26', 'weekly', 'buffer-weekly');

    now = new Date('2026-10-27T09:00:00.000Z');
    const skipped = claimedRecord(await store.claimSlot('2026-10-28', 'morning'));
    await store.markSkipped(skipped.id, { error: 'no data' });

    expect(await store.getRecentFamilies(5)).toEqual([
      'weekly-carousel',
      'daily-story',
    ]);
    expect(await store.getRecentFamilies(1)).toEqual(['weekly-carousel']);
    expect(await store.getRecentFamilies(0)).toEqual([]);
  });

  it('honours an explicit family and fails clearly for unknown ids', async () => {
    const store = new MemoryStateStore();
    const record = claimedRecord(
      await store.claimSlot('2026-10-27', 'weekly', {
        family: 'monthly-carousel',
      })
    );

    expect(record.family).toBe('monthly-carousel');
    await expect(store.markRendering(999)).rejects.toThrow(/not found/);
  });
});
