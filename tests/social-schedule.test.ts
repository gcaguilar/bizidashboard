import { describe, expect, it } from 'vitest';

import {
  getPreviousWeekRange,
  getSlotDateKey,
  getSlotDueAt,
  isSocialSlotDue,
  zonedTimeToUtc,
} from '@/lib/social/data';
import type { SocialPostRecord } from '@/lib/social/types';

import { shouldRunCatchup } from '@/jobs/social/shared';

const TZ = 'Europe/Madrid';

function record(status: SocialPostRecord['status']): Pick<SocialPostRecord, 'status'> {
  return { status };
}

describe('social slot keys', () => {
  it('uses the local day for daily slots', () => {
    const lateUtc = new Date('2026-10-27T23:30:00.000Z');
    expect(getSlotDateKey('morning', lateUtc, TZ)).toBe('2026-10-28');
    expect(getSlotDateKey('afternoon', lateUtc, TZ)).toBe('2026-10-28');
  });

  it('uses the Monday for the weekly slot and YYYY-MM for the monthly slot', () => {
    const tuesday = new Date('2026-10-27T08:00:00.000Z');
    expect(getSlotDateKey('weekly', tuesday, TZ)).toBe('2026-10-26');
    expect(getSlotDateKey('monthly', tuesday, TZ)).toBe('2026-10');

    const sunday = new Date('2026-11-01T22:30:00.000Z');
    expect(getSlotDateKey('weekly', sunday, TZ)).toBe('2026-10-26');
    expect(getSlotDateKey('monthly', sunday, TZ)).toBe('2026-11');
  });

  it('requires the previous complete week for the weekly carousel', () => {
    const monday = new Date('2026-11-02T08:00:00.000Z');
    expect(getPreviousWeekRange(monday, TZ)).toEqual({
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      startIso: '2026-10-25T23:00:00.000Z',
      endExclusiveIso: '2026-11-01T23:00:00.000Z',
    });
  });
});

describe('social catch-up window', () => {
  it('schedules the four slots at their documented local times', () => {
    const tuesday = new Date('2026-10-27T12:00:00.000Z');
    expect(getSlotDueAt('morning', tuesday, TZ).toISOString()).toBe(
      '2026-10-27T07:30:00.000Z'
    );
    expect(getSlotDueAt('afternoon', tuesday, TZ).toISOString()).toBe(
      '2026-10-27T17:30:00.000Z'
    );

    const monday = new Date('2026-10-26T12:00:00.000Z');
    expect(getSlotDueAt('weekly', monday, TZ).toISOString()).toBe(
      '2026-10-26T08:00:00.000Z'
    );

    const firstOfMonth = new Date('2026-11-01T12:00:00.000Z');
    expect(getSlotDueAt('monthly', firstOfMonth, TZ).toISOString()).toBe(
      '2026-11-01T09:00:00.000Z'
    );
  });

  it('recovers a slot only inside the configured window', () => {
    const dueAt = zonedTimeToUtc('2026-10-27', 8, 30, TZ);

    expect(
      isSocialSlotDue(
        'morning',
        new Date(dueAt.getTime() + 30 * 60_000),
        120,
        TZ
      )
    ).toBe(true);
    expect(
      isSocialSlotDue(
        'morning',
        new Date(dueAt.getTime() + 120 * 60_000),
        120,
        TZ
      )
    ).toBe(true);
    expect(
      isSocialSlotDue(
        'morning',
        new Date(dueAt.getTime() + 121 * 60_000),
        120,
        TZ
      )
    ).toBe(false);
    expect(
      isSocialSlotDue(
        'morning',
        new Date(dueAt.getTime() - 60_000),
        120,
        TZ
      )
    ).toBe(false);
  });

  it('opens the catch-up window for all four slots', () => {
    const weeklyDue = zonedTimeToUtc('2026-10-26', 9, 0, TZ);
    const monthlyDue = zonedTimeToUtc('2026-11-01', 10, 0, TZ);
    const afternoonDue = zonedTimeToUtc('2026-10-27', 18, 30, TZ);

    expect(
      isSocialSlotDue(
        'weekly',
        new Date(weeklyDue.getTime() + 30 * 60_000),
        120,
        TZ
      )
    ).toBe(true);
    expect(
      isSocialSlotDue(
        'monthly',
        new Date(monthlyDue.getTime() + 119 * 60_000),
        120,
        TZ
      )
    ).toBe(true);
    expect(
      isSocialSlotDue(
        'afternoon',
        new Date(afternoonDue.getTime() + 60 * 60_000),
        120,
        TZ
      )
    ).toBe(true);
  });

  it('does not recover a slot with a terminal record', () => {
    const now = new Date('2026-10-27T08:45:00.000Z');
    const base = {
      slot: 'morning' as const,
      now,
      catchupMinutes: 120,
      timezone: TZ,
    };

    expect(shouldRunCatchup({ ...base, record: null })).toBe(true);
    expect(shouldRunCatchup({ ...base, record: record('claimed') })).toBe(true);
    expect(shouldRunCatchup({ ...base, record: record('rendering') })).toBe(true);
    expect(shouldRunCatchup({ ...base, record: record('sent') })).toBe(false);
    expect(shouldRunCatchup({ ...base, record: record('skipped') })).toBe(false);
    expect(shouldRunCatchup({ ...base, record: record('error') })).toBe(false);
  });

  it('does not recover a weekly or monthly slot outside its window', () => {
    const tuesday = new Date('2026-10-27T09:00:00.000Z');
    const firstOfMonth = new Date('2026-11-02T09:00:00.000Z');

    expect(
      shouldRunCatchup({
        slot: 'weekly',
        now: tuesday,
        catchupMinutes: 120,
        timezone: TZ,
        record: null,
      })
    ).toBe(false);

    expect(
      shouldRunCatchup({
        slot: 'monthly',
        now: firstOfMonth,
        catchupMinutes: 120,
        timezone: TZ,
        record: null,
      })
    ).toBe(false);
  });
});
