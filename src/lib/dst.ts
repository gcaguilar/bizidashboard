import { TIMEZONE } from "./timezone";

const CET_OFFSET_MINUTES = 60;
const CEST_OFFSET_MINUTES = 120;

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const lastSundayOfMonth = (year: number, monthIndex: number): number => {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const dayOfWeek = lastDay.getUTCDay();
  return lastDay.getUTCDate() - dayOfWeek;
};

const getLocalParts = (date: Date): LocalParts => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
  hour: date.getUTCHours(),
  minute: date.getUTCMinutes(),
  second: date.getUTCSeconds(),
  millisecond: date.getUTCMilliseconds(),
});

const getMadridParts = (date: Date): LocalParts => {
  const parts = dateTimeFormatter.formatToParts(date);
  const getValue = (type: string): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10);

  return {
    year: getValue("year"),
    month: getValue("month"),
    day: getValue("day"),
    hour: getValue("hour"),
    minute: getValue("minute"),
    second: getValue("second"),
    millisecond: 0,
  };
};

const partsMatch = (a: LocalParts, b: LocalParts): boolean =>
  a.year === b.year &&
  a.month === b.month &&
  a.day === b.day &&
  a.hour === b.hour &&
  a.minute === b.minute &&
  a.second === b.second;

const candidateFromLocal = (parts: LocalParts, offsetMinutes: number): Date =>
  new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ) -
      offsetMinutes * 60 * 1000,
  );

const findMatchingCandidates = (parts: LocalParts): Date[] => {
  const candidates = [
    candidateFromLocal(parts, CEST_OFFSET_MINUTES),
    candidateFromLocal(parts, CET_OFFSET_MINUTES),
  ];

  return candidates.filter((candidate) => partsMatch(getMadridParts(candidate), parts));
};

export function getDSTTransitions(year: number): { spring: Date; fall: Date } {
  const springDay = lastSundayOfMonth(year, 2);
  const fallDay = lastSundayOfMonth(year, 9);

  return {
    spring: new Date(Date.UTC(year, 2, springDay, 1, 0, 0, 0)),
    fall: new Date(Date.UTC(year, 9, fallDay, 1, 0, 0, 0)),
  };
}

export function isMissingHour(date: Date): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const parts = getLocalParts(date);
  const candidates = findMatchingCandidates(parts);

  return candidates.length === 0;
}

export function isAmbiguousHour(date: Date): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const parts = getLocalParts(date);
  const candidates = findMatchingCandidates(parts);

  return candidates.length > 1;
}

export function normalizeForStorage(date: Date): Date {
  if (!isValidDate(date)) {
    return new Date(Number.NaN);
  }

  const parts = getLocalParts(date);
  const candidates = findMatchingCandidates(parts);

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    return candidateFromLocal(parts, CEST_OFFSET_MINUTES);
  }

  const adjustedParts: LocalParts = {
    ...parts,
    hour: 3,
    minute: 0,
    second: 0,
    millisecond: 0,
  };

  return candidateFromLocal(adjustedParts, CEST_OFFSET_MINUTES);
}
