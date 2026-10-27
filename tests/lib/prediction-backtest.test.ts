import { describe, expect, it } from 'vitest';
import {
  MIN_BACKTEST_SAMPLES,
  isBacktestReliable,
  runStationBacktest,
  type BacktestSnapshot,
} from '@/lib/prediction-backtest';
import {
  applyBacktestCalibration,
  estimateRecentTrend,
  estimateStationPredictions,
} from '@/lib/predictions';

const patterns = ['WEEKDAY', 'WEEKEND'].flatMap((dayType) =>
  Array.from({ length: 24 }, (_, hour) => ({
    dayType,
    hour,
    bikesAvg: 10,
    anchorsAvg: 10,
    occupancyAvg: 0.5,
    sampleCount: 40,
  }))
);

function series(days: number, bikesAt: (i: number) => number): BacktestSnapshot[] {
  const start = Date.parse('2026-03-02T00:00:00Z');
  const n = (days * 24 * 60) / 5;
  return Array.from({ length: n }, (_, i) => ({
    recordedAt: new Date(start + i * 5 * 60_000),
    bikesAvailable: bikesAt(i),
  }));
}

const base = { stationId: '1', capacity: 20, patterns, predict: estimateStationPredictions };

describe('runStationBacktest', () => {
  it('gives zero error and 100 % hits on a perfectly stable station', () => {
    const result = runStationBacktest({ ...base, snapshots: series(3, () => 10) });
    for (const h of result.horizons) {
      expect(h.sampleCount).toBeGreaterThanOrEqual(MIN_BACKTEST_SAMPLES);
      expect(h.mae).toBe(0);
      expect(h.hitRateWithin1).toBe(1);
      expect(h.hitRateWithinRange).toBe(1);
      expect(h.rangeHalfWidth).toBe(1);
    }
  });

  it('measures larger error and a wider range on a volatile station', () => {
    const volatile = series(3, (i) => 10 + Math.round(8 * Math.sin(i * 0.9)));
    const [h30] = runStationBacktest({ ...base, snapshots: volatile }).horizons;
    expect(h30.mae).toBeGreaterThan(2);
    expect(h30.hitRateWithin1).toBeLessThan(0.6);
    expect(h30.rangeHalfWidth).toBeGreaterThan(1);
    expect(h30.hitRateWithinRange).toBeGreaterThanOrEqual(0.8);
  });

  it('returns empty metrics without history or patterns', () => {
    const none = runStationBacktest({ ...base, snapshots: [] });
    expect(none.horizons.every((h) => h.sampleCount === 0)).toBe(true);
    const noPatterns = runStationBacktest({ ...base, patterns: [], snapshots: series(1, () => 10) });
    expect(noPatterns.horizons.every((h) => h.sampleCount === 0)).toBe(true);
  });

  it('discards origins whose target has no nearby observation (gaps)', () => {
    const gappy = series(3, () => 10).filter((_, i) => i % 40 < 3);
    const [h30] = runStationBacktest({ ...base, snapshots: gappy }).horizons;
    expect(h30.sampleCount).toBe(0);
    expect(isBacktestReliable(h30)).toBe(false);
  });
});

describe('applyBacktestCalibration', () => {
  const now = new Date('2026-03-10T07:00:00Z');
  const raw = estimateStationPredictions(
    { stationId: '1', capacity: 20, bikesAvailable: 10, anchorsFree: 10, patterns },
    now
  );

  it('replaces confidence and adds range/accuracy only with enough samples', () => {
    const stable = runStationBacktest({ ...base, snapshots: series(3, () => 10) });
    const calibrated = applyBacktestCalibration(raw, stable);
    expect(calibrated.predictions[0].confidence).toBe(0.95);
    expect(calibrated.predictions[0].rangeHalfWidth).toBe(1);
    expect(calibrated.predictions[0].backtest?.hitRateWithin1).toBe(1);

    const thin = runStationBacktest({ ...base, snapshots: series(3, () => 10).slice(0, 20) });
    expect(applyBacktestCalibration(raw, thin)).toEqual(raw);
    expect(applyBacktestCalibration(raw, null)).toBe(raw);
  });
});

describe('trend and holidays', () => {
  const now = new Date('2026-03-10T07:00:00Z');
  const ctx = { stationId: '1', capacity: 20, bikesAvailable: 10, anchorsFree: 10, patterns };

  it('ignores trend without enough recent samples', () => {
    const two = [
      { recordedAt: new Date(now.getTime() - 10 * 60_000), bikesAvailable: 14 },
      { recordedAt: now, bikesAvailable: 10 },
    ];
    expect(estimateRecentTrend(two, now)).toBeNull();
    expect(estimateRecentTrend(undefined, now)).toBeNull();
  });

  it('pushes the prediction along a falling trend', () => {
    const falling = [0, 5, 10, 15].map((m, i) => ({
      recordedAt: new Date(now.getTime() - (15 - m) * 60_000),
      bikesAvailable: 14 - i,
    }));
    expect(estimateRecentTrend(falling, now)).toBeLessThan(0);
    const flat = estimateStationPredictions(ctx, now).predictions[0].predictedBikesAvailable!;
    const withTrend = estimateStationPredictions({ ...ctx, recentSamples: falling }, now)
      .predictions[0].predictedBikesAvailable!;
    expect(withTrend).toBeLessThan(flat);
  });

  it('uses the weekend pattern on a weekday holiday', () => {
    // 2026-05-01 es viernes y festivo (Día del Trabajo).
    const weekendHigh = patterns.map((p) =>
      p.dayType === 'WEEKEND' ? { ...p, occupancyAvg: p.hour >= 10 ? 0.9 : 0.1 } : p
    );
    const holiday = new Date('2026-05-01T07:30:00Z');
    const workday = new Date('2026-05-04T07:30:00Z');
    const lowCtx = { ...ctx, bikesAvailable: 2, anchorsFree: 18, patterns: weekendHigh };
    const h = estimateStationPredictions(lowCtx, holiday).predictions[1].predictedBikesAvailable!;
    const w = estimateStationPredictions(lowCtx, workday).predictions[1].predictedBikesAvailable!;
    expect(h).toBeGreaterThan(w);
  });
});
