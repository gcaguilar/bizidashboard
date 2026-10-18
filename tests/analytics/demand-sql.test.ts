import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { Prisma } from '@/generated/prisma/client';
import {
  avgDemand,
  coalesceSumDemand,
  demandPerRow,
  sumDemand,
} from '@/analytics/queries/demand-sql';

const flat = (value: string) => value.replace(/\s+/g, ' ').trim();

const DEMAND_DIFFERENCE = /"bikesMax"\s*-\s*(?:"[^"]+"\.)?"bikesMin"/;

const DEMAND_CONSUMERS = [
  'src/analytics/queries/read.ts',
  'src/analytics/queries/rankings.ts',
  'src/analytics/queries/rebalancing.ts',
  'src/analytics/queries/monthly-report.ts',
  'src/lib/mobility-conclusions.ts',
  'src/lib/comparison-hub.ts',
];

describe('station demand SQL seam', () => {
  it('defines the per-row difference once', () => {
    expect(flat(demandPerRow().sql)).toBe(
      '("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")'
    );
  });

  it('qualifies every column when a table alias is given', () => {
    expect(flat(demandPerRow('DailyStationStat').sql)).toBe(
      '("DailyStationStat"."bikesMax" - "DailyStationStat"."bikesMin") + ("DailyStationStat"."anchorsMax" - "DailyStationStat"."anchorsMin")'
    );
  });

  it('exposes the aggregates the queries compose', () => {
    expect(flat(sumDemand().sql)).toBe(
      'SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin"))'
    );
    expect(flat(coalesceSumDemand().sql)).toBe(
      'COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0)'
    );
    expect(flat(avgDemand('DailyStationStat').sql)).toBe(
      'AVG(("DailyStationStat"."bikesMax" - "DailyStationStat"."bikesMin") + ("DailyStationStat"."anchorsMax" - "DailyStationStat"."anchorsMin"))'
    );
  });

  it('nests into a larger statement as raw SQL, not parameters', () => {
    const statement = Prisma.sql`SELECT ${sumDemand()} AS "demandScore"`;

    expect(flat(statement.sql)).toBe(
      'SELECT SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore"'
    );
    expect(statement.values).toEqual([]);
  });

  it('keeps the difference out of every consuming query', () => {
    for (const file of DEMAND_CONSUMERS) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');

      expect(DEMAND_DIFFERENCE.test(source), `${file} re-inlined the demand difference`).toBe(false);
    }
  });
});
