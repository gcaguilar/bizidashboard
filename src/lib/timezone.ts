export const TIMEZONE = "Europe/Madrid";

const OFFSET_CET_MINUTES = 60;
const OFFSET_CEST_MINUTES = 120;

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

const offsetFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  timeZoneName: "shortOffset",
  hour: "2-digit",
  minute: "2-digit",
});

type NullableDate = Date | null | undefined;

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const padOffset = (value: number): string => String(Math.abs(value)).padStart(2, "0");

const formatOffset = (offsetMinutes: number): string => {
  if (!Number.isFinite(offsetMinutes)) {
    return "";
  }

  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = Math.trunc(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;

  return `${sign}${padOffset(hours)}:${padOffset(minutes)}`;
};

const parseOffsetMinutes = (value: string): number => {
  const match = value.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);

  if (!match) {
    return Number.NaN;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = match[3] ? Number.parseInt(match[3], 10) : 0;

  return sign * (hours * 60 + minutes);
};

const getEuropeMadridParts = (date: Date): Intl.DateTimeFormatPart[] =>
  dateTimeFormatter.formatToParts(date);

const getPart = (parts: Intl.DateTimeFormatPart[], type: string): string =>
  parts.find((part) => part.type === type)?.value ?? "";

const formatDateTime = (date: Date): string => {
  const parts = getEuropeMadridParts(date);
  const year = getPart(parts, "year");
  const month = getPart(parts, "month");
  const day = getPart(parts, "day");
  const hour = getPart(parts, "hour");
  const minute = getPart(parts, "minute");
  const second = getPart(parts, "second");

  if (!year || !month || !day || !hour || !minute || !second) {
    return "";
  }

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const getOffsetFromFormatter = (date: Date): number => {
  const parts = offsetFormatter.formatToParts(date);
  const tzName = getPart(parts, "timeZoneName");
  return parseOffsetMinutes(tzName);
};

const getAbbreviation = (offsetMinutes: number): string => {
  if (offsetMinutes === OFFSET_CET_MINUTES) {
    return "CET";
  }

  if (offsetMinutes === OFFSET_CEST_MINUTES) {
    return "CEST";
  }

  return "";
};

export function toUTC(date: NullableDate): Date {
  if (!date || !isValidDate(date)) {
    return new Date(Number.NaN);
  }

  return new Date(date.toISOString());
}

export function toEuropeMadrid(date: NullableDate): string {
  if (!date || !isValidDate(date)) {
    return "Invalid date";
  }

  const offsetMinutes = getEuropeMadridOffset(date);
  const offset = formatOffset(offsetMinutes);
  const abbreviation = getAbbreviation(offsetMinutes);
  const formatted = formatDateTime(date);

  if (!formatted) {
    return "Invalid date";
  }

  const offsetSuffix = offset ? ` (${offset})` : "";
  const zoneSuffix = abbreviation ? ` ${abbreviation}` : "";

  return `${formatted}${zoneSuffix}${offsetSuffix}`.trim();
}

export function getEuropeMadridOffset(date: NullableDate): number {
  if (!date || !isValidDate(date)) {
    return Number.NaN;
  }

  return getOffsetFromFormatter(date);
}

export function isDST(date: NullableDate): boolean {
  return getEuropeMadridOffset(date) === OFFSET_CEST_MINUTES;
}
