import { describe, expect, it } from 'vitest';

import { buildSocialAudit, formatSocialAudit } from '@/lib/social/audit';
import type {
  SocialContentMetadata,
  SocialPostRecord,
  SocialSlot,
  SocialStatus,
} from '@/lib/social/types';

const NOW = new Date('2026-10-29T12:00:00.000Z');

function post(
  id: number,
  slot: SocialSlot,
  status: SocialStatus,
  createdAt: string,
  metadata?: SocialContentMetadata
): SocialPostRecord {
  return {
    id,
    dateKey: createdAt.slice(0, 10),
    slot,
    family:
      slot === 'weekly'
        ? 'weekly-carousel'
        : slot === 'monthly'
          ? 'monthly-carousel'
          : slot === 'feature'
            ? 'feature-story'
            : 'daily-story',
    status,
    caption: null,
    altText: null,
    assetUrls: [],
    bufferPostId: status === 'sent' ? `buffer-${id}` : null,
    error: status === 'error' ? 'boom' : null,
    metadata,
    createdAt,
    updatedAt: createdAt,
    publishedAt: status === 'sent' ? createdAt : null,
  };
}

describe('social audit', () => {
  it('counts statuses and ignores records outside the window', () => {
    const report = buildSocialAudit(
      [
        post(1, 'morning', 'sent', '2026-10-28T07:30:00.000Z'),
        post(2, 'midday', 'skipped', '2026-10-27T12:00:00.000Z'),
        post(3, 'afternoon', 'error', '2026-10-26T17:30:00.000Z'),
        post(4, 'feature', 'sent', '2026-10-23T08:00:00.000Z'),
        post(5, 'weekly', 'sent', '2026-08-01T08:00:00.000Z'),
      ],
      { now: NOW, windowDays: 30 }
    );

    expect(report.total).toBe(4);
    expect(report.sent).toBe(2);
    expect(report.skipped).toBe(1);
    expect(report.errors).toBe(1);
    expect(report.skipRate).toBeCloseTo(0.25);
    expect(report.errorRate).toBeCloseTo(0.25);
    expect(report.bySlot.morning).toEqual({
      total: 1,
      sent: 1,
      skipped: 0,
      errors: 0,
      active: 0,
    });
    expect(report.bySlot.monthly.total).toBe(0);
  });

  it('measures repeated stations only across sent posts', () => {
    const report = buildSocialAudit(
      [
        post(1, 'morning', 'sent', '2026-10-28T07:30:00.000Z', {
          stationIds: ['s1', 's2'],
        }),
        post(2, 'afternoon', 'sent', '2026-10-27T17:30:00.000Z', {
          stationIds: ['s1'],
        }),
        post(3, 'midday', 'skipped', '2026-10-26T12:00:00.000Z', {
          stationIds: ['s1'],
        }),
      ],
      { now: NOW, windowDays: 30 }
    );

    expect(report.repeatedStations).toEqual([{ stationId: 's1', posts: 2 }]);
    expect(report.duplicateStationShare).toBeCloseTo(1 / 3);
  });

  it('lists the districts shown without duplicates', () => {
    const report = buildSocialAudit(
      [
        post(1, 'weekly', 'sent', '2026-10-26T08:00:00.000Z', {
          districtNames: ['Delicias', 'Centro'],
        }),
        post(2, 'weekly', 'sent', '2026-10-19T08:00:00.000Z', {
          districtNames: ['Centro', 'Universidad'],
        }),
      ],
      { now: NOW, windowDays: 30 }
    );

    expect(report.districtsShown).toEqual(['Centro', 'Delicias', 'Universidad']);
  });

  it('formats a readable status without NaN values', () => {
    const text = formatSocialAudit(
      buildSocialAudit([], { now: NOW, windowDays: 30 })
    );

    expect(text).toContain('últimos 30 días');
    expect(text).toContain('Publicaciones: 0');
    expect(text).not.toContain('NaN');
    expect(text).toContain('feature');
  });
});
