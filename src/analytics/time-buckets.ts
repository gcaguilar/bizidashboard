import { DayType } from '@/analytics/types';
import { TIMEZONE } from '@/lib/timezone';

const bucketFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  weekday: 'short',
  hour: '2-digit',
  hourCycle: 'h23',
});

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const getPart = (parts: Intl.DateTimeFormatPart[], type: string): string =>
  parts.find((part) => part.type === type)?.value ?? '';

export function getLocalHour(date: Date): number {
  if (!isValidDate(date)) {
    return Number.NaN;
  }

  const parts = bucketFormatter.formatToParts(date);
  const hourValue = getPart(parts, 'hour');
  return Number.parseInt(hourValue, 10);
}

export function getLocalDayOfWeek(date: Date): number {
  if (!isValidDate(date)) {
    return Number.NaN;
  }

  const parts = bucketFormatter.formatToParts(date);
  const weekday = getPart(parts, 'weekday');
  return weekdayMap[weekday] ?? Number.NaN;
}

export function getLocalDayType(date: Date): DayType {
  const dayOfWeek = getLocalDayOfWeek(date);

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return DayType.WEEKEND;
  }

  return DayType.WEEKDAY;
}

export function getLocalBucket(date: Date): {
  hour: number;
  dayOfWeek: number;
  dayType: DayType;
} {
  const hour = getLocalHour(date);
  const dayOfWeek = getLocalDayOfWeek(date);

  return {
    hour,
    dayOfWeek,
    dayType: dayOfWeek === 0 || dayOfWeek === 6 ? DayType.WEEKEND : DayType.WEEKDAY,
  };
}
