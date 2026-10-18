import { describe, expect, it } from 'vitest';
import { detectServiceAnomalies } from '@/lib/service-anomalies';

function monday(day: string, demandScore: number, sampleCount = 24) {
  return { day, demandScore, sampleCount };
}

describe('detectServiceAnomalies', () => {
  it('flags an outlier day against its weekday baseline and keeps the direction', () => {
    const rows = [
      monday('2026-01-05', 90),
      monday('2026-01-12', 100),
      monday('2026-01-19', 110),
      monday('2026-01-26', 400),
    ];

    const anomalies = detectServiceAnomalies(rows);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.day).toBe('2026-01-26');
    expect(anomalies[0]?.direction).toBe('up');
    expect(anomalies[0]?.cause).toBeNull();
    expect(anomalies[0]?.deviationRatio).toBeGreaterThan(1);
  });

  it('attaches a curated cause when the anomalous day is a known holiday', () => {
    const rows = [
      monday('2026-03-06', 100),
      monday('2026-03-13', 100),
      monday('2026-03-20', 100),
      monday('2026-04-03', 400),
    ];

    const anomalies = detectServiceAnomalies(rows);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.day).toBe('2026-04-03');
    expect(anomalies[0]?.cause).toEqual({ kind: 'holiday', label: 'Viernes Santo' });
  });

  it('flags unusually low days as downward anomalies', () => {
    const rows = [
      monday('2026-01-05', 300),
      monday('2026-01-12', 320),
      monday('2026-01-19', 310),
      monday('2026-01-26', 40),
    ];

    const anomalies = detectServiceAnomalies(rows);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.day).toBe('2026-01-26');
    expect(anomalies[0]?.direction).toBe('down');
  });

  it('ignores stable series and rows without samples', () => {
    expect(
      detectServiceAnomalies([
        monday('2026-01-05', 200),
        monday('2026-01-12', 200),
        monday('2026-01-19', 200),
        monday('2026-01-26', 200),
      ])
    ).toHaveLength(0);

    expect(
      detectServiceAnomalies([
        monday('2026-02-02', 100),
        monday('2026-02-09', 100),
        monday('2026-02-16', 100),
        monday('2026-02-23', 1000, 0),
      ])
    ).toHaveLength(0);
  });

  it('requires a minimum amount of data to analyse', () => {
    expect(
      detectServiceAnomalies([monday('2026-01-05', 10), monday('2026-01-12', 999)])
    ).toHaveLength(0);
  });
});
