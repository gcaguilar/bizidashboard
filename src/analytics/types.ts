export enum DayType {
  WEEKDAY = "WEEKDAY",
  WEEKEND = "WEEKEND",
}

export enum AlertType {
  LOW_BIKES = "LOW_BIKES",
  LOW_ANCHORS = "LOW_ANCHORS",
}

export const ALERT_THRESHOLDS = {
  lowBikes: 5,
  lowAnchors: 3,
} as const;

export const ANALYTICS_WINDOWS = {
  rankingDays: 14,
  alertWindowHours: 3,
} as const;

export const ROLLUP_CUTOFFS = {
  hourlyDelayMinutes: 10,
  dailyDelayMinutes: 90,
} as const;
