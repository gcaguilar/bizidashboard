import 'server-only';

import {
  getDailyDemandCurve,
  getHourlyMobilitySignals,
  getMonthlyDemandCurve,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { isValidMonthKey } from '@/lib/months';

const LIVE_SERIES_TTL_SECONDS = 300;
const MONTHLY_SERIES_TTL_SECONDS = 1800;

export type DailyDemandSeriesRow = Awaited<ReturnType<typeof getDailyDemandCurve>>[number];
export type MonthlyDemandSeriesRow = Awaited<ReturnType<typeof getMonthlyDemandCurve>>[number];
export type SystemHourlyProfileSeriesRow = Awaited<
  ReturnType<typeof getSystemHourlyProfile>
>[number];
export type HourlyMobilitySignalSeriesRow = Awaited<
  ReturnType<typeof getHourlyMobilitySignals>
>[number];

function normalizeMonthKey(monthKey?: string | null): string | null {
  return monthKey && isValidMonthKey(monthKey) ? monthKey : null;
}

function normalizeDays(days: number): number {
  return Math.max(1, Math.min(365, Math.floor(days)));
}

function normalizeMonthLimit(limitMonths: number): number {
  return Math.max(1, Math.min(36, Math.floor(limitMonths)));
}

export async function fetchCachedDailyDemandCurve(
  days = 30,
  monthKey?: string | null
): Promise<DailyDemandSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  return withCache(
    `analytics:daily-demand:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getDailyDemandCurve(normalizedDays, normalizedMonth ?? undefined)
  );
}

export async function fetchCachedMonthlyDemandCurve(
  limitMonths = 12
): Promise<MonthlyDemandSeriesRow[]> {
  const normalizedLimit = normalizeMonthLimit(limitMonths);

  return withCache(
    `analytics:monthly-demand:limit=${normalizedLimit}`,
    MONTHLY_SERIES_TTL_SECONDS,
    () => getMonthlyDemandCurve(normalizedLimit)
  );
}

export async function fetchCachedSystemHourlyProfile(
  days = 14,
  monthKey?: string | null
): Promise<SystemHourlyProfileSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  return withCache(
    `analytics:system-hourly-profile:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getSystemHourlyProfile(normalizedDays, normalizedMonth ?? undefined)
  );
}

export async function fetchCachedHourlyMobilitySignals(
  days = 14,
  monthKey?: string | null
): Promise<HourlyMobilitySignalSeriesRow[]> {
  const normalizedDays = normalizeDays(days);
  const normalizedMonth = normalizeMonthKey(monthKey);

  return withCache(
    `analytics:hourly-mobility-signals:days=${normalizedDays}:month=${normalizedMonth ?? 'all'}`,
    LIVE_SERIES_TTL_SECONDS,
    () => getHourlyMobilitySignals(normalizedDays, normalizedMonth ?? undefined)
  );
}
